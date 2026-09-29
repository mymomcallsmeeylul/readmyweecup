/**
 * The ASCII layer: a coffee cup, drawn in characters, with the grounds moving
 * in it.
 *
 * The technique is lifted from aquatic-cove, which renders an ASCII fluid
 * simulation into one element's innerHTML: a fixed character grid, a scalar
 * field sampled per cell, and a ramp from sparse to dense that turns the field
 * into characters. Same idea here, different fluid.
 *
 * Three parts, and only two of them move:
 *
 *   the cup     a fixed ASCII stencil. It holds still on purpose. A cup that
 *               wobbles reads as a rendering bug, not as atmosphere, and the
 *               shape is the thing that has to stay legible.
 *   the grounds a slow swirl inside the bowl, denser toward the base, sampled
 *               from value noise advected on two axes so it never repeats.
 *   the steam   wisps rising off the rim, wobbling sideways as they climb and
 *               thinning out as they go.
 *
 * Two departures from aquatic-cove, both because this runs BEHIND a page of
 * reading rather than being the page:
 *
 *   It draws at 14fps, not 60. The motion is a slow swirl; nobody can tell,
 *   and it is roughly a quarter of the work.
 *
 *   Cells are emitted in runs with a class, not one span each. aquatic-cove
 *   writes a span per cell with an inline colour, which at this grid is 1836
 *   of them a frame. Quantising to eight levels and merging neighbours that
 *   share one brings a frame to a few hundred short spans, and it moves the
 *   colours into CSS where the dark theme can reach them.
 *
 * It is never interactive. aquatic-cove disturbs its fluid on touch; this has
 * no listener of any kind, so nothing a seeker does starts, stops, steers or
 * speeds any of it. There is no resize handler either: the grid is a fixed
 * number of characters and CSS scales the type, so the browser does the
 * reflowing. Under reduced motion it draws one frame and stops.
 */

/** Sparse to dense. No @, no #, no $: this is sediment, not a heat map. */
export const RAMP = ' .,:;~=coO0';

/**
 * The grid. Fixed, because CSS scales the character size to the viewport.
 *
 * Narrow on purpose. The width is spent either on more columns or on bigger
 * characters, and at 54 columns a phone got 10px glyphs, which read as a
 * texture rather than as ASCII art: you could see something was there without
 * seeing that it was drawn. 44 buys about 13px, where the characters are
 * legible as characters, which is the entire point of drawing in them.
 */
export const COLS = 44;
export const ROWS = 50;

/**
 * The cup, drawn by hand, and the one part of this that does not move.
 *
 * Anything that is not a space is a wall: the render draws it at the darkest
 * level, and the interior mask is derived from it rather than written out
 * again, so the art can be edited here without a second set of numbers going
 * stale somewhere else.
 */
export const CUP = [
  '     .------------------------.',
  '     |                        |---.',
  '     |                        |    \\',
  '     |                        |    |',
  '     |                        |    |',
  '     |                        |    /',
  '     |                        |---\'',
  '     \\                       /',
  '      \\                     /',
  '       \'-------------------\'',
  '   .-----------------------------.',
  '   \'-----------------------------\'',
];

/**
 * Where the stencil sits in the grid: centred across, and as low as it goes.
 *
 * The grid is anchored to the bottom of the viewport, so the saucer sits on
 * the bottom edge like a cup on a table and everything above it is steam
 * rising up behind the reading. Centring the cup instead put it directly
 * behind the headline and the upload tile, where a raised opaque surface
 * covered the half that made it read as a cup at all.
 */
const CUP_X = Math.round((COLS - 36) / 2);
const CUP_Y = ROWS - CUP.length - 1;

/** How many rows of steam rise off the rim: most of the height above it. */
const STEAM_ROWS = 22;

/* ----------------------------------------------------------------- the mask */

/**
 * One pass over the stencil, done once at module load: what character sits at
 * each cell, and which cells are inside the bowl.
 *
 * Interior is derived by walking each row of the stencil and taking everything
 * between its first TWO walls. First and last looks equivalent and is not: on
 * the handle rows the last wall is the handle's outer stroke, so the grounds
 * poured straight through the cup wall and filled the handle as well.
 *
 * That is why the stencil's bowl has to close on every row, and it is also why
 * editing the drawing above needs no other change.
 */
const wall = new Array(COLS * ROWS).fill('');
const inside = new Uint8Array(COLS * ROWS);
const at = (i, j) => j * COLS + i;

let rimRow = ROWS;
let rimLeft = COLS;
let rimRight = 0;

for (let r = 0; r < CUP.length; r++) {
  const row = CUP[r];
  const j = CUP_Y + r;
  if (j < 0 || j >= ROWS) continue;

  const walls = [];

  for (let c = 0; c < row.length; c++) {
    const ch = row[c];
    const i = CUP_X + c;
    if (ch === ' ' || i < 0 || i >= COLS) continue;
    wall[at(i, j)] = ch;
    if ('|\\/'.includes(ch)) walls.push(i);
  }

  // Only the bowl has two walls to sit between. The saucer and the rim line
  // have none, so they are drawn and then skipped.
  const [first, second] = walls;
  if (second > first + 1) {
    for (let i = first + 1; i < second; i++) if (!wall[at(i, j)]) inside[at(i, j)] = 1;
    if (j < rimRow) {
      rimRow = j;
      rimLeft = first;
      rimRight = second;
    }
  }
}

