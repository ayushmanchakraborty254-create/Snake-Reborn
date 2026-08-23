// LocalStorage management layer for Snake // Reborn

const DEFAULT_SETTINGS = {
  difficulty: 'normal',
  wallCollision: true,
  sfxVolume: 0.7,
  bgmVolume: 0.3,
  isMuted: false,
  reducedMotion: false,
  highContrast: false,
  snakeColor: '#00ffcc',
  foodColor: '#ff3b30'
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  totalFoodEaten: 0,
  totalPowerupsEaten: 0,
  maxLengthReached: 3,
  totalSurvivalTime: 0, // in seconds
  maxCombo: 1,
  totalDistance: 0, // steps taken
  bestScore_classic: 0,
  bestScore_endless: 0,
  bestScore_survival: 0,
  bestScore_zen: 0
};

const ACHIEVEMENTS_LIST = {
  first_bite: { id: 'first_bite', name: 'First Bite', desc: 'Eat your first food.', icon: '🍎' },
  wormhole: { id: 'wormhole', name: 'Wormhole', desc: 'Pass through the wrap-around boundary 10 times.', icon: '🌀' },
  growth_spurt: { id: 'growth_spurt', name: 'Growth Spurt', desc: 'Reach a snake length of 25.', icon: '📏' },
  speed_demon: { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete a game on Insane difficulty.', icon: '🔥' },
  survivalist: { id: 'survivalist', name: 'Survivalist', desc: 'Survive for 2 minutes in Survival Mode.', icon: '⏱️' },
  century: { id: 'century', name: 'Century Club', desc: 'Reach a score of 1,000 points in a single game.', icon: '💯' },
  power_trip: { id: 'power_trip', name: 'Power Trip', desc: 'Consume 3 special power-ups in a single run.', icon: '⚡' },
  zen_master: { id: 'zen_master', name: 'Zen Master', desc: 'Play Zen mode for a total of 3 minutes.', icon: '🌸' }
};

const DEFAULT_CHALLENGES = {
  challenge_1: false, // "Century Challenge" (Get 1000 pts in Survival under 60 seconds)
  challenge_2: false, // "Gluttony" (Eat 15 foods on Insane difficulty)
  challenge_3: false, // "Coil Master" (Reach length 20 without walls on Classic)
  challenge_4: false, // "Pacifist Zen" (Survive for 2 minutes in Zen mode)
  challenge_5: false  // "Speed Run" (Get 500 pts in classic in under 30 seconds)
};

class StorageManager {
  constructor() {
    this.settings = this.load('snake_reborn_settings', DEFAULT_SETTINGS);
    this.stats = this.load('snake_reborn_stats', DEFAULT_STATS);
    this.achievements = this.load('snake_reborn_achievements', {});
    this.challenges = this.load('snake_reborn_challenges', DEFAULT_CHALLENGES);
  }

  load(key, defaults) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      console.warn(`Could not load local storage for key ${key}, using defaults.`);
    }
    return { ...defaults };
  }

  save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Could not save local storage for key ${key}.`);
    }
  }

  // Settings
  getSetting(key) {
    return this.settings[key] !== undefined ? this.settings[key] : DEFAULT_SETTINGS[key];
  }

  setSetting(key, val) {
    this.settings[key] = val;
    this.save('snake_reborn_settings', this.settings);
  }

  // Stats
  getStat(key) {
    return this.stats[key] !== undefined ? this.stats[key] : DEFAULT_STATS[key];
  }

  updateStat(key, delta) {
    if (typeof delta === 'number') {
      this.stats[key] = (this.stats[key] || 0) + delta;
    } else {
      this.stats[key] = delta;
    }
    this.save('snake_reborn_stats', this.stats);
  }

  updateMaxStat(key, val) {
    if (val > (this.stats[key] || 0)) {
      this.stats[key] = val;
      this.save('snake_reborn_stats', this.stats);
    }
  }

  // High Scores
  getBestScore(mode) {
    const key = `bestScore_${mode}`;
    return this.stats[key] !== undefined ? this.stats[key] : 0;
  }

  updateBestScore(mode, score) {
    const key = `bestScore_${mode}`;
    if (score > (this.stats[key] || 0)) {
      this.stats[key] = score;
      this.save('snake_reborn_stats', this.stats);
      return true; // New high score
    }
    return false;
  }

  // Achievements
  getAchievementsList() {
    return ACHIEVEMENTS_LIST;
  }

  getAchievementStatus(id) {
    return !!this.achievements[id];
  }

  unlockAchievement(id) {
    if (ACHIEVEMENTS_LIST[id] && !this.achievements[id]) {
      this.achievements[id] = new Date().toISOString();
      this.save('snake_reborn_achievements', this.achievements);
      return ACHIEVEMENTS_LIST[id]; // Return details of newly unlocked achievement
    }
    return null;
  }

  // Challenges
  isChallengeCompleted(id) {
    return !!this.challenges[id];
  }

  completeChallenge(id) {
    if (this.challenges[id] !== undefined && !this.challenges[id]) {
      this.challenges[id] = true;
      this.save('snake_reborn_challenges', this.challenges);
      return true;
    }
    return false;
  }

  // Reset Everything
  resetAll() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.stats = { ...DEFAULT_STATS };
    this.achievements = {};
    this.challenges = { ...DEFAULT_CHALLENGES };
    
    this.save('snake_reborn_settings', this.settings);
    this.save('snake_reborn_stats', this.stats);
    this.save('snake_reborn_achievements', this.achievements);
    this.save('snake_reborn_challenges', this.challenges);
  }
}

export const storage = new StorageManager();
export default storage;
