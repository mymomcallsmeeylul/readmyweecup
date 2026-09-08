/**
 * POST /api/read — the pipeline.
 *
 *   seeker -> Fortune Teller -> Eye -> Searcher -> Fortune Teller -> seeker
 *
 * Three model calls. The five-role design is intact and is still the spec, but
 * the Context Queen and the Fairy execute as sections of the Fortune Teller's
 * single prompt rather than as calls of their own, because five sequential
 * calls do not fit inside the function's ceiling.
 *
 * Body:   {
 *           images:   ["data:image/jpeg;base64,...", ...],  // 1 to 4, one cup
 *           topic:    "love" | "career" | "general" | "friendships"
 *                     | "health" | "money",
 *           note:     "free text from the seeker",          // optional
 *           language: "Turkish"                             // optional
 *         }
 *
 * The API key never leaves this function. The browser talks to this endpoint
 * and nothing else, which is the entire reason the endpoint exists.
 *
 * Everything the seeker typed is untrusted. Every agent that sees it receives
 * it delimited and labelled as context rather than instruction (see
 * api/_house.js).
 */

import { FOCUS_KEYS, cleanNote } from './_house.js';
import { Deadline, AgentError } from './_client.js';
import { look } from './_agents/eye.js';
import { search } from './_agents/searcher.js';
import { triage, tell, UNREADABLE_LINES } from './_agents/fortune-teller.js';
import { pickSampleReading } from './_readings.js';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 9 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * The whole pipeline's wall clock. Three calls against Vercel's 60s ceiling,
 * so the budget is held here and handed down: each stage asks what it may
 * spend rather than the last one being starved by the first.
 */
const PIPELINE_MS = Number(process.env.PIPELINE_BUDGET_MS || 50_000);

/**
 * What each stage may spend, and what it owes the stages behind it.
 *
 * Three sequential model calls against a 60s function ceiling. It was five,
 * and five did not fit: the Context Queen and the Fairy now run as sections of
 * the Fortune Teller's single prompt rather than as calls of their own, which
 * is what bought the room for everything below.
 *
 * The reserve is the sum of the REQUIRED stages that still have to run. The
 * Searcher is absent from every reserve on purpose: it degrades to the bundled
 * dictionary, so it is not allowed to reserve time away from a stage that
 * cannot degrade at all. A stage offered less than its floor is skipped or
 * fails at once, instead of spending the budget to find out it never had
 * enough.
 */
export const STAGES = {
  // Three shapes with a short detail each, plus one line on the whole cup, at
  // medium effort. Raised from 12s when the Eye went from low to medium:
  // looking properly is what stops two cups reading the same, and it is worth
  // three seconds of the Fortune Teller's headroom.
  eye: { cap: 15_000, required: true },
  // Degrades to the bundled dictionary, so it reserves nothing from anyone.
  searcher: { cap: 18_000, required: false },
  // Narrows, warms and narrates, so it gets by far the largest share.
  fortuneTeller: { cap: 30_000, required: true },
};

/**
 * What each stage owes the ones behind it: the caps of the required stages
 * still to run, in pipeline order.
 *
 * Derived rather than written out. It was written out, and a hand-kept mirror
 * of the table one line above it is a table that eventually disagrees with it,
 * silently, in the direction of a stage being starved.
 */
export const RESERVE = Object.fromEntries(
  Object.keys(STAGES).map((stage, i, order) => [
    stage,
    order.slice(i + 1).reduce((owed, l) => owed + (STAGES[l].required ? STAGES[l].cap : 0), 0),
  ]),
);

