// Sizzle & Serve: Wok Rush — game configuration.
// Every dish, ingredient, station and tuning number lives here so the
// kitchen rules can be read (and rebalanced) in one place.

export const VIEW = { w: 1280, h: 720 };

export const SHIFT_SECONDS = 180; // one full shift lasts 3 minutes
export const MAX_HEARTS = 3; // missed orders cost one heart each
export const MAX_ORDERS = 4; // tickets on the board at once
export const ORDER_EVERY_MS = 14000; // a new ticket arrives this often
export const PATIENCE_MS = 75000; // how long a ticket waits before it walks out
export const CHOPS_NEEDED = 3; // clicks on the board to finish chopping
export const COMBO_WINDOW_MS = 20000; // serves inside this window keep the combo alive

// Ingredient catalogue. kind: 'chop' needs the board, 'grill' the burner,
// 'boil' the pot, 'raw' goes straight on the plate.
export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e5484d', dark: '#a92c30', kind: 'chop', price: 4 },
  lettuce: { name: 'Lettuce', color: '#5fbf4d', dark: '#3d8a33', kind: 'chop', price: 3 },
  cucumber: { name: 'Cucumber', color: '#4da34d', dark: '#2f6e31', kind: 'chop', price: 3 },
  mushroom: { name: 'Mushroom', color: '#d9c7a7', dark: '#a68d68', kind: 'chop', price: 5 },
  pepper: { name: 'Pepper', color: '#f5a623', dark: '#c07f14', kind: 'chop', price: 4 },
  patty: { name: 'Beef Patty', color: '#8a5a3b', dark: '#5f3a24', kind: 'grill', price: 8 },
  pasta: { name: 'Pasta', color: '#f2d38a', dark: '#c9a44e', kind: 'boil', price: 5 },
  bun: { name: 'Bun', color: '#e8b25c', dark: '#b57e2e', kind: 'raw', price: 3 },
  cheese: { name: 'Cheese', color: '#ffd94d', dark: '#d9a91f', kind: 'raw', price: 4 },
};

// Each dish is a list of processed ingredients. `cook` is the station the
// finished mix needs before it can be plated ('pan' or 'none').
export const DISHES = {
  pasta: {
    name: 'Tomato Pasta',
    icon: '🍝',
    needs: [{ ing: 'tomato', state: 'chopped' }, { ing: 'pasta', state: 'boiled' }],
    cook: 'pan',
    cookMs: 6000,
    base: 22,
  },
  stirfry: {
    name: 'Veggie Stir-Fry',
    icon: '🥘',
    needs: [{ ing: 'pepper', state: 'chopped' }, { ing: 'mushroom', state: 'chopped' }],
    cook: 'pan',
    cookMs: 7000,
    base: 24,
  },
  burger: {
    name: 'Cheeseburger',
    icon: '🍔',
    needs: [{ ing: 'patty', state: 'grilled' }, { ing: 'lettuce', state: 'chopped' }, { ing: 'cheese', state: 'raw' }, { ing: 'bun', state: 'raw' }],
    cook: 'none',
    cookMs: 0,
    base: 28,
  },
  salad: {
    name: 'Garden Salad',
    icon: '🥗',
    needs: [{ ing: 'cucumber', state: 'chopped' }, { ing: 'tomato', state: 'chopped' }, { ing: 'lettuce', state: 'chopped' }],
    cook: 'none',
    cookMs: 0,
    base: 20,
  },
};

export const DISH_ORDER = ['pasta', 'stirfry', 'burger', 'salad'];

// Cooking stations.
export const GRILL_MS = 9000; // patty on the burner
export const BOIL_MS = 8000; // pasta in the pot
export const BURN_MS = 6000; // grace time after done before food burns

// Scoring.
export const TIP_MAX = 12; // tip for a serve at full patience
export const PERFECT_BONUS = 5; // served with patience above 70%
export const COMBO_STEP = 2; // extra coins per combo level

// Kitchen palette (warm diner colours, all original flat art).
export const COLORS = {
  wall: '#f7e8c9',
  floor: '#c98f5f',
  counter: '#8a5a3b',
  counterTop: '#b07a4f',
  board: '#e8d5a8',
  steel: '#b9c0c7',
  steelDark: '#8b939b',
  ink: '#2e2620',
  cream: '#fff6e3',
  ticket: '#fffbe8',
  red: '#e5484d',
  green: '#4caf50',
  gold: '#f5b301',
  blue: '#3e7cbf',
};
