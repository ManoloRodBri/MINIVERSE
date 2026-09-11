// "Click to start" prompt with a slow breathing pulse, to pull the eye and
// invite the click. Uses Math.sin instead of p5's sin() so it behaves the
// same no matter which angleMode the sketch is in.
function drawPulsingPrompt(message, x, y, baseSize) {
  const wave = (Math.sin(frameCount * 0.05) + 1) / 2;

  push();
  textAlign(CENTER, CENTER);
  textSize(baseSize * (1 + wave * 0.05));
  fill(255, 150 + wave * 105);
  text(message, x, y);
  pop();
}
