// The rescue itself: three maydays, one hover at a time.
// Fly into the amber ring above a listing boat, hold low and slow while
// the crew climbs the ladder, then run for the strip before the squall
// peaks. Owns the hover rings, the single active flare (one red point of
// salience per frame — never three), the searchlight disc under the
// plane, and the spray that bursts off the water in a low hover.
import * as THREE from 'three';
import { BOATS, PALETTE, RESCUE, RUNWAY } from './config.js';
import { waveHeight } from './world.js';

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}


export const STAGES = [
  { name: 'FIRST MAYDAY', goal: 'Hover over FV Kestrel — crew of 3' },
  { name: 'SECOND MAYDAY', goal: 'Hover over FV Brine — crew of 4' },
  { name: 'LAST MAYDAY', goal: 'Hover over FV Alba — crew of 2' },
];

export function createRescue(scene) {
  const state = {
    boatIndex: 0,        // the boat that needs rescuing now
    rescued: 0,
    dwell: 0,            // seconds held inside the current ring
    banner: '', bannerT: 0,
    finished: false,     // all crews aboard: only the landing remains
  };

  // Hover rings: thick emissive torus + a light shaft down to the boat,
  // so the target reads from far away through rain.
  const rings = [];
  const ringGeo = new THREE.TorusGeometry(RESCUE.radius, 1.15, 10, 30);
  const shaftGeo = new THREE.CylinderGeometry(RESCUE.radius * 0.92, RESCUE.radius * 0.92, 15, 20, 1, true);
  for (const boat of BOATS) {
    const mat = new THREE.MeshBasicMaterial({
      color: PALETTE.ringNext, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(boat.x, boat.ringY, boat.z);
    scene.add(ring);
    const shaft = new THREE.Mesh(shaftGeo, new THREE.MeshBasicMaterial({
      color: PALETTE.ringNext, transparent: true, opacity: 0.1,
      side: THREE.DoubleSide, depthWrite: false,
    }));
    shaft.position.set(boat.x, boat.ringY - 7.5, boat.z);
    scene.add(shaft);
    rings.push({ ring, shaft, mat });
  }

  // The flare: one only, on the current target boat — a red core, a glow,
  // and a smoke column leaning with the wind.
  const flare = new THREE.Group();
  const flareCore = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
  const flareGlow = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 8),
    new THREE.MeshBasicMaterial({ color: PALETTE.flare, transparent: true, opacity: 0.4, depthWrite: false, fog: false }));
  flare.add(flareCore, flareGlow);
  const smokes = [];
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0x555f6a, transparent: true, opacity: 0.4, depthWrite: false });
  for (let i = 0; i < 5; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(2 + i * 0.9, 7, 6), smokeMat);
    puff.position.set(i * 2.6, 4 + i * 3.4, 0);
    flare.add(puff);
    smokes.push(puff);
  }
  scene.add(flare);

  // The searchlight: a bright disc on the water under the plane.
  const lightDisc = new THREE.Mesh(new THREE.CircleGeometry(5.5, 20),
    new THREE.MeshBasicMaterial({ color: 0xffe2ae, transparent: true, opacity: 0.33, depthWrite: false }));
  lightDisc.rotation.x = -Math.PI / 2;
  scene.add(lightDisc);

  // Spray: a burst of white points that lives only in a low hover.
  const SPRAY = 240;
  const sprayGeo = new THREE.BufferGeometry();
  const sprayPos = new Float32Array(SPRAY * 3);
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
  const spray = new THREE.Points(sprayGeo, new THREE.PointsMaterial({
    color: 0xeaf4f6, size: 2.6, map: dotTexture(), transparent: true, opacity: 0, depthWrite: false,
  }));
  spray.frustumCulled = false;
  scene.add(spray);

  function reset() {
    state.boatIndex = 0;
    state.rescued = 0;
    state.dwell = 0;
    state.banner = '';
    state.bannerT = 0;
    state.finished = false;
    paint(0);
  }

  function paint(t) {
    rings.forEach((r, i) => {
      if (i < state.boatIndex) {
        r.mat.color.setHex(PALETTE.ringDone);
        r.ring.scale.setScalar(1);
        r.shaft.material.opacity = 0.04;
      } else if (i === state.boatIndex && !state.finished) {
        r.mat.color.setHex(PALETTE.ringNext);
        r.ring.scale.setScalar(1 + Math.sin(t * 5) * 0.04);
        r.shaft.material.opacity = 0.1 + Math.min(0.25, state.dwell / RESCUE.dwell * 0.25);
      } else {
        r.mat.color.setHex(0x8a97a5);
        r.ring.scale.setScalar(1);
        r.shaft.material.opacity = 0.03;
      }
    });
    if (state.finished) { flare.visible = false; return; }
    flare.visible = true;
    const boat = BOATS[state.boatIndex];
    flare.position.set(boat.x + 2.5, waveHeight(boat.x, boat.z, t) + 6.5, boat.z - 3);
  }

  function stage() {
    if (state.finished) return null;
    return STAGES[state.boatIndex] ?? null;
  }

  function stageNumber() { return Math.min(3, state.boatIndex + 1); }

  function target() {
    if (state.finished) return { x: RUNWAY.x, y: RUNWAY.deckY + 4, z: RUNWAY.z + RUNWAY.halfLength - 20, label: 'Coral Run strip' };
    const b = BOATS[state.boatIndex];
    return { x: b.x, y: b.ringY, z: b.z, label: b.name };
  }

  /**
   * Advance the rescue. Returns { points, boat } on the step a crew comes
   * aboard, else null. Also drives flare, spotlight and spray visuals.
   */
  function step(flight, dt, t) {
    paint(t);
    if (state.bannerT > 0) state.bannerT -= dt;
    // Searchlight disc rides the swell under the plane.
    lightDisc.position.set(flight.x, waveHeight(flight.x, flight.z, t) + 0.4, flight.z);
    const lowOverWater = flight.y < 26 && flight.y > 3;
    spray.material.opacity = lowOverWater ? 0.75 : Math.max(0, spray.material.opacity - dt * 2);
    if (lowOverWater) {
      const arr = sprayGeo.attributes.position.array;
      for (let i = 0; i < SPRAY; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 11;
        arr[i * 3] = flight.x + Math.cos(a) * r;
        arr[i * 3 + 1] = waveHeight(flight.x, flight.z, t) + 0.5 + Math.random() * 2.6;
        arr[i * 3 + 2] = flight.z + Math.sin(a) * r;
      }
      sprayGeo.attributes.position.needsUpdate = true;
    }
    if (state.finished) return null;
    const boat = BOATS[state.boatIndex];
    const dx = flight.x - boat.x;
    const dz = flight.z - boat.z;
    const inRing = Math.hypot(dx, dz) < RESCUE.radius
      && Math.abs(flight.y - boat.ringY) < RESCUE.band
      && flight.speed < RESCUE.maxSpeed;
    if (inRing) {
      state.dwell += dt;
      if (state.dwell >= RESCUE.dwell) {
        state.rescued += 1;
        state.dwell = 0;
        state.banner = `${boat.name.toUpperCase()} CREW ABOARD ${state.rescued} / 3  +${RESCUE.points}`;
        state.bannerT = 2.2;
        state.boatIndex += 1;
        if (state.boatIndex >= BOATS.length) {
          state.finished = true;
          state.banner = 'ALL CREWS ABOARD — LAND ON CORAL RUN';
          state.bannerT = 2.8;
        }
        return { points: RESCUE.points, boat };
      }
    } else {
      state.dwell = Math.max(0, state.dwell - dt * 1.6);
    }
    return null;
  }

  return { state, reset, step, stage, stageNumber, target, paint, rings };
}
