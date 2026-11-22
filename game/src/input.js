// Midnight Vault — keyboard and mouse input.
// One job: turn keys into a movement vector plus one-shot actions.
// Held keys steer; one-shot keys (EMP, pause, restart, start) fire once per press.

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let click = false;

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
  };
  const ONESHOT = {
    KeyE: 'emp',
    KeyP: 'pause', Escape: 'pause',
    KeyR: 'restart',
    Enter: 'start', Space: 'start',
    KeyM: 'mute',
  };

  function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    const mapped = KEYMAP[e.code];
    if (mapped) held.add(mapped);
    const shot = ONESHOT[e.code];
    if (shot && !e.repeat) pressed.add(shot);
  }
  function onKeyUp(e) {
    const mapped = KEYMAP[e.code];
    if (mapped) held.delete(mapped);
  }
  function onMouseDown() {
    click = true;
    pressed.add('start');
  }
  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Movement vector for this frame, from the keys currently held.
    move() {
      let mx = 0;
      let my = 0;
      if (held.has('left')) mx -= 1;
      if (held.has('right')) mx += 1;
      if (held.has('up')) my -= 1;
      if (held.has('down')) my += 1;
      return { mx, my, sneak: held.has('sneak') };
    },
    // True once per physical key press; consumed when read.
    take(action) {
      if (pressed.has(action)) {
        pressed.delete(action);
        return true;
      }
      return false;
    },
    // True once per click; consumed when read.
    takeClick() {
      if (click) {
        click = false;
        return true;
      }
      return false;
    },
  };
}
