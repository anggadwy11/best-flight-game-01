// The sortie itself: twelve gates in three stages, then the landing.
// Stage 1 threads six golden gates, stage 2 lifts three cargo crates at
// Palm Cay (fly the ring, the crate is yours), stage 3 runs the last gates
// and puts the strip ahead of you. Scoring rewards clean, fast flying:
// a gate is worth more the faster and more centred the pass.
import { GATES, PALETTE, RUNWAY } from './config.js';

export const STAGES = [
  { name: 'GOLDEN GATES', goal: 'Fly the gold ring', first: 0, last: 5 },
  { name: 'PALM CAY CARGO', goal: 'Lift the cargo crate', first: 6, last: 8 },
  { name: 'THE RUN HOME', goal: 'Fly the gold ring', first: 9, last: 11 },
];

export function createMission(rings, crates) {
  const state = {
    gateIndex: 0,        // the gate the pilot must fly next
    cargo: 0,
    gatesPassed: 0,
    banner: '', bannerT: 0,
    finished: false,     // all gates done: only the landing remains
    nearMissT: 0,
  };

  function reset() {
    state.gateIndex = 0;
    state.cargo = 0;
    state.gatesPassed = 0;
    state.banner = '';
    state.bannerT = 0;
    state.finished = false;
    paintRings(0);
    for (const crate of crates) crate.visible = true;
  }

  function paintRings(t) {
    rings.forEach((ring, i) => {
      const mat = ring.material;
      if (i < state.gateIndex) { mat.color.setHex(PALETTE.ringDone); }
      else if (i === state.gateIndex) {
        mat.color.setHex(PALETTE.ringNext);
        const pulse = 1 + Math.sin(t * 5) * 0.045;
        ring.scale.setScalar(pulse);
        return;
      } else { mat.color.setHex(PALETTE.ringLater); }
      ring.scale.setScalar(1);
    });
  }

  function stage() {
    if (state.finished) return null;
    return STAGES.find((s) => state.gateIndex >= s.first && state.gateIndex <= s.last) ?? null;
  }

  function stageNumber() {
    const s = stage();
    return s ? STAGES.indexOf(s) + 1 : 3;
  }

  function target() {
    if (state.finished) return { x: RUNWAY.x, y: RUNWAY.deckY + 4, z: RUNWAY.z + RUNWAY.halfLength - 20, label: 'Coral Run strip' };
    const g = GATES[state.gateIndex];
    return { x: g.x, y: g.y, z: g.z, label: g.label };
  }

  /**
   * Check the plane against the current gate. A pass is crossing the ring's
   * plane within its radius; prevZ/now positions make it frame-proof.
   */
  function step(flight, prev, t) {
    paintRings(t);
    if (state.bannerT > 0) state.bannerT -= 1 / 60;
    if (state.finished) return null;
    const gate = GATES[state.gateIndex];
    const dx = flight.x - gate.x;
    const dy = flight.y - gate.y;
    const dz = flight.z - gate.z;
    const dist = Math.hypot(dx, dy, dz);
    const crossed = (prev.z - gate.z) * (flight.z - gate.z) <= 0
      && Math.abs(flight.z - gate.z) < Math.max(6, flight.speed * 0.09);
    if (crossed && Math.hypot(dx, dy) < 11.5) {
      const centred = 1 - Math.hypot(dx, dy) / 11.5;
      const points = 100 + Math.round(centred * 100) + Math.round(flight.speed);
      state.gatesPassed += 1;
      if (gate.cargo) {
        state.cargo += 1;
        const crate = crates[state.cargo - 1];
        if (crate) crate.visible = false;
        state.banner = `CARGO ${state.cargo} / 3 ABOARD  +${points}`;
      } else {
        state.banner = `${gate.label.toUpperCase()}  +${points}`;
      }
      state.bannerT = 1.6;
      state.gateIndex += 1;
      if (state.gateIndex >= GATES.length) {
        state.finished = true;
        state.banner = 'ALL GATES FLOWN — LAND ON CORAL RUN';
        state.bannerT = 2.6;
      }
      return { points, gate };
    }
    // Flying far past a gate without crossing it: it stays lit, the pilot
    // must come back — the distance readout in the HUD says by how much.
    return null;
  }

  return { state, reset, step, stage, stageNumber, target, crates, paint: paintRings };
}
