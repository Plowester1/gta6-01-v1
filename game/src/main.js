// Boot and the one loop: input every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. Screens: title,
// play, paused, wasted, busted. ?shot=chase|street|mission|city stages a
// screenshot scene instead of running the loop, paints it twice and sets
// window.__shotReady.
import { STEP, WORLD } from './config.js';
import { createRandom } from './random.js';
import { generateCity, districtAt } from './city.js';
import { createInput, makeEdge } from './input.js';
import { createPlayer, stepPlayer, exitCar, addWanted } from './player.js';
import { spawnCar, driveCar, stepParticles } from './vehicles.js';
import { spawnTraffic, stepTraffic } from './traffic.js';
import { spawnPeds, stepPeds } from './pedestrians.js';
import { stepPolice } from './police.js';
import { createMissionState, stepMissions } from './missions.js';
import { stepCombat } from './combat.js';
import { createAudio } from './audio.js';
import { saveGame, loadGame } from './save.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_BUSTED } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const rng = createRandom(seed);
const city = generateCity(createRandom(seed));
const audio = createAudio();

const G = {
  rng, city, audio, time: 0, screen: SCREEN_TITLE,
  player: createPlayer(1400, 900), mission: createMissionState(),
  cars: [], peds: [], cops: [], bullets: [], particles: [], pickups: [], skid: [],
  camera: { x: 800, y: 600, zoom: 1 }, cameraLock: false,
  shake: 0, message: '', messageT: 0, district: 'Downtown',
  gunshotT: 0, muzzleT: 0, fireCd: 0, spawnT: 0, roadblockT: 0,
  policeAlert: 0, bustedReason: '', saveT: 0,
  stats: { carsStolen: 0, missionsDone: 0 },
};

// Debug handle for automated checks (harmless in play).
window.__solmarina = G;

function resetWorld() {
  G.cars.length = 0; G.peds.length = 0; G.cops.length = 0;
  G.bullets.length = 0; G.particles.length = 0; G.pickups.length = 0; G.skid.length = 0;
  G.player = createPlayer(1400, 900);
  G.mission = createMissionState();
  G.time = 0; G.shake = 0; G.message = ''; G.messageT = 0;
  G.gunshotT = 0; G.muzzleT = 0; G.fireCd = 0; G.spawnT = 0; G.roadblockT = 0;
  G.policeAlert = 0; G.bustedReason = '';
  G.camera.x = 800; G.camera.y = 600; G.camera.zoom = 1; G.cameraLock = false;
  // Parked cars around the spawn, plus ambient traffic and pedestrians.
  spawnCar(G, 'sedan', 1450, 940, Math.PI / 2, 'parked');
  spawnCar(G, 'taxi', 1350, 860, 0, 'parked');
  spawnCar(G, 'van', 1560, 1100, Math.PI, 'parked');
  spawnCar(G, 'sports', 1200, 1400, Math.PI / 2, 'parked');
  spawnTraffic(G, 12);
  spawnPeds(G, 20);
  G.pickups.push({ x: 1450, y: 850, kind: 'ammo' });
}
G.reset = resetWorld;

function stepWorld(dt, input, edge) {
  const p = G.player;
  G.time += dt;
  if (G.messageT > 0) G.messageT -= dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  G.district = districtAt(p.x, p.y);
  if (p.inCar) {
    driveCar(G, p.inCar, dt, input);
    if (edge && edge('KeyE')) exitCar(G);
    audio.engine(p.inCar.speed, 470);
  } else {
    stepPlayer(G, dt, input, edge || (() => false));
    audio.engine(0, 470);
  }
  stepTraffic(G, dt);
  stepPeds(G, dt);
  stepPolice(G, dt);
  stepMissions(G, dt);
  stepCombat(G, dt, input);
  stepParticles(G, dt);
  if (p.health <= 0 && G.screen === SCREEN_PLAY) {
    G.screen = SCREEN_OVER;
    G.bustedReason = 'Wasted. Solmarina is unforgiving.';
  }
  if (G.screen === SCREEN_PLAY) {
    G.saveT += dt;
    if (G.saveT > 12) { G.saveT = 0; saveGame(G); }
  }
}

// The game loop and the screenshot path (main.js part 2).
const renderer = createRenderer(canvas);

function runShot(name) {
  resetWorld();
  const screen = stageShot(G, name, (dt, input) => stepWorld(dt, input, null));
  let painted = 0;
  function paint() {
    renderer.draw(G, screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const edge = makeEdge(input);
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();
  resetWorld();
  // Continue a previous visit if there is a save.
  const hadSave = loadGame(G);

  function announce(message) { status.textContent = message; }

  function startGame() {
    resetWorld();
    G.screen = SCREEN_PLAY;
    screen = SCREEN_PLAY;
    accumulator = 0;
    audio.unlock();
    announce('Playing SOLMARINA.');
  }

  function handleKeys() {
    if (edge('Enter')) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_BUSTED) startGame();
    }
    if (edge('KeyC') && screen === SCREEN_TITLE && hadSave) {
      G.screen = SCREEN_PLAY;
      screen = SCREEN_PLAY;
      audio.unlock();
      announce('Continuing saved game.');
    }
    if (edge('Escape') || edge('KeyP')) {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; G.screen = SCREEN_PAUSED; announce('Paused.'); }
      else if (screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; G.screen = SCREEN_PLAY; announce('Playing.'); }
    }
    if (edge('KeyM')) audio.setMuted(!audio.isMuted());
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleKeys();
    G.screen = screen;
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        stepWorld(STEP, input, edge);
        accumulator -= STEP;
        if (G.screen !== SCREEN_PLAY) { screen = G.screen; break; }
      }
    } else {
      accumulator = 0;
      if (screen === SCREEN_TITLE) G.time += STEP;
    }
    renderer.draw(G, screen);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED; G.screen = SCREEN_PAUSED; announce('Paused.');
    }
  });

  announce('SOLMARINA. Press Enter to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
