/**
 * POST /api/read — the pipeline.
 *
 *   seeker -> Fortune Teller -> Eye -> Searcher -> Context Queen -> Fairy
 *          -> Fortune Teller -> seeker
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
 * Everything the seeker typed is untrusted. It reaches four agents, and each
 * of them receives it delimited and labelled as context rather than
 * instruction (see api/_house.js).
 */

import { FOCUS_KEYS, cleanNote } from './_house.js';
import { Deadline, AgentError } from './_client.js';
import { look } from './_agents/eye.js';
import { search } from './_agents/searcher.js';
import { narrow } from './_agents/context-queen.js';
import { brighten } from './_agents/fairy.js';
import { triage, tell, UNREADABLE_LINES } from './_agents/fortune-teller.js';
import { pickSampleReading } from './_readings.js';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 9 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * The whole pipeline's wall clock. Five agents against Vercel's 60s ceiling,
 * so the budget is held here and handed down: each stage asks what is left and
 * degrades on purpose rather than the last one being starved by the first.
 */
const PIPELINE_MS = Number(process.env.PIPELINE_BUDGET_MS || 50_000);

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
      topic: focus,
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
  // The Fortune Teller's first act is to check on the person, not the cup.
  // Run alongside the Eye so care costs nothing in wall-clock time.
  const [care, eye] = await Promise.all([
    triage(note, { deadline }),
    look(images, { deadline }),
  ]);

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
    // The Eye's own sentence is a diagnostic, not a voice. It goes to the log;
    // what the seeker hears is the Fortune Teller's, because the Fortune
    // Teller is the only agent that ever speaks to them.
    if (eye.reason) console.info('[destiny] eye:', eye.reason);
    return {
      readable: false,
      demo: false,
      reason: eye.is_cup ? 'illegible' : 'not_a_cup',
      ...(eye.is_cup ? UNREADABLE_LINES.illegible : UNREADABLE_LINES.not_a_cup),
    };
  }

  const found = await search(eye.shapes, { language, deadline });

  const themes = await narrow({
    shapes: eye.shapes,
    meanings: found.meanings,
    impression: eye.impression,
    focus,
    note,
    deadline,
  });

  const warmth = await brighten({ themes, focus, note, deadline });

  const reading = await tell({
    themes,
    warmth,
    focus,
    note,
    impression: eye.impression,
    language,
    deadline,
  });

  return {
    readable: true,
    demo: false,
    topic: focus,
    focus,
    omen: reading.title,
    symbols: themes.map((theme) => ({
      shape: theme.shapes.join(' and ') || theme.title,
      region: theme.regions[0] || '',
      meaning: theme.angle,
    })),
    reading: reading.reading,
    closing: reading.closing,
    // Provenance. The Searcher's work is only worth something if the seeker
    // can see which of it was actually sourced.
    sources: found.sources,
    agreement: summarise(found.meanings),
    elapsedMs: deadline.elapsed,
  };
}

/** One word for how well the dictionaries agreed, or how little they were used. */
function summarise(meanings) {
  if (meanings.length === 0) return 'none';
  const levels = meanings.map((m) => m.agreement);
  if (levels.every((l) => l === 'general' || l === 'unknown')) return 'general';
  if (levels.includes('low')) return 'low';
  if (levels.includes('mixed')) return 'mixed';
  return 'high';
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
