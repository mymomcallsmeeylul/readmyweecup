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
invent detail to fill the cup out. Two or three clear shapes is a good
reading, not a thin one; five is the most you should ever return.

Tag every shape with the region it sits in. Where it sits is half of what it
will come to mean, so place it carefully.

Note when shapes point toward or touch one another. The Fortune Teller reads
neighbouring shapes as a single scene, so a bird flying toward a key is worth
more than a bird and a key.

${VOCABULARY}

JUDGING THE PHOTOGRAPHS

If none of them show the inside of a cup, set is_cup false and shapes empty.
If they are cups but you genuinely cannot make anything out, because the cup
is still full, or near-black, or hopelessly blurred, set is_cup true, legible
false, and shapes empty. Say which in one plain sentence in "reason".

Otherwise legible is true. Dim, awkward, half-lit cups are still legible.
Ambiguity is the medium, not a failure.

You do not interpret, narrate or reassure. You do not speak to the seeker. You
return data.
`.trim();

const SHAPE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Plain English name, e.g. "a bird, caught mid-turn"' },
    turkish: { type: 'string', description: 'Turkish term, or "" if not known' },
    region: { type: 'string', enum: REGION_KEYS },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    note: { type: 'string', description: 'What makes it read that way, or ""' },
    points_to: { type: 'string', description: 'Name of a shape this one faces or touches, or ""' },
  },
  required: ['name', 'turkish', 'region', 'confidence', 'note', 'points_to'],
  additionalProperties: false,
};

export const EYE_SCHEMA = {
  type: 'object',
  properties: {
    is_cup: { type: 'boolean' },
    legible: { type: 'boolean' },
    reason: { type: 'string', description: 'Why it could not be read, or ""' },
    shapes: { type: 'array', items: SHAPE_SCHEMA, maxItems: 5 },
    impression: { type: 'string', description: 'The cup overall: texture, weight, where nothing settled' },
  },
  required: ['is_cup', 'legible', 'reason', 'shapes', 'impression'],
  additionalProperties: false,
};

/** Look into the cup. `images` is 1 to 4 photographs of one cup. */
export async function look(images, { deadline } = {}) {
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
    maxTokens: 1500,
    timeoutMs: deadline ? deadline.slice(25_000) : 25_000,
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
      note: str(s?.note),
      points_to: str(s?.points_to),
    }))
    .filter((s) => s.name)
    .slice(0, 5);

  const isCup = raw?.is_cup !== false;
  const legible = isCup && raw?.legible !== false && shapes.length > 0;

  return {
    is_cup: isCup,
    legible,
    reason: str(raw?.reason),
    shapes,
    impression: str(raw?.impression),
  };
}

function clamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}
