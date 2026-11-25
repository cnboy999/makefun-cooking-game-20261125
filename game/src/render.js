// Sizzle & Serve: Wok Rush — all canvas drawing.
// Every picture in the game is drawn here from shapes: no image files,
// no copied art. The renderer only reads world state, it never changes it.

import { INGREDIENTS, DISHES, COLORS, GRILL_MS, BOIL_MS, BURN_MS } from './config.js';
import { LAYOUT } from './layout.js';
import { BIN_KEYS } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// ---- ingredient pictures ----------------------------------------------

export function drawIngredient(ctx, key, x, y, r, state = 'raw') {
  const ing = INGREDIENTS[key];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#241d18';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.2);
    ctx.lineTo(r * 0.4, r * 0.2);
    ctx.moveTo(r * 0.4, -r * 0.2);
    ctx.lineTo(-r * 0.4, r * 0.2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (state === 'chopped') {
    // Three little chunks on the plate.
    ctx.fillStyle = ing.color;
    for (const [dx, dy, s] of [[-0.45, 0.1, 0.42], [0.4, -0.15, 0.38], [0.05, 0.42, 0.34]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, s * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(-0.45 * r, 0.1 * r, 0.14 * r, 0, Math.PI * 2);
    ctx.arc(0.4 * r, -0.15 * r, 0.12 * r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (key === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d8a33';
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(-r * 0.45, -r * 0.45); ctx.lineTo(r * 0.45, -r * 0.45);
    ctx.closePath(); ctx.fill();
  } else if (key === 'lettuce' || key === 'cucumber') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (key === 'mushroom') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.85, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(-r * 0.28, -r * 0.2, r * 0.56, r * 0.8);
  } else if (key === 'pepper') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.55, r * 0.95, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d8a33';
    ctx.fillRect(-r * 0.12, -r * 1.15, r * 0.24, r * 0.35);
  } else if (key === 'patty') {
    ctx.fillStyle = state === 'grilled' ? '#6e4426' : ing.color;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    if (state === 'grilled') {
      ctx.strokeStyle = '#3d2716'; ctx.lineWidth = 3;
      for (const dx of [-0.4, 0, 0.4]) {
        ctx.beginPath(); ctx.moveTo(dx * r, -r * 0.45); ctx.lineTo(dx * r, r * 0.45); ctx.stroke();
      }
    }
  } else if (key === 'pasta') {
    ctx.strokeStyle = state === 'boiled' ? '#e8c56a' : ing.color;
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, i * r * 0.55);
      ctx.quadraticCurveTo(0, i * r * 0.55 + r * 0.35, r * 0.7, i * r * 0.55);
      ctx.stroke();
    }
  } else if (key === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 0.9, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7dc9a';
    ctx.fillRect(-r * 0.9, -r * 0.1, r * 1.8, r * 0.35);
    ctx.fillStyle = '#fff';
    for (const [dx, dy] of [[-0.4, -0.55], [0, -0.7], [0.4, -0.55]]) {
      ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.09, 0, Math.PI * 2); ctx.fill();
    }
  } else if (key === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6); ctx.lineTo(-r, -r * 0.2); ctx.lineTo(0, -r * 0.7); ctx.lineTo(r, -r * 0.2); ctx.lineTo(r, r * 0.6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [dx, dy] of [[-0.4, 0.1], [0.25, -0.25], [0.45, 0.25]]) {
      ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.11, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// ---- progress ring around a station ------------------------------------

function ring(ctx, cx, cy, r, frac, color) {
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
}

// ---- the whole scene -----------------------------------------------------

export function draw(ctx, world, input, t) {
  const W = 1280;
  const H = 720;
  // Wall and floor.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, W, 470);
  ctx.fillStyle = '#efd9ae';
  for (let x = 0; x < W; x += 64) ctx.fillRect(x, 128, 2, 342);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 470, W, 250);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 510; y < H; y += 56) ctx.fillRect(0, y, W, 3);

  drawHud(ctx, world);
  drawOrderBoard(ctx, world);
  drawStations(ctx, world, t);
  drawBins(ctx, world, input);
  drawFloaters(ctx, world);
  drawMessage(ctx, world);
  drawHand(ctx, world, input);

  if (world.phase === 'title') drawTitle(ctx, world, t);
  if (world.phase === 'over') drawGameOver(ctx, world);
  if (world.paused && world.phase === 'playing') {
    ctx.fillStyle = 'rgba(20,12,6,0.55)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED', 640, 330, 56, '#fff6e3');
    text(ctx, 'Press P or the Pause button to keep cooking', 640, 390, 20, '#fff6e3');
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#2e2620';
  ctx.fillRect(0, 0, 1280, 64);
  text(ctx, '🍳 SIZZLE & SERVE', 130, 34, 26, '#ffd94d', 'left');
  // Score.
  text(ctx, `SCORE  $${world.score}`, 560, 34, 24, '#fff6e3');
  if (world.combo > 1) text(ctx, `COMBO x${world.combo}`, 700, 34, 18, '#ffd94d');
  // Timer.
  const s = Math.max(0, Math.ceil(world.timeLeftMs / 1000));
  const mm = String(Math.floor(s / 60));
  const ss = String(s % 60).padStart(2, '0');
  const low = world.phase === 'playing' && s <= 30;
  text(ctx, `⏱ ${mm}:${ss}`, 880, 34, 26, low ? '#ff6b6b' : '#fff6e3');
  // Hearts.
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < world.hearts ? '♥' : '♡';
  text(ctx, hearts, 990, 34, 24, '#ff6b81');
  // Buttons.
  for (const [rect, label] of [[LAYOUT.pauseBtn, world.paused ? 'Resume' : 'Pause'], [LAYOUT.muteBtn, world.sfx.muted ? 'Muted' : 'Sound']]) {
    ctx.fillStyle = '#4a3a2c';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 15, '#fff6e3');
  }
}

