// UI State Manager, HUD update coordination, and screen transition handler
import storage from '../systems/storage';
import audio from '../systems/audio';
import input from '../systems/input';
import gameEngine from '../engine/game';
import renderer from './renderer';
import { MODES, CHALLENGES, DIFFICULTY_SPEEDS } from '../engine/modes';
import { POWERUPS } from '../engine/food';

class UIManager {
  constructor() {
    this.activeScreen = 'screen-main-menu';
    this.selectedMode = 'classic';
    this.selectedChallengeId = null;

    // Toast Queue
    this.toastTimeout = null;

    this.portraitDismissed = false;
  }

  setup() {
    // 1. Initial screen transition mapping
    this.bindNavigationButtons();

    // 2. Load and bind settings sliders & checkboxes
    this.bindSettingsControls();

    // 3. Load and bind Customizer controls
    this.bindCustomizerControls();

    // 4. Bind Game controls (Resume, Restart, Quit, etc.)
    this.bindGamePlayControls();

    // 5. Connect game callbacks
    gameEngine.onStateChange = this.handleGameStateChange.bind(this);
    gameEngine.onTick = this.handleGameTick.bind(this);

    // Apply startup accessibility themes on body
    this.syncAccessibilityStyles();

    // Setup Mobile & Orientation
    const isMobile = input.detectMobile();
    if (isMobile) {
      document.body.classList.add('is-mobile');
    }

    // Bind orientation & resize listeners
    window.addEventListener('resize', this.checkOrientation.bind(this));
    window.addEventListener('orientationchange', this.checkOrientation.bind(this));

    // Bind orientation dismiss button
    const dismissBtn = document.getElementById('btn-orientation-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.portraitDismissed = true;
        document.getElementById('orientation-overlay').style.display = 'none';
        audio.playSFX('click');
      });
    }

    // Setup fullscreen change event listeners
    const onFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (!isCurrentlyFullscreen && this.activeScreen === 'screen-game' && gameEngine.isStarted && !gameEngine.isPaused && !gameEngine.isGameOver) {
        this.togglePause();
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);
  }

  showScreen(screenId) {
    // Stop loops if leaving game screen
    if (this.activeScreen === 'screen-game' && screenId !== 'screen-game' && screenId !== 'screen-game-over') {
      gameEngine.quit();
      this.exitFullscreen();
    }

    // Update screen elements
    document.querySelectorAll('.screen').forEach(scr => {
      scr.classList.remove('active');
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.activeScreen = screenId;
      input.setActiveScreen(screenId);
      
      // Update orientation overlay state on screen transition
      this.checkOrientation();
    }
  }

  bindNavigationButtons() {
    // Main Menu navigation
    document.getElementById('btn-play-quick').addEventListener('click', () => {
      audio.resume();
      this.requestFullscreen();
      this.selectedMode = 'classic';
      this.selectedChallengeId = null;
      this.showScreen('screen-game');
      this.startGame();
    });

    document.getElementById('btn-select-modes').addEventListener('click', () => {
      audio.playSFX('click');
      this.renderModesMenu();
      this.showScreen('screen-modes');
    });

    document.getElementById('btn-customizer').addEventListener('click', () => {
      audio.playSFX('click');
      this.renderCustomizer();
      this.showScreen('screen-customizer');
    });

    document.getElementById('btn-stats').addEventListener('click', () => {
      audio.playSFX('click');
      this.renderStats();
      this.showScreen('screen-stats');
    });

    document.getElementById('btn-achievements').addEventListener('click', () => {
      audio.playSFX('click');
      this.renderAchievements();
      this.showScreen('screen-achievements');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      audio.playSFX('click');
      this.showScreen('screen-settings');
    });

    // Back Buttons
    document.getElementById('btn-modes-back').addEventListener('click', () => {
      audio.playSFX('click');
      this.showScreen('screen-main-menu');
    });
    
    document.getElementById('btn-customizer-back').addEventListener('click', () => {
      audio.playSFX('click');
      this.showScreen('screen-main-menu');
    });
    
    document.getElementById('btn-stats-back').addEventListener('click', () => {
      audio.playSFX('click');
      this.showScreen('screen-main-menu');
    });
    
    document.getElementById('btn-achievements-back').addEventListener('click', () => {
      audio.playSFX('click');
      this.showScreen('screen-main-menu');
    });
    
    document.getElementById('btn-settings-back').addEventListener('click', () => {
      audio.playSFX('click');
      this.showScreen('screen-main-menu');
    });

    // Reset statistics data
    document.getElementById('btn-reset-stats').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all game data, achievements, and configurations?')) {
        storage.resetAll();
        audio.playSFX('gameover');
        this.renderStats();
        this.syncAccessibilityStyles();
        // Sync setting form controls
        this.bindSettingsControls();
      }
    });

    // Hover sound effects for menus
    document.querySelectorAll('.menu-btn, .mode-card, select, input[type="checkbox"]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        audio.playSFX('hover');
      });
    });
  }

  bindSettingsControls() {
    const diffSelect = document.getElementById('select-difficulty');
    const wallCheck = document.getElementById('chk-wall-collision');
    const sfxSlider = document.getElementById('range-sfx-volume');
    const bgmSlider = document.getElementById('range-bgm-volume');
    const muteCheck = document.getElementById('chk-audio-mute');
    const motionCheck = document.getElementById('chk-reduced-motion');
    const contrastCheck = document.getElementById('chk-high-contrast');

    // Load current storage settings
    diffSelect.value = storage.getSetting('difficulty');
    wallCheck.checked = storage.getSetting('wallCollision');
    sfxSlider.value = storage.getSetting('sfxVolume');
    bgmSlider.value = storage.getSetting('bgmVolume');
    muteCheck.checked = storage.getSetting('isMuted');
    motionCheck.checked = storage.getSetting('reducedMotion');
    contrastCheck.checked = storage.getSetting('highContrast');

    document.getElementById('val-sfx-volume').innerText = `${Math.round(sfxSlider.value * 100)}%`;
    document.getElementById('val-bgm-volume').innerText = `${Math.round(bgmSlider.value * 100)}%`;

    // Listeners
    diffSelect.addEventListener('change', (e) => {
      storage.setSetting('difficulty', e.target.value);
    });

    wallCheck.addEventListener('change', (e) => {
      storage.setSetting('wallCollision', e.target.checked);
    });

    sfxSlider.addEventListener('input', (e) => {
      storage.setSetting('sfxVolume', parseFloat(e.target.value));
      document.getElementById('val-sfx-volume').innerText = `${Math.round(e.target.value * 100)}%`;
      audio.updateSettings();
    });

    bgmSlider.addEventListener('input', (e) => {
      storage.setSetting('bgmVolume', parseFloat(e.target.value));
      document.getElementById('val-bgm-volume').innerText = `${Math.round(e.target.value * 100)}%`;
      audio.updateSettings();
    });

    muteCheck.addEventListener('change', (e) => {
      storage.setSetting('isMuted', e.target.checked);
      audio.updateSettings();
    });

    motionCheck.addEventListener('change', (e) => {
      storage.setSetting('reducedMotion', e.target.checked);
      this.syncAccessibilityStyles();
    });

    contrastCheck.addEventListener('change', (e) => {
      storage.setSetting('highContrast', e.target.checked);
      this.syncAccessibilityStyles();
    });
  }

  syncAccessibilityStyles() {
    const isReduced = storage.getSetting('reducedMotion');
    const isContrast = storage.getSetting('highContrast');

    document.body.classList.toggle('reduced-motion', isReduced);
    document.body.classList.toggle('high-contrast', isContrast);
  }

  bindCustomizerControls() {
    const snakeColorInput = document.getElementById('input-snake-color');
    const foodColorInput = document.getElementById('input-food-color');
    const snakeColorLbl = document.getElementById('lbl-snake-color');
    const foodColorLbl = document.getElementById('lbl-food-color');

    // Load configurations
    snakeColorInput.value = storage.getSetting('snakeColor');
    foodColorInput.value = storage.getSetting('foodColor');
    snakeColorLbl.innerText = snakeColorInput.value.toUpperCase();
    foodColorLbl.innerText = foodColorInput.value.toUpperCase();

    // Dynamic color picker events
    snakeColorInput.addEventListener('input', (e) => {
      storage.setSetting('snakeColor', e.target.value);
      snakeColorLbl.innerText = e.target.value.toUpperCase();
      renderer.renderPreview(e.target.value, foodColorInput.value);
    });

    foodColorInput.addEventListener('input', (e) => {
      storage.setSetting('foodColor', e.target.value);
      foodColorLbl.innerText = e.target.value.toUpperCase();
      renderer.renderPreview(snakeColorInput.value, e.target.value);
    });

    // Theme presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sColor = e.target.getAttribute('data-snake');
        const fColor = e.target.getAttribute('data-food');

        storage.setSetting('snakeColor', sColor);
        storage.setSetting('foodColor', fColor);

        snakeColorInput.value = sColor;
        foodColorInput.value = fColor;
        snakeColorLbl.innerText = sColor.toUpperCase();
        foodColorLbl.innerText = fColor.toUpperCase();

        audio.playSFX('click');
        renderer.renderPreview(sColor, fColor);
      });
    });
  }

  renderCustomizer() {
    setTimeout(() => {
      renderer.renderPreview(
        storage.getSetting('snakeColor'),
        storage.getSetting('foodColor')
      );
    }, 50);
  }

  renderModesMenu() {
    const modeCards = document.querySelectorAll('.mode-card');
    const challengeList = document.getElementById('challenges-list-container');
    const challengesGrid = document.getElementById('challenges-grid');

    // Setup active state on mode cards
    modeCards.forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-mode') === this.selectedMode);

      card.onclick = () => {
        audio.playSFX('click');
        this.selectedMode = card.getAttribute('data-mode');
        
        modeCards.forEach(c => c.classList.toggle('active', c.getAttribute('data-mode') === this.selectedMode));
        
        if (this.selectedMode === 'challenge') {
          challengeList.style.display = 'block';
          this.renderChallengesList(challengesGrid);
        } else {
          challengeList.style.display = 'none';
          this.selectedChallengeId = null;
        }
      };
    });

    // Setup Start Game button
    document.getElementById('btn-start-mode').onclick = () => {
      audio.resume();
      this.requestFullscreen();
      if (this.selectedMode === 'challenge' && !this.selectedChallengeId) {
        alert('Please select a specific Challenge to run.');
        return;
      }
      this.showScreen('screen-game');
      this.startGame();
    };
  }

  renderChallengesList(container) {
    container.innerHTML = '';
    
    CHALLENGES.forEach((ch, idx) => {
      const isCompleted = storage.isChallengeCompleted(ch.id);
      const node = document.createElement('div');
      
      node.classList.add('challenge-node');
      node.classList.add('unlocked');
      if (isCompleted) node.classList.add('completed');
      if (this.selectedChallengeId === ch.id) node.classList.add('active');

      node.innerHTML = `
        <div class="chal-num">#0${idx + 1}</div>
        <div class="chal-name" style="font-weight:bold; margin-top:2px;">${ch.name}</div>
        <div class="chal-badge">${isCompleted ? '✓ DONE' : 'READY'}</div>
      `;

      node.title = ch.desc;

      node.addEventListener('click', () => {
        audio.playSFX('click');
        this.selectedChallengeId = ch.id;
        
        // Remove active state from other nodes
        document.querySelectorAll('.challenge-node').forEach(n => n.classList.remove('active'));
        node.classList.add('active');
      });

      container.appendChild(node);
    });
  }

  startGame() {
    // Bind HUD items
    document.getElementById('hud-score').innerText = '00000';
    document.getElementById('hud-best-score').innerText = this.padZero(storage.getBestScore(this.selectedMode), 5);
    document.getElementById('hud-combo').innerText = 'x1';
    document.getElementById('hud-combo-bar').style.width = '0%';
    document.getElementById('hud-speed').innerText = `${DIFFICULTY_SPEEDS[storage.getSetting('difficulty') || 'normal']}ms`;
    document.getElementById('hud-length').innerText = '3';
    document.getElementById('start-overlay').style.display = 'flex';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('highscore-celebration').style.display = 'none';
    document.getElementById('powerup-status-container').innerHTML = '';

    // Run Engine
    gameEngine.start(this.selectedMode, this.selectedChallengeId);
  }

  bindGamePlayControls() {
    // Click-to-start game overlay binding
    const startOverlay = document.getElementById('start-overlay');
    const handleGameStart = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!gameEngine.isStarted && !gameEngine.isPaused && !gameEngine.isGameOver) {
        this.requestFullscreen();
        gameEngine.isStarted = true;
        startOverlay.style.display = 'none';
        audio.resume(); // Unlocks AudioContext and plays BGM
        audio.playSFX('start');
        gameEngine.lastTickTime = Date.now();
      }
    };
    startOverlay.addEventListener('click', handleGameStart);
    startOverlay.addEventListener('touchstart', handleGameStart);

    // HUD Pause Button
    document.getElementById('btn-hud-pause').addEventListener('click', () => {
      audio.playSFX('click');
      this.togglePause();
    });

    // Pause Overlays Buttons
    document.getElementById('btn-pause-resume').addEventListener('click', () => {
      audio.playSFX('click');
      this.requestFullscreen();
      this.togglePause();
    });

    document.getElementById('btn-pause-quit').addEventListener('click', () => {
      audio.playSFX('click');
      gameEngine.quit();
      this.exitFullscreen();
      this.showScreen('screen-main-menu');
    });

    // Game Over Buttons
    document.getElementById('btn-game-over-replay').addEventListener('click', () => {
      audio.playSFX('click');
      this.requestFullscreen();
      this.showScreen('screen-game');
      this.startGame();
    });

    document.getElementById('btn-game-over-menu').addEventListener('click', () => {
      audio.playSFX('click');
      this.showScreen('screen-main-menu');
    });
  }

  togglePause() {
    if (!gameEngine.isStarted || gameEngine.isGameOver) return;
    gameEngine.togglePause();
    const isPaused = gameEngine.isPaused;
    document.getElementById('pause-overlay').style.display = isPaused ? 'flex' : 'none';

    if (isPaused) {
      this.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
  }

  handleGameTick() {
    // Render game board coordinates onto canvas
    renderer.draw(gameEngine);

    // Update Scores
    document.getElementById('hud-score').innerText = this.padZero(gameEngine.score, 5);
    document.getElementById('hud-length').innerText = gameEngine.snake.length;
    
    // Speed formatting
    const currentSpeed = Math.round(gameEngine.calculateTickInterval());
    document.getElementById('hud-speed').innerText = `${currentSpeed}ms`;

    // Combo indicator mapping
    if (gameEngine.combo > 1) {
      document.getElementById('hud-combo').innerText = `x${gameEngine.combo - 1}`;
      
      const now = Date.now();
      const remainingTime = Math.max(0, gameEngine.comboTimer - now);
      const ratio = remainingTime / gameEngine.comboDuration;
      document.getElementById('hud-combo-bar').style.width = `${ratio * 100}%`;
    } else {
      document.getElementById('hud-combo').innerText = 'x1';
      document.getElementById('hud-combo-bar').style.width = '0%';
    }

    // Active Power-up Progress Timer Cards
    this.renderActivePowerupsHUD();
  }

  renderActivePowerupsHUD() {
    const container = document.getElementById('powerup-status-container');
    container.innerHTML = '';

    const now = Date.now();

    Object.keys(gameEngine.activeEffects).forEach(type => {
      const expiration = gameEngine.activeEffects[type];
      const remaining = expiration - now;

      if (remaining <= 0) return;

      const totalDuration = type === 'time_core' ? 8000 : type === 'ghost' ? 6000 : 10000;
      const ratio = Math.max(0, remaining / totalDuration);

      const color = type === 'time_core' ? '#00c3ff' : type === 'ghost' ? '#af40ff' : type === 'magnet' ? '#39ff14' : '#ff9500';
      const icon = type === 'time_core' ? '🌀' : type === 'ghost' ? '👻' : type === 'magnet' ? '🧲' : '✖️';
      const name = type === 'time_core' ? 'SLOW' : type === 'ghost' ? 'GHOST' : type === 'magnet' ? 'MAGNET' : '2x PNT';

      const bar = document.createElement('div');
      bar.classList.add('active-powerup-bar');
      bar.style.color = color;
      bar.style.borderColor = `rgba(${renderer.hexToRgb(color).r}, ${renderer.hexToRgb(color).g}, ${renderer.hexToRgb(color).b}, 0.3)`;

      bar.innerHTML = `
        <span>${icon} ${name}</span>
        <div class="pw-bar-track">
          <div class="pw-bar-fill" style="width: ${ratio * 100}%"></div>
        </div>
      `;

      container.appendChild(bar);
    });
  }

  handleGameStateChange(state, data) {
    switch (state) {
      case 'newHighScore':
        this.triggerHighScoreCelebration();
        break;

      case 'achievementUnlocked':
        this.showAchievementToast(data);
        break;

      case 'gameOver':
        this.triggerGameOverScreen(data);
        break;
    }
  }

  triggerHighScoreCelebration() {
    // Update best score inside HUD live
    document.getElementById('hud-best-score').innerText = this.padZero(gameEngine.score, 5);

    const banner = document.getElementById('highscore-celebration');
    banner.style.display = 'block';
    
    // Clear display after sliding is done
    setTimeout(() => {
      banner.style.display = 'none';
    }, 2500);
  }

  showAchievementToast(ach) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    const toast = document.getElementById('achievement-toast');
    document.getElementById('toast-achievement-name').innerText = ach.name;
    toast.classList.add('show');

    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  triggerGameOverScreen(results) {
    this.exitFullscreen();

    // Generate explosive debris from segments
    renderer.spawnSnakeDeath(gameEngine.snake, storage.getSetting('snakeColor'));

    // Wait a brief moment for the explosion to play out before showing overlay
    setTimeout(() => {
      this.showScreen('screen-game-over');

      // Populate results
      document.getElementById('go-score').innerText = results.score;
      document.getElementById('go-combo').innerText = `x${results.maxCombo}`;
      document.getElementById('go-length').innerText = results.length;
      document.getElementById('go-time').innerText = this.formatTime(results.time);

      // High Score splash
      const best = storage.getBestScore(this.selectedMode);
      document.getElementById('game-over-new-high').style.display = (results.score >= best && results.score > 0) ? 'block' : 'none';

      // Challenges results
      const challengeRow = document.getElementById('go-challenge-result-row');
      const challengeStatus = document.getElementById('go-challenge-status');

      if (this.selectedChallengeId) {
        challengeRow.style.display = 'flex';
        if (results.challengeSuccess) {
          challengeStatus.innerText = 'SUCCESSFUL!';
          challengeStatus.style.color = '#39ff14';
        } else {
          challengeStatus.innerText = 'FAILED';
          challengeStatus.style.color = '#ff3b30';
        }
      } else {
        challengeRow.style.display = 'none';
      }
    }, 600);
  }

  renderStats() {
    const container = document.getElementById('stats-container');
    container.innerHTML = '';

    const stats = [
      { key: 'gamesPlayed', label: 'Games Played', unit: '' },
      { key: 'totalFoodEaten', label: 'Food Eaten', unit: ' apples' },
      { key: 'totalPowerupsEaten', label: 'Powerups Collected', unit: '' },
      { key: 'maxLengthReached', label: 'Max Length', unit: ' segments' },
      { key: 'maxCombo', label: 'Max Combo Level', unit: 'x' },
      { key: 'totalSurvivalTime', label: 'Total Game Time', unit: 'time' },
      { key: 'totalDistance', label: 'Total Distance', unit: ' steps' }
    ];

    stats.forEach(stat => {
      const card = document.createElement('div');
      card.classList.add('stat-card');

      let displayVal = storage.getStat(stat.key) || 0;
      if (stat.unit === 'time') {
        displayVal = this.formatTime(displayVal);
      } else if (stat.unit === 'x') {
        displayVal = `x${displayVal}`;
      } else {
        displayVal = displayVal.toLocaleString() + stat.unit;
      }

      card.innerHTML = `
        <div class="stat-val">${displayVal}</div>
        <div class="stat-lbl">${stat.label}</div>
      `;

      container.appendChild(card);
    });
  }

  renderAchievements() {
    const container = document.getElementById('achievements-container');
    container.innerHTML = '';

    const list = storage.getAchievementsList();

    Object.values(list).forEach(ach => {
      const unlocked = storage.getAchievementStatus(ach.id);
      const card = document.createElement('div');
      
      card.classList.add('achievement-card');
      card.classList.add(unlocked ? 'unlocked' : 'locked');

      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <div class="ach-title">${ach.name}</div>
          <div class="ach-description">${ach.desc}</div>
        </div>
        <div class="ach-status">${unlocked ? 'UNLOCKED' : 'LOCKED'}</div>
      `;

      container.appendChild(card);
    });
  }

  // Formatting helpers
  padZero(num, size) {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const pad = (n) => this.padZero(n, 2);

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  }

  checkOrientation() {
    const overlay = document.getElementById('orientation-overlay');
    if (!overlay) return;

    const isMobile = input.detectMobile();
    if (!isMobile) {
      overlay.style.display = 'none';
      return;
    }

    if (this.activeScreen === 'screen-game') {
      const isPortrait = window.innerHeight > window.innerWidth;
      if (isPortrait && !this.portraitDismissed) {
        overlay.style.display = 'flex';
      } else {
        overlay.style.display = 'none';
      }
    } else {
      overlay.style.display = 'none';
    }
  }

  requestFullscreen() {
    const isMobile = input.detectMobile();
    if (!isMobile) return;

    const app = document.getElementById('app');
    if (app) {
      const req = app.requestFullscreen || app.webkitRequestFullscreen || app.mozRequestFullScreen || app.msRequestFullscreen;
      if (req) {
        req.call(app).catch(err => {
          console.warn('Fullscreen request denied:', err);
        });
      }
    }
  }

  exitFullscreen() {
    const isMobile = input.detectMobile();
    if (!isMobile) return;

    const isCurrentlyFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (isCurrentlyFullscreen) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exit) {
        exit.call(document).catch(err => {
          console.warn('Fullscreen exit failed:', err);
        });
      }
    }
  }
}

export const uiManager = new UIManager();
export default uiManager;
