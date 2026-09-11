let juegoPausado = false;

function abrirModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
  juegoPausado = true;
  noLoop();
  document.getElementById('mainContent').classList.add('blurred');
}

function cerrarModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  juegoPausado = false;
  loop();
  document.getElementById('mainContent').classList.remove('blurred');
}
