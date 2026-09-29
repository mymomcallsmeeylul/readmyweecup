# Destiny — Design System & Build Brief

A design language for **Destiny**, a Turkish coffee fortune-reading web app (mobile-first, also desktop). Warm, quiet, monochrome-plus-espresso, with an antique serif voice. This document is the source of truth.

> **For Claude Code:** Treat every token and rule here as binding. Paste the `:root` block in §2 verbatim and reference the variables; do not hardcode hex values, invent colors, add hues, or introduce shadows/gradients. **All corner radii and all padding/margin values must be divisible by 4px** — use the spacing and radius tokens, never off-grid numbers. When a spec here and your instinct disagree, follow the spec.

---

## 1. Principles

1. **Warm and quiet.** One warm neutral family from near-white to near-black, plus a single espresso brown. No accent hue.
2. **The type carries the personality.** The antique serif for the fortune is the one expressive move; everything else stays plain.
3. **Flat and still.** No moving texture, no ambient animation, no heavy shadows. Depth comes from the surface scale, not drop shadows.
4. **4px grid, always.** Spacing, padding, and radius are multiples of 4px. This is non-negotiable and keeps the UI tight.
5. **Content-first layout.** One calm column, generous whitespace, left-aligned.

---

## 2. Tokens — paste this verbatim

```css
:root {
  /* ---- Color: warm greige base (paper) ---- */
  --paper:        #ECE6DB;  /* app background */
  --paper-raised: #FCF9F0;  /* inputs, cards, raised surfaces (lighter than paper) */
  --paper-sunken: #DED7CB;  /* message bubbles, wells (darker than paper) */

  /* ---- Color: text (two warm darks, no gray-blue) ---- */
  --ink:       #17130B;  /* primary: wordmark, headings, UI, buttons */
  --ink-soft:  #5D574D;  /* medium: sub-labels, secondary UI */
  --ink-faint: #948A7B;  /* muted: placeholders, meta labels, inactive nav */
  --coffee:    #33261B;  /* espresso: the reading + body copy; also a dark feature ground */

  /* ---- Color: lines + inverse ---- */
  --line:    #D3CDC1;  /* hairline dividers, borders */
  --on-dark: #F1EADB;  /* cream text on --ink / --coffee surfaces */

  /* ---- Type ---- */
  --font-title:   "Bricolage Grotesque", "Familjen Grotesk", system-ui, sans-serif; /* titles */
  --font-display: "IM Fell English", Georgia, serif;         /* the fortune's own voice */
  --font-ui:      "Familjen Grotesk", system-ui, sans-serif;  /* interface + body */
  --font-mono:    "Fragment Mono", ui-monospace, monospace;   /* meta labels + the ASCII field */
  --weight-title: 600;

  --text-xs:  0.80rem;  /* meta labels (mono) */
  --text-sm:  0.90rem;  /* captions, secondary */
  --text-base:1.00rem;  /* body */
  --text-md:  1.25rem;
  --text-lg:  1.563rem;
  --text-xl:  1.953rem;
  --text-2xl: 2.441rem;
  --text-3xl: 3.052rem;  /* reveal / wordmark */

  /* ---- Spacing: 4px grid (every value divisible by 4) ---- */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;

  /* ---- Radius: 4px grid (every value divisible by 4) ---- */
  --radius-xs:   4px;
  --radius-sm:   8px;
  --radius-md:   12px;  /* buttons, inputs */
  --radius-lg:   16px;  /* cards */
  --radius-xl:   24px;  /* sheets, large surfaces */
  --radius-pill: 999px; /* chips, follow-up bar */

  /* ---- Layout ---- */
  --container: 640px;  /* max reading width */
  --tap-min:   44px;   /* min touch target */

  /* ---- Motion ---- */
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast:   160ms;
  --dur-base:   240ms;
  --dur-slow:   480ms;
  --dur-ritual: 2600ms; /* the reading wait */
}

/* Optional derived night theme. The reference is light-only, so these are extrapolated. */
[data-theme="dark"] {
  --paper:        #16130E;
  --paper-raised: #211D16;
  --paper-sunken: #100D09;
  --ink:          #ECE8E0;
  --ink-soft:     #ABA69C;
  --ink-faint:    #7C766C;
  --coffee:       #D8C3A8;  /* espresso reads as warm tan on dark for body text */
  --line:         #2C2820;
  --on-dark:      #F1EADB;
}
```

