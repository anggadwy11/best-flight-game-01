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
  // Cockpit instruments (view toggled by main.js): three live screens.
  const cockpitNode = el('cockpit');
  const radarCtx = el('radar').getContext('2d');
  const adiCtx = el('adi').getContext('2d');
  const engCtx = el('eng').getContext('2d');
  const setHdgTape = cached(el('hdgtape-val'), (v) => v);
  let cockpitOn = false;
  // Chase-view instrument strip: four round gauges + big readouts.
  const setAltBig = cached(el('altbig'), (v) => Math.max(0, Math.round(v * 3.28)).toLocaleString('en-US'));
  const setThrBig = cached(el('thrbig'), (v) => `${Math.round(v * 100)}%`);
  const setHdgBig = cached(el('hdgbig'), (v) => String(Math.round(v)).padStart(3, '0'));
  const thrFill = el('thrFill');
  const viewLabel = el('viewlabel');
  const attCtx = el('attball').getContext('2d');
  const altDialCtx = el('altdial').getContext('2d');
  const hdgDialCtx = el('hdgdial').getContext('2d');
  const rpmDialCtx = el('rpmdial').getContext('2d');
  let lastThrWidth = -1;

  function dialFace(c, label) {
    c.fillStyle = '#0a141c'; c.beginPath(); c.arc(46, 46, 44, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(127,231,210,0.5)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#7fe7d2'; c.font = '700 8.5px system-ui, sans-serif'; c.textAlign = 'center';
    c.fillText(label, 46, 84);
    c.textAlign = 'left';
  }
  function needle(c, angle, length, color) {
    c.strokeStyle = color; c.lineWidth = 3;
    c.beginPath(); c.moveTo(46, 46);
    c.lineTo(46 + Math.sin(angle) * length, 46 - Math.cos(angle) * length); c.stroke();
    c.fillStyle = '#fff7ea'; c.beginPath(); c.arc(46, 46, 3.4, 0, Math.PI * 2); c.fill();
  }
  function drawGauges(flight, deg) {
    // Attitude ball: the cockpit ADI in round form.
    let c = attCtx;
    c.save();
    c.beginPath(); c.arc(46, 46, 44, 0, Math.PI * 2); c.clip();
    c.translate(46, 46); c.rotate(-flight.bank); c.translate(0, flight.pitch * 52);
    c.fillStyle = '#2e6f8e'; c.fillRect(-60, -120, 120, 120);
    c.fillStyle = '#3d4a3a'; c.fillRect(-60, 0, 120, 120);
    c.fillStyle = '#fff7ea'; c.fillRect(-60, -1, 120, 2);
    c.restore();
    c.strokeStyle = 'rgba(127,231,210,0.5)'; c.lineWidth = 2;
    c.beginPath(); c.arc(46, 46, 44, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#ffb042'; c.lineWidth = 3;
    c.beginPath();
    c.moveTo(22, 46); c.lineTo(38, 46); c.lineTo(38, 51);
    c.moveTo(70, 46); c.lineTo(54, 46); c.lineTo(54, 51);
    c.stroke();
    c.fillStyle = '#ffb042'; c.beginPath(); c.arc(46, 46, 2.6, 0, Math.PI * 2); c.fill();

    // Altimeter: 0-2,000 ft over a 270 degree sweep.
    c = altDialCtx;
    dialFace(c, 'FT MSL');
    c.fillStyle = '#cfd8e6'; c.font = '700 9px system-ui, sans-serif'; c.textAlign = 'center';
    for (let v = 0; v <= 2000; v += 250) {
      const a = (-225 + (v / 2000) * 270) * Math.PI / 180;
      const x = 46 + Math.sin(a) * 34; const y = 46 - Math.cos(a) * 34;
      if (v % 500 === 0) c.fillText(String(v / 100), x, y + 3);
      c.fillRect(46 + Math.sin(a) * 40 - 0.75, 46 - Math.cos(a) * 40 - 0.75, 1.5, 1.5);
    }
    c.textAlign = 'left';
    needle(c, (-225 + (Math.max(0, flight.y * 3.28) / 2000) * 270) * Math.PI / 180, 30, '#ffd98a');

    // Heading: a rotating compass card under a fixed pointer.
    c = hdgDialCtx;
    dialFace(c, 'MAGNETIC');
    c.save();
    c.beginPath(); c.arc(46, 46, 41, 0, Math.PI * 2); c.clip();
    c.translate(46, 46); c.rotate(-deg * Math.PI / 180);
    c.fillStyle = '#fff7ea'; c.font = '800 11px system-ui, sans-serif'; c.textAlign = 'center';
    const cards = [['N', 0], ['E', 90], ['S', 180], ['W', 270]];
    for (const [letter, bearing] of cards) {
      const a = bearing * Math.PI / 180;
      c.fillText(letter, Math.sin(a) * 31, -Math.cos(a) * 31 + 4);
    }
    c.fillStyle = 'rgba(255,247,234,0.6)';
    for (let b = 0; b < 360; b += 30) {
      const a = b * Math.PI / 180;
      c.fillRect(Math.sin(a) * 40 - 0.75, -Math.cos(a) * 40 - 0.75, 1.5, 1.5);
    }
    c.restore();
    c.fillStyle = '#ffb042';
    c.beginPath(); c.moveTo(46, 3); c.lineTo(41, 11); c.lineTo(51, 11); c.closePath(); c.fill();
    c.textAlign = 'left';

    // Engine: RPM follows throttle and speed — the engine's real state.
    c = rpmDialCtx;
    dialFace(c, 'RPM x100');
    const rpm = 500 + flight.throttle * 1900 + flight.speed * 5;
    c.strokeStyle = '#ff5e5e'; c.lineWidth = 3;
    c.beginPath(); c.arc(46, 46, 38, (-225 + 260) * Math.PI / 180 - Math.PI / 2, (-225 + 270) * Math.PI / 180 - Math.PI / 2); c.stroke();
    needle(c, (-225 + (rpm / 3000) * 270) * Math.PI / 180, 30, '#7fe7d2');
  }

  function drawRadar(flight, target) {
    const c = radarCtx; const W = 252; const H = 140;
    const cx = W / 2; const cy = H / 2; const S = 0.105; // 600 m -> ~63 px
    c.fillStyle = '#06121a'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(47,212,182,0.4)'; c.lineWidth = 1;
    for (const r of [22, 44, 66]) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(cx - 70, cy); c.lineTo(cx + 70, cy); c.moveTo(cx, cy - 70); c.lineTo(cx, cy + 70); c.stroke();
    const fx = Math.sin(flight.heading); const fz = -Math.cos(flight.heading);
    const plot = (x, z) => {
      const dx = x - flight.x; const dz = z - flight.z;
      return [cx + (dx * -fz + dz * fx) * S, cy - (dx * fx + dz * fz) * S];
    };
    c.fillStyle = 'rgba(120,170,140,0.8)';
    for (const island of ISLANDS) { const [px, py] = plot(island.x, island.z); c.fillRect(px - 2, py - 2, 4, 4); }
    for (let i = 0; i < BOATS.length; i += 1) {
      const [px, py] = plot(BOATS[i].x, BOATS[i].z);
      c.fillStyle = i === (target && target.boatIndex) ? '#ffb042' : '#ff2a1e';
      c.fillRect(px - 3, py - 3, 6, 6);
    }
    const [rx, ry] = plot(RUNWAY.x, RUNWAY.z);
    c.fillStyle = '#fff7ea'; c.fillRect(rx - 5, ry - 1.5, 10, 3);
    // Own ship: fixed centre wedge pointing up (heading-up display).
    c.fillStyle = '#7fe7d2';
    c.beginPath(); c.moveTo(cx, cy - 6); c.lineTo(cx + 4.5, cy + 5); c.lineTo(cx - 4.5, cy + 5); c.closePath(); c.fill();
  }

  function drawAdi(flight) {
    const c = adiCtx; const W = 252; const H = 140;
    c.fillStyle = '#06121a'; c.fillRect(0, 0, W, H);
    c.save();
    c.beginPath(); c.rect(4, 4, W - 8, H - 8); c.clip();
    c.translate(W / 2, H / 2);
    c.rotate(-flight.bank);
    c.translate(0, flight.pitch * 120);
    c.fillStyle = '#2e6f8e'; c.fillRect(-W, -H * 2, W * 2, H * 2);
    c.fillStyle = '#26332a'; c.fillRect(-W, 0, W * 2, H * 2);
    c.fillStyle = '#fff7ea'; c.fillRect(-W, -1.2, W * 2, 2.4);
    c.fillStyle = 'rgba(255,247,234,0.75)';
    for (const d of [-20, -10, 10, 20]) {
      const y = -d * 2.4; const w = d % 20 === 0 ? 34 : 20;
      c.fillRect(-w / 2, y - 1, w, 2);
    }
    c.restore();
    // Fixed aircraft symbol.
    c.strokeStyle = '#ffb042'; c.lineWidth = 3;
    c.beginPath();
    c.moveTo(W / 2 - 44, H / 2); c.lineTo(W / 2 - 12, H / 2); c.lineTo(W / 2 - 12, H / 2 + 7);
    c.moveTo(W / 2 + 44, H / 2); c.lineTo(W / 2 + 12, H / 2); c.lineTo(W / 2 + 12, H / 2 + 7);
    c.stroke();
    c.fillStyle = '#ffb042'; c.beginPath(); c.arc(W / 2, H / 2, 3, 0, Math.PI * 2); c.fill();
  }

  function drawEng(flight, stormPct) {
    const c = engCtx; const W = 252; const H = 140;
    c.fillStyle = '#06121a'; c.fillRect(0, 0, W, H);
    const rows = [
      ['THR', flight.throttle * 100, '#7fe7d2'],
      ['FUEL', flight.fuel, flight.fuel < 22 ? '#ff5e5e' : '#58b7ff'],
      ['HULL', flight.hull, flight.hull < 40 ? '#ff5e5e' : '#7ddc7d'],
      ['STORM', stormPct, '#c9a7ff'],
    ];
    c.font = '700 12px system-ui, sans-serif';
    rows.forEach(([label, value, color], i) => {
      const y = 14 + i * 32;
      c.fillStyle = '#9fd8cb'; c.fillText(label, 8, y + 4);
      c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(52, y - 6, 150, 11);
      c.fillStyle = color; c.fillRect(52, y - 6, 150 * Math.max(0, Math.min(100, value)) / 100, 11);
      c.fillStyle = '#fff7ea'; c.fillText(`${Math.round(value)}%`, 210, y + 4);
    });
  }
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
      setAltBig(flight.y);
      setThrBig(flight.throttle);
      setHdgBig(deg);
      const tw = Math.round(flight.throttle * 100);
      if (tw !== lastThrWidth) { lastThrWidth = tw; thrFill.style.width = `${tw}%`; }
      if (!cockpitOn) drawGauges(flight, deg);
      if (cockpitOn) {
        const tgt = mission.state.finished ? null : { boatIndex: mission.state.boatIndex };
        drawRadar(flight, tgt);
        drawAdi(flight);
        drawEng(flight, stormPct);
        setHdgTape(`HDG ${point} ${String(Math.round(deg)).padStart(3, '0')}°`);
      }
    },
    setCockpit(on) {
      cockpitOn = on;
      cockpitNode.hidden = !on;
      document.body.classList.toggle('cockpit', on);
      viewLabel.textContent = on ? 'COCKPIT VIEW' : 'CHASE VIEW';
    },
    showBanner(text) {
      bannerNode.textContent = text;
      bannerNode.style.opacity = '1';
      lastBanner = text;
    },
  };
}
