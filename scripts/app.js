import { prepareImages } from './image.js';
import { renderShareCard } from './sharecard.js';
import { createAmbient } from './ambient.js';
import { icon, paintIcons } from './icons.js';
import { LANGS, LOCALES, t as lookup } from './strings.js';

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

/** Outer bound on one reading. The server budgets 50s and the function ceiling
 *  is 60s, so this sits past both: the server's own error should win. */
const REQUEST_MS = 70_000;
const LINE_MS = 3200;

const WAIT_LINES = ['wait.1', 'wait.2', 'wait.3', 'wait.4', 'wait.5', 'wait.6', 'wait.7', 'wait.8'];

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const LANG_KEY = 'destiny.lang';

/**
 * Remembered, then the browser's, then English. A Turkish speaker who has
 * never opened this before should not have to find the switch.
 */
function firstLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* private browsing: fall through to the browser's own answer */
  }
  return (navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

const state = {
  screen: 'main',
  photos: [], // [{ dataUrl, width, height }], 1 to 4, all the same cup
  topic: 'general',
  lang: firstLanguage(),
  reading: null, // the current fortune
  card: null, // Promise<{ dataUrl, blob }>
};

/** Every string in the interface goes through here. */
const t = (key, values) => lookup(state.lang, key, values);

/** Serialises screen changes. A request made mid-transition waits its turn
 *  rather than being dropped, which is what happens when someone picks a photo
 *  before the previous screen has finished leaving. */
let queue = Promise.resolve();

const ambient = createAmbient();

/* ---------------------------------------------------------------- language */

/**
 * Repaint every string in the document.
 *
 * Attribute-driven rather than a template: the markup keeps its structure and
 * only carries a key, so there is exactly one place a string can come from and
 * a translated build cannot drift out of shape from the English one.
 */
function paintText(root = document) {
  root.querySelectorAll('[data-t]').forEach((node) => {
    node.textContent = t(node.dataset.t);
  });
  for (const [attr, dataKey] of [
    ['aria-label', 'tAria'],
    ['placeholder', 'tPlaceholder'],
    ['alt', 'tAlt'],
  ]) {
    root.querySelectorAll(`[data-${attr === 'aria-label' ? 't-aria' : `t-${attr}`}]`).forEach((node) => {
      node.setAttribute(attr, t(node.dataset[dataKey]));
    });
  }
}

const langPicker = $('#langPicker');

function setLang(lang, { repaint = true } = {}) {
  if (!LANGS.includes(lang)) return;
  state.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private browsing: the choice lasts this visit and no longer */
  }

  document.documentElement.lang = lang;
  document.title = t('meta.title');

  langPicker.querySelectorAll('[data-lang]').forEach((opt) => {
    const on = opt.dataset.lang === lang;
    opt.setAttribute('aria-checked', String(on));
    // Roving tabindex, the same as the topic chips: one tab stop, arrows within.
    opt.tabIndex = on ? 0 : -1;
  });

  if (!repaint) return;
  paintText();
  // Anything already on screen was written in the old language.
  renderPhotos();
  if (state.reading) restateReading();
}

langPicker.addEventListener('click', (event) => {
  const opt = event.target.closest('[data-lang]');
  if (opt) setLang(opt.dataset.lang);
});

