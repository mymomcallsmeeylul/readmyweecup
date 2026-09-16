/**
 * The reference set.
 *
 * Ten readings in the Fortune Teller's voice. They do two jobs:
 *
 *   1. They are the fallback when no ANTHROPIC_API_KEY is configured, so a
 *      fresh clone still gives you the whole experience in demo mode. This is
 *      not a corner case: it is what the deployed site serves until a key is
 *      set, so these are the product until then.
 *   2. They are the spec. If generated readings stop sounding like these, the
 *      prompts regressed.
 *
 * The voice, in short (docs/VOICE.md has the long form, KB-01 has the source):
 *   - A warm matriarch reading the cup with you, treating you like family.
 *     Endearments, and a blessing at the end.
 *   - Pouring, not analysing. "I see...", "Look, my dear...".
 *   - Redemptive: name the shadow, then turn it toward light with a gentle but.
 *   - Names the private feeling out loud, then comforts it. Mirrors their
 *     strength back at them.
 *   - One central image opened deeply, not five listed shallowly. One homely
 *     image. One concrete resonant detail, never a checkable claim.
 *   - English, except for canım. No proverbs, no other Turkish phrases: the
 *     warmth is in the tone, not in a foreign word dropped in for flavour.
 *   - One seeker, never a crowd. Possibilities, never "you will".
 *
 * Shape:
 *   omen     2-4 words, Title Case. The name of this cup.
 *   symbols  3 shapes, each placed in a region.
 *   reading  3 passages that read as one continuous story, opening warm.
 *            Two sentences each, thirty words at the outside.
 *   closing  a small blessing, one sentence, twelve words at the outside. The
 *            line people screenshot, so it stands alone.
 *
 * These were half this length once, which is to say twice: about 185 words a
 * reading, where they now run about 100. Nothing was wrong with the prose. It
 * was simply more than anyone reads on a phone at the end of an evening, and
 * the cut fell on the second interpretation of an image already opened and on
 * the sentence that restated the one before it more gently. Say it once, in
 * the strongest words available, and stop.
 *
 * A test holds the budget, because the reference set is what the prompt is
 * measured against: if these creep back up, so will the generated readings.
 *
 * Regions are the six from KB-02: rim, middle, bottom, handle,
 * right-of-handle, left-of-handle.
 */

