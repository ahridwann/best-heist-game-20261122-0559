// Midnight Vault — synthesized sound.
// One job: WebAudio beeps and chimes, made from oscillators, no audio files.
// Silent until the player first interacts (browser autoplay policy), and
// safe to call before the audio context exists.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    g.gain.setValueAtTime(gain || 0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur + 0.02);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    footstep(running) {
      tone(running ? 140 : 110, 0.05, 'triangle', running ? 0.05 : 0.03);
    },
    suspicious() { tone(520, 0.12, 'square', 0.05, 660); },
    beep() { tone(980, 0.09, 'square', 0.06); },
    alarm() { tone(220, 0.5, 'sawtooth', 0.09, 440); },
    pickup() { tone(660, 0.1, 'sine', 0.09, 990); tone(990, 0.14, 'sine', 0.07); },
    emp() { tone(1200, 0.35, 'sawtooth', 0.08, 120); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.09), i * 110));
    },
    lose() { tone(330, 0.4, 'sawtooth', 0.09, 110); },
  };
}
