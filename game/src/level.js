// level.js — the museum floor: walls, cover, loot, patrols, cameras.
// One fixed room, drawn and played in a single frame (960x640 canvas).
// Every rect here blocks movement; the ones marked `solid` also block sight.

export const W = 960;
export const H = 640;
export const HUD_H = 52;

// Rects: {x, y, w, h, kind} — kind: 'wall' | 'case' | 'pillar' | 'crate' | 'vault'
export const WALLS = [
  // outer shell (the exit gap is the front door, bottom centre)
  { x: 20, y: 60, w: 920, h: 12, kind: 'wall' },
  { x: 20, y: 616, w: 420, h: 12, kind: 'wall' },
  { x: 520, y: 616, w: 420, h: 12, kind: 'wall' },
  { x: 20, y: 60, w: 12, h: 568, kind: 'wall' },
  { x: 928, y: 60, w: 12, h: 568, kind: 'wall' },
  // the vault: a walled enclosure, top centre, one door at its bottom
  { x: 380, y: 100, w: 200, h: 12, kind: 'vault' },
  { x: 380, y: 100, w: 12, h: 110, kind: 'vault' },
  { x: 568, y: 100, w: 12, h: 110, kind: 'vault' },
  { x: 380, y: 198, w: 76, h: 12, kind: 'vault' },
  { x: 504, y: 198, w: 76, h: 12, kind: 'vault' },
];

// Cover that blocks both movement and sight.
export const COVER = [
  { x: 140, y: 180, w: 90, h: 50, kind: 'case' }, // gem display case, left
  { x: 730, y: 180, w: 90, h: 50, kind: 'case' }, // mask pedestal, right
  { x: 300, y: 320, w: 28, h: 28, kind: 'pillar' },
  { x: 632, y: 320, w: 28, h: 28, kind: 'pillar' },
  { x: 300, y: 480, w: 28, h: 28, kind: 'pillar' },
  { x: 632, y: 480, w: 28, h: 28, kind: 'pillar' },
  { x: 120, y: 460, w: 60, h: 40, kind: 'crate' },
  { x: 780, y: 460, w: 60, h: 40, kind: 'crate' },
];

// Everything that blocks sight (walls + vault + cover).
export const SIGHT_BLOCKERS = [...WALLS, ...COVER];

// Loot: walk over one to take it. name, x, y, colour, value.
export const LOOT = [
  { id: 'sapphire', name: 'Star Sapphire', x: 185, y: 205, color: '#5ee6ff', value: 1000 },
  { id: 'cash', name: 'Vault Cash', x: 480, y: 152, color: '#ffd94d', value: 1000 },
  { id: 'mask', name: 'Golden Mask', x: 775, y: 205, color: '#ffb84d', value: 1000 },
];

// Guard patrols: two waypoints each, walked back and forth.
export const GUARDS = [
  { name: 'Marco', wp: [[120, 120], [120, 560]], speed: 1.0, range: 175, halfAngle: 0.56, color: '#ff5a6e' },
  { name: 'Rosa', wp: [[340, 280], [620, 280]], speed: 1.1, range: 175, halfAngle: 0.56, color: '#ff5a6e' },
  { name: 'Dante', wp: [[840, 120], [840, 560]], speed: 1.0, range: 175, halfAngle: 0.56, color: '#ff5a6e' },
];

// Wall cameras: fixed, sweeping cones.
export const CAMERAS = [
  { x: 60, y: 100, base: 0.6, sweep: 0.7, range: 205, halfAngle: 0.48, color: '#ffb84d' },
  { x: 900, y: 100, base: Math.PI - 0.6, sweep: 0.7, range: 205, halfAngle: 0.48, color: '#ffb84d' },
];

export const SPAWN = { x: 480, y: 580 };
export const EXIT = { x: 440, y: 592, w: 80, h: 36 }; // the front door zone
export const PLAYER_R = 11;
export const GUARD_R = 12;

// --- geometry ------------------------------------------------------------

// Does the segment (x1,y1)-(x2,y2) cross the rect? (for line of sight)
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  // slab test on x and y
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// Clear line of sight between two points (no sight-blocker in the way).
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const r of SIGHT_BLOCKERS) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

// Move a circle (x,y,r) by (dx,dy), sliding along rects. Returns [nx, ny].
export function moveCircle(x, y, r, dx, dy, rects) {
  let nx = x + dx;
  let ny = y;
  for (const rc of rects) {
    if (nx + r > rc.x && nx - r < rc.x + rc.w && ny + r > rc.y && ny - r < rc.y + rc.h) {
      nx = dx > 0 ? rc.x - r : dx < 0 ? rc.x + rc.w + r : nx;
      if (dx === 0) nx = x;
    }
  }
  let ny2 = y + dy;
  let nx2 = nx;
  for (const rc of rects) {
    if (nx2 + r > rc.x && nx2 - r < rc.x + rc.w && ny2 + r > rc.y && ny2 - r < rc.y + rc.h) {
      ny2 = dy > 0 ? rc.y - r : dy < 0 ? rc.y + rc.h + r : ny2;
      if (dy === 0) ny2 = y;
    }
  }
  return [nx2, ny2];
}

export const ALL_SOLIDS = [...WALLS, ...COVER];
