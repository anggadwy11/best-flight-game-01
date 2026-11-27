// The rescue jet: a low-poly fighter built from raw geometry — pointed
// nose, bubble canopy, swept delta wings, twin canted tails, side
// intakes and twin nozzles with an afterburner glow. No external model:
// the silhouette has to read "fighter jet" in a 180 px thumbnail, so
// every part is one bold shape, and the coast-guard orange trim keeps
// it ours. Flight mechanics live in flight.js and never see this file;
// posePlane only needs { group, prop } back (prop = the burner group,
// spun harmlessly around its own axis by the legacy prop hook).
import * as THREE from 'three';
import { PALETTE } from './config.js';

/** Flat wing planform from (span, chord) points, extruded thin. */
function planform(points, thickness, material) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // shape plane (x=span, y=chord) -> XZ, nose = -z
  const mesh = new THREE.Mesh(geo, material);
  return mesh;
}

export function buildJet() {
  const group = new THREE.Group();
  const hull = new THREE.MeshLambertMaterial({ color: 0x74828f });
  const wingMat = new THREE.MeshLambertMaterial({ color: 0x596673 });
  const trim = new THREE.MeshLambertMaterial({ color: PALETTE.planeTrim });
  const dark = new THREE.MeshLambertMaterial({ color: 0x232b33 });
  const glass = new THREE.MeshLambertMaterial({ color: 0x12242f, emissive: 0x0d3040 });

  // Fuselage: a long tapered body, nose forward (-z).
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.8, 8.2, 10), hull);
  body.rotation.x = Math.PI / 2;
  body.scale.y = 1; body.scale.x = 0.92;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.4, 10), hull);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -5.3;
  group.add(nose);
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 5.6), wingMat);
  spine.position.set(0, 0.62, 0.6);
  group.add(spine);

  // Bubble canopy.
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 9), glass);
  canopy.scale.set(0.82, 0.62, 1.9);
  canopy.position.set(0, 0.62, -1.7);
  group.add(canopy);

  // Swept delta wings + orange tips.
  const wingPoints = [[0.3, -1.4], [5.0, 1.6], [5.0, 2.5], [0.4, 2.4]];
  const wingR = planform(wingPoints, 0.15, wingMat);
  wingR.position.y = -0.05;
  group.add(wingR);
  const wingL = planform(wingPoints, 0.15, wingMat);
  wingL.scale.x = -1;
  wingL.position.y = -0.05;
  group.add(wingL);
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.17, 0.95), trim);
    tip.position.set(side * 4.95, -0.02, 2.05);
    group.add(tip);
  }

  // Twin canted vertical tails with orange caps: swept-back fins,
  // leaned outward — the twin-tail read is unmistakable in silhouette.
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.65, 1.15), wingMat);
    fin.position.set(side * 0.92, 1.05, 3.35);
    fin.rotation.x = -0.32;               // swept back
    fin.rotation.z = side * -0.24;        // canted outward
    group.add(fin);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.36, 0.62), trim);
    cap.position.set(side * 1.13, 1.82, 3.62);
    cap.rotation.x = -0.32;
    cap.rotation.z = side * -0.24;
    group.add(cap);
  }

  // Stabilators at the tail.
  const stabPoints = [[0.2, 0.1], [2.3, 0.75], [2.3, 1.25], [0.3, 0.95]];
  const stabR = planform(stabPoints, 0.11, wingMat);
  stabR.position.set(0, 0.05, 3.1);
  group.add(stabR);
  const stabL = planform(stabPoints, 0.11, wingMat);
  stabL.scale.x = -1;
  stabL.position.set(0, 0.05, 3.1);
  group.add(stabL);

  // Side intakes: dark boxes with black faces, slung under the wing roots.
  for (const side of [-1, 1]) {
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 2.6), dark);
    intake.position.set(side * 0.88, -0.38, 0.5);
    group.add(intake);
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.62, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x05080a }));
    face.position.set(side * 0.88, -0.38, -0.82);
    group.add(face);
  }

  // Twin nozzles + afterburner (the "prop" posePlane spins: a cone on
  // its own axis, so the spin reads as shimmer, not motion).
  const burner = new THREE.Group();
  for (const side of [-1, 1]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.7, 10), dark);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * 0.36, 0.05, 4.35);
    group.add(nozzle);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.52, 2.6, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xff9a3c, transparent: true, opacity: 0.34,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
  flame.rotation.x = Math.PI / 2;
  flame.position.z = 1.6;
  burner.add(flame);
  burner.position.set(0, 0.05, 4.6);
  group.add(burner);

  // Navigation lights on the wingtips.
  const lightGeo = new THREE.SphereGeometry(0.15, 6, 6);
  const leftLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xff4444 }));
  leftLight.position.set(-5.2, 0, 2.05);
  const rightLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0x44ff88 }));
  rightLight.position.set(5.2, 0, 2.05);
  group.add(leftLight, rightLight);

  // The rescue searchlight stays: a cone of warm light under the nose.
  const beam = new THREE.Mesh(new THREE.ConeGeometry(3.4, 20, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffd9a0, transparent: true, opacity: 0.085,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
  beam.rotation.x = Math.PI / 2 + 0.62;
  beam.position.set(0, -4.2, -10.5);
  group.add(beam);

  return { group, prop: burner };
}
