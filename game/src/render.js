// render.js — everything the eye sees: the museum, the cones, the thief,
// the loot, the smoke, and the HUD (alarm meter, loot, tools, timer).
// One frame must read as a heist at a glance: cover is safe, cones are
// danger, loot glows gold.

import { W, H, HUD_H, WALLS, COVER, LOOT, EXIT } from './level.js';

const FLOOR_A = '#171d33';
const FLOOR_B = '#131829';
const CARPET = '#5a1f2b';
const WALL_C = '#2c3550';
const GOLD = '#d9a441';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cone(ctx, x, y, facing, half, range, color, alpha) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - half, facing + half);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawScene(ctx, s) {
  drawFloor(ctx);
  drawExit(ctx, s);
  drawCover(ctx);
  drawLoot(ctx, s);
  drawSmoke(ctx, s);
  for (const c of s.cameras) cone(ctx, c.x, c.y, c.facing, c.halfAngle, c.range, c.color, c.seen ? 0.34 : 0.16);
  for (const g of s.guards) cone(ctx, g.x, g.y, g.facing, g.halfAngle, g.range, g.color, g.seen ? 0.38 : 0.17);
  for (const c of s.cameras) drawCamera(ctx, c);
  for (const g of s.guards) drawGuard(ctx, g);
  drawThief(ctx, s);
  drawHUD(ctx, s);
  if (s.state === 'title') drawTitle(ctx, s);
  if (s.state === 'caught') drawCaught(ctx, s);
  if (s.state === 'win') drawWin(ctx, s);
}

function drawFloor(ctx) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, HUD_H, W, H - HUD_H);
  // checker tiles
  ctx.fillStyle = FLOOR_B;
  const T = 46;
  for (let y = HUD_H; y < H; y += T) {
    for (let x = 0; x < W; x += T) {
      if (((x / T) | 0) % 2 === ((y / T) | 0) % 2) ctx.fillRect(x, y, T, T);
    }
  }
  // the red carpet runner down the middle
  ctx.fillStyle = CARPET;
  ctx.fillRect(440, HUD_H, 80, H - HUD_H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(440, HUD_H, 80, H - HUD_H);
  // wall trim
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 60, 920, 568);
}

function drawExit(ctx, s) {
  const open = s.lootGot === LOOT.length;
  ctx.fillStyle = open ? '#2f7d4f' : '#3a2f16';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = open ? '#7dff9e' : GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = open ? '#c9ffda' : '#e8c96a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT', EXIT.x + EXIT.w / 2, EXIT.y + 23);
  ctx.textAlign = 'left';
}

