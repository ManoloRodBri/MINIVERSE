let buttonSpheres = [];
let buttonURLs = ["../ClimbThrough/index.html", "../SpaceJump/index.html", "../GravityShift/index.html"];
let buttonNames = ["CLIMB THROUGH", "SPACE JUMP", "GRAVITY SHIFT"];
let cam;
let particles = [];
let song;

// Camera orbit. The scene sways slowly on its own, leans toward the pointer and
// can be dragged around; once let go it drifts back to its framing.
const lookTarget = { x: -50, y: 80, z: 0 };
const eyeOffset = { x: 50, y: -80, z: 1000 };
const dragThreshold = 6;
const canHover = window.matchMedia('(hover: hover)').matches;
let sway = { yaw: 0, pitch: 0 };
let drag = { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0 };
let press = null;
let pointerSeen = false;

function preload() {
  song = loadSound('../inicio.mp3');
}

function setup() {

  createCanvas(windowWidth, windowHeight, WEBGL);
  frameRate(60);
  song.setVolume(0.5);
  applySoundPreference(song, false);
  const playButton = document.getElementById('playButton');
  playButton.addEventListener('click', () => toggleSound(song));

  cam = createCamera();

  for (let i = 0; i < width / 9; i++) {
    particles.push(new Particle());
  }

  buttonSpheres.push(new SphereButton(-300, 50, 300, 90, 15, 5, color(0), color(255, 255, 255), buttonURLs[0], buttonNames[0]));
  buttonSpheres.push(new SphereButton(0, -100, 50, 100, 15, 3, color(0), color(255), buttonURLs[1], buttonNames[1]));
  buttonSpheres.push(new SphereButton(250, 200, 200, 90, 15, 2, color(0), color(255), buttonURLs[2], buttonNames[2]));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {

  background("black");
  updateOrbit();

  for (let i = 0; i < particles.length; i++) {
    particles[i].createParticle();
    particles[i].moveParticle();
    particles[i].joinParticles(particles.slice(i));
  }
  let dragging = press && press.moved;
  for (let buttonSphere of buttonSpheres) {
    buttonSphere.display();
    buttonSphere.project();
    buttonSphere.hover = !dragging && buttonSphere.contains(mouseX, mouseY);
  }
  if (dragging) cursor('grabbing');
  else cursor(buttonSpheres.some(b => b.hover) ? HAND : 'grab');
  updateHoverLabel();
}

function updateOrbit() {
  let t = millis() / 1000;
  let targetYaw = Math.sin(t * 0.3) * 0.18;
  let targetPitch = Math.sin(t * 0.23) * 0.06;
  if (canHover && pointerSeen) {
    targetYaw -= (mouseX / width - 0.5) * 0.2;
    targetPitch += (mouseY / height - 0.5) * 0.1;
  }
  sway.yaw = lerp(sway.yaw, targetYaw, 0.05);
  sway.pitch = lerp(sway.pitch, targetPitch, 0.05);

  // Dragging turns the scene so the nearest sphere roughly follows the pointer.
  if (press && mouseIsPressed) {
    let dx = mouseX - press.lastX;
    let dy = mouseY - press.lastY;
    press.lastX = mouseX;
    press.lastY = mouseY;
    if (!press.moved && dist(mouseX, mouseY, press.x, press.y) > dragThreshold) press.moved = true;
    if (press.moved) {
      drag.vYaw = -dx * 0.0025;
      drag.vPitch = dy * 0.002;
    }
  } else {
    // Let go: keep a little of the throw, then settle back.
    drag.vYaw *= 0.92;
    drag.vPitch *= 0.92;
    drag.yaw *= 0.96;
    drag.pitch *= 0.96;
  }
  drag.yaw = constrain(drag.yaw + drag.vYaw, -1.2, 1.2);
  drag.pitch = constrain(drag.pitch + drag.vPitch, -0.6, 0.6);

  // p5's perspective doesn't widen with the screen, so on a narrow (portrait)
  // screen the camera backs off until the three spheres fit side by side.
  let fit = Math.max(1, 900 / width);
  let yaw = sway.yaw + drag.yaw;
  let pitch = sway.pitch + drag.pitch;
  let x = (eyeOffset.x * Math.cos(yaw) + eyeOffset.z * Math.sin(yaw)) * fit;
  let z = (-eyeOffset.x * Math.sin(yaw) + eyeOffset.z * Math.cos(yaw)) * fit;
  let y = eyeOffset.y * fit * Math.cos(pitch) - z * Math.sin(pitch);
  z = eyeOffset.y * fit * Math.sin(pitch) + z * Math.cos(pitch);
  cam.camera(lookTarget.x + x, lookTarget.y + y, lookTarget.z + z, lookTarget.x, lookTarget.y, lookTarget.z, 0, 1, 0);
}

// Where a world point lands on screen with the current camera, and how many
// pixels one world unit spans there.
function projectToScreen(px, py, pz) {
  let f = normalized(cam.centerX - cam.eyeX, cam.centerY - cam.eyeY, cam.centerZ - cam.eyeZ);
  let r = normalized(f.y * cam.upZ - f.z * cam.upY, f.z * cam.upX - f.x * cam.upZ, f.x * cam.upY - f.y * cam.upX);
  let u = { x: r.y * f.z - r.z * f.y, y: r.z * f.x - r.x * f.z, z: r.x * f.y - r.y * f.x };
  let dx = px - cam.eyeX, dy = py - cam.eyeY, dz = pz - cam.eyeZ;
  let depth = dx * f.x + dy * f.y + dz * f.z;
  let k = (height / 2) / Math.tan(cam.cameraFOV / 2);
  return {
    x: width / 2 + (dx * r.x + dy * r.y + dz * r.z) / depth * k,
    y: height / 2 + (dx * u.x + dy * u.y + dz * u.z) / depth * k,
    scale: k / depth
  };
}

function normalized(x, y, z) {
  let l = Math.hypot(x, y, z);
  return { x: x / l, y: y / l, z: z / l };
}

// Minimal signpost: the name of whatever you're pointing at, nothing else.
function updateHoverLabel() {
  const label = document.getElementById('hoverLabel');
  if (!label) return;

  const hovered = buttonSpheres.find(b => b.hover);
  if (hovered) {
    if (label.textContent !== hovered.name) label.textContent = hovered.name;
    label.classList.add('visible');
  } else {
    label.classList.remove('visible');
  }
}

class SphereButton {
  constructor(x, y, z, r, segX, segY, fillColor, strokeColor, url, name) {
    this.name = name;
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
    this.rotationAngle = 90;
    this.screenX = 0;
    this.screenY = 0;
    this.screenR = 0;
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
      this.rotationAngle += 0.003;
    }
    fill(this.currentFill);
    rotateY(this.rotationAngle);

    sphere(this.r, this.segX, this.segY);
    pop();
  }

  project() {
    let p = projectToScreen(this.x, this.y, this.z);
    this.screenX = p.x;
    this.screenY = p.y;
    this.screenR = this.r * p.scale;
  }

  contains(mx, my) {
    return dist(mx, my, this.screenX, this.screenY) < this.screenR;
  }
}

function mousePressed() {
  press = { x: mouseX, y: mouseY, lastX: mouseX, lastY: mouseY, moved: false };
}

function mouseMoved() {
  pointerSeen = true;
}

function mouseReleased() {
  // A quick flick can start and end between two frames, before draw() sees it
  // move, so the distance is checked here too.
  let wasDrag = press && (press.moved || dist(mouseX, mouseY, press.x, press.y) > dragThreshold);
  press = null;
  if (wasDrag) return;

  let target = buttonSpheres.find(b => b.contains(mouseX, mouseY));
  if (target) window.location.href = target.url;
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
