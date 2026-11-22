// main.js — the heist itself: loop, rules, alarm, loot, smoke, win/lose,
// and the ?shot= poses the screenshots are taken from.

import { W, H, LOOT, GUARDS, CAMERAS, SPAWN, EXIT, PLAYER_R, ALL_SOLIDS, moveCircle } from './level.js';
import { Guard, Camera } from './guards.js';
import { drawScene } from './render.js';
import { sfx } from './audio.js';
import { keys, bindInput, smokePressed } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

const s = {
  state: 'title', // title | playing | paused | caught | win
  time: 0,
  alarm: 0,
  maxAlarm: 0,
  lootGot: 0,
  lootTaken: {},
  smokeLeft: 2,
  smokes: [],
  player: { x: SPAWN.x, y: SPAWN.y, face: -Math.PI / 2, hidden: false },
  guards: GUARDS.map((g) => new Guard(g)),
  cameras: CAMERAS.map((c) => new Camera(c)),
  caughtBy: '',
  score: 0,
  objective: 'Steal the loot: 0/3 — then reach the EXIT',
  frozen: false, // a staged ?shot= pose: the world holds still for the camera
};

function reset() {
  s.state = 'playing';
  s.time = 0;
  s.alarm = 0;
  s.maxAlarm = 0;
  s.lootGot = 0;
  s.lootTaken = {};
  s.smokeLeft = 2;
  s.smokes = [];
  s.player = { x: SPAWN.x, y: SPAWN.y, face: -Math.PI / 2, hidden: false };
  s.guards = GUARDS.map((g) => new Guard(g));
  s.cameras = CAMERAS.map((c) => new Camera(c));
  s.caughtBy = '';
  s.score = 0;
  s.objective = 'Steal the loot: 0/3 — then reach the EXIT';
  s.frozen = false;
}

function objective() {
  if (s.lootGot >= LOOT.length) return 'All loot! Slip out the front door (EXIT)';
  return `Steal the loot: ${s.lootGot}/3 — then reach the EXIT`;
}

function update(dt) {
  if (s.state !== 'playing' || s.frozen) return;
  s.time += dt;
  const p = s.player;

  // --- move the thief (WASD / arrows), sliding along walls
  let dx = 0;
  let dy = 0;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    const sp = 2.4;
    const [nx, ny] = moveCircle(p.x, p.y, PLAYER_R, (dx / len) * sp, (dy / len) * sp, ALL_SOLIDS);
    p.x = nx;
    p.y = ny;
    p.face = Math.atan2(dy, dx);
  }

  // --- smoke bomb (E): a cloud that hides the thief
  if (smokePressed() && s.smokeLeft > 0) {
    s.smokeLeft--;
    s.smokes.push({ x: p.x, y: p.y, t: 4 });
    sfx.smoke();
  }
  for (const sm of s.smokes) sm.t -= dt;
  s.smokes = s.smokes.filter((sm) => sm.t > 0);
  p.hidden = s.smokes.some((sm) => Math.hypot(p.x - sm.x, p.y - sm.y) < 72);

  // --- watchers
  let spotted = null;
  for (const g of s.guards) {
    g.update(dt, p);
    if (g.seen) spotted = g.name;
  }
  for (const c of s.cameras) {
    c.update(dt, p);
    if (c.seen) spotted = spotted || 'A camera';
  }

  // --- the alarm: rises while seen, falls while hidden
  if (spotted) {
    s.alarm = Math.min(100, s.alarm + dt * 52);
    s.caughtBy = spotted;
    sfx.alarm(true);
  } else {
    s.alarm = Math.max(0, s.alarm - dt * 15);
    sfx.alarm(false);
  }
  s.maxAlarm = Math.max(s.maxAlarm, s.alarm);
  if (s.alarm >= 100) {
    s.state = 'caught';
    sfx.alarm(false);
    sfx.caught();
    return;
  }

  // --- loot: walk over it to take it
  for (const l of LOOT) {
    if (s.lootTaken[l.id]) continue;
    if (Math.hypot(p.x - l.x, p.y - l.y) < 26) {
      s.lootTaken[l.id] = true;
      s.lootGot++;
      sfx.pickup();
    }
  }
  s.objective = objective();

  // --- the getaway: all loot, then reach the front door
  if (s.lootGot >= LOOT.length && p.x > EXIT.x && p.x < EXIT.x + EXIT.w && p.y > EXIT.y - 10 && p.y < EXIT.y + EXIT.h + 10) {
    s.state = 'win';
    const timeBonus = Math.max(0, Math.round(240 - s.time)) * 5;
    const calmBonus = Math.round(100 - s.maxAlarm) * 5;
    s.score = 3000 + timeBonus + calmBonus;
    sfx.win();
  }
}

