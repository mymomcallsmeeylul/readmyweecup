/**
 * AGENT 02 · THE EYE — the reader of shapes.
 *
 * Card: perception layer. Looks at the photographs and says what is in the
 * grounds. Honest perception, no interpretation. Does not look up meanings,
 * does not choose themes, does not speak to the seeker.
 * Knowledge: KB-02.
 *
 * The Eye is the one agent allowed to be uncertain out loud. Every other agent
 * downstream reads its confidence numbers, and a reading built on a shape the
 * Eye was barely sure of should be a reading that leans on it lightly. That is
 * the opposite of a hedge: it is the honesty that lets the Fortune Teller
 * commit to the shapes that are actually there.
 */

import { HOUSE_RULES, CUP_GEOGRAPHY, REGION_KEYS } from '../_house.js';
import { ask, parseAnswer, MODELS, str } from '../_client.js';

const VOCABULARY = `
Prefer these names, and give the Turkish term, so the Searcher can match a
shape to its entry in the dictionaries. They index by the Turkish word:

  bird / kuş          fish / balık        snake / yılan
  horse / at          heart / kalp        ring / yüzük
  key / anahtar       eye / göz           road or path / yol
  straight line / düz çizgi               wavy or broken line / dalgalı çizgi

If a shape is not on this list, name it plainly and give the Turkish term if
you know it. Leave the Turkish empty rather than guessing at one.
`.trim();

export const EYE_SYSTEM = `
You are the Eye of Destiny: the part that looks into the cup.

You are shown one to four photographs of the inside of a single drained
Turkish coffee cup. When there is more than one, they are the SAME cup from
different angles or distances. Read them together as one cup. If two
photographs show the same mark, name it once.

${HOUSE_RULES}

${CUP_GEOGRAPHY}

HOW TO LOOK

Coffee grounds are abstract. Interpret loosely and honestly. Report only what
is actually visible and give a confidence for each shape, from 0 to 1. Never
invent detail to fill the cup out, and never force a count. Two or three clear
shapes is a full reading, not a thin one. Three is the most you may return.

Tag every shape with the region it sits in. Where it sits is half of what it
will come to mean, so place it carefully.

${VOCABULARY}

JUDGING THE PHOTOGRAPHS

If none of them show the inside of a cup, set is_cup false and return no
shapes. If they are cups but you genuinely cannot make anything out, because
the cup is still full, or near-black, or hopelessly blurred, set is_cup true
and return no shapes.

Otherwise return what you see. Dim, awkward, half-lit cups are still readable.
Ambiguity is the medium, not a failure.

BE TERSE

Return the four fields and nothing else: name, turkish, region, confidence. No
explanation of why a shape reads that way, no overall impression of the cup,
no prose of any kind. You are the first of three calls and the reading has one
budget between them, so every word you spend is a word the Fortune Teller does
not get.

You do not interpret, narrate or reassure. You do not speak to the seeker. You
return data.
`.trim();

/**
 * Four fields, exactly as Agent 02 specifies, and no more. The note and the
 * points_to that used to live here were prose, and prose is what made this
 * call slow: it is the first thing in the chain, so every token it spends is
 * a token the Fortune Teller does not get.
 */
const SHAPE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Plain English name, e.g. "a bird, caught mid-turn"' },
    turkish: { type: 'string', description: 'Turkish term, or "" if not known' },
    region: { type: 'string', enum: REGION_KEYS },
    confidence: { type: 'number' },
  },
  required: ['name', 'turkish', 'region', 'confidence'],
  additionalProperties: false,
};

export const EYE_SCHEMA = {
  type: 'object',
  properties: {
    // The one field kept beyond the shape list, and it is a boolean rather
    // than prose. An empty list means unreadable, but a photograph of a dog
    // and a photograph of a cup too dark to read want different answers, and
    // the seeker is the one who has to act on which it was.
    is_cup: { type: 'boolean' },
    shapes: { type: 'array', items: SHAPE_SCHEMA },
  },
  required: ['is_cup', 'shapes'],
  additionalProperties: false,
};

/** Agent 02: at most three. Two or three clear shapes is a full reading. */
export const MAX_SHAPES = 3;

/** Look into the cup. `images` is 1 to 4 photographs of one cup. */
export async function look(images, { deadline, budgetMs } = {}) {
  const content = images.map(({ media, data }) => ({
    type: 'image',
    source: { type: 'base64', media_type: media, data },
  }));

  content.push({
    type: 'text',
    text:
      images.length > 1
        ? `Here is the cup, in ${images.length} photographs. Look into it and tell me what is there.`
        : 'Here is the cup. Look into it and tell me what is there.',
  });

  const { text } = await ask({
    agent: 'eye',
    model: MODELS.eye,
    system: EYE_SYSTEM,
    content,
    schema: EYE_SCHEMA,
    // Agent 02 asks for a low ceiling so this call does not eat the shared
    // budget, and three shapes of four short fields is barely 200 tokens. The
    // ceiling is not set at 200, though: thinking is on by default on this
    // model and is billed against max_tokens, so a ceiling sized to the answer
    // truncates the JSON instead of trimming the thinking. This is low enough
    // to matter and high enough to finish.
    maxTokens: 1200,
    // Perception, not reasoning. The Eye names what is visible and places it;
    // it does not weigh anything up. At the default effort this call was the
    // single slowest stage in the pipeline and timed out at 25s, which starved
    // everything behind it. Low is the setting this job actually wants.
    effort: 'low',
    timeoutMs: budgetMs || (deadline ? deadline.slice(20_000) : 20_000),
  });

  return normalise(parseAnswer('eye', text));
}

/**
 * The Eye is the only agent whose output nobody else can sanity-check, so it
 * is checked here. A cup that is "legible" with nothing in it is not legible,
 * whatever the model said.
 */
function normalise(raw) {
  const shapes = (Array.isArray(raw?.shapes) ? raw.shapes : [])
    .map((s) => ({
      name: str(s?.name),
      turkish: str(s?.turkish),
      region: REGION_KEYS.includes(s?.region) ? s.region : 'middle',
      confidence: clamp(s?.confidence),
    }))
    .filter((s) => s.name)
    .slice(0, MAX_SHAPES);

  const isCup = raw?.is_cup !== false;

  // An empty list is the unreadable signal, per Agent 02. There is no separate
  // legible flag to disagree with it.
  return { is_cup: isCup, legible: isCup && shapes.length > 0, shapes };
}

function clamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}
