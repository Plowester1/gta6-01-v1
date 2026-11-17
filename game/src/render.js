// Drawing only: the world, the camera, lighting and the screens.
// The camera follows the player (or their car); the world is drawn in
// world units and scaled by the camera zoom.
import { FONT, PALETTE, ROAD_W, WORLD } from './config.js';
import { BEACH_Y, H_ROADS, V_ROADS, WATER_Y, districtAt, lightPhase } from './city.js';
import { drawHud } from './hud.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_BUSTED = 'busted';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { w: 1280, h: 720, zoom: 1 };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    view.w = window.innerWidth;
    view.h = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const fonts = new Map();
  function text(value, x, y, size, color, align, bold) {
    const key = size + (bold ? 'b' : '');
    if (!fonts.has(key)) fonts.set(key, `${bold ? 'bold ' : ''}${size}px ${FONT}`);
    ctx.font = fonts.get(key);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.fillText(value, x, y);
  }

  function drawGround(G) {
    // Base grass.
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    // Patchy grass variation.
    ctx.fillStyle = PALETTE.grass2;
    for (let i = 0; i < 60; i += 1) {
      const gx = (i * 397) % WORLD.width;
      const gy = (i * 211) % 2100;
      ctx.fillRect(gx, gy, 180, 120);
    }
    // Beach sand + water.
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(0, BEACH_Y, WORLD.width, WATER_Y - BEACH_Y);
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(0, WATER_Y, WORLD.width, WORLD.height - WATER_Y);
    ctx.fillStyle = PALETTE.waterDeep;
    for (let i = 0; i < 24; i += 1) {
      const wx = (i * 271) % WORLD.width;
      ctx.fillRect(wx, WATER_Y + 30 + (i % 3) * 24, 120, 5);
    }
    // Downtown plaza.
    ctx.fillStyle = PALETTE.plaza;
    ctx.fillRect(1150, 550, 200, 200);
  }

  function drawRoads(G) {
    ctx.fillStyle = PALETTE.sidewalk;
    for (const rx of V_ROADS) ctx.fillRect(rx - ROAD_W / 2 - 12, 0, ROAD_W + 24, BEACH_Y);
    for (const ry of H_ROADS) ctx.fillRect(0, ry - ROAD_W / 2 - 12, WORLD.width, ROAD_W + 24);
    ctx.fillStyle = PALETTE.road;
    for (const rx of V_ROADS) ctx.fillRect(rx - ROAD_W / 2, 0, ROAD_W, BEACH_Y);
    for (const ry of H_ROADS) ctx.fillRect(0, ry - ROAD_W / 2, WORLD.width, ROAD_W);
    // Beach road.
    ctx.fillRect(0, BEACH_Y - 20, WORLD.width, 66);
    // Lane dashes.
    ctx.fillStyle = PALETTE.lane;
    for (const rx of V_ROADS) {
      for (let y = 40; y < BEACH_Y; y += 64) ctx.fillRect(rx - 2, y, 4, 30);
    }
    for (const ry of H_ROADS) {
      for (let x = 40; x < WORLD.width; x += 64) ctx.fillRect(x, ry - 2, 30, 4);
    }
    // Traffic lights at intersections.
    for (let ix = 0; ix < V_ROADS.length; ix += 1) {
      for (let iy = 0; iy < H_ROADS.length; iy += 1) {
        const phase = lightPhase(G.time, ix, iy);
        const lx = V_ROADS[ix] + ROAD_W / 2 + 8;
        const ly = H_ROADS[iy] - ROAD_W / 2 - 8;
        ctx.fillStyle = '#222';
        ctx.fillRect(lx - 3, ly - 14, 6, 28);
        ctx.fillStyle = phase === 'green-v' ? '#4fd66a' : '#e5534b';
        ctx.beginPath(); ctx.arc(lx, ly - 7, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = phase === 'green-h' ? '#4fd66a' : '#e5534b';
        ctx.beginPath(); ctx.arc(lx, ly + 7, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

// Buildings, parks, palms, containers and the pier (render.js part 2).
function drawCity(G) {
  const city = G.city;
  // Parks.
  for (const park of city.parks) {
    ctx.fillStyle = '#6aa84f';
    ctx.fillRect(park.x, park.y, park.w, park.h);
    ctx.fillStyle = '#2e7d32';
    for (let i = 0; i < park.trees; i += 1) {
      const tx = park.x + 20 + ((i * 67) % Math.max(20, park.w - 40));
      const ty = park.y + 20 + ((i * 41) % Math.max(20, park.h - 40));
      ctx.beginPath(); ctx.arc(tx, ty, 12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#d8c690';
    ctx.beginPath(); ctx.arc(park.x + park.w / 2, park.y + park.h / 2, 16, 0, Math.PI * 2); ctx.fill();
  }
  // Harbor containers.
  for (const c of city.containers) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(c.x + 4, c.y + 4, c.w, c.h);
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let x = c.x + 8; x < c.x + c.w; x += 14) ctx.fillRect(x, c.y + 3, 3, c.h - 6);
  }
  // Buildings with shadows and roofs.
  for (const b of city.buildings) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(b.x + 10, b.y + 12, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
    if (b.tall) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let wx = b.x + 14; wx < b.x + b.w - 12; wx += 26) {
        for (let wy = b.y + 14; wy < b.y + b.h - 12; wy += 26) ctx.fillRect(wx, wy, 10, 8);
      }
      ctx.fillStyle = '#c9d6e2';
      ctx.fillRect(b.x + b.w / 2 - 12, b.y + b.h / 2 - 12, 24, 24);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(b.x + b.w / 2 - 3, b.y + 8, 6, b.h - 16);
    }
  }
  // Pier into the water.
  ctx.fillStyle = '#8a6a42';
  ctx.fillRect(2550, BEACH_Y + 10, 90, 260);
  ctx.fillStyle = '#6e5232';
  for (let y = BEACH_Y + 20; y < WATER_Y + 90; y += 22) ctx.fillRect(2550, y, 90, 4);
  ctx.fillStyle = '#d94f70';
  ctx.beginPath(); ctx.arc(2595, WATER_Y + 100, 12, 0, Math.PI * 2); ctx.fill();
  // Palms.
  for (const palm of city.palms) {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(palm.x - 2, palm.y - 8, 4, 12);
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath(); ctx.arc(palm.x, palm.y - 10, 10 * palm.s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#57b368';
    ctx.beginPath(); ctx.arc(palm.x - 4, palm.y - 13, 6 * palm.s, 0, Math.PI * 2); ctx.fill();
  }
  // District labels on the ground.
  ctx.textAlign = 'center';
  text('DOWNTOWN', 700, 320, 34, 'rgba(255,255,255,0.35)', 'center', true);
  text('HARBOR', 300, 1600, 30, 'rgba(255,255,255,0.3)', 'center', true);
  text('OLD TOWN', 1800, 1800, 30, 'rgba(255,255,255,0.3)', 'center', true);
  text('BEACHFRONT', 1600, 2220, 30, 'rgba(255,255,255,0.45)', 'center', true);
}

// Cars, pedestrians, the player, markers and particles (render.js part 3).
function drawCar(car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-car.len / 2 + 4, -car.wid / 2 + 5, car.len, car.wid);
  if (car.exploded) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-car.len / 2, -car.wid / 2, car.len, car.wid);
    ctx.restore();
    return;
  }
  ctx.fillStyle = '#111';
  ctx.fillRect(-car.len / 2 + 2, -car.wid / 2 - 3, 10, 5);
  ctx.fillRect(-car.len / 2 + 2, car.wid / 2 - 2, 10, 5);
  ctx.fillRect(car.len / 2 - 12, -car.wid / 2 - 3, 10, 5);
  ctx.fillRect(car.len / 2 - 12, car.wid / 2 - 2, 10, 5);
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.roundRect(-car.len / 2, -car.wid / 2, car.len, car.wid, 6);
  ctx.fill();
  ctx.fillStyle = '#bfe3f2';
  ctx.fillRect(-4, -car.wid / 2 + 3, 14, car.wid - 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(car.len / 2 - 14, -car.wid / 2 + 3, 8, car.wid - 6);
  if (car.type === 'police') {
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(-car.len / 2 + 6, -car.wid / 2, car.len - 12, 5);
    ctx.fillStyle = '#1c2733';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', 0, 3);
    const flash = Math.floor(performance.now() / 180) % 2 === 0;
    ctx.fillStyle = flash ? '#ff2a2a' : '#2a7bff';
    ctx.beginPath(); ctx.arc(-2, -car.wid / 2 - 1, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#2a7bff' : '#ff2a2a';
    ctx.beginPath(); ctx.arc(8, -car.wid / 2 - 1, 4, 0, Math.PI * 2); ctx.fill();
  }
  if (car.type === 'taxi') {
    ctx.fillStyle = '#111';
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, 3);
  }
  ctx.restore();
}

function drawWorld(G) {
  drawGround(G);
  drawRoads(G);
  drawCity(G);
  // Skid marks.
  ctx.strokeStyle = 'rgba(20,20,20,0.5)';
  ctx.lineWidth = 4;
  for (const s of G.skid) {
    ctx.beginPath();
    ctx.moveTo(s.x - Math.cos(s.angle) * 14, s.y - Math.sin(s.angle) * 14);
    ctx.lineTo(s.x + Math.cos(s.angle) * 14, s.y + Math.sin(s.angle) * 14);
    ctx.stroke();
  }
  // Ammo pickups.
  for (const pk of G.pickups) {
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(pk.x - 10, pk.y - 8, 20, 16);
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMMO', pk.x, pk.y + 4);
  }
  // Mission / Mara marker beacon.
  const t = G.mission.target;
  const bob = Math.sin(G.time * 3) * 4;
  ctx.fillStyle = 'rgba(255, 210, 58, 0.18)';
  ctx.fillRect(t.x - 26, t.y - 90 + bob, 52, 180);
  ctx.fillStyle = '#ffd23a';
  ctx.save();
  ctx.translate(t.x, t.y - 40 + bob);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-12, -12, 24, 24);
  ctx.restore();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(G.mission.phase === 'idle' ? 'M' : '★', t.x, t.y - 35 + bob);
  for (const car of G.cars) drawCar(car);
  // Pedestrians.
  for (const ped of G.peds) {
    if (!ped.alive) continue;
    ctx.fillStyle = ped.shirt;
    ctx.beginPath(); ctx.arc(ped.x, ped.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath(); ctx.arc(ped.x + Math.cos(ped.angle) * 3, ped.y + Math.sin(ped.angle) * 3, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  // Mission enemies.
  for (const e of G.mission.enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = '#a02020';
    ctx.beginPath(); ctx.arc(e.x, e.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(e.x - 8, e.y - 16, 16, 4);
    ctx.fillStyle = '#e5534b';
    ctx.fillRect(e.x - 8, e.y - 16, 16 * Math.max(0, e.health) / 60, 4);
  }
  // Foot cops.
  for (const cop of G.cops) {
    if (cop.kind !== 'foot' || cop.health <= 0) continue;
    ctx.fillStyle = '#1c3a5a';
    ctx.beginPath(); ctx.arc(cop.x, cop.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4f8ad9';
    ctx.beginPath(); ctx.arc(cop.x, cop.y - 3, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  // Bullets.
  ctx.fillStyle = '#ffe14a';
  for (const b of G.bullets) {
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  drawPlayer(G);
  // Particles.
  for (const pt of G.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Warm sun tint.
  ctx.fillStyle = 'rgba(255, 214, 130, 0.07)';
  ctx.fillRect(G.camera.x - 100, G.camera.y - 100, view.w / view.zoom + 200, view.h / view.zoom + 200);
}

// The player figure, the screens, and the frame entry point (render.js part 4).
function drawPlayer(G) {
  const p = G.player;
  if (p.inCar) return;
  if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a6fd2';
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath(); ctx.arc(4, 0, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(6, -2, 10, 4);
  if (p.armed) {
    ctx.fillStyle = '#333';
    ctx.fillRect(8, -2, 12, 4);
  }
  if (p.punchT > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(16, 0, 8, -0.8, 0.8); ctx.stroke();
  }
  ctx.restore();
  if (G.muzzleT > 0) {
    ctx.fillStyle = '#ffe14a';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.angle) * 26, p.y + Math.sin(p.angle) * 26, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Health ring when hurt.
  if (p.health < 100) {
    ctx.strokeStyle = '#e5534b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.health / 100); ctx.stroke();
  }
}

function drawPanel(title, lines, prompt, accent) {
  const w = 640;
  const h = 150 + lines.length * 30 + 70;
  const x = (view.w - w) / 2;
  const y = (view.h - h) / 2;
  ctx.fillStyle = 'rgba(8, 16, 24, 0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent || '#ffd23a';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center';
  text(title, view.w / 2, y + 64, 46, '#ffd23a', 'center', true);
  for (let i = 0; i < lines.length; i += 1) {
    text(lines[i], view.w / 2, y + 118 + i * 30, 19, '#e8eef4', 'center');
  }
  text(prompt, view.w / 2, y + h - 32, 21, '#8fd6ff', 'center', true);
}

function updateCamera(G) {
  if (G.cameraLock) return;
  const p = G.player;
  const fx = p.inCar ? p.inCar.x : p.x;
  const fy = p.inCar ? p.inCar.y : p.y;
  const zoom = G.camera.zoom;
  const tx = fx - view.w / zoom / 2;
  const ty = fy - view.h / zoom / 2;
  G.camera.x += (tx - G.camera.x) * 0.12;
  G.camera.y += (ty - G.camera.y) * 0.12;
  G.camera.x = Math.max(-60, Math.min(WORLD.width - view.w / zoom + 60, G.camera.x));
  G.camera.y = Math.max(-60, Math.min(WORLD.height - view.h / zoom + 60, G.camera.y));
}

function draw(G, screen) {
  updateCamera(G);
  const zoom = G.camera.zoom;
  const shx = G.shake > 0 ? (G.rng() - 0.5) * G.shake : 0;
  const shy = G.shake > 0 ? (G.rng() - 0.5) * G.shake : 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0e1a24';
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.setTransform(zoom, 0, 0, zoom, (-G.camera.x + shx) * zoom, (-G.camera.y + shy) * zoom);
  drawWorld(G);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(G, ctx, view);
  if (screen === SCREEN_TITLE) {
    drawPanel('SOLMARINA', [
      'A sun-soaked coastal city. Steal cars, outrun the police,',
      'and run jobs for fixer Mara Voss — 6 missions, $3,650 in rewards.',
      'WASD / arrows: walk & drive · E: enter car · Space: punch / handbrake',
      'Mouse aim · Click: shoot · Shift: run · M: mute · Esc: pause',
      'Steal a car, hit a pedestrian or shoot, and the wanted stars rise.',
    ], 'Press Enter to start  ·  C continues a saved game', '#ffd23a');
  } else if (screen === SCREEN_PAUSED) {
    drawPanel('Paused', ['Solmarina waits for you.', 'Cash and missions are saved automatically.'], 'Press Esc or P to resume');
  } else if (screen === SCREEN_OVER) {
    drawPanel('WASTED', [G.bustedReason || 'Your health ran out.', `Cash kept: $${Math.floor(G.player.cash)} · Missions done: ${G.mission.index}/6`], 'Press Enter to try again', '#e5534b');
  } else if (screen === SCREEN_BUSTED) {
    drawPanel('BUSTED', [G.bustedReason || 'The police caught you.', `Cash kept: $${Math.floor(G.player.cash)} · Missions done: ${G.mission.index}/6`], 'Press Enter to try again', '#4f8ad9');
  }
}

return { draw, view };
}
