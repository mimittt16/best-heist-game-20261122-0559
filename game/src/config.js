// Tuning constants for The Gilded Gallery. One place for every number the
// other files play with, so balancing is a single edit here.
export const VIEW = { width: 960, height: 640 };
export const HUD_HEIGHT = 52;

// The gallery room (interior of the walls, in canvas pixels).
export const ROOM = { x: 16, y: 64, width: 928, height: 568 };

export const PLAYER = {
  radius: 11,
  walkSpeed: 150,
  sneakSpeed: 78,
  grabRange: 48,
  grabSeconds: 0.9,
};

export const GUARD = {
  radius: 12,
  walkSpeed: 58,
  investigateSpeed: 95,
  coneRange: 205,
  coneHalfAngle: 0.56, // ~32 degrees each side
  hearRadius: 230,
  lookAroundSeconds: 2.2,
};

export const CAMERA = {
  range: 255,
  coneHalfAngle: 0.42,
  sweepSpeed: 0.45, // radians per second
};

export const ALARM = {
  risePerSecond: 42, // inside any live cone
  riseSneaking: 20, // sneaking halves the rise
  decayPerSecond: 15, // hidden again
  spottedAt: 65, // crossing this raises the alarm and sends a guard
  caughtAt: 100,
};

export const TOOLS = {
  coins: 3, // click to throw a noisy coin
  smokeBombs: 2, // key 1: cloud that blocks cones
  emps: 1, // key 2: cameras off for a while
  coinThrowRange: 280,
  coinLureRadius: 230,
  smokeRadius: 72,
  smokeSeconds: 5,
  empSeconds: 6,
};

export const LOOT = {
  sapphire: { value: 500 },
  mask: { value: 200 },
  vase: { value: 150 },
};

export const SCORE = {
  timeBonusStart: 300,
  timeBonusPerSecond: 2,
  alarmPenalty: 25,
};

export const COLORS = {
  floor: '#1c2438',
  floorTile: '#222c44',
  wall: '#0d1322',
  wallTrim: '#3d4a6b',
  hud: '#10182b',
  hudText: '#e8e2d0',
  gold: '#e8b84b',
  goldGlow: '#ffd97a',
  sapphire: '#4fc3f7',
  danger: '#e5484d',
  cone: 'rgba(229, 72, 77, 0.28)',
  coneEdge: 'rgba(229, 72, 77, 0.55)',
  cameraCone: 'rgba(255, 122, 26, 0.26)',
  safe: '#2dd4bf',
  smoke: 'rgba(180, 190, 205, 0.55)',
  thief: '#141a2e',
  thiefTrim: '#e8b84b',
  guard: '#7a1f24',
  guardTrim: '#f2c14e',
  caseGlass: 'rgba(140, 200, 235, 0.16)',
  rope: '#a83246',
};
