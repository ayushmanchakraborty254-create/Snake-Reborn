// Canvas Graphics Renderer and Particle effects system for Snake // Reborn
import storage from '../systems/storage';
import { POWERUPS } from '../engine/food';

class GameRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.cols = 35;
    this.rows = 20;
    this.cellW = 20;
    this.cellH = 20;

    // Particle System
    this.particles = [];
  }

  setup(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.cellW = this.canvas.width / this.cols;
      this.cellH = this.canvas.height / this.rows;
    }
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#060609';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw(game) {
    if (!this.ctx) return;

    this.clear();

    const isHighContrast = storage.getSetting('highContrast');
    const isReducedMotion = storage.getSetting('reducedMotion');

    // 1. Draw grid
    this.drawGrid(isHighContrast);

    // 2. Draw obstacles
    this.drawObstacles(game.obstacles, isHighContrast);

    // 3. Draw powerup if available
    const pw = game.foodManager.activePowerup;
    if (pw) {
      this.drawPowerup(pw, isReducedMotion);
    }

    // 4. Draw food
    const food = game.foodManager.normalFood;
    const foodColor = storage.getSetting('foodColor');
    this.drawFood(food, foodColor, isReducedMotion, isHighContrast);

    // 5. Draw snake
    const snakeColor = storage.getSetting('snakeColor');
    const ghostActive = !!game.activeEffects['ghost'];
    this.drawSnake(game.snake, game.direction, snakeColor, ghostActive, isReducedMotion, isHighContrast);

    // 6. Draw and update particles
    this.drawAndUpdateParticles(isReducedMotion);
  }

  drawGrid(isHighContrast) {
    const gridColor = isHighContrast ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let c = 1; c < this.cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.cellW, 0);
      this.ctx.lineTo(c * this.cellW, this.canvas.height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let r = 1; r < this.rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.cellH);
      this.ctx.lineTo(this.canvas.width, r * this.cellH);
      this.ctx.stroke();
    }
  }

  drawObstacles(obstacles, isHighContrast) {
    this.ctx.save();
    obstacles.forEach(obs => {
      const x = (obs.x - 1) * this.cellW;
      const y = (obs.y - 1) * this.cellH;

      // Glow style
      if (!isHighContrast) {
        this.ctx.shadowColor = '#ff3b30';
        this.ctx.shadowBlur = 10;
      }
      
      this.ctx.fillStyle = '#ff3b30';
      this.ctx.strokeStyle = '#99110a';
      this.ctx.lineWidth = 2;

      // Draw obstacle box with warning cross
      this.ctx.fillRect(x + 2, y + 2, this.cellW - 4, this.cellH - 4);
      this.ctx.strokeRect(x + 2, y + 2, this.cellW - 4, this.cellH - 4);
      
      // Outer border warnings
      this.ctx.shadowBlur = 0;
      this.ctx.beginPath();
      this.ctx.moveTo(x + 4, y + 4);
      this.ctx.lineTo(x + this.cellW - 4, y + this.cellH - 4);
      this.ctx.moveTo(x + this.cellW - 4, y + 4);
      this.ctx.lineTo(x + 4, y + this.cellH - 4);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    });
    this.ctx.restore();
  }

  drawFood(food, color, isReducedMotion, isHighContrast) {
    this.ctx.save();

    const x = (food.x - 1) * this.cellW + this.cellW / 2;
    const y = (food.y - 1) * this.cellH + this.cellH / 2;
    
    // Pulse animation based on time
    let scale = 1.0;
    if (!isReducedMotion) {
      scale = 1.0 + Math.sin(Date.now() / 150) * 0.08;
    }
    const radius = (this.cellW / 2 - 2) * scale;

    // Glowing shadow
    if (!isHighContrast) {
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 15;
    }

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Food inner reflection highlight
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(x - radius/3, y - radius/3, radius * 0.25, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawPowerup(pw, isReducedMotion) {
    this.ctx.save();
    
    const x = (pw.x - 1) * this.cellW + this.cellW / 2;
    const y = (pw.y - 1) * this.cellH + this.cellH / 2;

    let scale = 1.0;
    if (!isReducedMotion) {
      scale = 1.0 + Math.sin(Date.now() / 120) * 0.12;
    }
    const radius = (this.cellW / 2 - 1) * scale;

    // Draw glowing shadow
    this.ctx.shadowColor = pw.color;
    this.ctx.shadowBlur = 18;
    
    // Draw inner circle
    this.ctx.fillStyle = pw.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Remove shadow for timer overlay
    this.ctx.shadowBlur = 0;

    // Draw active despawn timer ring
    const elapsed = Date.now() - pw.spawnTime;
    const remainingRatio = Math.max(0, 1 - elapsed / pw.lifespan);

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remainingRatio);
    this.ctx.stroke();

    // Draw icon inside powerup
    this.ctx.fillStyle = '#060609';
    this.ctx.font = 'bold 11px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(pw.icon || '⭐', x, y);

    this.ctx.restore();
  }

  drawSnake(snake, direction, color, ghostActive, isReducedMotion, isHighContrast) {
    this.ctx.save();

    const rgb = this.hexToRgb(color);

    snake.forEach((seg, i) => {
      const x = (seg.x - 1) * this.cellW;
      const y = (seg.y - 1) * this.cellH;

      // Fading tail effect
      let opacity = 1.0;
      if (i > 0) {
        opacity = Math.max(0.2, 1.0 - i * (0.8 / snake.length));
      }
      
      // Shrinking segments toward tail
      let sizeFactor = 1.0;
      if (i > 0) {
        sizeFactor = Math.max(0.55, 1.0 - i * (0.45 / snake.length));
      }
      
      const width = this.cellW * sizeFactor;
      const height = this.cellH * sizeFactor;
      const xOffset = (this.cellW - width) / 2;
      const yOffset = (this.cellH - height) / 2;

      // Draw segment glow
      if (!isHighContrast) {
        this.ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        this.ctx.shadowBlur = i === 0 ? 16 : 8;
      }

      // Convert segment fill to ghost translucency if active
      let alpha = opacity;
      if (ghostActive) {
        alpha = opacity * 0.35; // Faint visual shift
      }

      this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

      // Draw rounded rectangle for segment
      const rad = i === 0 ? 6 : 4;
      this.drawRoundedRect(x + xOffset + 1, y + yOffset + 1, width - 2, height - 2, rad);
      this.ctx.fill();

      // Head Eye details to show direction
      if (i === 0) {
        this.drawHeadEyes(seg, direction, width, height, xOffset, yOffset);
      }
    });

    this.ctx.restore();
  }

  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  drawHeadEyes(seg, direction, width, height, xOffset, yOffset) {
    this.ctx.save();
    this.ctx.shadowBlur = 0; // No shadow for eyes
    this.ctx.fillStyle = '#ffffff';

    const cx = (seg.x - 1) * this.cellW + this.cellW / 2;
    const cy = (seg.y - 1) * this.cellH + this.cellH / 2;
    const eyeRadius = 2.5;
    const eyeOffset = 4.5;

    let eye1 = { x: 0, y: 0 };
    let eye2 = { x: 0, y: 0 };

    if (direction.x !== 0) {
      // Horizontal movement: eyes are vertical
      eye1 = { x: cx + direction.x * eyeOffset, y: cy - eyeOffset };
      eye2 = { x: cx + direction.x * eyeOffset, y: cy + eyeOffset };
    } else {
      // Vertical movement: eyes are horizontal
      eye1 = { x: cx - eyeOffset, y: cy + direction.y * eyeOffset };
      eye2 = { x: cx + eyeOffset, y: cy + direction.y * eyeOffset };
    }

    // Draw eyes
    this.ctx.beginPath();
    this.ctx.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2);
    this.ctx.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw black pupils
    this.ctx.fillStyle = '#060609';
    this.ctx.beginPath();
    this.ctx.arc(eye1.x + direction.x * 0.5, eye1.y + direction.y * 0.5, 1, 0, Math.PI * 2);
    this.ctx.arc(eye2.x + direction.x * 0.5, eye2.y + direction.y * 0.5, 1, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  // Particle burst generation
  spawnExplosion(gridX, gridY, color, count = 15) {
    const isReducedMotion = storage.getSetting('reducedMotion');
    if (isReducedMotion) return; // Skip if disabled

    const px = (gridX - 1) * this.cellW + this.cellW / 2;
    const py = (gridY - 1) * this.cellH + this.cellH / 2;

    const rgb = this.hexToRgb(color);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.5;
      
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        size: 1.5 + Math.random() * 3.0,
        opacity: 1.0,
        lifespan: 400 + Math.random() * 400, // duration in ms
        age: 0,
        spawnTime: Date.now()
      });
    }
  }

  spawnSnakeDeath(snake, color) {
    // Generate an explosion from every third segment of the dying snake for visual impact
    snake.forEach((seg, i) => {
      if (i % 2 === 0) {
        this.spawnExplosion(seg.x, seg.y, color, 8);
      }
    });
  }

  drawAndUpdateParticles(isReducedMotion) {
    if (isReducedMotion) {
      this.particles = [];
      return;
    }

    const now = Date.now();
    this.ctx.save();
    
    // Draw all active particles
    this.particles.forEach((p, idx) => {
      p.age = now - p.spawnTime;
      if (p.age >= p.lifespan) {
        p.opacity = 0;
        return;
      }

      // Linear fade out
      p.opacity = 1.0 - p.age / p.lifespan;

      // Update positions
      p.x += p.vx;
      p.y += p.vy;
      
      // Decelerate slightly due to friction
      p.vx *= 0.96;
      p.vy *= 0.96;

      this.ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity})`;
      this.ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity * 0.5})`;
      this.ctx.shadowBlur = p.size * 2;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Filter out expired particles
    this.particles = this.particles.filter(p => p.opacity > 0);

    this.ctx.restore();
  }

  // Preview renderer inside color customization panel
  renderPreview(snakeColor, foodColor) {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0f0f15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = canvas.width / 15;
    const cellH = canvas.height / 7;

    // Draw preview food
    ctx.save();
    const fx = 3 * cellW + cellW / 2;
    const fy = 3 * cellH + cellH / 2;
    ctx.shadowColor = foodColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = foodColor;
    ctx.beginPath();
    ctx.arc(fx, fy, cellW / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw preview snake (4 segments moving right)
    const prevSnake = [
      { x: 10, y: 3 },
      { x: 9, y: 3 },
      { x: 8, y: 3 },
      { x: 7, y: 3 }
    ];

    ctx.save();
    const rgb = this.hexToRgb(snakeColor);
    prevSnake.forEach((seg, i) => {
      const sx = seg.x * cellW;
      const sy = seg.y * cellH;

      let opacity = 1.0 - i * 0.2;
      let sizeFactor = 1.0 - i * 0.1;
      
      const w = cellW * sizeFactor;
      const h = cellH * sizeFactor;
      const xo = (cellW - w) / 2;
      const yo = (cellH - h) / 2;

      ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      ctx.shadowBlur = i === 0 ? 12 : 6;
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;

      const rad = i === 0 ? 4 : 2;
      ctx.beginPath();
      this.drawRoundedRect(sx + xo + 1, sy + yo + 1, w - 2, h - 2, rad);
      ctx.fill();

      // Eye details for preview
      if (i === 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        const ecx = sx + cellW / 2;
        const ecy = sy + cellH / 2;
        ctx.beginPath();
        ctx.arc(ecx + 2, ecy - 3, 1.5, 0, Math.PI * 2);
        ctx.arc(ecx + 2, ecy + 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  // Helpers
  hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return { r: 0, g: 255, b: 204 }; // Safe neon teal fallback
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 255, b: 204 };
  }
}

export const renderer = new GameRenderer();
export default renderer;
