import { prepareImages } from './image.js';
import { renderShareCard } from './sharecard.js';
import { createAmbient } from './ambient.js';
import { icon, paintIcons } from './icons.js';

/* ------------------------------------------------------------------- setup */

const $ = (sel) => document.querySelector(sel);

paintIcons();

const SCREENS = {
  main: 's-main',
  reading: 's-reading',
  reveal: 's-reveal',
  empty: 's-empty',
};

/** One cup, photographed up to four times. Not four cups. */
const MAX_PHOTOS = 4;

/** --dur-ritual. The wait is part of the product: even a fast answer waits. */
const RITUAL_MS = 2600;
const LINE_MS = 3200;

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
  screen: 'main',
  photos: [], // [{ dataUrl, width, height }], 1 to 4, all the same cup
  topic: 'general',
  reading: null, // the current fortune
  card: null, // Promise<{ dataUrl, blob }>
};

/** Serialises screen changes. A request made mid-transition waits its turn
 *  rather than being dropped, which is what happens when someone picks a photo
 *  before the previous screen has finished leaving. */
let queue = Promise.resolve();

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
  await wait(reduced ? 0 : 240);
  from.hidden = true;
  from.classList.remove('is-leaving');

  state.screen = name;
  to.hidden = false;
  restage(to);
  to.classList.add('is-entering');
  window.scrollTo(0, 0);

  to.setAttribute('tabindex', '-1');
  to.focus({ preventScroll: true });

  await wait(reduced ? 0 : 480);
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
  go(guard(event.state?.screen || 'main'), { push: false });
});

/** A screen is only reachable if the thing it displays exists. */
function guard(name) {
  if (name === 'reveal' && !state.reading) return 'main';
  if (name === 'reading') return 'main';
  return name;
}

/* ------------------------------------------------------------- the photos */

const picker = $('#filePicker');
const grid = $('#photoGrid');
const hint = $('#photoHint');

$('#btnAddPhotos').addEventListener('click', openPicker);

function openPicker() {
  if (state.photos.length >= MAX_PHOTOS) return;
  picker.value = ''; // so picking the same photo twice still fires
  picker.click();
}

picker.addEventListener('change', async () => {
  const files = Array.from(picker.files || []);
  picker.value = '';
  if (files.length === 0) return;

  try {
    const room = MAX_PHOTOS - state.photos.length;
    const ready = await prepareImages(files, room);
    state.photos = state.photos.concat(ready).slice(0, MAX_PHOTOS);
    renderPhotos();
  } catch {
    showEmpty({
      omen: 'That did not open',
      note: 'Whatever those files are, the browser could not look inside them. A photograph from the camera roll works best.',
      hint: 'JPEG, PNG or HEIC, straight from your camera.',
    });
  }
});

/**
 * The main screen has two states and one set of markup. Empty: a single tile
 * that opens the gallery. Filled: the squares, the tags and the bar.
 */
function renderPhotos() {
  const count = state.photos.length;
  const filled = count > 0;

  $('#addBlock').hidden = filled;
  $('#mainLede').hidden = filled;
  grid.hidden = !filled;
  hint.hidden = !filled;
  $('#compose').hidden = !filled;

  grid.innerHTML = '';

  state.photos.forEach((photo, i) => {
    const cell = document.createElement('li');
    cell.className = 'photo';
    cell.innerHTML =
      `<img src="${photo.dataUrl}" alt="Photograph ${i + 1} of your cup" />` +
      `<button class="photo__drop" type="button" data-drop="${i}" ` +
      `aria-label="Remove photograph ${i + 1}">${icon('x', 16)}</button>`;
    grid.append(cell);
  });

  if (count < MAX_PHOTOS) {
    const cell = document.createElement('li');
    cell.innerHTML =
      '<button class="tile tile--more" type="button" data-add-more ' +
      `aria-label="Add another photograph of the same cup">${icon('plus', 20)}</button>`;
    grid.append(cell);
  }

  hint.textContent =
    count < MAX_PHOTOS ? `${count} of 4 · more angles, same cup` : '4 of 4 · that is plenty';
}

grid.addEventListener('click', (event) => {
  const drop = event.target.closest('[data-drop]');
  if (drop) {
    state.photos.splice(Number(drop.dataset.drop), 1);
    renderPhotos();
    (grid.querySelector('[data-add-more]') || $('#btnAddPhotos')).focus();
    return;
  }
  if (event.target.closest('[data-add-more]')) openPicker();
});

/* --------------------------------------------------------------- the tags */

const chips = Array.from(document.querySelectorAll('#tags [data-topic]'));

function setTopic(topic, moveFocus = false) {
  state.topic = topic;
  chips.forEach((chip) => {
    const on = chip.dataset.topic === topic;
    chip.setAttribute('aria-checked', String(on));
    // Roving tabindex: a radiogroup is one stop, then arrows inside it.
    chip.tabIndex = on ? 0 : -1;
    if (on && moveFocus) chip.focus();
  });
}

$('#tags').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-topic]');
  if (chip) setTopic(chip.dataset.topic);
});

