// Procedural canvas textures, seeded and deterministic — the same world
// renders identically on every machine, so the screenshots are stable.
// Each texture is a near-neutral speckle field meant to be multiplied
// over a material's flat colour: it kills the "flat CG surface" read at
// close range without adding a single external file or breaking the
// low-poly style. Generated once at build time from the game's own
// seeded random source.
import * as THREE from 'three';
import { createRandom } from './random.js';

function speckleTexture(seed, flecks, tones, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = tones[0];
  ctx.fillRect(0, 0, size, size);
  const rand = createRandom(seed);
  for (let i = 0; i < flecks; i += 1) {
    ctx.fillStyle = tones[1 + Math.floor(rand() * (tones.length - 1))];
    const w = 1 + rand() * 3;
    ctx.fillRect(rand() * size, rand() * size, w, w * (0.5 + rand()));
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Wet asphalt: dark base, pale grit, a few lighter wet streaks. */
export function asphaltTexture() {
  const tex = speckleTexture(7101, 2600, ['#e8e8e8', '#b9bec6', '#8f959e', '#d5d8dc']);
  tex.repeat.set(1, 7);
  return tex;
}

/** Sea surface: gentle light chop over the flat colour. */
export function seaTexture() {
  const tex = speckleTexture(7202, 1500, ['#f2f5f6', '#cfd9dc', '#aebfc4']);
  tex.repeat.set(26, 26);
  return tex;
}

/** Storm-beaten grass: dark moss speckle. */
export function grassTexture() {
  const tex = speckleTexture(7303, 1900, ['#eef2ee', '#c3d2c6', '#9db3a4']);
  tex.repeat.set(7, 7);
  return tex;
}

/** Wet sand: fine pale grain. */
export function sandTexture() {
  const tex = speckleTexture(7404, 1700, ['#f4f1ea', '#ddd6c6', '#c6bda6']);
  tex.repeat.set(6, 6);
  return tex;
}

/** Boat hull planking: horizontal weathered boards. */
export function hullTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const rand = createRandom(7505);
  const boards = ['#e6e9ea', '#cfd6d8', '#bcc6c9', '#dde2e3'];
  for (let y = 0; y < 128; y += 16) {
    ctx.fillStyle = boards[Math.floor(rand() * boards.length)];
    ctx.fillRect(0, y, 128, 16);
    ctx.fillStyle = 'rgba(40,48,54,0.55)';
    ctx.fillRect(0, y, 128, 2);
    for (let i = 0; i < 26; i += 1) {
      ctx.fillStyle = 'rgba(70,82,90,0.35)';
      ctx.fillRect(rand() * 128, y + 3 + rand() * 11, 1 + rand() * 5, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
