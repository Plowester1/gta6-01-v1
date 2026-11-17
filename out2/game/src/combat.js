// Combat: pistol shooting with mouse aim, bullets, muzzle flash, ammo,
// enemy health, and ammo pickups. Enemies (mission rivals) shoot back.
import { PISTOL_DAMAGE } from './config.js';
import { addWanted } from './player.js';

const BULLET_SPEED = 900;
const FIRE_COOLDOWN = 0.28;

export function stepCombat(G, dt, input) {
  const p = G.player;
  if (G.fireCd > 0) G.fireCd -= dt;
  if (p.armed && !p.inCar && input.mouseDown && G.fireCd <= 0) {
    if (p.ammo <= 0) { G.audio.empty(); G.fireCd = 0.4; return; }
    p.ammo -= 1;
    G.fireCd = FIRE_COOLDOWN;
    const a = p.angle;
    G.bullets.push({
      x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 22,
      vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED,
      life: 0.9, fromPlayer: true,
    });
    G.muzzleT = 0.08;
    G.gunshotT = 1.5;
    G.audio.shot();
    if (p.wantedFloat < 1) addWanted(G, 1);
  }
  for (let i = G.bullets.length - 1; i >= 0; i -= 1) {
    const b = G.bullets[i];
    b.life -= dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    let dead = b.life <= 0;
    if (!dead) {
      // Hit a pedestrian, a cop, or a mission enemy.
      for (const ped of G.peds) {
        if (ped.alive && Math.hypot(ped.x - b.x, ped.y - b.y) < 14) {
          ped.alive = false; dead = true;
          if (b.fromPlayer) addWanted(G, 1);
          break;
        }
      }
    }
    if (!dead) {
      for (const cop of G.cops) {
        if (cop.health > 0 && Math.hypot(cop.x - b.x, cop.y - b.y) < 16) {
          cop.health -= PISTOL_DAMAGE; dead = true;
          if (b.fromPlayer) addWanted(G, 2);
          if (cop.health <= 0) { G.message = 'Cop down!'; G.messageT = 2; }
          break;
        }
      }
    }
    if (!dead) {
      for (const e of G.mission.enemies) {
        if (e.alive && Math.hypot(e.x - b.x, e.y - b.y) < 16) {
          e.health -= PISTOL_DAMAGE; dead = true;
          if (e.health <= 0) { e.alive = false; G.audio.hit(); }
          break;
        }
      }
    }
    if (!dead && b.fromPlayer === false) {
      if (Math.hypot(p.x - b.x, p.y - b.y) < 14 && p.invuln <= 0) {
        p.health -= 12; p.invuln = 0.5; dead = true;
        G.audio.hit(); G.shake = 4;
        if (p.health <= 0) { G.screen = 'over'; G.bustedReason = 'Wasted in a shootout.'; }
      }
    }
    if (dead) G.bullets.splice(i, 1);
  }
  if (G.muzzleT > 0) G.muzzleT -= dt;
  if (G.gunshotT > 0) G.gunshotT -= dt;
  stepEnemies(G, dt);
}

function stepEnemies(G, dt) {
  const p = G.player;
  for (const e of G.mission.enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    e.angle = Math.atan2(p.y - e.y, p.x - e.x);
    if (d > 300) { e.x += Math.cos(e.angle) * 90 * dt; e.y += Math.sin(e.angle) * 90 * dt; }
    e.shootT -= dt;
    if (e.shootT <= 0 && d < 420) {
      e.shootT = 1.2 + G.rng() * 1.2;
      G.bullets.push({
        x: e.x + Math.cos(e.angle) * 20, y: e.y + Math.sin(e.angle) * 20,
        vx: Math.cos(e.angle) * 700, vy: Math.sin(e.angle) * 700,
        life: 1.1, fromPlayer: false,
      });
      G.audio.shot();
    }
  }
  // Ammo pickups: walk over one to reload.
  for (let i = G.pickups.length - 1; i >= 0; i -= 1) {
    const pk = G.pickups[i];
    if (Math.hypot(p.x - pk.x, p.y - pk.y) < 24) {
      p.ammo += 12;
      G.pickups.splice(i, 1);
      G.message = 'Picked up ammo +12'; G.messageT = 2;
      G.audio.pickup();
    }
  }
}

export function spawnAmmo(G, x, y) {
  G.pickups.push({ x, y, kind: 'ammo' });
}
