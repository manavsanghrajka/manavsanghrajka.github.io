// Slicer — handles touch/mouse input, blade trail, and collision detection
import Matter from 'matter-js';

const MAX_TRAIL_LENGTH = 20;
const BLADE_DETECTION_DISTANCE = 30; // max distance between swipe points to detect

export class Slicer {
  constructor(canvas, onSliceFruit, onSliceBomb) {
    this.canvas = canvas;
    this.onSliceFruit = onSliceFruit;
    this.onSliceBomb = onSliceBomb;

    this.isActive = false;
    this.trail = []; // Array of {x, y, time}
    this.currentSwipeSliced = new Set(); // body IDs sliced in current swipe
    this.enabled = true;

    // Bind handlers
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    this._attachListeners();
  }

  _attachListeners() {
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerUp);
    
    // Prevent default browser drag and context menus
    this.canvas.addEventListener('dragstart', e => e.preventDefault());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  _getXY(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  _onPointerDown(e) {
    if (!this.enabled) return;
    
    // Attempt to capture the pointer so events keep firing even if cursor leaves canvas bounds
    if (e.pointerId !== undefined) {
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) {}
    }

    const pt = this._getXY(e);
    this.isActive = true;
    this.trail = [{ ...pt, time: performance.now() }];
    this.currentSwipeSliced.clear();
  }

  _onPointerMove(e) {
    if (!this.enabled || !this.isActive) return;
    e.preventDefault();
    const pt = this._getXY(e);
    this.trail.push({ ...pt, time: performance.now() });

    // Keep trail length bounded
    if (this.trail.length > MAX_TRAIL_LENGTH) {
      this.trail.shift();
    }
  }

  _onPointerUp(e) {
    if (!this.enabled) return;
    
    if (e.pointerId !== undefined) {
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }

    // Check if combo threshold met (3+ fruits in one swipe)
    const comboCount = this.currentSwipeSliced.size;
    if (comboCount >= 3 && this.onCombo) {
      this.onCombo(comboCount);
    }

    this.isActive = false;
    this.currentSwipeSliced.clear();
    // Don't clear trail immediately — let it fade in the renderer
  }

  // Check blade against all active bodies
  checkCollisions(bodies) {
    if (!this.isActive || this.trail.length < 2) return;

    // Use the last two trail points as the blade segment
    const p1 = this.trail[this.trail.length - 2];
    const p2 = this.trail[this.trail.length - 1];

    for (const body of bodies) {
      if (body.gameData.sliced) continue;
      if (this.currentSwipeSliced.has(body.id)) continue;

      // Point-in-circle test for both endpoints + segment distance check
      const hit = this._lineIntersectsCircle(
        p1.x, p1.y, p2.x, p2.y,
        body.position.x, body.position.y,
        body.gameData.radius
      );

      if (hit) {
        body.gameData.sliced = true;
        this.currentSwipeSliced.add(body.id);

        if (body.gameData.type === 'fruit') {
          this.onSliceFruit(body, this.currentSwipeSliced.size);
        } else if (body.gameData.type === 'bomb') {
          this.onSliceBomb(body);
        }
      }
    }
  }

  // Line segment to circle intersection
  _lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;

    let discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return false;

    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    // Check if intersection is within the segment (t in [0, 1])
    if (t1 >= 0 && t1 <= 1) return true;
    if (t2 >= 0 && t2 <= 1) return true;

    // Also check if either endpoint is inside the circle
    if (fx * fx + fy * fy <= r * r) return true;
    const fx2 = x2 - cx;
    const fy2 = y2 - cy;
    if (fx2 * fx2 + fy2 * fy2 <= r * r) return true;

    return false;
  }

  // Update trail (fade old points)
  updateTrail() {
    const now = performance.now();
    // Remove points older than 150ms
    this.trail = this.trail.filter(p => now - p.time < 150);
  }

  // Get trail points for rendering
  getTrail() {
    return this.trail;
  }

  disable() {
    this.enabled = false;
    this.isActive = false;
    this.trail = [];
  }

  enable() {
    this.enabled = true;
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointercancel', this._onPointerUp);
  }
}
