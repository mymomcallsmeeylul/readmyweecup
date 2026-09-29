/**
 * The ASCII layer.
 *
 * Destiny used to draw its coffee: a beaded cup on the waiting screen and an
 * ink blot behind the fortune. Both are gone. What sits behind the interface
 * now is the dictionary itself, typed out: the symbols the Searcher knows,
 * drawn in characters, drifting brown across the paper.
 *
 * Two rules govern everything here.
 *
 * It is never interactive. The layer takes no pointer events, listens to no
 * events at all, and nothing the seeker does starts, stops, steers or speeds
 * the movement. It drifts on its own from the moment the page loads. There is
 * deliberately no resize handler either: positions are percentages, so the
 * browser reflows the field without a line of script running.
 *
 * It is never louder than the reading. These are drawn at a low opacity in the
 * brown ramp below, behind both the paper grain and the text. A fortune is the
 * thing on this page; the field is the table it sits on.
 *
 * `String.raw` throughout. This file is mostly backslashes, and an escape
 * processed on the way in would turn a bird into a line break.
 *
 * Every motif opens and closes on its own line, and `art` strips those two
 * newlines without touching the indentation that holds the drawing together.
 * That is not tidiness. A motif whose last character is a backslash sitting
 * against the closing backtick escapes it, `String.raw` included, because the
 * escape is still what tells the parser where the literal ends: the star and
 * the mountain below ate the rest of the array and the module failed to load.
 */

const art = (raw) => raw.replace(/^\n/, '').replace(/\n[ \t]*$/, '');

/**
 * The motifs, drawn from the symbols the dictionary actually holds, so the
 * texture behind a reading is made of the same vocabulary as the reading.
 *
 * Kept simple on purpose. At this opacity and size an intricate drawing turns
 * to grey mush; a shape that survives is one with few strokes and a clear
 * silhouette.
 */
export const MOTIFS = [
  // star
  art(String.raw`
 \ | /
-- * --
 / | \
`),
  // moon
  art(String.raw`
 .-""-.
/      \
\      (
 '-..-'
`),
  // fish
  art(String.raw`
><(((( >
`),
  // key
  art(String.raw`
o===[]
`),
  // heart
  art(String.raw`
/\  /\
\    /
 \  /
  \/
`),
  // ring
  art(String.raw`
 .--.
(    )
 '--'
`),
  // snake
  art(String.raw`
_/\_/\_
      >
`),
  // tree
  art(String.raw`
  /\
 /  \
/____\
  ||
`),
  // ship
  art(String.raw`
  |\
  | \
__|__\_
\_____/
`),
  // mountain
  art(String.raw`
   /\
  /  \
 /    \
/______\
`),
  // ladder
  art(String.raw`
|--|
|--|
|--|
|--|
`),
  // door
  art(String.raw`
 ______
|  .   |
|  o   |
|______|
`),
  // well
  art(String.raw`
 .----.
 |    |
 |~~~~|
 '----'
`),
  // flower
  art(String.raw`
 \|/
--o--
 /|\
  |
`),
  // grounds
  art(String.raw`
.  :  .
 '  .
:  .  '
`),
  // road
  art(String.raw`
\    /
 \  /
 |  |
 |  |
`),
];

/** Deal the motifs out in a fresh order, so the field is not the same twice. */
function shuffled() {
  const list = [...MOTIFS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const between = (lo, hi) => lo + Math.random() * (hi - lo);

/**
 * Scatter the field into `root`.
 *
 * Placed on a loose grid with jitter rather than at random: pure random
 * clusters, and a cluster at this opacity reads as a smudge instead of as
 * symbols. The grid guarantees spread, the jitter takes the grid back out.
 *
 * Every position is a percentage, which is what lets the whole thing survive a
 * rotation or a resize with no script attached to either.
 */
export function startAsciiField(root, { reduced = false } = {}) {
  if (!root) return;

  // Fewer on a phone: the same count that reads as texture on a laptop reads
  // as wallpaper on a 390px screen, and it is competing with the fortune.
  const wide = window.innerWidth >= 700;
  const cols = wide ? 4 : 2;
  const rows = wide ? 4 : 5;

  const picks = shuffled();
  const frag = document.createDocumentFragment();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const glyph = document.createElement('pre');
      glyph.className = 'ascii__glyph';
      glyph.textContent = picks[(row * cols + col) % picks.length];

      // The cell, plus up to a third of a cell of wander.
      const x = ((col + 0.5) / cols) * 100 + between(-14, 14) / cols;
      const y = ((row + 0.5) / rows) * 100 + between(-14, 14) / rows;

      glyph.style.setProperty('--x', `${x.toFixed(2)}%`);
      glyph.style.setProperty('--y', `${y.toFixed(2)}%`);
      glyph.style.setProperty('--scale', between(0.75, 1.35).toFixed(2));
      glyph.style.setProperty('--tilt', `${between(-8, 8).toFixed(1)}deg`);

      if (!reduced) {
        // Long, prime-ish, and unequal, so the field never falls into step
        // with itself. Negative delays start each one mid-drift: without them
        // every glyph begins at the same phase and the first minute after
        // load looks choreographed.
        glyph.style.setProperty('--drift', `${between(52, 96).toFixed(1)}s`);
        glyph.style.setProperty('--hue', `${between(19, 37).toFixed(1)}s`);
        glyph.style.setProperty('--drift-delay', `${(-between(0, 96)).toFixed(1)}s`);
        glyph.style.setProperty('--hue-delay', `${(-between(0, 37)).toFixed(1)}s`);
        glyph.classList.add('is-drifting');
      }

      frag.append(glyph);
    }
  }

  root.replaceChildren(frag);
}

/**
 * The waiting screen's one motif, where the cup drawing used to be.
 *
 * It turns over slowly while the cup is being read: a symbol surfaces, holds,
 * and gives way to the next. Same objection as everywhere else on this screen,
 * that we do not know how long a reading takes, so this does not pretend to
 * count down. It simply keeps the screen alive.
 *
 * Returns a stop function, because this one does own a timer.
 */
export function startAsciiOracle(el, { reduced = false, everyMs = 2400 } = {}) {
  if (!el) return () => {};

  const picks = shuffled();
  let i = 0;

  const show = () => {
    el.textContent = picks[i % picks.length];
    el.classList.remove('is-out');
    el.classList.add('is-in');
  };

  show();
  if (reduced) return () => {};

  let fade;
  const timer = setInterval(() => {
    el.classList.remove('is-in');
    el.classList.add('is-out');
    fade = setTimeout(() => {
      i += 1;
      show();
    }, 260);
  }, everyMs);

  return () => {
    clearInterval(timer);
    clearTimeout(fade);
  };
}
