// The storm world: a heaving sea, dark islands, three listing fishing
// boats, the lighthouse, and the Coral Run strip with PAPI lights and a
// windsock. The sky is a slate storm dome torn open at the horizon by one
// warm sodium gap — the backlight every silhouette in the game plays
// against. Waves are real vertex motion; boats ride the same wave field,
// so a hover over a boat means riding the swell with it.
import * as THREE from 'three';
import { BOATS, ISLANDS, PALETTE, RUNWAY } from './config.js';
import { createRandom } from './random.js';

/** Wave height of the shared swell field — boats and spray agree with it. */
export function waveHeight(x, z, t) {
  return Math.sin(x * 0.045 + t * 1.15) * 0.85
    + Math.sin(z * 0.06 - t * 0.85 + x * 0.012) * 0.7;
}

function skyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#141a24');
  grad.addColorStop(0.4, '#2c3646');
  grad.addColorStop(0.68, '#46525f');
  grad.addColorStop(0.83, '#5f5648');
  grad.addColorStop(0.9, '#ff9a4d');   // the warm gap: a narrow band, low
  grad.addColorStop(0.94, '#ffc98a');
  grad.addColorStop(1, '#4c5866');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(canvas);
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,170,80,0.85)');
  grad.addColorStop(0.4, 'rgba(255,140,60,0.32)');
  grad.addColorStop(1, 'rgba(255,120,50,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export function buildWorld(scene) {
  scene.fog = new THREE.Fog(PALETTE.fog, 190, 1180);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1700, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }));
  scene.add(sky);

  // The warm gap: a low glow on the horizon ahead, behind the storm wall.
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), transparent: true, opacity: 0.8, fog: false, depthWrite: false,
  }));
  glow.scale.set(300, 105, 1);
  glow.position.set(60, 40, -1580);
  scene.add(glow);
  const gapCore = new THREE.Mesh(new THREE.CircleGeometry(34, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: false }));
  gapCore.position.set(60, 34, -1600);
  gapCore.lookAt(0, 60, 0);
  scene.add(gapCore);

  const hemi = new THREE.HemisphereLight(0x8fa3b8, 0x1a2230, 0.75);
  scene.add(hemi);
  const keyLight = new THREE.DirectionalLight(PALETTE.sun, 1.35);
  keyLight.position.set(40, 90, -500);   // low, ahead: long shadows toward camera
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0x54626f, 0.5));

  // --- the sea: a vertex-animated swell sheet ---
  const seaGeo = new THREE.PlaneGeometry(3400, 3400, 60, 60);
  seaGeo.rotateX(-Math.PI / 2);
  const seaBase = seaGeo.attributes.position.array.slice();
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshLambertMaterial({ color: PALETTE.sea }));
  scene.add(sea);
  // The warm path: the gap's light smeared on the water toward the camera.
  const sunPath = new THREE.Mesh(new THREE.PlaneGeometry(150, 3000),
    new THREE.MeshBasicMaterial({ color: 0xff9a4d, transparent: true, opacity: 0.13, depthWrite: false }));
  sunPath.rotation.x = -Math.PI / 2;
  sunPath.position.set(60, 0.35, -700);
  scene.add(sunPath);

  const rand = createRandom(20261127);
  const sandMat = new THREE.MeshLambertMaterial({ color: PALETTE.sand });
  const grassMat = new THREE.MeshLambertMaterial({ color: PALETTE.grass });
  const grassDark = new THREE.MeshLambertMaterial({ color: PALETTE.grassDark });
  const trunkMat = new THREE.MeshLambertMaterial({ color: PALETTE.palmTrunk });
  const leafMat = new THREE.MeshLambertMaterial({ color: PALETTE.palmLeaf });
  const wallMat = new THREE.MeshLambertMaterial({ color: PALETTE.houseWall });
  const roofMat = new THREE.MeshLambertMaterial({ color: PALETTE.houseRoof });
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xdfe9ec, transparent: true, opacity: 0.32, depthWrite: false });

  function palm(x, y, z, s, lean) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.34 * s, 5.2 * s, 6), trunkMat);
    trunk.position.y = 2.6 * s;
    trunk.rotation.z = 0.12 + lean;
    g.add(trunk);
    for (let i = 0; i < 5; i += 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5 * s, 3.6 * s, 5), leafMat);
      const a = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 1.1 * s, 5.4 * s, Math.sin(a) * 1.1 * s);
      leaf.rotation.set(Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15 + lean);
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
    // One warm lit window per house: the islands are inhabited, riding it out.
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.1),
      new THREE.MeshBasicMaterial({ color: 0xffc36b }));
    win.position.set(1.6, 2.1, 3.02);
    g.add(base, roof, win);
    g.position.set(x, y, z);
    g.rotation.y = rot;
    scene.add(g);
  }

  for (const island of ISLANDS) {
    const top = island.runway ? RUNWAY.deckY : island.h;
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(island.r * 0.74, island.r, top + 2, 26),
      island.runway ? grassDark : grassMat);
    hill.position.set(island.x, (top + 2) / 2 - 2, island.z);
    scene.add(hill);
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(island.r * 0.99, island.r * 1.05, 1.3, 26), sandMat);
    beach.position.set(island.x, 0.4, island.z);
    scene.add(beach);
    const foam = new THREE.Mesh(new THREE.RingGeometry(island.r * 1.04, island.r * 1.22, 30), foamMat);
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(island.x, 0.55, island.z);
    scene.add(foam);
    const palms = island.runway ? 5 : 8;
    for (let i = 0; i < palms; i += 1) {
      const a = rand() * Math.PI * 2;
      const rr = island.r * (0.3 + rand() * 0.32);
      const px = island.x + Math.cos(a) * rr;
      const pz = island.z + Math.sin(a) * rr;
      if (island.runway && Math.abs(px - RUNWAY.x) < 30) continue;
      palm(px, top - 0.5, pz, 0.9 + rand() * 0.5, 0.22);   // all bent by the wind
    }
    if (!island.runway && island.r >= 70) {
      house(island.x + island.r * 0.28, top - 0.4, island.z + island.r * 0.18, rand() * 2);
      house(island.x - island.r * 0.3, top - 0.4, island.z - island.r * 0.22, rand() * 2);
    }
  }

  // --- Coral Run strip: wet deck, warm edge lamps, PAPI, windsock ---
  const strip = new THREE.Mesh(new THREE.BoxGeometry(RUNWAY.halfWidth * 2, 1.2, RUNWAY.halfLength * 2),
    new THREE.MeshPhongMaterial({ color: PALETTE.runway, shininess: 120, specular: 0x8a97a5, emissive: 0x141821 }));
  strip.position.set(RUNWAY.x, RUNWAY.deckY - 0.4, RUNWAY.z);
  scene.add(strip);
  const lineMat = new THREE.MeshBasicMaterial({ color: PALETTE.runwayLine });
  for (let i = -4; i <= 4; i += 1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 9), lineMat);
    dash.position.set(RUNWAY.x, RUNWAY.deckY + 0.25, RUNWAY.z + i * 24);
    scene.add(dash);
  }
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffc36b });
  const lampGeo = new THREE.SphereGeometry(0.55, 6, 6);
  for (let i = 0; i <= 10; i += 1) {
    for (const side of [-1, 1]) {
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(RUNWAY.x + side * (RUNWAY.halfWidth + 2.5), RUNWAY.deckY + 1,
        RUNWAY.z - RUNWAY.halfLength + i * (RUNWAY.halfLength * 2 / 10));
      scene.add(lamp);
    }
  }
  for (let i = 0; i < 4; i += 1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 7), lineMat);
    bar.position.set(RUNWAY.x - 9 + i * 6, RUNWAY.deckY + 0.25, RUNWAY.z + RUNWAY.halfLength - 8);
    scene.add(bar);
  }
  // PAPI: four boxes left of the threshold — white over red on glide path.
  const papiWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const papiRed = new THREE.MeshBasicMaterial({ color: 0xff3524 });
  const papiBox = new THREE.BoxGeometry(1.1, 0.8, 0.8);
  for (let i = 0; i < 4; i += 1) {
    const lamp = new THREE.Mesh(papiBox, i < 2 ? papiWhite : papiRed);
    lamp.position.set(RUNWAY.x - RUNWAY.halfWidth - 4.5, RUNWAY.deckY + 0.8,
      RUNWAY.z + RUNWAY.halfLength - 14 - i * 2.2);
    scene.add(lamp);
  }
  // Approach rabbit lights: warm flashers running from the water to the
  // threshold — in the murk they are what a pilot actually flies toward.
  for (let i = 0; i < 5; i += 1) {
    const orb = new THREE.Mesh(lampGeo, lampMat);
    orb.scale.setScalar(1.5);
    orb.position.set(RUNWAY.x, RUNWAY.deckY + 1.2, RUNWAY.z + RUNWAY.halfLength + 26 + i * 24);
    scene.add(orb);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, RUNWAY.deckY, 5),
      new THREE.MeshLambertMaterial({ color: 0x39434f }));
    post.position.set(RUNWAY.x, RUNWAY.deckY / 2, RUNWAY.z + RUNWAY.halfLength + 26 + i * 24);
    scene.add(post);
  }
  // Windsock: pole + orange cone, swinging with the gust field.
  const sock = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 9, 6),
    new THREE.MeshLambertMaterial({ color: 0x9aa4ae }));
  pole.position.y = 4.5;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.05, 4.6, 8),
    new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
  cone.rotation.z = Math.PI / 2;
  cone.position.set(2.3, 8.6, 0);
  sock.add(pole, cone);
  sock.position.set(RUNWAY.x - RUNWAY.halfWidth - 9, RUNWAY.deckY, RUNWAY.z + RUNWAY.halfLength - 30);
  scene.add(sock);

  // The lighthouse on Kite Rock: in a storm it earns its keep.
  const lh = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.1, 17, 10),
    new THREE.MeshLambertMaterial({ color: 0xe8e4da }));
  tower.position.y = 8.5;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.85, 3.4, 10),
    new THREE.MeshLambertMaterial({ color: PALETTE.houseRoof }));
  band.position.y = 11;
  const lampRoom = new THREE.Mesh(new THREE.SphereGeometry(1.9, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffc36b }));
  lampRoom.position.y = 18.4;
  lh.add(tower, band, lampRoom);
  lh.position.set(300, 13, -450);
  scene.add(lh);

  // --- the three fishing boats: listing hulls, masts, crews on deck ---
  const hullMat = new THREE.MeshLambertMaterial({ color: 0x527282 });
  const hullTrim = new THREE.MeshLambertMaterial({ color: 0xc75146 });
  const cabinMat = new THREE.MeshLambertMaterial({ color: 0xd8dde0 });
  const crewMat = new THREE.MeshLambertMaterial({ color: 0x14181f });
  const crewHiVis = new THREE.MeshLambertMaterial({ color: 0xffb03a, emissive: 0x442200 });
  const boats = [];
  for (const spec of BOATS) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 1.5, 13, 8), hullMat);
    hull.rotation.x = Math.PI / 2;
    hull.scale.x = 1.5;
    hull.position.y = 0.6;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.5, 12.4), hullTrim);
    rail.position.y = 1.6;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 3.6), cabinMat);
    cabin.position.set(0, 2.6, 1.8);
    const cabinLight = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xffc36b }));
    cabinLight.position.set(0, 2.7, 3.62);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 9, 5), crewMat);
    mast.position.set(0, 5.5, -2.6);
    g.add(hull, rail, cabin, cabinLight, mast);
    for (let i = 0; i < spec.crew; i += 1) {
      const figure = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.85, 2, 6),
        i === 0 ? crewHiVis : crewMat);
      figure.position.set(-1.1 + i * 1.1, 2.6, -3.4 + (i % 2) * 1.4);
      g.add(figure);
    }
    const collar = new THREE.Mesh(new THREE.RingGeometry(7.5, 10.5, 22), foamMat);
    collar.rotation.x = -Math.PI / 2;
    collar.position.y = 0.4;
    g.add(collar);
    g.scale.setScalar(1.35);
    g.position.set(spec.x, 0, spec.z);
    g.rotation.y = spec.x * 0.01;
    scene.add(g);
    boats.push({ group: g, spec });
  }

  // --- clouds: low scud + the storm wall standing across the horizon ---
  const scudMat = new THREE.MeshBasicMaterial({ color: 0x39434f, transparent: true, opacity: 0.92 });
  const stormWallMat = new THREE.MeshBasicMaterial({ color: 0x232b38, transparent: true, opacity: 0.97, fog: false });
  const clouds = [];
  for (let i = 0; i < 12; i += 1) {
    const g = new THREE.Group();
    const n = 3 + Math.floor(rand() * 3);
    for (let j = 0; j < n; j += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(10 + rand() * 14, 8, 6), scudMat);
      puff.scale.y = 0.4;
      puff.position.set(j * 14 - n * 7 + rand() * 5, rand() * 3, rand() * 8 - 4);
      g.add(puff);
    }
    g.position.set((rand() - 0.5) * 1500, 120 + rand() * 70, -250 - rand() * 1600);
    scene.add(g);
    clouds.push({ group: g, speed: 3.2 + rand() * 2.2 });
  }
  const wall = new THREE.Group();
  for (let i = 0; i < 11; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(95 + rand() * 70, 10, 8), stormWallMat);
    puff.scale.y = 0.5;
    puff.position.set(-950 + i * 185 + rand() * 40, 74 + rand() * 40, -1300 - rand() * 140);
    wall.add(puff);
  }
  scene.add(wall);

  return {
    boats,
    update(dt, t) {
      // Heave the sea on the shared swell field.
      const pos = seaGeo.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        const x = seaBase[i * 3];
        const z = seaBase[i * 3 + 2];
        pos.array[i * 3 + 1] = waveHeight(x, z, t);
      }
      pos.needsUpdate = true;   // normals stay put: the swell reads in the
      // silhouette and the foam, and skipping per-frame normals keeps the
      // frame cheap on weak machines.
      sunPath.material.opacity = 0.1 + Math.sin(t * 0.9) * 0.035;
      // Boats ride the same swell, rolling a little harder than the water.
      for (const b of boats) {
        const h = waveHeight(b.spec.x, b.spec.z, t);
        b.group.position.y = h * 0.82 - 0.2;
        b.group.rotation.z = b.spec.list + Math.sin(t * 0.9 + b.spec.x) * 0.045;
        b.group.rotation.x = Math.sin(t * 0.7 + b.spec.z) * 0.03;
      }
      for (const cloud of clouds) {
        cloud.group.position.x += cloud.speed * dt * 3;
        if (cloud.group.position.x > 900) cloud.group.position.x = -900;
      }
      sock.rotation.y = Math.sin(t * 0.4) * 0.5 + Math.sin(t * 1.7) * 0.12;
      cone.rotation.y = Math.sin(t * 2.3) * 0.2;
    },
  };
}
