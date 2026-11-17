// The screenshot scenes behind ?shot=chase|street|mission|city. Each one
// sets up the real game state, then plays it forward with scripted inputs
// so the frame is what a short real game looks like, and the same seed
// always gives the same frame.
import { STEP } from './config.js';
import { spawnCar } from './vehicles.js';
import { spawnTraffic } from './traffic.js';
import { spawnPeds } from './pedestrians.js';

function scriptedInput(axis, mouseDown) {
  return {
    axis: () => axis,
    down: (code) => (code === 'KeyW' || code === 'ArrowUp') && axis.y < 0,
    mouseX: 900, mouseY: 300, mouseDown: !!mouseDown, clicked: false,
    keys: new Set(),
  };
}

function spawnPoliceAt(G, x, y, angle, chase) {
  const car = spawnCar(G, 'police', x, y, angle, 'police');
  if (chase) G.cops.push({ kind: 'car', car, x, y, health: 100, sirenT: 0 });
  return car;
}

function snapCamera(G) {
  const p = G.player;
  const fx = p.inCar ? p.inCar.x : p.x;
  const fy = p.inCar ? p.inCar.y : p.y;
  G.camera.x = fx - 640;
  G.camera.y = fy - 360;
}

function driveForward(G, step, seconds) {
  const input = scriptedInput({ x: 0, y: -1 }, false);
  for (let i = 0; i < seconds / STEP; i += 1) step(STEP, input);
}

function walkForward(G, step, seconds) {
  const input = scriptedInput({ x: 0, y: -1 }, false);
  for (let i = 0; i < seconds / STEP; i += 1) step(STEP, input);
}

export function stageShot(G, name, step) {
  G.reset();
  // Clear the ambient parked cars/traffic/peds: each scene spawns exactly
  // the vehicles and people it wants, on clear road.
  G.cars.length = 0;
  G.peds.length = 0;
  const p = G.player;
  if (name === 'chase') {
    // Cover: sports car chase downtown, 2 police cars, wanted 3 stars.
    const car = spawnCar(G, 'sports', 1150, 1100, 0, 'player');
    car.color = '#d21f3c';
    p.inCar = car;
    p.wantedFloat = 3; p.wanted = 3;
    G.roadblockT = 30; G.spawnT = 10;
    G.mission.phase = 'active';
    G.mission.index = 0;
    G.mission.objective = 'Bring the sports car to the Marina lot.';
    G.mission.target = { x: 1000, y: 2050 };
    spawnTraffic(G, 10);
    // Keep the chase avenue clear so the player car can build speed.
    for (let i = G.cars.length - 1; i >= 0; i -= 1) {
      const c = G.cars[i];
      if (c.driver === 'traffic' && Math.abs(c.y - 1100) < 70 && c.x > 1000) G.cars.splice(i, 1);
    }
    spawnPeds(G, 14);
    spawnPoliceAt(G, 1000, 1030, 0, true);
    spawnPoliceAt(G, 950, 1170, 0, true);
    G.audio.setMuted(true);
    driveForward(G, step, 2.0);
    snapCamera(G);
    G.camera.zoom = 1;
    return 'play';
  }
  if (name === 'street') {
    p.x = 1000; p.y = 780;
    spawnCar(G, 'sedan', 1060, 860, Math.PI / 2, 'parked');
    spawnCar(G, 'taxi', 940, 700, 0, 'parked');
    spawnTraffic(G, 8);
    spawnPeds(G, 22);
    walkForward(G, step, 1.5);
    snapCamera(G);
    G.camera.zoom = 1;
    return 'play';
  }
  if (name === 'mission') {
    const car = spawnCar(G, 'sports', 900, 1400, Math.PI, 'player');
    car.color = '#d21f3c';
    p.inCar = car;
    p.armed = true; p.ammo = 24;
    p.cash = 1250;
    G.mission.index = 1;
    G.mission.phase = 'active';
    G.mission.objective = 'Grab the package at the Harbor docks.';
    G.mission.target = { x: 300, y: 1500 };
    G.mission.reward = 450;
    spawnTraffic(G, 8);
    for (let i = G.cars.length - 1; i >= 0; i -= 1) {
      const c = G.cars[i];
      if (c.driver === 'traffic' && Math.abs(c.y - 1400) < 70 && c.x < 900) G.cars.splice(i, 1);
    }
    spawnPeds(G, 10);
    spawnPoliceAt(G, 900, 1100, 0, false);
    G.roadblockT = 30; G.spawnT = 10;
    G.audio.setMuted(true);
    driveForward(G, step, 1.6);
    snapCamera(G);
    G.camera.zoom = 1;
    return 'play';
  }
  // city: wide view of the waterfront, downtown and beach in one frame.
  const car = spawnCar(G, 'sports', 1500, 2150, 0, 'player');
  p.inCar = car;
  p.cash = 3200;
  G.mission.phase = 'idle';
  G.mission.objective = 'Find Mara Voss — follow the gold M on the map.';
  spawnTraffic(G, 12);
  spawnPeds(G, 16);
  driveForward(G, step, 1.2);
  G.camera.zoom = 0.36;
  G.cameraLock = true;
  G.camera.x = -180; G.camera.y = 400;
  return 'play';
}
