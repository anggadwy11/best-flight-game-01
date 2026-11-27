// Storm Rescue — boot and the one loop. A Three.js chase-view rescue
// game: the world advances in fixed 1/60 s steps, the camera glides
// behind the plane (never snaps), and the screens are title, play,
// paused, landed and lost. The storm (storm.js) and the rescue
// (rescue.js) are separate modules wired together here — weather in,
// hover state out, score on top. ?shot=title|boat|hover|landing stages
// a deterministic scene, paints it, and sets window.__shotReady.
import * as THREE from 'three';
import { SORTIE_SECONDS, STEP } from './config.js';
import { buildWorld } from './world.js';
import { buildPlane, createFlight, posePlane } from './flight.js';
import { createStorm } from './storm.js';
import { createRescue } from './rescue.js';
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 16 / 10, 0.5, 4000);

const world = buildWorld(scene);
const storm = createStorm(scene);
const planeParts = buildPlane();
scene.add(planeParts.group);
const flightApi = createFlight();
const flight = flightApi.state;
const rescue = createRescue(scene);
const audio = createAudio();
let best = readBest();
const hud = createHud(best);

let screen = 'title';
document.body.classList.add('poster');
let score = 0;
let timeLeft = SORTIE_SECONDS;
let elapsed = 0;
let camPos = new THREE.Vector3(60, 110, 640);
let fpsFrames = 0;

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
  rescue.reset();
  score = 0;
  timeLeft = SORTIE_SECONDS;
  screen = 'play';
  titleNode.classList.add('hidden');
  document.body.classList.remove('poster');
  endNode.style.display = 'none';
  audio.start();
  announce('Flying. First mayday: FV Kestrel.');
}

function endSortie(kind) {
  screen = 'end';
  document.body.classList.add('poster');
  audio.mute();
  const crews = rescue.state.rescued;
  if (kind === 'landed' && rescue.state.finished) {
    const bonus = Math.round(timeLeft) * 4 + Math.round(flight.fuel) * 6;
    score += bonus;
    endTitle.textContent = 'ALL CREWS HOME!';
    endLines.innerHTML = `Every crew is off the water and the plane is on the Coral Run strip.<br>`
      + `Rescues ${crews} / 3 · Time + fuel bonus +${bonus}<br>`
      + `<b>FINAL SCORE ${score.toLocaleString('en-US')}</b> · BEST ${Math.max(best, score).toLocaleString('en-US')}`;
    audio.landed();
  } else if (kind === 'landed') {
    endTitle.textContent = 'DOWN SAFE — SEA STILL OUT THERE';
    endLines.innerHTML = `You landed with ${crews} of 3 crews aboard. The rest ride out the squall on the boats.<br>`
      + `<b>SCORE ${score.toLocaleString('en-US')}</b> · BEST ${Math.max(best, score).toLocaleString('en-US')}`;
  } else if (kind === 'peaked') {
    endTitle.textContent = 'THE SQUALL PEAKED';
    endLines.innerHTML = `The sea closed in. ${crews} of 3 crews came home aboard your plane.<br>`
      + `<b>SCORE ${score.toLocaleString('en-US')}</b> · BEST ${Math.max(best, score).toLocaleString('en-US')}`;
  } else {
    endTitle.textContent = kind === 'splash' ? 'DOWN IN THE SQUALL' : 'CRASHED';
    endLines.innerHTML = `The rescue ends here — the coast guard sends the big helicopter for the rest.<br>`
      + `Rescues ${crews} / 3<br>`
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
function chaseCamera(dt, lift = 0, back = 27) {
  const f = flightApi.forward();
  desired.set(flight.x - f.x * back, flight.y + 9.5, flight.z - f.z * back);
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

function intensity() { return 1 - Math.max(0, timeLeft) / SORTIE_SECONDS; }

function stepPlay(dt, input) {
  const control = {
    bank: input.bank(),
    pitch: input.pitch(),
    throttleAxis: input.throttleAxis(),
    boost: input.boost(),
    wind: storm.gustAt(elapsed, intensity()),
  };
  const event = flightApi.step(dt, control);
  elapsed += dt;
  timeLeft -= dt;
  const hit = rescue.step(flight, dt, elapsed);
  if (hit) {
    score += hit.points;
    audio.cargo();
    hud.showBanner(rescue.state.banner);
  }
  audio.engine(flight.throttle, flight.speed);
  if (event === 'landed') endSortie('landed');
  else if (event) endSortie(event);
  else if (timeLeft <= 0) endSortie('peaked');
}

function frame(now, input, shotMode) {
  const dt = STEP;
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
  const inten = shotMode ? (1 - shotTimeLeft / SORTIE_SECONDS) : (screen === 'title' ? 0.25 : intensity());
  world.update(dt, elapsed);
  storm.update(dt, elapsed, camera.position, inten);
  if (shotMode) rescue.step(flight, 0, elapsed);
  posePlane(planeParts, flight);
  if (shotMode && shot === 'title') chaseCamera(1, 8, 36);
  else if (screen === 'title' && !shotMode) orbitCamera(elapsed + 4.2);
  else chaseCamera(dt);
  hud.update(flight, rescue, shotMode ? shotTimeLeft : timeLeft, SORTIE_SECONDS, shotMode ? shotScore : score, elapsed);
  renderer.render(scene, camera);
  fpsFrames += 1;
}

let shotTimeLeft = SORTIE_SECONDS;
let shotScore = 0;

if (shot) {
  const staged = stageShot(shot, flightApi, rescue);
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
  rescue.paint(2.6);
  const f = flightApi.forward();
  const camBack = shot === 'title' ? 42 : 27;
  camPos.set(flight.x - f.x * camBack, flight.y + 9.5, flight.z - f.z * camBack);
  let painted = 0;
  function paint() {
    if (shot === 'boat') storm.strike();
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
  announce('Storm Rescue. Press Enter to start.');
  // FPS probe for the build gate: ?fps=1 counts real frames for 5 s.
  if (params.get('fps')) {
    setTimeout(() => {
      window.__fps = fpsFrames / 5;
      window.__shotReady = true;
    }, 5000);
  }
  function loop(now) {
    requestAnimationFrame(loop);
    frame(now, input, false);
  }
  requestAnimationFrame(loop);
}
