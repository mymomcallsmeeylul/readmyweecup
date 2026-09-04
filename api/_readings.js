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
 *   - A warm old-almanac narrator reading the cup WITH the seeker.
 *   - The three themes woven into one story, never a list of symbols.
 *   - Every image anchored where it sits, so timing feels earned.
 *   - Possibilities, never certainties. "seems", "may", "a sign of".
 *   - One hard thing at most, turned toward something they can do.
 *   - Ends warm. The seeker leaves lighter than they arrived.
 *
 * Shape:
 *   omen     2-4 words, Title Case. The name of this cup.
 *   symbols  3 shapes, each placed in a region.
 *   reading  3 passages that read as one continuous story.
 *   closing  the line people screenshot. It must stand on its own.
 *
 * Regions are the six from KB-02: rim, middle, bottom, handle,
 * right-of-handle, left-of-handle.
 */

export const SAMPLE_READINGS = [
  {
    omen: 'A Bird at the Rim',
    symbols: [
      { shape: 'a bird, caught mid-turn', region: 'rim', meaning: 'news already in the air' },
      { shape: 'a key', region: 'handle', meaning: 'a door in someone already close' },
      { shape: 'a heavy cluster', region: 'bottom', meaning: 'an old weight, still carried' },
    ],
    reading: [
      'There seems to be a bird at the lip of your cup, caught mid-turn, and a bird at the rim is news that has already left. It may arrive at an awkward hour, the way news does. When it comes it will want an answer before you feel ready to give one.',
      'It is flying toward a key that settled near the handle, and the handle is the people already close to you. That reads less like a stranger with a message and more like a door opening in a room you thought you knew well.',
      'The bottom of the cup is heavier than the rest of it, and the bottom is what you have been carrying rather than what is coming. Set some of it down before the bird lands. You will want your hands free.',
    ],
    closing: 'You do not have to be ready. You only have to open the door.',
  },
  {
    omen: 'The Unfinished Ring',
    symbols: [
      { shape: 'a ring, open on one side', region: 'rim', meaning: 'a thing one word from closing' },
      { shape: 'a straight road', region: 'middle', meaning: 'a clear stretch ahead' },
      { shape: 'a hand', region: 'right-of-handle', meaning: 'help on its way in' },
    ],
    reading: [
      'A ring sits at the rim of your cup and it has not quite closed. Rings that stay open like this are usually read as something a single word away from being settled, and the word is usually yours.',
      'Below it the grounds run in one straight road through the middle of the cup, which is the coming months. That stretch looks unusually clear. It may be the least complicated season you have had in a while, and you may not notice it until it is behind you.',
      'There is a hand to the right of the handle, and that side is what is moving toward you. Help seems to be on its way, offered rather than asked for. Let it be given.',
    ],
    closing: 'Say the word. The ring has been waiting on one syllable, not on fate.',
  },
  {
    omen: 'Heavy at the Bottom',
    symbols: [
      { shape: 'thick, banked grounds', region: 'bottom', meaning: 'an old thought carried too long' },
      { shape: 'a clean channel', region: 'middle', meaning: 'a way through, already cut' },
      { shape: 'something small and light', region: 'rim', meaning: 'an easy thing arriving' },
    ],
    reading: [
      'The bottom of your cup is dark tonight and banked to one side. That is the oldest part of the cup, the part that holds what has been sitting with you, and it seems you have been carrying a thought for longer than you meant to.',
      'Look at the middle of the cup, though. A clean channel runs through the grounds with the porcelain showing all the way down. Whatever the weight is, it has not closed your way through. The path is cut. It is simply not walked yet.',
      'And there is something small and light at the rim, near enough to touch. Good things arriving while you are still tired is not an insult. It is only bad timing, and bad timing is survivable.',
    ],
    closing: 'You are allowed to put it down without solving it first.',
  },
  {
    omen: 'Two Roads and a Knot',
    symbols: [
      { shape: 'two paths, meeting', region: 'middle', meaning: 'a decision taking shape' },
      { shape: 'a knot', region: 'bottom', meaning: 'an older tangle underneath' },
      { shape: 'an opening like a door', region: 'right-of-handle', meaning: 'a way in, newly there' },
    ],
    reading: [
      'Two lines run down the wall of your cup and meet in the middle ring, which is the coming months. A crossing like that tends to mean a decision taking shape rather than one already made. You may be further from having to choose than you fear.',
      'Underneath, near the base, the grounds have gathered into a knot. The base is the old ground of things. The choice above looks new, but it seems to be pulling on something that was tangled long before it.',
      'To the right of the handle a shape has opened like a door, and that side of the cup is what is coming in. Loosen the old thing first, gently. The new one may turn out not to be a choice at all.',
    ],
    closing: 'Not every knot needs cutting. Some just need better light and a slower hand.',
  },
  {
    omen: 'A Fish Near the Handle',
    symbols: [
      { shape: 'a fish', region: 'handle', meaning: 'plenty, close to home' },
      { shape: 'a cloud', region: 'rim', meaning: 'a worry that is weather, not climate' },
      { shape: 'a ladder', region: 'middle', meaning: 'a slow climb' },
    ],
    reading: [
      'There is a fish near the handle of your cup. The handle is your own side, your home and the people already in it, and a fish there has always been read as plenty. Something good may be closer than you have been looking.',
      'At the rim there is a cloud. The rim is the present, so it seems there is a worry sitting on you right now, and it is real enough. Clouds at the rim are usually weather rather than climate.',
      'The middle of the cup holds a ladder, and ladders are never fast. What you are building looks like it will take the year rather than the month. That is not a delay. That is the size of the thing.',
    ],
    closing: 'The plenty is already in the room. The worry is only standing in front of it.',
  },
  {
    omen: 'The Long Table',
    symbols: [
      { shape: 'a long unbroken line', region: 'middle', meaning: 'a stretch with company in it' },
      { shape: 'a gap the shape of a chair', region: 'left-of-handle', meaning: 'someone stepping back' },
      { shape: 'a star', region: 'rim', meaning: 'a wish surfacing now' },
    ],
    reading: [
      'A long line of grounds runs across the middle of your cup, unbroken, like a table with people down both sides. The middle ring is the coming months, so this may be a season with company in it.',
      'To the left of the handle there is a gap roughly the shape of a chair, and the left side is what is on its way out. Someone may be stepping back. Not always a betrayal and not always a loss: sometimes people simply finish their part.',
      'At the rim there is a star, which is the present tense of wanting. There seems to be a wish you have not said out loud yet. A full table is a good place to say it.',
    ],
    closing: 'Let the chair stay empty a while. It is making room, not keeping score.',
  },
  {
    omen: 'A Coil and a Flower',
    symbols: [
      { shape: 'a coiled shape', region: 'middle', meaning: 'someone worth noticing' },
      { shape: 'a flower, opening', region: 'right-of-handle', meaning: 'something warm coming in' },
      { shape: 'a smooth base', region: 'bottom', meaning: 'nothing heavy underneath' },
    ],
    reading: [
      'There is a coiled shape on the wall of your cup, in the middle ring. Traditionally that is read as someone to keep an eye on, though it is worth saying plainly: a coil is not a threat. It is a nudge to notice who you have been leaning on lately.',
      'Just to the right of the handle something is opening like a flower, and that side is what is entering your life. Whatever is arriving looks warm, and it may arrive at the same time as the coil. That is why this cup wants you awake rather than worried.',
      'The base of the cup is smooth. Nothing heavy is sitting underneath any of it. Whatever the coming weeks bring, you are not carrying an old wound into them.',
    ],
    closing: 'Eyes open, hands unclenched. You are allowed both at once.',
  },
  {
    omen: 'The Door at the Base',
    symbols: [
      { shape: 'a door', region: 'bottom', meaning: 'an old room, still open' },
      { shape: 'a horse', region: 'middle', meaning: 'news travelling fast' },
      { shape: 'a fine scattering', region: 'rim', meaning: 'a busy, unsettled week' },
    ],
    reading: [
      'There is a door at the bottom of your cup. The base is the past and the home, so this seems to be an old room rather than a new one, and the striking thing is that it is still standing open.',
      'Above it, in the middle ring, a horse. Horses are read as news that travels quickly, and the coming months may bring word from a direction you had stopped watching. The two shapes sit close enough on the wall to be one: news out of something old.',
      'The rim is finely scattered, and the rim is now. This week looks busy rather than important. Try not to decide anything in it. Let the horse arrive first.',
    ],
    closing: 'Some doors are left open on purpose. Walking back through one is not the same as going backwards.',
  },
  {
    omen: 'An Almost Empty Cup',
    symbols: [
      { shape: 'wide clear porcelain', region: 'middle', meaning: 'an unusually open stretch' },
      { shape: 'a small heart, low down', region: 'handle', meaning: 'a steady affection' },
      { shape: 'a few dark specks', region: 'rim', meaning: 'small business, nothing more' },
    ],
    reading: [
      'Most of your cup is clean tonight. That happens less often than you would think, and readers tend to distrust it, but the middle ring, which is the coming months, is nearly bare porcelain. An open stretch.',
      'Near the handle there is a small heart, low and steady rather than dramatic. The handle is the people already close to you, and this reads like affection that is not going anywhere and does not need managing.',
      'There are a few dark specks at the rim: bills, messages, the ordinary friction of a week. Nothing in this cup is asking to be solved.',
    ],
    closing: 'An empty cup is not an empty life. Sometimes it only means nothing is owed right now.',
  },
  {
    omen: 'The Ladder and the Well',
    symbols: [
      { shape: 'a ladder', region: 'right-of-handle', meaning: 'a climb being offered' },
      { shape: 'a shape like a well', region: 'bottom', meaning: 'something old, not yet drawn up' },
      { shape: 'a broken line', region: 'rim', meaning: 'a wavering week' },
    ],
    reading: [
      'A ladder has settled to the right of your handle, and that side of the cup is what is coming toward you. A ladder is an offer rather than a gift. It may be a chance to climb, and climbing is work.',
      'At the base there is a shape like a well. The base holds what is deep and old, and a well is something you have not drawn up yet. It seems the climb above may depend on the thing below.',
      'The rim is broken into short lines, and the rim is this week. You do not have to feel certain to take the first rung. Certainty tends to turn up around the third.',
    ],
    closing: 'Start before you feel ready. The well keeps. The ladder does not.',
  },
];

export function pickSampleReading(seed = Math.random()) {
  const i = Math.floor(Math.abs(seed) * SAMPLE_READINGS.length) % SAMPLE_READINGS.length;
  return SAMPLE_READINGS[i];
}
