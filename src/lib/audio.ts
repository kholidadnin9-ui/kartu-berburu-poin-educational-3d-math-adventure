import type { Settings } from "./game";
let ctx: AudioContext | null = null;
let melody: ReturnType<typeof setInterval> | null = null;
let config: Settings | null = null;
export function audioSettings(s: Settings) {
  config = s;
  if (melody) {
    clearInterval(melody);
    melody = null;
  }
  if (s.music && !s.mute && ctx) {
    let beat = 0;
    const notes = [
      392, 0, 494, 587, 440, 0, 523, 659, 494, 587, 440, 0, 392, 494, 330, 0,
    ];
    melody = setInterval(() => {
      const n = notes[beat++ % notes.length];
      if (n && !document.hidden) tone(n, 0.26, "sine", 0.025);
    }, 370);
  }
}
function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.09,
  delay = 0,
) {
  if (!ctx || !freq) return;
  const t = ctx.currentTime + delay,
    o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, gain * ((config?.volume ?? 45) / 100)),
    t + 0.012,
  );
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + duration + 0.01);
}
export function sound(
  kind:
    | "click"
    | "scan"
    | "right"
    | "wrong"
    | "jump"
    | "coin"
    | "star"
    | "portal"
    | "victory"
    | "zonk",
) {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      if (config) audioSettings(config);
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    if (config?.mute || config?.effects === false) return;
    const notes = {
      click: [540],
      scan: [660, 990],
      right: [523, 659, 784],
      wrong: [330, 294],
      jump: [330, 500],
      coin: [790, 1050],
      star: [660, 880, 1100],
      portal: [392, 494, 587, 784],
      victory: [523, 659, 784, 1047],
      zonk: [390, 260, 300],
    }[kind];
    notes.forEach((n, i) =>
      tone(n, kind === "click" ? 0.065 : 0.16, "sine", 0.1, i * 0.075),
    );
  } catch {
    /* Silent mode on devices without Web Audio. */
  }
}
