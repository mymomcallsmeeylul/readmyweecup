/**
 * The reading moment.
 *
 * A canvas of coffee grounds seen from directly above: they arrive agitated,
 * spin in a vortex that loses its energy the way real liquid does, drift out
 * toward the wall of the cup, and settle. Every so often a shape surfaces in
 * the sediment for a couple of seconds and sinks again.
 *
 * This is deliberately not a progress indicator. It never claims to know how
 * long the read will take. It only shows that something is happening in the
 * cup, which is the honest version and also the better one.
 */

const BG_TOP = '#4d3626';
const BG_MID = '#25190f';
const BG_LOW = '#120b07';
const TRAIL_ALPHA = 0.155; // how quickly the previous frame is wiped
const POUR_MS = 1100;

export function createGrounds(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let dpr = 1;
  let size = 0; // css px, square
  let R = 0; // pool radius in device px
  let cx = 0;
  let cy = 0;

  let bg = document.createElement('canvas');
  let particles = [];
  let symbols = [];

  let raf = 0;
  let running = false;
  let startedAt = 0;
  let last = 0;
  let nextSymbolAt = 1800;

  let settling = false;
  let settleStart = 0;
  const SETTLE_MS = 900;

  /* ------------------------------------------------------------- geometry */

  function measure() {
    const rect = canvas.getBoundingClientRect();
    const next = Math.max(1, Math.min(rect.width, rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = next;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    cx = canvas.width / 2;
    cy = canvas.height / 2;
    R = Math.min(cx, cy) * 0.96;

    paintBackdrop();
  }

  function paintBackdrop() {
    bg.width = canvas.width;
    bg.height = canvas.height;
    const b = bg.getContext('2d');

    b.clearRect(0, 0, bg.width, bg.height);
    b.save();
    b.beginPath();
    b.arc(cx, cy, R, 0, Math.PI * 2);
    b.clip();

    // Light falls from the upper left, the way it does over a kitchen table.
    const grad = b.createRadialGradient(
      cx - R * 0.34,
      cy - R * 0.4,
      R * 0.06,
      cx,
      cy,
      R * 1.18,
    );
    grad.addColorStop(0, BG_TOP);
    grad.addColorStop(0.46, BG_MID);
    grad.addColorStop(1, BG_LOW);
    b.fillStyle = grad;
    b.fillRect(0, 0, bg.width, bg.height);

    // Porcelain curving away at the edge.
    const vign = b.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
    vign.addColorStop(0, 'rgba(0,0,0,0)');
    vign.addColorStop(1, 'rgba(0,0,0,0.55)');
    b.fillStyle = vign;
    b.fillRect(0, 0, bg.width, bg.height);
    b.restore();
  }

  /* ------------------------------------------------------------ particles */

  function seed() {
    const count = Math.round(Math.min(680, Math.max(280, (size * size) / 190)));
    particles = Array.from({ length: count }, () => {
      // Most grounds end up thrown against the wall; some stay at the bottom.
      const outer = Math.random() < 0.72;
      return {
        a: Math.random() * Math.PI * 2,
        r: 1.05 + Math.random() * 0.5, // start outside, sweep in
        tr: outer ? 0.58 + Math.random() * 0.4 : Math.random() * 0.5,
        spin: 0.55 + Math.random() * 0.9,
        wob: 0.6 + Math.random() * 1.8,
        ph: Math.random() * Math.PI * 2,
        size: 0.5 + Math.random() * Math.random() * 2.4,
        tone: Math.random(),
        alpha: 0,
        delay: Math.random() * POUR_MS * 0.8,
      };
    });
    symbols = [];
    nextSymbolAt = 1800;
  }

  /* -------------------------------------------------------------- symbols */

  /** Shapes a reader would name, drawn as paths in unit space. */
  const SHAPES = {
    bird: (t) => {
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const u = (i / 20) * 2 - 1;
        pts.push([u, -0.42 * Math.cos(u * 1.9) + 0.34 * Math.abs(u) - 0.1]);
      }
      return pts;
    },
    spiral: () => {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const u = (i / 60) * Math.PI * 3.4;
        const rr = 0.12 + u * 0.14;
        pts.push([Math.cos(u) * rr, Math.sin(u) * rr]);
      }
      return pts;
    },
    path: () => {
      const pts = [];
      for (let i = 0; i <= 32; i++) {
        const u = i / 32;
        pts.push([u * 2 - 1, Math.sin(u * 5.2) * 0.22 + Math.sin(u * 2.1) * 0.16]);
      }
      return pts;
    },
    ring: () => {
      const pts = [];
      for (let i = 0; i <= 44; i++) {
        const u = 0.55 + (i / 44) * (Math.PI * 2 - 1.1);
        pts.push([Math.cos(u), Math.sin(u)]);
      }
      return pts;
    },
    ladder: () => {
      const pts = [];
      for (let i = 0; i <= 4; i++) {
        const y = -1 + (i / 4) * 2;
        pts.push([-0.42, y], [0.42, y], [0.42, y + 0.02], [-0.42, y + 0.02]);
      }
      return pts;
    },
  };

  const SHAPE_KEYS = Object.keys(SHAPES);

  function surface(now) {
    const key = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.12 + Math.random() * 0.42;
    symbols.push({
      pts: SHAPES[key](),
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      scale: 0.2 + Math.random() * 0.22,
      rot: Math.random() * Math.PI * 2,
      born: now,
      life: 2400 + Math.random() * 900,
    });
    nextSymbolAt = now + 2200 + Math.random() * 1600;
  }

  /* ----------------------------------------------------------------- draw */

  function frame(now) {
    if (!running) return;

    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const elapsed = now - startedAt;

    // Energy bleeds out of the swirl over about eight seconds.
    const decay = Math.exp(-elapsed / 4200);
    let swirl = 0.35 + 2.5 * decay;

    let settleT = 0;
    if (settling) {
      settleT = Math.min(1, (now - settleStart) / SETTLE_MS);
      swirl += 3.4 * (1 - settleT) * settleT * 4; // one last turn as it closes
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // Fade the last frame back toward the pool, leaving trails in the liquid.
    ctx.globalAlpha = TRAIL_ALPHA;
    ctx.drawImage(bg, 0, 0);
    ctx.globalAlpha = 1;

    for (const p of particles) {
      if (elapsed < p.delay) continue;
      p.alpha = Math.min(1, p.alpha + dt * 2.4);

      // Inner grounds turn faster than the ones pinned to the wall.
      p.a += swirl * p.spin * (0.4 + 0.8 * (1 - Math.min(1, p.r))) * dt;

      const target = settling ? 0.1 + p.tr * 0.18 : p.tr;
      p.r += (target - p.r) * 1.6 * dt;
      p.r += Math.sin(now / 1000 * p.wob + p.ph) * 0.0016;

      const alpha = p.alpha * (settling ? 1 - settleT : 1);
      if (alpha <= 0.01) continue;

      const x = cx + Math.cos(p.a) * p.r * R;
      const y = cy + Math.sin(p.a) * p.r * R;

      // A little colour variance so the sediment is not one flat brown.
      const shade = p.tone < 0.72 ? '18,11,7' : '78,49,29';
      ctx.fillStyle = `rgba(${shade},${(0.5 + p.tone * 0.45) * alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shapes rising out of the sediment.
    if (!settling && now > nextSymbolAt) surface(now);

    ctx.globalCompositeOperation = 'lighter';
    for (let i = symbols.length - 1; i >= 0; i--) {
      const s = symbols[i];
      const t = (now - s.born) / s.life;
      if (t >= 1) {
        symbols.splice(i, 1);
        continue;
      }
      const fade = Math.sin(t * Math.PI) * 0.3 * (settling ? 1 - settleT : 1);
      if (fade <= 0.01) continue;

      ctx.save();
      ctx.translate(cx + s.x * R, cy + s.y * R);
      ctx.rotate(s.rot);
      ctx.scale(s.scale * R, s.scale * R);
      ctx.beginPath();
      s.pts.forEach(([px, py], i2) => (i2 ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.restore();

      ctx.strokeStyle = `rgba(224,188,132,${fade})`;
      ctx.lineWidth = 1.15 * dpr;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    drawRim(now, settling ? settleT : 0);

    raf = requestAnimationFrame(frame);
  }

  function drawRim(now, brighten) {
    ctx.save();
    ctx.lineWidth = Math.max(1, dpr);

    ctx.strokeStyle = `rgba(246,241,233,${0.18 + brighten * 0.3})`;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // A single point of light travelling the rim: the cup being turned.
    const head = (now / 5200) * Math.PI * 2;
    const arc = 0.9;
    const glow = ctx.createLinearGradient(
      cx + Math.cos(head) * R,
      cy + Math.sin(head) * R,
      cx + Math.cos(head + arc) * R,
      cy + Math.sin(head + arc) * R,
    );
    glow.addColorStop(0, 'rgba(224,188,132,0)');
    glow.addColorStop(0.5, `rgba(224,188,132,${0.65 + brighten * 0.35})`);
    glow.addColorStop(1, 'rgba(224,188,132,0)');
    ctx.strokeStyle = glow;
    ctx.lineWidth = Math.max(1.5, dpr * 1.5);
    ctx.beginPath();
    ctx.arc(cx, cy, R, head, head + arc);
    ctx.stroke();
    ctx.restore();
  }

  /** One composed frame, for people who asked the OS for less movement. */
  function drawStatic() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    for (const p of particles) {
      const x = cx + Math.cos(p.a) * p.tr * R;
      const y = cy + Math.sin(p.a) * p.tr * R;
      const shade = p.tone < 0.72 ? '18,11,7' : '78,49,29';
      ctx.fillStyle = `rgba(${shade},${0.5 + p.tone * 0.45})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    drawRim(0, 0);
  }

  /* ------------------------------------------------------------------ api */

  const onResize = () => {
    measure();
    if (reduced) drawStatic();
  };

  let observer = null;

  return {
    start() {
      measure();
      seed();
      settling = false;

      if (reduced) {
        drawStatic();
        return;
      }

      running = true;
      startedAt = performance.now();
      last = startedAt;
      nextSymbolAt = startedAt + 1600;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);

      if ('ResizeObserver' in window) {
        observer = new ResizeObserver(onResize);
        observer.observe(canvas);
      } else {
        window.addEventListener('resize', onResize);
      }
    },

    /** Pull everything to the centre and fade out. Resolves when it is done. */
    settle() {
      if (reduced || !running) return Promise.resolve();
      settling = true;
      settleStart = performance.now();
      return new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    },

    stop() {
      running = false;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      observer = null;
      window.removeEventListener('resize', onResize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
