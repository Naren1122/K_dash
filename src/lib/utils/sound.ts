/**
 * Generates a clean, modern two-tone notification chime using the Web Audio API.
 * Does not require external audio assets or downloads.
 */
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return null;
      sharedAudioContext = new AudioContextClass();
    }

    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume().catch(() => {});
    }

    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Two-tone chime: D5 (587.33 Hz) ➔ A5 (880 Hz)
    playTone(587.33, now, 0.22);
    playTone(880.0, now + 0.12, 0.38);
  } catch (error) {
    console.debug("Audio play skipped:", error);
  }
}

export function playChatSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const playTone = (freq: number, startTime: number, duration: number, vol = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Pleasant high melodic pop: C6 (1046.5 Hz) ➔ G6 (1567.98 Hz)
    playTone(1046.5, now, 0.1, 0.12);
    playTone(1567.98, now + 0.06, 0.18, 0.16);
  } catch (error) {
    console.debug("Chat sound skipped:", error);
  }
}
