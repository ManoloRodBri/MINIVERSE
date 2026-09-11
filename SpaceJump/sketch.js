let pelota;
let canastas = [];
let particles = [];
let angleRanges = [
  { min: -20, max: -60 },
  { min: -120, max: -160 }
];
let canastaCenters = [];
let visitedCanastas = [];
let strokeStart = [];
let minR = 300;
let maxR = 500;
let comfortScore = 15;
let movingCanastas = [];
// Baskets generated since the last moving one. Starts at Infinity so the
// first basket past the comfort score already moves.
let canastasSinceMove = Infinity;
let bestScore = 0;
const bestScoreKey = 'miniverse-spacejump-best';
let mouseHeld = false;
const maxArrowLength = 200;
let lastStationaryPosition = null;
let lastRestY = 0;
let ispelotaMoving = false;
let score = 0;
let song;
const maxLives = 3;
let lives = maxLives;
// Basket the ball last rested in; losing a life drops you back into it.
let lastSafeCanasta = 0;
// How the current throw has touched each nearby basket: separate contacts,
// the height of the first one, and the most the ball rose above that.
let basketTouches = new Map();
let throwInFlight = false;
// From crumbleScore on, the basket you're resting in falls after a countdown.
const crumbleScore = 50;
let crumble = null;

function preload() {
  song = loadSound('../inicio.mp3');
}

function setup() {
  textFont('JetBrains Mono');
  angleMode(DEGREES);
  createCanvas(windowWidth, windowHeight);
  // p5play steps physics at a fixed 1/60 per frame, so an uncapped 120Hz
  // screen would run the game at 2x.
  frameRate(60);

  pelota = new Sprite();
  pelota.x = width / 2;
  pelota.y = height / 2;
  pelota.diameter = 30;
  pelota.collider = 'dynamic';
  pelota.color = 200;
  pelota.stroke = "white";
  pelota.bounciness = 0.3;
  pelota.friction = 1.0;
  pelota.drag = 0.2;


  canast(0, 0, false);
  // The ball spawns resting in the first basket; that isn't a throw, so it
  // starts out visited instead of handing out a free point.
  visitedCanastas = [0];

  world.gravity.y = 9;
  song.setVolume(0.5);
  applySoundPreference(song, true);
  bindSoundButton(song);

  lastRestY = pelota.y;
  bestScore = loadBestScore(bestScoreKey);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  intensityBackground(max(0, score - comfortScore));

  camera.on();
  camera.x = pelota.x;
  // Baskets are always above the ball, so the view looks ahead of it: the
  // ball sits lower on screen and the next baskets fit in full. The aiming
  // maths reads camera.y too, so it stays in sync.
  camera.y = pelota.y - height * 0.2;
  updateParticles(particles, pelota, { velocityThreshold: 5, decayRate: 10 });

  pelota.draw();

  updateMovingCanastas();
  updateCrumble();
  trackBasketTouches();
  for (let i = 0; i < canastas.length; i += 2) {
    drawCanastaV(canastas[i], canastas[i + 1], crumbleAlpha(i / 2));
  }

  if (mouseIsPressed && !mouseHeld) {
    mouseHeld = true;
    strokeStart = [mouseX + camera.x - width / 2, mouseY + camera.y - height / 2];
  }

  if (mouseHeld) {
    drawArrow();
    if (pelotaEnReposo()) drawTrajectory();
  }

  if (!mouseIsPressed && mouseHeld) {
    mouseHeld = false;
    if (pelotaEnReposo()) {
      let v = launchVelocity();
      if (v) {
        pelota.vel.x = v.x;
        pelota.vel.y = v.y;
        sfxLaunch();
        basketTouches.clear();
        throwInFlight = true;
      }
    }
    strokeStart = [];
  }


  if (abs(pelota.vel.x) < 0.1 && abs(pelota.vel.y) < 0.1) {
    if (ispelotaMoving) {
      ispelotaMoving = false;
      if (lastStationaryPosition === null || dist(pelota.x, pelota.y, lastStationaryPosition.x, lastStationaryPosition.y) > 10) {
        lastStationaryPosition = createVector(pelota.x, pelota.y);
        lastRestY = pelota.y;

        // Only landing inside a new basket scores: 1 point, or 2 for a clean
        // landing, one where the ball settles without bouncing.
        let landed = canastaIndexAt(pelota.x, pelota.y);
        if (landed !== -1) {
          lastSafeCanasta = landed;
          if (!visitedCanastas.includes(landed)) {
            visitedCanastas.push(landed);
            if (landedClean(landed)) {
              score += 2;
              juiceBonus('LIMPIA');
            } else {
              score += 1;
              juiceScore();
            }
          }
          startCrumbleIfDue(landed);
          // Cleared only on a real landing: the top of a straight-up throw also
          // reads as "at rest" for a frame, and must not end the throw there.
          throwInFlight = false;
        }
      }
    }

  } else {
    ispelotaMoving = true;
  }

  // Falling far below the last spot you rested at costs a life.
  if (pelota.y > lastRestY + 700) {
    loseLife();
    return;
  }

  if (canastas.length < 10 || canastas[canastas.length - 1].y > pelota.y - height) {
    generarNuevaCanasta();
  }

  bestScore = updateBestScore(bestScoreKey, score, bestScore);

  camera.off();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(juiceScoreSize(32));
  text(score, 30, 30);
  let scoreWidth = textWidth(String(score));
  textSize(16);
  text('MEJOR ' + bestScore, 30, 70);
  drawLives(30, 102, lives, maxLives);
  drawJuiceLabel(30 + scoreWidth + 10, 40);
  juiceEndFrame();
  camera.on();
}

