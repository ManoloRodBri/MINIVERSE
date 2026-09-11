// Sound effects synthesised on the fly with Web Audio (no audio files):
// each call builds a short oscillator with a pitch sweep and a fast fade.
// They follow the same on/off button as the music.
function sfxTone(type, fromHz, toHz, seconds, volume) {
  if (getSoundPreference() === false) return;
  if (typeof getAudioContext !== 'function') return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, t);
  osc.frequency.exponentialRampToValueAtTime(toHz, t + seconds);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

// Low falling thud with a bit of grit on top.
function sfxDeath() {
  sfxTone('sine', 220, 55, 0.4, 0.3);
  sfxTone('triangle', 120, 40, 0.25, 0.12);
}

// Tiny tick whose pitch follows the new gravity direction.
function sfxFlip(pointsUp) {
  if (pointsUp) sfxTone('sine', 320, 480, 0.06, 0.08);
  else sfxTone('sine', 480, 320, 0.06, 0.08);
}

// Soft upward sweep when the ball is thrown.
function sfxLaunch() {
  sfxTone('sine', 160, 480, 0.15, 0.1);
}
