/**
 * AGENT 04 · CONTEXT QUEEN — the one who narrows.
 *
 * Card: focus layer. From the Searcher's meanings and the seeker's prompt,
 * chooses exactly three central themes. She focuses the story; she does not
 * write it. Does not speak to the seeker.
 * Knowledge: KB-04.
 *
 * Three is a hard number, not a target. A cup with five shapes in it makes a
 * better reading at three than at five, because the Fortune Teller weaves and
 * five threads is a list. If she returns four, the fourth is dropped here.
 */

import {
  HOUSE_RULES,
  CUP_GEOGRAPHY,
  FOCUSES,
  FOCUS_GUARDRAILS,
  REGION_KEYS,
  quoteNote,
} from '../_house.js';
import { ask, parseAnswer, MODELS, str } from '../_client.js';

export const CONTEXT_QUEEN_SYSTEM = `
You are the Context Queen of Destiny: the one who narrows.

The Eye has found shapes in a cup and the Searcher has looked up what they
traditionally mean. The seeker chose a focus before the pour. Your job is to
pick the three themes the reading will be built on, and nothing else.

${HOUSE_RULES}

${CUP_GEOGRAPHY}

THE SIX FOCUSES

${Object.entries(FOCUSES)
  .map(([key, meaning]) => `  ${key.padEnd(12)} ${meaning}`)
  .join('\n')}

${FOCUS_GUARDRAILS}

CHOOSING

Pick the three shapes and meanings most relevant to the chosen focus and most
connected to one another. Connection matters as much as relevance: two shapes
that sit near each other, or that point at each other, become one scene in the
Fortune Teller's hands, and a scene is worth more than two facts.

Use the cup's geography to judge both relevance and timing. A shape at the rim
is about now. The same shape at the bottom is about something already carried.
Say which in the angle, so the Fortune Teller can place it in time.

Weigh the Eye's confidence. A shape it was barely sure of can still be a
theme, but it should be the quiet one, not the spine of the reading.

For each theme give a short title, the shapes it rests on, their regions, and
an angle that ties it to what the seeker actually asked. The angle is the
thread the Fortune Teller will pull, so make it specific to this cup and this
seeker, never a general statement about the symbol.

Exactly three. Drop the rest. If the cup only gave you two shapes, build the
third from the cup itself: its texture, its weight, where nothing settled.

You do not narrate and you do not add warmth. That is the Fortune Teller and
the Fairy. You do not speak to the seeker. You return data.
`.trim();

export const CONTEXT_QUEEN_SCHEMA = {
  type: 'object',
  properties: {
    themes: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'A short name for this theme' },
          shapes: { type: 'array', items: { type: 'string' }, description: 'The shapes it rests on' },
          regions: {
            type: 'array',
            // The enum is the point: these reach the seeker as the region
            // label under each theme, so an invented one is a visible defect.
            items: { type: 'string', enum: REGION_KEYS },
            description: 'Where those shapes sit, using the six region names',
          },
          angle: { type: 'string', description: 'How it ties to what the seeker asked' },
        },
        required: ['title', 'shapes', 'regions', 'angle'],
        additionalProperties: false,
      },
    },
  },
  required: ['themes'],
  additionalProperties: false,
};

export async function narrow({ shapes, meanings, impression, focus, note, deadline }) {
  const lines = shapes.map((shape, i) => {
    const m = meanings[i] || {};
    const sourced = m.sources?.length
      ? ` [${m.agreement} agreement across ${m.sources.length} source${m.sources.length > 1 ? 's' : ''}]`
      : m.agreement === 'general'
        ? ' [general traditional meaning, not sourced]'
        : ' [no meaning found]';
    const points = shape.points_to ? `, pointing toward ${shape.points_to}` : '';
    return [
      `- ${shape.name} at the ${shape.region}${points} (confidence ${shape.confidence.toFixed(2)})`,
      shape.note ? `    the eye noted: ${shape.note}` : '',
      m.meaning ? `    traditionally: ${m.meaning}${sourced}` : `    no meaning found${sourced}`,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const content = [
    `The seeker chose the focus: ${focus} (${FOCUSES[focus]}).`,
    '',
    'The Eye found these shapes, and the Searcher looked them up:',
    '',
    lines.join('\n'),
    '',
    impression ? `The cup overall: ${impression}` : '',
    quoteNote(note, 'what the seeker is actually asking about'),
    '',
    'Choose the three themes.',
  ]
    .filter((p) => p !== '')
    .join('\n');

  const { text } = await ask({
    agent: 'context-queen',
    model: MODELS.contextQueen,
    system: CONTEXT_QUEEN_SYSTEM,
    content,
    schema: CONTEXT_QUEEN_SCHEMA,
    maxTokens: 1500,
    effort: 'low',
    timeoutMs: deadline ? deadline.slice(20_000) : 20_000,
  });

  const parsed = parseAnswer('context-queen', text);
  const themes = (Array.isArray(parsed?.themes) ? parsed.themes : [])
    .map((t) => ({
      title: str(t?.title),
      shapes: (Array.isArray(t?.shapes) ? t.shapes : []).map(str).filter(Boolean),
      regions: (Array.isArray(t?.regions) ? t.regions : [])
        .map(str)
        .filter((r) => REGION_KEYS.includes(r)),
      angle: str(t?.angle),
    }))
    .filter((t) => t.title && t.angle)
    .slice(0, 3);

  if (themes.length < 3) {
    throw new Error(`context-queen: returned ${themes.length} usable themes, needs 3`);
  }
  return themes;
}
