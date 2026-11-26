// Sunset Sortie — boot and the one loop. A Three.js chase-view flight game:
// the world advances in fixed 1/60 s steps, the camera glides behind the
// plane (never snaps), and the screens are title, play, paused, landed and
// crashed. ?shot=title|gates|cargo|landing stages a deterministic scene,
// paints it, and sets window.__shotReady for the screenshot harness.
import * as THREE from 'three';
import { SORTIE_SECONDS, STEP } from './config.js';
import { createRandom } from './random.js';
import { buildWorld } from './world.js';
import { buildTraffic } from './traffic.js';
import { buildPlane, createFlight, posePlane } from './flight.js';
import { createMission } from './missions.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createHud } from './hud.js';
import { createAudio } from './audio.js';
import { readBest, saveBest } from './save.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const canvas = document.getElementById('scene');
const status = document.getElementById('status');
const titleNode = document.getElementById('title');
const endNode = document.getElementById('end');
const endTitle = document.getElementById('end-title');
const endLines = document.getElementById('end-lines');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 16 / 10, 0.5, 4000);

const world = buildWorld(scene);
const traffic = buildTraffic(scene);
const planeParts = buildPlane();
scene.add(planeParts.group);
const flightApi = createFlight();
const flight = flightApi.state;
const mission = createMission(world.rings, world.crates);
const audio = createAudio();
let best = readBest();
const hud = createHud(best);

let screen = 'title';
document.body.classList.add('poster');
let score = 0;
let timeLeft = SORTIE_SECONDS;
let elapsed = 0;
let camPos = new THREE.Vector3(60, 110, 640);
let warnedNear = false;

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function announce(message) { status.textContent = message; }

function startSortie() {
  flightApi.reset();
  mission.reset();
  score = 0;
  timeLeft = SORTIE_SECONDS;
  warnedNear = false;
  screen = 'play';
  titleNode.classList.add('hidden');
  document.body.classList.remove('poster');
  endNode.style.display = 'none';
  audio.start();
  announce('Flying. Stage 1: golden gates.');
}

function endSortie(kind) {
  screen = 'end';
  document.body.classList.add('poster');
  audio.mute();
  const gates = mission.state.gatesPassed;
  const cargo = mission.state.cargo;
  if (kind === 'landed') {
    const bonus = Math.round(timeLeft) * 4 + Math.round(flight.fuel) * 6 + cargo * 150;
    score += bonus;
    endTitle.textContent = 'TOUCHDOWN!';
    endLines.innerHTML = `Mail delivered to Coral Run with the light still in the sky.<br>`
      + `Gates ${gates} / 12 · Cargo ${cargo} / 3 · Time + fuel bonus +${bonus}<br>`
      + `<b>FINAL SCORE ${score.toLocaleString('en-US')}</b> · BEST ${Math.max(best, score).toLocaleString('en-US')}`;
    audio.landed();
  } else if (kind === 'dark') {
    endTitle.textContent = 'DARKNESS FELL';
    endLines.innerHTML = `The sun set with the mail still aboard.<br>`
      + `Gates ${gates} / 12 · Cargo ${cargo} / 3<br>`
      + `<b>SCORE ${score.toLocaleString('en-US')}</b> · BEST ${Math.max(best, score).toLocaleString('en-US')}`;
  } else {
    endTitle.textContent = kind === 'splash' ? 'DOWN IN THE LAGOON' : 'CRASHED';
    endLines.innerHTML = `The sortie ends here — the Coral Run mail goes by boat tomorrow.<br>`
      + `Gates ${gates} / 12 · Cargo ${cargo} / 3<br>`
      + `<b>SCORE ${score.toLocaleString('en-US')}</b> · BEST ${Math.max(best, score).toLocaleString('en-US')}`;
    audio.hit();
  }
  if (score > best) { best = score; saveBest(best); }
  endNode.style.display = 'flex';
  announce(endTitle.textContent + ' Score ' + score);
}

/** Chase camera: glide toward a point behind and above the plane. */
const desired = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
function chaseCamera(dt, lift = 0) {
  const f = flightApi.forward();
  desired.set(flight.x - f.x * 27, flight.y + 9.5, flight.z - f.z * 27);
  const k = 1 - Math.exp(-dt * 3.4);
  camPos.lerp(desired, k);
  camera.position.copy(camPos);
  lookTarget.set(flight.x + f.x * 34, flight.y + 1.5 + lift, flight.z + f.z * 34);
  camera.lookAt(lookTarget);
  camera.rotateZ(-flight.bank * 0.32);
  const targetFov = 58 + (flight.speed / 68) * 13;
  camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 2.4);
  camera.updateProjectionMatrix();
}

