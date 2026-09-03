import { VISION_SYSTEM, visionUser, VOICE_SYSTEM, voiceUser, TOPICS } from './_prompts.js';
import { pickSampleReading, pickUnreadable } from './_readings.js';

/**
 * POST /api/read
 *
 * Body:   {
 *           images: ["data:image/jpeg;base64,...", ...],  // 1 to 4, one cup
 *           topic:  "love" | "career" | "general",        // optional
 *           note:   "free text from the drinker"          // optional
 *         }
 * Returns: a reading, or an in-voice explanation of why the cup could not be read.
 *
 * The API key never leaves this function. The client only ever talks to this
 * endpoint, which is the entire reason the endpoint exists.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const VISION_MODEL = process.env.VISION_MODEL || 'claude-sonnet-5';
const VOICE_MODEL = process.env.VOICE_MODEL || 'claude-sonnet-5';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 9 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(['image/jpeg', 'image/png', 'image/webp']);
const NOTE_MAX = 400;
const REQUEST_TIMEOUT_MS = 55_000;

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

  const topic = TOPICS[body?.topic] ? body.topic : 'general';
  const note = String(body?.note || '').trim().slice(0, NOTE_MAX);

  // No key configured: hand back a reference reading so a fresh clone still
  // gives you the full experience. The client labels this honestly.
  if (!process.env.ANTHROPIC_API_KEY) {
    await pause(1200 + Math.random() * 900);
    return send(res, 200, { ...pickSampleReading(), readable: true, demo: true, topic });
  }

  try {
    const vision = await look(parsed.images);

    if (!vision.is_cup || vision.legible === false) {
      return send(res, 200, {
        readable: false,
        demo: false,
        ...pickUnreadable(),
        reason: vision.is_cup ? 'illegible' : 'not_a_cup',
      });
    }

    const reading = await speak(vision, { topic, note });
    return send(res, 200, { ...reading, readable: true, demo: false, topic });
  } catch (err) {
    const overloaded = err?.status === 429 || err?.status === 529;
    console.error('[destiny] reading failed:', err?.status || '', err?.message || err);
    return send(res, overloaded ? 503 : 502, {
      error: 'reading_failed',
      omen: 'The cup went quiet',
      note: 'Something between here and the grounds stopped speaking. This is not your fortune, it is mine. Try the cup again in a moment.',
    });
  }
}

/* ---------------------------------------------------------------- layer one */

async function look(images) {
  const content = images.map(({ media, data }) => ({
    type: 'image',
    source: { type: 'base64', media_type: media, data },
  }));
  content.push({ type: 'text', text: visionUser(images.length) });

  const raw = await anthropic({
    model: VISION_MODEL,
    max_tokens: 900,
    temperature: 1,
    system: VISION_SYSTEM,
    messages: [
      { role: 'user', content },
      // Prefilling the opening brace keeps the model inside JSON.
      { role: 'assistant', content: '{' },
    ],
  });

  const vision = parseJson('{' + raw);
  if (!vision || typeof vision !== 'object') throw new Error('vision returned no JSON');

  vision.impressions = Array.isArray(vision.impressions) ? vision.impressions.slice(0, 5) : [];
  if (vision.is_cup && vision.impressions.length === 0) vision.legible = false;
  return vision;
}

/* ---------------------------------------------------------------- layer two */

async function speak(vision, context) {
  const raw = await anthropic({
    model: VOICE_MODEL,
    max_tokens: 1200,
    temperature: 1,
    system: VOICE_SYSTEM,
    messages: [
      { role: 'user', content: voiceUser(vision, context) },
      { role: 'assistant', content: '{' },
    ],
  });

  const reading = normalise(parseJson('{' + raw));
  if (!reading) throw new Error('voice returned an unusable reading');
  return reading;
}

/**
 * The reveal is staged around a fixed shape, so anything that does not fit the
 * shape is not shippable. Better to fail than to render a broken poem.
 */
function normalise(r) {
  if (!r || typeof r !== 'object') return null;

  const omen = str(r.omen);
  const closing = str(r.closing);
  const reading = Array.isArray(r.reading) ? r.reading.map(str).filter(Boolean).slice(0, 3) : [];
  const symbols = (Array.isArray(r.symbols) ? r.symbols : [])
    .map((s) => ({
      shape: str(s?.shape),
      region: str(s?.region).toLowerCase(),
      meaning: str(s?.meaning),
    }))
    .filter((s) => s.shape && s.meaning)
    .slice(0, 3);

  if (!omen || !closing || reading.length < 2 || symbols.length < 2) return null;
  return { omen, symbols, reading, closing };
}

/* ------------------------------------------------------------------- shared */

async function anthropic(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const err = new Error(`anthropic ${res.status}: ${detail.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }

    const json = await res.json();
    return (json.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text) {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Models occasionally trail a sentence after the object. Take the object.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
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

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
