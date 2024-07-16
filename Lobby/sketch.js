let buttonSpheres = [];
let buttonURLs = ["../ClimbThrough/index.html", "../SpaceJump/index.html", "../GravityShift/index.html"];
let cam;
let zoomLevel = 1000;
const minZoom = 1000;
const maxZoom = 1000;
let particles = [];
let song;

function preload() {
  song = loadSound('inicio.mp3');
}

function setup() {

  createCanvas(windowWidth, windowHeight, WEBGL);
  song.setVolume(0.5);
  const playButton = document.getElementById('playButton');
  playButton.addEventListener('click', toggleSound);

  cam = createCamera();

  esferas = [];

  for (let i = 0; i < width / 9; i++) {
    particles.push(new Particle());
  }

  buttonSpheres.push(new SphereButton(-300, 50, 300, 90, 15, 5, color(0), color(255, 255, 255), buttonURLs[0]));
  buttonSpheres.push(new SphereButton(0, -100, 50, 100, 15, 3, color(0), color(255), buttonURLs[1]));
  buttonSpheres.push(new SphereButton(250, 200, 200, 90, 15, 2, color(0), color(255), buttonURLs[2]));
}

function draw() {

  background("black");
  zoomLevel = constrain(zoomLevel, minZoom, maxZoom);
  cam.setPosition(0, 0, zoomLevel);
  cam.lookAt(-50, 80, 0);
  orbitControl(2, 2);


  for (let i = 0; i < particles.length; i++) {
    particles[i].createParticle();
    particles[i].moveParticle();
    particles[i].joinParticles(particles.slice(i));
  }
  for (let buttonSphere of buttonSpheres) {
    buttonSphere.display();
    buttonSphere.checkHover(mouseX - width / 2, mouseY - height / 2);
  }
}

class SphereButton {
  constructor(x, y, z, r, segX, segY, fillColor, strokeColor, url) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.r = r;
    this.segX = segX;
    this.segY = segY;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.url = url;
    this.hover = false;
    this.currentFill = fillColor;
    this.currentStroke = strokeColor;
    this.rotationAngle = 90
  }

  display() {
    push();
    translate(this.x, this.y, this.z);
    if (this.hover) {
      this.currentFill = lerpColor(this.currentFill, color(255, 255, 255), 0.1);
      this.currentStroke = lerpColor(this.currentStroke, color(0, 0, 0), 0.2);
      stroke(this.currentStroke);
      this.rotationAngle += 0.015;
    } else {
      this.currentFill = lerpColor(this.currentFill, this.fillColor, 0.1);
      this.currentStroke = this.strokeColor;
      stroke(this.currentStroke);
    }
    fill(this.currentFill);
    rotateY(this.rotationAngle);

    sphere(this.r, this.segX, this.segY);
    pop();
  }


  checkHover(mx, my) {
    let distance = dist(mx, my, this.x, this.y);
    if (distance < this.r) {
      this.hover = true;
      cursor(ARROW);
    } else {
      this.hover = false;
      cursor(ARROW);
    }
  }

  clicked() {
    if (this.hover) {
      window.location.href = this.url;
    }
  }
}

function mouseReleased() {
  dragging = false;

  for (let buttonSphere of buttonSpheres) {
    buttonSphere.clicked();
  }
}

class Particle {

  constructor() {
    this.x = random(-700, 700);
    this.y = random(-700, 700);
    this.z = random(-700, 700);
    this.r = random(0.1, 3);
    this.xSpeed = random(-0.5, 0.5);
    this.ySpeed = random(-0.5, 0.5);
    this.zSpeed = random(-0.5, 0.5);
  }

  createParticle() {

    push();
    stroke('rgba(255, 255, 255, 0.4)');
    strokeWeight(0.5)
    translate(this.x, this.y, this.z);
    sphere(this.r);
    pop();
  }

  moveParticle() {
    if (this.x < -windowWidth || this.x > windowWidth)
      this.xSpeed *= -1;
    if (this.y < -windowHeight || this.y > windowHeight)
      this.ySpeed *= -1;
    if (this.z < -500 || this.z > 500)
      this.zSpeed *= -1;

    this.x += this.xSpeed;
    this.y += this.ySpeed;
    this.z += this.zSpeed;
  }

  joinParticles(particles) {
    particles.forEach(element => {
      let dis = dist(this.x, this.y, this.z, element.x, element.y, element.z);
      if (dis < 120) {
        stroke('rgba(255, 255, 255, 0.2)');

        line(this.x, this.y, this.z, element.x, element.y, element.z);
      }
    });
  }
}

window.onload = function () {
  const overlay = document.getElementById('overlay');
  overlay.classList.add('hide');

  setTimeout(() => {

  }, 1000);
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