/** Title camera: a slow orbit with a creeping push-in — never a dead hold. */
function orbitCamera(t) {
  const r = 58 - Math.sin(t * 0.11) * 6 - t * 0.2;
  const a = 0.65 + t * 0.07;
  camera.position.set(flight.x + Math.sin(a) * r, flight.y + 10 + Math.sin(t * 0.23) * 2, flight.z + Math.cos(a) * r);
  camera.lookAt(flight.x, flight.y - 2, flight.z);
  camera.fov = 57;
  camera.updateProjectionMatrix();
}

function stepPlay(dt, input) {
  const prev = { x: flight.x, y: flight.y, z: flight.z };
  const control = {
    bank: input.bank(),
    pitch: input.pitch(),
    throttleAxis: input.throttleAxis(),
    boost: input.boost(),
  };
  const event = flightApi.step(dt, control);
  elapsed += dt;
  timeLeft -= dt;
  const hit = mission.step(flight, prev, elapsed);
  if (hit) {
    score += hit.points;
    if (hit.gate.cargo) audio.cargo(); else audio.gate();
  }
  const near = traffic.nearestDistance(flight.x, flight.y, flight.z);
  if (near < 13 && near > 0.01) {
    flight.hull -= 34;
    flight.x -= flightApi.forward().x * 6;
    flight.z -= flightApi.forward().z * 6;
    flight.y += 5;
    audio.hit();
    hud.showBanner('TRAFFIC! HULL DAMAGED');
    if (flight.hull <= 0) { endSortie('crash'); return; }
  } else if (near < 30 && !warnedNear) {
    warnedNear = true;
    audio.warn();
    setTimeout(() => { warnedNear = false; }, 4000);
  }
  audio.engine(flight.throttle, flight.speed);
  if (event === 'landed') endSortie(mission.state.finished ? 'landed' : 'crash');
  else if (event) endSortie(event);
  else if (timeLeft <= 0) endSortie('dark');
}

function frame(now, input, shotMode) {
  const dt = STEP;
  elapsed += shotMode ? 0 : 0; // elapsed advances inside the step paths
  if (!shotMode) {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === 'title' || screen === 'end')) startSortie();
    else if (actions & ACTION_PAUSE && screen === 'play') { screen = 'paused'; announce('Paused.'); }
    else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === 'paused') { screen = 'play'; announce('Flying.'); }

    if (screen === 'play') stepPlay(dt, input);
    else if (screen === 'title') {
      // Autopilot circle over Home Dock: the world behind the poster lives.
      flight.bank = 0.42;
      flight.heading += 0.42 * 0.85 * dt * (34 / 40);
      const f = flightApi.forward();
      flight.x += f.x * flight.speed * dt;
      flight.z += f.z * flight.speed * dt;
      flight.propSpin += dt * 30;
      elapsed += dt;
    }
  }
  world.update(dt, elapsed);
  traffic.update(elapsed + (shotMode ? 7.3 : 0));
  posePlane(planeParts, flight);
  if (shotMode && shot === 'title') chaseCamera(1, 8);
  else if (screen === 'title') orbitCamera(elapsed + 4.2);
  else chaseCamera(dt);
  hud.update(flight, mission, shotMode ? shotTimeLeft : timeLeft, SORTIE_SECONDS, shotMode ? shotScore : score, elapsed);
  renderer.render(scene, camera);
}

let shotTimeLeft = SORTIE_SECONDS;
let shotScore = 0;

if (shot) {
  const staged = stageShot(shot, flightApi, mission);
  shotTimeLeft = staged.timeLeft;
  shotScore = staged.score;
  if (staged.screen === 'title') {
    screen = 'title';
    elapsed = 4.2;
  } else {
    screen = 'play';
    titleNode.classList.add('hidden');
    document.body.classList.remove('poster');
    elapsed = 2.6;
  }
  mission.paint(2.6);
  // Settle the chase camera instantly for the staged frame.
  const f = flightApi.forward();
  camPos.set(flight.x - f.x * 27, flight.y + 9.5, flight.z - f.z * 27);
  let painted = 0;
  function paint() {
    frame(performance.now(), null, true);
    painted += 1;
    if (painted < 3) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
} else {
  const input = createInput(canvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'play') screen = 'paused';
  });
  announce('Sunset Sortie. Press Enter to start.');
  function loop(now) {
    requestAnimationFrame(loop);
    frame(now, input, false);
  }
  requestAnimationFrame(loop);
}
