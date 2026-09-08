/**
 * AGENT 04 · CONTEXT QUEEN — the one who narrows.
 *
 * Card: focus layer. From the Searcher's meanings and the seeker's prompt,
 * chooses exactly three central themes. She focuses the story; she does not
 * write it. Does not speak to the seeker.
 * Knowledge: KB-04.
 *
 * NOT A MODEL CALL any more. The knowledge base's runtime note is explicit:
 * the reading runs as three calls, the Eye, the Searcher and the Fortune
 * Teller, and the Context Queen executes as a section of the Fortune Teller's
 * single prompt. Agent 04 remains the spec for that section, which is why it
 * still lives in its own file with its own card at the top.
 *
 * So this module exports prompt text rather than a function. The narrowing
 * still happens, still returns three titled themes with their shapes and
 * regions, and is still visible in the Fortune Teller's structured answer. It
 * simply no longer costs a round trip, which is the whole point: five
 * sequential calls could not fit inside the function's ceiling.
 *
 * Three is a hard number, not a target. A cup with three shapes in it makes a
 * better reading at three themes than a cup padded out to five, because the
 * Fortune Teller weaves, and five threads is a list.
 */

import { FOCUSES, FOCUS_GUARDRAILS } from '../_house.js';

/**
 * Written in the second person, addressed to the Fortune Teller, because that
 * is who now reads it. The content is Agent 04's, unchanged in substance.
 */
export const CONTEXT_QUEEN_SECTION = `
FIRST, NARROW (the Context Queen's work, done by you)

Before you write a word of the reading, choose the three themes it will be
built on. The Eye found the shapes and the Searcher looked up what they
traditionally mean. The seeker chose a focus before the pour.

The six regions are above, and you use them here too: they are how you judge
which shapes matter to the chosen focus, and when.

THE SIX FOCUSES

${Object.entries(FOCUSES)
  .map(([key, meaning]) => `  ${key.padEnd(12)} ${meaning}`)
  .join('\n')}

${FOCUS_GUARDRAILS}

CHOOSING

Pick the three shapes and meanings most relevant to the chosen focus and most
connected to one another. Connection matters as much as relevance: two shapes
that sit near each other become one scene in your hands, and a scene is worth
more than two facts.

Use the cup's geography to judge both relevance and timing. A shape at the rim
is about now. The same shape at the bottom is about something already carried.

Weigh the Eye's confidence. A shape it was barely sure of can still be a
theme, but it should be the quiet one, not the spine of the reading.

For each theme give a short title, the shapes it rests on, and their regions.
Exactly three. Drop the rest. If the cup only gave you two shapes, build the
third from the cup itself: its texture, its weight, where nothing settled.
`.trim();