langPicker.addEventListener('keydown', (event) => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const next = LANGS[(LANGS.indexOf(state.lang) + 1) % LANGS.length];
  setLang(next);
  langPicker.querySelector(`[data-lang="${next}"]`).focus();
});

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
      omen: t('err.badFileOmen'),
      note: t('err.badFileNote'),
      hint: t('err.badFileHint'),
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

  $('#s-main .main').classList.toggle('is-filled', filled);
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
      `<img src="${photo.dataUrl}" alt="${t('a11y.photo', { n: i + 1 })}" />` +
      `<button class="photo__drop" type="button" data-drop="${i}" ` +
      `aria-label="${t('a11y.removePhoto', { n: i + 1 })}">${icon('x', 16)}</button>`;
    grid.append(cell);
  });

  if (count < MAX_PHOTOS) {
    const cell = document.createElement('li');
    cell.innerHTML =
      '<button class="tile tile--more" type="button" data-add-more ' +
      `aria-label="${t('a11y.addAnother')}">${icon('plus', 20)}</button>`;
    grid.append(cell);
  }

  hint.textContent = `${count}/${MAX_PHOTOS}`;
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

  // The endpoint runs the pipeline and holds its own budget. This is
  // the outer bound: past it, something is wrong on the wire, and a seeker
  // should get an answer rather than a spinner that never stops.
  const abort = new AbortController();
  const giveUp = setTimeout(() => abort.abort(), REQUEST_MS);

  let payload;
  try {
    const res = await fetch('/api/read', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        images: state.photos.map((p) => p.dataUrl),
        topic: state.topic,
        note,
        // The chosen language, not the browser's: the switch is the seeker's
        // answer to this question and the fortune has to come back in it.
        language: state.lang,
      }),
      signal: abort.signal,
    });
    payload = await res.json();
  } catch {
    payload = null;
  } finally {
    clearTimeout(giveUp);
  }

  await ritual;
  stopCopy();
  await endWaitLine();

  if (payload?.readable) {
    try {
      return await showReading(payload);
    } catch (err) {
      // Rendering the reveal threw. Before this was caught, the rejection was
      // silent and the seeker stayed on the wait screen for good.
      console.error('[destiny] could not render the reading:', err);
      return showEmpty({
        omen: t('err.quietOmen'),
        note: t('err.renderNote'),
        hint: t('err.renderHint'),
      });
    }
  }
  if (payload?.care) return showCare(payload);

  showEmpty(
    payload?.omen
      ? payload
      : { omen: t('err.quietOmen'), note: t('err.offlineNote'), hint: t('err.offlineHint') },
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
  const lines = shuffle([...WAIT_LINES]);
  let i = 0;

  const show = () => {
    line.textContent = t(lines[i % lines.length]);
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

/**
 * The line above the fortune: the date, and how many dictionaries were read.
 * Separate from showReading because it is the one part of the reveal that can
 * be restated in another language after the fact.
 */
function paintRevealMeta(reading) {
  const date = new Date().toLocaleDateString(LOCALES[state.lang], {
    day: 'numeric',
    month: 'long',
  });
  const n = reading.sources?.length || 0;
  const meta = $('#revealMeta');
  meta.textContent = n
    ? `${date} · ${t(n === 1 ? 'reveal.dictionaries' : 'reveal.dictionariesPlural', { n })}`
    : date;
  // The Searcher's citations are only worth something if you can see them.
  meta.title = n ? t('reveal.sourcedFrom', { list: reading.sources.join(', ') }) : t('reveal.unsourced');
}

/**
 * Repaint what the reveal says about a reading after a language change.
 *
 * The fortune itself is NOT retranslated, and cannot honestly be: those words
 * were written once, in the language they were asked for. The chrome around
 * them follows the switch; the reading keeps the voice it was given, and the
 * next cup comes back in the new language.
 */
function restateReading() {
  paintRevealMeta(state.reading);
}

async function showReading(reading) {
  state.reading = reading;

  $('#omen').textContent = reading.omen;
  $('#closing').textContent = reading.closing;

  paintRevealMeta(reading);

  // The stanzas unfold one at a time, which is the one orchestrated moment.
  const stanzas = $('#stanzas');
  stanzas.querySelectorAll('.stanza').forEach((n) => n.remove());
  reading.reading.forEach((text, i) => {
    const p = document.createElement('p');
    p.className = 'stanza stage';
    p.style.setProperty('--i', String(2 + i));
    p.textContent = text;
    stanzas.append(p);
  });

  const tail = 2 + reading.reading.length;
  $('#closingBlock').style.setProperty('--i', String(tail));
  $('#demoNote').style.setProperty('--i', String(tail + 1));
  $('#revealActions').style.setProperty('--i', String(tail + 2));
  $('#demoNote').hidden = !reading.demo;

  await go('reveal');

  // Draw the card while they are still reading, so sharing feels instant.
  state.card = renderShareCard(reading, t).catch(() => null);
}

/**
 * The house rules say that if a seeker is in genuine distress the mystic voice
 * stops. This is where that lands in the interface: no omen styling, no
 * suggestion to try another photo, nothing that reads as a fortune.
 */
function showCare({ omen, note }) {
  $('#emptyOmen').textContent = omen || t('empty.notTonight');
  $('#emptyNote').textContent = note;
  $('#emptyHint').textContent = '';
  $('#emptyHint').hidden = true;
  $('#emptyRetry').textContent = t('empty.careClose');
  $('#emptyLabel').textContent = t('empty.careLabel');
  return go('empty');
}

function showEmpty({ omen, note, hint: line }) {
  $('#emptyHint').hidden = false;
  $('#emptyRetry').textContent = t('empty.retry');
  $('#emptyLabel').textContent = t('empty.label');
  $('#emptyOmen').textContent = omen;
  $('#emptyNote').textContent = note;
  $('#emptyHint').textContent = line || t('empty.defaultHint');
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
  say(t('share.drawing'));

  const card = await (state.card || renderShareCard(state.reading, t).catch(() => null));
  if (!card) return say(t('share.cardFailed'));

  $('#shareCard').src = card.dataUrl;
  state.card = Promise.resolve(card);
  say('');
});

/** The card as a named file, or null if it never drew. */
function cardFile(card) {
  if (!card?.blob) return null;
  return new File([card.blob], cardName(), { type: 'image/png' });
}

const cardName = () => `${slug(state.reading?.omen)}.png`;

/**
 * Offer something to the OS share sheet. True means it was handled and there
 * is nothing left to try, which includes the seeker cancelling: backing out of
 * the sheet is a decision, not a failure, and it earns no fallback and no
 * error message.
 */
async function offer(data) {
  const usable = data.files ? navigator.canShare?.(data) : Boolean(navigator.share);
  if (!usable) return false;
  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    return err?.name === 'AbortError';
  }
}

