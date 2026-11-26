// Keyboard and pointer input. Held keys give bank, pitch and throttle change;
// one-shot presses (start, pause) are queued as flags and taken once by the
// loop, so a press between two frames is never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp']);
const DOWN = new Set(['ArrowDown']);
const THR_UP = new Set(['KeyW']);
const THR_DOWN = new Set(['KeyS']);
const CONFIRM = new Set(['Enter', 'Space']);
const PAUSE = new Set(['KeyP', 'Escape']);
const BOOST = new Set(['ShiftLeft', 'ShiftRight']);

export function createInput(target) {
  const held = { left: false, right: false, up: false, down: false, boost: false, thrUp: false, thrDown: false };
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else if (THR_UP.has(event.code)) held.thrUp = true;
    else if (THR_DOWN.has(event.code)) held.thrDown = true;
    else if (BOOST.has(event.code)) held.boost = true;
    else if (CONFIRM.has(event.code)) { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (PAUSE.has(event.code)) { if (!event.repeat) actions |= ACTION_PAUSE; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
    else if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
    else if (THR_UP.has(event.code)) held.thrUp = false;
    else if (THR_DOWN.has(event.code)) held.thrDown = false;
    else if (BOOST.has(event.code)) held.boost = false;
  });
  window.addEventListener('blur', () => {
    held.left = held.right = held.up = held.down = held.boost = false;
    held.thrUp = held.thrDown = false;
  });
  target.addEventListener('pointerdown', () => { actions |= ACTION_CONFIRM; });

  return {
    /** -1 left, +1 right: the bank the pilot is asking for. */
    bank() { return (held.right ? 1 : 0) - (held.left ? 1 : 0); },
    /** +1 climb (Up/W), -1 descend (Down/S). W/S double as throttle in main. */
    pitch() { return (held.up ? 1 : 0) - (held.down ? 1 : 0); },
    /** +1 while W is held, -1 while S is held: throttle change, not pitch. */
    throttleAxis() { return (held.thrUp ? 1 : 0) - (held.thrDown ? 1 : 0); },
    boost() { return held.boost; },
    takeActions() { const taken = actions; actions = 0; return taken; },
  };
}
