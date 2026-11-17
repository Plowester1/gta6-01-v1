// The Mara Voss story chain: 6 missions with objectives, markers,
// timers, rewards and fail states. Free-roam between missions; walk to
// the gold Mara marker to start the next one.
import { addWanted } from './player.js';
import { spawnCar } from './vehicles.js';

export const MISSIONS = [
  { name: 'First Wheels', type: 'drive', reward: 300,
    text: 'Mara needs wheels. Steal any car and bring it to the Marina lot.',
    target: { x: 1000, y: 2050 }, needCar: true },
  { name: 'The Pickup', type: 'pickup', reward: 450,
    text: 'Grab the package at the Harbor docks. Mara gives you a pistol first.',
    target: { x: 300, y: 1500 }, giveGun: true },
  { name: 'Tail Job', type: 'tail', reward: 600,
    text: 'Tail the grey sedan through Downtown. Stay close, do not spook him.',
    target: { x: 1400, y: 500 } },
  { name: 'Hot Wheels', type: 'escape', reward: 800,
    text: 'The police are onto you. Lose the heat — get wanted down to 0.',
    target: { x: 2200, y: 1100 } },
  { name: 'Deadline Delivery', type: 'deliver', reward: 1000,
    text: 'Deliver the crate to the Beachfront pier in 90 seconds.',
    target: { x: 2600, y: 2050 }, timer: 90 },
  { name: 'The Last Stand', type: 'shootout', reward: 1500,
    text: 'Rival crew at the Industrial yard. Take them all down.',
    target: { x: 2800, y: 800 }, enemies: 4 },
];

export function createMissionState() {
  return {
    index: 0, phase: 'idle', // idle | active | done
    objective: 'Find Mara Voss — follow the gold M on the map.',
    target: { x: 1400, y: 800 }, timer: 0, reward: 0,
    tailCar: null, tailDist: 0, tailTime: 0, enemies: [],
  };
}

export function maraSpot() {
  return { x: 1400, y: 800 };
}

export function startMission(G) {
  const m = G.mission;
  const def = MISSIONS[m.index];
  if (!def) return;
  m.phase = 'active';
  m.objective = def.text;
  m.target = { ...def.target };
  m.timer = def.timer || 0;
  m.reward = def.reward;
  m.tailTime = 0; m.enemies = [];
  if (def.giveGun) {
    G.player.armed = true;
    G.player.ammo = 24;
    G.message = 'Mara gave you a pistol. Click to shoot.';
  } else {
    G.message = `Mission: ${def.name}`;
  }
  G.messageT = 3;
  G.audio.mission();
  if (def.type === 'tail') {
    m.tailCar = spawnCar(G, 'sedan', def.target.x, def.target.y, 0, 'tail');
    m.tailCar.color = '#5a5a5a';
    m.tailCar.cruise = 150;
  }
  if (def.type === 'shootout') {
    for (let i = 0; i < def.enemies; i += 1) {
      m.enemies.push({
        x: def.target.x + (G.rng() - 0.5) * 300,
        y: def.target.y + (G.rng() - 0.5) * 300,
        health: 60, shootT: 1 + G.rng() * 2, alive: true, angle: 0,
      });
    }
  }
}

// Mission progress checks, run every step while a mission is active.
export function stepMissions(G, dt) {
  const m = G.mission;
  const p = G.player;
  const def = MISSIONS[m.index];
  if (!def) return;
  if (m.phase === 'idle') {
    // Standing on Mara's marker starts the next mission.
    if (Math.hypot(p.x - 1400, p.y - 800) < 46) startMission(G);
    return;
  }
  if (m.phase !== 'active') return;
  if (m.timer > 0) {
    m.timer -= dt;
    if (m.timer <= 0) { failMission(G, 'Out of time.'); return; }
  }
  const dTarget = Math.hypot(p.x - m.target.x, p.y - m.target.y);
  if (def.type === 'drive') {
    if (p.inCar && dTarget < 70) completeMission(G);
  } else if (def.type === 'pickup' || def.type === 'deliver') {
    if (dTarget < 60) completeMission(G);
  } else if (def.type === 'tail') {
    const t = m.tailCar;
    if (!t || t.exploded) { failMission(G, 'You lost the target.'); return; }
    // The tail car cruises along the avenue; keep within 260 units.
    t.angle = 0; t.speed = 150;
    t.x += Math.cos(t.angle) * t.speed * dt;
    if (t.x > 3050) t.x = 150;
    t.y = 500;
    m.tailDist = Math.hypot(p.x - t.x, p.y - t.y);
    if (m.tailDist < 260) m.tailTime += dt;
    else m.tailTime = Math.max(0, m.tailTime - dt);
    m.objective = `${def.text} (${Math.floor(m.tailTime)}/20s close)`;
    if (m.tailTime >= 20) completeMission(G);
  } else if (def.type === 'escape') {
    if (p.wanted <= 0) completeMission(G);
  } else if (def.type === 'shootout') {
    const alive = m.enemies.filter((e) => e.alive).length;
    m.objective = `${def.text} (${alive} left)`;
    if (alive === 0) completeMission(G);
  }
}

export function completeMission(G) {
  const m = G.mission;
  const p = G.player;
  p.cash += m.reward;
  G.stats.missionsDone += 1;
  G.message = `Mission complete! +$${m.reward}`;
  G.messageT = 3.5;
  G.audio.complete();
  if (m.tailCar) { m.tailCar.driver = 'traffic'; m.tailCar = null; }
  m.index += 1;
  if (m.index >= MISSIONS.length) {
    m.phase = 'done';
    m.objective = 'All missions done — Solmarina is yours. Free roam!';
    G.message = 'All 6 missions done! You run Solmarina now.';
  } else {
    m.phase = 'idle';
    m.objective = 'Find Mara Voss — follow the gold M on the map.';
    m.target = { x: 1400, y: 800 };
  }
}

export function failMission(G, why) {
  const m = G.mission;
  G.message = `Mission failed: ${why}`;
  G.messageT = 3;
  G.audio.fail();
  if (m.tailCar) { m.tailCar.driver = 'traffic'; m.tailCar = null; }
  m.phase = 'idle';
  m.objective = 'Find Mara Voss — follow the gold M on the map.';
  m.target = { x: 1400, y: 800 };
  addWanted(G, 1);
}