export const SAMPLE_READINGS = [
  {
    omen: 'A Bird at the Rim',
    symbols: [
      { shape: 'a bird, caught mid-turn', region: 'rim' },
      { shape: 'a key', region: 'handle' },
      { shape: 'a heavy cluster', region: 'bottom' },
    ],
    reading: [
      'Good evening, canım. A bird sits at the very lip of your cup, caught mid-turn, and the rim is now. It comes once, and it knocks.',
      'It flies toward a key by the handle, which is the people already close to you. Someone near you has had a hand on a door for a while.',
      'Underneath, the bottom sits heavy with old ground. Set a little of it down before the bird lands, canım: you may want your hands free.',
    ],
    closing: 'May what is meant for you find you, canım.',
  },
  {
    omen: 'The Unfinished Ring',
    symbols: [
      { shape: 'a ring, open on one side', region: 'rim' },
      { shape: 'a straight road', region: 'middle' },
      { shape: 'a hand', region: 'right-of-handle' },
    ],
    reading: [
      'Come, my dear. A ring sits at your rim, open on one side, a gap you could put a finger through, and it waits on one word.',
      'The word is yours. Look how the grounds run in one straight road down the middle: that stretch is clear, canım.',
      'A hand rests right of the handle, the side that comes toward you. Someone means to help, and I do not think they mean to wait to be asked.',
    ],
    closing: 'The ring waits on one syllable, canım, not on fate.',
  },
  {
    omen: 'Heavy at the Bottom',
    symbols: [
      { shape: 'thick, banked grounds', region: 'bottom' },
      { shape: 'a clean channel', region: 'middle' },
      { shape: 'something small and light', region: 'rim' },
    ],
    reading: [
      'Ah, my dear. The bottom of your cup is dark tonight, banked on one side like snow against a wall, and that is the old ground.',
      'But look at the middle: a clean channel runs right through it, porcelain showing all the way down. The weight never closed your road, canım.',
      'And at the rim, something small and light, near enough to touch. Good things arriving while you are still tired is bad timing, not an insult.',
    ],
    closing: 'You may put it down without solving it first, canım.',
  },
  {
    omen: 'Two Roads and a Knot',
    symbols: [
      { shape: 'two paths, meeting', region: 'middle' },
      { shape: 'a knot', region: 'bottom' },
      { shape: 'an opening like a door', region: 'right-of-handle' },
    ],
    reading: [
      'Let me look properly, my dear. Two lines come down your cup and meet in the middle ring: a decision taking shape, canım, not one already made.',
      'Underneath, near the base, the grounds have gathered into a knot. The choice above is new; the knot below was tied long before it.',
      'Right of the handle something has opened like a door. Loosen the old knot first, gently, and the choice above may untie itself while your back is turned.',
    ],
    closing: 'Not every knot wants the scissors, my dear.',
  },
  {
    omen: 'A Fish Near the Handle',
    symbols: [
      { shape: 'a fish', region: 'handle' },
      { shape: 'a cloud', region: 'rim' },
      { shape: 'a ladder', region: 'middle' },
    ],
    reading: [
      'Oh, this is a kind cup, canım. A fish sits by the handle, your own side and the people in it, and a fish there has meant plenty.',
      'At the rim there is a cloud, and the rim is today. A cloud there is weather, my dear, not climate.',
      'In the middle, a ladder. What you are building looks like the year rather than the month: you are not slow, canım, the thing is tall.',
    ],
    closing: 'The plenty is already in the room, my dear.',
  },
  {
    omen: 'The Long Table',
    symbols: [
      { shape: 'a long unbroken line', region: 'middle' },
      { shape: 'a gap the shape of a chair', region: 'left-of-handle' },
      { shape: 'a star', region: 'rim' },
    ],
    reading: [
      'Look at this, my dear. A long line runs unbroken across the middle of your cup, like a table laid with people down both sides of it.',
      'Left of the handle there is a gap the shape of a chair, and that side is what leaves. Someone finished their part and went home, canım.',
      'And at the rim, a star, which is the present tense of wanting. There is a wish in you that you have not said out loud.',
    ],
    closing: 'Let the chair sit empty a while, canım.',
  },
  {
    omen: 'A Coil and a Flower',
    symbols: [
      { shape: 'a coiled shape', region: 'middle' },
      { shape: 'a flower, opening', region: 'right-of-handle' },
      { shape: 'a smooth base', region: 'bottom' },
    ],
    reading: [
      'Now, canım, plainly, before it sits in your chest all evening: the coil on your middle wall is not a threat. It has only meant keep your eyes open.',
      'So keep them open, my dear. You give people the benefit of the doubt well past where they have earned it, and that generosity wants supervision, not surgery.',
      'Right of the handle something opens like a flower, and the base beneath it is smooth. What is arriving looks warm, canım, and nothing heavy sits under it.',
    ],
    closing: 'Eyes open and hands unclenched, my dear, both at once.',
  },
  {
    omen: 'The Door at the Base',
    symbols: [
      { shape: 'a door', region: 'bottom' },
      { shape: 'a horse', region: 'middle' },
      { shape: 'a fine scattering', region: 'rim' },
    ],
    reading: [
      'Ah, look at this, canım. There is a door at the bottom of your cup, where the old rooms are, and it is standing open.',
      'Above it, in the middle ring, a horse, which has always meant news that travels fast. Word out of something old, my dear, from a direction you stopped watching.',
      'The rim is finely scattered, which is this week: busy rather than important. Decide nothing in it, canım, and let the horse arrive first.',
    ],
    closing: 'Walking back through an open door is not going backwards.',
  },
  {
    omen: 'An Almost Empty Cup',
    symbols: [
      { shape: 'wide clear porcelain', region: 'middle' },
      { shape: 'a small heart, low down', region: 'handle' },
      { shape: 'a few dark specks', region: 'rim' },
    ],
    reading: [
      'Well now, my dear. Most of your cup is clean tonight, and the middle ring, which is the coming months, is very nearly bare porcelain.',
      'Near the handle sits a small heart, low down and steady. You have been checking on it, canım, the way a person checks a lock they already turned.',
      'A few dark specks at the rim are bills and messages, the ordinary friction of a week. Nothing in this cup is asking to be solved, my dear.',
    ],
    closing: 'An empty cup is not an empty life, canım.',
  },
  {
    omen: 'The Ladder and the Well',
    symbols: [
      { shape: 'a ladder', region: 'right-of-handle' },
      { shape: 'a shape like a well', region: 'bottom' },
      { shape: 'a broken line', region: 'rim' },
    ],
    reading: [
      'Come closer, canım. Right of your handle, on the side that comes toward you, there is a ladder: an offer, not a gift, and climbing is work.',
      'At the base, a shape like a well, water you have not drawn up yet. The climb above leans on that thing below, my dear.',
      'The rim is broken into short wavering lines, which is this week. You do not have to feel certain to take the first rung, canım.',
    ],
    closing: 'Start before you feel ready, my dear; the well keeps.',
  },
];

export function pickSampleReading(seed = Math.random()) {
  const i = Math.floor(Math.abs(seed) * SAMPLE_READINGS.length) % SAMPLE_READINGS.length;
  return SAMPLE_READINGS[i];
}
