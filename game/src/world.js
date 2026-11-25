// Sizzle & Serve: Wok Rush — game state and rules.
// The world owns orders, stations, the hand, the clock and the score.
// It knows nothing about pixels: the renderer draws this state, and the
// input layer feeds it clicks and keys.

import {
  INGREDIENTS, DISHES, DISH_ORDER, SHIFT_SECONDS, MAX_HEARTS, MAX_ORDERS,
  ORDER_EVERY_MS, PATIENCE_MS, CHOPS_NEEDED, COMBO_WINDOW_MS, GRILL_MS,
  BOIL_MS, BURN_MS, TIP_MAX, PERFECT_BONUS, COMBO_STEP,
} from './config.js';
import { LAYOUT } from './layout.js';
import { inside, insideCircle } from './input.js';
import { makeRng } from './random.js';

const BIN_KEYS = ['tomato', 'lettuce', 'cucumber', 'mushroom', 'pepper', 'patty', 'pasta', 'bun', 'cheese'];

function needsKey(needs) {
  return needs.map((n) => `${n.ing}:${n.state}`).sort().join('|');
}

function itemsKey(items) {
  return items.map((i) => `${i.ing}:${i.state}`).sort().join('|');
}

// Does a pile of processed ingredients exactly match a dish's recipe?
function dishForItems(items, cook) {
  const key = itemsKey(items);
  for (const dk of DISH_ORDER) {
    const d = DISHES[dk];
    if (d.cook !== cook) continue;
    if (needsKey(d.needs) === key) return dk;
  }
  return null;
}

export class World {
  constructor(seed, sfx) {
    this.sfx = sfx;
    this.seed = seed;
    this.rng = makeRng(seed);
    this.reset();
  }

  reset() {
    this.phase = 'title'; // 'title' | 'playing' | 'over'
    this.paused = false;
    this.now = 0;
    this.timeLeftMs = SHIFT_SECONDS * 1000;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.missed = 0;
    this.hearts = MAX_HEARTS;
    this.hand = null;
    this.board = null; // { ing, chops }
    this.burner1 = this._emptyBurner();
    this.burner2 = this._emptyBurner();
    this.pot = { item: null, doneAt: 0 };
    this.plate = { kind: 'empty', items: [], dish: null };
    this.orders = [];
    this.nextOrderId = 1;
    this.nextOrderAt = 2500;
    this.lastServeAt = -1e9;
    this.floaters = [];
    this.message = '';
    this.messageAt = 0;
    this.endStats = null;
  }

  _emptyBurner() {
    return { mode: 'empty', item: null, mix: [], dish: null, doneAt: 0 };
  }

  start() {
    this.reset();
    this.phase = 'playing';
    this.sfx.start();
    this._spawnOrder();
  }

  // ---- orders ---------------------------------------------------------

