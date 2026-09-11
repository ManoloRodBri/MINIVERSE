let pelota;
let obstacles = [];
let velocidadPelota = 4;
let velocidadUmbral = 30;
let floors = [];
let nextObstacleX;
let distanciaEntreObstaculos = 300;
let score = 0;
let particles = [];
let gameStarted = false;
let pelotaInitialPos;
let song;
let bestScore = 0;
const bestScoreKey = 'miniverse-gravityshift-best';
const maxLives = 3;
let lives = maxLives;
// Frames left of the blinking grace after a crash: anything the ball runs
// into meanwhile is knocked out of the way instead of costing a life.
let invulnerableFrames = 0;
const invulnerableTime = 90;
// Passing an obstacle with at most this much space between the ball and it
// counts as a near miss.
const nearMissDistance = 20;

function preload() {
  song = loadSound('../inicio.mp3');
}

function setup() {
  textFont('JetBrains Mono');
  createCanvas(windowWidth, windowHeight);
  // p5play steps physics at a fixed 1/60 per frame, and the speed ramp counts
  // frames, so an uncapped 120Hz screen would run the game at 2x.
  frameRate(60);
  world.gravity.y = 55;
  song.setVolume(0.5);

  pelotaInitialPos = createVector(width / 2, height / 2);
  pelota = new Sprite(pelotaInitialPos.x, pelotaInitialPos.y, 20, 20);
  pelota.diameter = 35;
  pelota.color = 200;
  pelota.stroke = "white";

  createFloors();

  nextObstacleX = pelotaInitialPos.x + distanciaEntreObstaculos;

  generateObstacles(10, distanciaEntreObstaculos);

  bestScore = loadBestScore(bestScoreKey);
  bindSoundButton(song);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  intensityBackground(max(0, velocidadPelota - velocidadUmbral));

  if (!gameStarted) {
    drawPulsingPrompt("Click_para_comenzar", width / 2, height - 50, 32);
    pelota.x = pelotaInitialPos.x;
    pelota.y = pelotaInitialPos.y;
    pelota.vel.x = 0;
    camera.x = width / 2;
  } else {
    camera.x = pelota.position.x;

    updateParticles(particles, pelota, {
      velocityThreshold: 1,
      decayRate: 7,
      offsetX: -camera.x + width / 2,
      offsetY: -camera.y + height / 2
    });

    updateFloors();

    if (invulnerableFrames > 0) {
      invulnerableFrames--;
      pelota.visible = invulnerableFrames === 0 || floor(invulnerableFrames / 6) % 2 === 0;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (!pelota.overlaps(obstacles[i].sprite)) continue;
      if (invulnerableFrames > 0) {
        removeObstacle(i);
        continue;
      }
      loseLife(i);
      return;
    }

    velocidadPelota += 0.01;
    pelota.vel.x = velocidadPelota;

    if (pelota.position.x > nextObstacleX - width) {
      generateObstacles(1, obstacleSpacing());
    }

    for (let obstacle of obstacles) {
      trackClearance(obstacle);
      if (!obstacle.passed && pelota.position.x > obstacle.x + obstacle.w / 2) {
        obstacle.passed = true;
        if (obstacle.minClearance <= nearMissDistance) {
          score += 2;
          juiceBonus('AL RAS');
        } else {
          score++;
          juiceScore();
        }
      }
    }

    bestScore = updateBestScore(bestScoreKey, score, bestScore);

    fill(255);
    textAlign(LEFT, TOP);
    textSize(juiceScoreSize(32));
    text(score, 30, 30);
    let scoreWidth = textWidth(String(score));
    textSize(16);
    text('MEJOR ' + bestScore, 30, 70);
    drawLives(30, 102, lives, maxLives);
    drawJuiceLabel(30 + scoreWidth + 10, 40);
  }
  juiceEndFrame();
}

function mousePressed() {
  // p5 delivers clicks while preload() is still loading the music, before
  // setup() has built the ball.
  if (!pelota) return;
  if (!gameStarted) {
    gameStarted = true;
    pelota.x = pelotaInitialPos.x;
    pelota.y = pelotaInitialPos.y;
    pelota.vel.x = velocidadPelota;
    camera.x = pelota.x;
    applySoundPreference(song, true);
  } else {
    world.gravity.y = -world.gravity.y;
    sfxFlip(world.gravity.y < 0);
  }
}

class Obstacle {
  constructor(x, y, w, h) {
    this.sprite = new Sprite(x, y, w, h);
    this.sprite.collider = 'static';
    this.sprite.color = color(255, 255, 255, 50);
    this.sprite.stroke = 'white';
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.passed = false;
    this.minClearance = Infinity;
  }
}

// Second difficulty axis: obstacles grow as the ball speeds up. The corridor
// between the two floors is 300px, so the cap of 180 always leaves a 120px
// passage (the ball is 35px) - tight, but never impossible.
function alturaMaximaObstaculo() {
  return min(100 + (velocidadPelota - 4) * 3, 180);
}