---

## 3. Color usage

- **Background:** `--paper`. Cards and inputs sit on `--paper-raised` (lighter, so they lift). Bubbles/wells use `--paper-sunken` (darker).
- **Text hierarchy:** `--ink` for the wordmark, headings, UI, and buttons; `--coffee` (espresso) for the fortune and body copy; `--ink-faint` for meta and placeholders; `--ink-soft` when you need a mid-weight label. This is a two-tone warm hierarchy — do **not** add gray.
- **Dark surfaces:** a feature card or share card may use `--ink` or `--coffee` as the ground with `--on-dark` text.
- **No accent hue.** Emphasis is weight, size, and ink-vs-espresso — never color. If a stakeholder later wants one accent, add exactly one and use it once per view.
- **Contrast:** `--coffee` on `--paper` and `--ink-faint` on `--paper` both pass AA for their text sizes; keep body at `--text-base` or larger when set in `--ink-faint`.

---

## 4. Typography

Three families, each with one job. Load from Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Familjen+Grotesk:wght@400;500;600&family=Fragment+Mono:ital@0;1&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
```

- **Bricolage Grotesque SemiBold — `--font-title`.** Titles, at weight 600, and titles means exactly two things: the wordmark and the omen. A contemporary grotesque with a slightly irregular skeleton, so it sits beside the letterpress serif without looking like a system font that wandered in. Set `letter-spacing: -0.015em` at display size, where it otherwise sets loose. It ships no true italic, so never ask for one. Color: `--ink`.
- **IM Fell English — `--font-display`.** The voice, and only the voice. A digitization of a 17th-century Oxford letterpress face with irregular, inked edges. Every fortune, the waiting line, the closing, the unreadable note. Italic for the reading is intimate and old-almanac. It has one weight plus italic, so its character comes from size and contrast — set it **26px and up**, and never fake-bold it. Color: `--coffee`.

  It used to carry the wordmark and the omen too. It no longer does: a title is a label on a screen and a fortune is somebody talking, and giving both to one face made the app's own furniture sound like it was in character. The split is the point — the grotesque names things, the serif says them.
- **Familjen Grotesk — `--font-ui`.** All interface text, buttons, body, descriptions. Clean and warm, legible against the antique serif. Weights 400/500/600. Body color `--coffee`; UI labels `--ink` or `--ink-soft`.
- **Fragment Mono — `--font-mono`.** Small meta labels only: symbol counts, tags, timestamps (e.g. `A CUP FOR THE EVENING · 3 SYMBOLS`, `SAVED 2:20 AM`). Uppercase, `letter-spacing: 0.07em`, `--text-xs`, color `--ink-faint`. Never use it for body, headings, or buttons.

**Rules:** sentence case for all real UI and prose; uppercase is reserved for the mono meta labels. Body under 70ch. Line-height: headings `1.05–1.15`, readings `1.30–1.45`, body `1.5`.

---

## 5. Spacing & radius (the 4px grid)

- Every padding, margin, gap, and radius **must** be one of the `--space-*` or `--radius-*` tokens (all divisible by 4). No `10px`, `14px`, `18px`, `15px`, etc.
- Vertical rhythm: stack related blocks with `--space-4` (16px), separate sections with `--space-8` (32px) or `--space-12` (48px).
- Radius by hierarchy: chips/pills use `--radius-pill`; buttons and inputs `--radius-md` (12px); cards `--radius-lg` (16px); sheets and large surfaces `--radius-xl` (24px). Don't put one radius on everything.
- Touch targets ≥ `--tap-min` (44px).

---

## 6. Layout

- Mobile-first, one column. Hold content to `--container` (640px) on desktop and center it; let `--paper` breathe around it.
- Left-align everything except the fortune reveal, which may center for ceremony.
- Screen padding: `--space-6` (24px) on mobile, up to `--space-8` (32px) on wider viewports.

---

## 7. Components

All values below are on-grid. Reuse tokens; don't improvise numbers.

- **Button — primary.** `--ink` fill, `--on-dark` text, `--radius-md`, padding `12px 20px`, `--font-ui` 500, min-height `--tap-min`. Hover: subtle darken via opacity, no color shift.
- **Button — secondary.** Transparent fill, `1px solid --ink` (or `--coffee`), `--ink` text, same radius/padding.
- **Link.** `--ink`, underline, `text-underline-offset: 3px`. No trailing arrows.
- **Follow-up / input bar.** `--paper-raised` fill, `--radius-pill` (or `--radius-lg`), padding `12px 16px`, `--ink-faint` placeholder, `--ink` text, `1px solid --line`. Focus: `1px solid --ink-soft`.
- **Card.** `--paper-raised`, `--radius-lg`, padding `24px`, optional `1px solid --line`, no shadow. Feature/saved-reading card may use `--coffee` ground with `--on-dark` text.
- **Chip / tag.** `--paper-raised` fill, `1px solid --line`, `--radius-pill`, padding `4px 12px`, `--font-ui` 500, `--ink-soft` text. Active: `--ink` fill, `--paper` text.
- **Divider.** `1px solid --line`.
- **Meta label.** `--font-mono`, `--text-xs`, uppercase, `letter-spacing: 0.07em`, `--ink-faint`.
- **Bottom tab bar.** `--paper`, top `1px solid --line`, padding `12px 16px`. Active tab `--ink` with a 2px underline; inactive `--ink-faint`. Simple line icons.
- **Share card (screenshot artifact).** `--coffee` (or `--paper`) ground, the fortune in IM Fell English italic, an optional Fragment Mono meta line, no grain unless enabled. Self-contained and composed.

---

## 8. Texture

Off by default and **never animated**. The reference is flat, so the app is flat.

If you want a faint paper tooth, use a single **static** grain — one inline SVG `feTurbulence` as a `background-image` at very low opacity over `--paper`. No canvas, no loop.

```css
.grain {
  position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 120px; mix-blend-mode: multiply; opacity: 0.04; /* never past ~0.07 */
}
```

### The ASCII field

This replaces the coffee drawings, and it is a deliberate departure from two
rules this document used to state. The reference specified one soft organic
ink-blot behind the reading, static, never a field of them, and §11 said never
to animate texture. Both have been overruled on purpose.

What sits behind the interface now is **a coffee cup, drawn in characters, with
the grounds moving in it.** The technique comes from aquatic-cove: a fixed
character grid rebuilt every frame, a scalar field sampled per cell, and a ramp
from sparse to dense that turns the field into characters.

Three parts, and only two of them move:

| Part | Moves | What it is |
|---|---|---|
| the cup | no | a hand-drawn ASCII stencil, `CUP` in `scripts/ascii.js` |
| the grounds | yes | value noise advected on two axes, denser toward the base |
| the steam | yes | wisps off the rim, wobbling sideways as they climb |

The cup holds still on purpose. A cup that wobbles reads as a rendering fault
rather than as atmosphere, and the shape is the thing that has to stay legible.
The whole grid breathes once every 34 seconds; that is the only motion applied
to the drawing itself.

The constraints:

- **Anchored to the bottom, not centred.** The saucer sits on the edge of the
  screen like a cup on a table and the steam rises behind the reading. Centred,
  it landed under the headline and the upload tile, and a raised opaque surface
  covered exactly the half that made it read as a cup.
- **44 columns, not more.** The viewport's width is spent either on columns or
  on character size. At 54 a phone got 10px glyphs, which read as a texture
  rather than as ASCII art: you could see something was there without seeing it
  was drawn. 44 buys about 13px.
- **One ramp, not a palette.** `--ascii-1` through `--ascii-4` are four stops of
  one brown, espresso through tan.
- **Strength climbs with density.** Eight levels, `.a0` to `.a7`, all scaled off
  `--ascii-opacity`: the walls land near 0.65 so the cup reads, the faintest
  steam near 0.19 so a fortune can be set over it. `.a7` is reserved for the
  stencil. One flat opacity on the whole grid gave a cup you could not make out
  and steam you could.
- **Behind everything, and under the grain.** `z-index: 0`, with `.grain` at 1
  and `.app` at 2.
- **Never interactive.** `pointer-events: none`, no `:hover` or `:focus` rule on
  it, and no event listener in `scripts/ascii.js` at all — aquatic-cove
  disturbs its fluid on touch and this deliberately does not. Nothing the
  seeker does starts, stops, steers or speeds it. No resize handler either: the
  grid is a fixed character count and CSS scales the type.
- **Decorative.** `aria-hidden="true"`, and it carries no meaning the reading
  does not also state in words.
- **14fps, and runs merged.** It is wallpaper: a background that spends a
  phone's battery being smoother than anyone can notice costs more than it is
  worth. Cells are emitted in runs sharing a level class rather than one span
  each, which takes a frame from ~2,200 spans to ~130 and puts the colours in
  CSS where the dark theme can reach them.
- **It stops for reduced motion, it does not disappear.** The script draws one
  frame and never asks for another, and `.ascii__art` sets `animation: none` so
  the blanket `animation-duration: 0.01ms` in §9 cannot snap the breath to the
  end of its keyframe.

---

## 9. Motion

Motion answers actions (open, confirm, reveal); nothing loops or drifts. The one orchestrated moment is the reading: a quiet wait over `--dur-ritual`, then the fortune unfolds line by line on `--dur-slow` with `--ease-out`. Always honor reduced motion:

```css
@media (prefers-reduced-motion: reduce){
  *{ animation-duration:.01ms !important; transition-duration:.01ms !important; }
}
```

---

## 10. Accessibility

- Body text ≥ 16px (`--text-base`). Maintain AA contrast; `--ink-faint` is for short muted labels, not long paragraphs.
- Touch targets ≥ 44px. Visible focus states (`1px solid --ink-soft` minimum).
- Respect `prefers-reduced-motion`. Provide real `alt` text on uploaded/preview images. Label the file input and camera control.

---

## 11. Do / don't

- **Do** keep the app in the warm greige-to-ink scale; use `--coffee` for the reading, body, and dark feature grounds.
- **Do** put every padding and radius on the 4px grid via tokens.
- **Do** let IM Fell English carry the voice; keep everything else plain.
- **Do** set titles — the wordmark and the omen, and nothing else — in Bricolage Grotesque SemiBold.
- **Do** keep surfaces flat. Still, except for the ASCII field.
- **Don't** add a hue accent, gradients, or shadows heavier than a hairline.
- **Don't** use off-grid spacing/radius (no 10/14/15/18px).
- **Don't** animate anything but the ASCII field, and never let it react to the seeker. This rule read "don't animate texture or add looping/ambient motion" and the field is a considered exception to it, not a licence for a second one.
- **Don't** draw the coffee. No cups, no blots, no grounds rendered as shapes: the app is ASCII now.
- **Don't** use Fragment Mono for anything but short meta labels and the ASCII field, or set IM Fell English below 26px.

---

## 12. Build checklist (Claude Code)

- [ ] Add the Google Fonts link and paste the `:root` (and dark) tokens.
- [ ] Background `--paper`; text `--ink` (headings/UI) and `--coffee` (reading/body).
- [ ] Every padding/margin/gap/radius is a `--space-*` / `--radius-*` token (÷4).
- [ ] Wordmark + omen in Bricolage Grotesque 600; fortune in IM Fell English; UI/body in Familjen Grotesk; meta in Fragment Mono.
- [ ] The ASCII field is behind everything, brown, `pointer-events: none`, `aria-hidden`, and static under reduced motion.
- [ ] No accent hue, no gradients, no drop shadows, and no looping motion apart from the field.
- [ ] One column, `--container` max on desktop, 24–32px screen padding.
- [ ] Reduced-motion honored; focus states visible; touch targets ≥ 44px.
