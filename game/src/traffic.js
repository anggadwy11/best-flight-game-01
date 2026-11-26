// Traffic: the sky is not empty. Two other aeroplanes fly slow circuits and
// three balloons drift over the cays — they are scenery, hazards, and the
// radio ticker's favourite subject. Nothing here is synchronised: each craft
// keeps its own phase so the sky never moves in lockstep.
import * as THREE from 'three';
import { PALETTE } from './config.js';
import { buildPlane } from './flight.js';

export function buildTraffic(scene) {
  const craft = [];

  const circuits = [
    { cx: -120, cz: -420, r: 150, y: 105, speed: 0.055, phase: 0.6 },
    { cx: 190, cz: -880, r: 170, y: 88, speed: -0.045, phase: 3.4 },
  ];
  for (const c of circuits) {
    const parts = buildPlane();
    parts.group.scale.setScalar(0.92);
    scene.add(parts.group);
    craft.push({ kind: 'plane', parts, ...c, x: 0, y: c.y, z: 0 });
  }

  const balloonCols = [PALETTE.balloonA, PALETTE.balloonB, PALETTE.balloonC];
  const spots = [
    { x: -60, y: 96, z: -640, drift: 1.1 },
    { x: 90, y: 110, z: -1010, drift: -0.8 },
    { x: -190, y: 88, z: -260, drift: 0.7 },
  ];
  spots.forEach((s, i) => {
    const g = new THREE.Group();
    const envelope = new THREE.Mesh(new THREE.SphereGeometry(7.5, 12, 10),
      new THREE.MeshLambertMaterial({ color: balloonCols[i] }));
    envelope.scale.y = 1.18;
    const basket = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2, 2.4),
      new THREE.MeshLambertMaterial({ color: 0x8a5a3b }));
    basket.position.y = -10.5;
    g.add(envelope, basket);
    g.position.set(s.x, s.y, s.z);
    scene.add(g);
    craft.push({ kind: 'balloon', group: g, baseX: s.x, y: s.y, z: s.z, drift: s.drift, phase: i * 2.1, x: s.x });
  });

  return {
    craft,
    update(t) {
      for (const c of craft) {
        if (c.kind === 'plane') {
          const a = c.phase + t * c.speed;
          c.x = c.cx + Math.cos(a) * c.r;
          c.z = c.cz + Math.sin(a) * c.r;
          const heading = Math.atan2(Math.cos(a) * Math.sign(c.speed), Math.sin(a) * Math.sign(c.speed));
          c.parts.group.position.set(c.x, c.y + Math.sin(t * 0.5 + c.phase) * 2, c.z);
          c.parts.group.rotation.y = -heading + (c.speed > 0 ? 0 : Math.PI);
          c.parts.prop.rotation.z = t * 30;
        } else {
          c.x = c.baseX + Math.sin(t * 0.05 * c.drift + c.phase) * 26;
          c.group.position.set(c.x, c.y + Math.sin(t * 0.3 + c.phase) * 3, c.z);
        }
      }
    },
    /** Distance from a point to the nearest craft, for near-miss warnings. */
    nearestDistance(x, y, z) {
      let best = Infinity;
      for (const c of craft) {
        const cy = c.kind === 'plane' ? c.y : c.y;
        const d = Math.hypot(c.x - x, cy - y, c.z - z);
        if (d < best) best = d;
      }
      return best;
    },
  };
}
