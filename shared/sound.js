const soundPreferenceKey = 'miniverse-sound-on';

function getSoundPreference() {
  try {
    const v = localStorage.getItem(soundPreferenceKey);
    return v === null ? null : v === 'true';
  } catch (e) {
    return null;
  }
}

function setSoundPreference(isOn) {
  try {
    localStorage.setItem(soundPreferenceKey, isOn);
  } catch (e) {}
}

function toggleSound(song) {
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
  setSoundPreference(song.isPlaying());
}

// Call once in setup(): starts/mutes `song` and syncs the play/pause button
// to whatever the user last chose on any page. `autoplayDefault` is what to
// do the very first time (no preference saved yet) - true keeps a page's
// current default behavior of starting the music on its own.
function applySoundPreference(song, autoplayDefault) {
  const preference = getSoundPreference();
  const shouldPlay = preference === null ? autoplayDefault : preference;
  const playButton = document.getElementById('playButton');

  if (shouldPlay) {
    song.loop();
    if (playButton) {
      playButton.classList.remove('play');
      playButton.classList.add('pause');
    }
  } else {
    if (playButton) {
      playButton.classList.remove('pause');
      playButton.classList.add('play');
    }
  }
}

// Wires the mute button on pages that have one. Safe to call anywhere.
function bindSoundButton(song) {
  const playButton = document.getElementById('playButton');
  if (!playButton) return;
  playButton.addEventListener('click', () => toggleSound(song));
}
