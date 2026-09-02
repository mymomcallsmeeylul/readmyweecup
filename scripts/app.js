import { prepareImage } from './image.js';
import { createGrounds } from './grounds.js';
import { renderShareCard } from './sharecard.js';
import { createAmbient } from './ambient.js';

/* ------------------------------------------------------------------- setup */

const $ = (sel) => document.querySelector(sel);

const SCREENS = {
  landing: 's-landing',
  capture: 's-capture',
  confirm: 's-confirm',
  reading: 's-reading',
  reveal: 's-reveal',
  empty: 's-empty',
};

/** The wait is part of the product. Even a fast answer gets its moment. */
const MIN_READ_MS = 5400;
const LINE_MS = 3400;

const READING_LINES = [
  'The cup is still warm.',
  'The grounds are settling.',
  'Turning the cup toward the light.',
  'Something near the rim is taking shape.',
  'Reading the path down the side.',
  'There is weight at the bottom of this cup.',
  'Waiting for the last of it to fall.',
  'Almost. Do not move the cup.',
];

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  screen: 'landing',
  photo: null, // { dataUrl, width, height }
  reading: null, // the current fortune
  card: null, // Promise<{ dataUrl, blob }>
};

/** Serialises screen changes. A request made mid-transition waits its turn
 *  rather than being dropped, which is what happens when someone picks a photo
 *  before the previous screen has finished leaving. */
let queue = Promise.resolve();

const grounds = createGrounds($('#groundsCanvas'));
const ambient = createAmbient();

/* ----------------------------------------------------------------- routing */

function screenEl(name) {
  return document.getElementById(SCREENS[name]);
}

function go(name, options) {
  queue = queue.then(() => transition(name, options)).catch(() => {});
  return queue;
}

async function transition(name, { push = true } = {}) {
  if (name === state.screen || !SCREENS[name]) return;

  const from = screenEl(state.screen);
  const to = screenEl(name);

  if (push) history.pushState({ screen: name }, '');

  from.classList.add('is-leaving');
  await wait(reduced ? 0 : 260);
  from.hidden = true;
  from.classList.remove('is-leaving');

  state.screen = name;
  to.hidden = false;
  restage(to);
  to.classList.add('is-entering');
  window.scrollTo(0, 0);

  to.setAttribute('tabindex', '-1');
  to.focus({ preventScroll: true });

  await wait(reduced ? 0 : 520);
  to.classList.remove('is-entering');
}

/** Screens are reused, so their entrance animations need re-arming each visit. */
function restage(root) {
  root.querySelectorAll('.stage').forEach((node) => {
    node.style.animation = 'none';
    void node.offsetWidth;
    node.style.animation = '';
  });
}

window.addEventListener('popstate', (event) => {
  const target = event.state?.screen || 'landing';
  go(guard(target), { push: false });
});

/** A screen is only reachable if the thing it displays exists. */
function guard(name) {
  if (name === 'confirm' && !state.photo) return 'capture';
  if (name === 'reveal' && !state.reading) return 'landing';
  if (name === 'reading') return 'capture';
  return name;
}

/* ----------------------------------------------------------------- capture */

const fileCamera = $('#fileCamera');
const fileLibrary = $('#fileLibrary');

// A desktop browser turns `capture` into a plain file picker, which makes two
// buttons that do the same thing. Show the camera only where there is one.
if (!window.matchMedia('(pointer: coarse)').matches) {
  document.querySelectorAll('[data-touch-only]').forEach((n) => n.remove());
  $('#btnLibrary').classList.replace('btn--ghost', 'btn--primary');
}

$('#btnCamera')?.addEventListener('click', () => fileCamera.click());
$('#btnLibrary').addEventListener('click', () => fileLibrary.click());

[fileCamera, fileLibrary].forEach((input) =>
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = ''; // so picking the same photo twice still fires
    if (!file) return;

    try {
      state.photo = await prepareImage(file);
      $('#previewImage').src = state.photo.dataUrl;
      await go('confirm');
    } catch {
      showEmpty({
        omen: 'That Did Not Open',
        note: 'Whatever that file is, the browser could not look inside it. A photograph from the camera roll works best.',
        hint: 'JPEG, PNG or HEIC, straight from your camera.',
      });
    }
  }),
);

/* ------------------------------------------------------------- the reading */

$('#btnRead').addEventListener('click', read);

async function read() {
  if (!state.photo) return go('capture');

  await go('reading');
  grounds.start();
  const stopCopy = rotateCopy();
  const minimum = wait(MIN_READ_MS);

  let payload;
  try {
    const res = await fetch('/api/read', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: state.photo.dataUrl }),
    });
    payload = await res.json();
  } catch {
    payload = null;
  }

  await minimum;
  stopCopy();
  await grounds.settle();
  grounds.stop();

  if (payload?.readable) return showReading(payload);

  showEmpty(
    payload?.omen
      ? payload
      : {
          omen: 'The Cup Went Quiet',
          note: 'Something between here and the grounds stopped speaking. This one is mine, not yours.',
          hint: 'Check your connection and hand me the cup again.',
        },
  );
}

