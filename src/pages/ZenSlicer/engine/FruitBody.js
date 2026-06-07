// Fruit body definitions and factory
import Matter from 'matter-js';

const FRUIT_TYPES = [
  {
    kind: 'watermelon',
    radius: 32,
    color: '#4CAF50',
    innerColor: '#E91E63',
    leafColor: '#66BB6A',
    points: 1,
  },
  {
    kind: 'apple',
    radius: 24,
    color: '#F44336',
    innerColor: '#FF5252',
    leafColor: '#66BB6A',
    points: 1,
  },
  {
    kind: 'pineapple',
    radius: 26,
    color: '#FFC107',
    innerColor: '#FFD54F',
    leafColor: '#43A047',
    points: 1,
  },
  {
    kind: 'orange',
    radius: 24,
    color: '#FF9800',
    innerColor: '#FFB74D',
    leafColor: '#66BB6A',
    points: 1,
  },
  {
    kind: 'grape',
    radius: 20,
    color: '#9C27B0',
    innerColor: '#BA68C8',
    leafColor: '#66BB6A',
    points: 1,
  },
  {
    kind: 'kiwi',
    radius: 22,
    color: '#795548',
    innerColor: '#8BC34A',
    leafColor: null,
    points: 1,
  },
];

export function getRandomFruitType() {
  return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
}

export function createFruitBody(x, y, fruitType) {
  const body = Matter.Bodies.circle(x, y, fruitType.radius, {
    restitution: 0.3,
    friction: 0.01,
    frictionAir: 0.001,
    collisionFilter: {
      category: 0x0002,
      mask: 0x0000, // fruits don't collide with each other
    },
    label: 'fruit',
  });

  // Attach custom data
  body.gameData = {
    type: 'fruit',
    fruitKind: fruitType.kind,
    radius: fruitType.radius,
    color: fruitType.color,
    innerColor: fruitType.innerColor,
    leafColor: fruitType.leafColor,
    points: fruitType.points,
    sliced: false,
    opacity: 1,
  };

  return body;
}

export { FRUIT_TYPES };
