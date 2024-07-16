let canastas = [];
let particles = [];
let angleRanges = [
  { min: -20, max: -60 },
  { min: -120, max: -160 }
];
let visitedCanastas = [];
let strokeStart = [];
let minR = 300;
let maxR = 500;
let mouseHeld = false;
const maxArrowLength = 200;
let lastStationaryPosition = null;
let ispelotaMoving = false;
let score = 0;
let song;

function preload() {
  song = loadSound('inicio.mp3');
}

function setup() {
  textFont('JetBrains Mono');
  angleMode(DEGREES);
  createCanvas(windowWidth, windowHeight);

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


  canast(0, 0);


  world.gravity.y = 9;
  song.loop();
  song.setVolume(0.5);
}

function draw() {
  background(0);

  camera.on();
  camera.x = pelota.x;
  camera.y = pelota.y;
  updateParticles();

  pelota.draw();


  for (let i = 0; i < canastas.length; i++) {
    canastas[i].draw();
  }

  if (mouseIsPressed && !mouseHeld) {
    mouseHeld = true;
    strokeStart = [mouseX + camera.x - width / 2, mouseY + camera.y - height / 2];
  }

  if (mouseHeld) {
    drawArrow();
  }

  if (!mouseIsPressed && mouseHeld) {
    mouseHeld = false;
    if ((pelota.vel.x) < 0.000000000001 && (pelota.vel.y) < 0.000000000001) {
      let vec = createVector(strokeStart[0] - (mouseX + camera.x - width / 2), strokeStart[1] - (mouseY + camera.y - height / 2), 0);
      vec.limit(maxArrowLength);
      if (vec.mag() > 1) {
        pelota.vel.x = lerp(0, 14, vec.x / maxArrowLength);
        pelota.vel.y = lerp(0, 14, vec.y / maxArrowLength);
      }
    }
    strokeStart = [];
  }


  if (abs(pelota.vel.x) < 0.1 && abs(pelota.vel.y) < 0.1) {
    if (ispelotaMoving) {
      ispelotaMoving = false;
      if (lastStationaryPosition === null || dist(pelota.x, pelota.y, lastStationaryPosition.x, lastStationaryPosition.y) > 10) {
        lastStationaryPosition = createVector(pelota.x, pelota.y);

        let found = false;
        for (let i = 0; i < canastas.length; i++) {
          if (dist(pelota.x, pelota.y, canastas[i].x, canastas[i].y) < 50) {
            if (!visitedCanastas.includes(i)) {
              visitedCanastas.push(i);
              score++;
            }
            found = true;
            break;
          }
        }


        if (!found) {
          visitedCanastas.push(-1);
          score++;
        }
      }
    }

  } else {
    ispelotaMoving = true;
  }


  if ((pelota.vel.x) < 15 && (pelota.vel.y) > 15) {
    resetGame();
  }

  if (canastas.length < 10 || canastas[canastas.length - 1].y > pelota.y - height) {
    generarNuevaCanasta();
  }

  camera.off();
  fill(255);
  textSize(32);
  textAlign(RIGHT, TOP);
  text(score, 50, 30);
  camera.on();
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

function canast(x, y) {
  let offsetX = width / 2;
  let offsetY = height / 2;

  let canasta_a = new Sprite();
  canasta_a.x = offsetX + x + 37.5;
  canasta_a.y = offsetY + y;
  canasta_a.w = 110;
  canasta_a.h = 10;
  canasta_a.rotation = -45;
  canasta_a.collider = 'static';
  canasta_a.color = "black";
  canasta_a.stroke = "white";

  canastas.push(canasta_a);

  let canasta_b = new Sprite();
  canasta_b.x = offsetX + x - 37.5;
  canasta_b.y = offsetY + y;
  canasta_b.w = 117;
  canasta_b.h = 10;
  canasta_b.rotation = 45;
  canasta_b.collider = 'static';
  canasta_b.color = "black";
  canasta_b.stroke = "white";
  canastas.push(canasta_b);
}

function generarNuevaCanasta() {
  let ultimaCanasta = canastas[canastas.length - 1];
  let ultimoX = ultimaCanasta.x - width / 2;
  let ultimoY = ultimaCanasta.y - height / 2;

  let rango = random(angleRanges);
  let nuevoAngulo = random(rango.min, rango.max);
  let nuevoR = random(minR, maxR);
  let dx = nuevoR * cos(nuevoAngulo);
  let dy = nuevoR * sin(nuevoAngulo);

  canast(ultimoX + dx, ultimoY + dy);
}

function resetGame() {
  song.stop();
  song.play();
  pelota.x = width / 2;
  pelota.y = height / 2;
  pelota.vel.x = 0;
  pelota.vel.y = 0;
  canastas.forEach(canasta => canasta.remove());
  canastas = [];
  canast(0, 0);
  score = 0;
  visitedCanastas = [];
  lastStationaryPosition = null;
  ispelotaMoving = false;
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.lifetime = 255;
  }

  update() {
    this.pos.add(this.vel);
    this.lifetime -= 10;
  }

  show() {
    push();
    stroke(255, this.lifetime);
    fill(0, this.lifetime);
    ellipse(this.pos.x, this.pos.y, 5);
    pop();
  }

  isFinished() {
    return this.lifetime < 0;
  }
}

function updateParticles() {
  if (abs(pelota.vel.x) > 5 || abs(pelota.vel.y) > 5) {
    let particlesPerFrame = 1;
    for (let i = 0; i < particlesPerFrame; i++) {
      particles.push(new Particle(pelota.x, pelota.y));
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }
}
