// Keyboard + mouse input. Keys are tracked by code so WASD and arrows
// both work; mouse position is kept in canvas pixels for aiming.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys, fresh: new Set(), mouseX: 0, mouseY: 0, mouseDown: false, clicked: false,
    down(code) { return keys.has(code); },
    axis() {
      const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0)
        - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      const y = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0)
        - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
      return { x, y };
    },
  };
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (!e.repeat) input.fresh.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = e.clientX - r.left;
    input.mouseY = e.clientY - r.top;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { input.mouseDown = true; input.clicked = true; }
  });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });
  return input;
}

// Edge-triggered key helper: true once per physical press. A press that
// lands between two frames is still caught via input.fresh.
export function makeEdge(input) {
  const seen = new Set();
  return function edge(code) {
    if (input.fresh && input.fresh.has(code)) {
      input.fresh.delete(code);
      seen.add(code);
      return true;
    }
    const down = input.keys.has(code);
    const was = seen.has(code);
    if (down) seen.add(code); else seen.delete(code);
    return down && !was;
  };
}
