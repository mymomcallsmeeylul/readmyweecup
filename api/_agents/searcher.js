/**
 * AGENT 03 · SEARCHER — the keeper of meanings.
 *
 * Card: retrieval layer. For each shape the Eye found, looks up what it
 * traditionally means and hands the meanings on. It gathers; it does not
 * interpret. Does not speak to the seeker.
 * Knowledge: KB-03.
 *
 * NOT A MODEL CALL any more, and no longer on the network.
 *
 * It used to read four Turkish kahve falı sözlüğü live, through Anthropic's
 * server-side web_fetch, which is a real capability and was the right shape
 * while the dictionary lived on other people's servers. It cost a model call,
 * up to eighteen seconds of a fifty-second budget, and a standing dependency
 * on four sites being up and unchanged. In practice the budget rarely had room
 * for it, so most readings fell back to a bundled list anyway.
 *
 * The dictionary is now bundled outright: docs/SYMBOLS.md, vendored into
 * api/_dictionary.js as 205 symbols. So this is a lookup, it is instant, it
 * cannot fail, and the pipeline is two model calls rather than three.
 *
 * The two-tier "sourced versus general" distinction went with the fetching.
 * It existed to keep a fetched meaning and an invented one apart, which was
 * the right worry when one of them came off the open web. With a single
 * bundled list there is one tier and it is honest by construction: every
 * meaning in a reading is one we can point at in a file.
 */

import { lookupSymbol } from '../_dictionary.js';

/**
 * Look up every shape. Pure, synchronous, and total: there is no call to time
 * out, nothing to retry, and no tier to explain.
 *
 * A shape with no entry comes back with an empty meaning rather than a guess.
 * The Fortune Teller can still read a shape the dictionary has never heard of,
 * because it knows the name and where it sits, and that is more honest than
 * stretching a neighbouring entry to cover it.
 */
export function search(shapes) {
  const meanings = shapes.map((shape) => {
    const hit = lookupSymbol(shape);
    return {
      shape: shape.name,
      symbol: hit?.symbol || '',
      meaning: hit?.meaning || '',
    };
  });

  return { meanings, found: meanings.filter((m) => m.meaning).length };
}
