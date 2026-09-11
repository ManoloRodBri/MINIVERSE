// Signals rising difficulty by inverting the whole page (black bg / white
// strokes -> white bg / black strokes) once `excess` (how far past the old
// difficulty threshold the game is) crosses 0, like the Google dinosaur
// game's night mode. The filter goes on <body> rather than the canvas so the
// white help and sound icons invert too instead of vanishing on white.

function intensityBackground(excess) {
  background(0);

  const shouldInvert = excess > 0;
  const isInverted = document.body.classList.contains('intensity-inverted');
  if (shouldInvert !== isInverted) {
    document.body.classList.toggle('intensity-inverted', shouldInvert);
    document.body.style.filter = shouldInvert ? 'invert(1)' : '';
    animateInvert(shouldInvert);
  }
}

// A plain fade passes through invert(0.5), where black and white turn the
// same grey and every platform vanishes; with a long fade that got players
// killed mid-change. This eases through the readable ends and cuts across
// the grey middle in under a tenth of a second. The style above already
// holds the end state, so nothing lingers once the animation finishes.
function animateInvert(on) {
  if (!document.body.animate) return;
  const f = t => 'invert(' + (on ? t : 1 - t) + ')';
  document.body.animate(
    [
      { filter: f(0), offset: 0 },
      { filter: f(0.2), offset: 0.45 },
      { filter: f(0.8), offset: 0.55 },
      { filter: f(1), offset: 1 }
    ],
    { duration: 900, easing: 'linear' }
  );
}

// Call from resetGame(): a death while inverted snaps straight back to
// normal instead of animating out of white on the "click to start" screen.
function resetIntensityBackground() {
  if (document.body.getAnimations) {
    document.body.getAnimations().forEach(a => a.cancel());
  }
  document.body.classList.remove('intensity-inverted');
  document.body.style.filter = '';
}
