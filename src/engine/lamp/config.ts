export const CONFIG = {
  // Visual Theme & Palette
  colors: {
    bg: 0x050607,
    text: 0xe6dfd3,
    muted: 0x8a8176,
    accent: 0xe0b87a,
    bulbWarm: 0xffb866,
    shadeOuter: 0x27272a,
    shadeInner: 0xd4af37,
    switchPlate: 0x18181b,
    switchRocker: 0x2c2c30,
    slingshotWood: 0x8b5a2b,
    elasticBand: 0xd97706,
    stone: 0x71717a,
    ledOn: 0x22c55e,
    ledOff: 0xef4444,
    gridLine: 0x1d1f23,
    placeholder: 0xe0b87a,
  },

  // Viewport & Camera
  viewport: {
    worldHeight: 10, // Fixed orthographic vertical world units
    maxPixelRatio: 2,
    near: 0.1,
    far: 100,
    mobileBreakpoint: 768, // px
  },

  // Anchors in normalized coordinates: [-1 to 1]
  // On resize, world coordinates are automatically computed via worldHeight and aspect ratio
  anchors: {
    desktop: {
      lamp: { nx: 0, ny: 0.96 },       // Top center
      switch: { nx: 0.78, ny: 0.05 },   // Right middle
      slingshot: { nx: -0.72, ny: -0.68 }, // Bottom left
    },
    mobile: {
      lamp: { nx: 0, ny: 0.94 },       // Top center
      switch: { nx: 0.40, ny: -0.20 },  // Lower right
      slingshot: { nx: -0.52, ny: -0.66 }, // Bottom left
    },
  },

  // Physics & Mechanics
  physics: {
    fixedTimeStep: 1 / 120,
    maxSubSteps: 5,
    gravity: -18.0,
    airDrag: 0.998,
    maxLiveStones: 5,
    maxBounces: 3,
    bounceRestitution: 0.52,
    stoneRadius: 0.13,
    stoneMass: 0.18,
    lampMass: 1.5,
    lampPivotLength: 2.35,
    lampDamping: 0.82,
    lampRestitution: 0.45,
    switchThresholdSpeed: 4.5,
    floorRestitution: 0.52,
    wallRestitution: 0.42,
    friction: 0.82,
    settleVelocityThreshold: 0.65,
    settleDuration: 1.2, // seconds to rest on floor before respawn
  },

  // Lamp Pendulum specs
  lamp: {
    cordLength: 2.1,
    gravity: 9.81,
    damping: 0.78,
    shadeRadius: 0.88,
    shadeHeight: 0.72,
    bulbRadius: 0.28,
  },

  // Wall Switch specs
  wallSwitch: {
    rockerAngleMax: 0.28,
    width: 0.95,
    height: 1.45,
    depth: 0.12,
  },

  // Slingshot specs
  slingshot: {
    pullRadiusMax: 1.4,
    minPullDistance: 0.15,
    power: 24.0,
    snapDuration: 0.14,
    restPouchPos: { x: 0, y: 0.22, z: 0.08 },
    leftForkTip: { x: -0.36, y: 0.56, z: 0.06 },
    rightForkTip: { x: 0.36, y: 0.56, z: 0.06 },
  },

  // Glass Shards & Shatter specs (Phase 7)
  shards: {
    count: 32,
    gravity: -18.0,
    explosionMinSpeed: 3.5,
    explosionMaxSpeed: 8.0,
    stoneMomentumFactor: 0.35,
    floorRestitution: 0.38,
    friction: 0.68,
    sparkDuration: 0.09,
    settleDuration: 2.8,
  },

  // Post-processing Bloom
  bloom: {
    strength: 1.25,
    radius: 0.65,
    threshold: 0.25,
  },
} as const;

export type LampConfig = typeof CONFIG;

