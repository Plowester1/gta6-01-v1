// Pedestrians: walk the sidewalks, cross at intersections, flee from
// gunshots and speeding cars, and sometimes get into a parked car and
// drive off. They keep the sidewalks alive.
import { H_ROADS, V_ROADS, isRoad } from './city.js';
import { addWanted } from './player.js';
import { pick, range } from './random.js';

const SHIRTS = ['#d94f70', '#4f8ad9', '#e0a53a', '#5aa86a', '#8a5ad9', '#d9d9d9', '#3a3a3a'];

export function spawnPeds(G, n) {
  for (let i = 0; i < n; i += 1) {
    const x = 150 + G.rng() * 2900;
    const y = 150 + G.rng() * 1900;
    G.peds.push({
      x, y, vx: 0, vy: 0, angle: G.rng() * Math.PI * 2,
      speed: range(G.rng, 40, 80), shirt: pick(G.rng, SHIRTS),
      alive: true, health: 50, flee: 0, waitT: range(G.rng, 0, 3),
      tx: x, ty: y,
    });
  }
}

function pickSidewalkTarget(G, ped) {
  // Walk along a sidewalk: pick a point on a nearby road's edge.
  const vertical = G.rng() < 0.5;
  if (vertical) {
    const rx = pick(G.rng, V_ROADS);
    ped.tx = rx + (G.rng() < 0.5 ? -62 : 62);
    ped.ty = 120 + G.rng() * 1950;
  } else {
    const ry = pick(G.rng, H_ROADS);
    ped.tx = 120 + G.rng() * 2950;
    ped.ty = ry + (G.rng() < 0.5 ? -62 : 62);
  }
}

export function stepPeds(G, dt) {
  const p = G.player;
  for (const ped of G.peds) {
    if (!ped.alive) continue;
    if (ped.flee > 0) ped.flee -= dt;
    else {
      // Flee a nearby speeding car or the player's car.
      const car = p.inCar;
      if (car && Math.hypot(car.x - ped.x, car.y - ped.y) < 90 && Math.abs(car.speed) > 150) ped.flee = 2;
      if (G.gunshotT > 0 && Math.hypot(p.x - ped.x, p.y - ped.y) < 320) ped.flee = 3;
    }
    if (ped.waitT > 0) { ped.waitT -= dt; continue; }
    if (Math.hypot(ped.tx - ped.x, ped.ty - ped.y) < 16) {
      if (G.rng() < 0.01) pickSidewalkTarget(G, ped);
      else ped.waitT = range(G.rng, 0.5, 3);
      continue;
    }
    let dx = ped.tx - ped.x; let dy = ped.ty - ped.y;
    if (ped.flee > 0) {
      // Run away from the player.
      dx = ped.x - p.x; dy = ped.y - p.y;
    }
    const len = Math.hypot(dx, dy) || 1;
    const sp = ped.flee > 0 ? ped.speed * 2.6 : ped.speed;
    ped.vx = (dx / len) * sp; ped.vy = (dy / len) * sp;
    ped.x += ped.vx * dt; ped.y += ped.vy * dt;
    ped.angle = Math.atan2(ped.vy, ped.vx);
    // Keep off the road centre unless crossing: nudge back to the edge.
    if (isRoad(ped.x, ped.y) && ped.flee <= 0) {
      ped.x += (G.rng() - 0.5) * 4;
    }
    // Hit by a fast car: run over.
    for (const car of G.cars) {
      if (car.exploded || Math.abs(car.speed) < 80) continue;
      if (Math.hypot(car.x - ped.x, car.y - ped.y) < 24) {
        ped.alive = false;
        ped.vx = Math.cos(car.angle) * 300; ped.vy = Math.sin(car.angle) * 300;
        if (car.driver === 'player') {
          addWanted(G, 1);
          G.message = 'You hit a pedestrian!'; G.messageT = 2;
        }
        G.audio.thud();
      }
    }
  }
}