function drawOrderBoard(ctx, world) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#6b4423';
  rr(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', b.x + 14, b.y + 16, 13, '#ffd94d', 'left');
  if (!world.orders.length && world.phase === 'playing') {
    text(ctx, 'No orders yet — the lunch rush is coming…', 640, b.y + 58, 18, '#fff6e3');
  }
  world.orders.forEach((o, i) => {
    const r = {
      x: b.x + i * (LAYOUT.ticketW + LAYOUT.ticketGap),
      y: b.y + 8,
      w: LAYOUT.ticketW,
      h: LAYOUT.ticketH,
    };
    const dish = DISHES[o.dish];
    const patience = world.phase === 'playing'
      ? Math.max(0, 1 - (world.now - o.createdAt) / o.patienceMs)
      : 0.6;
    ctx.fillStyle = COLORS.ticket;
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = patience < 0.3 ? '#e5484d' : '#d9c9a0';
    ctx.lineWidth = patience < 0.3 ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.stroke();
    // Dish icon + name.
    text(ctx, dish.icon, r.x + 34, r.y + 30, 30, '#2e2620');
    text(ctx, dish.name, r.x + 62, r.y + 22, 17, COLORS.ink, 'left');
    text(ctx, `$${dish.base}  ·  press ${i + 1} to serve`, r.x + 62, r.y + 46, 13, '#7a6a55', 'left');
    // Needs as little dots.
    dish.needs.forEach((n, j) => {
      drawIngredient(ctx, n.ing, r.x + 76 + j * 26, r.y + 68, 10, n.state === 'raw' ? 'raw' : n.state);
    });
    // Patience bar.
    ctx.fillStyle = '#e5dcc4';
    rr(ctx, r.x + 14, r.y + r.h - 12, r.w - 28, 7, 3);
    ctx.fill();
    ctx.fillStyle = patience > 0.5 ? '#4caf50' : patience > 0.25 ? '#f5a623' : '#e5484d';
    rr(ctx, r.x + 14, r.y + r.h - 12, (r.w - 28) * patience, 7, 3);
    ctx.fill();
  });
}

