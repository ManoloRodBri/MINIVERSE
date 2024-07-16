let pelota;
let mousePresionado = false;
let obstacles = []; 
let velocidadPelota = 4; 
let velocidadMaxima = 30; 
let floors = [];
let nextObstacleX; 
let distanciaEntreObstaculos = 300; 
let consecutiveTopObstacles = 0; 
let consecutiveBottomObstacles = 0; 
let score = 0; 
let particles = [];
let gameStarted = false; 
let pelotaInitialPos; 
let song;

function preload() {
  song = loadSound('inicio.mp3');
}

function setup() {
  textFont('JetBrains Mono');
  createCanvas(windowWidth, windowHeight);
  world.gravity.y = 55;
  song.setVolume(0.5);

  pelotaInitialPos = createVector(width / 2, height / 2);
  pelota = new Sprite(pelotaInitialPos.x, pelotaInitialPos.y, 20, 20);
  pelota.diameter = 35;
  pelota.color = 200;
  pelota.stroke = "white";

  createFloors();
 
  nextObstacleX = pelotaInitialPos.x + distanciaEntreObstaculos;

  generateObstacles(10);
}

function draw() {
  background(0);

  if (!gameStarted) {
  
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Click_para_comenzar", width / 2, height - 50); 
    pelota.position = pelotaInitialPos.copy(); 
    pelota.vel.x = 0; 
    camera.x = width / 2; 
  } else {
    
    camera.x = pelota.position.x;

    updateParticles();

    updateFloors();

    for (let obstacle of obstacles) {
      obstacle.display();
      if (pelota.overlaps(obstacle.sprite)) {
        location.reload();
      }
    }

    if (velocidadPelota < velocidadMaxima) {
      velocidadPelota += 0.005; 
    }
    pelota.vel.x = velocidadPelota;

    if (pelota.position.x > nextObstacleX - width) {
      generateObstacles(1); 
      nextObstacleX += distanciaEntreObstaculos; 
    }

    for (let obstacle of obstacles) {
      if (!obstacle.passed && pelota.position.x > obstacle.x + obstacle.w / 2) {
        obstacle.passed = true;
        score++;
      }
    }

    fill(255);
    textSize(32);
    textAlign(LEFT, TOP);
    text(score, 50, 30); 
  }
}

function mousePressed() {
  if (!gameStarted) {
    gameStarted = true;
    pelota.position = pelotaInitialPos.copy(); 
    pelota.vel.x = velocidadPelota; 
    camera.x = pelota.position.x; 
    song.loop(); 
  } else {
    world.gravity.y = -world.gravity.y;
  }
}

function mouseReleased() {
  mousePresionado = false;
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
  }
  display() {
    
  }
}

function generateObstacles(numObstacles) {
  for (let i = 0; i < numObstacles; i++) {
    let x = nextObstacleX; 
    let y, h;
    let placeOnTop = false;

    if (obstacles.length === 0) {
      y = windowHeight - 500; 
      h = random(50, 100);
      y += h / 2;
      placeOnTop = true;
      consecutiveTopObstacles = 1;
      consecutiveBottomObstacles = 0;
    } else {
      if (consecutiveTopObstacles >= 4) {
        y = windowHeight - 200;
        h = random(50, 100);
        y -= h / 2;
        placeOnTop = false;
        consecutiveTopObstacles = 0;
        consecutiveBottomObstacles++;
      } else if (consecutiveBottomObstacles >= 4) {
        y = windowHeight - 500;
        h = random(50, 100); 
        y += h / 2;
        placeOnTop = true;
        consecutiveTopObstacles++;
        consecutiveBottomObstacles = 0;
      } else {
        if (random() < 0.5) {
          y = windowHeight - 200; 
          h = random(50, 100); 
          y -= h / 2; 
          placeOnTop = false;
          consecutiveTopObstacles = 0;
          consecutiveBottomObstacles++;
        } else {
          y = windowHeight - 500; 
          h = random(50, 100); 
          y += h / 2; 
          placeOnTop = true;
          consecutiveTopObstacles++;
          consecutiveBottomObstacles = 0;
        }
      }
    }

    let obstacle = new Obstacle(x, y, random(50, 100), h); // Ancho aleatorio
    obstacles.push(obstacle);

    nextObstacleX = x + distanciaEntreObstaculos; // Actualizar la última posición X para el siguiente obstáculo
  }
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

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }
}
