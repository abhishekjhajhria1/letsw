// small Web Audio sound effects

type SoundName = "click" | "toggle" | "success" | "error" | "checkin" | "achievement" | "pop";

const MUTE_KEY = "lwts_muted";
let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gainPeak = 0.18) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  gain.gain.setValueAtTime(0.0001, c.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, c.currentTime + start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.02);
}

// note frequencies
const N = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, A4: 440, E4: 329.63, A5: 880, D5: 587.33 };

export function playSound(name: SoundName) {
  if (isMuted()) return;
  const c = audio();
  if (!c) return;
  switch (name) {
    case "click":
      tone(c, N.A5, 0, 0.06, "triangle", 0.08);
      break;
    case "toggle":
      tone(c, N.E5, 0, 0.07, "sine", 0.12);
      tone(c, N.A5, 0.05, 0.08, "sine", 0.12);
      break;
    case "pop":
      tone(c, N.C6, 0, 0.08, "sine", 0.14);
      break;
    case "checkin": // confident two-note "done"
      tone(c, N.E5, 0, 0.1, "triangle", 0.16);
      tone(c, N.G5, 0.08, 0.14, "triangle", 0.16);
      break;
    case "success": // rising triad
      tone(c, N.C5, 0, 0.1, "triangle", 0.16);
      tone(c, N.E5, 0.08, 0.1, "triangle", 0.16);
      tone(c, N.G5, 0.16, 0.16, "triangle", 0.16);
      break;
    case "achievement": // little fanfare
      tone(c, N.C5, 0, 0.1, "square", 0.12);
      tone(c, N.E5, 0.09, 0.1, "square", 0.12);
      tone(c, N.G5, 0.18, 0.1, "square", 0.12);
      tone(c, N.C6, 0.27, 0.24, "triangle", 0.18);
      break;
    case "error":
      tone(c, N.D5, 0, 0.12, "sawtooth", 0.1);
      tone(c, N.A4, 0.1, 0.18, "sawtooth", 0.1);
      break;
  }
}
