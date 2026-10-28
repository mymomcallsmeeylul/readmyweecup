/**
 * The ASCII layer: a coffee cup, drawn as a halftone of characters.
 *
 * This is the third attempt and the first one that is actually drawing rather
 * than arranging. The first scattered small motifs around, which was shapes in
 * a monospace font. The second hand-drew the cup as a stencil of `|` and `-`,
 * which read as a cup but had no tone: line work, not art.
 *
 * What changed is where the picture comes from. The cup is no longer typed
 * out. It is a FIELD: geometry evaluated per cell, with lighting, a specular
 * band, and crisp seams where two surfaces meet. A ramp turns that field into
 * characters. The grid samples the shape; it does not contain it, which is why
 * the cup now has a lit side and a shaded side instead of an outline.
 *
 * Four techniques, all from the AsciiWake sketch:
 *
 *   halftone dots   The sparse end of the ramp is not a full stop, it is a
 *                   real circle whose AREA follows the density. Faint regions
 *                   become a dot screen that thickens into glyphs, so tone
 *                   runs continuously from nothing to solid instead of
 *                   starting wherever the first printable character does.
 *
 *   staggered rows  Odd rows sit half a cell across. Without it the dots line
 *                   up into stripes and the halftone reads as corduroy.
 *
 *   seams           A surface boundary draws at full density over a hairline,
 *                   rather than being shaded like everything around it. This
 *                   is what keeps the rim, the base and the handle legible
 *                   once the tone either side of them is nearly equal.
 *
 *   the shimmer     A cell in the moving part picks its glyph with a little
 *                   noise, re-dealt a dozen times a second, so the coffee and
 *                   the steam flicker between neighbouring characters the way
 *                   a terminal redraw does. The cup itself never flickers:
 *                   only what is alive shimmers, which is what tells them
 *                   apart at a glance.
 *
 * Lighting runs the right way round for the page. On paper the characters are
 * dark, so the drawing is a halftone PRINT: the lit side of the cup is sparse
 * and the shaded side is dense. On the dark theme the characters are light and
 * it inverts, because there the ink is the light.
 *
 * What is NOT taken from that sketch is all of its interaction. It drags a
 * wake under the pointer, leans glyphs toward the hand and rings out from a
 * press. This has none of that and must not: no pointer, mouse, touch, wheel,
 * scroll or key listener exists here, so nothing a seeker does starts, stops,
 * steers or speeds any of it. The two observers at the bottom watch the
 * viewport box and the theme attribute, which is layout, not input.
 */

/** Lightest to densest. The first is blank and the second never prints: a
 *  cell that low is drawn as a halftone dot instead. */
export const RAMP = [' ', '.', ':', ';', '~', '=', '*', 'o', 'O', '0'];

/** Below this the cell is pure field, drawn as a dot and never shimmering. */
const COLD = 0.055;

/** How many cells span the cup's full width. Sets the character size. */
const CELLS_ACROSS = 48;

/** Cell proportions, as a fraction of the font size. Rows run a little
 *  tighter than the face's own leading so the resting dots sit on an even
 *  screen rather than in bands. */
const CELL_W = 0.62;
const CELL_H = 0.80;

/** How long a shimmer deal survives before it is re-dealt, in seconds. */
const DEAL_S = 0.075;

/** Redraws a second. It is wallpaper: a background that spends a phone's
 *  battery being smoother than anyone can see costs more than it is worth. */
const FPS = 15;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------- the geometry */

/*
 * The cup lives in a box where x runs -1 to 1 across the saucer and y uses the
 * same scale, so nothing is stretched. y increases downward. Everything below
 * is in those units, and the whole thing is placed and scaled at draw time.
 */

const RIM_Y = -0.56;   // centre of the ellipse that is the cup's mouth
const RIM_RX = 0.58;
const RIM_RY = 0.105;

// Where the bowl meets its foot. A fincan is squat: at 0.42 the bowl came out
// taller than it was wide and read as a mug.
const BASE_Y = 0.28;
const BASE_RX = 0.40;
const BASE_RY = 0.062;

