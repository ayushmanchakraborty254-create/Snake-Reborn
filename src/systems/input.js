// Inputs manager for desktop and mobile play
import audio from './audio';

class InputHandler {
  constructor() {
    this.currentDirection = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    
    // Callbacks
    this.onDirectionChange = null;
    this.onPauseToggle = null;

    // Swipe tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeThreshold = 35; // px

    this.isListening = false;
    this.activeScreen = '';
  }

  setup(onDirectionChange, onPauseToggle) {
    this.onDirectionChange = onDirectionChange;
    this.onPauseToggle = onPauseToggle;
    
    if (this.isListening) return;
    
    // Keyboard Event Listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Swipe Listeners (Bound to the app wrapper to avoid breaking whole page scroll when not in game)
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      appEl.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      appEl.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    // D-Pad Click Listeners
    this.bindDPad();
    
    this.isListening = true;
  }

  setActiveScreen(screenName) {
    this.activeScreen = screenName;
  }

  reset() {
    this.currentDirection = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
  }

  setDirection(dir) {
    this.currentDirection = dir;
    this.nextDirection = dir;
  }

  handleKeyDown(e) {
    // Prevent default scrolling for game controls
    const blockedKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
    if (this.activeScreen === 'screen-game' && (blockedKeys.includes(e.key) || blockedKeys.includes(e.code))) {
      e.preventDefault();
    }

    if (this.activeScreen !== 'screen-game') return;

    let dir = null;
    const key = e.key.toLowerCase();

    switch (key) {
      case 'arrowup':
      case 'w':
        dir = { x: 0, y: -1 };
        break;
      case 'arrowdown':
      case 's':
        dir = { x: 0, y: 1 };
        break;
      case 'arrowleft':
      case 'a':
        dir = { x: -1, y: 0 };
        break;
      case 'arrowright':
      case 'd':
        dir = { x: 1, y: 0 };
        break;
      case ' ':
      case 'spacebar':
        if (this.onPauseToggle) {
          this.onPauseToggle();
          audio.playSFX('click');
        }
        break;
    }

    if (dir) {
      this.requestDirectionChange(dir);
    }
  }

  requestDirectionChange(newDir) {
    // Prevent 180-degree immediate turns into oneself
    if (newDir.x === -this.currentDirection.x && newDir.x !== 0) return;
    if (newDir.y === -this.currentDirection.y && newDir.y !== 0) return;

    this.nextDirection = newDir;
    if (this.onDirectionChange) {
      this.onDirectionChange(this.nextDirection);
    }
  }

  // Swipe Gestures
  handleTouchStart(e) {
    if (this.activeScreen !== 'screen-game') return;
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  handleTouchMove(e) {
    // Block pinch-to-zoom and default elastic scroll inside game
    if (this.activeScreen === 'screen-game') {
      if (e.cancelable) e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    if (this.activeScreen !== 'screen-game') return;
    if (e.changedTouches.length === 0) return;

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - this.touchStartX;
    const diffY = touch.clientY - this.touchStartY;

    if (Math.abs(diffX) < this.swipeThreshold && Math.abs(diffY) < this.swipeThreshold) {
      return; // Too short to register
    }

    let dir = null;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      dir = diffX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      // Vertical swipe
      dir = diffY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }

    if (dir) {
      this.requestDirectionChange(dir);
    }
  }

  // Mobile D-Pad binding
  bindDPad() {
    const directions = {
      'ctrl-up': { x: 0, y: -1 },
      'ctrl-down': { x: 0, y: 1 },
      'ctrl-left': { x: -1, y: 0 },
      'ctrl-right': { x: 1, y: 0 }
    };

    Object.entries(directions).forEach(([id, dir]) => {
      const btn = document.getElementById(id);
      if (btn) {
        // Use mousedown/touchstart for faster response than click
        const handler = (e) => {
          e.preventDefault();
          this.requestDirectionChange(dir);
          audio.playSFX('click');
        };
        btn.addEventListener('mousedown', handler);
        btn.addEventListener('touchstart', handler);
      }
    });
  }
}

export const input = new InputHandler();
export default input;
