// Sizzle & Serve: Wok Rush — entry point for the browser game.
// Wires the canvas, input, world and renderer together and runs the loop.
// URL shots (?shot=start|play|serve|end&seed=N) freeze a fixed scene so
// screenshots are the same on every machine.

import { World } from './world.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { draw } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '20261125');

const sfx = new Sfx();
const world = new World(seed, sfx);
const input = new Input(canvas, (code) => world.handleKey(code));

if (shot) world.buildShot(shot);

let last = performance.now();

function frame(now) {
  const dt = Math.min(100, now - last);
  last = now;
  for (const c of input.takeClicks()) world.handleClick(c.x, c.y);
  if (!shot) world.update(dt);
  draw(ctx, world, input, now);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Expose the world for debugging in the console.
window.__sizzle = { world, sfx };
