// Sunset Sortie — every tuning number and colour in one place.
// Golden-hour grade follows the measured preset: warm key #FFB36B, violet-blue
// shadows, peach fog that starts close enough to actually work, and a sky that
// keeps ~25% violet/blue so the frame never turns into orange soup.

export const STEP = 1 / 60;

/** The sortie clock: one sunset, in seconds of play. */
export const SORTIE_SECONDS = 240;

export const PLANE = {
  minSpeed: 16,          // m/s, throttle at zero still glides
  maxSpeed: 68,          // m/s at full throttle
  accel: 14,             // m/s^2 toward the throttle's target speed
  stallSpeed: 25,        // below this the nose drops and the plane sinks
  maxBank: 0.95,         // radians of roll at full stick
  bankRate: 2.6,         // how fast roll answers the stick
  turnPerBank: 0.85,     // heading change per radian of bank, per second
  pitchRate: 0.62,       // climb fraction of forward speed at full stick
  startFuel: 100,
  fuelBurn: 0.055,       // per second at cruise, scaled by throttle
  crashSpeed: 40,        // arriving at the ground faster than this is a crash
};

export const PALETTE = {
  sun: 0xffb36b,         // golden key light
  sunDisc: 0xffcf9e,
  skyTop: 0x8a6f8a,      // violet dusk up high
  skyHorizon: 0xffc47c,  // peach at the horizon
  fog: 0xf7b98a,
  shadow: 0x444380,      // violet shade, never brown
  sea: 0x2e6f8e,
  seaDeep: 0x262c51,     // navy, the darkest colour in the game
  sand: 0xf2d492,
  grass: 0x58a05c,
  grassDark: 0x3d7a4a,
  palmTrunk: 0x8a5a3b,
  palmLeaf: 0x2f8f5b,
  houseWall: 0xffe3ec,
  houseRoof: 0xe5534b,
  runway: 0x3a3f52,
  runwayLine: 0xfff7ea,
  planeBody: 0xfff3d6,
  planeTrim: 0xe5534b,
  planeWing: 0xffd98a,
  ringNext: 0xffc93c,
  ringDone: 0x2fd4b6,
  ringLater: 0xff8c5a,
  balloonA: 0xff5e8a,
  balloonB: 0x2fb6d4,
  balloonC: 0xffc93c,
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sunset-sortie.best';

/** The course: gates in flying order. Stage 1 = 0-5, cargo = 6-8, final = 9-11. */
export const GATES = [
  { x: 0,    y: 85, z: 220,   label: 'Gate 1' },
  { x: -60,  y: 95, z: 40,    label: 'Gate 2' },
  { x: 40,   y: 80, z: -140,  label: 'Gate 3' },
  { x: 130,  y: 95, z: -300,  label: 'Gate 4' },
  { x: 60,   y: 75, z: -470,  label: 'Gate 5' },
  { x: -40,  y: 65, z: -580,  label: 'Gate 6' },
  { x: 0,    y: 58, z: -700,  label: 'Cargo 1', cargo: true },
  { x: -85,  y: 68, z: -830,  label: 'Cargo 2', cargo: true },
  { x: -30,  y: 55, z: -960,  label: 'Cargo 3', cargo: true },
  { x: 80,   y: 78, z: -1090, label: 'Gate 10' },
  { x: 150,  y: 58, z: -1230, label: 'Gate 11' },
  { x: 175,  y: 38, z: -1360, label: 'Final gate' },
];

/** The landing strip on Coral Run island: centre, heading and size. */
export const RUNWAY = { x: 180, z: -1560, halfWidth: 14, halfLength: 115, deckY: 6 };

/** Islands the terrain builds and the flight model collides with. */
export const ISLANDS = [
  { x: 0,    z: 560,   r: 95,  h: 13, name: 'Home Dock' },
  { x: -260, z: -200,  r: 70,  h: 12, name: 'Turtle Cay' },
  { x: 300,  z: -450,  r: 80,  h: 14, name: 'Kite Rock' },
  { x: 0,    z: -660,  r: 95,  h: 13, name: 'Palm Cay' },
  { x: -230, z: -980,  r: 65,  h: 11, name: 'Mango Cay' },
  { x: 430,  z: -1080, r: 90,  h: 15, name: 'Far Rock' },
  { x: -360, z: -1420, r: 75,  h: 12, name: 'Dusk Cay' },
  { x: 180,  z: -1560, r: 120, h: 6,  name: 'Coral Run', runway: true },
];
