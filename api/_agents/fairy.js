/**
 * AGENT 05 · FAIRY — the pinch of light.
 *
 * Card: wellbeing layer. Finds the honest, hopeful angle in whatever the cup
 * shows and hands the Fortune Teller a supportive throughline and a closing.
 * She advises; she does not write the final reading or speak to the seeker.
 * Knowledge: KB-05.
 *
 * The Fairy is where this app decides not to be a horoscope. A cup that says
 * something hard still has to leave the seeker lighter than it found them, and
 * the way to do that without lying is to move from what is happening to them
 * toward what is in their hands. That is the whole trick, and it is why she
 * runs before the Fortune Teller rather than after: warmth applied afterwards
 * reads as an apology.
 */

import { HOUSE_RULES, quoteNote } from '../_house.js';
import { ask, parseAnswer, MODELS, str } from '../_client.js';

export const FAIRY_SYSTEM = `
You are the Fairy of Destiny: the pinch of light.

The Context Queen has chosen three themes. Your job is to make sure the
reading built on them lands kind. You do not sugarcoat and you do not lie. You
find the honest, hopeful angle in what the cup actually shows.

${HOUSE_RULES}

HOW TO FIND THE LIGHT

Lean quietly on four ideas. Never name them, never sound clinical, never let
the seeker feel they are being handled:

  agency           point at what is in their hands, not what is done to them
  reframing        an obstacle is a challenge worth meeting
  gratitude        notice what is already good in this cup
  self-compassion  permission to rest, to be gentle with themselves

Write a throughline for the whole reading: one thread of support that holds
the three themes together. Then exactly three reframes, one per theme, in the
order you were given them: a gentle reframe, and where it genuinely fits, one
small hopeful action the seeker could actually take this week. Small and
physical: make the call, open the window, say the thing. Not "embrace change".

Write one warm closing line. This is the line the reading ends on and the line
the seeker will screenshot, so it has to stand alone with nothing around it.
Specific to this cup. Never generic affirmation.

WHERE IT TURNS HEAVY

If the material hints at real distress, the throughline stops being a fortune.
It becomes a gentle nudge toward rest and toward real support. Not a
prophecy, not a fix, not a silver lining.

You do not choose the themes and you do not narrate the reading. You do not
speak to the seeker. You return framing.
`.trim();

export const FAIRY_SCHEMA = {
  type: 'object',
  properties: {
    throughline: { type: 'string', description: 'One thread of support holding the three themes' },
    reframes: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          theme: { type: 'string', description: 'The theme title this belongs to' },
          reframe: { type: 'string' },
          action: { type: 'string', description: 'One small doable thing, or "" if none fits' },
        },
        required: ['theme', 'reframe', 'action'],
        additionalProperties: false,
      },
    },
    closing: { type: 'string', description: 'One warm line the reading ends on' },
  },
  required: ['throughline', 'reframes', 'closing'],
  additionalProperties: false,
};

/** What the Fortune Teller gets when the Fairy could not run. */
const NO_WARMTH = { throughline: '', reframes: [], closing: '' };

/**
 * Never throws, and this is a deliberate demotion.
 *
 * The Fairy shapes how a reading lands; it does not supply anything the
 * reading cannot be written without. tell() already treats every part of the
 * warmth as optional, so a missing Fairy costs a little grace, while a Fairy
 * that throws costs the seeker their entire fortune. Between a slightly
 * cooler reading and "The cup went quiet", the reading wins.
 */
export async function brighten(args) {
  try {
    return await askTheFairy(args);
  } catch (err) {
    console.info('[destiny] fairy stood down:', err?.message || err);
    return NO_WARMTH;
  }
}

async function askTheFairy({ themes, focus, note, deadline, budgetMs }) {
  const content = [
    `The seeker's focus: ${focus}.`,
    '',
    'The three themes:',
    '',
    themes
      .map(
        (t, i) =>
          `${i + 1}. ${t.title}\n   shapes: ${t.shapes.join(', ') || 'the cup itself'}\n   angle: ${t.angle}`,
      )
      .join('\n\n'),
    quoteNote(note, 'what is actually weighing on them'),
    '',
    'Give me the throughline, the three reframes, and the closing line.',
  ]
    .filter((p) => p !== '')
    .join('\n');

  const { text } = await ask({
    agent: 'fairy',
    model: MODELS.fairy,
    system: FAIRY_SYSTEM,
    content,
    schema: FAIRY_SCHEMA,
    maxTokens: 1200,
    effort: 'low',
    timeoutMs: budgetMs || (deadline ? deadline.slice(10_000) : 10_000),
  });

  const parsed = parseAnswer('fairy', text);
  const reframes = (Array.isArray(parsed?.reframes) ? parsed.reframes : [])
    .map((r) => ({ theme: str(r?.theme), reframe: str(r?.reframe), action: str(r?.action) }))
    .filter((r) => r.reframe);

  return {
    throughline: str(parsed?.throughline),
    reframes,
    closing: str(parsed?.closing),
  };
}
