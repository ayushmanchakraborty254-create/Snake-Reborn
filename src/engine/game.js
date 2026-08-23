// Core Game Engine and Loop manager for Snake // Reborn
import storage from '../systems/storage';
import audio from '../systems/audio';
import input from '../systems/input';
import FoodManager from './food';
import { DIFFICULTY_SPEEDS, DIFFICULTY_MULTIPLIERS, CHALLENGES } from './modes';

class GameEngine {
  constructor() {
    this.cols = 35;
    this.rows = 20;

    this.foodManager = new FoodManager(this.cols, this.rows);
    this.resetState();

    this.lastTickTime = 0;
    this.gameLoopId = null;
    
    // Callbacks to communicate with UI
    this.onStateChange = null; // Menu triggers, game over triggers, high scores
    this.onTick = null;         // Triggers canvas render
  }

  resetState() {
    this.snake = [
      { x: 17, y: 10 },
      { x: 16, y: 10 },
      { x: 15, y: 10 }
    ];
    this.direction = { x: 1, y: 0 };
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.comboDuration = 4000; // 4 seconds combo window
    this.stepsTaken = 0;
    this.startTime = 0;
    this.elapsedTime = 0; // seconds
    this.gameTimeAccumulator = 0;
    this.foodsEatenInRun = 0;
    this.powerupsEatenInRun = 0;
    this.wrapCountInRun = 0;
    
    this.isStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    
    this.mode = 'classic';
    this.difficulty = 'normal';
    this.activeChallengeId = null;
    this.challengeFailed = false;
    this.challengeSuccess = false;

    // Powerup Active Timers: { type: expirationTimestamp }
    this.activeEffects = {};
    
    // Survival obstacles
    this.obstacles = [];
    this.foodManager.clear();
  }

