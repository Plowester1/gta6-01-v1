// HUD + minimap: cash, wanted stars, health bar, ammo, mission objective,
// speedometer while driving, clock, message line, and a live minimap with
// the player blip, mission marker, police blips and car dots.
import { FONT, WORLD } from './config.js';

const MM = { x: 16, w: 190, h: 142 };

export function drawHud(G, ctx, view) {
  const p = G.player;
  const W = view.w; const H = view.h;
  ctx.save();
  ctx.textBaseline = 'top';
  // Top-left: cash + health.
  ctx.fillStyle = 'rgba(10, 18, 26, 0.72)';
  ctx.fillRect(12, 12, 210, 86);
  ctx.fillStyle = '#ffd23a';
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`$${Math.floor(p.cash)}`, 24, 20);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = `16px ${FONT}`;
  ctx.fillText(`Missions ${G.mission.index}/6`, 24, 52);
  // Health bar.
  ctx.fillStyle = '#333';
  ctx.fillRect(24, 76, 180, 12);
  ctx.fillStyle = p.health > 50 ? '#4fd66a' : p.health > 25 ? '#f2c230' : '#e5534b';
  ctx.fillRect(24, 76, 180 * Math.max(0, p.health) / 100, 12);
  // Top-right: wanted stars + clock.
  ctx.fillStyle = 'rgba(10, 18, 26, 0.72)';
  ctx.fillRect(W - 222, 12, 210, 58);
  ctx.fillStyle = p.wanted > 0 ? '#ffd23a' : '#5a6a7a';
  ctx.font = `bold 30px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('★'.repeat(p.wanted) + '☆'.repeat(5 - p.wanted), W - 24, 18);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = `16px ${FONT}`;
  const mins = 8 * 60 + Math.floor(G.time * 2);
  const hh = String(Math.floor(mins / 60) % 24).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  ctx.fillText(`${hh}:${mm}  ${G.district}`, W - 24, 50);
  // Mission objective line, top centre.
  ctx.fillStyle = 'rgba(10, 18, 26, 0.72)';
  const obj = G.mission.objective;
  ctx.font = `bold 17px ${FONT}`;
  const ow = ctx.measureText(obj).width + 32;
  ctx.fillRect((W - ow) / 2, 12, ow, 34);
  ctx.fillStyle = G.mission.phase === 'active' ? '#ffd23a' : '#8fd6ff';
  ctx.textAlign = 'center';
  ctx.fillText(obj, W / 2, 20);
  if (G.mission.timer > 0 && G.mission.phase === 'active') {
    ctx.fillStyle = '#ff6a4a';
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(`⏱ ${Math.ceil(G.mission.timer)}s`, W / 2, 50);
  }
  // Bottom-left: minimap.
  drawMinimap(G, ctx, view);
  // Bottom-right: speedometer + ammo / controls hint.
  if (p.inCar) {
    const kmh = Math.round(Math.abs(p.inCar.speed) * 0.36);
    ctx.fillStyle = 'rgba(10, 18, 26, 0.72)';
    ctx.fillRect(W - 172, H - 96, 160, 84);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 34px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${kmh}`, W - 44, H - 88);
    ctx.font = `15px ${FONT}`;
    ctx.fillStyle = '#c9d6e2';
    ctx.fillText('km/h', W - 24, H - 54);
    ctx.fillText(p.inCar.typeName, W - 24, H - 30);
  } else if (p.armed) {
    ctx.fillStyle = 'rgba(10, 18, 26, 0.72)';
    ctx.fillRect(W - 172, H - 60, 160, 48);
    ctx.fillStyle = '#ffd23a';
    ctx.font = `bold 22px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`Ammo ${p.ammo}`, W - 24, H - 48);
  }
  // Centre message.
  if (G.messageT > 0) {
    ctx.fillStyle = 'rgba(10, 18, 26, 0.8)';
    ctx.font = `bold 20px ${FONT}`;
    const mw = ctx.measureText(G.message).width + 36;
    ctx.fillRect((W - mw) / 2, H - 150, mw, 38);
    ctx.fillStyle = '#ffd23a';
    ctx.textAlign = 'center';
    ctx.fillText(G.message, W / 2, H - 141);
  }
  // Controls hint, bottom centre, small.
  ctx.fillStyle = 'rgba(232, 238, 244, 0.75)';
  ctx.font = `13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('WASD drive/walk · E enter car · Space punch/handbrake · Click shoot · M mute · Esc pause', W / 2, H - 22);
  ctx.restore();
}

// The minimap (second half of hud.js): a small live map of Solmarina with
// roads, the player blip, the mission marker, police blips and car dots.
export function drawMinimap(G, ctx, view) {
  const MMY = view.h - 158;
  const sx = MM.w / WORLD.width;
  const sy = MM.h / WORLD.height;
  const px = (x) => MM.x + x * sx;
  const py = (y) => MMY + y * sy;
  ctx.fillStyle = 'rgba(10, 18, 26, 0.78)';
  ctx.fillRect(MM.x - 4, MMY - 4, MM.w + 8, MM.h + 8);
  ctx.fillStyle = '#3f6b4a';
  ctx.fillRect(MM.x, MMY, MM.w, MM.h);
  ctx.fillStyle = '#2e8fa8';
  ctx.fillRect(MM.x, py(2300), MM.w, MM.h - (py(2300) - MMY));
  ctx.fillStyle = '#e8d29a';
  ctx.fillRect(MM.x, py(2150), MM.w, py(2300) - py(2150));
  ctx.strokeStyle = '#3c4148';
  ctx.lineWidth = 3;
  for (const rx of [200, 600, 1000, 1400, 1800, 2200, 2600, 3000]) {
    ctx.beginPath(); ctx.moveTo(px(rx), MMY); ctx.lineTo(px(rx), py(2150)); ctx.stroke();
  }
  for (const ry of [200, 500, 800, 1100, 1400, 1700, 2000]) {
    ctx.beginPath(); ctx.moveTo(MM.x, py(ry)); ctx.lineTo(MM.x + MM.w, py(ry)); ctx.stroke();
  }
  // Mission marker: gold diamond.
  const t = G.mission.target;
  ctx.fillStyle = '#ffd23a';
  ctx.save();
  ctx.translate(px(t.x), py(t.y));
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
  // Traffic cars: grey dots. Police: blue flashing dots.
  for (const car of G.cars) {
    if (car.exploded) continue;
    if (car.driver === 'police' || car.driver === 'roadblock') {
      ctx.fillStyle = Math.floor(G.time * 4) % 2 === 0 ? '#4f8ad9' : '#e5534b';
      ctx.beginPath(); ctx.arc(px(car.x), py(car.y), 3.5, 0, Math.PI * 2); ctx.fill();
    } else if (car.driver !== 'player') {
      ctx.fillStyle = '#c9c9c9';
      ctx.fillRect(px(car.x) - 1.5, py(car.y) - 1.5, 3, 3);
    }
  }
  // Player: white arrow.
  const p = G.player;
  ctx.save();
  ctx.translate(px(p.x), py(p.y));
  ctx.rotate(p.angle);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(7, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath();
  ctx.fill();
  ctx.restore();
  // North label.
  ctx.fillStyle = '#e8e8e8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('N', MM.x + 4, MMY + 12);
}
