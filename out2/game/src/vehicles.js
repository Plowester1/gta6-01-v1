// Vehicles: spawning, arcade driving physics, collisions with buildings
// and other cars, damage (smoke, then fire, then explosion), and skid marks.
import { VEHICLES, VEHICLE_SIZE } from './config.js';
import { hitsBuilding } from './city.js';
import { pick } from './random.js';

let nextId = 1;

export function spawnCar(G, type, x, y, angle, driver) {
  const def = VEHICLES[type];
  const [len, wid] = VEHICLE_SIZE[type];
  const car = {
    id: nextId, type, typeName: def.name, x, y, angle, speed: 0,
    color: pick(G.rng, def.colors), len, wid, driver: driver || 'parked',
    hp: 100, smoke: 0, fire: 0, exploded: false, explodeT: 0,
    brake: false, steer: 0, honkT: 0,
  };
  nextId += 1;
  G.cars.push(car);
  return car;
}

export function driveCar(G, car, dt, input) {
  const def = VEHICLES[car.type];
  const axis = input.axis();
  const throttle = axis.y < 0 ? 1 : 0; // W / Up = forward
  const reverse = axis.y > 0 ? 1 : 0;
  const handbrake = input.down('Space');
  if (throttle) car.speed += def.accel * dt;
  else if (reverse) car.speed -= def.accel * 0.7 * dt;
  else car.speed *= Math.pow(0.35, dt);
  if (handbrake) car.speed *= Math.pow(0.05, dt);
  car.speed = Math.max(-def.maxSpeed * 0.45, Math.min(def.maxSpeed, car.speed));
  if (Math.abs(car.speed) > 20) {
    const steer = axis.x * def.turn * (car.speed > 0 ? 1 : -1);
    car.angle += steer * dt * Math.min(1, Math.abs(car.speed) / 120);
  }
  car.steer = axis.x;
  car.brake = handbrake;
  moveCar(G, car, dt, true);
}

function moveCar(G, car, dt, playerDriven) {
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  if (hitsBuilding(G.city, nx, ny, 20)) {
    if (Math.abs(car.speed) > 120) {
      damageCar(G, car, Math.abs(car.speed) * 0.09);
      G.shake = Math.min(10, Math.abs(car.speed) * 0.02);
      if (playerDriven) G.audio.crash();
    }
    car.speed *= -0.25;
    return;
  }
  // Car-to-car bump.
  for (const other of G.cars) {
    if (other === car || other.exploded) continue;
    const d = Math.hypot(other.x - nx, other.y - ny);
    if (d < (car.len + other.len) / 2 - 6) {
      if (Math.abs(car.speed) > 100) {
        damageCar(G, car, 8); damageCar(G, other, 8);
        if (playerDriven) { G.shake = 6; G.audio.crash(); }
      }
      car.speed *= 0.4;
      return;
    }
  }
  car.x = nx; car.y = ny;
  // Skid marks at speed with steering or handbrake.
  if (playerDriven && Math.abs(car.speed) > 200 && (Math.abs(car.steer) > 0.4 || car.brake)) {
    G.skid.push({ x: car.x, y: car.y, angle: car.angle, life: 6 });
    if (G.skid.length > 400) G.skid.shift();
  }
}

// Car damage states and explosions: smoke under 60 hp, fire under 30,
// explosion at 0 that hurts anyone nearby and leaves a wreck.
export function damageCar(G, car, amount) {
  if (car.exploded) return;
  car.hp -= amount;
  if (car.hp <= 60) car.smoke = 1;
  if (car.hp <= 30) car.fire = 1;
  if (car.hp <= 0) explodeCar(G, car);
}

export function explodeCar(G, car) {
  car.exploded = true;
  car.explodeT = 0.9;
  car.speed = 0;
  G.shake = 14;
  G.audio.explosion();
  spawnExplosion(G, car.x, car.y);
  const p = G.player;
  if (p.inCar === car) {
    p.inCar = null;
    p.health -= 45;
    p.x = car.x + 40; p.y = car.y + 40;
    G.message = 'Your car blew up!'; G.messageT = 2.5;
  } else if (Math.hypot(p.x - car.x, p.y - car.y) < 90) {
    p.health -= 30;
    G.message = 'Caught in the blast!'; G.messageT = 2;
  }
  for (const ped of G.peds) {
    if (ped.alive && Math.hypot(ped.x - car.x, ped.y - car.y) < 100) ped.alive = false;
  }
  if (car.driver === 'traffic') car.driver = 'wreck';
}

export function spawnExplosion(G, x, y) {
  for (let i = 0; i < 26; i += 1) {
    const a = G.rng() * Math.PI * 2;
    const sp = 60 + G.rng() * 260;
    G.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0.5 + G.rng() * 0.7, max: 1.2, size: 4 + G.rng() * 9,
      color: ['#ff9a2a', '#ff5a1a', '#ffd23a', '#555'][Math.floor(G.rng() * 4)],
    });
  }
}

export function stepParticles(G, dt) {
  for (let i = G.particles.length - 1; i >= 0; i -= 1) {
    const pt = G.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vx *= 0.96; pt.vy *= 0.96;
    if (pt.life <= 0) G.particles.splice(i, 1);
  }
  for (let i = G.skid.length - 1; i >= 0; i -= 1) {
    G.skid[i].life -= dt;
    if (G.skid[i].life <= 0) G.skid.splice(i, 1);
  }
  for (const car of G.cars) {
    if (car.exploded) continue;
    if (car.smoke && G.rng() < 0.3) {
      G.particles.push({ x: car.x, y: car.y, vx: 0, vy: -40, life: 0.8, max: 0.8, size: 6, color: '#888' });
    }
    if (car.fire && G.rng() < 0.5) {
      G.particles.push({ x: car.x, y: car.y, vx: (G.rng() - 0.5) * 40, vy: -60, life: 0.5, max: 0.5, size: 7, color: '#ff7a1a' });
      damageCar(G, car, 4 * dt);
    }
  }
}
