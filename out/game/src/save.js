// Save / load to localStorage: cash, missions done, player position,
// current car, ammo and wanted level. Loads on start when present.
import { SAVE_KEY } from './config.js';
import { spawnCar } from './vehicles.js';

export function saveGame(G) {
  try {
    const p = G.player;
    const data = {
      cash: p.cash, missionsDone: G.mission.index,
      x: p.x, y: p.y, health: p.health, ammo: p.ammo, armed: p.armed,
      wanted: p.wantedFloat, inCar: p.inCar ? p.inCar.type : null,
      carX: p.inCar ? p.inCar.x : 0, carY: p.inCar ? p.inCar.y : 0,
      time: G.time,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function loadGame(G) {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const p = G.player;
    p.cash = data.cash ?? 250;
    p.x = data.x ?? 1400; p.y = data.y ?? 900;
    p.health = data.health ?? 100;
    p.ammo = data.ammo ?? 0; p.armed = !!data.armed;
    p.wantedFloat = data.wanted ?? 0;
    p.wanted = Math.floor(p.wantedFloat);
    G.mission.index = data.missionsDone ?? 0;
    G.time = data.time ?? 0;
    if (data.inCar) {
      const car = spawnCar(G, data.inCar, data.carX, data.carY, 0, 'player');
      p.inCar = car;
    }
    return true;
  } catch { return false; }
}
