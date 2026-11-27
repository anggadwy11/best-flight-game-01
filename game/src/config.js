// Storm Rescue — every tuning number and colour in one place.
// The grade is a backlit squall: a dark slate storm world with ONE warm
// sodium gap torn in the clouds at the horizon, so every frame reads as a
// bright warm band behind dark silhouettes — maximum thumbnail contrast,
// and the warm coherent key light the sunset build was praised for.

export const STEP = 1 / 60;

/** The storm clock: seconds until the squall peaks and the sea closes. */
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
  sun: 0xff9a4d,         // sodium warm key, low behind the storm wall
  glow: 0xffb36b,
  skyTop: 0x1f2735,      // slate storm blue, up high
  skyMid: 0x3d4a5c,
  fog: 0x59636e,         // grey-blue murk, with a hard visibility floor
  shadow: 0x1a2230,
  sea: 0x27383f,         // dark teal-grey water
  seaDeep: 0x11161d,     // near-black troughs
  sand: 0x6f6152,        // wet sand, darker than any beach holiday
  grass: 0x3f5a48,       // storm-battered green
  grassDark: 0x2c4234,
  palmTrunk: 0x4a3826,
  palmLeaf: 0x2c5240,
  houseWall: 0xcfd4d8,    // weatherboard grey-white
  houseRoof: 0x8a3b34,
  runway: 0x23262e,      // wet asphalt
  runwayLine: 0xf5efdd,
  planeBody: 0xf4f1e8,   // rescue white
  planeTrim: 0xff7a2a,   // SAR orange — the plane pops against dark sea
  planeWing: 0xf4f1e8,
  ringNext: 0xffb03a,    // amber hover ring
  ringDone: 0x39d98a,    // rescued teal-green
  flare: 0xff2a1e,       // the one red point of salience per frame
  balloonA: 0xff5e8a,
  balloonB: 0x2fb6d4,
  balloonC: 0xffc93c,
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'storm-rescue.best';

/**
 * The three maydays, in rescue order. Each boat lists in the swell with its
 * crew on deck; the hover ring floats above it at ringY.
 */
export const BOATS = [
  { x: 60,   z: -420,  name: 'FV Kestrel', crew: 3, ringY: 17, list: 0.16 },
  { x: -130, z: -850,  name: 'FV Brine',   crew: 4, ringY: 17, list: -0.21 },
  { x: 95,   z: -1180, name: 'FV Alba',    crew: 2, ringY: 17, list: 0.13 },
];

/** Hover-rescue rules: stay in the ring, low and slow, this long. */
export const RESCUE = { radius: 14, band: 6.5, maxSpeed: 26, dwell: 2.5, points: 400 };

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
