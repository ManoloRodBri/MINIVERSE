// Feedback effects shared by the three games: a white flash and a screen
// shake when you crash, and a pop on the score when you gain a point.
// The shake is a CSS transform on the canvas so it moves p5play's sprites
// too, which are drawn by the library and can't be wrapped in translate().
let juiceFlash = 0;
let juiceShake = 0;
let juiceScorePop = 0;
let juiceLabelText = '';
let juiceLabelAlpha = 0;
let __juiceCanvas = null;

function juiceHit(flash, shake) {
  juiceFlash = max(juiceFlash, flash);
  juiceShake = max(juiceShake, shake);
}

function juiceScore() {
  juiceScorePop = 1;
}

// A bonus point: pops the score and shows a short label beside it that fades
// out over a couple of seconds.
function juiceBonus(label) {
  juiceScorePop = 1;
  juiceLabelText = label;
  juiceLabelAlpha = 1;
}

function drawJuiceLabel(x, y) {
  if (juiceLabelAlpha < 0.02) return;
  push();
  noStroke();
  fill(255, juiceLabelAlpha * 255);
  textAlign(LEFT, TOP);
  textSize(14);
  text(juiceLabelText, x, y);
  pop();
}

function juiceScoreSize(baseSize) {
  return baseSize * (1 + juiceScorePop * 0.45);
}

// Call at the very end of draw(), in screen space (after camera.off()).
function juiceEndFrame() {
  if (juiceFlash > 0.01) {
    push();
    noStroke();
    fill(255, juiceFlash * 255);
    rect(0, 0, width, height);
    pop();
  }

  if (!__juiceCanvas) __juiceCanvas = document.querySelector('canvas');
  if (__juiceCanvas) {
    if (juiceShake > 0.3) {
      const dx = random(-juiceShake, juiceShake).toFixed(1);
      const dy = random(-juiceShake, juiceShake).toFixed(1);
      __juiceCanvas.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    } else if (__juiceCanvas.style.transform) {
      __juiceCanvas.style.transform = '';
    }
  }

  juiceFlash *= 0.86;
  juiceShake *= 0.86;
  juiceScorePop *= 0.88;
  juiceLabelAlpha *= 0.97;
}

function juiceReset() {
  juiceFlash = 0;
  juiceShake = 0;
  juiceScorePop = 0;
  juiceLabelAlpha = 0;
  if (__juiceCanvas) __juiceCanvas.style.transform = '';
}
