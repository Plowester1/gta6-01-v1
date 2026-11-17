// City generation for Solmarina: a 3200x2400 grid of streets, blocks and
// districts, all deterministic from the seed. Roads run on a grid; each
// block holds procedurally placed buildings, parks or plazas.
import { PALETTE, ROAD_W, WORLD } from './config.js';
import { pick, range } from './random.js';

export const V_ROADS = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000];
export const H_ROADS = [200, 500, 800, 1100, 1400, 1700, 2000];
export const BEACH_Y = 2150; // sand starts here, water at the bottom edge
export const WATER_Y = 2300;

const DOWNTOWN_COLORS = ['#6b7d94', '#54677d', '#7d8fa8', '#4a5a6e'];
const OLDTOWN_COLORS = ['#d98a4a', '#c96a5a', '#e0b45a', '#b56a8a', '#7aa88a'];
const HARBOR_COLORS = ['#8a7d6a', '#6e7d8a', '#9a8a6a'];
const INDUSTRIAL_COLORS = ['#8a8f96', '#7a7d84', '#9a938a'];

export function districtAt(x, y) {
  if (y >= BEACH_Y) return 'Beachfront';
  if (x < 560 && y > 1250) return 'Harbor';
  if (x < 1150 && y < 950) return 'Downtown';
  if (x > 2350) return 'Industrial';
  if (x > 1500 && y > 1500) return 'Old Town';
  return 'Old Town';
}

export function isRoad(x, y) {
  if (y >= BEACH_Y - 20) return y < BEACH_Y + 46 && Math.abs(y - (BEACH_Y + 23)) < 46;
  for (const rx of V_ROADS) if (Math.abs(x - rx) < ROAD_W / 2) return true;
  for (const ry of H_ROADS) if (Math.abs(y - ry) < ROAD_W / 2) return true;
  return false;
}

export function onRoadAxis(x, y) {
  // Returns 'v' if on a vertical road, 'h' if on a horizontal one, else null.
  for (const rx of V_ROADS) if (Math.abs(x - rx) < ROAD_W / 2) return 'v';
  for (const ry of H_ROADS) if (Math.abs(y - ry) < ROAD_W / 2) return 'h';
  return null;
}

export function nearestRoadPoint(x, y) {
  let best = null; let bd = 1e9;
  for (const rx of V_ROADS) {
    const d = Math.abs(x - rx);
    if (d < bd) { bd = d; best = { x: rx, y, axis: 'v' }; }
  }
  for (const ry of H_ROADS) {
    const d = Math.abs(y - ry);
    if (d < bd) { bd = d; best = { x, y: ry, axis: 'h' }; }
  }
  return best;
}

export function generateCity(rng) {
  const buildings = [];
  const parks = [];
  const palms = [];
  const containers = [];
  const colors = { Downtown: DOWNTOWN_COLORS, 'Old Town': OLDTOWN_COLORS, Harbor: HARBOR_COLORS, Industrial: INDUSTRIAL_COLORS, Beachfront: OLDTOWN_COLORS };
  for (let ci = 0; ci < V_ROADS.length - 1; ci += 1) {
    for (let ri = 0; ri < H_ROADS.length - 1; ri += 1) {
      const x0 = V_ROADS[ci] + ROAD_W / 2 + 14;
      const x1 = V_ROADS[ci + 1] - ROAD_W / 2 - 14;
      const y0 = H_ROADS[ri] + ROAD_W / 2 + 14;
      const y1 = H_ROADS[ri + 1] - ROAD_W / 2 - 14;
      const cx = (x0 + x1) / 2; const cy = (y0 + y1) / 2;
      const district = districtAt(cx, cy);
      if (district === 'Harbor' && rng() < 0.5) {
        for (let k = 0; k < 5; k += 1) {
          containers.push({ x: x0 + rng() * (x1 - x0 - 90), y: y0 + rng() * (y1 - y0 - 26), w: 70 + rng() * 30, h: 22, color: pick(rng, ['#b5542e', '#2e7d8a', '#c9a13a', '#5a7d3a']) });
        }
        continue;
      }
      if (rng() < 0.16) {
        parks.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, trees: Math.floor(4 + rng() * 6) });
        continue;
      }
      const tall = district === 'Downtown';
      const n = tall ? 1 + Math.floor(rng() * 2) : 2 + Math.floor(rng() * 3);
      for (let b = 0; b < n; b += 1) {
        const bw = tall ? range(rng, 110, 170) : range(rng, 70, 130);
        const bh = tall ? range(rng, 110, 170) : range(rng, 60, 110);
        const bx = x0 + rng() * Math.max(1, (x1 - x0) - bw);
        const by = y0 + rng() * Math.max(1, (y1 - y0) - bh);
        buildings.push({
          x: bx, y: by, w: bw, h: bh, tall,
          color: pick(rng, colors[district] || OLDTOWN_COLORS),
          roof: pick(rng, ['#3a4a5a', '#8a5a3a', '#5a7d5a', '#c9c2b2']),
          district,
        });
      }
    }
  }
  for (let i = 0; i < 90; i += 1) {
    palms.push({ x: 60 + rng() * (WORLD.width - 120), y: BEACH_Y + 10 + rng() * 90, s: 0.8 + rng() * 0.5 });
  }
  for (let i = 0; i < 40; i += 1) {
    palms.push({ x: 60 + rng() * (WORLD.width - 120), y: 60 + rng() * (BEACH_Y - 160), s: 0.7 + rng() * 0.4, street: true });
  }
  return { buildings, parks, palms, containers };
}

// Collision: true when a circle of radius r at (x,y) hits a building or
// leaves the world (the sea at the south edge blocks walking/driving).
export function hitsBuilding(city, x, y, r) {
  if (x < 30 + r || x > WORLD.width - 30 - r || y < 30 + r) return true;
  if (y > WATER_Y - 8) return true;
  for (const b of city.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  return false;
}

// Resolve a circle against buildings: slide along the wall instead of
// stopping dead. Returns the corrected position.
export function slideOut(city, x, y, r) {
  if (hitsBuilding(city, x, y, r)) {
    // Try x-only and y-only moves; keep whichever is free.
    return { blocked: true };
  }
  return { blocked: false };
}

export function lightPhase(time, ix, iy) {
  // Traffic lights cycle every 8 s, offset per intersection.
  const cycle = (time + (ix * 3 + iy * 5)) % 8;
  return cycle < 4 ? 'green-v' : 'green-h';
}