function drawStations(ctx, world, t) {
  // Cutting board.
  const c = LAYOUT.chop;
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, c.x, c.y, c.w, c.h, 14);
  ctx.fill();
  ctx.fillStyle = COLORS.board;
  rr(ctx, c.x + 22, c.y + 44, c.w - 44, c.h - 80, 10);
  ctx.fill();
  text(ctx, '🔪 CUTTING BOARD', c.x + c.w / 2, c.y + 24, 16, '#fff6e3');
  if (world.board) {
    drawIngredient(ctx, world.board.ing, c.x + c.w / 2, c.y + 130, 52, world.board.chops >= 3 ? 'chopped' : 'raw');
    const done = world.board.chops >= 3;
    text(ctx, done ? 'Chopped!' : `Chop! ${world.board.chops}/${3}`, c.x + c.w / 2, c.y + 188, 18, done ? '#2e7d32' : COLORS.ink);
    if (!done) {
      ctx.fillStyle = '#e5dcc4';
      rr(ctx, c.x + 52, c.y + 206, c.w - 104, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#f5a623';
      rr(ctx, c.x + 52, c.y + 206, (c.w - 104) * (world.board.chops / 3), 8, 4);
      ctx.fill();
    }
  } else {
    text(ctx, 'Click a raw ingredient,', c.x + c.w / 2, c.y + 120, 16, '#8a7a5f');
    text(ctx, 'then click here to chop', c.x + c.w / 2, c.y + 146, 16, '#8a7a5f');
    text(ctx, '3 clicks', c.x + c.w / 2, c.y + 178, 14, '#b09a78');
  }

  // Stove.
  const s = LAYOUT.stove;
  ctx.fillStyle = COLORS.steel;
  rr(ctx, s.x, s.y, s.w, s.h, 14);
  ctx.fill();
  ctx.fillStyle = COLORS.steelDark;
  rr(ctx, s.x, s.y, s.w, 34, 14);
  ctx.fill();
  text(ctx, '🔥 STOVE', s.x + s.w / 2, s.y + 18, 16, '#fff6e3');
  drawBurner(ctx, world, world.burner1, LAYOUT.burner1, 'Burner 1', t);
  drawBurner(ctx, world, world.burner2, LAYOUT.burner2, 'Burner 2', t);
  drawPot(ctx, world, t);

  // Plating station.
  const p = LAYOUT.plate;
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, p.x, p.y, p.w, p.h, 14);
  ctx.fill();
  text(ctx, '🍽 PLATING', p.x + 20, p.y + 24, 16, '#fff6e3', 'left');
  const pc = LAYOUT.plateCircle;
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath(); ctx.arc(pc.cx, pc.cy, pc.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9d2c2'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(pc.cx, pc.cy, pc.r - 6, 0, Math.PI * 2); ctx.stroke();
  if (world.plate.kind === 'dish') {
    const d = DISHES[world.plate.dish];
    text(ctx, d.icon, pc.cx, pc.cy - 8, 54, '#2e2620');
    text(ctx, d.name, pc.cx, pc.cy + 42, 15, COLORS.ink);
    // Ready glow.
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(pc.cx, pc.cy, pc.r + 6 + Math.sin(t / 300) * 3, 0, Math.PI * 2); ctx.stroke();
    text(ctx, 'READY TO SERVE ✓', pc.cx, p.y + p.h - 22, 16, '#2e7d32');
  } else if (world.plate.kind === 'assembling') {
    world.plate.items.forEach((it, i) => {
      drawIngredient(ctx, it.ing, pc.cx - 30 + i * 30, pc.cy, 24, it.state);
    });
    text(ctx, 'Assembling…', pc.cx, p.y + p.h - 22, 15, '#7a6a55');
  } else {
    text(ctx, 'Plate the dish here', pc.cx, pc.cy, 15, '#b09a78');
    text(ctx, 'then click its ticket', pc.cx, pc.cy + 24, 13, '#b09a78');
  }
  // Trash can.
  const tr = LAYOUT.trash;
  ctx.fillStyle = '#5d6b7a';
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 8);
  ctx.fill();
  ctx.fillStyle = '#46525f';
  ctx.fillRect(tr.x - 4, tr.y - 6, tr.w + 8, 12);
  text(ctx, '🗑', tr.x + tr.w / 2, tr.y + 34, 26, '#fff');
  text(ctx, 'TRASH', tr.x + tr.w / 2, tr.y + 64, 12, '#dfe6ec');
}

