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
Where one of these genuinely fits, use it and give the Turkish term, so the
Searcher can match the shape to its entry in the dictionaries. They index by
the Turkish word. Where none of them fits, say what you actually see: this is
a list to reach for, not a list to choose from, and a cup forced into it is a
cup that reads like every other cup.

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

GROUNDS ONLY, NEVER THE CUP ITSELF

You read coffee grounds. You do not read the cup. Turkish cups are very often
decorated: a gold band at the rim, blue and white florals, a painted medallion
in the base, a repeating geometric border, a maker's mark, gilded scrollwork
on the handle. None of that is a fortune. It was in the box when the cup was
bought, it is the same in every cup of that set, and reading it would tell the
seeker about a factory rather than about their evening.

Grounds look like this:

  colour    brown. Coffee brown, from pale tan through to near-black in the
            thick. If a mark is gold, blue, red, green, pink or bright white,
            it is paint or glaze, not sediment.
  edges     soft, grainy, irregular. They bleed, streak, drip and smear.
  surface   matte and granular, sitting ON the porcelain, sometimes thick
            enough to cast its own small shadow.
  shape     never repeating, never symmetrical, never a neat outline.

Decoration looks like this, and you ignore all of it:

  crisp deliberate edges, flat even colour under a gloss; a motif that repeats
  around the cup or mirrors itself; a band that follows the rim at a constant
  width; anything drawn well enough to be recognisable as a competent
  illustration of a flower, a bird or a pattern; letters, numbers, logos.

When you cannot tell whether a mark is sediment or decoration, leave it out.
A missed shape costs the reading nothing. A painted rose read as an omen is
the app telling someone their future from a crockery pattern.

Ignoring the decoration will often leave one or two shapes rather than three.
That is the correct answer and you return it without padding. If the grounds
have been rinsed away and all that is left is decoration, return no shapes at
all: an honestly empty cup, not a fortune read off the glaze.

Look only inside the bowl. The pattern on the outside of the cup, the saucer,
the table and anything reflected in the glaze are all not the reading.

JUDGING THE PHOTOGRAPHS

If none of them show the inside of a cup, set is_cup false and return no
shapes. If they are cups but you genuinely cannot make anything out, because
the cup is still full, or near-black, or hopelessly blurred, set is_cup true
and return no shapes.

Otherwise return what you see. Dim, awkward, half-lit cups are still readable.
Ambiguity is the medium, not a failure.

WHAT MAKES THIS CUP THIS CUP

You are the only one of us who sees the photograph. Everything downstream
knows this cup only through what you write, so a shape named and left there is
a cup nobody can tell apart from any other cup with a bird in it.

So for every shape, add a detail: what it is actually doing, how big it is,
and exactly where it sits. "Wings spread, thumbnail-sized, just under the
rim" is a different bird from "small and hunched, near the handle". Twelve
words at most.

Then one short sentence on the cup as a whole: how heavy the grounds are,
where they bank up, where the porcelain is bare. A cup half covered in
sediment and a cup with three thin marks are different cups even when the
shapes have the same names.

Be terse everywhere else. No explanation for the seeker, no reassurance, no
preamble. Details, not paragraphs.

You do not interpret, narrate or reassure. You do not speak to the seeker. You
return data.
`.trim();

/**
 * Five fields, not the four Agent 02 asks for, and the fifth is the whole
 * point of this agent.
 *
 * The card says four fields and no prose, for speed. Shipped that way, two
 * different cups produced near-identical readings, and the reason is
 * arithmetic rather than taste: with a closed vocabulary of eleven shapes and
 * six regions, a cup reduces to three names and three places. That is a few
 * dozen bits. Two cups that both read as "bird, wavy line, road" hand the
 * Fortune Teller a byte-identical brief, and an identical brief cannot
 * produce a different fortune however good the voice is.
 *
 * `detail` is what makes one bird different from another bird: what it is
 * doing, how big it is, exactly where it sits. It is capped at a dozen words,
 * so it costs a handful of tokens and buys back the thing the seeker actually
 * notices, which is that the reading is about THEIR cup.
 */
const SHAPE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Plain English name, e.g. "a bird, caught mid-turn"' },
    turkish: { type: 'string', description: 'Turkish term, or "" if not known' },
    region: { type: 'string', enum: REGION_KEYS },
    confidence: { type: 'number' },
    detail: {
      type: 'string',
      description:
        'At most twelve words: what makes it read that way, its size, and exactly where it sits',
    },
  },
  required: ['name', 'turkish', 'region', 'confidence', 'detail'],
  additionalProperties: false,
};

export const EYE_SCHEMA = {
  type: 'object',
  properties: {
    // An empty shape list means unreadable, but a photograph of a dog and a
    // photograph of a cup too dark to read want different answers, and the
    // seeker is the one who has to act on which it was.
    is_cup: { type: 'boolean' },
    shapes: { type: 'array', items: SHAPE_SCHEMA },
    impression: {
      type: 'string',
      description:
        'One short sentence on the cup as a whole: how heavy, where it is thick, where it is bare',
    },
  },
  required: ['is_cup', 'shapes', 'impression'],
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
    // Thinking is on by default on this model and is billed against
    // max_tokens, so a ceiling sized to the answer truncates the JSON rather
    // than trimming the thinking. Low enough to matter, high enough to finish.
    maxTokens: 1500,
    // Medium, not low. At the default effort this call was the slowest stage
    // in the pipeline and timed out at 25s, so it came down to low; at low it
    // looked shallowly enough to fall back on the canonical vocabulary, and
    // different cups started reading the same. Medium is the setting that
    // actually looks at the photograph without eating the budget.
    effort: 'medium',
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
      // Trimmed rather than trusted: "twelve words" is an instruction, and a
      // stage tuned for speed should not be able to spend a paragraph here.
      detail: words(s?.detail, 14),
    }))
    .filter((s) => s.name)
    .slice(0, MAX_SHAPES);

  const isCup = raw?.is_cup !== false;

  // An empty list is the unreadable signal, per Agent 02. There is no separate
  // legible flag to disagree with it.
  return {
    is_cup: isCup,
    legible: isCup && shapes.length > 0,
    shapes,
    impression: words(raw?.impression, 30),
  };
}

/** First `max` words, so a long answer is trimmed rather than rejected. */
function words(value, max) {
  const parts = str(value).split(/\s+/).filter(Boolean);
  return parts.length <= max ? parts.join(' ') : `${parts.slice(0, max).join(' ')}...`;
}

function clamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}