// The original guard compared the raw velocity to a tiny number, so any
// negative velocity passed it and you could re-launch mid-flight.
function pelotaEnReposo() {
  return abs(pelota.vel.x) < 0.1 && abs(pelota.vel.y) < 0.1;
}

// Index of the basket the ball is resting in, or -1. A basket's two legs meet
// below the midpoint of their centres, which is where the ball settles.
function canastaIndexAt(x, y) {
  for (let i = 0; i < canastas.length; i += 2) {
    let cx = (canastas[i].x + canastas[i + 1].x) / 2;
    let cy = (canastas[i].y + canastas[i + 1].y) / 2;
    if (dist(x, y, cx, cy) < 60 * canastas[i].canastaScale) return i / 2;
  }
  return -1;
}

function launchVelocity() {
  let vec = createVector(strokeStart[0] - (mouseX + camera.x - width / 2), strokeStart[1] - (mouseY + camera.y - height / 2), 0);
  vec.limit(maxArrowLength);
  if (vec.mag() <= 1) return null;
  return {
    x: lerp(0, 14, vec.x / maxArrowLength),
    y: lerp(0, 14, vec.y / maxArrowLength)
  };
}

// Dotted preview of the throw, integrated with the same gravity and damping
// planck uses, so it traces the real flight. Up to the comfort score it's the
// full line. When the colours flip it drops to half, then every point trims it
// further down to its first 3 dots, so aiming leans more on skill as you go.
function drawTrajectory() {
  let v = launchVelocity();
  if (!v) return;

  let vx = v.x;
  let vy = v.y;
  let px = pelota.x;
  let py = pelota.y;
  let g = (world.gravity.y * world.meterSize) / 3600;
  let damp = 1 / (1 + pelota.drag / 60);

  let over = score - comfortScore;
  let steps = over <= 0 ? 130 : max(30, 65 - (over - 1) * 3);

  push();
  noStroke();
  for (let i = 1; i <= steps; i++) {
    vx *= damp;
    vy = (vy + g) * damp;
    px += vx;
    py += vy;
    if (i % 9 === 0) {
      fill(255, 170 - i);
      circle(px, py, 4);
    }
  }
  pop();
}

function drawArrow() {
  let fx = strokeStart[0];
  let fy = strokeStart[1];

  let mouseVector = createVector(fx - (mouseX + camera.x - width / 2), fy - (mouseY + camera.y - height / 2), 0);
  mouseVector.limit(maxArrowLength);

  strokeWeight(3);
  stroke(255);
  line(fx, fy, fx - mouseVector.x, fy - mouseVector.y);
}

