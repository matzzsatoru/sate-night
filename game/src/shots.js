// shots.js — deterministic scenes for the 4 screenshots (?shot=start|play|rush|serve).
// One job: build a fixed, lively game state per shot so every screenshot is
// reproducible (seeded RNG) and shows a different required element.

import { createState } from './state.js';
import { CUSTOMERS, RECIPES } from './data.js';

function makeOrder(state, id, recipeId, customer, timeLeft, total) {
  return { id, recipeId, customer, timeLeft, total, state: 'open' };
}

function basePlaying(seed) {
  const state = createState();
  state.mode = 'playing';
  state.time = 73;
  state.timeLeft = 107;
  state.nextOrderId = 10;
  return state;
}

export function buildShot(shot, seed = 1) {
  if (shot === 'start') {
    const state = createState();
    state.mode = 'title';
    state.orders = [
      makeOrder(state, 1, 'sateAyam', CUSTOMERS[0], 44, 52),
      makeOrder(state, 2, 'sateKambing', CUSTOMERS[1], 38, 52),
      makeOrder(state, 3, 'sateCampur', CUSTOMERS[2], 47, 52),
    ];
    state.coins = 0;
    state.timeLeft = 180;
    state.cook.x = 640;
    state.cook.y = 520;
    return state;
  }

  if (shot === 'play') {
    const state = basePlaying(seed);
    state.orders = [
      makeOrder(state, 6, 'sateAyam', CUSTOMERS[0], 40, 52),
      makeOrder(state, 7, 'sateKambing', CUSTOMERS[1], 22, 48),
      makeOrder(state, 8, 'sateCampur', CUSTOMERS[2], 35, 50),
      makeOrder(state, 9, 'sateAyam', CUSTOMERS[3], 48, 52),
    ];
    state.grill = [
      { ing: 'ayamMentah', cookT: 7.2 },
      { ing: 'kambingMentah', cookT: 4.4 },
      { ing: 'ayamMentah', cookT: 1.6 },
      null,
    ];
    // One dish mid-assembly on the counter: Sate Ayam, 2 of 4 items placed.
    state.plate = { orderId: 6, recipeId: 'sateAyam', placed: ['ayamBakar', 'kacang'], stale: false };
    state.carrying = ['ayamMentah'];
    state.cook.x = 460;
    state.cook.y = 380;
    state.cook.face = 1;
    state.coins = 86;
    state.served = 5;
    state.streak = 3;
    state.multiplier = 2;
    state.bestStreak = 4;
    return state;
  }

  if (shot === 'rush') {
    const state = basePlaying(seed);
    state.time = 122;
    state.timeLeft = 58;
    state.rush = true;
    state.rushLeft = 14;
    state.orders = [
      makeOrder(state, 11, 'sateSpesial', CUSTOMERS[4], 31, 46),
      makeOrder(state, 12, 'sateKambing', CUSTOMERS[5], 18, 44),
      makeOrder(state, 13, 'sateAyam', CUSTOMERS[0], 26, 46),
      makeOrder(state, 14, 'sateCampur', CUSTOMERS[1], 40, 48),
    ];
    state.grill = [
      { ing: 'ayamMentah', cookT: 6.9 },
      { ing: 'kambingMentah', cookT: 7.1 },
      { ing: 'ayamMentah', cookT: 4.8 },
      { ing: 'kambingMentah', cookT: 2.4 },
    ];
    state.plate = { orderId: 11, recipeId: 'sateSpesial', placed: ['ayamBakar', 'kambingBakar', 'kacang'], stale: false };
    state.carrying = ['bawang', 'lontong'];
    state.cook.x = 850;
    state.cook.y = 380;
    state.cook.face = -1;
    state.coins = 214;
    state.served = 11;
    state.streak = 8;
    state.multiplier = 4;
    state.bestStreak = 8;
    state.message = 'RUSH HOUR!  2x EARNINGS';
    state.messageT = 99;
    return state;
  }

  if (shot === 'serve') {
    const state = basePlaying(seed);
    state.time = 84;
    state.timeLeft = 96;
    state.orders = [
      makeOrder(state, 15, 'sateKambing', CUSTOMERS[2], 33, 50),
      makeOrder(state, 16, 'sateAyam', CUSTOMERS[3], 44, 52),
    ];
    state.grill = [
      { ing: 'ayamMentah', cookT: 7.5 },
      null,
      { ing: 'kambingMentah', cookT: 3.2 },
      null,
    ];
    state.readyPlate = { orderId: 15, recipeId: 'sateKambing' };
    state.carrying = ['plate:15'];
    state.cook.x = 1080;
    state.cook.y = 400;
    state.cook.face = 1;
    state.coins = 132;
    state.served = 7;
    state.streak = 5;
    state.multiplier = 3;
    state.bestStreak = 6;
    state.floats = [{ x: 1154, y: 220, text: '+$18', color: '#ffd23f', size: 34, alpha: 1, scale: 1 }];
    state.servedFlash = 0.7;
    return state;
  }

  return buildShot('play', seed);
}