  start(mode = 'classic', challengeId = null) {
    this.resetState();
    
    this.mode = mode;
    this.activeChallengeId = challengeId;
    
    // Fetch difficulty and options from storage or challenge config
    if (challengeId) {
      const challenge = CHALLENGES.find(c => c.id === challengeId);
      this.mode = challenge.mode;
      this.difficulty = challenge.difficulty;
      this.wallCollision = challenge.wallCollision;
    } else {
      this.difficulty = storage.getSetting('difficulty');
      this.wallCollision = this.mode === 'classic' ? storage.getSetting('wallCollision') : (this.mode !== 'endless' && this.mode !== 'zen');
    }

    // Set starting input direction
    input.reset();
    input.setDirection(this.direction);
    
    // Generate initial food
    this.foodManager.placeNormalFood(this.snake, this.obstacles);
    
    this.startTime = Date.now();
    this.lastTickTime = Date.now();
    
    // Stats
    storage.updateStat('gamesPlayed', 1);

    this.isStarted = false;
    this.isPaused = false;
    this.isGameOver = false;

    // Call render once to draw the starting state (snake + food) behind the overlay
    if (this.onTick) this.onTick();

    this.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  loop(timestamp) {
    if (this.isPaused || this.isGameOver) return;

    const now = Date.now();
    
    // If not started yet, just render static board and update visual animations (e.g. pulsing food)
    if (!this.isStarted) {
      this.updateRealTimeStatus(now);
      if (this.onTick) this.onTick();
      this.gameLoopId = requestAnimationFrame(this.loop.bind(this));
      return;
    }

    const elapsed = now - this.lastTickTime;
    
    // Calculate current dynamic speed
    const tickInterval = this.calculateTickInterval();

    if (elapsed >= tickInterval) {
      this.tick();
      this.lastTickTime = now - (elapsed % tickInterval);
    }

    // Update real-time animations (e.g. combo countdown and effect countdowns)
    this.updateRealTimeStatus(now);

    // Render callback
    if (this.onTick) this.onTick();

    this.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  calculateTickInterval() {
    let baseSpeed = DIFFICULTY_SPEEDS[this.difficulty] || 120;

    // Survival mode speed-up curve
    if (this.mode === 'survival') {
      const factor = Math.floor(this.foodsEatenInRun / 5);
      const speedMult = Math.pow(0.93, factor);
      baseSpeed = baseSpeed * Math.max(0.45, speedMult); // Cap speed at 45% of original interval
    }

    // Time Core slow-down power-up active (35% slower tick speed)
    if (this.activeEffects['time_core']) {
      baseSpeed = baseSpeed * 1.35;
    }

    return baseSpeed;
  }

  tick() {
    // 1. Determine next grid direction from inputs
    this.direction = input.nextDirection;
    input.currentDirection = this.direction;

    // 2. Core power-up magnet attraction logic
    if (this.activeEffects['magnet']) {
      this.foodManager.applyMagnetEffect(this.snake[0]);
    }

    // 3. Calculate new head position
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // 4. Boundary Wall Collision Check
    const outOfBounds = newHead.x < 1 || newHead.x > this.cols || newHead.y < 1 || newHead.y > this.rows;
    if (outOfBounds) {
      if (this.wallCollision) {
        this.gameOver();
        return;
      } else {
        // Wrap around boundaries
        if (newHead.x < 1) newHead.x = this.cols;
        else if (newHead.x > this.cols) newHead.x = 1;

        if (newHead.y < 1) newHead.y = this.rows;
        else if (newHead.y > this.rows) newHead.y = 1;
        
        this.wrapCountInRun++;
        audio.playSFX('wrap');

        // Unlock achievement for wrap around
        if (this.wrapCountInRun >= 10) {
          this.triggerAchievementUnlock('wormhole');
        }
      }
    }

    // 5. Obstacle Collision Check (Survival Mode)
    const hitObstacle = this.obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y);
    if (hitObstacle) {
      if (this.mode === 'zen') {
        // In Zen, bounce back or ignore rather than dying
        audio.playSFX('wrap');
        return;
      } else {
        this.gameOver();
        return;
      }
    }

    // 6. Snake Self-Collision Check
    const hitSelf = this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y);
    if (hitSelf) {
      // Check if Ghost mode active
      if (this.activeEffects['ghost']) {
        // Pass through safely!
      } else if (this.mode === 'zen') {
        // Zen Tail Cut mechanic
        this.cutSnakeAt(newHead);
      } else {
        this.gameOver();
        return;
      }
    }

    // 7. Update Snake position array
    this.snake.unshift(newHead);
    this.stepsTaken++;
    storage.updateStat('totalDistance', 1);

    // 8. Check Eat Food
    const normalFood = this.foodManager.normalFood;
    const activePowerup = this.foodManager.activePowerup;

    if (newHead.x === normalFood.x && newHead.y === normalFood.y) {
      this.eatNormalFood();
    } else if (activePowerup && newHead.x === activePowerup.x && newHead.y === activePowerup.y) {
      this.eatPowerup();
    } else {
      // Pop tail segment if no food eaten
      this.snake.pop();
    }

    // 9. Update challenge status / timed constraints
    this.checkChallengeTick();
  }

  eatNormalFood() {
    this.foodsEatenInRun++;
    storage.updateStat('totalFoodEaten', 1);
    
    // Combo multiplier logic
    this.comboTimer = Date.now() + this.comboDuration;
    if (this.combo > 1) {
      audio.playSFX('combo', this.combo);
    } else {
      audio.playSFX('eat');
    }

    // Score calculations
    const baseVal = 100;
    const diffMult = DIFFICULTY_MULTIPLIERS[this.difficulty] || 1.0;
    const scoreGain = baseVal * this.combo * diffMult * (this.activeEffects['multiplier'] ? 2 : 1);
    
    this.score += Math.round(scoreGain);

    // Update stats
    storage.updateMaxStat('maxLengthReached', this.snake.length);
    
    // High Score validation
    const isNewHigh = storage.updateBestScore(this.mode, this.score);
    if (isNewHigh && this.onStateChange) {
      this.onStateChange('newHighScore', this.score);
    }

    // Spawning survival mode obstacles
    if (this.mode === 'survival' && this.foodsEatenInRun % 3 === 0) {
      this.spawnSurvivalObstacle();
    }

    // Spawn normal food at new position
    this.foodManager.placeNormalFood(this.snake, this.obstacles);

    // Roll probability for special power-up spawn (15% chance)
    if (Math.random() < 0.15) {
      this.foodManager.spawnPowerup(this.snake, this.obstacles);
    }

    // Increment combo counter
    this.combo++;
    storage.updateMaxStat('maxCombo', this.combo - 1);

    // Check immediate achievements
    if (this.foodsEatenInRun === 1) {
      this.triggerAchievementUnlock('first_bite');
    }
    if (this.snake.length >= 25) {
      this.triggerAchievementUnlock('growth_spurt');
    }
    if (this.score >= 1000) {
      this.triggerAchievementUnlock('century');
    }

    this.checkChallengeGoals();
  }