function drawCover(ctx) {
  for (const r of [...WALLS, ...COVER]) {
    if (r.kind === 'wall') {
      ctx.fillStyle = WALL_C;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    } else if (r.kind === 'vault') {
      ctx.fillStyle = '#3d3a28';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    } else if (r.kind === 'case') {
      ctx.fillStyle = '#232c49';
      rr(ctx, r.x, r.y, r.w, r.h, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,220,255,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(180,220,255,0.12)';
      rr(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 4);
      ctx.fill();
    } else if (r.kind === 'pillar') {
      ctx.fillStyle = '#39415f';
      ctx.beginPath();
      ctx.arc(r.x + 14, r.y + 14, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#4a3b22';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#8a6a35';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  }
}

function drawLoot(ctx, s) {
  const t = s.time;
  for (const l of LOOT) {
    if (s.lootTaken[l.id]) continue;
    const pulse = 1 + Math.sin(t * 4 + l.x) * 0.15;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = l.color;
    ctx.shadowColor = l.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(l.name, l.x, l.y - 20);
    ctx.textAlign = 'left';
  }
}

function drawSmoke(ctx, s) {
  for (const p of s.smokes) {
    ctx.fillStyle = 'rgba(200,205,220,0.4)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,225,240,0.35)';
    ctx.beginPath();
    ctx.arc(p.x - 22, p.y + 10, 42, 0, Math.PI * 2);
    ctx.arc(p.x + 24, p.y - 12, 46, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCamera(ctx, c) {
  ctx.fillStyle = '#222';
  ctx.fillRect(c.x - 9, c.y - 7, 18, 14);
  ctx.strokeStyle = c.seen ? '#ff3b30' : c.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x - 9, c.y - 7, 18, 14);
  ctx.fillStyle = c.seen ? '#ff3b30' : c.color;
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.facing) * 10, c.y + Math.sin(c.facing) * 10, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, g) {
  // body
  ctx.fillStyle = '#2b3a67';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7d8fc9';
  ctx.lineWidth = 2;
  ctx.stroke();
  // cap + face direction
  ctx.fillStyle = '#1b2547';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = g.seen ? '#ff3b30' : '#ffd94d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.facing) * 15, g.y + Math.sin(g.facing) * 15);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.name, g.x, g.y - 18);
  if (g.seen) {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('!', g.x, g.y - 30);
  }
  ctx.textAlign = 'left';
}

function drawThief(ctx, s) {
  const p = s.player;
  // a soft shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // hooded figure
  ctx.fillStyle = '#0e1424';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7ef0e0';
  ctx.lineWidth = 2;
  ctx.stroke();
  // pale mask + hat brim
  ctx.fillStyle = '#e8f4f2';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0e1424';
  ctx.fillRect(p.x - 9, p.y - 8, 18, 3);
  // facing tick
  ctx.strokeStyle = '#7ef0e0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.face) * 14, p.y + Math.sin(p.face) * 14);
  ctx.stroke();
}

function drawHUD(ctx, s) {
  ctx.fillStyle = '#0b0e1a';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(W, HUD_H);
  ctx.stroke();
  ctx.fillStyle = '#e8c96a';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('MIDNIGHT VAULT', 16, 32);
  // alarm meter
  const ax = 250;
  const aw = 300;
  ctx.fillStyle = '#2a0f16';
  rr(ctx, ax, 16, aw, 20, 6);
  ctx.fill();
  const frac = Math.max(0, Math.min(1, s.alarm / 100));
  ctx.fillStyle = frac > 0.66 ? '#ff3b30' : frac > 0.33 ? '#ff9f2e' : '#7dff9e';
  if (frac > 0) {
    rr(ctx, ax, 16, Math.max(12, aw * frac), 20, 6);
    ctx.fill();
  }
  ctx.strokeStyle = '#e8c96a';
  ctx.lineWidth = 1.5;
  rr(ctx, ax, 16, aw, 20, 6);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', ax + 8, 31);
  ctx.fillStyle = '#e8c96a';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`LOOT ${s.lootGot}/3`, 590, 32);
  ctx.fillText(`SMOKE ${s.smokeLeft}`, 690, 32);
  ctx.fillText(fmtTime(s.time), 800, 32);
  // objective line
  ctx.fillStyle = '#9aa7d6';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(s.objective, 16, 48);
}

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5,8,18,0.72)';
  ctx.fillRect(0, HUD_H, W, H - HUD_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, 250);
  ctx.fillStyle = '#e8ecff';
  ctx.font = '17px system-ui, sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 300 + i * 30));
  ctx.textAlign = 'left';
}

function drawTitle(ctx, s) {
  overlay(ctx, 'MIDNIGHT VAULT', [
    'A stealth heist in the museum after dark.',
    'Steal the Sapphire, the Vault Cash and the Golden Mask,',
    'then slip out the front door — unseen.',
    '',
    'Move: WASD / arrows    Smoke bomb: E (2 per run)    Pause: P',
    '',
    'Press ENTER or click to start',
  ], '#e8c96a');
}

function drawCaught(ctx, s) {
  overlay(ctx, 'CAUGHT!', [
    `${s.caughtBy} spotted you under the lights.`,
    `Loot taken: ${s.lootGot}/3   •   Time ${fmtTime(s.time)}`,
    '',
    'Press R to try again',
  ], '#ff3b30');
}

function drawWin(ctx, s) {
  overlay(ctx, 'GETAWAY!', [
    'All three pieces, out the front door, no one the wiser.',
    `Time ${fmtTime(s.time)}   •   Loot 3/3   •   Score ${s.score}`,
    '',
    'Press R to play again',
  ], '#7dff9e');
}