function canast(x, y, allowMoving = true) {
  let offsetX = width / 2;
  let offsetY = height / 2;

  let s = basketScaleForScore();
  canastaCenters.push({ x, y });

  let canasta_a = new Sprite();
  canasta_a.x = offsetX + x + 37.5 * s;
  canasta_a.y = offsetY + y;
  canasta_a.w = 110 * s;
  canasta_a.h = 10;
  canasta_a.rotation = -45;
  canasta_a.collider = 'static';
  canasta_a.visible = false;
  canasta_a.canastaScale = s;

  canastas.push(canasta_a);

  let canasta_b = new Sprite();
  canasta_b.x = offsetX + x - 37.5 * s;
  canasta_b.y = offsetY + y;
  canasta_b.w = 117 * s;
  canasta_b.h = 10;
  canasta_b.rotation = 45;
  canasta_b.collider = 'static';
  canasta_b.visible = false;
  canasta_b.canastaScale = s;
  canastas.push(canasta_b);

  // Past the comfort score some baskets move, and more of them the further
  // you get (see movingInterval), each along a single axis. The swing grows
  // with the score but is capped so it can never push a basket past what a
  // full-power throw reaches.
  let over = max(0, score - comfortScore);
  let moves = false;
  if (allowMoving && score > comfortScore) {
    canastasSinceMove++;
    if (canastasSinceMove >= movingInterval()) {
      moves = true;
      canastasSinceMove = 0;
    }
  }
  if (moves) {
    movingCanastas.push({
      a: canasta_a,
      b: canasta_b,
      axis: random() < 0.5 ? 'x' : 'y',
      baseA: { x: canasta_a.x, y: canasta_a.y },
      baseB: { x: canasta_b.x, y: canasta_b.y },
      amplitude: random(15, min(35 + over * 1.5, 60)),
      degreesPerFrame: random(1, min(3 + over * 0.15, 7)),
      phase: random(360)
    });
  }
}

// Baskets keep their full size until 40 points, then shrink 2% per point down
// to 65%: a smaller opening to land in, still wide enough for the ball.
function basketScaleForScore() {
  return score < 40 ? 1 : max(0.65, 1 - (score - 40) * 0.02);
}

// How many baskets per moving one: 1 in 6 right after the comfort score, then
// one fewer every 7 points (1 in 5, 4, 3), settling at 1 in 2 so there's always
// a still basket between two moving ones.
function movingInterval() {
  return max(2, 6 - floor((score - comfortScore - 1) / 7));
}

function updateMovingCanastas() {
  for (let i = movingCanastas.length - 1; i >= 0; i--) {
    let m = movingCanastas[i];

    // Once the ball is inside a moving basket, that basket stops for good:
    // landing on the moving target is the challenge, and the next throw is
    // aimed from still ground. It also means a static collider is never slid
    // out from under a ball resting on it.
    let cx = (m.a.x + m.b.x) / 2;
    let cy = (m.a.y + m.b.y) / 2;
    if (dist(pelota.x, pelota.y, cx, cy) < 45 * m.a.canastaScale) {
      movingCanastas.splice(i, 1);
      continue;
    }

    let angle = (frameCount * m.degreesPerFrame + m.phase) % 360;
    let offset = sin(angle) * m.amplitude;
    m.a[m.axis] = m.baseA[m.axis] + offset;
    m.b[m.axis] = m.baseB[m.axis] + offset;
  }
}

// Starts the countdown on the basket the ball rests in, from crumbleScore on:
// about 4s at 50 points, down to 2.5s from 80. Landing back in the same basket
// keeps the time already spent, so short hops can't reset it.
function startCrumbleIfDue(k) {
  if (score < crumbleScore) return;
  if (crumble && crumble.index === k) return;
  crumble = {
    index: k,
    frames: 0,
    limit: max(150, 240 - (score - crumbleScore) * 3),
    falling: false,
    vy: 0,
    homeAY: canastas[k * 2].y,
    homeBY: canastas[k * 2 + 1].y
  };
}

function updateCrumble() {
  if (!crumble) return;
  let a = canastas[crumble.index * 2];
  let b = canastas[crumble.index * 2 + 1];

  if (!crumble.falling) {
    // Time only runs while the ball is actually in that basket.
    if (canastaIndexAt(pelota.x, pelota.y) === crumble.index) crumble.frames++;
    if (crumble.frames >= crumble.limit) {
      crumble.falling = true;
      // A resting ball is asleep and wouldn't notice its basket leaving.
      pelota.sleeping = false;
    }
    return;
  }

  // The basket drops faster than the ball falls, so it pulls away from under it.
  if (a.y - crumble.homeAY > 2000) return;
  crumble.vy += 0.6;
  a.y += crumble.vy;
  b.y += crumble.vy;
}

// The crumbling basket blinks over the last 60% of its countdown, twice as
// fast over the last 30%.
function crumbleAlpha(k) {
  if (!crumble || crumble.index !== k || crumble.falling) return 255;
  let left = 1 - crumble.frames / crumble.limit;
  if (left > 0.6) return 255;
  let period = left > 0.3 ? 16 : 8;
  return floor(crumble.frames / period) % 2 === 0 ? 255 : 60;
}

