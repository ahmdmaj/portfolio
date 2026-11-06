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
      lamp: { nx: 0, ny: 0.92 },       // Top center
      switch: { nx: 0.65, ny: -0.25 },  // Lower right
      slingshot: { nx: -0.55, ny: -0.72 }, // Bottom left
    },
  },

  // Physics & Mechanics
  physics: {
    fixedTimeStep: 1 / 120,
    maxSubSteps: 5,
    gravity: -18.0,
    airDrag: 0.998,
    maxLiveStones: 5,
    maxBounces: 2,
    bounceRestitution: 0.55,
  },

  // Lamp Pendulum specs
  lamp: {
    cordLength: 3.2,
    gravity: 9.81,
    damping: 0.65,
    shadeRadius: 0.85,
    shadeHeight: 0.7,
    bulbRadius: 0.28,
  },

  // Slingshot specs
  slingshot: {
    pullRadiusMax: 1.6,
    power: 26.0,
  },

  // Post-processing Bloom
  bloom: {
    strength: 1.25,
    radius: 0.65,
    threshold: 0.25,
  },
} as const;

export type LampConfig = typeof CONFIG;

