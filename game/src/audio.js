// audio.js — tiny synthesised sounds (WebAudio, no files): a pickup blip,
// an alarm swell while spotted, a win jingle and a caught sting.

let ac = null;
let alarmOsc = null;

function ctx() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  return ac;
}

function blip(freq, dur, type, vol, when = 0) {
  try {
    const a = ctx();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, a.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + when + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + when);
    o.stop(a.currentTime + when + dur);
  } catch (e) { /* sound is decoration; never break the game */ }
}

export const sfx = {
  pickup() {
    blip(880, 0.12, 'sine', 0.15);
    blip(1320, 0.18, 'sine', 0.12, 0.08);
  },
  smoke() {
    blip(220, 0.4, 'sawtooth', 0.06);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.25, 'triangle', 0.14, i * 0.12));
  },
  caught() {
    blip(196, 0.5, 'sawtooth', 0.14);
    blip(147, 0.7, 'sawtooth', 0.14, 0.15);
  },
  alarm(on) {
    try {
      const a = ctx();
      if (on && !alarmOsc) {
        alarmOsc = a.createOscillator();
        const g = a.createGain();
        alarmOsc.type = 'square';
        alarmOsc.frequency.value = 660;
        g.gain.value = 0.03;
        alarmOsc.connect(g).connect(a.destination);
        alarmOsc.start();
      } else if (!on && alarmOsc) {
        alarmOsc.stop();
        alarmOsc = null;
      }
    } catch (e) { /* ignore */ }
  },
};
