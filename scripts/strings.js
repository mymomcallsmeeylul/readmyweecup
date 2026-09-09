/**
 * Every word the interface says, in both languages.
 *
 * One flat table per language rather than nested namespaces: the app is four
 * screens and two sheets, and a flat list is the thing you can read top to
 * bottom to check that nothing is missing. A test asserts the two tables have
 * exactly the same keys, which is the failure mode that actually happens —
 * English copy added, Turkish forgotten, and the seeker gets a sentence in the
 * wrong language with no error anywhere.
 *
 * The fortune itself is not here. That is written by the Fortune Teller in the
 * seeker's language and arrives already translated; this file is the chrome
 * around it. The one exception is the copy she says when there is no reading
 * to give, which lives with her voice in api/_agents/fortune-teller.js so that
 * all of her lines stay in one place.
 */

export const LANGS = ['en', 'tr'];

const EN = {
  'meta.title': 'Destiny — read my wee cup',

  'a11y.language': 'Language',
  'a11y.settings': 'Settings',
  'a11y.yourCup': 'Your cup',
  'a11y.picker': 'Choose up to four photos of your cup',
  'a11y.tags': 'What should the cup read for?',
  'a11y.promptLabel': 'Anything you want the cup to look at, in your own words',
  'a11y.cardAlt': 'A card showing your reading',
  'a11y.photo': 'Photograph {n} of your cup',
  'a11y.removePhoto': 'Remove photograph {n}',
  'a11y.addAnother': 'Add another photograph of the same cup',

  'main.lede': 'Get your cup reading, unfold your fortune.',
  'main.addPhotos': 'Add photos',
  'main.placeholder': 'What to look for?',
  'main.send': 'Send reading',

  'topic.love': 'Love',
  'topic.career': 'Career',
  'topic.general': 'General',
  'topic.friendships': 'Friendships',
  'topic.health': 'Health',
  'topic.money': 'Money',

  'wait.label': 'Reading the cup',
  'wait.title': 'Reading your cup',
  'wait.1': 'The cup is still warm.',
  'wait.2': 'The grounds are settling.',
  'wait.3': 'Turning the cup toward the light.',
  'wait.4': 'Something near the rim is taking shape.',
  'wait.5': 'Reading the path down the side.',
  'wait.6': 'There is weight at the bottom of this cup.',
  'wait.7': 'Waiting for the last of it to fall.',
  'wait.8': 'Almost. Do not move the cup.',

  'reveal.demo': 'From an older cup, not tonight’s',
  'reveal.share': 'Share this reading',
  'reveal.another': 'Read another cup',
  'reveal.dictionaries': '{n} dictionary',
  'reveal.dictionariesPlural': '{n} dictionaries',
  'reveal.sourcedFrom': 'Meanings read from {list}',
  'reveal.unsourced': 'General traditional meanings, not looked up',

  'empty.back': 'Back',
  'empty.label': 'No reading',
  'empty.retry': 'Try another photo',
  'empty.careLabel': 'A moment',
  'empty.careClose': 'Close',
  'empty.defaultHint': 'Shoot straight down into the cup, in daylight if you can.',
  'empty.notTonight': 'Not tonight',

  'err.badFileOmen': 'That did not open',
  'err.badFileNote':
    'Whatever those files are, the browser could not look inside them. A photograph from the camera roll works best.',
  'err.badFileHint': 'JPEG, PNG or HEIC, straight from your camera.',
  'err.quietOmen': 'The cup went quiet',
  'err.renderNote':
    'Your reading arrived, but something here could not lay it out. This one is mine, not yours.',
  'err.renderHint': 'Reload the page and hand me the cup again.',
  'err.offlineNote': 'Something between here and the grounds stopped speaking. This one is mine, not yours.',
  'err.offlineHint': 'Check your connection and hand me the cup again.',

  'share.title': 'Your card',
  'share.close': 'Close',
  'share.share': 'Share',
  'share.save': 'Save image',
  'share.copy': 'Copy the words',
  'share.drawing': 'Drawing your card…',
  'share.cardFailed': 'The card would not draw. The words still copy.',
  'share.chooseSave': 'Choose “Save Image” to keep it in your photos.',
  'share.saved': 'Saved to your downloads.',
  'share.copied': 'Copied.',
  'share.copyFailed': 'Your browser would not let me copy. Select the text and take it.',
  'share.readYourOwn': 'Read your own cup: {url}',

  'settings.title': 'Settings',
  'settings.sound': 'Ambient sound',
  'settings.soundNote': 'A low room tone under the reading. Off by default.',
  'settings.on': 'On',
  'settings.off': 'Off',

  // The six places in the cup, as printed along the foot of the share card.
  // The raw keys read as code ("RIGHT-OF-HANDLE"), so both languages get a
  // written-out label rather than an uppercased identifier.
  'region.rim': 'Rim',
  'region.middle': 'Middle',
  'region.bottom': 'Bottom',
  'region.handle': 'Handle',
  'region.right-of-handle': 'Right of handle',
  'region.left-of-handle': 'Left of handle',
};