// While a throw is in the air, records how it touches every basket near the
// ball: each new contact, and how far the ball climbs above the height of the
// first one. A real throw always arrives at an angle and glances off one arm
// into the other, so some contact break always happens; what reads as a
// bounce is pinging around the basket or hopping back up.
function trackBasketTouches() {
  if (!throwInFlight) return;
  let reach = pelota.diameter / 2 + 5 + 1.5;
  for (let i = 0; i < canastas.length; i += 2) {
    let k = i / 2;
    let a = canastas[i];
    let b = canastas[i + 1];
    let t = basketTouches.get(k);
    if (!t && dist(pelota.x, pelota.y, (a.x + b.x) / 2, (a.y + b.y) / 2) > 150) continue;
    let touching = min(legDistance(a), legDistance(b)) <= reach;
    if (!t) {
      if (!touching) continue;
      t = { contacts: 0, touching: false, firstY: pelota.y, rise: 0 };
      basketTouches.set(k, t);
    }
    if (touching && !t.touching) t.contacts++;
    t.touching = touching;
    t.rise = max(t.rise, t.firstY - pelota.y);
  }
}

// Clean: touched the basket at most twice (one arm, then the other) and never
// hopped more than 6px back up. Over a grid of real throws between baskets,
// about one landing in five qualifies.
function landedClean(k) {
  let t = basketTouches.get(k);
  return !!t && t.contacts <= 2 && t.rise <= 6;
}

// Distance from the ball's centre to a leg's centre line.
function legDistance(leg) {
  let g = legGeometry(leg);
  let vx = g.endMinus.x - g.endPlus.x;
  let vy = g.endMinus.y - g.endPlus.y;
  let t = constrain(((pelota.x - g.endPlus.x) * vx + (pelota.y - g.endPlus.y) * vy) / (vx * vx + vy * vy), 0, 1);
  return dist(pelota.x, pelota.y, g.endPlus.x + t * vx, g.endPlus.y + t * vy);
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
  respawnAtSafeCanasta();
}

// Drops the ball back into the last basket it rested in, rebuilding it if it
// was the one that crumbled. That basket is already visited, so it scores
// nothing, and a fresh countdown starts once the ball settles.
function respawnAtSafeCanasta() {
  if (crumble) {
    canastas[crumble.index * 2].y = crumble.homeAY;
    canastas[crumble.index * 2 + 1].y = crumble.homeBY;
    crumble = null;
  }
  let a = canastas[lastSafeCanasta * 2];
  let b = canastas[lastSafeCanasta * 2 + 1];
  pelota.x = (a.x + b.x) / 2;
  pelota.y = (a.y + b.y) / 2 - 60 * a.canastaScale;
  pelota.vel.x = 0;
  pelota.vel.y = 0;
  pelota.sleeping = false;
  lastRestY = pelota.y;
  lastStationaryPosition = null;
  ispelotaMoving = true;
  basketTouches.clear();
  throwInFlight = false;
  mouseHeld = false;
  strokeStart = [];
}

function legGeometry(s) {
  let rad = (s.rotation * Math.PI) / 180;
  let u = { x: Math.cos(rad), y: Math.sin(rad) };
  let n = { x: -Math.sin(rad), y: Math.cos(rad) };
  let hw = s.w / 2;
  return {
    center: { x: s.x, y: s.y },
    u: u,
    n: n,
    hh: s.h / 2,
    endPlus: { x: s.x + u.x * hw, y: s.y + u.y * hw },
    endMinus: { x: s.x - u.x * hw, y: s.y - u.y * hw }
  };
}

function lineIntersection(p1, p2, p3, p4) {
  let d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 0.0001) return null;
  let a = p1.x * p2.y - p1.y * p2.x;
  let b = p3.x * p4.y - p3.y * p4.x;
  return {
    x: (a * (p3.x - p4.x) - (p1.x - p2.x) * b) / d,
    y: (a * (p3.y - p4.y) - (p1.y - p2.y) * b) / d
  };
}

function offsetPoint(p, dir, amount) {
  return { x: p.x + dir.x * amount, y: p.y + dir.y * amount };
}