  eatPowerup() {
    const pw = this.foodManager.activePowerup;
    if (!pw) return;

    this.powerupsEatenInRun++;
    storage.updateStat('totalPowerupsEaten', 1);
    audio.playSFX('powerup');

    // Apply effects
    if (pw.type === 'golden') {
      const diffMult = DIFFICULTY_MULTIPLIERS[this.difficulty] || 1.0;
      const goldVal = 300 * this.combo * diffMult * (this.activeEffects['multiplier'] ? 2 : 1);
      this.score += Math.round(goldVal);
      
      const isNewHigh = storage.updateBestScore(this.mode, this.score);
      if (isNewHigh && this.onStateChange) {
        this.onStateChange('newHighScore', this.score);
      }
    } else {
      // Set duration
      const duration = pw.lifespan || 7000;
      // Get base duration from POWERUPS config
      const effectConfig = pw.type === 'golden' ? null : pw;
      const effectDuration = pw.type === 'time_core' ? 8000 : pw.type === 'ghost' ? 6000 : 10000;
      this.activeEffects[pw.type] = Date.now() + effectDuration;
    }

    // Power-ups also make snake grow
    storage.updateMaxStat('maxLengthReached', this.snake.length);

    // Achievement for powerups eaten
    if (this.powerupsEatenInRun >= 3) {
      this.triggerAchievementUnlock('power_trip');
    }

    // Despawn powerup
    this.foodManager.activePowerup = null;

    this.checkChallengeGoals();
  }

  cutSnakeAt(hitCoordinate) {
    // Find segments matching collision
    let cutIndex = -1;
    for (let i = 1; i < this.snake.length; i++) {
      if (this.snake[i].x === hitCoordinate.x && this.snake[i].y === hitCoordinate.y) {
        cutIndex = i;
        break;
      }
    }

    if (cutIndex !== -1) {
      // Cut segments from cutIndex to end of array
      const lostSegmentsCount = this.snake.length - cutIndex;
      this.snake.splice(cutIndex);

      // Deduct score (100 points per segment, but cap score at 0)
      const penalty = lostSegmentsCount * 100;
      this.score = Math.max(0, this.score - penalty);

      audio.playSFX('wrap'); // Thud sound
    }
  }

  spawnSurvivalObstacle() {
    let newObs;
    let isValid = false;

    while (!isValid) {
      newObs = {
        x: Math.floor(Math.random() * this.cols) + 1,
        y: Math.floor(Math.random() * this.rows) + 1
      };

      // Ensure obstacles don't block immediate movement or spawn on items
      const distToHead = Math.abs(newObs.x - this.snake[0].x) + Math.abs(newObs.y - this.snake[0].y);
      const onSnake = this.snake.some(seg => seg.x === newObs.x && seg.y === newObs.y);
      const onFood = this.foodManager.normalFood.x === newObs.x && this.foodManager.normalFood.y === newObs.y;

      if (distToHead > 4 && !onSnake && !onFood) {
        isValid = true;
      }
    }

    this.obstacles.push(newObs);
  }

