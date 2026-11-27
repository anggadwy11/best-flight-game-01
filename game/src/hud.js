// The instrument panel: DOM gauges over the 3D view, plus a 2D minimap.
// Every readout answers one pilot question — how fast, how high, which way,
// how much fuel, what next and how far — and text is rebuilt only when the
// number it shows actually changes.
import { BOATS, ISLANDS, RUNWAY } from './config.js';

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function el(id) { return document.getElementById(id); }

function cached(node, format) {
  let last = null;
  return (value) => {
    const text = format(value);
    if (text !== last) { last = text; node.textContent = text; }
  };
}

function fmtClock(timeLeft, sortieSeconds) {
  const flown = sortieSeconds - timeLeft;
  const minutes = 17 * 60 + 48 + Math.floor(flown * (100 / sortieSeconds));
  const hh = Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function fmtLeft(timeLeft) {
  const s = Math.max(0, Math.ceil(timeLeft));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createHud(best) {
  const setSpeed = cached(el('speed'), (v) => String(Math.round(v * 1.94)));
  const setAlt = cached(el('alt'), (v) => String(Math.max(0, Math.round(v * 3.28))));
  const setVs = cached(el('vs'), (v) => (v >= 0 ? '+' : '') + Math.round(v * 3.28));
  const setThr = cached(el('thr'), (v) => String(Math.round(v * 100)));
  const setHull = cached(el('hull'), (v) => String(Math.max(0, Math.round(v))));
  const setScore = cached(el('score'), (v) => v.toLocaleString('en-US'));
  const setBest = cached(el('best'), (v) => v.toLocaleString('en-US'));
  const setFuelPct = cached(el('fuelpct'), (v) => `${Math.round(v)}%`);
  const setClock = cached(el('clock'), (v) => v);
  const setLeft = cached(el('timeleft'), (v) => v);
  const setHdg = cached(el('hdg'), (v) => v);
  const setStorm = cached(el('stormpct'), (v) => v);
  const setStage = cached(el('m-stage'), (v) => v);
  const setGoal = cached(el('m-goal'), (v) => v);
  const setDist = cached(el('m-dist'), (v) => v);
  const fuelFill = el('fuelFill');
  const bannerNode = el('banner');
  const map = el('minimap').getContext('2d');
  let lastFuelWidth = -1;
  let lastBanner = null;

  setBest(best);

  function drawMap(flight, target) {
    const W = 168; const H = 128;
    const sx = (x) => W / 2 + x * 0.055;
    const sz = (z) => H / 2 + (z + 520) * 0.038;
    map.clearRect(0, 0, W, H);
    map.fillStyle = '#27383f';
    map.fillRect(0, 0, W, H);
    map.fillStyle = '#527a5e';
    for (const island of ISLANDS) {
      map.beginPath();
      map.arc(sx(island.x), sz(island.z), Math.max(4, island.r * 0.07), 0, Math.PI * 2);
      map.fill();
    }
    map.fillStyle = '#ff2a1e';
    for (const boat of BOATS) map.fillRect(sx(boat.x) - 2.5, sz(boat.z) - 2.5, 5, 5);
    map.fillStyle = '#fff7ea';
    map.fillRect(sx(RUNWAY.x) - 5, sz(RUNWAY.z) - 1.5, 10, 3);
    if (target) {
      map.strokeStyle = '#2fd4b6';
      map.lineWidth = 2;
      map.beginPath();
      map.arc(sx(target.x), sz(target.z), 6, 0, Math.PI * 2);
      map.stroke();
    }
    // The plane: a small triangle pointing where the nose points.
    map.save();
    map.translate(sx(flight.x), sz(flight.z));
    map.rotate(flight.heading);
    map.fillStyle = '#ff5e8a';
    map.beginPath();
    map.moveTo(0, -6); map.lineTo(4.4, 5); map.lineTo(-4.4, 5); map.closePath();
    map.fill();
    map.restore();
  }

  return {
    update(flight, mission, timeLeft, sortieSeconds, score, t) {
      setSpeed(flight.speed);
      setAlt(flight.y);
      setVs(flight.vy);
      setThr(flight.throttle);
      setHull(flight.hull);
      setScore(score);
      setFuelPct(flight.fuel);
      const fw = Math.round(flight.fuel);
      if (fw !== lastFuelWidth) {
        lastFuelWidth = fw;
        fuelFill.style.width = `${fw}%`;
        fuelFill.style.background = fw < 22 ? '#ff5e5e' : '';
      }
      setClock(fmtClock(timeLeft, sortieSeconds));
      setLeft(fmtLeft(timeLeft));
      const deg = ((flight.heading * 180 / Math.PI) % 360 + 360) % 360;
      const point = COMPASS[Math.round(deg / 45) % 8];
      setHdg(`${point} ${Math.round(deg)}°`);
      const target = mission.target();
      const dist = Math.hypot(target.x - flight.x, target.z - flight.z);
      const stormPct = Math.round((1 - Math.max(0, timeLeft) / sortieSeconds) * 100);
      setStorm(`${stormPct}% · GUST ${Math.round(stormPct * 0.42)} KT`);
      if (mission.state.finished) {
        setStage('FINAL · LANDING');
        setGoal('Land on Coral Run strip');
        setDist(`STRIP ${Math.round(dist)} m · slow below 78 kt`);
      } else {
        const s = mission.stage();
        setStage(`MAYDAY ${mission.stageNumber()} OF 3 · ${s.name}`);
        setGoal(s.goal);
        const dwellPct = Math.round((mission.state.dwell || 0) / 2.5 * 100);
        setDist(dwellPct > 0
          ? `${target.label.toUpperCase()} · WINCHING ${dwellPct}%`
          : `${target.label.toUpperCase()} · ${Math.round(dist)} m · HOVER IN THE RING`);
      }
      if (mission.state.bannerT > 0 && mission.state.banner) {
        if (lastBanner !== mission.state.banner) {
          lastBanner = mission.state.banner;
          bannerNode.textContent = mission.state.banner;
          bannerNode.style.opacity = '1';
        }
      } else if (lastBanner !== null) {
        lastBanner = null;
        bannerNode.style.opacity = '0';
      }
      drawMap(flight, target);
    },
    showBanner(text) {
      bannerNode.textContent = text;
      bannerNode.style.opacity = '1';
      lastBanner = text;
    },
  };
}
