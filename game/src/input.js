// Mouse and keyboard input for the kitchen.
// The game keeps one "carried" item (the ingredient in the chef's hand);
// clicks move it between bins, the board, the stove, the pot and plates.

export class Input {
  constructor(canvas, onKey) {
    this.canvas = canvas;
    this.onKey = onKey;
    this.mouse = { x: -1, y: -1, down: false };
    this.clickQueue = [];
    this._bind();
  }

  _bind() {
    const toLocal = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * this.canvas.width,
        y: ((e.clientY - r.top) / r.height) * this.canvas.height,
      };
    };
    this.canvas.addEventListener('mousemove', (e) => {
      const p = toLocal(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });
    this.canvas.addEventListener('mousedown', (e) => {
      const p = toLocal(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      this.mouse.down = true;
    });
    this.canvas.addEventListener('mouseup', (e) => {
      const p = toLocal(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      this.mouse.down = false;
      this.clickQueue.push({ x: p.x, y: p.y });
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = -1;
      this.mouse.y = -1;
    });
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      this.onKey(e.code, e.key);
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Pull the clicks that arrived since the last frame.
  takeClicks() {
    const out = this.clickQueue;
    this.clickQueue = [];
    return out;
  }

  // True while the pointer is inside a rectangle (for hover highlights).
  hover(rect) {
    const m = this.mouse;
    return m.x >= rect.x && m.x <= rect.x + rect.w && m.y >= rect.y && m.y <= rect.y + rect.h;
  }
}

// Point-in-rectangle test shared by the world and the renderer.
export function inside(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

// Point-in-circle test (round plates, burners, pots).
export function insideCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}
