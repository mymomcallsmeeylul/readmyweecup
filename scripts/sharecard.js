/**
 * The share card.
 *
 * 1080x1350 (4:5), which survives being posted anywhere without a crop eating
 * the closing line. The closing line is the largest thing on the card because
 * it is the part people actually send to each other.
 *
 * The stack is measured before it is drawn and then centred between the header
 * and the footer, so a two-word omen and a long one both sit properly on the
 * card instead of leaving a hole at the bottom.
 */

const W = 1080;
const H = 1350;

const HEADER_Y = 96;
const FIELD_TOP = 190; // below the wordmark
const FIELD_BOTTOM = H - 190; // above the footer

const PORCELAIN = '#f6f1e9';
const GOLD = '#e0bc84';
const COPPER = '#c0703f';

const DISPLAY = "'Fraunces', Georgia, serif";
const UI = "'Inter', system-ui, sans-serif";

const CUP_R = 100;
const GAP_CUP = 62;
const GAP_OMEN = 34;
const GAP_SYMBOLS = 44;
const GAP_RULE = 54;
const SYMBOL_LEAD = 34;

export async function renderShareCard(reading) {
  await ensureFonts();

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  backdrop(ctx);
  wordmark(ctx);
  footer(ctx);

  /* --- measure ------------------------------------------------------- */

  const field = FIELD_BOTTOM - FIELD_TOP;
  const symbolLines = (reading.symbols || [])
    .slice(0, 3)
    .map((s) => `${String(s.region).toUpperCase()}  ${s.shape}`);
  const symbolsH = symbolLines.length ? (symbolLines.length - 1) * SYMBOL_LEAD + 24 : 0;

  const omenSize = reading.omen.length > 26 ? 58 : 68;
  const omen = plan(ctx, reading.omen, `300 ${omenSize}px ${DISPLAY}`, W - 200, omenSize * 1.12);

  const fixed =
    CUP_R * 2 + GAP_CUP + omen.height + GAP_OMEN + symbolsH + GAP_SYMBOLS + 1 + GAP_RULE;

  // The closing shrinks to fit whatever is left, never the other way round.
  let closing = null;
  for (let size = 60; size >= 32; size -= 3) {
    closing = plan(ctx, reading.closing, `300 italic ${size}px ${DISPLAY}`, W - 190, size * 1.26);
    if (fixed + closing.height <= field) break;
  }

  const total = fixed + closing.height;
  let y = FIELD_TOP + Math.max(0, (field - total) / 2);

  /* --- draw ---------------------------------------------------------- */

  cupMark(ctx, y);
  y += CUP_R * 2 + GAP_CUP;

  y = draw(ctx, omen, y, PORCELAIN);
  y += GAP_OMEN;

  ctx.font = `500 20px ${UI}`;
  symbolLines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? 'rgba(192,112,63,0.95)' : 'rgba(246,241,233,0.42)';
    ctx.fillText(truncate(ctx, line, W - 200), W / 2, y + i * SYMBOL_LEAD);
  });
  y += symbolsH + GAP_SYMBOLS;

  ctx.strokeStyle = 'rgba(246,241,233,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 54, y + 0.5);
  ctx.lineTo(W / 2 + 54, y + 0.5);
  ctx.stroke();
  y += 1 + GAP_RULE;

  draw(ctx, closing, y, GOLD);

  grain(ctx);

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { dataUrl, blob };
}

/* ------------------------------------------------------------------ pieces */

function backdrop(ctx) {
  ctx.fillStyle = '#0b0908';
  ctx.fillRect(0, 0, W, H);

  const warm = ctx.createRadialGradient(W / 2, -120, 40, W / 2, H * 0.38, W * 0.92);
  warm.addColorStop(0, 'rgba(192,112,63,0.20)');
  warm.addColorStop(0.5, 'rgba(69,48,31,0.09)');
  warm.addColorStop(1, 'rgba(11,9,8,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);

  const floor = ctx.createLinearGradient(0, H * 0.5, 0, H);
  floor.addColorStop(0, 'rgba(6,5,4,0)');
  floor.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, W, H);
}

function wordmark(ctx) {
  ctx.fillStyle = 'rgba(246,241,233,0.4)';
  ctx.font = `500 22px ${UI}`;
  tracked(ctx, 'DESTINY', W / 2, HEADER_Y, 7);
}

function footer(ctx) {
  ctx.fillStyle = COPPER;
  ctx.beginPath();
  ctx.arc(W / 2, H - 128, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(246,241,233,0.3)';
  ctx.font = `500 19px ${UI}`;
  tracked(ctx, 'READ MY WEE CUP', W / 2, H - 96, 4);
}

/** The same cup that runs through the app, drawn small. */
function cupMark(ctx, top) {
  const cx = W / 2;
  const cy = top + CUP_R;
  const r = CUP_R;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const pool = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r * 1.15);
  pool.addColorStop(0, '#553d2a');
  pool.addColorStop(0.5, '#281b11');
  pool.addColorStop(1, '#120b07');
  ctx.fillStyle = pool;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Settled grounds. Seeded, so the same reading always draws the same cup.
  let s = 1337;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 1100; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = Math.pow(rnd(), 0.45) * r * 0.99;
    ctx.fillStyle = rnd() < 0.74 ? 'rgba(16,10,6,0.7)' : 'rgba(92,60,36,0.5)';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 0.5 + rnd() * rnd() * 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const vign = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,0.68)');
  ctx.fillStyle = vign;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  ctx.strokeStyle = 'rgba(246,241,233,0.24)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(246,241,233,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
  ctx.stroke();
}

function grain(ctx) {
  const n = 220;
  const noise = document.createElement('canvas');
  noise.width = n;
  noise.height = n;
  const nctx = noise.getContext('2d');
  const img = nctx.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 135;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.22;
  for (let x = 0; x < W; x += n) {
    for (let y = 0; y < H; y += n) ctx.drawImage(noise, x, y);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ layout */

function plan(ctx, text, font, maxWidth, lead) {
  ctx.font = font;
  const lines = wrap(ctx, text, maxWidth);
  return { lines, font, lead, height: lines.length * lead };
}

function draw(ctx, block, top, color) {
  ctx.font = block.font;
  ctx.fillStyle = color;
  block.lines.forEach((line, i) => ctx.fillText(line, W / 2, top + i * block.lead));
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

function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 4 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

/** Canvas has no letter-spacing everywhere we care about, so draw it. */
function tracked(ctx, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = align;
}

/** Canvas draws whatever is loaded at the moment it draws. Wait for the faces. */
async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`300 68px ${DISPLAY}`),
      document.fonts.load(`300 italic 60px ${DISPLAY}`),
      document.fonts.load(`500 20px ${UI}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* Fall back to the stack in DISPLAY/UI. The card still renders. */
  }
}
