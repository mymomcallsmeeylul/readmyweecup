/**
 * The Searcher's fallback tier.
 *
 * KB-03 gives the Searcher four kahve falı sözlüğü to read, and says that when
 * a shape cannot be found on them it should "fall back to a general
 * traditional meaning and mark it general". This file is that fallback, and
 * the distinction matters more than it looks:
 *
 *   - Entries here are general traditional meanings from the shared body of
 *     kahve falı practice. They carry NO source attribution and are always
 *     marked "general", because they did not come from those four sites.
 *   - Meanings that genuinely came from the sites are fetched live by the
 *     Searcher and carry the source they came from plus a real agreement
 *     level across sources.
 *
 * Nothing in this file may ever be presented as sourced. A made-up quote
 * attributed to a real dictionary would be worse than no quote at all, and the
 * whole point of the Searcher is that its citations mean something.
 *
 * The Turkish terms are here so the Searcher can match a shape to its entry on
 * the sites, which index by the Turkish word.
 */

export const GENERAL_MEANINGS = [
  { turkish: 'kuş', english: ['bird'], meaning: 'news on its way, a message that has already left' },
  { turkish: 'balık', english: ['fish'], meaning: 'abundance and good fortune, plenty arriving' },
  { turkish: 'yılan', english: ['snake', 'serpent'], meaning: 'someone to watch, a quiet ill-will nearby' },
  { turkish: 'at', english: ['horse'], meaning: 'a journey, or strong news travelling fast' },
  { turkish: 'kalp', english: ['heart'], meaning: 'love, a matter of the heart coming forward' },
  { turkish: 'yüzük', english: ['ring'], meaning: 'a promise, a commitment, something binding' },
  { turkish: 'anahtar', english: ['key'], meaning: 'a door opening, a solution within reach' },
  { turkish: 'göz', english: ['eye'], meaning: 'being watched or noticed, attention turned your way' },
  { turkish: 'düz çizgi', english: ['straight line', 'line'], meaning: 'a clear path, a course already set' },
  { turkish: 'dalgalı çizgi', english: ['wavy line', 'broken line'], meaning: 'ups and downs, a wavering decision' },
  { turkish: 'yol', english: ['road', 'path'], meaning: 'a journey or a new beginning' },
  { turkish: 'ağaç', english: ['tree'], meaning: 'growth, family, something rooted and long-standing' },
  { turkish: 'kapı', english: ['door', 'gate'], meaning: 'an opportunity, a way through that was not there before' },
  { turkish: 'el', english: ['hand'], meaning: 'help offered, or an offer about to be made' },
  { turkish: 'merdiven', english: ['ladder', 'stairs'], meaning: 'rising, a step up, slow advancement' },
  { turkish: 'harf', english: ['letter', 'initial'], meaning: 'a name, a particular person' },
  { turkish: 'dağ', english: ['mountain', 'hill'], meaning: 'a large obstacle, or a large goal' },
  { turkish: 'bulut', english: ['cloud'], meaning: 'uncertainty, a worry that passes' },
  { turkish: 'ay', english: ['moon', 'crescent'], meaning: 'an emotional stretch, romance, a turning month' },
  { turkish: 'yıldız', english: ['star'], meaning: 'luck, a wish moving toward being granted' },
  { turkish: 'köpek', english: ['dog'], meaning: 'a loyal friend, someone steady' },
  { turkish: 'kedi', english: ['cat'], meaning: 'jealousy, or someone playing two sides' },
  { turkish: 'kelebek', english: ['butterfly'], meaning: 'lightness, a short and welcome joy' },
  { turkish: 'çiçek', english: ['flower', 'rose'], meaning: 'happiness, good news, something opening' },
  { turkish: 'gemi', english: ['ship', 'boat'], meaning: 'a distant journey, or long-awaited news' },
  { turkish: 'düğüm', english: ['knot', 'tangle'], meaning: 'a matter that needs untangling before it moves' },
  { turkish: 'daire', english: ['circle', 'ring shape'], meaning: 'completion, a cycle closing' },
  { turkish: 'haç', english: ['cross', 'crossroads'], meaning: 'a decision point, two ways meeting' },
  { turkish: 'ok', english: ['arrow'], meaning: 'direction, something aimed and released' },
  { turkish: 'makas', english: ['scissors'], meaning: 'a separation, a clean cut in something' },
  { turkish: 'yuva', english: ['nest'], meaning: 'home, settling, making a place' },
  { turkish: 'kuyu', english: ['well', 'pit'], meaning: 'something deep and old, not yet drawn up' },
  { turkish: 'köprü', english: ['bridge'], meaning: 'a crossing, a connection between two sides' },
  { turkish: 'saat', english: ['clock', 'watch'], meaning: 'timing, a thing that depends on when' },
  { turkish: 'kuş yuvası', english: ['bird nest'], meaning: 'family, the household, what is being built at home' },
  { turkish: 'para', english: ['coin', 'money', 'purse'], meaning: 'abundance or an unexpected gain' },
];

/**
 * Match a shape the Eye named to an entry.
 *
 * The Eye names shapes the way a reader talks ("a bird, caught mid-turn"), not
 * as dictionary keys, so matching is on containment rather than equality.
 * Longer names are tried first so "wavy line" is not swallowed by "line".
 */
const TERMS = GENERAL_MEANINGS.flatMap((entry) =>
  entry.english.map((term) => ({ term, entry })),
).sort((a, b) => b.term.length - a.term.length);

export function lookupGeneral(shape) {
  const name = String(shape?.name || '').toLowerCase();
  const turkish = String(shape?.turkish || '').toLowerCase();
  if (!name && !turkish) return null;

  // Turkish is exact enough to try first: the Eye only fills it in when it
  // knows the term, so a hit there beats any amount of English guessing.
  if (turkish) {
    const byTurkish = GENERAL_MEANINGS.find((entry) => turkish.includes(entry.turkish));
    if (byTurkish) return asMeaning(byTurkish);
  }

  // Longest matching TERM wins, not longest term in the entry. "a wavy line"
  // has to reach "wavy line" before the bare "line" on a different entry
  // swallows it.
  for (const { term, entry } of TERMS) {
    if (name.includes(term)) return asMeaning(entry);
  }
  return null;
}

function asMeaning(entry) {
  return { turkish: entry.turkish, meaning: entry.meaning, agreement: 'general' };
}
