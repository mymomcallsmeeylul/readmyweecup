/**
 * The share card.
 *
 * 1080x1350 (4:5), which survives being posted anywhere without a crop eating
 * the closing line. Per the design system: a --coffee ground with --on-dark
 * text, the fortune in IM Fell English italic, one Fragment Mono meta line,
 * left-aligned like the rest of the app. Flat — no gradients, no shadows, no
 * grain, and the one permitted ink blot sitting static behind the fortune.
 *
 * The stack is measured before it is drawn, so a two-word omen and a long one
 * both sit properly instead of leaving a hole at the bottom.
 */

const W = 1080;
const H = 1350;

/* Tokens, mirrored. These are the only values the card knows about. */
const COFFEE = '#33261B';
const ON_DARK = '#F1EADB';
const SPACE_24 = 96; /* --space-24, the card margin */
const SPACE_12 = 48;
const SPACE_8 = 32;
const SPACE_6 = 24;

const DISPLAY = "'IM Fell English', Georgia, serif";
const MONO = "'Fragment Mono', ui-monospace, monospace";

const BLOT =
  'M120 10c24 8 26 34 40 52s36 24 34 46-24 28-34 46-14 40-36 42-32-20-52-28-42-4-48-26 14-34 16-56S96 2 120 10Z';

export async function renderShareCard(reading, t = (k) => k) {
  await ensureFonts();

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillStyle = COFFEE;
  ctx.fillRect(0, 0, W, H);

  const left = SPACE_24;
  const measure = W - SPACE_24 * 2;

  /* --- measure ------------------------------------------------------- */

  const omen = plan(ctx, reading.omen, `400 52px ${DISPLAY}`, measure, 60);

  let closing = null;
  for (let size = 78; size >= 44; size -= 4) {
    closing = plan(ctx, reading.closing, `400 italic ${size}px ${DISPLAY}`, measure, size * 1.22);
    if (closing.height <= 520) break;
  }

  const stack = omen.height + SPACE_8 + 1 + SPACE_12 + closing.height;
  const fieldTop = SPACE_24 + SPACE_12;
  const fieldBottom = H - SPACE_24 - SPACE_12;
  let y = fieldTop + Math.max(0, (fieldBottom - fieldTop - stack) / 2);

  /* --- draw ---------------------------------------------------------- */

  blot(ctx, y);

  ctx.fillStyle = ON_DARK;
  y = draw(ctx, omen, left, y);
  y += SPACE_8;

  ctx.globalAlpha = 0.32;
  ctx.fillRect(left, y, 120, 1);
  ctx.globalAlpha = 1;
  y += 1 + SPACE_12;

  draw(ctx, closing, left, y);

  /* --- meta ---------------------------------------------------------- */

  ctx.font = `400 22px ${MONO}`;
  ctx.globalAlpha = 0.56;
  tracked(ctx, 'DESTINY', left, SPACE_24, 22, 0.07);

  // Written-out labels, in the language being read: the raw key would print
  // "RIGHT-OF-HANDLE" on a card someone is about to send to a friend.
  const regions = (reading.symbols || [])
    .filter((s) => s.region)
    .map((s) => t(`region.${s.region}`).toUpperCase());
  const footer = regions.join(' · ');
  tracked(ctx, footer, left, H - SPACE_24 - SPACE_6, 22, 0.07);
  ctx.globalAlpha = 1;

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { dataUrl, blob };
}

/* ------------------------------------------------------------------ pieces */

/** One ink blot, static, behind the fortune. Never a field of them. */
function blot(ctx, top) {
  const size = 560;
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = ON_DARK;
  // Sits to the right and bleeds off the edge, so it reads as a stain on the
  // paper rather than a decoration placed on it.
  ctx.translate(W - size * 0.72, Math.max(SPACE_24, top - SPACE_12));
  ctx.scale(size / 200, size / 200);
  ctx.fill(new Path2D(BLOT));
  ctx.restore();
}

/* ------------------------------------------------------------------ layout */

function plan(ctx, text, font, maxWidth, lead) {
  ctx.font = font;
  const lines = wrap(ctx, text, maxWidth);
  return { lines, font, lead, height: lines.length * lead };
}

function draw(ctx, block, left, top) {
  ctx.font = block.font;
  block.lines.forEach((line, i) => ctx.fillText(line, left, top + i * block.lead));
  return top + block.height;
}

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Canvas letter-spacing is not universal, so the meta labels are drawn out. */
function tracked(ctx, text, x, y, size, em) {
  const spacing = size * em;
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
}

/** Canvas draws whatever is loaded at the moment it draws. Wait for the faces. */
async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`400 52px ${DISPLAY}`),
      document.fonts.load(`400 italic 78px ${DISPLAY}`),
      document.fonts.load(`400 22px ${MONO}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* Fall back to the stacks in DISPLAY/MONO. The card still renders. */
  }
}
