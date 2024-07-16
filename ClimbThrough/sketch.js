let pelota;
let lastLevelY;
let levelCounter = 0;
let levelsPassed = [];
let levelSpeed = 4;
let speedIncreaseInterval = 500;
let maxLevelSpeed = 12;
let gameStarted = false;
let particles = [];
let song;

function preload() {
  song = loadSound('inicio.mp3');
}

function setup() {
  textFont('JetBrains Mono');
  createCanvas(windowWidth, windowHeight);
  song.setVolume(0.5);

  pelota = new Sprite();
  pelota.diameter = 35;
  pelota.y = windowHeight - 100;
  pelota.strokeWeight = 1;
  pelota.color = 200;
  pelota.stroke = "white";
  pelota.velocity.y = 0;
  pelota.gravity = -0.2;

  lastLevelY = windowHeight;
  generateLevels();
}

function draw() {
  background(0);

  if (!gameStarted) {
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Click_para_comenzar", width / 2, height - 50);
  } else {
    pelota.velocity.x = (mouseX - pelota.position.x) * 0.2;

    pelota.velocity.y += pelota.gravity;
    pelota.position.y += pelota.velocity.y;
    pelota.velocity.y = constrain(pelota.velocity.y, -5, 5);

    moveLevels();
    checkLevelsPassed();


    fill(255);
    textSize(32);
    text(levelCounter, 30, 30);

    generateLevels();


    if (frameCount % speedIncreaseInterval === 0 && levelSpeed < maxLevelSpeed) {
      levelSpeed += 2;
      levelSpeed = min(levelSpeed, maxLevelSpeed);
    }

    if (pelota.position.y > windowHeight) {
      resetGame();
    }
  }
  updateParticles();
}

function mousePressed() {
  if (!gameStarted) {
    gameStarted = true;
    song.loop();
  }
}

function generateLevels() {

  while (lastLevelY > -300) {
    levels(lastLevelY - 300);
    lastLevelY -= 300;
  }
}

function levels(posY) {
  let space = 150;
  let h = 15;

  let wLeft = random(50, width - space - 50);
  let xLeft = wLeft / 2;

  let wRight = width - wLeft - space;
  let xRight = wLeft + space + wRight / 2;

  let spriteLeft = new Sprite();
  spriteLeft.width = wLeft;
  spriteLeft.height = h;
  spriteLeft.x = xLeft;
  spriteLeft.y = posY;
  spriteLeft.collider = 'k';
  spriteLeft.strokeWeight = 1;
  spriteLeft.color = "black";
  spriteLeft.stroke = "#ffffff";

  let spriteRight = new Sprite();
  spriteRight.width = wRight;
  spriteRight.height = h;
  spriteRight.x = xRight;
  spriteRight.y = posY;
  spriteRight.collider = 'k';
  spriteRight.strokeWeight = 1;
  spriteRight.color = "black";
  spriteRight.stroke = "#ffffff";

  levelsPassed.push({
    spriteLeft: spriteLeft,
    spriteRight: spriteRight,
    passed: false
  });
}

function moveLevels() {
  for (let i = levelsPassed.length - 1; i >= 0; i--) {
    let level = levelsPassed[i];
    level.spriteLeft.y += levelSpeed;
    level.spriteRight.y += levelSpeed;


    if (level.spriteLeft.y > height) {
      level.spriteLeft.remove();
      level.spriteRight.remove();
      levelsPassed.splice(i, 1);
    }
  }


  if (levelsPassed.length > 0) {
    lastLevelY = Math.min(...levelsPassed.map(l => l.spriteLeft.y));
  } else {
    lastLevelY = windowHeight;
    generateLevels();
  }
}

function checkLevelsPassed() {
  for (let i = levelsPassed.length - 1; i >= 0; i--) {
    let level = levelsPassed[i];
    if (pelota.y < level.spriteLeft.y && !level.passed) {
      level.passed = true;
      levelCounter++;
    }
  }
}

function resetGame() {
  pelota.position.y = windowHeight - 100;
  pelota.velocity.y = 0;
  pelota.velocity.x = 0;
  levelCounter = 0;
  levelsPassed.forEach(level => {
    level.spriteLeft.remove();
    level.spriteRight.remove();
  });
  levelsPassed = [];
  lastLevelY = windowHeight;
  levelSpeed = 4;
  gameStarted = false;
  song.stop();
  generateLevels();
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.lifetime = 255;
  }

  update() {
    this.pos.add(this.vel);
    this.lifetime -= 7;
  }

  show() {
    push();
    stroke(255, this.lifetime);
    fill(0, this.lifetime);
    ellipse(this.pos.x - camera.x + width / 2, this.pos.y - camera.y + height / 2, 5);
    pop();
  }

  isFinished() {
    return this.lifetime < 0;
  }
}

function updateParticles() {

  if (abs(pelota.vel.x) > 1 || abs(pelota.vel.y) > 1) {
    let particlesPerFrame = 1;
    for (let i = 0; i < particlesPerFrame; i++) {
      particles.push(new Particle(pelota.x, pelota.y));
    }
  }

  // Actualizar y mostrar las partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }
}