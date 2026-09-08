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
 *   closing  a small blessing. The line people screenshot, so it stands alone.
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
      'Good evening, canım. Let me look properly. I see a bird at the very lip of your cup, caught mid-turn, and the rim is now, this week, these days. It left wherever it came from before you thought to ask for it. A bird like this does not circle, my dear. It comes once, at an hour that does not suit you, and it knocks.',
      'And look where it is flying. Toward a key, there by the handle, and the handle is the people already close to you. You have been telling yourself lately that nobody noticed what you have been carrying. I feel that. But the cup does not agree with you, canım, and neither do I. Someone near you has had their hand on a door for a while now, waiting.',
      'Underneath all of it the bottom sits heavy, and the bottom is the old ground. You might also read that weight as ballast rather than burden, my dear, it has kept you upright in worse weather than this. Still. Set a little of it down before the bird lands. You may want your hands free to open the door.',
    ],
    closing: 'May what is meant for you find you, canım, as long as you do not darken your heart.',
  },
  {
    omen: 'The Unfinished Ring',
    symbols: [
      { shape: 'a ring, open on one side', region: 'rim' },
      { shape: 'a straight road', region: 'middle' },
      { shape: 'a hand', region: 'right-of-handle' },
    ],
    reading: [
      'Come, my dear, let me see it. I see a ring at the rim of your cup and it has not closed. There is a gap in it you could put a finger through. The rim is now, canım, so this is not a thing for next year. It is sitting on your table this week, waiting on one word.',
      'And the word is yours. I see you turning it over, rehearsing it, deciding it is too soon. But look at the middle of the cup, look how the grounds run in one straight road down the wall. That stretch is clear. In all the cups I have looked into, a road like that has meant a season with very little standing in the way of it.',
      'There is a hand to the right of the handle, and that side is what comes toward you. Someone means to help, and I do not think they mean to wait to be asked. You might read that as luck. I would read it as something you gave out a long time ago, coming back on its own legs.',
    ],
    closing: 'Say the word, canım. The ring has been waiting on one syllable, not on fate.',
  },
  {
    omen: 'Heavy at the Bottom',
    symbols: [
      { shape: 'thick, banked grounds', region: 'bottom' },
      { shape: 'a clean channel', region: 'middle' },
      { shape: 'something small and light', region: 'rim' },
    ],
    reading: [
      'Ah. The bottom of your cup is dark tonight, my dear, banked up on one side like snow against a wall. The bottom is the old ground, the past and the home and the things that have been sitting with you. You have been carrying a thought for longer than you meant to.',
      'And you have been thinking nobody would quite understand it if you said it out loud. I feel that, deeply. But look, canım. Look at the middle of the cup: a clean channel runs right through the grounds, porcelain showing all the way down. The weight never closed your road. It is cut and it is waiting. It is only not walked yet.',
      'And there at the rim, something small and light, near enough to touch. Good things turning up while you are still tired is not an insult, my dear. It is only bad timing, and this stubbornness of yours, the one that got you through the winter, is more than equal to bad timing.',
    ],
    closing: 'You are allowed to put it down without solving it first, canım. Rest is not surrender.',
  },
  {
    omen: 'Two Roads and a Knot',
    symbols: [
      { shape: 'two paths, meeting', region: 'middle' },
      { shape: 'a knot', region: 'bottom' },
      { shape: 'an opening like a door', region: 'right-of-handle' },
    ],
    reading: [
      'Let me look properly, my dear. I see two lines coming down the wall of your cup, and they meet in the middle ring, which is the coming months. A crossing. Not a decision made, canım, a decision taking shape, and there is a great difference between the two. You have more room than you have been giving yourself.',
      'But underneath, near the base, the grounds have gathered into a knot. And here is the thing: the choice above is new, and the knot below is not. It was tied long before this. You have been trying to answer a question that is really an older question wearing a new coat.',
      'To the right of the handle something has opened like a door, and that side is what comes in. Loosen the old knot first, gently, the way you would work a chain rather than a shoelace. Do that and I think you may find the choice above unties itself while your back is turned.',
    ],
    closing: 'Not every knot wants the scissors, my dear. Some want better light and a slower hand.',
  },
  {
    omen: 'A Fish Near the Handle',
    symbols: [
      { shape: 'a fish', region: 'handle' },
      { shape: 'a cloud', region: 'rim' },
      { shape: 'a ladder', region: 'middle' },
    ],
    reading: [
      'Oh, this is a kind cup, canım. There is a fish by the handle of it. The handle is your own side, your home, the people already in it, and a fish there has meant plenty for as long as anyone has been turning cups over. And it is close, my dear. It is not out at sea somewhere. It is in your kitchen.',
      'At the rim there is a cloud, and the rim is today. So yes, there is a worry sitting on you, and I am not going to pretend otherwise. But a cloud at the rim is weather, not climate. It came in this week, and clouds like that mean to go out again.',
      'In the middle of the cup, a ladder. Ladders are never quick, my dear. What you are building looks like the year rather than the month, and I want you to hear that as a size and not as a delay. You are not slow, canım. The thing is simply tall.',
    ],
    closing: 'The plenty is already in the room, my dear. The worry is only standing in front of it.',
  },
  {
    omen: 'The Long Table',
    symbols: [
      { shape: 'a long unbroken line', region: 'middle' },
      { shape: 'a gap the shape of a chair', region: 'left-of-handle' },
      { shape: 'a star', region: 'rim' },
    ],
    reading: [
      'Look at this, my dear. A long line runs across the middle of your cup, unbroken, like a table laid out with people down both sides of it. The middle is the coming months. I see company in this season, canım, and I do not think you have had much of that lately.',
      'To the left of the handle there is a gap, and it is roughly the shape of a chair. The left side is what is leaving. Someone is stepping back, my dear, and I want to say this gently: that is not always a betrayal. Sometimes a person simply finishes their part, puts down the tray, and goes home. You gave them what you had. That was not wasted.',
      'And there at the rim, a star, which is the present tense of wanting. There is a wish in you that you have not said out loud, not properly, not even to yourself. A full table is exactly the place for it.',
    ],
    closing: 'Let the chair sit empty a while, canım. It is making room, not keeping score.',
  },
  {
    omen: 'A Coil and a Flower',
    symbols: [
      { shape: 'a coiled shape', region: 'middle' },
      { shape: 'a flower, opening', region: 'right-of-handle' },
      { shape: 'a smooth base', region: 'bottom' },
    ],
    reading: [
      'Now. I see a coiled shape on the wall of your cup, in the middle ring, and I know what you are already thinking. Let me say it plainly first, canım, so it does not sit in your chest all evening: this is not a threat. In the old readings a coil like this only ever meant keep your eyes open.',
      'So keep them open, my dear. Notice who you have been leaning on lately, not with suspicion, with attention. You have a habit of giving people the benefit of the doubt well past the point where they have earned it. That generosity is yours and I would not take it from you for anything. It simply wants a little supervision.',
      'And just to the right of the handle, something is opening like a flower, and that side is what enters your life. Whatever is arriving looks warm, and it may well arrive at the same time as the coil. That is why this cup wants you awake rather than worried. Look at the base, canım: smooth. Nothing heavy underneath any of it.',
    ],
    closing: 'Eyes open, hands unclenched, my dear. You are allowed both at once.',
  },
  {
    omen: 'The Door at the Base',
    symbols: [
      { shape: 'a door', region: 'bottom' },
      { shape: 'a horse', region: 'middle' },
      { shape: 'a fine scattering', region: 'rim' },
    ],
    reading: [
      'Ah, look at this. There is a door at the bottom of your cup, canım. The bottom is the past, the home, the old rooms. And this door is standing open. Not ajar, my dear. Open.',
      'Above it, in the middle ring, a horse, and a horse has always meant news that travels quickly. The two of them sit close enough on the wall to be one picture: word out of something old, from a direction you had stopped watching. You closed that account in your own mind a while ago. The cup has not closed it.',
      'The rim is finely scattered, and the rim is this week. Busy rather than important, I think. Do not decide anything in it, my dear. Let the horse arrive first. You might also read all that scattering as noise you have permission to ignore.',
    ],
    closing: 'Some doors are left open on purpose, canım. Walking back through one is not going backwards.',
  },
  {
    omen: 'An Almost Empty Cup',
    symbols: [
      { shape: 'wide clear porcelain', region: 'middle' },
      { shape: 'a small heart, low down', region: 'handle' },
      { shape: 'a few dark specks', region: 'rim' },
    ],
    reading: [
      'Well now. Most of your cup is clean tonight, my dear, and I will be honest with you: readers distrust a cup like this. We are trained to find something. But the middle ring, the coming months, is very nearly bare porcelain. An open stretch, canım.',
      'Near the handle there is a small heart, low down and steady rather than dramatic. The handle is the people already close to you. This is affection that is not going anywhere and does not need managing, my dear. You have been checking on it the way a person checks a lock they already turned.',
      'And there are a few dark specks at the rim. Bills, messages, the ordinary friction of a week. That is all they are. Nothing in this cup is asking to be solved, canım, and I would like you to sit a moment with how strange that feels before you go looking for something.',
    ],
    closing: 'An empty cup is not an empty life, my dear. Sometimes it only means nothing is owed right now.',
  },
  {
    omen: 'The Ladder and the Well',
    symbols: [
      { shape: 'a ladder', region: 'right-of-handle' },
      { shape: 'a shape like a well', region: 'bottom' },
      { shape: 'a broken line', region: 'rim' },
    ],
    reading: [
      'Come closer, canım. I see something to the right of your handle: a ladder. That side of the cup is what comes toward you, and a ladder is an offer, not a gift. It is a chance to climb, my dear, and climbing is work. Nobody has ever been carried up a ladder.',
      'And at the base, a shape like a well. The base holds what is deep and old, and a well is water you have not drawn up yet. Here is what the cup is saying, and I think you knew it before you turned the cup over: the climb above leans on the thing below. You cannot leave it down there and go up empty-handed.',
      'The rim is broken into short lines, which is this week, wavering. You do not have to feel certain to take the first rung, canım. In all my years I have never once seen certainty turn up before the third.',
    ],
    closing: 'Start before you feel ready, my dear. The well keeps. The ladder does not.',
  },
];

export function pickSampleReading(seed = Math.random()) {
  const i = Math.floor(Math.abs(seed) * SAMPLE_READINGS.length) % SAMPLE_READINGS.length;
  return SAMPLE_READINGS[i];
}
