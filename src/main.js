// Bootloader and module coordinator for Snake // Reborn
import './style.css';
import uiManager from './ui/manager';
import renderer from './ui/renderer';
import input from './systems/input';
import gameEngine from './engine/game';
import audio from './systems/audio';

// Debug helper to print uncaught errors directly on the screen
window.addEventListener('error', (event) => {
  const errDiv = document.getElementById('debug-error-overlay') || document.createElement('div');
  errDiv.id = 'debug-error-overlay';
  errDiv.style.position = 'absolute';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.width = '100%';
  errDiv.style.background = 'rgba(200, 0, 0, 0.95)';
  errDiv.style.color = 'white';
  errDiv.style.padding = '20px';
  errDiv.style.zIndex = '999999';
  errDiv.style.fontFamily = 'monospace';
  errDiv.style.fontSize = '14px';
  errDiv.style.whiteSpace = 'pre-wrap';
  errDiv.innerText = `UNCAUGHT ERROR:\n${event.message}\nSource: ${event.filename}:${event.lineno}\nStack: ${event.error ? event.error.stack : 'N/A'}`;
  document.body.appendChild(errDiv);
});

document.addEventListener('DOMContentLoaded', () => {
  // 1. Setup UI System
  uiManager.setup();

  // 2. Setup Canvas Renderer
  renderer.setup('game-canvas');

  // 3. Bind Input handlers to Game Engine actions
  input.setup(
    // On Direction Change
    (nextDir) => {
      gameEngine.direction = nextDir;
    },
    // On Pause key
    () => {
      uiManager.togglePause();
    },
    // Check if gameplay is active (not paused, started, and not game over)
    () => {
      return gameEngine.isStarted && !gameEngine.isPaused && !gameEngine.isGameOver;
    }
  );

  // 4. Register gesture listeners to unlock Web Audio context safely
  const unlockAudioContext = async () => {
    try {
      await audio.resume();
      
      // Remove listeners once unlocked successfully
      window.removeEventListener('click', unlockAudioContext);
      window.removeEventListener('keydown', unlockAudioContext);
      window.removeEventListener('touchstart', unlockAudioContext);
    } catch (err) {
      console.warn('Audio synthesis unlock deferred:', err);
    }
  };

  window.addEventListener('click', unlockAudioContext);
  window.addEventListener('keydown', unlockAudioContext);
  window.addEventListener('touchstart', unlockAudioContext);
});
