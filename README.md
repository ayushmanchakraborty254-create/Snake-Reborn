# Snake // Reborn 🐍

> **Classic instinct. Re-engineered.**

A completely evolved, modern, and atmospheric reimagining of the classic arcade game. Developed with high-performance HTML5 Canvas, modern glassmorphic CSS, responsive touch layouts, and pure web audio synthesizer systems, **Snake // Reborn** is built to feel like a premium indie arcade game.

---

## Key Features ⚙️

### 1. Game Modes
*   **Classic Mode**: Traditional grid-based play. Hitting boundaries causes game over.
*   **Endless Mode**: Boundaries wrap around. Rested speed increments—ideal for relaxing and growth.
*   **Survival Mode**: Speed increases by 5% for every 5 foods consumed. Hazard blocks dynamically spawn on the board to block paths.
*   **Zen Mode**: Stress-free play. Hitting walls wraps around. Hitting your own tail slices it off (reducing score and length) instead of ending the game.
*   **Challenges**: 5 preset stages with objectives (e.g., scoring 1,000 pts under 60 seconds on Survival, or eating 15 foods on Insane speed).

### 2. Audio Synthesis Engine (Web Audio API)
*   No bulky external MP3 or WAV files. All sound effects and melodies are synthesized **dynamically in the browser** using oscillators and envelopes.
*   Pleasant chimes for food, pitch-bending sweeps for power-ups, menu button ticks, thuds for wrap-arounds, and a sad descending ramp for game overs.
*   Features an optional, spacey, low-pass filtered **rhythmic background beat loop** that scales with your mute preferences.

### 3. Power-Ups & Combo System
*   **Golden Core**: Spawns briefly and provides high bonus points.
*   **Time Core**: Slows down the game loop tick rate by 35% for 8 seconds.
*   **Ghost Shift**: Turns the snake semi-translucent, allowing you to pass through your own tail segments.
*   **Core Magnet**: Attracts food and power-up nodes from a 4-cell distance.
*   **Double Gain**: Multiplies all scored points by 2x.
*   **Combo Meter**: Consuming food quickly increments a score multiplier (up to 5x+). Resets after a 4-second decay window.

### 4. Progression & Statistics
*   Tracks games played, total food eaten, power-ups eaten, maximum length, maximum combo, total steps, and time survived.
*   **Achievements Panel**: 8 distinct trophies (e.g., *Wormhole*, *Speed Demon*, *Century Club*) with persistence.
*   All data is stored locally in the browser using `localStorage`.

---

## Technical Specifications 🛠️

*   **Stack**: Vanilla HTML5, Vanilla JavaScript (ES6 Modules), Vanilla CSS.
*   **Build Tool**: [Vite](https://vite.dev/) (provides blazing fast hot module reloading and minified builds).
*   **Graphics**: 2D HTML5 Canvas API with glowing shadow blurs, fading segment rendering, directional pupil coordinates, and particle physics debris.
*   **Audio**: Web Audio API (Synthesizers, Gain Nodes, Low-pass filters).
*   **Mobile Controls**: Media-queries-optimized virtual D-Pad overlays and touch swiping.
*   **Accessibility**: Respects `prefers-reduced-motion` settings and supports high-contrast styling mode.

---

## Controls 🎮

### Desktop
*   **Move**: `Arrow Keys` or `W`, `A`, `S`, `D`
*   **Pause / Resume**: `Spacebar`

### Mobile & Tablet
*   **Move**: Swipe gestures (Up/Down/Left/Right) or click on the on-screen responsive Virtual D-Pad.
*   **Pause / Resume**: Tap the HUD Pause `⏸` button.

---

## Project Structure 📁

```text
├── public/                 # Static assets (Favicons, images)
├── src/
│   ├── engine/
│   │   ├── food.js         # Spawns foods and power-up configurations
│   │   ├── game.js         # Core loop runner and collision detection
│   │   └── modes.js        # Mode and Challenge definitions
│   ├── systems/
│   │   ├── audio.js        # Web Audio synthesizer and ambient sequencer
│   │   ├── input.js        # Keyboard, D-pad, and swipe listener
│   │   └── storage.js      # LocalStorage wrapper (scores, settings, stats)
│   ├── ui/
│   │   ├── manager.js      # DOM elements toggle, settings bindings, HUD sync
│   │   └── renderer.js     # Canvas drawers and particle explosion physics
│   ├── main.js             # Application bootloader
│   └── style.css           # Neon glassmorphism, responsive styles
├── index.html              # Landing UI page templates
├── package.json            # Node project configuration
├── vite.config.js          # Vite server and build config
└── README.md               # Repository documentation
```

---

## Local Setup & Development 🚀

Ensure you have [Node.js](https://nodejs.org/) installed.

1.  **Clone or navigate to the workspace directory**:
    ```bash
    cd c:\Users\ayush\Desktop\Snake
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start development server**:
    ```bash
    npm run dev
    ```
    This launches the local server at `http://localhost:3000` (or another port outputted in the console) and opens it in your browser.

4.  **Create production build**:
    ```bash
    npm run build
    ```
    This compiles assets and scripts into a highly optimized, minified bundle in the `dist` folder.

5.  **Preview production build**:
    ```bash
    npm run preview
    ```

---

## Deployment ☁️

This project is fully Vercel-ready:
*   Import this repository in Vercel.
*   Vercel will auto-detect Vite as the framework.
*   The build command is `npm run build` and output directory is `dist`. No custom configuration needed!
