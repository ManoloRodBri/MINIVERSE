// Remaining lives as small circles next to the score: filled for the ones
// left, outlined for the ones lost.
function drawLives(x, y, lives, maxLives) {
  push();
  stroke(255);
  strokeWeight(1);
  for (let i = 0; i < maxLives; i++) {
    if (i < lives) fill(255);
    else noFill();
    circle(x + 5 + i * 16, y, 9);
  }
  pop();
}
