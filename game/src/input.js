// input.js — keyboard state: WASD / arrows to move, E for a smoke bomb,
// Enter to start, R to retry, P to pause.

export const keys = {};

const MAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyE: 'smoke', Space: 'smoke',
  Enter: 'start', KeyR: 'retry', KeyP: 'pause',
};

export function bindInput() {
  window.addEventListener('keydown', (e) => {
    const k = MAP[e.code];
    if (k) {
      keys[k] = true;
      if (k === 'smoke' || k === 'up' || k === 'down') e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = MAP[e.code];
    if (k) keys[k] = false;
  });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}

// True once when the key goes down (edge trigger).
let prevSmoke = false;
export function smokePressed() {
  const now = !!keys.smoke;
  const hit = now && !prevSmoke;
  prevSmoke = now;
  return hit;
}
