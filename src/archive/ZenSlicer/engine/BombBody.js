// Bomb body factory
import Matter from 'matter-js';

const BOMB_RADIUS = 22;

export function createBombBody(x, y) {
  const body = Matter.Bodies.circle(x, y, BOMB_RADIUS, {
    restitution: 0.3,
    friction: 0.01,
    frictionAir: 0.001,
    collisionFilter: {
      category: 0x0004,
      mask: 0x0000, // bombs don't collide with anything
    },
    label: 'bomb',
  });

  body.gameData = {
    type: 'bomb',
    radius: BOMB_RADIUS,
    color: '#424242',
    fuseColor: '#FF1744',
    sliced: false,
    fusePhase: 0, // for blinking animation
    opacity: 1,
  };

  return body;
}

export { BOMB_RADIUS };