  _spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return;
    const dish = DISH_ORDER[Math.floor(this.rng() * DISH_ORDER.length)];
    this.orders.push({
      id: this.nextOrderId++,
      dish,
      createdAt: this.now,
      patienceMs: PATIENCE_MS,
    });
  }

  _orderPatience(o) {
    return Math.max(0, 1 - (this.now - o.createdAt) / o.patienceMs);
  }

  // ---- main update ----------------------------------------------------

  update(dt) {
    if (this.phase !== 'playing' || this.paused) return;
    this.now += dt;
    this.timeLeftMs -= dt;
    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0;
      return this._endShift('Time!');
    }
    if (this.now >= this.nextOrderAt) {
      this._spawnOrder();
      this.nextOrderAt = this.now + ORDER_EVERY_MS;
    }
    // Expired tickets walk out.
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i];
      if (this._orderPatience(o) <= 0) {
        this.orders.splice(i, 1);
        this.missed++;
        this.combo = 0;
        this.hearts--;
        this.sfx.bad();
        this._floater(640, 200, 'Order walked out!  -1 ♥', '#e5484d');
        if (this.hearts <= 0) return this._endShift('Reputation lost!');
      }
    }
    this._cookTick(this.burner1);
    this._cookTick(this.burner2);
    this._potTick();
    // Fade old floaters.
    this.floaters = this.floaters.filter((f) => this.now - f.bornAt < f.ttl);
  }

  _cookTick(b) {
    if (b.mode === 'grilling' || b.mode === 'cooking') {
      if (this.now >= b.doneAt + BURN_MS) {
        b.mode = 'burnt';
        this.sfx.burn();
        this._floater(640, 240, 'Burnt! Click to clear', '#e5484d');
      } else if (this.now >= b.doneAt && b.mode !== 'done') {
        b.mode = 'done';
        // A grilled patty comes off the burner grilled, not raw.
        if (b.item) b.item = { ...b.item, state: 'grilled' };
        this.sfx.ding();
      }
    }
  }

  _potTick() {
    const p = this.pot;
    if (p.item && p.item.state === 'raw') {
      if (this.now >= p.doneAt + BURN_MS) {
        p.item.state = 'burnt';
        this.sfx.burn();
        this._floater(640, 240, 'Pasta burnt! Click pot to clear', '#e5484d');
      } else if (this.now >= p.doneAt) {
        p.item.state = 'boiled';
        this.sfx.ding();
      }
    }
  }

  _endShift(reason) {
    this.phase = 'over';
    this.endStats = {
      reason,
      score: this.score,
      served: this.served,
      missed: this.missed,
      bestCombo: this.bestCombo,
    };
    this.sfx.ding();
  }

  // ---- helpers ----------------------------------------------------------

  _floater(x, y, text, color) {
    this.floaters.push({ x, y, text, color, bornAt: this.now, ttl: 1800 });
  }

  _say(text) {
    this.message = text;
    this.messageAt = this.now;
  }

  _binRect(i) {
    const b = LAYOUT.bins;
    return {
      x: b.x + i * (LAYOUT.binW + LAYOUT.binGap),
      y: b.y,
      w: LAYOUT.binW,
      h: b.h,
    };
  }

  _ticketRect(i) {
    return {
      x: LAYOUT.board.x + i * (LAYOUT.ticketW + LAYOUT.ticketGap),
      y: LAYOUT.board.y + 8,
      w: LAYOUT.ticketW,
      h: LAYOUT.ticketH,
    };
  }

  // ---- clicks -----------------------------------------------------------

  handleClick(x, y) {
    if (this.phase === 'title') {
      this.start();
      return;
    }
    if (this.phase === 'over') {
      this.start();
      return;
    }
    if (this.paused) {
      if (inside(x, y, LAYOUT.pauseBtn)) this.paused = false;
      return;
    }
    if (inside(x, y, LAYOUT.pauseBtn)) { this.paused = true; return; }
    if (inside(x, y, LAYOUT.muteBtn)) { this.sfx.muted = !this.sfx.muted; return; }

    // Order tickets: serve with the plated dish, or show the recipe.
    for (let i = 0; i < this.orders.length; i++) {
      if (inside(x, y, this._ticketRect(i))) return this._serve(i);
    }
    // Ingredient bins: pick up a raw ingredient.
    for (let i = 0; i < BIN_KEYS.length; i++) {
      if (inside(x, y, this._binRect(i))) return this._takeFromBin(BIN_KEYS[i]);
    }
    // Cutting board.
    if (inside(x, y, LAYOUT.chop)) return this._useBoard();
    // Burners.
    if (insideCircle(x, y, LAYOUT.burner1.cx, LAYOUT.burner1.cy, LAYOUT.burner1.r)) return this._useBurner(this.burner1);
    if (insideCircle(x, y, LAYOUT.burner2.cx, LAYOUT.burner2.cy, LAYOUT.burner2.r)) return this._useBurner(this.burner2);
    // Pasta pot.
    if (insideCircle(x, y, LAYOUT.pot.cx, LAYOUT.pot.cy, LAYOUT.pot.r)) return this._usePot();
    // Plating station.
    if (inside(x, y, LAYOUT.plate)) return this._usePlate();
    // Trash can.
    if (inside(x, y, LAYOUT.trash)) return this._trash();
  }

  handleKey(code) {
    if (this.phase === 'title' || this.phase === 'over') {
      if (code === 'Enter' || code === 'Space') this.start();
      return;
    }
    if (code === 'KeyP') { this.paused = !this.paused; return; }
    if (code === 'KeyM') { this.sfx.muted = !this.sfx.muted; return; }
    if (code === 'KeyT') return this._trash();
    if (code === 'Space') return this._useBoard();
    if (code.startsWith('Digit')) {
      const n = Number(code.slice(5)) - 1;
      if (n >= 0 && n < this.orders.length) return this._serve(n);
    }
  }

  // ---- actions ----------------------------------------------------------

  _takeFromBin(key) {
    if (this.hand) { this._say('Hands full — place something down first'); return; }
    this.hand = { ing: key, state: 'raw' };
    this.sfx.pickup();
  }

  _useBoard() {
    // Put a choppable ingredient on the board.
    if (!this.board && this.hand && INGREDIENTS[this.hand.ing].kind === 'chop' && this.hand.state === 'raw') {
      this.board = { ing: this.hand.ing, chops: 0 };
      this.hand = null;
      this.sfx.place();
      return;
    }
    // Chop what is on the board.
    if (this.board && !this.hand) {
      this.board.chops++;
      this.sfx.chop();
      if (this.board.chops >= CHOPS_NEEDED) {
        this.hand = { ing: this.board.ing, state: 'chopped' };
        this.board = null;
        this._say('Chopped! Nice knife work');
      }
      return;
    }
    if (this.board && this.hand) this._say('Board is busy — finish chopping first');
    else this._say('The board needs something to chop');
  }

  _useBurner(b) {
    // Clear a burnt burner.
    if (b.mode === 'burnt') {
      this._clearBurner(b);
      return;
    }
    // Take a finished item or dish.
    if (b.mode === 'done') {
      if (this.hand) { this._say('Hands full'); return; }
      // A pan dish lives in b.dish; a grilled item in b.item.
      this.hand = b.dish ? { ing: b.dish, state: 'dish' } : b.item;
      Object.assign(b, this._emptyBurner());
      this.sfx.pickup();
      return;
    }
    // Take back the last mixed ingredient.
    if (b.mode === 'mixing' && !this.hand && b.mix.length) {
      this.hand = b.mix.pop();
      this.sfx.pickup();
      return;
    }
    if (!this.hand) return;
    const ing = INGREDIENTS[this.hand.ing];
    // Raw patty starts grilling on an empty burner.
    if (b.mode === 'empty' && ing.kind === 'grill' && this.hand.state === 'raw') {
      b.mode = 'grilling';
      b.item = this.hand;
      b.doneAt = this.now + GRILL_MS;
      this.hand = null;
      this.sfx.sizzle();
      return;
    }
    // Chopped / boiled ingredients go into the pan mix.
    if ((b.mode === 'empty' || b.mode === 'mixing') && this.hand.state !== 'raw') {
      b.mix.push(this.hand);
      this.hand = null;
      this.sfx.place();
      const dish = dishForItems(b.mix, 'pan');
      if (dish) {
        b.mode = 'cooking';
        b.dish = dish;
        b.doneAt = this.now + DISHES[dish].cookMs;
        this.sfx.sizzle();
        this._say(`${DISHES[dish].name} is on the stove!`);
      } else {
        b.mode = 'mixing';
      }
      return;
    }
    this._say('That does not go on the burner');
  }

  _clearBurner(b) {
    Object.assign(b, this._emptyBurner());
    this.sfx.click();
    this._say('Cleared the burnt pan');
  }

  _usePot() {
    const p = this.pot;
    if (p.item && p.item.state === 'burnt') {
      p.item = null;
      this.sfx.click();
      this._say('Tossed the burnt pasta');
      return;
    }
    if (p.item && p.item.state === 'boiled') {
      if (this.hand) { this._say('Hands full'); return; }
      this.hand = p.item;
      p.item = null;
      this.sfx.pickup();
      return;
    }
    if (!p.item && this.hand && this.hand.ing === 'pasta' && this.hand.state === 'raw') {
      p.item = this.hand;
      p.doneAt = this.now + BOIL_MS;
      this.hand = null;
      this.sfx.sizzle();
      this._say('Pasta is boiling…');
      return;
    }
    if (p.item) this._say('Pasta is still cooking');
    else this._say('The pot only boils pasta');
  }

  _usePlate() {
    const plate = this.plate;
    // Put a finished dish on the plate.
    if (this.hand && this.hand.state === 'dish') {
      if (plate.kind !== 'empty') { this._say('Plate is busy — serve it first'); return; }
      plate.kind = 'dish';
      plate.dish = this.hand.ing;
      plate.items = [];
      this.hand = null;
      this.sfx.place();
      return;
    }
    // Assemble a no-cook dish on the plate.
    if (this.hand && this.hand.state !== 'raw') {
      if (plate.kind === 'dish') { this._say('Plate is busy — serve it first'); return; }
      plate.kind = 'assembling';
      plate.items.push(this.hand);
      this.hand = null;
      this.sfx.place();
      const dish = dishForItems(plate.items, 'none');
      if (dish) {
        plate.kind = 'dish';
        plate.dish = dish;
        plate.items = [];
        this.sfx.ding();
        this._say(`${DISHES[dish].name} is plated and ready!`);
      }
      return;
    }
    // Take the plated dish back (rare, but allowed).
    if (!this.hand && plate.kind === 'dish') {
      this.hand = { ing: plate.dish, state: 'dish' };
      plate.kind = 'empty';
      plate.dish = null;
      this.sfx.pickup();
    }
  }

  _trash() {
    if (this.hand) {
      this.hand = null;
      this.sfx.click();
      this._say('Tossed it');
      return;
    }
    if (this.plate.kind !== 'empty') {
      this.plate = { kind: 'empty', items: [], dish: null };
      this.sfx.click();
      this._say('Cleared the plate');
    }
  }

  _serve(i) {
    const order = this.orders[i];
    if (!order) return;
    if (this.plate.kind !== 'dish') {
      this._say('Nothing plated to serve — finish a dish first');
      this.sfx.bad();
      return;
    }
    if (this.plate.dish !== order.dish) {
      this._say(`That is ${DISHES[this.plate.dish].name} — the ticket wants ${DISHES[order.dish].name}`);
      this.sfx.bad();
      return;
    }
    const patience = this._orderPatience(order);
    const tip = Math.round(patience * TIP_MAX);
    const perfect = patience > 0.7 ? PERFECT_BONUS : 0;
    if (this.now - this.lastServeAt < COMBO_WINDOW_MS) this.combo++;
    else this.combo = 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.lastServeAt = this.now;
    const earned = DISHES[order.dish].base + tip + perfect + (this.combo - 1) * COMBO_STEP;
    this.score += earned;
    this.served++;
    this.orders.splice(i, 1);
    this.plate = { kind: 'empty', items: [], dish: null };
    this.sfx.serve();
    const r = this._ticketRect(i);
    this._floater(r.x + r.w / 2, r.y + 20, `+$${earned}${perfect ? ' PERFECT!' : ''}${this.combo > 1 ? `  x${this.combo} combo` : ''}`, '#2e7d32');
  }

  // ---- fixed scenes for screenshots (?shot=) ----------------------------

  buildShot(mode) {
    this.reset();
    if (mode === 'start') {
      this.phase = 'title';
      return;
    }
    if (mode === 'end') {
      this.phase = 'over';
      this.score = 486;
      this.served = 14;
      this.missed = 1;
      this.bestCombo = 5;
      this.timeLeftMs = 0;
      this.endStats = { reason: 'Time!', score: 486, served: 14, missed: 1, bestCombo: 5 };
      return;
    }
    // 'play' and 'serve' are mid-shift scenes with a fixed clock.
    this.phase = 'playing';
    this.now = 47000;
    this.timeLeftMs = 133000;
    this.score = 240;
    this.combo = 2;
    this.bestCombo = 3;
    this.served = 7;
    this.orders = [
      { id: 1, dish: 'pasta', createdAt: 47000 - 28000, patienceMs: PATIENCE_MS },
      { id: 2, dish: 'stirfry', createdAt: 47000 - 15000, patienceMs: PATIENCE_MS },
      { id: 3, dish: 'burger', createdAt: 47000 - 41000, patienceMs: PATIENCE_MS },
    ];
    this.nextOrderId = 4;
    if (mode === 'play') {
      // One dish mid-assembly on the board, pasta boiling, a patty on the
      // grill, a stir-fry in the pan, and a salad plated and ready.
      this.board = { ing: 'tomato', chops: 2 };
      this.pot = { item: { ing: 'pasta', state: 'raw' }, doneAt: 47000 + 3200 };
      this.burner1 = { mode: 'grilling', item: { ing: 'patty', state: 'raw' }, mix: [], dish: null, doneAt: 47000 + 2700 };
      this.burner2 = { mode: 'cooking', item: null, mix: [{ ing: 'pepper', state: 'chopped' }, { ing: 'mushroom', state: 'chopped' }], dish: 'stirfry', doneAt: 47000 + 4200 };
      this.plate = { kind: 'dish', items: [], dish: 'salad' };
    } else {
      // 'serve': a burger plated, its ticket waiting, lettuce chopped.
      this.board = { ing: 'lettuce', chops: 3 };
      this.plate = { kind: 'dish', items: [], dish: 'burger' };
      this.burner1 = { mode: 'grilling', item: { ing: 'patty', state: 'raw' }, mix: [], dish: null, doneAt: 47000 + 4000 };
      this._say('Burger plated — click its ticket to serve!');
    }
  }
}

export { BIN_KEYS };
