// The world: sea, sunset sky, islands, palms, houses, the lighthouse and the
// Coral Run strip. Built once from the shared ISLANDS table, in one coherent
// pastel style, lit by a low warm sun with long shadows toward the camera.
import * as THREE from 'three';
import { GATES, ISLANDS, PALETTE, RUNWAY } from './config.js';
import { createRandom } from './random.js';

function skyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#5b4a7a');
  grad.addColorStop(0.34, '#8a6f8a');
  grad.addColorStop(0.62, '#e88ca0');
  grad.addColorStop(0.82, '#ffc47c');
  grad.addColorStop(1, '#ffd98a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function buildWorld(scene) {
  scene.fog = new THREE.Fog(PALETTE.fog, 120, 900);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1600, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }));
  scene.add(sky);

  // The sun itself: a bright disc low over the water, ahead of the course.
  const sun = new THREE.Mesh(new THREE.CircleGeometry(60, 32),
    new THREE.MeshBasicMaterial({ color: PALETTE.sunDisc, fog: false }));
  sun.position.set(140, 95, -1500);
  sun.lookAt(0, 90, 0);
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xffd9b0, 0x444380, 0.95);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(PALETTE.sun, 1.5);
  sunLight.position.set(120, 130, -420);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x8a6f8a, 0.35));

  // Sea: one wide sheet with a lighter sun-path strip under the sun.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3400, 3400),
    new THREE.MeshLambertMaterial({ color: PALETTE.sea }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0;
  scene.add(sea);
  const sunPath = new THREE.Mesh(new THREE.PlaneGeometry(90, 3000),
    new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: 0.16 }));
  sunPath.rotation.x = -Math.PI / 2;
  sunPath.position.set(120, 0.15, -700);
  scene.add(sunPath);

  const rand = createRandom(20261126);
  const sandMat = new THREE.MeshLambertMaterial({ color: PALETTE.sand });
  const grassMat = new THREE.MeshLambertMaterial({ color: PALETTE.grass });
  const grassDark = new THREE.MeshLambertMaterial({ color: PALETTE.grassDark });
  const trunkMat = new THREE.MeshLambertMaterial({ color: PALETTE.palmTrunk });
  const leafMat = new THREE.MeshLambertMaterial({ color: PALETTE.palmLeaf });
  const wallMat = new THREE.MeshLambertMaterial({ color: PALETTE.houseWall });
  const roofMat = new THREE.MeshLambertMaterial({ color: PALETTE.houseRoof });

  function palm(x, y, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.34 * s, 5.2 * s, 6), trunkMat);
    trunk.position.y = 2.6 * s;
    trunk.rotation.z = 0.12;
    g.add(trunk);
    for (let i = 0; i < 5; i += 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5 * s, 3.6 * s, 5), leafMat);
      const a = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 1.1 * s, 5.4 * s, Math.sin(a) * 1.1 * s);
      leaf.rotation.set(Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15);
      g.add(leaf);
    }
    g.position.set(x, y, z);
    scene.add(g);
  }

  function house(x, y, z, rot) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 6), wallMat);
    base.position.y = 2;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4), roofMat);
    roof.position.y = 5.3;
    roof.rotation.y = Math.PI / 4;
    g.add(base, roof);
    g.position.set(x, y, z);
    g.rotation.y = rot;
    scene.add(g);
  }

  for (const island of ISLANDS) {
    const top = island.runway ? RUNWAY.deckY : island.h;
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(island.r * 0.62, island.r, top + 2, 26),
      island.runway ? grassDark : grassMat);
    hill.position.set(island.x, (top + 2) / 2 - 2, island.z);
    scene.add(hill);
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(island.r * 1.02, island.r * 1.12, 1.6, 26), sandMat);
    beach.position.set(island.x, 0.4, island.z);
    scene.add(beach);
    const palms = island.runway ? 5 : 8;
    for (let i = 0; i < palms; i += 1) {
      const a = rand() * Math.PI * 2;
      const rr = island.r * (0.3 + rand() * 0.32);
      const px = island.x + Math.cos(a) * rr;
      const pz = island.z + Math.sin(a) * rr;
      if (island.runway && Math.abs(px - RUNWAY.x) < 30) continue;
      palm(px, top - 0.5, pz, 0.9 + rand() * 0.5);
    }
    if (!island.runway && island.r >= 70) {
      house(island.x + island.r * 0.28, top - 0.4, island.z + island.r * 0.18, rand() * 2);
      house(island.x - island.r * 0.3, top - 0.4, island.z - island.r * 0.22, rand() * 2);
    }
  }

  // Coral Run strip: dark deck, white numbers, and two rows of lit edge lamps.
  const strip = new THREE.Mesh(new THREE.BoxGeometry(RUNWAY.halfWidth * 2, 1.2, RUNWAY.halfLength * 2),
    new THREE.MeshLambertMaterial({ color: PALETTE.runway }));
  strip.position.set(RUNWAY.x, RUNWAY.deckY - 0.4, RUNWAY.z);
  scene.add(strip);
  const lineMat = new THREE.MeshBasicMaterial({ color: PALETTE.runwayLine });
  for (let i = -4; i <= 4; i += 1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 9), lineMat);
    dash.position.set(RUNWAY.x, RUNWAY.deckY + 0.25, RUNWAY.z + i * 24);
    scene.add(dash);
  }
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe259 });
  const lampGeo = new THREE.SphereGeometry(0.55, 6, 6);
  for (let i = 0; i <= 10; i += 1) {
    for (const side of [-1, 1]) {
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(RUNWAY.x + side * (RUNWAY.halfWidth + 2.5), RUNWAY.deckY + 1,
        RUNWAY.z - RUNWAY.halfLength + i * (RUNWAY.halfLength * 2 / 10));
      scene.add(lamp);
    }
  }
  // Threshold chevrons at the near end, where a landing is judged.
  for (let i = 0; i < 4; i += 1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 7), lineMat);
    bar.position.set(RUNWAY.x - 9 + i * 6, RUNWAY.deckY + 0.25, RUNWAY.z + RUNWAY.halfLength - 8);
    scene.add(bar);
  }

  // The lighthouse on Kite Rock: white tower, red bands, a lit lamp.
  const lh = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.1, 17, 10),
    new THREE.MeshLambertMaterial({ color: 0xfff7ea }));
  tower.position.y = 8.5;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.85, 3.4, 10),
    new THREE.MeshLambertMaterial({ color: PALETTE.houseRoof }));
  band.position.y = 11;
  const lampRoom = new THREE.Mesh(new THREE.SphereGeometry(1.9, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe259 }));
  lampRoom.position.y = 18.4;
  lh.add(tower, band, lampRoom);
  lh.position.set(300, 13, -450);
  scene.add(lh);

  // Clouds: soft flattened clusters drifting very slowly — the sky moves.
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffd9c9, transparent: true, opacity: 0.88 });
  const clouds = [];
  for (let i = 0; i < 16; i += 1) {
    const g = new THREE.Group();
    const n = 3 + Math.floor(rand() * 3);
    for (let j = 0; j < n; j += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(9 + rand() * 13, 8, 6), cloudMat);
      puff.scale.y = 0.42;
      puff.position.set(j * 13 - n * 6 + rand() * 5, rand() * 3, rand() * 8 - 4);
      g.add(puff);
    }
    g.position.set((rand() - 0.5) * 1500, 130 + rand() * 90, 500 - rand() * 2400);
    scene.add(g);
    clouds.push({ group: g, speed: 0.6 + rand() * 0.9 });
  }

  // Gate rings live here visually; missions.js owns their state and colours.
  const rings = [];
  const crates = [];
  const ringGeo = new THREE.TorusGeometry(11, 0.85, 10, 28);
  for (const gate of GATES) {
    const mat = new THREE.MeshBasicMaterial({ color: PALETTE.ringLater });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.set(gate.x, gate.y, gate.z);
    scene.add(ring);
    rings.push(ring);
    if (gate.cargo) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.4, 3.4),
        new THREE.MeshLambertMaterial({ color: 0xb5762e, emissive: 0x331a00 }));
      crate.position.set(gate.x, gate.y - 3, gate.z);
      scene.add(crate);
      crates.push(crate);
    }
  }

  return {
    rings, crates,
    update(dt, t) {
      for (const cloud of clouds) {
        cloud.group.position.x += cloud.speed * dt;
        if (cloud.group.position.x > 850) cloud.group.position.x = -850;
      }
      sunPath.material.opacity = 0.13 + Math.sin(t * 0.7) * 0.04;
    },
  };
}
