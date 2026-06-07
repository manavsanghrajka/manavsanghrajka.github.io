// GameEngine — Core game loop orchestrating Matter.js, Spawner, Slicer, Renderer, and Particles
import Matter from 'matter-js';
import { Spawner } from './Spawner.js';
import { Slicer } from './Slicer.js';
import { Renderer } from './Renderer.js';
import { ParticleSystem } from './Particles.js';

const MAX_LIVES = 3;
const MAX_DELTA = 32; // ms — cap to prevent physics explosion on tab-switch

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = 'IDLE'; // IDLE | PLAYING | GAME_OVER

    // Stats
    this.score = 0;
    this.lives = MAX_LIVES;
    this.elapsedTime = 0;
    this.gameStartTime = 0;
    this.totalFruitsSliced = 0;

    // Callbacks (set by React hook)
    this.onScoreChange = null;
    this.onLivesChange = null;
    this.onTimeChange = null;
    this.onGameOver = null;
    this.onComboHit = null;

    // Matter.js engine
    this.matterEngine = Matter.Engine.create({
      gravity: { x: 0, y: 1.0 },
    });

    // Use logical dimensions (set by React component for DPR scaling)
    const w = canvas._logicalWidth || canvas.width;
    const h = canvas._logicalHeight || canvas.height;

    // Subsystems
    this.logicalWidth = w;
    this.logicalHeight = h;
    this.spawner = new Spawner(
      this.matterEngine,
      w,
      h
    );
    this.renderer = new Renderer(canvas);
    this.renderer.resize(w, h);
    this.particles = new ParticleSystem();
    this.slicer = new Slicer(
      canvas,
      this._onSliceFruit.bind(this),
      this._onSliceBomb.bind(this)
    );
    this.slicer.onCombo = this._onCombo.bind(this);

    // Animation frame
    this._rafId = null;
    this._lastTime = 0;

    // Bomb overlay
    this._bombOverlayAlpha = 0;
    this._bombOverlayDecay = false;
  }

  resize(width, height) {
    this.logicalWidth = width;
    this.logicalHeight = height;
    this.spawner.resize(width, height);
    this.renderer.resize(width, height);
  }

  start() {
    this.state = 'PLAYING';
    this.score = 0;
    this.lives = MAX_LIVES;
    this.elapsedTime = 0;
    this.totalFruitsSliced = 0;
    this.gameStartTime = performance.now();
    this._bombOverlayAlpha = 0;

    // Clear previous state
    this.spawner.clear();
    this.renderer.clearEffects();
    this.particles.clear();
    this.slicer.enable();

    // Notify React
    if (this.onScoreChange) this.onScoreChange(this.score);
    if (this.onLivesChange) this.onLivesChange(this.lives);
    if (this.onTimeChange) this.onTimeChange(this.elapsedTime);

    // Start loop
    this._lastTime = performance.now();
    this._loop();
  }

  _loop() {
    if (this.state !== 'PLAYING') return;

    this._rafId = requestAnimationFrame(() => {
      const now = performance.now();
      let delta = now - this._lastTime;
      this._lastTime = now;

      // Cap delta to prevent physics explosion
      if (delta > MAX_DELTA) delta = MAX_DELTA;

      const deltaSec = delta / 1000;

      this._update(deltaSec);
      this._render();

      if (this.state === 'PLAYING') {
        this._loop();
      }
    });
  }

  _update(deltaSec) {
    // Update timer
    this.elapsedTime += deltaSec;
    if (this.onTimeChange) {
      this.onTimeChange(this.elapsedTime);
    }

    // Update Matter.js physics
    Matter.Engine.update(this.matterEngine, deltaSec * 1000);

    // Update spawner
    this.spawner.update(deltaSec);

    // Check blade collisions
    this.slicer.checkCollisions(this.spawner.bodies);

    // Update slicer trail
    this.slicer.updateTrail();

    // Check for missed fruits
    const missed = this.spawner.checkOffScreen();
    if (missed.length > 0) {
      this.lives -= missed.length;
      this.lives = Math.max(0, this.lives);
      if (this.onLivesChange) this.onLivesChange(this.lives);

      if (this.lives <= 0) {
        this._endGame('lives');
        return;
      }
    }

    // Update animations
    this.renderer.updateSliceHalves();
    this.renderer.updateComboTexts();
    this.particles.update();

    // Update bomb overlay fade
    if (this._bombOverlayDecay && this._bombOverlayAlpha > 0) {
      this._bombOverlayAlpha -= deltaSec * 2;
      if (this._bombOverlayAlpha < 0) this._bombOverlayAlpha = 0;
    }
  }

  _render() {
    const { renderer, particles, slicer, canvas } = this;

    // Clear & draw background
    renderer.clear();

    // Draw all active fruits first
    for (const body of this.spawner.bodies) {
      if (body.gameData.type === 'fruit') {
        renderer.drawFruit(body);
      }
    }

    // Draw bombs on top of fruits
    for (const body of this.spawner.bodies) {
      if (body.gameData.type === 'bomb') {
        renderer.drawBomb(body);
      }
    }

    // Draw slice halves
    renderer.drawSliceHalves();

    // Draw particles
    particles.draw(renderer.ctx);

    // Draw blade trail
    renderer.drawBlade(slicer.getTrail());

    // Draw combo/score texts
    renderer.drawComboTexts();

    // Draw bomb overlay if active
    if (this._bombOverlayAlpha > 0) {
      renderer.drawBombOverlay(this._bombOverlayAlpha * 0.5);
    }
  }

  _onSliceFruit(body, swipeCount) {
    // Remove from spawner
    this.spawner.removeBody(body);

    // Spawn slice halves
    this.renderer.addSliceHalves(body);

    // Spawn particles
    this.particles.emit(body.position.x, body.position.y, body.gameData.color, 12);

    // Score popup
    this.renderer.addScorePopup(body.position.x, body.position.y, 1);

    // Update score
    this.score += 1;
    this.totalFruitsSliced += 1;
    if (this.onScoreChange) this.onScoreChange(this.score);
  }

  _onCombo(count) {
    if (count < 3) return;

    // Award bonus points for combo
    const bonus = count;
    this.score += bonus;
    if (this.onScoreChange) this.onScoreChange(this.score);

    // Show combo text at center-ish of screen
    this.renderer.addComboText(
      (this.logicalWidth || this.renderer.width) / 2,
      (this.logicalHeight || this.renderer.height) / 3,
      count
    );

    if (this.onComboHit) this.onComboHit(count);
  }

  _onSliceBomb(body) {
    // Remove bomb
    this.spawner.removeBody(body);

    // Explosion particles
    this.particles.emitExplosion(body.position.x, body.position.y);

    // Red overlay flash
    this._bombOverlayAlpha = 1;
    this._bombOverlayDecay = true;

    // Game over
    this._endGame('bomb');
  }

  _endGame(reason) {
    this.state = 'GAME_OVER';
    this.slicer.disable();

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    // If bomb, do one final render with overlay
    if (reason === 'bomb') {
      this._bombOverlayAlpha = 0.5;
      this._render();
    }

    const stats = this.getStats();

    if (this.onGameOver) {
      this.onGameOver(reason, stats);
    }
  }

  getStats() {
    return {
      score: this.score,
      fruitsSpawned: this.spawner.totalFruitsSpawned,
      fruitsSliced: this.totalFruitsSliced,
      elapsedTime: this.elapsedTime,
      endReason: this.state === 'GAME_OVER' ? 'ended' : 'playing',
    };
  }

  destroy() {
    this.state = 'IDLE';
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.slicer.destroy();
    this.spawner.clear();
    this.particles.clear();
    this.renderer.clearEffects();
    Matter.Engine.clear(this.matterEngine);
  }
}