/** The bowl's vertical extent, so the grounds can be denser toward the base. */
let bowlTop = ROWS;
let bowlBottom = 0;
for (let j = 0; j < ROWS; j++) {
  for (let i = 0; i < COLS; i++) {
    if (!inside[at(i, j)]) continue;
    if (j < bowlTop) bowlTop = j;
    if (j > bowlBottom) bowlBottom = j;
  }
}

/**
 * The derived mask, for tests. Exported because the one thing that can go
 * quietly wrong here is the interior: it is inferred from the drawing rather
 * than written out, so a stencil edit can open the bowl without anyone noticing
 * until the coffee is pouring through the wall.
 */
export const cupMask = () => ({ wall, inside, rimRow, rimLeft, rimRight, bowlTop, bowlBottom });

/* ---------------------------------------------------------------- the noise */

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Value noise, smoothstepped. Cheap, and smooth enough at this cell size. */
function noise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

/* --------------------------------------------------------------- the fields */

/**
 * The grounds. Denser toward the base, because sediment is, and swirling: the
 * sample point is pushed around on both axes at different rates so the pattern
 * turns over rather than sliding past.
 */
function grounds(i, j, t) {
  const depth = (j - bowlTop) / Math.max(1, bowlBottom - bowlTop);
  const settle = 0.22 + 0.62 * depth * depth;

  const swirl = noise(
    i * 0.17 + Math.sin(t * 0.13) * 1.4,
    j * 0.31 - t * 0.19 + Math.cos(t * 0.09) * 0.8,
  );
  const grain = noise(i * 0.52 - t * 0.07, j * 0.61 + t * 0.05);

  return clamp01(settle * (0.45 + 1.15 * swirl) + grain * 0.14);
}

/**
 * The steam. It thins as it climbs, wanders sideways on the way up, and is
 * windowed to the mouth of the cup so it does not fog the whole screen.
 */
function steam(i, j, t) {
  const above = rimRow - j;
  if (above < 1 || above > STEAM_ROWS) return 0;

  // Across the mouth, falling off at both lips.
  const span = (i - rimLeft) / Math.max(1, rimRight - rimLeft);
  if (span < -0.12 || span > 1.12) return 0;
  const mouth = Math.sin(clamp01(span) * Math.PI);

  const rise = 1 - above / STEAM_ROWS;
  const wob = 0.5 + 0.5 * Math.sin(i * 0.42 + t * 0.85 - above * 0.62);
  const n = noise(i * 0.3 + Math.sin(t * 0.2) * 0.6, j * 0.34 - t * 0.75);

  return clamp01(mouth * rise * rise * wob * (0.25 + 1.25 * n) * 0.95);
}

/* --------------------------------------------------------------- the render */

/** Eight levels: 0-6 for the moving fields, 7 reserved for the cup itself. */
const WALL_LEVEL = 7;

/**
 * One frame, as a run-length encoded string of spans.
 *
 * A cell joins the run in front of it whenever it lands on the same level, so
 * a stretch of empty paper costs nothing and a bank of sediment costs one tag.
 */
function frame(t) {
  let html = '';
  let level = -2;
  let run = '';

  const flush = () => {
    if (!run) return;
    html += level < 0 ? run : `<span class="a${level}">${run}</span>`;
    run = '';
  };

  const put = (ch, lv) => {
    if (lv !== level) {
      flush();
      level = lv;
    }
    run += ch;
  };

  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const k = at(i, j);
      const brick = wall[k];

      if (brick) {
        put(brick, WALL_LEVEL);
        continue;
      }

      const d = inside[k] ? grounds(i, j, t) : steam(i, j, t);
      if (d < 0.07) {
        put(' ', -1);
        continue;
      }

      put(RAMP[Math.min(RAMP.length - 1, (d * RAMP.length) | 0)], Math.min(6, (d * 7) | 0));
    }
    flush();
    level = -2;
    html += '\n';
  }

  flush();
  return html;
}

/**
 * Start the cup.
 *
 * Throttled to FPS, and deliberately not to the display: this is wallpaper,
 * and a background that spends a phone's battery to be smoother than anyone
 * will notice is a background that costs more than it is worth.
 *
 * rAF stops on its own in a hidden tab, which is the whole reason there is no
 * visibilitychange listener here. There is no listener of any kind, and that
 * is the point rather than an omission.
 */
export function startAsciiCup(el, { reduced = false, fps = 14 } = {}) {
  if (!el) return () => {};

  if (reduced) {
    el.innerHTML = frame(0);
    return () => {};
  }

  const started = performance.now();
  const step = 1000 / fps;
  let last = -Infinity;
  let raf = 0;

  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (now - last < step) return;
    last = now;
    el.innerHTML = frame((now - started) / 1000);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
