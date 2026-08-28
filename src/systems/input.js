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

  detectMobile() {
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return hasTouch && (isCoarse || isMobileUA);
  }

  setup(onDirectionChange, onPauseToggle) {
    this.onDirectionChange = onDirectionChange;
    this.onPauseToggle = onPauseToggle;
    
    if (this.isListening) return;
    
    // Keyboard Event Listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Swipe Listeners (Bound to the board container specifically so swipes outside the board are ignored)
    const boardEl = document.getElementById('board-container');
    if (boardEl) {
      boardEl.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      boardEl.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      boardEl.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }
    
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
    if (newDir.x === -this.currentDirection.x && newDir.x !== 0) return false;
    if (newDir.y === -this.currentDirection.y && newDir.y !== 0) return false;

    // Check if the requested direction is actually different from current nextDirection
    if (newDir.x === this.nextDirection.x && newDir.y === this.nextDirection.y) return false;

    this.nextDirection = newDir;
    if (this.onDirectionChange) {
      this.onDirectionChange(this.nextDirection);
    }
    return true;
  }

  // Swipe Gestures
  handleTouchStart(e) {
    if (this.activeScreen !== 'screen-game') return;
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    
    // Prevent scrolling and zooming while playing
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  handleTouchMove(e) {
    // Block gestures & pull-to-refresh
    if (this.activeScreen === 'screen-game') {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }

  handleTouchEnd(e) {
    if (this.activeScreen !== 'screen-game') return;
    if (e.changedTouches.length === 0) return;

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - this.touchStartX;
    const diffY = touch.clientY - this.touchStartY;

    const maxDiff = Math.max(Math.abs(diffX), Math.abs(diffY));
    if (maxDiff < this.swipeThreshold) {
      return; // Too short to register (ignore tap/tiny movement)
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
      const changed = this.requestDirectionChange(dir);
      if (changed) {
        // Trigger subtle visual feedback on the board
        const boardEl = document.getElementById('board-container');
        if (boardEl) {
          boardEl.classList.remove('swipe-feedback');
          void boardEl.offsetWidth; // trigger reflow
          boardEl.classList.add('swipe-feedback');
        }
      }
    }
  }
}

export const input = new InputHandler();
export default input;
