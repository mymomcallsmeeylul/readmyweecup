/**
 * The locked voice.
 *
 * These ten readings are the reference set for Destiny. They do three jobs:
 *
 *   1. They are the few-shot examples given to the voice model, so every
 *      generated reading inherits their cadence.
 *   2. They are the fallback when no ANTHROPIC_API_KEY is configured, so a
 *      fresh clone still gives you the whole experience in demo mode.
 *   3. They are the spec. If a change to the prompts makes generated readings
 *      sound less like these, the change is wrong.
 *
 * Voice rules (see docs/VOICE.md for the long form):
 *   - Second person, present tense.
 *   - Concrete images over abstractions. "A bird at the rim", never "positive energy".
 *   - Exactly one gentle turn or quiet warning per reading.
 *   - No horoscope filler, no hedging, no "may" or "might" or "the universe".
 *   - Short enough to screenshot. Specific enough to feel addressed.
 *
 * Shape of a reading:
 *   omen     - 2-4 words. The name of the cup.
 *   symbols  - 3 shapes, each placed in a region of the cup.
 *   reading  - 3 stanzas: what is here / the turn / the instruction.
 *   closing  - one line. This is the line people screenshot.
 */

export const SAMPLE_READINGS = [
  {
    omen: 'A Bird at the Rim',
    symbols: [
      { shape: 'a bird, caught mid-turn', region: 'rim', meaning: 'news already in the air' },
      { shape: 'a narrow path', region: 'wall', meaning: 'one way through, single file' },
      { shape: 'a heavy cluster', region: 'handle', meaning: 'a weight that is yours' },
    ],
    reading: [
      'Something is already flying toward you. It left before you asked for it, which is why it arrives at the wrong hour and you almost do not open the door.',
      'The path down the side of the cup is narrow but unbroken. You are not stuck. You are single file. That is lonelier and faster than you were expecting.',
      'The weight sits against the handle, close enough to touch, and it is yours. You have been carrying it as though someone handed it to you.',
    ],
    closing: 'Answer on the first ring. The bird does not circle twice.',
  },
  {
    omen: 'The Unfinished Ring',
    symbols: [
      { shape: 'a ring, open on one side', region: 'rim', meaning: 'a thing one word from closing' },
      { shape: 'two old marks, side by side', region: 'base', meaning: 'the same problem, met twice' },
      { shape: 'a smear like smoke', region: 'wall', meaning: 'a room you keep leaving' },
    ],
    reading: [
      'A circle in your life is one word from closing. Everyone involved is waiting to see whether you will say it, or let the season say it for you.',
      'Far down, at the bottom, two small marks sit side by side. They are old. They are not two problems. They are one problem you have met twice, and both times called it luck.',
      'The smoke on the wall is the room you keep stepping out of to take a call. Look at who is still sitting in it when you come back.',
    ],
    closing: 'The ring is not broken. It is open, and it is waiting for your hand.',
  },
  {
    omen: 'A Fish Turning Toward the Handle',
    symbols: [
      { shape: 'a fish, head toward you', region: 'wall', meaning: 'abundance moving your way' },
      { shape: 'a clean split where nothing settled', region: 'rim', meaning: 'a door nobody has mentioned' },
      { shape: 'scattered grit', region: 'base', meaning: 'small unpaid debts' },
    ],
    reading: [
      'A fish is coming up the side of the cup with its head turned toward you. In this cup that has always meant money, or its close cousin: relief, arriving as a number.',
      'There is a clean split in the grounds near the rim, a place where nothing settled at all. That is a door in the next few weeks that no one has told you about yet. It stays open about as long as a door does.',
      'The bottom is gritty and ungenerous. Small things you owe. Not money, necessarily. Messages. Thank-yous. A visit you keep moving.',
    ],
    closing: 'Pay the small debts first. The fish swims better in clear water.',
  },
  {
    omen: 'The Long Hallway',
    symbols: [
      { shape: 'a corridor of clean porcelain', region: 'wall', meaning: 'a stretch of open time' },
      { shape: 'a single knot', region: 'rim', meaning: 'one obstruction, and soon' },
      { shape: "a bird's footprint", region: 'base', meaning: 'an old family pattern surfacing' },
    ],
    reading: [
      'There is a hallway running the length of your cup, and it is empty. You have more open time coming than you believe. You will try to fill it out of nervousness.',
      'One knot sits at the top, near the lip, which means near. A single obstruction inside the month that looks enormous from underneath and ordinary from the side.',
      "At the base, the print of a bird's foot. Something from your family repeats in you this season. It will arrive feeling exactly like your own idea.",
    ],
    closing: 'Walk the hallway slowly. Empty is not the same as wasted.',
  },
  {
    omen: 'A Hand and a Door',
    symbols: [
      { shape: 'an open hand', region: 'handle', meaning: 'someone reaching, badly' },
      { shape: 'a doorway', region: 'wall', meaning: 'a decision with a threshold' },
      { shape: 'a dark settled floor', region: 'base', meaning: 'grief already carried' },
    ],
    reading: [
      'Someone near you is reaching, and they are doing it badly, the way people do when they are out of practice. You will be tempted to read the clumsiness as indifference.',
      'There is a door on the wall of the cup. Doors here mean a decision with a threshold: you cannot half do it, and you cannot undo it by standing in the frame a while longer.',
      'The base is dark and evenly settled. That is old grief, already carried, already yours. It is not a warning. It is ballast.',
    ],
    closing: 'Take the hand before you take the door.',
  },
  {
    omen: 'The Cup That Would Not Settle',
    symbols: [
      { shape: 'sediment that never lay down', region: 'wall', meaning: 'a season without a shape yet' },
      { shape: 'a faint spiral turning back', region: 'wall', meaning: 'something circling around again' },
      { shape: 'a clean bright lip', region: 'rim', meaning: 'immediate days, uncomplicated' },
    ],
    reading: [
      'The grounds in this cup did not lie down. That happens when the drinker is between two things and honest about being between them.',
      'There is a spiral on the wall, faint, turning back on itself. Something you decided against is coming around again, wearing different clothes and a better argument.',
      'The rim is clean, though, which means the next few days are genuinely fine. Do not spend them rehearsing.',
    ],
    closing: 'You are allowed to not know yet. Just do not pretend you do not know at all.',
  },
  {
    omen: 'A Ladder Against the Rim',
    symbols: [
      { shape: 'a ladder', region: 'wall', meaning: 'an ascent already underway' },
      { shape: 'a bird leaving the cup', region: 'rim', meaning: 'a departure, and a lightening' },
      { shape: 'one full round mark', region: 'base', meaning: 'something finished and never counted' },
    ],
    reading: [
      'There is a ladder up the side of your cup and you are already on it. This is the stretch where you can see neither the ground nor the top, and you have decided that means you have stopped moving.',
      'A bird leaves at the rim, headed out of the cup. Something departs in the coming weeks. Let it. In this cup, birds that leave are not losses. They are weight coming off the climb.',
      'At the bottom, one full round mark. A thing you finished, that you have never once allowed yourself to count.',
    ],
    closing: 'Count it. Then take the next rung.',
  },
  {
    omen: 'Two Roads and a Scatter of Dots',
    symbols: [
      { shape: 'a fork in the grounds', region: 'wall', meaning: 'a real choice, neither one safe' },
      { shape: 'small dots across the lip', region: 'rim', meaning: 'many small arrivals' },
      { shape: 'a shadow pressed to the handle', region: 'handle', meaning: 'someone close, holding back' },
    ],
    reading: [
      'The grounds fork halfway down the cup. Two roads, and neither of them is the safe one. The safe one closed some time ago and you have been visiting the spot where it used to be.',
      'The rim is covered in small dots: many small arrivals. Notes, invitations, work. They will feel like progress. Most of them are weather.',
      'There is a shadow against the handle. Someone close to you is holding something back, and they are doing it kindly, which is the hardest kind to catch.',
    ],
    closing: 'Ask them plainly. Kindness that hides is still a wall.',
  },
  {
    omen: 'The Snake Near the Handle',
    symbols: [
      { shape: 'a long curved body', region: 'handle', meaning: 'a closeness that is not safe' },
      { shape: 'an eye', region: 'wall', meaning: 'watched, or watching yourself' },
      { shape: 'open sky', region: 'rim', meaning: 'room to move, still' },
    ],
    reading: [
      'There is a long curved shape lying close to the handle. In this cup the handle is you, and a snake against it is not evil, it is proximity: something unsafe has become familiar.',
      'An eye sits on the wall, halfway down. You are being watched, or you are watching yourself so constantly that you have stopped acting. From the inside these feel identical.',
      'The rim, though, is open. Nothing crowds the top of your cup. Whatever this is, it has not cornered you yet.',
    ],
    closing: 'Move while the sky is still open. Familiar is not the same as safe.',
  },
  {
    omen: 'A Tree With Its Roots Showing',
    symbols: [
      { shape: 'a tree, roots exposed', region: 'wall', meaning: 'growth with a visible cost' },
      { shape: 'a small figure', region: 'rim', meaning: 'someone new, arriving close' },
      { shape: 'a line that stops', region: 'base', meaning: 'an old promise, unfinished' },
    ],
    reading: [
      'A tree runs up the side of your cup with its roots showing at the bottom. You are growing in a way that other people can see the price of. That was the trade you made, and it was not a bad one.',
      'Near the rim there is a small figure. Someone new comes close in the near weeks. They will be easy to talk to, which is how you will end up telling them everything at once.',
      'At the base, a line that simply stops. An old promise you never finished and never formally broke. It is still holding a place on your calendar and you do not know it.',
    ],
    closing: 'Finish it, or say out loud that it is finished. Roots need ground, not a story.',
  },
];

