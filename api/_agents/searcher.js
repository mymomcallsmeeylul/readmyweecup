/**
 * AGENT 03 · SEARCHER — the keeper of meanings.
 *
 * Card: retrieval layer. For each shape the Eye found, looks up its meaning in
 * the four Turkish kahve falı sözlükleri and returns sourced, translated
 * meanings. It gathers; it does not interpret. Does not speak to the seeker.
 * Knowledge: KB-03.
 *
 * Two tiers, and the difference between them is the whole point of this agent:
 *
 *   sourced  came from one of the four dictionaries, carries the source it
 *            came from and a real agreement level across sources.
 *   general  came from api/_dictionary.js, a general traditional meaning with
 *            no source attribution, marked "general" exactly as KB-03 says.
 *
 * A citation that might be invented is worth less than no citation, so the two
 * never blur. The general tier is also what makes the pipeline survive a slow
 * or unreachable source: the reading still happens, honestly labelled.
 *
 * The fetching is done by Anthropic's server-side web_fetch tool, not by this
 * function, which means it works from a serverless function with no egress to
 * those hosts. allowed_domains pins it to the four sites, so no amount of text
 * in the conversation can send it somewhere else.
 */

import { HOUSE_RULES } from '../_house.js';
import { ask, parseAnswer, MODELS, str } from '../_client.js';
import { lookupGeneral } from '../_dictionary.js';

export const SOURCES = [
  { host: 'www.tellwe.com', url: 'https://www.tellwe.com/kahve-fali-sozlugu' },
  { host: 'yemek.com', url: 'https://yemek.com/kahve-fali-sozlugu/' },
  { host: 'www.ayvalikzade.com', url: 'https://www.ayvalikzade.com/post/kahve-falı-sözlüğü' },
  { host: 'mocacocoffee.com', url: 'https://mocacocoffee.com/blogs/b/kahve-fali-sozlugu' },
];

/**
 * Cached per shape, as the card asks. Serverless instances are recycled, but a
 * warm one reading a second cup pays nothing for a shape it already looked up,
 * and "kuş" turns up in a great many cups.
 */
const CACHE = new Map();
const CACHE_MAX = 300;

export const SEARCHER_SYSTEM = `
You are the Searcher of Destiny: the keeper of meanings.

The Eye has found shapes in a cup. Your job is to look up what each one
traditionally means in the four Turkish coffee-fortune dictionaries you have
been given, and report back. You gather; you do not interpret.

${HOUSE_RULES}

HOW TO LOOK THINGS UP

Fetch the four dictionary pages. They are kahve falı sözlükleri: alphabetical
lists of symbols and their meanings, written in Turkish. Match each shape to
its entry using the Turkish term, which is how the pages are indexed.

Cross-reference. Where the sources agree, say so and record agreement "high".
Where they differ in emphasis but not in substance, record "mixed". Where they
genuinely conflict, record "low" and keep both readings rather than picking a
winner.

Translate each meaning into the seeker's language. Keep the translation close;
this is a dictionary entry, not a fortune.

If a shape is not on any of the pages, return it with an empty sources list.
Do not stretch a different entry to cover it, and do not write a meaning of
your own and present it as sourced. An entry that is not there is a fact worth
reporting.

WHAT YOU DO NOT DO

You do not interpret for the seeker, add encouragement, or tell a story. That
belongs to the Context Queen and the Fortune Teller. You do not choose which
shapes matter. You do not speak to the seeker.

YOUR ANSWER

After you have read the pages, reply with JSON only, no prose around it and no
markdown fence, in exactly this shape:

{
  "meanings": [
    {
      "shape": "the shape name you were given, copied exactly",
      "turkish": "the Turkish term you looked up",
      "sources": [{ "source": "yemek.com", "text": "the meaning, translated" }],
      "synthesis": "one sentence: what the sources agree this shape means",
      "agreement": "high"
    }
  ]
}

agreement is "high", "mixed" or "low". Return one entry per shape you were
given, in the order you were given them.
`.trim();

/**
 * Below this there is no point starting: four server-side page fetches and a
 * cross-reference cannot finish, and the attempt costs the stages behind it
 * the time it burns before timing out.
 */
const SEARCHER_FLOOR_MS = 12_000;

/**
 * Look up every shape. Never throws: a Searcher that fails takes the general
 * tier, because a reading with unsourced meanings is a reading, and a reading
 * that 500s is not.
 */
