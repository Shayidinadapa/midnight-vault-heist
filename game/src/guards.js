// guards.js — patrols, vision cones and the cameras that sweep them.
// A watcher spots the thief when the thief is inside its cone, in range,
// with a clear line of sight, and not hidden in smoke.

import { hasLineOfSight, GUARD_R } from './level.js';

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// One patrolling guard.
export class Guard {
  constructor(def) {
    this.name = def.name;
    this.wp = def.wp;
    this.speed = def.speed;
    this.range = def.range;
    this.halfAngle = def.halfAngle;
    this.color = def.color;
    this.x = def.wp[0][0];
    this.y = def.wp[0][1];
    this.target = 1; // waypoint index we walk toward
    this.facing = angleTo(this.x, this.y, this.wp[1][0], this.wp[1][1]);
    this.alert = 0; // seconds left of "I see you" (stops and stares)
    this.seen = false; // seeing the thief right now
    this.lostT = 0; // seconds since the thief was last seen
  }

  // Move along the patrol, or stare at the thief while alert.
  update(dt, thief) {
    this.seen = false;
    if (this.alert > 0) {
      this.alert -= dt;
      this.facing = angleTo(this.x, this.y, thief.x, thief.y);
      if (this.canSee(thief)) this.seen = true;
      if (this.alert <= 0) this.lostT = 0;
      return;
    }
    const [tx, ty] = this.wp[this.target];
    const d = Math.hypot(tx - this.x, ty - this.y);
    const step = this.speed * dt * 60;
    if (d <= step) {
      this.x = tx;
      this.y = ty;
      this.target = 1 - this.target;
      const [nx, ny] = this.wp[this.target];
      this.facing = angleTo(this.x, this.y, nx, ny);
    } else {
      this.x += ((tx - this.x) / d) * step;
      this.y += ((ty - this.y) / d) * step;
      this.facing = angleTo(this.x, this.y, tx, ty);
    }
    if (this.canSee(thief)) {
      this.seen = true;
      this.alert = 1.0; // stop, stare, sound the alarm
    }
  }

  canSee(thief) {
    if (thief.hidden) return false;
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.range + GUARD_R) return false;
    const a = angleTo(this.x, this.y, thief.x, thief.y);
    if (Math.abs(angleDiff(a, this.facing)) > this.halfAngle) return false;
    return hasLineOfSight(this.x, this.y, thief.x, thief.y);
  }
}

// One wall camera, sweeping its cone back and forth.
export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.base = def.base;
    this.sweep = def.sweep;
    this.range = def.range;
    this.halfAngle = def.halfAngle;
    this.color = def.color;
    this.t = Math.random() * 6.28;
    this.facing = def.base;
    this.seen = false;
  }

  update(dt, thief) {
    this.t += dt;
    this.facing = this.base + Math.sin(this.t * 0.7) * this.sweep;
    this.seen = this.canSee(thief);
  }

  canSee(thief) {
    if (thief.hidden) return false;
    const dist = Math.hypot(thief.x - this.x, thief.y - this.y);
    if (dist > this.range) return false;
    const a = angleTo(this.x, this.y, thief.x, thief.y);
    if (Math.abs(angleDiff(a, this.facing)) > this.halfAngle) return false;
    return hasLineOfSight(this.x, this.y, thief.x, thief.y);
  }
}
