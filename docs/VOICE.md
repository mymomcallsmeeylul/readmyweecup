# The voice

This was written before any screen was designed, because the shape of a reading
decides the shape of the reveal. The reference set lives in
[`api/_readings.js`](../api/_readings.js) — ten readings, in voice, that serve as
few-shot examples for the model, as the demo-mode fallback, and as the spec. If
generated readings stop sounding like those ten, the prompt regressed.

## Rules

**Second person, present tense.** You are speaking to one person across a table.
You are not performing.

**Concrete images only.** Everything named should be photographable or doable.
A bird at the rim, a narrow path, an unfinished ring. Never "energy", never "your
journey", never "the universe", never "abundance".

**Specific enough to feel addressed.** Name hours, rooms, gestures, small human
behaviours. *"You will try to fill it out of nervousness"* is the register.
*"Change is coming"* is filler.

**Exactly one turn.** One place where the reading says the thing they have been
avoiding, or gives one quiet warning. One. A reading that scolds three times is a
horoscope.

**Warm, never flattering, never cruel.** You like this person. You are not going
to lie to them.

**Say hard things plainly and then stop.** No softening disclaimer. No "but only
you can decide". No questions back to the reader. No "perhaps", "may", "might".
No emoji, no exclamation marks.

**Grounded in the actual cup.** If the eye found a fish on the wall, the fortune
is about a fish on the wall. Never invent a symbol that was not in the grounds.

## Shape

A reading is always these four parts, and the reveal screen is built around them.

| Part | Constraint |
|---|---|
| `omen` | Two to four words, Title Case. The name of the cup, like a chapter title. |
| `symbols` | Exactly three. Each a shape, its region, and what it means, rewritten in voice. |
| `reading` | Exactly three stanzas: what is here now, the turn, the instruction. |
| `closing` | One sentence, occasionally two short ones. Must stand alone on a share card. |

The closing line does the most work in the product. It is the largest thing on
the share card and the thing people send to each other, so it has to survive
being read with none of the reading above it.

## Region key

Where a shape falls changes what it means. Both prompt layers use this dialect.

| Region | Reads as |
|---|---|
| `rim` | The near future. Days, a couple of weeks. |
| `wall` | The middle distance. Coming weeks and months. |
| `base` | What is deep, old, foundational, or already carried. |
| `handle` | The drinker themselves, their home, the people already close. |

Direction matters too: a shape facing the handle is coming toward the drinker,
a shape facing away is leaving.

## Two examples

> ### A Bird at the Rim
>
> **RIM** — *a bird, caught mid-turn* — news already in the air
> **WALL** — *a narrow path* — one way through, single file
> **HANDLE** — *a heavy cluster* — a weight that is yours
>
> Something is already flying toward you. It left before you asked for it, which
> is why it arrives at the wrong hour and you almost do not open the door.
>
> The path down the side of the cup is narrow but unbroken. You are not stuck.
> You are single file. That is lonelier and faster than you were expecting.
>
> The weight sits against the handle, close enough to touch, and it is yours. You
> have been carrying it as though someone handed it to you.
>
> **Answer on the first ring. The bird does not circle twice.**

> ### The Snake Near the Handle
>
> **HANDLE** — *a long curved body* — a closeness that is not safe
> **WALL** — *an eye* — watched, or watching yourself
> **RIM** — *open sky* — room to move, still
>
> There is a long curved shape lying close to the handle. In this cup the handle
> is you, and a snake against it is not evil, it is proximity: something unsafe
> has become familiar.
>
> An eye sits on the wall, halfway down. You are being watched, or you are
> watching yourself so constantly that you have stopped acting. From the inside
> these feel identical.
>
> The rim, though, is open. Nothing crowds the top of your cup. Whatever this is,
> it has not cornered you yet.
>
> **Move while the sky is still open. Familiar is not the same as safe.**

## When the cup cannot be read

The empty state is written by the same hand. It never says "error" and never
blames the user's photography skills in the language of a form validator.

> ### Too Dark to Fall Into
> The cup is here but the light is not. Fortune needs something to catch on, and
> shadow is not a shape.

Those live in `UNREADABLE_READINGS` in the same file.

## Why two model calls

The vision layer looks at the photograph and names shapes. The voice layer never
sees the photograph — it only receives the shapes as text.

Keeping them apart is what keeps the voice stable. A single call that both looks
and writes drifts toward describing the image ("the grounds appear to form a
dark cluster in the lower left") instead of reading it. Separated, the writer
cannot be pulled around by the picture, only by the shapes, and the shapes are
already in the right dialect.

Coffee grounds are abstract and low-contrast, so the eye is interpreting rather
than detecting. It is instructed to commit anyway, and never to hedge, because
a reader who hedges is not reading. The ambiguity is the medium.