$('#tags').addEventListener('keydown', (event) => {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  if (!step) return;
  event.preventDefault();
  const at = chips.findIndex((chip) => chip.dataset.topic === state.topic);
  const next = chips[(at + step + chips.length) % chips.length];
  setTopic(next.dataset.topic, true);
});

setTopic(state.topic);

/* ------------------------------------------------------------- the reading */

const waitFill = $('#waitFill');
const promptInput = $('#promptInput');

$('#btnSend').addEventListener('click', read);

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') read();
});

async function read() {
  if (state.photos.length === 0) return;

  const note = promptInput.value.trim();

  await go('reading');
  const stopCopy = rotateCopy();
  startWaitLine();
  const ritual = wait(RITUAL_MS);

  let payload;
  try {
    const res = await fetch('/api/read', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        images: state.photos.map((p) => p.dataUrl),
        topic: state.topic,
        note,
      }),
    });
    payload = await res.json();
  } catch {
    payload = null;
  }

  await ritual;
  stopCopy();
  await endWaitLine();

  if (payload?.readable) return showReading(payload);

  showEmpty(
    payload?.omen
      ? payload
      : {
          omen: 'The cup went quiet',
          note: 'Something between here and the grounds stopped speaking. This one is mine, not yours.',
          hint: 'Check your connection and hand me the cup again.',
        },
  );
}

/**
 * A single finite sweep. It eases toward the edge and waits there rather than
 * claiming to know how long a reading takes; when the answer lands it closes
 * the last of the distance.
 */
function startWaitLine() {
  waitFill.classList.remove('is-running', 'is-done');
  void waitFill.offsetWidth;
  waitFill.classList.add('is-running');
}

async function endWaitLine() {
  waitFill.classList.remove('is-running');
  waitFill.classList.add('is-done');
  await wait(reduced ? 0 : 160);
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
    }, reduced ? 0 : 240);
  }, LINE_MS);

  return () => clearInterval(timer);
}

/* ------------------------------------------------------------------ reveal */

async function showReading(reading) {
  state.reading = reading;

  $('#omen').textContent = reading.omen;
  $('#closing').textContent = reading.closing;

  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  $('#revealMeta').textContent = `${date} · ${reading.symbols.length} symbols`;

  const symbols = $('#symbols');
  symbols.innerHTML = '';
  reading.symbols.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'symbol stage';
    row.style.setProperty('--i', String(2 + i));
    row.innerHTML = `
      <span class="symbol__region">${escapeHtml(s.region)}</span>
      <span class="symbol__shape">${escapeHtml(s.shape)}</span>
      <span class="symbol__meaning">${escapeHtml(s.meaning)}</span>`;
    symbols.append(row);
  });

  // The stanzas unfold one at a time, which is the one orchestrated moment.
  const stanzas = $('#stanzas');
  stanzas.querySelectorAll('.stanza').forEach((n) => n.remove());
  reading.reading.forEach((text, i) => {
    const p = document.createElement('p');
    p.className = 'stanza stage';
    p.style.setProperty('--i', String(5 + i));
    p.textContent = text;
    stanzas.append(p);
  });

  const tail = 5 + reading.reading.length;
  $('#closingBlock').style.setProperty('--i', String(tail));
  $('#demoNote').style.setProperty('--i', String(tail + 1));
  $('#revealActions').style.setProperty('--i', String(tail + 2));
  $('#demoNote').hidden = !reading.demo;

  await go('reveal');

  // Draw the card while they are still reading, so sharing feels instant.
  state.card = renderShareCard(reading).catch(() => null);
}

function showEmpty({ omen, note, hint: line }) {
  $('#emptyOmen').textContent = omen;
  $('#emptyNote').textContent = note;
  $('#emptyHint').textContent = line || 'Shoot straight down into the cup, in daylight if you can.';
  return go('empty');
}

/* ------------------------------------------------------------------ sheets */

const shareSheet = $('#shareSheet');
const settingsSheet = $('#settingsSheet');
const sheetStatus = $('#sheetStatus');

let openPanel = null;
let opener = null;

function openSheet(sheet) {
  opener = document.activeElement;
  openPanel = sheet;
  sheet.hidden = false;
  sheet.querySelector('button[data-close-sheet]')?.focus();
}

function closeSheet() {
  if (!openPanel) return;
  openPanel.hidden = true;
  openPanel = null;
  say('');
  if (opener?.isConnected) opener.focus();
  opener = null;
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-sheet]')) closeSheet();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openPanel) closeSheet();
});

$('#btnSettings').addEventListener('click', () => openSheet(settingsSheet));

/* ------------------------------------------------------------------- share */

$('#btnShare').addEventListener('click', async () => {
  openSheet(shareSheet);
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
  $('#soundLabel').textContent = playing ? 'On' : 'Off';
});

/* ------------------------------------------------------------ misc wiring */

document.querySelectorAll('[data-go]').forEach((node) =>
  node.addEventListener('click', () => {
    if (node.dataset.go === 'main') {
      state.photos = [];
      state.reading = null;
      state.card = null;
      promptInput.value = '';
      renderPhotos();
    }
    go(node.dataset.go);
  }),
);

renderPhotos();
history.replaceState({ screen: 'main' }, '');

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