const TR = {
  'meta.title': 'Destiny — fincanıma bak',

  'a11y.language': 'Dil',
  'a11y.settings': 'Ayarlar',
  'a11y.yourCup': 'Fincanın',
  'a11y.picker': 'Fincanının en fazla dört fotoğrafını seç',
  'a11y.tags': 'Fincan ne için baksın?',
  'a11y.promptLabel': 'Fincanın neye bakmasını istersen, kendi sözlerinle',
  'a11y.cardAlt': 'Falını gösteren bir kart',
  'a11y.photo': 'Fincanının {n}. fotoğrafı',
  'a11y.removePhoto': '{n}. fotoğrafı kaldır',
  'a11y.addAnother': 'Aynı fincandan bir fotoğraf daha ekle',

  'main.lede': 'Fincanını okut, falını aç.',
  'main.addPhotos': 'Fotoğraf ekle',
  'main.placeholder': 'Neye bakılsın?',
  'main.send': 'Fal baktır',

  'topic.love': 'Aşk',
  'topic.career': 'Kariyer',
  'topic.general': 'Genel',
  'topic.friendships': 'Dostluk',
  'topic.health': 'Sağlık',
  'topic.money': 'Para',

  'wait.label': 'Fincan okunuyor',
  'wait.title': 'Fincanın okunuyor',
  'wait.1': 'Fincan hâlâ sıcak.',
  'wait.2': 'Telve yerine oturuyor.',
  'wait.3': 'Fincan ışığa çevriliyor.',
  'wait.4': 'Ağzına yakın bir şey beliriyor.',
  'wait.5': 'Kenardan inen yol okunuyor.',
  'wait.6': 'Bu fincanın dibinde bir ağırlık var.',
  'wait.7': 'Son telvenin çökmesi bekleniyor.',
  'wait.8': 'Az kaldı. Fincanı kıpırdatma.',

  'reveal.demo': 'Eski bir fincandan, bu geceninkinden değil',
  'reveal.share': 'Bu falı paylaş',
  'reveal.another': 'Başka bir fincan',
  // Turkish does not pluralise the noun after a number, so both forms match.
  'reveal.dictionaries': '{n} sözlük',
  'reveal.dictionariesPlural': '{n} sözlük',
  'reveal.sourcedFrom': 'Anlamlar şuradan okundu: {list}',
  'reveal.unsourced': 'Genel geleneksel anlamlar, kaynaktan bakılmadı',

  'empty.back': 'Geri',
  'empty.label': 'Fal yok',
  'empty.retry': 'Başka bir fotoğraf dene',
  'empty.careLabel': 'Bir dakika',
  'empty.careClose': 'Kapat',
  'empty.defaultHint': 'Fincanın içine tam tepeden bak, mümkünse gün ışığında.',
  'empty.notTonight': 'Bu gece olmaz',

  'err.badFileOmen': 'Bu açılmadı',
  'err.badFileNote':
    'O dosyalar her ne ise, tarayıcı içlerine bakamadı. Galeriden çekilmiş bir fotoğraf en iyisi.',
  'err.badFileHint': 'JPEG, PNG ya da HEIC, doğrudan kameradan.',
  'err.quietOmen': 'Fincan sustu',
  'err.renderNote':
    'Falın geldi ama buradaki bir şey onu yerleştiremedi. Bu bendendir, senden değil.',
  'err.renderHint': 'Sayfayı yenile ve fincanı bana yeniden uzat.',
  'err.offlineNote': 'Buradan telveye giden yolda bir şey sustu. Bu bendendir, senden değil.',
  'err.offlineHint': 'Bağlantını kontrol et ve fincanı bana yeniden uzat.',

  'share.title': 'Kartın',
  'share.close': 'Kapat',
  'share.share': 'Paylaş',
  'share.save': 'Görseli kaydet',
  'share.copy': 'Yazıyı kopyala',
  'share.drawing': 'Kartın çiziliyor…',
  'share.cardFailed': 'Kart çizilemedi. Yazı yine de kopyalanır.',
  'share.chooseSave': '“Görseli Kaydet”i seçersen fotoğraflarına eklenir.',
  'share.saved': 'İndirilenlere kaydedildi.',
  'share.copied': 'Kopyalandı.',
  'share.copyFailed': 'Tarayıcın kopyalamama izin vermedi. Yazıyı seçip alabilirsin.',
  'share.readYourOwn': 'Kendi fincanına baktır: {url}',

  'settings.title': 'Ayarlar',
  'settings.sound': 'Ortam sesi',
  'settings.soundNote': 'Falın altında hafif bir oda sesi. Varsayılan olarak kapalı.',
  'settings.on': 'Açık',
  'settings.off': 'Kapalı',

  'region.rim': 'Ağız',
  'region.middle': 'Orta',
  'region.bottom': 'Dip',
  'region.handle': 'Kulp',
  'region.right-of-handle': 'Kulbun sağı',
  'region.left-of-handle': 'Kulbun solu',
};

export const TABLES = { en: EN, tr: TR };

/** The date line under the reveal, in the language being read. */
export const LOCALES = { en: 'en-GB', tr: 'tr-TR' };

/**
 * Look up a key, filling {placeholders}. A missing key returns the key itself
 * rather than an empty string: a visible `share.copied` in the interface is a
 * bug report, and a silent blank is not.
 */
export function t(lang, key, values) {
  const table = TABLES[lang] || TABLES.en;
  const raw = table[key] ?? TABLES.en[key] ?? key;
  if (!values) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name) =>
    name in values ? String(values[name]) : whole,
  );
}
