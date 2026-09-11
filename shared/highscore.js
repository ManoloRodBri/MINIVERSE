function loadBestScore(key) {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch (e) {
    return 0;
  }
}

// Call every frame (or whenever the score changes) with the current score;
// returns the best score to keep using, persisting it if it just improved.
function updateBestScore(key, currentScore, bestScore) {
  if (currentScore > bestScore) {
    try {
      localStorage.setItem(key, currentScore);
    } catch (e) {}
    return currentScore;
  }
  return bestScore;
}
