/**
 * Ambient sound. Off by default, and it stays off until someone asks for it.
 *
 * Synthesised rather than streamed: no audio file to download, and nothing to
 * host. Filtered brown noise for the room, two barely-detuned sines underneath
 * for the low hum. Quiet enough to sit behind the reading.
 */

const FADE = 1.4;

export function createAmbient() {
  let ctx = null;
  let master = null;
  let nodes = [];
  let on = false;

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
    noiseGain.gain.value = 0.5;

    // Slow breathing on the filter so it never sits still.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 130;
    lfo.connect(lfoGain).connect(filter.frequency);

    noise.connect(filter).connect(noiseGain).connect(master);

    // --- the hum --------------------------------------------------------
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    droneGain.connect(master);

    const a = ctx.createOscillator();
    a.type = 'sine';
    a.frequency.value = 97.999;
    const b = ctx.createOscillator();
    b.type = 'sine';
    b.frequency.value = 98.62; // the beat between them is the movement
    a.connect(droneGain);
    b.connect(droneGain);

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
      return on;
    },

    stop() {
      if (!ctx) return;
      on = false;
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