function rotateCopy() {
  const line = $('#readingLine');
  const lines = shuffle([...READING_LINES]);
  let i = 0;

  const show = () => {
    line.textContent = lines[i % lines.length];
    line.classList.remove('is-out');
    line.classList.add('is-in');
  };

  show();
  const timer = setInterval(() => {
    line.classList.remove('is-in');
    line.classList.add('is-out');
    setTimeout(() => {
      i += 1;
      show();
    }, reduced ? 0 : 420);
  }, LINE_MS);

  return () => clearInterval(timer);
}

/* ------------------------------------------------------------------ reveal */

async function showReading(reading) {
  state.reading = reading;

  $('#omen').textContent = reading.omen;
  $('#closing').textContent = reading.closing;
  $('#revealDate').textContent = new Date()
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    .toUpperCase();

  // Indices are spaced, not sequential: the stanzas land like lines of a poem
  // rather than a list rendering.
  const symbols = $('#symbols');
  symbols.innerHTML = '';
  reading.symbols.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'symbol stage';
    row.style.setProperty('--i', String(3 + i));
    row.innerHTML = `
      <span class="symbol__region">${escapeHtml(s.region)}</span>
      <span>
        <span class="symbol__shape">${escapeHtml(s.shape)}</span>
        <span class="symbol__meaning">${escapeHtml(s.meaning)}</span>
      </span>`;
    symbols.append(row);
  });

  const stanzas = $('#stanzas');
  stanzas.innerHTML = '';
  reading.reading.forEach((text, i) => {
    const p = document.createElement('p');
    p.className = 'stanza stage';
    p.style.setProperty('--i', String(7 + i * 2));
    p.textContent = text;
    stanzas.append(p);
  });

  const tail = 7 + reading.reading.length * 2;
  $('#closingBlock').style.setProperty('--i', String(tail));
  $('#demoNote').style.setProperty('--i', String(tail + 1));
  $('#revealActions').style.setProperty('--i', String(tail + 2));
  $('#demoNote').hidden = !reading.demo;

  await go('reveal');

  // Draw the card while they are still reading, so sharing feels instant.
  state.card = renderShareCard(reading).catch(() => null);
}

function showEmpty({ omen, note, hint }) {
  $('#emptyOmen').textContent = omen;
  $('#emptyNote').textContent = note;
  $('#emptyHint').textContent = hint || 'Shoot straight down into the cup, in daylight if you can.';
  return go('empty');
}

/* ------------------------------------------------------------------- share */

const sheet = $('#shareSheet');
const sheetStatus = $('#sheetStatus');

$('#btnShare').addEventListener('click', async () => {
  openSheet();
  say('Drawing your card...');

  const card = await (state.card || renderShareCard(state.reading).catch(() => null));
  if (!card) return say('The card would not draw. The words still copy.');

  $('#shareCard').src = card.dataUrl;
  state.card = Promise.resolve(card);
  say('');
});

$('#btnShareImage').addEventListener('click', async () => {
  const card = await state.card;
  const text = asText(state.reading);

  if (card?.blob) {
    const file = new File([card.blob], 'destiny-reading.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: state.reading.omen });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: state.reading.omen, text });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
  }

  copy(text);
});

$('#btnSaveImage').addEventListener('click', async () => {
  const card = await state.card;
  if (!card) return say('Nothing to save yet.');

  const link = document.createElement('a');
  link.href = card.dataUrl;
  link.download = `${slug(state.reading.omen)}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  say('Saved to your downloads.');
});

$('#btnCopyText').addEventListener('click', () => copy(asText(state.reading)));

$('#btnCloseSheet').addEventListener('click', closeSheet);

sheet.addEventListener('click', (e) => {
  if (e.target === sheet) closeSheet();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !sheet.hidden) closeSheet();
});

function openSheet() {
  sheet.hidden = false;
  $('#btnCloseSheet').focus();
}

function closeSheet() {
  sheet.hidden = true;
  say('');
  $('#btnShare').focus();
}

function say(message) {
  sheetStatus.textContent = message;
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    say('Copied.');
  } catch {
    say('Your browser would not let me copy. Select the text and take it.');
  }
}

function asText(reading) {
  if (!reading) return '';
  return [
    reading.omen,
    '',
    reading.reading.join('\n\n'),
    '',
    `— ${reading.closing}`,
    '',
    `Read your own cup: ${location.origin}`,
  ].join('\n');
}

/* ------------------------------------------------------------------- sound */

const soundToggle = $('#soundToggle');

soundToggle.addEventListener('click', async () => {
  const playing = await ambient.toggle();
  soundToggle.setAttribute('aria-pressed', String(playing));
  $('#soundLabel').textContent = playing ? 'Sound on' : 'Sound off';
});

/* ------------------------------------------------------------ misc wiring */

document.querySelectorAll('[data-go]').forEach((node) =>
  node.addEventListener('click', () => {
    const target = node.dataset.go;
    if (target === 'capture') {
      state.photo = null;
      state.reading = null;
      state.card = null;
    }
    go(target);
  }),
);

history.replaceState({ screen: 'landing' }, '');

/* ----------------------------------------------------------------- helpers */

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'destiny-reading';
}