// The two colliders that make up a canasta are separate rectangles that
// overlap past each other at the corner. Drawing them as-is shows the
// overlap as an X, so instead both arms are trimmed to where their edges
// actually meet (a mitre join) and the result is drawn as one closed
// chevron: black fill, white border, same look as the other platforms.
function drawCanastaV(a, b, alpha = 255) {
  let ga = legGeometry(a);
  let gb = legGeometry(b);

  let aInner = dist(ga.endPlus.x, ga.endPlus.y, b.x, b.y) < dist(ga.endMinus.x, ga.endMinus.y, b.x, b.y) ? ga.endPlus : ga.endMinus;
  let aOuter = aInner === ga.endPlus ? ga.endMinus : ga.endPlus;
  let bInner = dist(gb.endPlus.x, gb.endPlus.y, a.x, a.y) < dist(gb.endMinus.x, gb.endMinus.y, a.x, a.y) ? gb.endPlus : gb.endMinus;
  let bOuter = bInner === gb.endPlus ? gb.endMinus : gb.endPlus;

  // Inside of the V is the wedge between both arms.
  let interiorRef = { x: (aOuter.x + bOuter.x) / 2, y: (aOuter.y + bOuter.y) / 2 };
  let aIn = ((interiorRef.x - ga.center.x) * ga.n.x + (interiorRef.y - ga.center.y) * ga.n.y) >= 0 ? ga.n : { x: -ga.n.x, y: -ga.n.y };
  let bIn = ((interiorRef.x - gb.center.x) * gb.n.x + (interiorRef.y - gb.center.y) * gb.n.y) >= 0 ? gb.n : { x: -gb.n.x, y: -gb.n.y };
  let aOut = { x: -aIn.x, y: -aIn.y };
  let bOut = { x: -bIn.x, y: -bIn.y };

  let aCapIn = offsetPoint(aOuter, aIn, ga.hh);
  let aCapOut = offsetPoint(aOuter, aOut, ga.hh);
  let bCapIn = offsetPoint(bOuter, bIn, gb.hh);
  let bCapOut = offsetPoint(bOuter, bOut, gb.hh);

  let pIn = lineIntersection(offsetPoint(aInner, aIn, ga.hh), aCapIn, offsetPoint(bInner, bIn, gb.hh), bCapIn);
  let pOut = lineIntersection(offsetPoint(aInner, aOut, ga.hh), aCapOut, offsetPoint(bInner, bOut, gb.hh), bCapOut);
  if (!pIn || !pOut) return;

  push();
  fill(0);
  stroke(255, alpha);
  strokeWeight(1);
  beginShape();
  vertex(aCapIn.x, aCapIn.y);
  vertex(aCapOut.x, aCapOut.y);
  vertex(pOut.x, pOut.y);
  vertex(bCapOut.x, bCapOut.y);
  vertex(bCapIn.x, bCapIn.y);
  vertex(pIn.x, pIn.y);
  endShape(CLOSE);
  pop();
}

function generarNuevaCanasta() {
  let ultima = canastaCenters[canastaCenters.length - 1];
  let ultimoX = ultima.x;
  let ultimoY = ultima.y;

  // A full-power throw (speed 14) carries ~1000px at 45deg but only ~700px at
  // the 20deg end of angleRanges, so the reach has to stay well under that or
  // baskets become physically impossible. Distance is capped here and the
  // difficulty keeps climbing through the moving baskets instead.
  let distanceBonus = min(score * 8, 60);
  let minClearance = 220;

  let candidateX, candidateY;
  for (let attempt = 0; attempt < 12; attempt++) {
    let rango = random(angleRanges);
    let nuevoAngulo = random(rango.min, rango.max);
    let nuevoR = random(minR + distanceBonus, maxR + distanceBonus);
    candidateX = ultimoX + nuevoR * cos(nuevoAngulo);
    candidateY = ultimoY + nuevoR * sin(nuevoAngulo);

    let tooClose = canastaCenters.some(c => dist(c.x, c.y, candidateX, candidateY) < minClearance);
    if (!tooClose) break;
  }

  canast(candidateX, candidateY);
}

function resetGame() {
  resetIntensityBackground();
  juiceReset();
  song.stop();
  applySoundPreference(song, true);
  pelota.x = width / 2;
  pelota.y = height / 2;
  pelota.vel.x = 0;
  pelota.vel.y = 0;
  lastRestY = pelota.y;
  canastas.forEach(canasta => canasta.remove());
  canastas = [];
  canastaCenters = [];
  movingCanastas = [];
  canastasSinceMove = Infinity;
  lives = maxLives;
  lastSafeCanasta = 0;
  basketTouches.clear();
  throwInFlight = false;
  crumble = null;
  score = 0;
  canast(0, 0, false);
  visitedCanastas = [0];
  lastStationaryPosition = null;
  ispelotaMoving = false;
}

