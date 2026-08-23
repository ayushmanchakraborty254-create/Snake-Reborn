// Food and special power-up manager for Snake // Reborn

export const POWERUPS = {
  golden: {
    type: 'golden',
    color: '#ffd700',
    name: 'Golden Core',
    icon: '⭐',
    duration: 0, // Instant score bonus
    scoreBonus: 300,
    desc: 'Provides +300 points multiplied by combo and difficulty'
  },
  time_core: {
    type: 'time_core',
    color: '#00c3ff',
    name: 'Time Core',
    icon: '🌀',
    duration: 8000, // 8 seconds duration
    desc: 'Temporarily slows game movement speed by 35%'
  },
  ghost: {
    type: 'ghost',
    color: '#af40ff',
    name: 'Ghost Shift',
    icon: '👻',
    duration: 6000, // 6 seconds duration
    desc: 'Allows the snake to pass through its own tail segments'
  },
  magnet: {
    type: 'magnet',
    color: '#39ff14',
    name: 'Core Magnet',
    icon: '🧲',
    duration: 10000, // 10 seconds duration
    desc: 'Attracts food items within a 4-cell range'
  },
  multiplier: {
    type: 'multiplier',
    color: '#ff9500',
    name: 'Double Gain',
    icon: '✖️',
    duration: 10000, // 10 seconds duration
    desc: 'Doubles all score gains for 10 seconds'
  }
};

class FoodManager {
  constructor(cols = 35, rows = 20) {
    this.cols = cols;
    this.rows = rows;
    this.normalFood = { x: 5, y: 5 };
    this.activePowerup = null; // { x, y, type, spawnTime, lifespan }
    this.powerupLifetime = 7000; // Power-ups despawn after 7 seconds if not eaten
  }

  placeNormalFood(snake, obstacles = []) {
    let newFood;
    let isValid = false;

    while (!isValid) {
      newFood = {
        x: Math.floor(Math.random() * this.cols) + 1,
        y: Math.floor(Math.random() * this.rows) + 1
      };

      // Check collision with snake
      const onSnake = snake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      // Check collision with obstacles
      const onObstacle = obstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y);
      // Check collision with active powerup
      const onPowerup = this.activePowerup && this.activePowerup.x === newFood.x && this.activePowerup.y === newFood.y;

      if (!onSnake && !onObstacle && !onPowerup) {
        isValid = true;
      }
    }

    this.normalFood = newFood;
  }

  spawnPowerup(snake, obstacles = []) {
    // Only spawn if there is no active powerup on board
    if (this.activePowerup) return;

    // Pick random powerup type
    const types = Object.keys(POWERUPS);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const powerupConfig = POWERUPS[randomType];

    let newPowerup;
    let isValid = false;

    while (!isValid) {
      newPowerup = {
        x: Math.floor(Math.random() * this.cols) + 1,
        y: Math.floor(Math.random() * this.rows) + 1
      };

      // Validate coordinates
      const onSnake = snake.some(seg => seg.x === newPowerup.x && seg.y === newPowerup.y);
      const onObstacle = obstacles.some(obs => obs.x === newPowerup.x && obs.y === newPowerup.y);
      const onFood = this.normalFood.x === newPowerup.x && this.normalFood.y === newPowerup.y;

      if (!onSnake && !onObstacle && !onFood) {
        isValid = true;
      }
    }

    this.activePowerup = {
      x: newPowerup.x,
      y: newPowerup.y,
      type: randomType,
      color: powerupConfig.color,
      name: powerupConfig.name,
      icon: powerupConfig.icon,
      spawnTime: Date.now(),
      lifespan: this.powerupLifetime
    };
  }

  updatePowerups() {
    if (!this.activePowerup) return;

    // Check if expired
    const age = Date.now() - this.activePowerup.spawnTime;
    if (age >= this.activePowerup.lifespan) {
      this.activePowerup = null; // Despawn
    }
  }

  applyMagnetEffect(snakeHead) {
    if (!snakeHead) return;

    // Apply magnet pull to normal food
    let distNormal = Math.abs(this.normalFood.x - snakeHead.x) + Math.abs(this.normalFood.y - snakeHead.y);
    if (distNormal <= 4) {
      // Pull 1 step closer
      if (this.normalFood.x < snakeHead.x) this.normalFood.x++;
      else if (this.normalFood.x > snakeHead.x) this.normalFood.x--;

      if (this.normalFood.y < snakeHead.y) this.normalFood.y++;
      else if (this.normalFood.y > snakeHead.y) this.normalFood.y--;
    }

    // Apply magnet pull to active power-up
    if (this.activePowerup) {
      let distPowerup = Math.abs(this.activePowerup.x - snakeHead.x) + Math.abs(this.activePowerup.y - snakeHead.y);
      if (distPowerup <= 4) {
        if (this.activePowerup.x < snakeHead.x) this.activePowerup.x++;
        else if (this.activePowerup.x > snakeHead.x) this.activePowerup.x--;

        if (this.activePowerup.y < snakeHead.y) this.activePowerup.y++;
        else if (this.activePowerup.y > snakeHead.y) this.activePowerup.y--;
      }
    }
  }

  clear() {
    this.activePowerup = null;
  }
}

export default FoodManager;
