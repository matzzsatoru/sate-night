// data.js — Sate Night: ingredients, recipes, dishes, layout and tuning.
// One job: the game's static data. Nothing here changes at runtime.
// All player-facing text is English so the game reads internationally.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const SHIFT_SECONDS = 180;
export const PASS_TARGET = 6;

export const COLORS = {
  night: '#191019',
  wallTop: '#2b1a26',
  wallBottom: '#3a2119',
  floorA: '#4a2e1f',
  floorB: '#3d2518',
  wood: '#8a5a33',
  woodDark: '#6b4226',
  woodLight: '#b07a45',
  cream: '#fff3d6',
  paper: '#ffedb8',
  ink: '#3a2415',
  amber: '#ffb347',
  ember: '#ff7a1a',
  emberHot: '#ffd23f',
  chili: '#e23b2e',
  leaf: '#7cb342',
  sauce: '#c98a3d',
  gold: '#ffd23f',
  smoke: 'rgba(200,200,210,0.55)',
};

// Ingredients the player can pick up. kind: 'skewer' needs the grill first.
export const INGREDIENTS = {
  ayamMentah:   { id: 'ayamMentah',   name: 'Chicken Skewers', short: 'Chicken', kind: 'skewer', color: '#f2a594', cooked: 'ayamBakar' },
  kambingMentah:{ id: 'kambingMentah',name: 'Goat Skewers',    short: 'Goat',    kind: 'skewer', color: '#d98a7a', cooked: 'kambingBakar' },
  ayamBakar:    { id: 'ayamBakar',    name: 'Grilled Chicken', short: 'Chicken', kind: 'cooked', color: '#b96a2e' },
  kambingBakar: { id: 'kambingBakar', name: 'Grilled Goat',    short: 'Goat',    kind: 'cooked', color: '#8a4a26' },
  lontong:      { id: 'lontong',      name: 'Rice Cake',       short: 'Rice Cake',kind: 'side',   color: '#f5f0dc' },
  kacang:       { id: 'kacang',       name: 'Peanut Sauce',    short: 'Peanut',  kind: 'sauce',  color: '#c98a3d' },
  kecap:        { id: 'kecap',        name: 'Sweet Soy Sauce', short: 'Soy',     kind: 'sauce',  color: '#4a2410' },
  bawang:       { id: 'bawang',       name: 'Crispy Shallots', short: 'Shallots',kind: 'top',    color: '#e8b04b' },
  sambal:       { id: 'sambal',       name: 'Chili Sauce',     short: 'Chili',   kind: 'sauce',  color: '#d92b1f' },
  gosong:       { id: 'gosong',       name: 'Burnt!',          short: 'Burnt',   kind: 'burnt',  color: '#1c1410' },
};

// Recipes: what a plate needs, in order. price in dollars.
export const RECIPES = {
  sateAyam: {
    id: 'sateAyam', name: 'Chicken Satay', price: 14,
    needs: ['ayamBakar', 'ayamBakar', 'kacang', 'lontong'],
    desc: '2 grilled chicken + peanut + rice cake',
  },
  sateKambing: {
    id: 'sateKambing', name: 'Goat Satay', price: 18,
    needs: ['kambingBakar', 'kambingBakar', 'kecap', 'bawang'],
    desc: '2 grilled goat + sweet soy + shallots',
  },
  sateCampur: {
    id: 'sateCampur', name: 'Mixed Satay', price: 22,
    needs: ['ayamBakar', 'kambingBakar', 'sambal', 'lontong'],
    desc: 'chicken + goat + chili + rice cake',
  },
  sateSpesial: {
    id: 'sateSpesial', name: 'Special Satay', price: 30,
    needs: ['ayamBakar', 'ayamBakar', 'kambingBakar', 'kambingBakar', 'kacang', 'bawang', 'lontong'],
    desc: '2 chicken + 2 goat + peanut + shallots + rice cake',
  },
};

export const RECIPE_ORDER = ['sateAyam', 'sateKambing', 'sateCampur', 'sateSpesial'];

export const CUSTOMERS = [
  { name: 'Mr. Budi', skin: '#f2c184', hair: '#2b2b2b', hat: 'cap' },
  { name: 'Ms. Sari', skin: '#e8b88a', hair: '#3a1f0d', hat: 'hair' },
  { name: 'Mr. Joko', skin: '#d9a06b', hair: '#1c1c1c', hat: 'band' },
  { name: 'Mrs. Tini', skin: '#f2c184', hair: '#5a5a5a', hat: 'bun' },
  { name: 'Rian', skin: '#eec39a', hair: '#241608', hat: 'cap' },
  { name: 'Dewi', skin: '#e8b88a', hair: '#14100c', hat: 'hair' },
];

// Station geometry (logical 1280x720). approach = where the cook stands to use it.
export const STATIONS = {
  crates: [
    { ing: 'ayamMentah',    x: 16, y: 150, w: 208, h: 58 },
    { ing: 'kambingMentah', x: 16, y: 214, w: 208, h: 58 },
    { ing: 'lontong',       x: 16, y: 278, w: 208, h: 58 },
    { ing: 'kacang',        x: 16, y: 342, w: 208, h: 58 },
    { ing: 'kecap',         x: 16, y: 406, w: 208, h: 58 },
    { ing: 'bawang',        x: 16, y: 470, w: 208, h: 58 },
    { ing: 'sambal',        x: 16, y: 534, w: 208, h: 58 },
  ],
  grill:    { x: 268, y: 132, w: 384, h: 176, slots: 4 },
  assembly: { x: 700, y: 132, w: 296, h: 176 },
  serve:    { x: 1044, y: 132, w: 220, h: 176 },
  bin:      { x: 1148, y: 560, w: 116, h: 92 },
};

export const FLOOR = { x: 8, y: 330, w: 1264, h: 322 };
export const TICKET_W = 158;
export const TICKET_H = 88;

export function grillSlotPos(i) {
  // 2x2 slots inside the grill rect.
  const g = STATIONS.grill;
  const cx = g.x + 96 + (i % 2) * 192;
  const cy = g.y + 62 + Math.floor(i / 2) * 76;
  return { x: cx, y: cy };
}

export function stationApproach(kind, index = 0) {
  if (kind === 'crate') {
    const c = STATIONS.crates[index];
    return { x: c.x + c.w + 26, y: c.y + c.h / 2 };
  }
  if (kind === 'grill') return { x: STATIONS.grill.x + STATIONS.grill.w / 2, y: STATIONS.grill.y + STATIONS.grill.h + 26 };
  if (kind === 'assembly') return { x: STATIONS.assembly.x + STATIONS.assembly.w / 2, y: STATIONS.assembly.y + STATIONS.assembly.h + 26 };
  if (kind === 'serve') return { x: STATIONS.serve.x + STATIONS.serve.w / 2, y: STATIONS.serve.y + STATIONS.serve.h + 26 };
  if (kind === 'bin') return { x: STATIONS.bin.x + STATIONS.bin.w / 2, y: STATIONS.bin.y - 24 };
  return { x: 640, y: 480 };
}

export function stationRect(kind, index = 0) {
  if (kind === 'crate') return STATIONS.crates[index];
  return STATIONS[kind];
}