function drawBurner(ctx, world, b, pos, label, t) {
  ctx.fillStyle = '#3a3f45';
  ctx.beginPath(); ctx.arc(pos.cx, pos.cy, pos.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22262b';
  ctx.beginPath(); ctx.arc(pos.cx, pos.cy, pos.r - 10, 0, Math.PI * 2); ctx.fill();
  // Flame when cooking.
  if (b.mode === 'grilling' || b.mode === 'cooking') {
    const flick = Math.sin(t / 90) * 4;
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath();
    ctx.ellipse(pos.cx, pos.cy + pos.r - 14, 26 + flick, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.ellipse(pos.cx, pos.cy + pos.r - 16, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (b.mode === 'grilling' && b.item) {
    drawIngredient(ctx, b.item.ing, pos.cx, pos.cy, 34, b.mode === 'done' ? 'grilled' : 'raw');
  }
  if ((b.mode === 'mixing' || b.mode === 'cooking') && b.mix.length) {
    b.mix.forEach((it, i) => drawIngredient(ctx, it.ing, pos.cx - 22 + i * 22, pos.cy, 20, it.state));
  }
  if (b.mode === 'done' && b.dish) {
    text(ctx, DISHES[b.dish].icon, pos.cx, pos.cy, 44, '#2e2620');
  }
  if (b.mode === 'burnt') {
    text(ctx, '🔥', pos.cx, pos.cy - 6, 34, '#2e2620');
    text(ctx, 'BURNT', pos.cx, pos.cy + 30, 13, '#ff6b6b');
  }
  // Progress ring while cooking.
  if (b.mode === 'grilling' || b.mode === 'cooking') {
    const total = b.mode === 'grilling' ? GRILL_MS : DISHES[b.dish].cookMs;
    const left = Math.max(0, b.doneAt - world.now);
    const frac = 1 - left / total;
    ring(ctx, pos.cx, pos.cy, pos.r + 8, frac, '#ff9d2e');
    if (left <= 2000) text(ctx, 'READY!', pos.cx, pos.cy - pos.r - 12, 13, '#2e7d32');
  }
  if (b.mode === 'done') text(ctx, 'DONE ✓', pos.cx, pos.cy - pos.r - 12, 13, '#2e7d32');
  // Label on a dark pill so it reads on the steel.
  ctx.fillStyle = 'rgba(30,32,36,0.85)';
  rr(ctx, pos.cx - 44, pos.cy + pos.r + 6, 88, 22, 11);
  ctx.fill();
  text(ctx, label, pos.cx, pos.cy + pos.r + 18, 13, '#f5f0e0');
}

function drawPot(ctx, world, t) {
  const pos = LAYOUT.pot;
  const p = world.pot;
  ctx.fillStyle = '#3a3f45';
  ctx.beginPath(); ctx.arc(pos.cx, pos.cy, pos.r, 0, Math.PI * 2); ctx.fill();
  // Pot body.
  ctx.fillStyle = '#7d838c';
  ctx.beginPath(); ctx.arc(pos.cx, pos.cy, pos.r - 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9aa1a9';
  ctx.beginPath(); ctx.arc(pos.cx, pos.cy, pos.r - 20, 0, Math.PI * 2); ctx.fill();
  if (p.item) {
    if (p.item.state === 'raw') {
      // Boiling bubbles.
      ctx.fillStyle = '#bfe3f5';
      for (let i = 0; i < 5; i++) {
        const bx = pos.cx - 24 + ((t / 40 + i * 13) % 48);
        const by = pos.cy - 8 - ((t / 55 + i * 17) % 26);
        ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
      }
      drawIngredient(ctx, 'pasta', pos.cx, pos.cy + 6, 26, 'raw');
      const frac = 1 - Math.max(0, p.doneAt - world.now) / BOIL_MS;
      ring(ctx, pos.cx, pos.cy, pos.r + 6, frac, '#3e7cbf');
    } else if (p.item.state === 'boiled') {
      drawIngredient(ctx, 'pasta', pos.cx, pos.cy, 28, 'boiled');
      text(ctx, 'DONE ✓', pos.cx, pos.cy - pos.r - 10, 13, '#2e7d32');
    } else {
      text(ctx, '🔥', pos.cx, pos.cy - 4, 30, '#2e2620');
      text(ctx, 'BURNT', pos.cx, pos.cy + 28, 12, '#ff6b6b');
    }
  } else {
    text(ctx, 'POT', pos.cx, pos.cy, 15, '#5d646d');
  }
  ctx.fillStyle = 'rgba(30,32,36,0.85)';
  rr(ctx, pos.cx - 44, pos.cy + pos.r + 6, 88, 22, 11);
  ctx.fill();
  text(ctx, 'Pasta Pot', pos.cx, pos.cy + pos.r + 18, 13, '#f5f0e0');
}

function drawBins(ctx, world, input) {
  const b = LAYOUT.bins;
  ctx.fillStyle = COLORS.counter;
  rr(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 12);
  ctx.fill();
  text(ctx, 'INGREDIENTS — click to take', b.x + 14, b.y + 16, 13, '#ffd94d', 'left');
  BIN_KEYS.forEach((key, i) => {
    const r = {
      x: b.x + i * (LAYOUT.binW + LAYOUT.binGap),
      y: b.y + 26,
      w: LAYOUT.binW,
      h: b.h - 36,
    };
    const hover = input.hover(r);
    ctx.fillStyle = hover ? '#fff3d0' : '#f7ead0';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = hover ? '#f5a623' : '#d9c9a0';
    ctx.lineWidth = hover ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.stroke();
    drawIngredient(ctx, key, r.x + r.w / 2, r.y + 40, 30, 'raw');
    text(ctx, INGREDIENTS[key].name, r.x + r.w / 2, r.y + 82, 14, COLORS.ink);
    text(ctx, INGREDIENTS[key].kind === 'chop' ? 'chop it' : INGREDIENTS[key].kind === 'grill' ? 'grill it' : INGREDIENTS[key].kind === 'boil' ? 'boil it' : 'plate it', r.x + r.w / 2, r.y + 100, 11, '#8a7a5f');
  });
}

function drawFloaters(ctx, world) {
  for (const f of world.floaters) {
    const age = (world.now - f.bornAt) / f.ttl;
    ctx.globalAlpha = 1 - age;
    text(ctx, f.text, f.x, f.y - age * 40, 22, f.color);
    ctx.globalAlpha = 1;
  }
}

function drawMessage(ctx, world) {
  if (!world.message) return;
  if (world.now - world.messageAt > 2600) return;
  text(ctx, world.message, 640, 505, 16, '#fff6e3');
}

function drawHand(ctx, world, input) {
  if (!world.hand || input.mouse.x < 0) return;
  const { x, y } = input.mouse;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
  if (world.hand.state === 'dish') {
    text(ctx, DISHES[world.hand.ing].icon, x, y, 36, '#2e2620');
  } else {
    drawIngredient(ctx, world.hand.ing, x, y, 26, world.hand.state);
  }
  ctx.restore();
}

// ---- screens -------------------------------------------------------------

function drawTitle(ctx, world, t) {
  ctx.fillStyle = 'rgba(20,12,6,0.45)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#fff6e3';
  rr(ctx, 290, 110, 700, 480, 20);
  ctx.fill();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 4;
  rr(ctx, 290, 110, 700, 480, 20);
  ctx.stroke();
  // Chef mascot: a round chef with a tall hat, drawn from shapes.
  ctx.fillStyle = '#ffd9b3';
  ctx.beginPath(); ctx.arc(640, 250, 52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(640, 196, 46, Math.PI, 0); ctx.fill();
  ctx.fillRect(594, 186, 92, 26);
  ctx.fillStyle = '#2e2620';
  ctx.beginPath(); ctx.arc(622, 246, 5, 0, Math.PI * 2); ctx.arc(658, 246, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2e2620'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(640, 262, 16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 350, 44, '#c0392b');
  text(ctx, 'WOK RUSH', 640, 396, 24, '#8a5a3b');
  text(ctx, 'Chop it. Fry it. Plate it. Beat the clock!', 640, 436, 18, '#5d5346');
  const lines = [
    '1 · Click an ingredient, chop it on the board (3 clicks)',
    '2 · Grill patties, boil pasta, mix dishes in the pan',
    '3 · Plate the dish, then click its ticket to serve',
    'Keys: 1–4 serve · Space chop · T trash · P pause',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 468 + i * 22, 15, '#5d5346'));
  const pulse = 0.75 + Math.sin(t / 300) * 0.25;
  ctx.globalAlpha = pulse;
  text(ctx, '▶  CLICK TO START YOUR SHIFT', 640, 568, 22, '#c0392b');
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(20,12,6,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  const s = world.endStats || { reason: 'Time!', score: world.score, served: world.served, missed: world.missed, bestCombo: world.bestCombo };
  ctx.fillStyle = '#fff6e3';
  rr(ctx, 340, 130, 600, 440, 20);
  ctx.fill();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 4;
  rr(ctx, 340, 130, 600, 440, 20);
  ctx.stroke();
  text(ctx, 'SHIFT OVER!', 640, 190, 40, '#c0392b');
  text(ctx, s.reason, 640, 232, 18, '#5d5346');
  text(ctx, `FINAL SCORE  $${s.score}`, 640, 300, 34, COLORS.ink);
  const rows = [
    `Dishes served: ${s.served}`,
    `Orders missed: ${s.missed}`,
    `Best combo: x${s.bestCombo}`,
  ];
  rows.forEach((r, i) => text(ctx, r, 640, 356 + i * 30, 19, '#5d5346'));
  const stars = s.served >= 14 ? '★★★' : s.served >= 9 ? '★★' : s.served >= 5 ? '★' : '☆';
  text(ctx, stars, 640, 470, 40, '#f5b301');
  text(ctx, 'Click anywhere to cook again', 640, 530, 18, '#c0392b');
}
