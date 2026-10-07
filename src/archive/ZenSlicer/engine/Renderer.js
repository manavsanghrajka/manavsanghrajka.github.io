// Renderer — custom Canvas 2D drawing for all game entities
// Uses flat-color minimalistic icon style per design doc

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.sliceHalves = []; // animated fruit halves
    this.comboTexts = []; // floating combo text popups
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  clear() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    // Deep charcoal background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);

    // Subtle radial gradient for depth
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(30, 30, 30, 0.5)');
    gradient.addColorStop(1, 'rgba(18, 18, 18, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // --- FRUIT DRAWING ---
  drawFruit(body) {
    if (body.gameData.sliced) return;
    const { ctx } = this;
    const { x, y } = body.position;
    const { radius, color, innerColor, leafColor, fruitKind } = body.gameData;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);

    switch (fruitKind) {
      case 'watermelon':
        this._drawWatermelon(radius, color, innerColor);
        break;
      case 'apple':
        this._drawApple(radius, color, leafColor);
        break;
      case 'pineapple':
        this._drawPineapple(radius, color, innerColor, leafColor);
        break;
      case 'orange':
        this._drawOrange(radius, color, innerColor);
        break;
      case 'grape':
        this._drawGrape(radius, color, innerColor);
        break;
      case 'kiwi':
        this._drawKiwi(radius, color, innerColor);
        break;
      default:
        // Fallback circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
  }

  _drawWatermelon(r, green, pink) {
    const { ctx } = this;
    // Outer green semicircle (full circle for game)
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Dark green rind stripes
    ctx.strokeStyle = '#388E3C';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, angle, angle + 0.3);
      ctx.stroke();
    }

    // Inner pink circle
    ctx.fillStyle = pink;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Seeds
    ctx.fillStyle = '#1B5E20';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const sx = Math.cos(angle) * r * 0.4;
      const sy = Math.sin(angle) * r * 0.4;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 2, 3.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawApple(r, red, leafGreen) {
    const { ctx } = this;
    // Apple body
    ctx.fillStyle = red;
    ctx.beginPath();
    ctx.arc(0, r * 0.05, r, 0, Math.PI * 2);
    ctx.fill();

    // Subtle highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(r * 0.05, -r * 1.1);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = leafGreen;
    ctx.beginPath();
    ctx.ellipse(r * 0.2, -r * 1.0, r * 0.25, r * 0.12, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawPineapple(r, yellow, innerYellow, leafGreen) {
    const { ctx } = this;
    // Pineapple body (oval)
    ctx.fillStyle = yellow;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.8, r, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    // Clip to body shape
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.8, r, 0, 0, Math.PI * 2);
    ctx.clip();

    // Cross-hatch pattern
    ctx.strokeStyle = '#F57F17';
    ctx.lineWidth = 1.5;
    const lines = 6;
    for (let i = -lines; i <= lines; i++) {
      const offset = i * (r * 0.3);
      ctx.beginPath();
      ctx.moveTo(offset - r, -r * 1.5);
      ctx.lineTo(offset + r, r * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-offset - r, -r * 1.5);
      ctx.lineTo(-offset + r, r * 1.5);
      ctx.stroke();
    }
    
    ctx.restore();

    // Leaves on top
    ctx.fillStyle = leafGreen;
    for (let i = -2; i <= 2; i++) {
      const angle = i * 0.3;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -r * 1.15, r * 0.12, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawOrange(r, orange, innerOrange) {
    const { ctx } = this;
    ctx.fillStyle = orange;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Navel
    ctx.fillStyle = innerOrange;
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.2, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Tiny stem
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(0, -r * 0.9, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawGrape(r, purple, lightPurple) {
    const { ctx } = this;
    // Cluster of small circles
    const offsets = [
      [0, -r * 0.4], [-r * 0.4, 0], [r * 0.4, 0],
      [-r * 0.2, r * 0.4], [r * 0.2, r * 0.4], [0, 0],
    ];

    for (const [ox, oy] of offsets) {
      ctx.fillStyle = purple;
      ctx.beginPath();
      ctx.arc(ox, oy, r * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(ox - r * 0.08, oy - r * 0.08, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stem
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(0, -r * 1.1);
    ctx.stroke();
  }

  _drawKiwi(r, brown, green) {
    const { ctx } = this;
    // Brown fuzzy exterior
    ctx.fillStyle = brown;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Green interior peek
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // White center
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Seed lines radiating out
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.15, Math.sin(angle) * r * 0.15);
      ctx.lineTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5);
      ctx.stroke();
    }
  }

  // --- BOMB DRAWING ---
  drawBomb(body) {
    if (body.gameData.sliced) return;
    const { ctx } = this;
    const { x, y } = body.position;
    const { radius, color, fuseColor } = body.gameData;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);

    // Bomb body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Darker bottom half for depth
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 0.25, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Fuse base
    ctx.fillStyle = '#616161';
    ctx.fillRect(-3, -radius - 2, 6, 8);

    // Fuse wick
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -radius - 2);
    ctx.quadraticCurveTo(8, -radius - 12, 3, -radius - 18);
    ctx.stroke();

    // Blinking spark at fuse tip
    const blink = Math.sin(performance.now() * 0.01) > 0;
    if (blink) {
      ctx.fillStyle = fuseColor;
      ctx.beginPath();
      ctx.arc(3, -radius - 18, 4, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      ctx.fillStyle = 'rgba(255,23,68,0.3)';
      ctx.beginPath();
      ctx.arc(3, -radius - 18, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- BLADE TRAIL ---
  drawBlade(trail) {
    if (trail.length < 2) return;
    const { ctx } = this;
    const now = performance.now();

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw the trail with tapering width and fading opacity
    for (let i = 1; i < trail.length; i++) {
      const p0 = trail[i - 1];
      const p1 = trail[i];
      const age = now - p1.time;
      const alpha = Math.max(0, 1 - age / 150);
      const progress = i / trail.length;
      const width = 2 + progress * 6;

      // Glow layer
      ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.3})`;
      ctx.lineWidth = width + 8;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      // Core blade
      ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.9})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      // Bright center
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.lineWidth = Math.max(1, width * 0.3);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- SLICE HALVES ---
  addSliceHalves(body) {
    const { x, y } = body.position;
    const { radius, color, innerColor, fruitKind } = body.gameData;
    const angle = body.angle;

    // Two halves that split apart
    const splitSpeed = 2 + Math.random() * 2;
    this.sliceHalves.push(
      {
        x, y,
        vx: -splitSpeed,
        vy: -2 + Math.random() * -2,
        angle,
        angularVel: -0.05 - Math.random() * 0.05,
        radius,
        color,
        innerColor: innerColor || color,
        half: 'left',
        life: 1.0,
      },
      {
        x, y,
        vx: splitSpeed,
        vy: -2 + Math.random() * -2,
        angle,
        angularVel: 0.05 + Math.random() * 0.05,
        radius,
        color,
        innerColor: innerColor || color,
        half: 'right',
        life: 1.0,
      }
    );
  }

  updateSliceHalves() {
    for (let i = this.sliceHalves.length - 1; i >= 0; i--) {
      const h = this.sliceHalves[i];
      h.x += h.vx;
      h.y += h.vy;
      h.vy += 0.25; // gravity
      h.angle += h.angularVel;
      h.life -= 0.015;

      if (h.life <= 0) {
        this.sliceHalves.splice(i, 1);
      }
    }
  }

  drawSliceHalves() {
    const { ctx } = this;
    for (const h of this.sliceHalves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, h.life);
      ctx.translate(h.x, h.y);
      ctx.rotate(h.angle);

      // Clip to half circle
      ctx.beginPath();
      if (h.half === 'left') {
        ctx.arc(0, 0, h.radius, Math.PI * 0.5, Math.PI * 1.5);
      } else {
        ctx.arc(0, 0, h.radius, -Math.PI * 0.5, Math.PI * 0.5);
      }
      ctx.closePath();
      ctx.clip();

      // Outer color
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner color (the exposed "flesh")
      ctx.fillStyle = h.innerColor;
      const innerR = h.radius * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- COMBO TEXT ---
  addComboText(x, y, count) {
    this.comboTexts.push({
      x,
      y,
      text: `+${count} COMBO!`,
      life: 1.0,
      scale: 1.2,
    });
  }

  addScorePopup(x, y, points) {
    this.comboTexts.push({
      x,
      y: y - 10,
      text: `+${points}`,
      life: 0.8,
      scale: 1.0,
    });
  }

  updateComboTexts() {
    for (let i = this.comboTexts.length - 1; i >= 0; i--) {
      const t = this.comboTexts[i];
      t.y -= 1.5;
      t.life -= 0.018;
      t.scale *= 0.995;

      if (t.life <= 0) {
        this.comboTexts.splice(i, 1);
      }
    }
  }

  drawComboTexts() {
    const { ctx } = this;
    for (const t of this.comboTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Glow
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00E5FF';
      ctx.fillText(t.text, 0, 0);
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  }



  // Red overlay for bomb hit
  drawBombOverlay(alpha) {
    const { ctx, width, height } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FF1744';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  clearEffects() {
    this.sliceHalves = [];
    this.comboTexts = [];
  }
}