/**
 * Written in the same voice, for when the cup cannot be read: a photo that is
 * not a cup, a cup that is still full, a picture too dark to fall into.
 */
export const UNREADABLE_READINGS = [
  {
    omen: 'A Cup Still Full',
    note: 'There is nothing settled here yet. Drink it, turn the cup onto the saucer, and give the grounds a minute to decide what they are.',
    hint: 'Shoot the inside of the cup, straight down, in daylight if you can find some.',
  },
  {
    omen: 'Too Dark to Fall Into',
    note: 'The cup is here but the light is not. Fortune needs something to catch on, and shadow is not a shape.',
    hint: 'Move toward a window and hold the phone a hand-width above the rim.',
  },
  {
    omen: 'Not a Cup',
    note: 'Whatever this is, it is not telling me about your year. The grounds only speak from inside porcelain.',
    hint: 'Point the camera into a drained Turkish coffee cup, close enough that the rim fills the frame.',
  },
];

export function pickSampleReading(seed = Math.random()) {
  const i = Math.floor(Math.abs(seed) * SAMPLE_READINGS.length) % SAMPLE_READINGS.length;
  return SAMPLE_READINGS[i];
}

export function pickUnreadable(seed = Math.random()) {
  const i = Math.floor(Math.abs(seed) * UNREADABLE_READINGS.length) % UNREADABLE_READINGS.length;
  return UNREADABLE_READINGS[i];
}