  updateRealTimeStatus(now) {
    // 1. Combo Timer decay
    if (this.combo > 1) {
      if (now > this.comboTimer) {
        this.combo = 1;
        this.comboTimer = 0;
      }
    }

    // 2. Active powerups decay
    Object.keys(this.activeEffects).forEach(type => {
      if (now > this.activeEffects[type]) {
        delete this.activeEffects[type];
      }
    });

    // 3. Food Manager powerup spawn decay
    this.foodManager.updatePowerups();

    // 4. Update survival clock
    if (!this.isPaused && !this.isGameOver) {
      const runSeconds = Math.floor((now - this.startTime) / 1000);
      if (runSeconds > this.elapsedTime) {
        const delta = runSeconds - this.elapsedTime;
        this.elapsedTime = runSeconds;
        
        storage.updateStat('totalSurvivalTime', delta);
        
        // Track zen play statistics
        if (this.mode === 'zen') {
          storage.updateStat('zenTimeCumulative', delta); // Custom counter inside storage manager? 
          // Let's use survival clock to unlock Zen Master
          const zenCumulative = storage.getStat('totalSurvivalTime_zen') || 0;
          storage.updateStat('totalSurvivalTime_zen', delta); // Expose sub-state
          if (storage.getStat('totalSurvivalTime_zen') >= 180) {
            this.triggerAchievementUnlock('zen_master');
          }
        }

        if (this.mode === 'survival' && this.elapsedTime >= 120) {
          this.triggerAchievementUnlock('survivalist');
        }
      }
    }
  }

  checkChallengeTick() {
    if (!this.activeChallengeId) return;

    const challenge = CHALLENGES.find(c => c.id === this.activeChallengeId);
    if (!challenge) return;

    // Check time limit
    if (challenge.timeLimit && this.elapsedTime >= challenge.timeLimit) {
      this.challengeFailed = true;
      this.gameOver();
    }
  }

  checkChallengeGoals() {
    if (!this.activeChallengeId || this.challengeFailed) return;

    const challenge = CHALLENGES.find(c => c.id === this.activeChallengeId);
    if (!challenge) return;

    let targetMet = true;

    if (challenge.targetScore && this.score < challenge.targetScore) targetMet = false;
    if (challenge.targetFoodEaten && this.foodsEatenInRun < challenge.targetFoodEaten) targetMet = false;
    if (challenge.targetLength && this.snake.length < challenge.targetLength) targetMet = false;

    if (targetMet) {
      this.challengeSuccess = true;
      storage.completeChallenge(this.activeChallengeId);
      this.gameOver();
    }
  }

  triggerAchievementUnlock(id) {
    const details = storage.unlockAchievement(id);
    if (details && this.onStateChange) {
      this.onStateChange('achievementUnlocked', details);
      audio.playSFX('achievement');
    }
  }

  togglePause() {
    if (!this.isStarted || this.isGameOver) return;
    this.isPaused = !this.isPaused;

    if (!this.isPaused) {
      this.lastTickTime = Date.now();
      this.gameLoopId = requestAnimationFrame(this.loop.bind(this));
      audio.startBGM();
    } else {
      cancelAnimationFrame(this.gameLoopId);
      audio.stopBGM();
    }
  }

  gameOver() {
    this.isGameOver = true;
    cancelAnimationFrame(this.gameLoopId);
    audio.stopBGM();
    audio.playSFX('gameover');

    // Log insane mode challenge requirements
    if (this.difficulty === 'insane') {
      this.triggerAchievementUnlock('speed_demon');
    }

    if (this.activeChallengeId && !this.challengeSuccess) {
      this.challengeFailed = true;
    }

    if (this.onStateChange) {
      this.onStateChange('gameOver', {
        score: this.score,
        length: this.snake.length,
        time: this.elapsedTime,
        foodsEaten: this.foodsEatenInRun,
        maxCombo: storage.getStat('maxCombo'),
        challengeSuccess: this.challengeSuccess,
        challengeFailed: this.challengeFailed
      });
    }
  }

  quit() {
    this.isGameOver = true;
    cancelAnimationFrame(this.gameLoopId);
    audio.stopBGM();
  }
}

export const gameEngine = new GameEngine();
export default gameEngine;
