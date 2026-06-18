// synthesized focus noise (white / brown / rain), no audio files

export type NoiseType = "white" | "brown" | "rain";

let ctx: AudioContext | null = null;
let src: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let current: NoiseType | null = null;

function makeBuffer(c: AudioContext, brown: boolean) {
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  if (brown) {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  } else {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return buf;
}

export function playNoise(type: NoiseType, volume: number) {
  stopNoise();
  const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return;
  ctx = ctx || new C();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  src = ctx.createBufferSource();
  src.buffer = makeBuffer(ctx, type === "brown");
  src.loop = true;

  gain = ctx.createGain();
  gain.gain.value = volume;

  if (type === "rain") {
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    src.connect(filter);
    filter.connect(gain);
  } else {
    src.connect(gain);
  }
  gain.connect(ctx.destination);
  src.start();
  current = type;
}

export function stopNoise() {
  if (src) {
    try { src.stop(); } catch {}
    src.disconnect();
    src = null;
  }
  if (filter) { filter.disconnect(); filter = null; }
  if (gain) { gain.disconnect(); gain = null; }
  current = null;
}

export function setNoiseVolume(v: number) {
  if (gain) gain.gain.value = v;
}
