// The aeroplane: its 3D build and its flight model. The model is honest
// arcade physics — bank turns the plane, speed below the stall drops the
// nose, throttle sets a target speed the engine chases — so throttle and
// turn discipline are what the flying rewards.
import * as THREE from 'three';
import { ISLANDS, PALETTE, PLANE, RUNWAY } from './config.js';

export function buildPlane() {
  const group = new THREE.Group();
  const body = new THREE.MeshLambertMaterial({ color: PALETTE.planeBody });
  const trim = new THREE.MeshLambertMaterial({ color: PALETTE.planeTrim });
  const wingMat = new THREE.MeshLambertMaterial({ color: PALETTE.planeWing });
  const dark = new THREE.MeshLambertMaterial({ color: PALETTE.seaDeep });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.45, 7.2, 10), body);
  fuselage.rotation.x = Math.PI / 2;
  group.add(fuselage);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.88, 10, 8), trim);
  nose.position.z = -3.6;
  group.add(nose);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.72, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ef, emissive: 0x224455 }));
  cockpit.scale.set(0.9, 0.62, 1.5);
  cockpit.position.set(0, 0.72, -0.7);
  group.add(cockpit);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.18, 1.7), wingMat);
  wing.position.set(0, 0.25, -0.6);
  group.add(wing);
  const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.2, 0.4), trim);
  wingStripe.position.set(0, 0.25, -1.25);
  group.add(wingStripe);

  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.0), wingMat);
  tailWing.position.set(0, 0.35, 3.4);
  group.add(tailWing);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.7, 1.1), trim);
  fin.position.set(0, 1.0, 3.4);
  group.add(fin);

  // Amphibious floats: this is a seaplane, and the floats say so at a glance.
  for (const side of [-1, 1]) {
    const float = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 4.6, 3, 8), trim);
    float.rotation.x = Math.PI / 2;
    float.position.set(side * 1.7, -1.5, -0.2);
    group.add(float);
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), dark);
    strut.position.set(side * 1.4, -0.85, -0.9);
    group.add(strut);
    const strut2 = strut.clone();
    strut2.position.z = 0.7;
    group.add(strut2);
  }

  const prop = new THREE.Group();
  const bladeMat = new THREE.MeshBasicMaterial({ color: 0x2b2135 });
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.4, 0.08), bladeMat);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.28, 0.08), bladeMat);
  prop.add(blade1, blade2);
  prop.position.z = -4.15;
  group.add(prop);

  // Navigation lights: red left, green right, white tail — small bright
  // accents that read even in the small screenshot cells.
  const lightGeo = new THREE.SphereGeometry(0.16, 6, 6);
  const leftLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xff4444 }));
  leftLight.position.set(-5.75, 0.3, -0.6);
  const rightLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0x44ff88 }));
  rightLight.position.set(5.75, 0.3, -0.6);
  group.add(leftLight, rightLight);

  // The searchlight: a visible cone sweeping down-forward from the nose —
  // in the storm frames it is the plane's signature, a blade of warm light.
  const beam = new THREE.Mesh(new THREE.ConeGeometry(3.4, 20, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffd9a0, transparent: true, opacity: 0.085,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
  beam.rotation.x = Math.PI / 2 + 0.62;
  beam.position.set(0, -4.2, -10.5);
  group.add(beam);

  return { group, prop };
}

export function createFlight() {
  const state = {
    x: 0, y: 92, z: 430,
    heading: 0,            // radians, 0 = north (-z), clockwise from above
    bank: 0, pitch: 0,
    speed: 42, throttle: 0.62,
    vy: 0, fuel: PLANE.startFuel, hull: 100,
    timeLeft: 0, score: 0, crashed: false, landed: false,
    propSpin: 0,
  };

  function reset() {
    state.x = 0; state.y = 92; state.z = 430;
    state.heading = 0; state.bank = 0; state.pitch = 0;
    state.speed = 42; state.throttle = 0.62;
    state.vy = 0; state.fuel = PLANE.startFuel; state.hull = 100;
    state.score = 0; state.crashed = false; state.landed = false;
    state.propSpin = 0;
  }

  /** Forward unit vector in the horizontal plane. */
  function forward() {
    return { x: Math.sin(state.heading), z: -Math.cos(state.heading) };
  }

  /**
   * Advance one step. control = { bank, pitch, throttleAxis, boost }.
   * Returns 'crash' | 'landed' | 'splash' | null.
   */
  function step(dt, control) {
    if (state.crashed || state.landed) return null;

    state.throttle = THREE.MathUtils.clamp(
      state.throttle + control.throttleAxis * dt * 0.55, 0, 1);
    const target = PLANE.minSpeed + state.throttle * (PLANE.maxSpeed - PLANE.minSpeed)
      + (control.boost ? 9 : 0);
    const dv = target - state.speed;
    state.speed += THREE.MathUtils.clamp(dv, -PLANE.accel * dt, PLANE.accel * dt);

    const wantBank = control.bank * PLANE.maxBank;
    state.bank += (wantBank - state.bank) * Math.min(1, PLANE.bankRate * dt);
    state.heading += state.bank * PLANE.turnPerBank * dt * (34 / Math.max(24, state.speed));

    // Pitch: stick gives a climb rate; a stall quietly takes it away.
    let climb = control.pitch * state.speed * PLANE.pitchRate * 0.42;
    if (state.speed < PLANE.stallSpeed) climb -= (PLANE.stallSpeed - state.speed) * 0.55;
    state.vy += (climb - state.vy) * Math.min(1, 3.2 * dt);
    state.pitch = THREE.MathUtils.clamp(state.vy / Math.max(20, state.speed), -0.6, 0.6);

    const f = forward();
    state.x += f.x * state.speed * dt;
    state.z += f.z * state.speed * dt;
    state.y += state.vy * dt;
    // Squall gusts: a sideways shove plus turbulence that worries the
    // wings — the storm is a flight input, not just a backdrop.
    if (control.wind) {
      state.x += control.wind.x * dt;
      state.z += control.wind.z * dt;
      state.bank += Math.sin(state.propSpin * 0.35) * control.wind.turb * 0.1 * dt * 8;
      state.y += Math.sin(state.propSpin * 0.21) * control.wind.turb * 1.6 * dt;
    }
    if (state.y > 190) { state.y = 190; state.vy = Math.min(state.vy, 0); }

    state.fuel = Math.max(0, state.fuel - PLANE.fuelBurn * (0.35 + state.throttle) * dt * 3.2);
    if (state.fuel <= 0) { state.throttle = 0; }
    state.propSpin += dt * (6 + state.throttle * 46);

    // Ground, sea and the strip.
    const groundY = groundHeightAt(state.x, state.z);
    if (state.y <= groundY + 2.2) {
      const onStrip = Math.abs(state.x - RUNWAY.x) < RUNWAY.halfWidth
        && Math.abs(state.z - RUNWAY.z) < RUNWAY.halfLength && groundY === RUNWAY.deckY;
      const gentle = state.speed <= PLANE.crashSpeed && state.vy >= -7.5;
      if (onStrip && gentle) { state.landed = true; state.y = groundY + 2.2; return 'landed'; }
      state.crashed = true;
      return groundY <= 0.5 ? 'splash' : 'crash';
    }
    return null;
  }

  return { state, reset, step, forward };
}

/** Terrain height under a point: the sea is 0, islands rise to their h. */
export function groundHeightAt(x, z) {
  let h = 0;
  for (const island of ISLANDS) {
    const dx = x - island.x;
    const dz = z - island.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d >= island.r) continue;
    const top = island.runway ? RUNWAY.deckY : island.h;
    // Flat top inside 55% of the radius, sloping beach out to the water.
    const t = THREE.MathUtils.clamp((island.r - d) / (island.r * 0.45), 0, 1);
    h = Math.max(h, top * t);
    if (island.runway && Math.abs(x - RUNWAY.x) < RUNWAY.halfWidth + 26
      && Math.abs(z - RUNWAY.z) < RUNWAY.halfLength + 30) h = Math.max(h, RUNWAY.deckY);
  }
  return h;
}

/** Place the plane model from the flight state, with honest bank and pitch. */
export function posePlane(planeParts, state) {
  const { group, prop } = planeParts;
  group.position.set(state.x, state.y, state.z);
  group.rotation.set(0, 0, 0);
  group.rotation.y = -state.heading;
  group.rotation.x = -state.pitch * 0.7;
  group.rotation.z = state.bank * 0.9;
  prop.rotation.z = state.propSpin;
}
