let pelota;
let lastLevelY;
let levelCounter = 0;
let levelsPassed = [];
let levelSpeed = 4;
let speedIncreaseInterval = 500;
let speedThreshold = 12;
let runFrames = 0;
let gameStarted = false;
let particles = [];
let song;
let bestScore = 0;
const bestScoreKey = 'miniverse-climbthrough-best';
const maxLives = 3;
let lives = maxLives;
// Frames left of the pause after a lost life: the screen is cleared and the
// ball waits, blinking, before the levels start falling again.
let respawnFrames = 0;
const respawnPause = 60;
// Zigzag runs (from levelSpeed 16): levels left in the current run, which side
// the next gap goes to, and how many ordinary levels since the last run.
let zigzagLeft = 0;
let zigzagSide = 1;
let levelsSinceZigzag = 0;

function preload() {
  song = loadSound('../inicio.mp3');
}

function setup() {
  textFont('JetBrains Mono');
  createCanvas(windowWidth, windowHeight);
  // p5play steps physics at a fixed 1/60 per frame, and the speed ramps below
  // count frames, so an uncapped 120Hz screen would run the game at 2x.
  frameRate(60);
  song.setVolume(0.5);

  pelota = new Sprite();
  pelota.diameter = 35;
  pelota.y = windowHeight - 100;
  pelota.strokeWeight = 1;
  pelota.color = 200;
  pelota.stroke = "white";
  pelota.velocity.y = 0;
  pelota.gravity = -0.2;

  bindSoundButton(song);

  lastLevelY = windowHeight;
  generateLevels();

  bestScore = loadBestScore(bestScoreKey);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  intensityBackground(max(0, levelSpeed - speedThreshold));

  if (!gameStarted) {
    drawPulsingPrompt("Click_para_comenzar", width / 2, height - 50, 32);
  } else {
    pelota.velocity.x = (mouseX - pelota.position.x) * 0.2;

    if (respawnFrames > 0) {
      // After a lost life nothing falls and the ball holds its height, so you
      // can line up under the first gap before it all starts again.
      respawnFrames--;
      pelota.velocity.y = 0;
      pelota.visible = respawnFrames === 0 || floor(respawnFrames / 6) % 2 === 0;
    } else {
      pelota.velocity.y += pelota.gravity;
      pelota.position.y += pelota.velocity.y;
      pelota.velocity.y = constrain(pelota.velocity.y, -5, 5);

      moveLevels();
      trackLevelContacts();
      checkLevelsPassed();
      generateLevels();

      runFrames++;
      if (runFrames % speedIncreaseInterval === 0) {
        levelSpeed += 2;
      }
    }

    bestScore = updateBestScore(bestScoreKey, levelCounter, bestScore);

    fill(255);
    textAlign(LEFT, TOP);
    textSize(juiceScoreSize(32));
    text(levelCounter, 30, 30);
    let scoreWidth = textWidth(String(levelCounter));
    textSize(16);
    text('MEJOR ' + bestScore, 30, 70);
    drawLives(30, 102, lives, maxLives);
    drawJuiceLabel(30 + scoreWidth + 10, 40);

    if (pelota.position.y > windowHeight) {
      loseLife();
      return;
    }
  }
  updateParticles(particles, pelota, {
    velocityThreshold: 1,
    decayRate: 7,
    offsetX: -camera.x + width / 2,
    offsetY: -camera.y + height / 2
  });
  juiceEndFrame();
}

function mousePressed() {
  // p5 delivers clicks while preload() is still loading the music, before
  // setup() has built the ball.
  if (!pelota) return;
  if (!gameStarted) {
    gameStarted = true;
    applySoundPreference(song, true);
  }
}

function generateLevels() {

  while (lastLevelY > -300) {
    levels(lastLevelY - 300);
    lastLevelY -= 300;
  }
}

// Motion for a new level's gap, or null for a still one. Nothing moves until
// levelSpeed 8; from there the chance, swing and speed grow with it. Swing x
// speed tops out at 8px per frame so the ball can always keep up.
function gapMotion() {
  if (levelSpeed < 8) return null;
  let over = levelSpeed - 8;
  if (random() > min(0.3 + over * 0.1, 0.9)) return null;
  return {
    amplitude: min(40 + over * 15, 160),
    speed: min(0.02 + over * 0.004, 0.05),
    phase: random(TWO_PI)
  };
}

function slideGap(level) {
  level.age++;
  let m = level.motion;
  let gapLeft = constrain(level.gapBase + Math.sin(m.phase + level.age * m.speed) * m.amplitude, 30, width - level.space - 30);
  level.spriteLeft.x = gapLeft - level.spriteLeft.width / 2;
  level.spriteRight.x = gapLeft + level.space + level.spriteRight.width / 2;
}