const HANDLE_X = 0.74;
const HANDLE_Y = -0.15;
const HANDLE_RX = 0.29;
const HANDLE_RY = 0.26;
const HANDLE_T = 0.38; // thickness, as a fraction of the outer radius

const SAUCER_Y = 0.43;
const SAUCER_RX = 0.84;
const SAUCER_RY = 0.07;

/** The box the drawing occupies, used to place it and to skip empty cells. */
const TOP = RIM_Y - RIM_RY;
const BOTTOM = SAUCER_Y + SAUCER_RY + 0.03;

/** How far above the rim the steam reaches. */
const STEAM_RISE = 1.35;

/**
 * The landmarks, so a test can probe meaningful points of the drawing rather
 * than numbers copied out of this file and left to drift from it.
 */
export const GEOMETRY = {
  RIM_Y, RIM_RX, RIM_RY,
  BASE_Y, BASE_RX, BASE_RY,
  HANDLE_X, HANDLE_Y, HANDLE_RX, HANDLE_RY, HANDLE_T,
  SAUCER_Y, SAUCER_RX, SAUCER_RY,
  TOP, BOTTOM, STEAM_RISE,
};

/**
 * A seam's half-width, in cup units, for a given cell size.
 *
 * It has to be measured against the grid rather than fixed, and that is not a
 * refinement: a seam narrower than a cell is sampled only where it happens to
 * fall under one, so the cup's walls arrived as a dotted line with gaps in it
 * and the saucer's outline came in pieces.
 *
 * It is measured against the cell's WIDTH. Cells are taller than they are wide
 * here, and the walls that most need to stay continuous are the vertical ones;
 * sizing off the height instead made them two cells thick, and thickened the
 * rim's front lip into a bar across the whole cup.
 */
const seamFor = (cellWidth) => Math.max(0.006, cellWidth * 0.55);

/**
 * Signed distance from a point to an ellipse's outline, negative inside.
 *
 * The obvious version of this is `hypot(x/rx, y/ry) - 1`, and it is wrong in a
 * way that shows: that quantity is not a distance, and how fast it changes
 * depends on where you are on the ellipse. A seam cut at a fixed threshold of
 * it came out hairline-thin at the top and bottom of the saucer and finger-wide
 * at its left and right, which is why the saucer's outline arrived in pieces.
 *
 * Dividing the implicit function by the length of its gradient is the standard
 * first-order fix, and it gives a seam of even width the whole way round.
 */
function ellipseDist(x, y, rx, ry) {
  const f = (x / rx) ** 2 + (y / ry) ** 2 - 1;
  const g = Math.hypot((2 * x) / (rx * rx), (2 * y) / (ry * ry));
  return g < 1e-6 ? -Math.min(rx, ry) : f / g;
}

/** The bowl's half-width at a depth, tapering on a curve rather than a cone. */
function halfWidth(y) {
  const t = clamp01((y - RIM_Y) / (BASE_Y - RIM_Y));
  return mix(RIM_RX, BASE_RX, t * t * 0.42 + t * 0.58);
}

/** Where the rim's near arc crosses a column: the front lip of the mouth. */
function lipAt(x) {
  const q = 1 - (x / RIM_RX) ** 2;
  return q <= 0 ? RIM_Y : RIM_Y + RIM_RY * Math.sqrt(q);
}

/**
 * How lit a point on the bowl is, 0 shaded to 1 lit.
 *
 * A cylinder lit from the upper left: a broad lambert falloff across the
 * width, plus a narrow specular band where the porcelain catches the light.
 * This is the whole reason the cup has volume rather than an outline.
 */
function bowlLight(u) {
  const lambert = 0.52 - 0.60 * u;
  const spec = Math.exp(-((u + 0.46) ** 2) * 16) * 0.42;
  return clamp01(lambert + spec);
}

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

/**
 * A stable 0..1 per cell per deal, so the shimmer is noise that holds for a
 * few frames rather than flickering every single one.
 */
