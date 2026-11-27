// The storm itself: rain near the camera, lightning, and the gust field.
// Kept in its own module so the weather can be simplified or switched off
// at the last minute without touching the flight model or the rescue.
// Rain is a thin shell of streaks around the camera — never a grey sheet
// across the whole screen — and fog has a hard floor so 2–3 islands stay
// readable at all times. Lightning is one directional flash: for a frame
        // or two the whole world is lit hard from the warm gap, throwing long
// dramatic shadows, then it is gone.
import * as THREE from 'three';


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

const RAIN_COUNT = 850;
const RAIN_BOX = { x: 90, y: 55, z: 90 };

export function createStorm(scene) {
  // --- rain: points falling fast inside a box that follows the camera ---
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(RAIN_COUNT * 3);
  for (let i = 0; i < RAIN_COUNT; i += 1) {
    rainPos[i * 3] = (Math.random() - 0.5) * RAIN_BOX.x;
    rainPos[i * 3 + 1] = Math.random() * RAIN_BOX.y;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * RAIN_BOX.z;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({
    color: 0xaec6d8, size: 1.9, map: dotTexture(), transparent: true, opacity: 0.5,
    sizeAttenuation: true, depthWrite: false, fog: false,
  }));
  rain.frustumCulled = false;
  scene.add(rain);

  // --- lightning: a hard directional flash + a brief ambient lift ---
  const bolt = new THREE.DirectionalLight(0xdfe8ff, 0);
  bolt.position.set(-160, 300, -500);
  scene.add(bolt);
  const ambient = new THREE.AmbientLight(0xbdd0e8, 0);
  scene.add(ambient);

  let flash = 0;              // 0..1, decays fast
  let nextStrike = 5 + Math.random() * 7;
  let clock = 0;

  /** Deterministic strike for staged screenshots. */
  function strike() { flash = 1; }

  /**
   * The gust field at time t for a given storm intensity (0..1).
   * Returns a sideways shove and a turbulence amount; both grow as the
   * squall builds, and the shove swings slowly like real squall gusts.
   */
  function gustAt(t, intensity) {
    const swing = Math.sin(t * 0.35) + Math.sin(t * 0.13 + 1.7) * 0.6;
    const strength = intensity * (5.5 + Math.max(0, Math.sin(t * 0.9)) * 4.5);
    return {
      x: swing * strength * 0.4,
      z: strength * 0.22,
      turb: intensity * (0.35 + Math.max(0, Math.sin(t * 1.7 + 0.6)) * 0.5),
    };
  }

  function update(dt, t, cameraPos, intensity) {
    clock += dt;
    // Rain falls and wraps inside its box around the camera.
    const arr = rainGeo.attributes.position.array;
    const fall = 62 * dt;
    const drift = -9 * dt * (0.4 + intensity);
    for (let i = 0; i < RAIN_COUNT; i += 1) {
      arr[i * 3 + 1] -= fall;
      arr[i * 3] += drift;
      if (arr[i * 3 + 1] < -RAIN_BOX.y / 2) arr[i * 3 + 1] += RAIN_BOX.y;
      if (arr[i * 3] < -RAIN_BOX.x / 2) arr[i * 3] += RAIN_BOX.x;
    }
    rainGeo.attributes.position.needsUpdate = true;
    rain.position.set(cameraPos.x, cameraPos.y + 8, cameraPos.z);
    rain.material.opacity = 0.28 + intensity * 0.3;

    // Lightning schedule: random strikes, double-blink decay.
    nextStrike -= dt;
    if (nextStrike <= 0) {
      flash = 1;
      nextStrike = 6 + Math.random() * 9 - intensity * 3;
    }
    if (flash > 0) {
      flash = Math.max(0, flash - dt * 5.5);
      const blink = flash * (0.75 + 0.25 * Math.sin(clock * 90));
      bolt.intensity = blink * 2.6;
      ambient.intensity = blink * 0.55;
    } else {
      bolt.intensity = 0;
      ambient.intensity = 0;
    }
    // Visibility floor: fog thickens with the storm but never closes in
    // past the point where the next two islands vanish.
    scene.fog.far = 1180 - intensity * 260;
    scene.fog.near = 190 - intensity * 60;
  }

  return { update, gustAt, strike, flashLevel: () => flash };
}
