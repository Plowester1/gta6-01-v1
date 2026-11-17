// Police and the wanted system: stars 1-5, patrol cars that chase and
// ram, foot cops who pursue and bust the player on foot, roadblocks at
// 3+ stars, and wanted decay when the player is out of police sight.
import { WANTED_DECAY } from './config.js';
import { nearestRoadPoint } from './city.js';
import { spawnCar, explodeCar } from './vehicles.js';
import { range } from './random.js';

export function wantedTargetCount(wanted) {
  return wanted <= 0 ? 0 : wanted === 1 ? 1 : wanted === 2 ? 2 : wanted === 3 ? 3 : 4;
}

export function stepPolice(G, dt) {
  const p = G.player;
  // Decay one star every 20 s while no police can see the player.
  const seen = G.cops.some((c) => c.health > 0 && Math.hypot(c.x - p.x, c.y - p.y) < 420);
  if (!seen && p.wanted > 0) {
    G.decayT = (G.decayT || 0) + dt;
    if (G.decayT > 20) {
      G.decayT = 0;
      p.wanted -= 1;
      p.wantedFloat = p.wanted;
    }
  } else {
    G.decayT = 0;
  }
  if (p.wantedFloat > 0) G.policeAlert = Math.max(G.policeAlert, 2);
  if (G.policeAlert > 0) G.policeAlert -= dt;

  // Spawn police to match the wanted level.
  const want = wantedTargetCount(p.wanted);
  const alive = G.cops.filter((c) => c.health > 0).length;
  if (alive < want && G.spawnT <= 0) {
    spawnCop(G);
    G.spawnT = 2.5;
  }
  if (G.spawnT > 0) G.spawnT -= dt;

  for (const cop of G.cops) {
    if (cop.health <= 0) continue;
    if (cop.kind === 'car') stepCopCar(G, cop, dt);
    else stepCopFoot(G, cop, dt);
  }
  // Roadblocks at 3+ stars: a line of police cars ahead of the player.
  if (p.wanted >= 3 && G.roadblockT <= 0) {
    placeRoadblock(G);
    G.roadblockT = 25;
  }
  if (G.roadblockT > 0) G.roadblockT -= dt;
}

export function spawnCop(G) {
  const p = G.player;
  const near = nearestRoadPoint(p.x + range(G.rng, -500, 500), p.y + range(G.rng, -500, 500));
  if (G.player.inCar || G.rng() < 0.6) {
    const car = spawnCar(G, 'police', near.x, near.y, 0, 'police');
    car.angle = Math.atan2(p.y - near.y, p.x - near.x);
    G.cops.push({ kind: 'car', car, x: car.x, y: car.y, health: 100, sirenT: 0 });
  } else {
    G.cops.push({ kind: 'foot', x: near.x + 30, y: near.y + 30, health: 60, speed: 200, sirenT: 0 });
  }
  G.audio.siren();
}

function stepCopCar(G, cop, dt) {
  const car = cop.car;
  if (car.exploded) { cop.health = 0; return; }
  if (cop.roadblock) { cop.x = car.x; cop.y = car.y; return; }
  const p = G.player;
  const tx = p.inCar ? p.inCar.x : p.x;
  const ty = p.inCar ? p.inCar.y : p.y;
  const wantAngle = Math.atan2(ty - car.y, tx - car.x);
  let diff = wantAngle - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  car.angle += Math.max(-2.8 * dt, Math.min(2.8 * dt, diff));
  const d = Math.hypot(tx - car.x, ty - car.y);
  const target = d > 120 ? 380 : 300;
  car.speed += (target - car.speed) * Math.min(1, dt * 1.5);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  car.x = nx; car.y = ny;
  cop.x = car.x; cop.y = car.y;
  cop.sirenT -= dt;
  if (cop.sirenT <= 0) { G.audio.siren(); cop.sirenT = 4; }
  // Ram the player's car.
  if (p.inCar && d < 40) {
    p.inCar.hp -= 14 * dt * 10;
    if (p.inCar.hp <= 0 && !p.inCar.exploded) {
      explodeCar(G, p.inCar);
    }
    G.shake = 4;
  }
}

// Foot cops and roadblocks (second half of police.js).
export function stepCopFoot(G, cop, dt) {
  const p = G.player;
  const d = Math.hypot(p.x - cop.x, p.y - cop.y);
  const dx = (p.x - cop.x) / (d || 1);
  const dy = (p.y - cop.y) / (d || 1);
  cop.x += dx * cop.speed * dt;
  cop.y += dy * cop.speed * dt;
  cop.angle = Math.atan2(dy, dx);
  cop.sirenT -= dt;
  if (cop.sirenT <= 0) { G.audio.siren(); cop.sirenT = 5; }
  // Bust: caught on foot at close range while wanted.
  if (d < 26 && !p.inCar && p.wanted > 0) {
    G.screen = 'busted';
    G.bustedReason = 'Busted by the Solmarina police.';
    G.audio.busted();
  }
  // Foot cop punches the player when adjacent.
  if (d < 30 && p.invuln <= 0) {
    p.health -= 12;
    p.invuln = 0.8;
    G.shake = 5;
    G.audio.hit();
    if (p.health <= 0) { G.screen = 'over'; G.bustedReason = 'Wasted in a street fight.'; }
  }
}

function placeRoadblock(G) {
  const p = G.player;
  const car = p.inCar;
  if (!car) return;
  const fx = Math.cos(car.angle); const fy = Math.sin(car.angle);
  for (let i = -1; i <= 1; i += 1) {
    const bx = car.x + fx * 420 - fy * i * 60;
    const by = car.y + fy * 420 + fx * i * 60;
    const block = spawnCar(G, 'police', bx, by, car.angle + Math.PI / 2, 'roadblock');
    block.speed = 0;
    G.cops.push({ kind: 'car', car: block, x: bx, y: by, health: 100, sirenT: 0, roadblock: true });
  }
  G.message = 'Roadblock ahead!'; G.messageT = 2.5;
}
