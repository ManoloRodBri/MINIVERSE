
let particles = [];
let song;

function preload() {
  song = loadSound('inicio.mp3');
}

class Particle {
  constructor() {
    this.x = random(0, width);
    this.y = random(0, height);
    this.r = random(1, 8);
    this.xSpeed = random(-0.5, 0.5);
    this.ySpeed = random(-0.5, 0.5);
  }

  createParticle() {
    noStroke();
    fill('rgba(255,255,255,0.5)');
    circle(this.x, this.y, this.r);
  }

  moveParticle() {
    if (this.x < 0 || this.x > width) this.xSpeed *= -1;
    if (this.y < 0 || this.y > height) this.ySpeed *= -1;
    this.x += this.xSpeed;
    this.y += this.ySpeed;
  }

  joinParticles(particles) {
    particles.forEach((element) => {
      let dis = dist(this.x, this.y, element.x, element.y);
      if (dis < 85) {
        stroke('rgba(255,255,255,0.04)');
        line(this.x, this.y, element.x, element.y);
      }
    });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('black');
  song.setVolume(0.5);
  for (let i = 0; i < width / 10; i++) {
    particles.push(new Particle());
  }

  const playButton = document.getElementById('playButton');
  playButton.addEventListener('click', toggleSound);
}

function draw() {
  background('#0f0f0f');
  for (let i = 0; i < particles.length; i++) {
    particles[i].createParticle();
    particles[i].moveParticle();
    particles[i].joinParticles(particles.slice(i));
  }
}

function startTransition() {
  const overlay = document.getElementById('overlay');
  overlay.classList.add('show');

  setTimeout(() => {
    window.location.href = './Lobby/index.html';
  }, 1000); // Duración de la transición en milisegundos
}

function toggleSound() {
  const playButton = document.getElementById('playButton');
  if (song.isPlaying()) {
    song.pause();
    playButton.classList.remove('pause');
    playButton.classList.add('play');
  } else {
    song.loop();
    playButton.classList.remove('play');
    playButton.classList.add('pause');
  }


}
