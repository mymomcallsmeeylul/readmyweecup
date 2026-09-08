/**
 * Ambient sound. Off by default, and it stays off until someone asks for it.
 *
 * Synthesised rather than streamed: no audio file to download, and nothing to
 * host, which keeps the promise that this app ships with no dependencies and
 * no build step. Three layers, quietest first:
 *
 *   the room     filtered brown noise, breathing slowly on a lowpass
 *   the hum      two barely-detuned sines at G2, beating against each other
 *   the melody   sparse bell tones, G major pentatonic, into a long reverb
 *
 * The melody is the point and the other two are the floor it rests on. It is
 * deliberately slow and deliberately irregular: notes land every three to six
 * seconds and never on a grid, so nothing ever resolves into a loop you can
 * hear repeating. A pentatonic scale means no two notes can clash, so the
 * randomness cannot produce a sour interval however long it runs.
 */

const FADE = 1.4;

/**
 * G major pentatonic, low to high, over the G2 drone. Kept as a flat array
 * because the melody walks it by index: steps are small and adjacent, which
 * is what makes a random walk sound like a melody rather than a shuffle.
 */
const SCALE = [
  293.66, // D4
  329.63, // E4
  392.0, //  G4
  440.0, //  A4
  493.88, // B4
  587.33, // D5
  659.25, // E5
  783.99, // G5
];

const NOTE_MIN_MS = 3000;
const NOTE_MAX_MS = 6200;
const REST_CHANCE = 0.18; // an occasional held silence, so it can breathe

export function createAmbient() {
  let ctx = null;
  let master = null;
  let melodyGain = null;
  let reverbSend = null;
  let nodes = [];
  let timer = null;
  let step = 2; // where the walk currently sits in SCALE
  let on = false;

  /** A short noise burst with an exponential tail: a plausible small hall. */
  function impulse(seconds, decay) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
      }
    }
    return buffer;
  }

  /**
   * One note. A sine for the body, a quiet triangle an octave up for the
   * strike, a slow bloom rather than a pluck, and a tail long enough that the
   * next note usually arrives while this one is still fading.
   */
  function ring(freq, velocity) {
    const at = ctx.currentTime;
    const tail = 5.5;

    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.value = freq;

    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.value = freq * 2;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.1;
    shimmer.connect(shimmerGain);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    // A 0.3s bloom, not a strike. The attack is what makes it a bell in a
    // room rather than a notification.
    env.gain.linearRampToValueAtTime(velocity, at + 0.3);
    env.gain.exponentialRampToValueAtTime(0.0001, at + tail);

    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1500;

    body.connect(env);
    shimmerGain.connect(env);
    env.connect(tone);
    tone.connect(melodyGain);
    tone.connect(reverbSend);

    body.start(at);
    shimmer.start(at);
    body.stop(at + tail + 0.1);
    shimmer.stop(at + tail + 0.1);

    // Oscillators are one-shot: they are unusable once stopped, so they clean
    // themselves up rather than accumulating for as long as the sound is on.
    body.onended = () => {
      body.disconnect();
      shimmer.disconnect();
      shimmerGain.disconnect();
      env.disconnect();
      tone.disconnect();
    };
  }

  /** A small random walk, so each note is a neighbour of the last. */
  function nextNote() {
    if (Math.random() < REST_CHANCE) return;

    step += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
    if (step < 0) step = 1;
    if (step > SCALE.length - 1) step = SCALE.length - 2;

    // Higher notes quieter, so the melody never pokes out of the bed.
    ring(SCALE[step], 0.16 - step * 0.008);
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(
      () => {
        if (!on || !ctx) return;
        nextNote();
        schedule();
      },
      NOTE_MIN_MS + Math.random() * (NOTE_MAX_MS - NOTE_MIN_MS),
    );
  }

  function build() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // --- the room -------------------------------------------------------
    const seconds = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      prev = (prev + 0.02 * white) / 1.02; // brown-ish: heavier at the bottom
      data[i] = prev * 3.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;
    filter.Q.value = 0.6;

    const noiseGain = ctx.createGain();
    // Pulled down from 0.5 to leave room for the melody on top.
    noiseGain.gain.value = 0.34;

    // Slow breathing on the filter so it never sits still.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 130;
    lfo.connect(lfoGain).connect(filter.frequency);

    noise.connect(filter).connect(noiseGain).connect(master);

    // --- the hum --------------------------------------------------------
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.045;
    droneGain.connect(master);

    const a = ctx.createOscillator();
    a.type = 'sine';
    a.frequency.value = 97.999;
    const b = ctx.createOscillator();
    b.type = 'sine';
    b.frequency.value = 98.62; // the beat between them is the movement
    a.connect(droneGain);
    b.connect(droneGain);

    // --- the melody -----------------------------------------------------
    melodyGain = ctx.createGain();
    melodyGain.gain.value = 0.9;
    melodyGain.connect(master);

    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(3.4, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.7;
    reverbSend.connect(reverb).connect(wet).connect(master);

    [noise, lfo, a, b].forEach((n) => n.start());
    nodes = [noise, lfo, a, b];
    return true;
  }

  return {
    get playing() {
      return on;
    },

    async toggle() {
      if (!ctx && !build()) return false;
      await ctx.resume().catch(() => {});

      on = !on;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(on ? 0.16 : 0, now + FADE);

      if (on) {
        // One note straight away, so turning it on is audibly something
        // happening rather than three seconds of maybe-it-is-broken.
        nextNote();
        schedule();
      } else {
        clearTimeout(timer);
        timer = null;
      }
      return on;
    },

    stop() {
      if (!ctx) return;
      on = false;
      clearTimeout(timer);
      timer = null;
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      });
      ctx.close().catch(() => {});
      ctx = null;
      nodes = [];
    },
  };
}