// Distance to the next obstacle. Switching sides takes the ball up to ~14
// frames (tallest obstacles, crossing from one passage to the other); with a
// margin to react, the free stretch between two obstacles has to last about
// 22 frames at the current speed, or late in a run it becomes impossible.
// Below speed ~21 that's still the usual 600px.
function obstacleSpacing() {
  return max(600, velocidadPelota * 22 + 135);
}

// Obstacles used to be an independent coin flip each time, which reads as
// noise. These are short authored runs, shuffled one after another, so the
// level has a rhythm you can learn to read.
const obstaclePatterns = [
  ['top', 'top', 'bottom', 'bottom'],
  ['top', 'bottom', 'top', 'bottom'],
  ['bottom', 'bottom', 'bottom', 'top'],
  ['top', 'top', 'top', 'bottom', 'bottom'],
  ['bottom', 'top', 'top', 'bottom'],
  ['top', 'bottom', 'bottom', 'top', 'top'],
  ['bottom', 'bottom', 'top', 'top', 'bottom'],
  ['top', 'top', 'bottom', 'top', 'bottom']
];
// From speed 34, runs that switch sides on almost every obstacle join the mix
// (twice as likely as the others), so late runs ask for a flip each time.
const hardObstaclePatterns = [
  ['top', 'bottom', 'top', 'bottom', 'top', 'bottom'],
  ['bottom', 'top', 'bottom', 'top', 'bottom'],
  ['top', 'bottom', 'bottom', 'top', 'bottom', 'top']
];
let patternQueue = [];

function nextObstacleSide() {
  if (patternQueue.length === 0) {
    let pool = velocidadPelota >= 34
      ? obstaclePatterns.concat(hardObstaclePatterns, hardObstaclePatterns)
      : obstaclePatterns;
    patternQueue = random(pool).slice();
  }
  return patternQueue.shift();
}

function generateObstacles(numObstacles, spacing) {
  for (let i = 0; i < numObstacles; i++) {
    let x = nextObstacleX;

    // The very first obstacle of a run is always an easy one up top.
    let side = obstacles.length === 0 ? 'top' : nextObstacleSide();
    let h = obstacles.length === 0 ? random(50, 100) : random(50, alturaMaximaObstaculo());
    let y = side === 'top' ? windowHeight - 500 + h / 2 : windowHeight - 200 - h / 2;

    obstacles.push(new Obstacle(x, y, random(50, 100), h));
    nextObstacleX = x + spacing;
  }
}

// Closest the ball gets to an obstacle while alongside it: the space between
// the ball's edge and the obstacle's inner edge (negative once they overlap).
function trackClearance(obstacle) {
  let r = pelota.diameter / 2;
  if (Math.abs(pelota.x - obstacle.x) > obstacle.w / 2 + r) return;
  let gap = obstacle.y < windowHeight - 350
    ? (pelota.y - r) - (obstacle.y + obstacle.h / 2)
    : (obstacle.y - obstacle.h / 2) - (pelota.y + r);
  obstacle.minClearance = min(obstacle.minClearance, gap);
}

function removeObstacle(i) {
  obstacles[i].sprite.remove();
  obstacles.splice(i, 1);
}

function loseLife(hitIndex) {
  lives--;
  sfxDeath();
  if (lives <= 0) {
    resetGame();
    juiceHit(0.5, 10);
    return;
  }
  juiceHit(0.35, 7);
  removeObstacle(hitIndex);
  invulnerableFrames = invulnerableTime;
}

function createFloors() {
  for (let i = 0; i < 3; i++) {
    let floor = new Sprite(i * windowWidth, windowHeight - 200, windowWidth, 10);
    floor.height = 0.5;
    floor.stroke = "white";
    floor.collider = 'static';
    floors.push(floor);

    let floor2 = new Sprite(i * windowWidth, windowHeight - 500, windowWidth, 10);
    floor2.height = 0.5;
    floor2.stroke = "white";
    floor2.collider = 'static';
    floors.push(floor2);
  }
}

function updateFloors() {
  for (let floor of floors) {
    if (floor.x + windowWidth / 2 < camera.x - width / 2) {
      floor.x += 3 * windowWidth;
    }
  }
}

function resetGame() {
  resetIntensityBackground();
  juiceReset();
  obstacles.forEach(obstacle => obstacle.sprite.remove());
  obstacles = [];
  floors.forEach(floor => floor.remove());
  floors = [];
  particles = [];

  velocidadPelota = 4;
  patternQueue = [];
  score = 0;
  lives = maxLives;
  invulnerableFrames = 0;
  pelota.visible = true;
  world.gravity.y = 55;

  pelota.x = pelotaInitialPos.x;
  pelota.y = pelotaInitialPos.y;
  pelota.vel.x = 0;
  pelota.vel.y = 0;

  createFloors();
  nextObstacleX = pelotaInitialPos.x + distanciaEntreObstaculos;
  generateObstacles(10, distanciaEntreObstaculos);

  gameStarted = false;
  song.stop();
}