// --- ?shot= poses: the game's own states, held still for the screenshots --
function stageShot(name) {
  reset();
  s.frozen = true;
  if (name === 'title') {
    s.state = 'title';
    return;
  }
  if (name === 'win') {
    s.state = 'win';
    s.time = 83;
    s.lootGot = 3;
    for (const l of LOOT) s.lootTaken[l.id] = true;
    s.score = 4150;
    s.maxAlarm = 42;
    s.objective = objective();
    s.player.x = 480;
    s.player.y = 600;
    return;
  }
  if (name === 'hide') {
    // the thief flat against the gem case as Marco's cone sweeps past
    s.state = 'playing';
    s.player.x = 150;
    s.player.y = 248;
    s.player.face = Math.PI / 2;
    s.alarm = 55;
    s.time = 64;
    s.lootTaken.sapphire = true;
    s.lootGot = 1;
    s.objective = objective();
    const m = s.guards[0];
    m.x = 120; m.y = 320; m.facing = Math.PI / 2; m.target = 1;
    const r = s.guards[1];
    r.x = 420; r.y = 280; r.facing = Math.PI; r.target = 0;
    const d = s.guards[2];
    d.x = 840; d.y = 200; d.facing = -Math.PI / 2; d.target = 0;
    return;
  }
  // 'cover' (and anything else): the money shot — mid-heist, a cone on the
  // thief, the alarm half up, one piece already in the bag.
  s.state = 'playing';
  s.player.x = 480;
  s.player.y = 400;
  s.player.face = -Math.PI / 2;
  s.alarm = 35;
  s.maxAlarm = 35;
  s.time = 47;
  s.lootTaken.sapphire = true;
  s.lootGot = 1;
  s.objective = objective();
  const r = s.guards[1];
  r.x = 480; r.y = 280; r.facing = Math.PI / 2; r.alert = 2; r.seen = true;
  const m = s.guards[0];
  m.x = 120; m.y = 180; m.facing = Math.PI / 2; m.target = 1;
  const d = s.guards[2];
  d.x = 840; d.y = 420; d.facing = -Math.PI / 2; d.target = 0;
  s.caughtBy = 'Rosa';
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (s.state === 'title' && (keys.start)) {
    reset();
  } else if ((s.state === 'caught' || s.state === 'win') && keys.retry) {
    reset();
  } else if (s.state === 'playing' && keys.pause) {
    s.state = 'paused';
  } else if (s.state === 'paused' && keys.pause) {
    s.state = 'playing';
  }
  if (s.state === 'paused') {
    drawScene(ctx, s);
    ctx.fillStyle = 'rgba(5,8,18,0.6)';
    ctx.fillRect(0, HUD_H, W, H - HUD_H);
    ctx.fillStyle = '#e8c96a';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, 320);
    ctx.textAlign = 'left';
  } else {
    update(dt);
    drawScene(ctx, s);
  }
  requestAnimationFrame(frame);
}

bindInput();
canvas.addEventListener('click', () => {
  if (s.state === 'title') reset();
});
if (params.get('debug')) window.__game = s; // playtest hook: read-only state
if (shot) stageShot(shot);
requestAnimationFrame(frame);