/**
 * Best-effort throttle. Serverless instances are recycled constantly, so this
 * catches an enthusiastic tab, not a determined attacker. Put a real limiter in
 * front of the deployment if you expose it widely.
 */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 15;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const seen = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  seen.push(now);
  hits.set(ip, seen);
  if (hits.size > 5000) hits.clear();
  return seen.length > RATE_MAX;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, null);
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return send(res, 413, { error: 'image_too_large' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (rateLimited(ip)) {
    return send(res, 429, {
      error: 'too_many_cups',
      omen: 'Too many cups',
      note: 'You have had enough coffee for one sitting. Come back when the pot is cold.',
    });
  }

  // `image` (singular) is still accepted so an older client keeps working.
  const raw = Array.isArray(body?.images) ? body.images : body?.image ? [body.image] : [];
  const parsed = parseImages(raw);
  if (!parsed.ok) return send(res, 400, { error: parsed.error });

  const focus = FOCUS_KEYS.includes(body?.topic) ? body.topic : 'general';
  const note = cleanNote(body?.note);
  const language = languageName(body?.language);

  // No key configured: hand back a reference reading so a fresh clone still
  // gives you the whole experience. The client labels this honestly.
  if (!process.env.ANTHROPIC_API_KEY) {
    await pause(1200 + Math.random() * 900);
    return send(res, 200, {
      ...pickSampleReading(),
      readable: true,
      demo: true,
      focus,
      sources: [],
    });
  }

  const deadline = new Deadline(PIPELINE_MS);

  try {
    const result = await readTheCup({ images: parsed.images, focus, note, language, deadline });
    return send(res, 200, result);
  } catch (err) {
    const overloaded = err?.status === 429 || err?.status === 529;
    console.error(
      '[destiny]',
      err instanceof AgentError ? err.agent : 'pipeline',
      'failed after',
      `${deadline.elapsed}ms:`,
      err?.message || err,
    );
    return send(res, overloaded ? 503 : 502, {
      error: 'reading_failed',
      omen: 'The cup went quiet',
      note: 'Something between here and the grounds stopped speaking. This is not your fortune, it is mine. Try the cup again in a moment.',
    });
  }
}

/* ---------------------------------------------------------------- pipeline */

async function readTheCup({ images, focus, note, language, deadline }) {
  // One line per stage, on the way out either way. Latency is the one thing
  // the tests cannot cover, and a reading that dies at 50s tells you nothing
  // about which stage spent them. It is a finally so the failure path gets it
  // too, that being the path which needs it most.
  const timings = [];
  const timed = async (name, run) => {
    const at = deadline.elapsed;
    try {
      return await run();
    } finally {
      timings.push(`${name} ${deadline.elapsed - at}ms`);
    }
  };
  const budgetFor = (stage) => deadline.budget(STAGES[stage].cap, RESERVE[stage]);

  try {
    // The Fortune Teller's first act is to check on the person, not the cup.
    // Run alongside the Eye so care costs nothing in wall-clock time.
    const [care, eye] = await timed('eye+triage', () =>
      Promise.all([
        triage(note, { deadline }),
        look(images, { deadline, budgetMs: budgetFor('eye') }),
      ]),
    );

    // What the Eye actually saw: the only thing that varies between two
    // seekers, and the thing we could not check when two cups came back with
    // the same reading. Logged before the readable check, because an empty cup
    // is exactly when you want to know whether it found nothing or found only
    // decoration. Shape names, places and its one-line impression: never the
    // photograph, and never a word the seeker typed.
    console.info(
      '[destiny] eye saw:',
      eye.shapes.map((s) => `${s.name}@${s.region}`).join(', ') || 'no shapes',
      eye.impression ? `| ${eye.impression}` : '',
    );

    if (care.distress) {
      return {
        readable: false,
        demo: false,
        care: true,
        omen: 'Not tonight',
        note: care.reply,
        hint: '',
      };
    }

    if (!eye.is_cup || !eye.legible) {
      return {
        readable: false,
        demo: false,
        ...(eye.is_cup ? UNREADABLE_LINES.illegible : UNREADABLE_LINES.not_a_cup),
      };
    }

    const found = await timed('searcher', () =>
      search(eye.shapes, { language, deadline, budgetMs: budgetFor('searcher') }),
    );

    // Narrowing, warmth and narration in one call. They were three, and three
    // sequential calls could not fit inside the ceiling.
    const reading = await timed('fortune-teller', () =>
      tell({
        shapes: eye.shapes,
        meanings: found.meanings,
        impression: eye.impression,
        focus,
        note,
        language,
        deadline,
        budgetMs: budgetFor('fortuneTeller'),
      }),
    );

    return {
      readable: true,
      demo: false,
      focus,
      omen: reading.title,
      // The share card prints these regions along its foot, and that is the
      // whole consumer: the shape and the place, nothing else.
      symbols: reading.themes.map((theme) => ({
        shape: theme.shapes.join(' and ') || theme.title,
        region: theme.regions[0] || '',
      })),
      reading: reading.reading,
      closing: reading.closing,
      // Provenance. The Searcher's work is only worth something if the seeker
      // can see which of it was actually sourced.
      sources: found.sources,
    };
  } finally {
    console.info(`[destiny] ${deadline.elapsed}ms · ${timings.join(' · ')}`);
  }
}

/* ------------------------------------------------------------------ shared */

/**
 * The client sends a BCP-47 tag. The Fortune Teller is told to answer in the
 * seeker's language, and a language name reads better in a prompt than "tr-TR".
 */
function languageName(tag) {
  const clean = String(tag || '').trim().slice(0, 35);
  if (!clean) return 'English';
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(clean);
    return name && name !== clean ? name : 'English';
  } catch {
    return 'English';
  }
}

function parseImages(list) {
  if (!Array.isArray(list) || list.length === 0) return { ok: false, error: 'no_image' };
  if (list.length > MAX_IMAGES) return { ok: false, error: 'too_many_images' };

  const images = [];
  let total = 0;

  for (const dataUrl of list) {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return { ok: false, error: 'bad_image' };
    }
    const match = /^data:([\w/+.-]+);base64,(.+)$/s.exec(dataUrl);
    if (!match) return { ok: false, error: 'bad_image' };

    const [, media, data] = match;
    if (!ALLOWED_MEDIA.has(media)) return { ok: false, error: 'unsupported_format' };

    const bytes = data.length * 0.75;
    if (bytes > MAX_IMAGE_BYTES) return { ok: false, error: 'image_too_large' };
    total += bytes;
    if (total > MAX_TOTAL_BYTES) return { ok: false, error: 'image_too_large' };

    images.push({ media, data });
  }

  return { ok: true, images };
}

/** Works on Vercel (body already parsed) and on the local dev server (a stream). */
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return safeParse(req.body);

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_TOTAL_BYTES * 1.5) throw new Error('body too large');
    chunks.push(chunk);
  }
  return safeParse(Buffer.concat(chunks).toString('utf8'));
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('cache-control', 'no-store');
  if (payload === null) return res.end();
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
