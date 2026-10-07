// Spawner — wave-based fruit & bomb spawning with difficulty ramp
import { createFruitBody, getRandomFruitType } from './FruitBody.js';
import { createBombBody } from './BombBody.js';
import Matter from 'matter-js';

const DIFFICULTY_RAMP_TIME = 120; // seconds to reach max difficulty

export class Spawner {
  constructor(engine, canvasWidth, canvasHeight) {
    this.engine = engine;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.spawnTimer = 0;
    this.elapsedTime = 0;
    this.totalFruitsSpawned = 0;
    this.totalBombsSpawned = 0;
    this.bodies = []; // tracked active bodies
  }

  resize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  // Returns the current difficulty factor (0 to 1) based on elapsed time
  getDifficulty() {
    return Math.min(1, this.elapsedTime / DIFFICULTY_RAMP_TIME);
  }

  // Spawn interval decreases as difficulty increases
  getSpawnInterval() {
    const difficulty = this.getDifficulty();
    // Start at ~1.4s, ramp down to ~0.5s
    return 1.4 - difficulty * 0.9;
  }

  // Bomb probability increases with difficulty
  getBombProbability() {
    const difficulty = this.getDifficulty();
    // Start at 5%, ramp to 18%
    return 0.05 + difficulty * 0.13;
  }

  // How many items per batch
  getBatchSize() {
    const difficulty = this.getDifficulty();
    // Weighted random: more likely to get larger batches later
    const base = 1;
    const extra = Math.floor(Math.random() * (2 + Math.floor(difficulty * 3)));
    return Math.min(base + extra, 5);
  }

  update(delta) {
    this.elapsedTime += delta;
    this.spawnTimer += delta;

    const interval = this.getSpawnInterval();
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnBatch();
    }
  }

  spawnBatch() {
    const count = this.getBatchSize();
    const bombProb = this.getBombProbability();
    const spawnedBodies = [];

    for (let i = 0; i < count; i++) {
      const isBomb = Math.random() < bombProb;
      const body = isBomb ? this.spawnBomb() : this.spawnFruit();
      spawnedBodies.push(body);
    }

    // Ensure at least one fruit per batch (never all-bombs)
    const hasFruit = spawnedBodies.some(b => b.gameData.type === 'fruit');
    if (!hasFruit && spawnedBodies.length > 0) {
      // Replace last bomb with a fruit
      const lastBomb = spawnedBodies[spawnedBodies.length - 1];
      Matter.World.remove(this.engine.world, lastBomb);
      this.bodies = this.bodies.filter(b => b !== lastBomb);
      this.totalBombsSpawned--;
      const fruit = this.spawnFruit();
      spawnedBodies[spawnedBodies.length - 1] = fruit;
    }

    return spawnedBodies;
  }

  spawnFruit() {
    const fruitType = getRandomFruitType();
    const padding = 60;
    const x = padding + Math.random() * (this.canvasWidth - padding * 2);
    const y = this.canvasHeight + fruitType.radius + 10;

    const body = createFruitBody(x, y, fruitType);

    // Apply upward velocity — scale with canvas height for consistent arcs
    const heightScale = this.canvasHeight / 700;
    
    // Bias horizontal velocity towards the center so fruits never go off-screen
    const centerX = this.canvasWidth / 2;
    const distanceFromCenter = (x - centerX) / centerX; // -1 (left) to 1 (right)
    const vx = (Math.random() - 0.5) * 4 - (distanceFromCenter * 4);
    
    const vy = -(10 + Math.random() * 6) * heightScale;
    Matter.Body.setVelocity(body, { x: vx, y: vy });

    // Angular velocity for spinning
    const angularVel = (Math.random() - 0.5) * 0.15;
    Matter.Body.setAngularVelocity(body, angularVel);

    Matter.World.add(this.engine.world, body);
    this.bodies.push(body);
    this.totalFruitsSpawned++;

    return body;
  }

  spawnBomb() {
    const padding = 80;
    const x = padding + Math.random() * (this.canvasWidth - padding * 2);
    const y = this.canvasHeight + 30;

    const body = createBombBody(x, y);

    const heightScale = this.canvasHeight / 700;
    
    // Bias horizontal velocity towards the center
    const centerX = this.canvasWidth / 2;
    const distanceFromCenter = (x - centerX) / centerX; 
    const vx = (Math.random() - 0.5) * 3 - (distanceFromCenter * 4);
    
    const vy = -(11 + Math.random() * 5) * heightScale;
    Matter.Body.setVelocity(body, { x: vx, y: vy });

    const angularVel = (Math.random() - 0.5) * 0.1;
    Matter.Body.setAngularVelocity(body, angularVel);

    Matter.World.add(this.engine.world, body);
    this.bodies.push(body);
    this.totalBombsSpawned++;

    return body;
  }

  // Remove a body from tracking and the world
  removeBody(body) {
    Matter.World.remove(this.engine.world, body);
    this.bodies = this.bodies.filter(b => b !== body);
  }

  // Check for bodies that have fallen below the screen
  // Returns array of missed fruit bodies
  checkOffScreen() {
    const missed = [];
    const threshold = this.canvasHeight + 80;

    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const body = this.bodies[i];
      if (body.position.y > threshold) {
        if (body.gameData.type === 'fruit' && !body.gameData.sliced) {
          missed.push(body);
        }
        Matter.World.remove(this.engine.world, body);
        this.bodies.splice(i, 1);
      }
    }

    return missed;
  }

  clear() {
    for (const body of this.bodies) {
      Matter.World.remove(this.engine.world, body);
    }
    this.bodies = [];
    this.spawnTimer = 0;
    this.elapsedTime = 0;
    this.totalFruitsSpawned = 0;
    this.totalBombsSpawned = 0;
  }
}