// From levelSpeed 16, every so often a run of 3 to 5 levels puts the gap on
// alternate sides, so you cross the screen from one level to the next. The
// two sides are at most 360px apart.
function nextZigzagGap(space) {
  if (levelSpeed < 16) return null;
  if (zigzagLeft === 0) {
    levelsSinceZigzag++;
    if (levelsSinceZigzag < 5 || random() > 0.35) return null;
    zigzagLeft = floor(random(3, 6));
    zigzagSide = random() < 0.5 ? -1 : 1;
    levelsSinceZigzag = 0;
  }
  zigzagLeft--;
  let spread = min(360, width - space - 100);
  let gapCenter = width / 2 + zigzagSide * spread / 2;
  zigzagSide = -zigzagSide;
  return constrain(gapCenter - space / 2, 50, width - space - 50);
}

function levels(posY) {
  // Second difficulty axis: the gap tightens as the levels speed up, with a
  // floor of 90px (the ball is 35px wide) so it always stays passable.
  let space = max(90, 150 - (levelSpeed - 4) * 4);
  let h = 15;

  // Both bars are twice the screen wide and slide together, so when a gap
  // moves the only opening is ever the gap itself, never a screen edge.
  let zigzagGap = nextZigzagGap(space);
  let gapLeft = zigzagGap !== null ? zigzagGap : random(50, width - space - 50);
  let barWidth = width * 2;

  let spriteLeft = new Sprite();
  spriteLeft.width = barWidth;
  spriteLeft.height = h;
  spriteLeft.x = gapLeft - barWidth / 2;
  spriteLeft.y = posY;
  spriteLeft.collider = 'k';
  spriteLeft.strokeWeight = 1;
  spriteLeft.color = "black";
  spriteLeft.stroke = "#ffffff";

  let spriteRight = new Sprite();
  spriteRight.width = barWidth;
  spriteRight.height = h;
  spriteRight.x = gapLeft + space + barWidth / 2;
  spriteRight.y = posY;
  spriteRight.collider = 'k';
  spriteRight.strokeWeight = 1;
  spriteRight.color = "black";
  spriteRight.stroke = "#ffffff";

  levelsPassed.push({
    spriteLeft: spriteLeft,
    spriteRight: spriteRight,
    passed: false,
    touched: false,
    gapBase: gapLeft,
    space: space,
    // Zigzag gaps stay put: the run itself is the challenge.
    motion: zigzagGap !== null ? null : gapMotion(),
    age: 0
  });
}

function moveLevels() {
  for (let i = levelsPassed.length - 1; i >= 0; i--) {
    let level = levelsPassed[i];
    level.spriteLeft.y += levelSpeed;
    level.spriteRight.y += levelSpeed;
    if (level.motion) slideGap(level);


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

// Marks a level as touched once the ball brushes one of its bars; getting
// through a level without touching it is a clean pass.
function trackLevelContacts() {
  let r = pelota.diameter / 2 + 1;
  for (let level of levelsPassed) {
    if (level.passed || level.touched) continue;
    let dy = max(0, Math.abs(pelota.y - level.spriteLeft.y) - level.spriteLeft.height / 2);
    if (dy > r) continue;
    let gapStart = level.spriteLeft.x + level.spriteLeft.width / 2;
    let gapEnd = level.spriteRight.x - level.spriteRight.width / 2;
    let dxLeft = max(0, pelota.x - gapStart);
    let dxRight = max(0, gapEnd - pelota.x);
    if (Math.hypot(dxLeft, dy) <= r || Math.hypot(dxRight, dy) <= r) level.touched = true;
  }
}

function checkLevelsPassed() {
  for (let i = levelsPassed.length - 1; i >= 0; i--) {
    let level = levelsPassed[i];
    if (pelota.y < level.spriteLeft.y && !level.passed) {
      level.passed = true;
      if (level.touched) {
        levelCounter++;
        juiceScore();
      } else {
        levelCounter += 2;
        juiceBonus('LIMPIA');
      }
    }
  }
}

function loseLife() {
  lives--;
  sfxDeath();
  if (lives <= 0) {
    resetGame();
    juiceHit(0.5, 10);
    return;
  }
  juiceHit(0.35, 7);
  // Clear the screen and lay the levels out again from the bottom, as at the
  // start, keeping the score and the current speed.
  clearLevels();
  generateLevels();
  pelota.position.y = windowHeight - 100;
  pelota.velocity.x = 0;
  pelota.velocity.y = 0;
  respawnFrames = respawnPause;
}

function clearLevels() {
  levelsPassed.forEach(level => {
    level.spriteLeft.remove();
    level.spriteRight.remove();
  });
  levelsPassed = [];
  lastLevelY = windowHeight;
  zigzagLeft = 0;
}

function resetGame() {
  resetIntensityBackground();
  juiceReset();
  pelota.position.y = windowHeight - 100;
  pelota.velocity.y = 0;
  pelota.velocity.x = 0;
  pelota.visible = true;
  levelCounter = 0;
  clearLevels();
  levelsSinceZigzag = 0;
  levelSpeed = 4;
  runFrames = 0;
  lives = maxLives;
  respawnFrames = 0;
  gameStarted = false;
  song.stop();
  generateLevels();
}