function dealHash(k, n) {
  let h = (k * 374761393 + n * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* ---------------------------------------------------------------- the field */

/**
 * Everything at one point: how much ink, and whether it is alive.
 *
 * `ink` is density, 0 to 1, already read the right way round for the page.
 * `live` marks the coffee and the steam, which shimmer; the cup does not.
 *
 * Returns null where there is nothing at all, which is most of the screen and
 * is why this is cheap enough to run per cell per frame.
 */
export function sample(x, y, t, dark, SEAM = 0.02) {
  // How dark a surface of this lightness should print. On paper the ink is
  // dark, so a lit face is sparse and a shaded one is dense; on the dark theme
  // the ink is the light and it reads the other way round.
  //
  // The floor is 0.06, not a third. AsciiWake keeps no face below a third of a
  // full dot because its cube is the thing you are looking at; this is behind
  // a page of reading, and at a floor that high the bowl never dropped below a
  // printable glyph and came out a solid block with a cup-shaped outline. The
  // seams carry the drawing here. The faces only give it volume.
  const ink = (light) => 0.06 + 0.94 * clamp01(dark ? light : 1.06 - light);

  let out = 0;
  let live = false;

  /* ---- the saucer, drawn first so the cup sits on top of it ---- */
  const sd = ellipseDist(x, y - SAUCER_Y, SAUCER_RX, SAUCER_RY);
  if (sd < SEAM) {
    // Outline only. Given tone as well it read as a second bowl under the
    // first, and a saucer seen this close to edge on has almost none anyway.
    if (Math.abs(sd) < SEAM) out = Math.max(out, 0.9);
  }

  /* ---- the handle: an elliptical ring, clipped to outside the bowl ---- */
  if (x > halfWidth(y) - SEAM * 1.5) {
    const ho = ellipseDist(x - HANDLE_X, y - HANDLE_Y, HANDLE_RX, HANDLE_RY);
    const hi = ellipseDist(
      x - HANDLE_X,
      y - HANDLE_Y,
      HANDLE_RX * (1 - HANDLE_T),
      HANDLE_RY * (1 - HANDLE_T),
    );
    if (Math.abs(ho) < SEAM || Math.abs(hi) < SEAM) {
      out = Math.max(out, 1);
    } else if (ho < 0 && hi > 0) {
      // The ring's own roundness: lit on its outer edge, shaded within.
      const band = clamp01(-ho / (HANDLE_RX * HANDLE_T));
      out = Math.max(out, ink(0.8 - 0.6 * band) * 0.85);
    }
  }

  /* ---- the bowl ---- */
  if (y >= RIM_Y - RIM_RY - SEAM && y <= BASE_Y + BASE_RY + SEAM) {
    const hw = halfWidth(y);
    const u = x / hw;
    const lip = lipAt(x);

    // The foot: the near arc of the base only. The far arc is inside the cup
    // and draws as a line straight across it.
    if (y > BASE_Y) {
      const bd = ellipseDist(x, y - BASE_Y, BASE_RX, BASE_RY);
      if (Math.abs(bd) < SEAM) out = Math.max(out, 1);
    }

    if (Math.abs(u) <= 1.06 && y <= BASE_Y + SEAM) {
      const wall = hw - Math.abs(x);

      if (Math.abs(wall) < SEAM && y > lip - SEAM) {
        out = Math.max(out, 1);
      } else if (wall > 0 && y > lip) {
        // The body of the cup, below the front of the rim. Scaled back so the
        // shaded side never competes with the coffee or the seams.
        out = Math.max(out, ink(bowlLight(u)) * 0.72);
      }
    }

    /* ---- the rim, and the coffee inside it ---- */
    const rd = ellipseDist(x, y - RIM_Y, RIM_RX, RIM_RY);
    if (rd < SEAM) {
      if (Math.abs(rd) < SEAM) {
        out = Math.max(out, 1);
      } else {
        // The surface of the coffee. The darkest thing in the drawing, and the
        // one place the grounds actually swirl: the sample point is pushed on
        // both axes at different rates so the pattern turns over rather than
        // sliding past.
        const swirl = noise(x * 5.5 + Math.sin(t * 0.17) * 1.3, y * 13 - t * 0.23);
        const grain = noise(x * 13 - t * 0.09, y * 26 + t * 0.06);
        // Denser toward the back of the mouth, where you are looking across
        // the surface rather than down into it.
        const back = clamp01(0.5 - (y - RIM_Y) / (2 * RIM_RY));
        out = Math.max(out, clamp01((0.52 + 0.4 * back) * (0.55 + 0.7 * swirl) + grain * 0.16));
        live = true;
      }
    }
  }

  /* ---- the steam ---- */
  if (y < RIM_Y - RIM_RY && y > RIM_Y - STEAM_RISE) {
    const above = (RIM_Y - y) / STEAM_RISE; // 0 at the rim, 1 at the top
    const across = x / (RIM_RX * 1.05);
    if (Math.abs(across) < 1.25) {
      const mouth = Math.cos(clamp(across, -1, 1) * 1.22);
      const rise = (1 - above) ** 1.7;
      const wob = 0.5 + 0.5 * Math.sin(x * 7.5 + t * 0.95 - above * 5.2);
      const n = noise(x * 4.2 + Math.sin(t * 0.22) * 0.7, y * 5.4 - t * 0.8);
      const d = clamp01(mouth * rise * wob * (0.3 + 1.35 * n) * 0.98);
      if (d > out) {
        out = d;
        live = true;
      }
    }
  }

  return out <= 0.012 ? null : { ink: out, live };
}

/* --------------------------------------------------------------- the colour */

/** #rrggbb to [r, g, b]. The ramp lives in CSS so the dark theme can move it. */
function readHex(value) {
  const hex = String(value).trim().replace('#', '');
  if (hex.length !== 6) return null;
  const n = parseInt(hex, 16);
  return Number.isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * One rgba string per ramp step, built from the four brown stops in CSS.
 *
 * The strength climbs with density as well as the colour: the dense end is
 * espresso at full weight so the cup reads, the sparse end is tan at a
 * fraction of it so a fortune can be set over the top. One flat alpha across
 * the whole drawing gave a cup you could not make out and steam you could.
 */
function buildPalette(el) {
  const cs = getComputedStyle(el);
  const stops = ['--ascii-1', '--ascii-2', '--ascii-3', '--ascii-4']
    .map((name) => readHex(cs.getPropertyValue(name)))
    .filter(Boolean);

  const base = stops.length ? stops : [[51, 38, 27]];
  const master = parseFloat(cs.getPropertyValue('--ascii-opacity')) || 0.3;

  // Sparse end tan, dense end espresso.
  const ladder = [base[2] || base[0], base[1] || base[0], base[3] || base[0], base[0]];

  return RAMP.map((_, i) => {
    const f = i / (RAMP.length - 1);
    const seat = clamp(Math.floor(f * ladder.length), 0, ladder.length - 1);
    const [r, g, b] = ladder[seat];
    const alpha = clamp01(master * (0.55 + 1.65 * f));
    return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
  });
}

/* --------------------------------------------------------------- the render */

/**
 * Draw the cup.
 *
 * The canvas is the viewport; the cup is placed near the bottom of it, saucer
 * on the edge like a cup on a table, so the steam is what rises behind the
 * reading. Centred, it landed under the headline and the upload tile, where a
 * raised opaque surface covered exactly the half that made it read as a cup.
 */
export function startAsciiCup(canvas, { reduced = false } = {}) {
  if (!canvas || !canvas.getContext) return () => {};

  const g = canvas.getContext('2d', { alpha: true });
  if (!g) return () => {};

  const view = {
    w: 0, h: 0, dpr: 1,
    cols: 0, rows: 0, cw: 0, ch: 0,
    cx: 0, cy: 0, scale: 1, dot: 1, font: '',
    palette: [], dark: false,
  };

  const mono =
    getComputedStyle(canvas).fontFamily ||
    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  /** Lay the grid out for the current viewport. Cheap, and rarely run. */
  function measure() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (!w || !h) return false;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.w = w;
    view.h = h;
    view.dpr = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    // The cup's full width, saucer to saucer, and the character size that
    // puts CELLS_ACROSS of them over it. Three quarters of the viewport, not
    // all of it: at full width the drawing stopped being a cup on a page and
    // became a wall of characters the page was sitting on.
    const cupW = clamp(w * 0.76, 260, 520);
    view.scale = cupW / 2;

    const size = cupW / CELLS_ACROSS / CELL_W;
    view.cw = size * CELL_W;
    view.ch = size * CELL_H;
    view.font = `500 ${size.toFixed(2)}px ${mono}`;
    // A halftone: the dot's area follows the density, up to nearly touching
    // its neighbours where the drawing is fullest.
    view.dot = Math.min(view.cw, view.ch) * 0.46;

    view.cols = Math.ceil(w / view.cw) + 1;
    view.rows = Math.ceil(h / view.ch) + 1;

    view.cx = w / 2;
    view.cy = h - Math.max(14, h * 0.025) - BOTTOM * view.scale;

    // Which way the lighting reads: is the ink lighter than the paper?
    const ink = readHex(getComputedStyle(canvas).getPropertyValue('--ascii-1')) || [51, 38, 27];
    const paper = readHex(getComputedStyle(document.body).getPropertyValue('--paper')) || [
      236, 230, 219,
    ];
    const lum = (c) => c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
    view.dark = lum(ink) > lum(paper);
    view.palette = buildPalette(canvas);
    return true;
  }

  /** One frame. */
  function paint(t, deal) {
    const { cols, rows, cw, ch, cx, cy, scale, dpr, palette, dark, dot } = view;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, view.w, view.h);
    g.font = view.font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    const top = RAMP.length - 1;
    // Sized from the grid, so the lines stay one cell wide at any zoom.
    const seam = seamFor(cw / scale);
    let fill = '';

    // The rows the drawing can possibly touch, so the empty sky above the
    // steam costs nothing at all.
    const firstRow = Math.max(0, Math.floor((cy + (TOP - STEAM_RISE) * scale) / ch) - 1);
    const lastRow = Math.min(rows, Math.ceil((cy + BOTTOM * scale) / ch) + 1);

    for (let j = firstRow; j < lastRow; j++) {
      const py = (j + 0.5) * ch;
      const y = (py - cy) / scale;

      for (let i = 0; i < cols; i++) {
        // Odd rows sit half a cell across: a halftone screen, not stripes.
        const px = (i + 0.5 + (j & 1) * 0.5) * cw;
        const x = (px - cx) / scale;
        if (x < -1.12 || x > 1.3) continue;

        const cell = sample(x, y, t, dark, seam);
        if (!cell) continue;

        const d = cell.ink;

        // The live part shimmers, the cup holds still.
        let u = d * top + 0.5;
        if (cell.live && d > COLD) {
          u += (dealHash(j * cols + i, deal) - 0.5) * 1.7 * Math.min(1, d * 2);
        }
        const idx = clamp(Math.floor(u), 0, top);
        if (idx <= 0) continue;

        const next = palette[idx];
        if (next !== fill) {
          fill = next;
          g.fillStyle = fill;
        }

        // The sparse end is a real dot, sized by area, so tone runs down to
        // nothing instead of stopping where the first glyph does.
        if (idx === 1) {
          g.beginPath();
          g.arc(px, py, Math.max(0.4, dot * Math.sqrt(d)), 0, Math.PI * 2);
          g.fill();
        } else {
          g.fillText(RAMP[idx], px, py);
        }
      }
    }
  }

  let raf = 0;
  let deal = 0;
  let lastDeal = 0;
  let lastFrame = -Infinity;
  const started = performance.now();

  function draw(now) {
    const t = (now - started) / 1000;
    if (t - lastDeal > DEAL_S) {
      lastDeal = t;
      deal++;
    }
    paint(t, deal);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastFrame < 1000 / FPS) return;
    lastFrame = now;
    draw(now);
  }

  // The viewport box, and the theme. Neither is input: one is layout and the
  // other is a flip of an attribute on <html>. There is no pointer, mouse,
  // touch, wheel, scroll or key listener in this file, and there must not be.
  const relayout = () => {
    if (measure()) draw(performance.now());
  };

  const ro = new ResizeObserver(relayout);
  ro.observe(canvas);

  const mo = new MutationObserver(relayout);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (!measure()) return () => {};

  if (reduced) {
    draw(performance.now());
  } else {
    raf = requestAnimationFrame(loop);
  }

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    mo.disconnect();
  };
}
