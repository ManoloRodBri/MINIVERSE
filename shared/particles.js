class Particle {
  constructor(x, y, decayRate) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.lifetime = 255;
    this.decayRate = decayRate;
  }

  update() {
    this.pos.add(this.vel);
    this.lifetime -= this.decayRate;
  }

  show(offsetX, offsetY) {
    push();
    stroke(255, this.lifetime);
    fill(0, this.lifetime);
    ellipse(this.pos.x + offsetX, this.pos.y + offsetY, 5);
    pop();
  }

  isFinished() {
    return this.lifetime < 0;
  }
}

// source needs .x, .y and .vel.x, .vel.y (a p5.play Sprite works as-is)
function updateParticles(particles, source, opts = {}) {
  const {
    velocityThreshold = 1,
    decayRate = 7,
    offsetX = 0,
    offsetY = 0
  } = opts;

  if (abs(source.vel.x) > velocityThreshold || abs(source.vel.y) > velocityThreshold) {
    particles.push(new Particle(source.x, source.y, decayRate));
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show(offsetX, offsetY);
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }
}
