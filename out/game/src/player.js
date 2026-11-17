// The player on foot: WASD/arrows walk, Shift run, Space punch, E enter
// or exit the nearest car, mouse aim when armed. Health, cash and wanted
// live on the player object in main.js.
import { WORLD } from './config.js';
import { hitsBuilding } from './city.js';
import { clamp } from './random.js';

const WALK_SPEED = 170;
const RUN_SPEED = 290;
const PUNCH_RANGE = 34;
const PUNCH_DAMAGE = 25;
const PUNCH_COOLDOWN = 0.45;

export function createPlayer(x, y) {
  return {
    x, y, angle: -Math.PI / 2, speed: 0, health: 100, cash: 250,
    wanted: 0, wantedFloat: 0, inCar: null, armed: false, ammo: 0,
    punchT: 0, punchCd: 0, invuln: 0, run: false, moving: false,
  };
}

export function stepPlayer(G, dt, input, edge) {
  const p = G.player;
  if (p.inCar) return;
  if (p.punchT > 0) p.punchT -= dt;
  if (p.punchCd > 0) p.punchCd -= dt;
  if (p.invuln > 0) p.invuln -= dt;
  const axis = input.axis();
  const run = input.down('ShiftLeft') || input.down('ShiftRight');
  p.run = run;
  const speed = run ? RUN_SPEED : WALK_SPEED;
  const len = Math.hypot(axis.x, axis.y);
  p.moving = len > 0;
  if (len > 0) {
    const nx = p.x + (axis.x / len) * speed * dt;
    const ny = p.y + (axis.y / len) * speed * dt;
    // Slide along walls: try full move, then each axis alone.
    if (!hitsBuilding(G.city, nx, ny, 12)) { p.x = nx; p.y = ny; }
    else if (!hitsBuilding(G.city, nx, p.y, 12)) p.x = nx;
    else if (!hitsBuilding(G.city, p.x, ny, 12)) p.y = ny;
    p.x = clamp(p.x, 40, WORLD.width - 40);
    p.y = clamp(p.y, 40, WORLD.height - 40);
    p.angle = Math.atan2(axis.y, axis.x);
  }
  // Aim follows the mouse when armed, otherwise faces movement.
  if (p.armed) {
    const wx = G.camera.x + input.mouseX / G.camera.zoom;
    const wy = G.camera.y + input.mouseY / G.camera.zoom;
    p.angle = Math.atan2(wy - p.y, wx - p.x);
  }
  if (input.down('Space') && p.punchCd <= 0) {
    p.punchT = 0.22; p.punchCd = PUNCH_COOLDOWN;
    punch(G);
  }
  if (edge('KeyE')) tryEnterCar(G);
}

function punch(G) {
  const p = G.player;
  const tx = p.x + Math.cos(p.angle) * PUNCH_RANGE;
  const ty = p.y + Math.sin(p.angle) * PUNCH_RANGE;
  for (const ped of G.peds) {
    if (!ped.alive) continue;
    if (Math.hypot(ped.x - tx, ped.y - ty) < 26) {
      ped.health -= PUNCH_DAMAGE;
      ped.flee = 3; ped.vx = Math.cos(p.angle) * 220; ped.vy = Math.sin(p.angle) * 220;
      if (ped.health <= 0) { ped.alive = false; addWanted(G, 1); G.audio.hit(); }
      G.audio.punch();
      return;
    }
  }
  for (const cop of G.cops) {
    if (cop.kind !== 'foot' || cop.health <= 0) continue;
    if (Math.hypot(cop.x - tx, cop.y - ty) < 26) {
      cop.health -= PUNCH_DAMAGE;
      addWanted(G, 2);
      G.audio.punch();
      return;
    }
  }
  G.audio.punch();
}

export function tryEnterCar(G) {
  const p = G.player;
  let best = null; let bd = 110;
  for (const car of G.cars) {
    if (car.exploded || car === p.inCar) continue;
    const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (d < bd) { bd = d; best = car; }
  }
  if (!best) return;
  if (best.driver === 'traffic' || best.driver === 'parked') {
    addWanted(G, 1);
    best.driver = 'player';
    G.stats.carsStolen += 1;
    G.message = `Stole a ${best.typeName}!`; G.messageT = 2;
    G.audio.steal();
  }
  p.inCar = best;
  best.speed = 0;
}

export function exitCar(G) {
  const p = G.player;
  const car = p.inCar;
  if (!car) return;
  p.inCar = null;
  p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
  p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
  if (hitsBuilding(G.city, p.x, p.y, 12)) {
    p.x = car.x - Math.cos(car.angle + Math.PI / 2) * 34;
    p.y = car.y - Math.sin(car.angle + Math.PI / 2) * 34;
  }
}

export function addWanted(G, n) {
  const p = G.player;
  p.wanted = Math.min(5, p.wanted + n);
  p.wantedFloat = p.wanted;
  if (p.wanted >= 1) G.policeAlert = Math.max(G.policeAlert, 6);
}