$('#btnShareImage').addEventListener('click', async () => {
  const card = await state.card;
  const file = cardFile(card);
  const text = asText(state.reading);

  if (file && (await offer({ files: [file], title: state.reading.omen }))) return;
  if (await offer({ title: state.reading.omen, text })) return;
  copy(text);
});

/**
 * Save the card to wherever this device keeps pictures.
 *
 * `<a download>` cannot do that on a phone. It writes to the file system, so
 * on iOS the card lands in Files and never in Photos, which is where someone
 * who just got their fortune read actually looks for it. The share sheet is
 * the only route to the camera roll from a web page, and handing it the file
 * ALONE, with no title and no text, is what floats "Save Image" to the top of
 * it rather than a row of messaging apps.
 *
 * So this is the same API the Share button uses, aimed at a different target,
 * and the anchor stays as the desktop path where a download is the right
 * answer and there is often no share sheet at all.
 */
$('#btnSaveImage').addEventListener('click', async () => {
  const card = await state.card;
  if (!card) return say(t('share.cardFailed'));

  // The canShare check is repeated here rather than left to offer(), because
  // the hint must not appear on a desktop that is about to download instead.
  const file = cardFile(card);
  if (file && navigator.canShare?.({ files: [file] })) {
    say(t('share.chooseSave'));
    // Deliberately the file and nothing else: no title, no text. That is what
    // floats "Save Image" to the top of the sheet.
    if (await offer({ files: [file] })) return say('');
  }

  // Object URL rather than the data URL: the card is a megabyte of base64 and
  // Safari has historically refused to download data: hrefs past a size.
  const href = card.blob ? URL.createObjectURL(card.blob) : card.dataUrl;
  const link = document.createElement('a');
  link.href = href;
  link.download = cardName();
  document.body.append(link);
  link.click();
  link.remove();
  if (card.blob) setTimeout(() => URL.revokeObjectURL(href), 10_000);
  say(t('share.saved'));
});

$('#btnCopyText').addEventListener('click', () => copy(asText(state.reading)));

function say(message) {
  sheetStatus.textContent = message;
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    say(t('share.copied'));
  } catch {
    say(t('share.copyFailed'));
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
    t('share.readYourOwn', { url: location.origin }),
  ].join('\n');
}

/* ------------------------------------------------------------------- sound */

const soundToggle = $('#soundToggle');

soundToggle.addEventListener('click', async () => {
  const playing = await ambient.toggle();
  soundToggle.setAttribute('aria-pressed', String(playing));
  const label = $('#soundLabel');
  label.dataset.t = playing ? 'settings.on' : 'settings.off';
  label.textContent = t(label.dataset.t);
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

// Language before the first paint: renderPhotos writes alt text, so it has to
// know which language it is writing in.
setLang(state.lang, { repaint: false });
paintText();
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

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'destiny-reading';
}
