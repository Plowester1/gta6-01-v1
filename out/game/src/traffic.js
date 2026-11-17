// AI traffic: cars drive the road grid in lanes, stop at red lights,
// brake for the car ahead and for the player, honk when stuck.
import { H_ROADS, V_ROADS, lightPhase } from './city.js';
import { spawnCar } from './vehicles.js';
import { pick, range } from './random.js';

const TRAFFIC_TYPES = ['sedan', 'sedan', 'taxi', 'truck', 'van', 'sports'];
const LIGHT_WAIT = 0.9;

export function spawnTraffic(G, n) {
  for (let i = 0; i < n; i += 1) {
    const vertical = G.rng() < 0.5;
    const x = vertical ? pick(G.rng, V_ROADS) : 120 + G.rng() * 2960;
    const y = vertical ? 120 + G.rng() * 2000 : pick(G.rng, H_ROADS);
    const car = spawnCar(G, pick(G.rng, TRAFFIC_TYPES), x, y, 0, 'traffic');
    car.lane = vertical ? 'v' : 'h';
    car.dir = G.rng() < 0.5 ? 1 : -1;
    car.angle = car.lane === 'v' ? (car.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (car.dir > 0 ? 0 : Math.PI);
    car.cruise = range(G.rng, 120, 200);
    car.waitT = 0;
  }
}

export function stepTraffic(G, dt) {
  for (const car of G.cars) {
    if (car.driver !== 'traffic' || car.exploded) continue;
    const ahead = carAhead(G, car);
    let target = car.cruise;
    if (ahead !== null && ahead < 70) target = 0;
    if (atLight(G, car)) target = 0;
    // Brake for the player crossing in front.
    const p = G.player;
    if (!p.inCar) {
      const dx = p.x - car.x; const dy = p.y - car.y;
      const fwd = Math.cos(car.angle) * dx + Math.sin(car.angle) * dy;
      if (fwd > 0 && fwd < 60 && Math.abs(-Math.sin(car.angle) * dx + Math.cos(car.angle) * dy) < 26) target = 0;
    }
    if (target === 0 && car.speed < 5) {
      car.waitT += dt;
      if (car.waitT > 3 && G.rng() < dt * 0.5) G.audio.honk();
    } else car.waitT = 0;
    car.speed += (target - car.speed) * Math.min(1, dt * 1.8);
    if (car.speed < 0) car.speed = 0;
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    // Stay in the lane: snap back toward the road centre line.
    if (car.lane === 'v') {
      const road = nearestRoadCoord(V_ROADS, car.x);
      car.x += (road - car.x) * Math.min(1, dt * 2);
      car.y = ny;
      if (car.y < 110 || car.y > 2100) { car.dir *= -1; car.angle += Math.PI; }
    } else {
      const road = nearestRoadCoord(H_ROADS, car.y);
      car.y += (road - car.y) * Math.min(1, dt * 2);
      car.x = nx;
      if (car.x < 110 || car.x > 3090) { car.dir *= -1; car.angle += Math.PI; }
    }
    car.x = Math.max(60, Math.min(3140, car.x));
    car.y = Math.max(60, Math.min(2140, car.y));
  }
}

function nearestRoadCoord(list, v) {
  let best = list[0]; let bd = 1e9;
  for (const r of list) { const d = Math.abs(r - v); if (d < bd) { bd = d; best = r; } }
  return best;
}

function carAhead(G, car) {
  let best = null;
  for (const other of G.cars) {
    if (other === car || other.exploded) continue;
    const dx = other.x - car.x; const dy = other.y - car.y;
    const fwd = Math.cos(car.angle) * dx + Math.sin(car.angle) * dy;
    const side = Math.abs(-Math.sin(car.angle) * dx + Math.cos(car.angle) * dy);
    if (fwd > 0 && fwd < 90 && side < 24 && (best === null || fwd < best)) best = fwd;
  }
  return best;
}

function atLight(G, car) {
  // Near an intersection, check the light for this car's direction.
  for (const rx of V_ROADS) {
    for (const ry of H_ROADS) {
      const dx = rx - car.x; const dy = ry - car.y;
      const d = Math.hypot(dx, dy);
      if (d > 90 || d < 30) continue;
      const phase = lightPhase(G.time, V_ROADS.indexOf(rx), H_ROADS.indexOf(ry));
      const fwd = Math.cos(car.angle) * dx + Math.sin(car.angle) * dy;
      if (fwd <= 0) continue;
      if (car.lane === 'v' && phase !== 'green-v') return true;
      if (car.lane === 'h' && phase !== 'green-h') return true;
    }
  }
  return false;
}