export async function search(
  shapes,
  { language = 'English', deadline, budgetMs, live = true } = {},
) {
  if (shapes.length === 0) return { meanings: [], sourced: false, sources: [] };

  const general = shapes.map((shape) => fromGeneral(shape));

  // Only the shapes this instance has not already looked up reach the network.
  const cached = [];
  const missing = [];
  for (const shape of shapes) {
    const hit = CACHE.get(key(shape));
    if (hit) cached.push(hit);
    else missing.push(shape);
  }

  // The orchestrator decides how much time this stage may have, because only
  // it knows what still has to run afterwards. No budget means no room, and
  // the tradition still knows what a bird means.
  const room = budgetMs ?? (deadline ? deadline.slice(20_000) : 20_000);

  const canGoLive =
    missing.length > 0 && live && process.env.SEARCHER_LIVE !== '0' && room >= SEARCHER_FLOOR_MS;

  if (!canGoLive) {
    return merge(shapes, general, cached);
  }

  try {
    const found = await fetchMeanings(missing, language, room);
    for (const entry of found) {
      remember(entry);
    }
    return merge(shapes, general, [...cached, ...found]);
  } catch {
    // Sources unreachable, slow, or unparseable. The tradition still knows
    // what a bird means.
    return merge(shapes, general, cached);
  }
}

async function fetchMeanings(shapes, language, timeoutMs) {
  const list = shapes
    .map((s, i) => {
      const turkish = s.turkish || lookupGeneral(s)?.turkish || '';
      return `${i + 1}. ${s.name}${turkish ? ` (Turkish: ${turkish})` : ''} — sitting at the ${s.region}`;
    })
    .join('\n');

  const content = [
    'Look these shapes up in the four dictionaries:',
    '',
    list,
    '',
    'The four kahve falı sözlükleri:',
    ...SOURCES.map((s) => `  ${s.url}`),
    '',
    `Translate the meanings into ${language}.`,
  ].join('\n');

  const { text } = await ask({
    agent: 'searcher',
    model: MODELS.searcher,
    system: SEARCHER_SYSTEM,
    content,
    // Three shapes at most now, one short entry each, plus room for the
    // thinking that a cross-reference across four sources actually takes.
    maxTokens: 2500,
    effort: 'low',
    tools: [
      {
        type: 'web_fetch_20260209',
        name: 'web_fetch',
        max_uses: SOURCES.length,
        // Pinned to the four dictionaries. Nothing in the conversation, and
        // nothing on a fetched page, can widen this.
        allowed_domains: SOURCES.map((s) => s.host),
        // These pages are long alphabetical lists and we want three entries
        // from each. Pulling 20k tokens per page was four times the reading
        // for the same three lookups, and reading is what costs the seconds
        // this stage does not have.
        max_content_tokens: 6_000,
      },
    ],
    timeoutMs,
    retries: 0,
  });

  const parsed = parseAnswer('searcher', text);
  const meanings = Array.isArray(parsed?.meanings) ? parsed.meanings : [];

  return meanings
    .map((m) => {
      const sources = (Array.isArray(m?.sources) ? m.sources : [])
        .map((s) => ({ source: str(s?.source), text: str(s?.text) }))
        .filter((s) => s.source && s.text);

      return {
        shape: str(m?.shape),
        turkish: str(m?.turkish),
        sources,
        meaning: str(m?.synthesis),
        agreement: ['high', 'mixed', 'low'].includes(m?.agreement) ? m.agreement : 'mixed',
      };
    })
    // No sources means the Searcher did not find it, whatever else it said.
    // Those fall through to the general tier rather than being dressed up.
    .filter((m) => m.shape && m.meaning && m.sources.length > 0);
}

/* --------------------------------------------------------------- assembly */

function fromGeneral(shape) {
  const hit = lookupGeneral(shape);
  return {
    shape: shape.name,
    turkish: hit?.turkish || shape.turkish || '',
    sources: [],
    meaning: hit?.meaning || '',
    agreement: 'general',
  };
}

/**
 * Sourced beats general, per shape. A cup with one sourced meaning and two
 * general ones is normal and is reported as exactly that.
 */
function merge(shapes, general, found) {
  const byShape = new Map();
  for (const entry of found) {
    if (entry?.shape) byShape.set(entry.shape.toLowerCase(), entry);
  }

  const meanings = shapes.map((shape, i) => {
    const hit = byShape.get(String(shape.name).toLowerCase());
    const fallback = general[i];
    if (hit) return hit;
    // Nothing sourced and nothing in the general dictionary either: say so
    // rather than inventing. The Context Queen can still use the region.
    if (!fallback.meaning) {
      return { ...fallback, meaning: '', agreement: 'unknown' };
    }
    return fallback;
  });

  const sources = [
    ...new Set(meanings.flatMap((m) => m.sources.map((s) => s.source))),
  ];

  return { meanings, sourced: sources.length > 0, sources };
}

function key(shape) {
  return `${String(shape?.name || '').toLowerCase()}|${String(shape?.turkish || '').toLowerCase()}`;
}

function remember(entry) {
  if (CACHE.size > CACHE_MAX) CACHE.clear();
  CACHE.set(`${entry.shape.toLowerCase()}|${entry.turkish.toLowerCase()}`, entry);
}

/** Test seam: the cache is module state and outlives a single reading. */
export function clearCache() {
  CACHE.clear();
}
