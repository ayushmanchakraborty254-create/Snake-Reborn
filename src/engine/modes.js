// Game modes configuration and rule variations for Snake // Reborn

export const MODES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    desc: 'The traditional grid-based experience. Hitting boundaries causes game over.'
  },
  endless: {
    id: 'endless',
    name: 'Endless',
    desc: 'Borders are wrapped around. Relaxed speed increments.'
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    desc: 'Speed increases by 5% every 5 foods. Hazard blocks spawn on the grid as you eat.'
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    desc: 'Immortal mode. Hitting boundaries wraps; hitting your own tail shrinks you.'
  },
  challenge: {
    id: 'challenge',
    name: 'Challenges',
    desc: 'Complete specific objectives under strict constraints.'
  }
};

export const CHALLENGES = [
  {
    id: 'challenge_1',
    name: 'Century Dash',
    desc: 'Score 1,000 points in Survival Mode under 60 seconds.',
    mode: 'survival',
    difficulty: 'normal',
    targetScore: 1000,
    timeLimit: 60, // in seconds
    wallCollision: true
  },
  {
    id: 'challenge_2',
    name: 'Gluttony',
    desc: 'Consume 15 food items on Insane difficulty without crashing.',
    mode: 'classic',
    difficulty: 'insane',
    targetFoodEaten: 15,
    wallCollision: true
  },
  {
    id: 'challenge_3',
    name: 'Coil Master',
    desc: 'Reach a snake length of 20 in Endless mode on Hard speed.',
    mode: 'endless',
    difficulty: 'hard',
    targetLength: 20,
    wallCollision: false
  },
  {
    id: 'challenge_4',
    name: 'Pacifist Zen',
    desc: 'Accumulate 500 points and survive 90 seconds in Zen mode.',
    mode: 'zen',
    difficulty: 'hard',
    targetScore: 500,
    timeLimit: 90,
    wallCollision: false
  },
  {
    id: 'challenge_5',
    name: 'Speed Run',
    desc: 'Reach 800 points in Classic mode in under 45 seconds on Hard difficulty.',
    mode: 'classic',
    difficulty: 'hard',
    targetScore: 800,
    timeLimit: 45,
    wallCollision: true
  }
];

export const DIFFICULTY_SPEEDS = {
  easy: 160,    // tick interval in ms
  normal: 120,
  hard: 85,
  insane: 55
};

export const DIFFICULTY_MULTIPLIERS = {
  easy: 0.5,
  normal: 1.0,
  hard: 1.5,
  insane: 2.0
};
