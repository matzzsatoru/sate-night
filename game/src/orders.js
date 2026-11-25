// orders.js — order tickets: spawning, countdowns, expiry, rush pressure.
// One job: everything about the order board.

import { RECIPE_ORDER, CUSTOMERS, RECIPES } from './data.js';
import { pick, range } from './rng.js';
import { breakStreak, startRush } from './state.js';

export function spawnInterval(state) {
  // Orders arrive faster as the shift goes on; rush doubles the pace.
  const base = Math.max(9, 16 - state.time * 0.035);
  return state.rush ? base / 2 : base;
}

export function ticketTime(state) {
  return Math.max(36, 52 - state.time * 0.06);
}

export function pickRecipeId(state, rand) {
  const unlocked = RECIPE_ORDER.filter((id, i) => state.time > i * 40 || i < 2);
  // Early on only the first two recipes appear; later all four.
  return pick(rand, unlocked);
}

export function spawnOrder(state, rand) {
  const recipeId = pickRecipeId(state, rand);
  const order = {
    id: state.nextOrderId++,
    recipeId,
    customer: pick(rand, CUSTOMERS),
    timeLeft: ticketTime(state),
    total: ticketTime(state),
    state: 'open',
  };
  state.orders.push(order);
  return order;
}

export function updateOrders(state, dt, rand, sfx) {
  // Spawn timer.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.filter((o) => o.state === 'open').length < 4) {
    spawnOrder(state, rand);
    state.spawnIn = spawnInterval(state) * range(rand, 0.85, 1.2);
    if (sfx) sfx.ticket();
  }
  // Rush windows.
  for (const at of state.rushAt) {
    if (!state.rushDone.includes(at) && state.time >= at) {
      state.rushDone.push(at);
      startRush(state, 20);
      if (sfx) sfx.rush();
    }
  }
  if (state.rush) {
    state.rushLeft -= dt;
    if (state.rushLeft <= 0) state.rush = false;
  }
  // Ticket countdowns.
  for (const o of state.orders) {
    if (o.state !== 'open') continue;
    o.timeLeft -= dt;
    if (o.timeLeft <= 0) {
      o.state = 'expired';
      state.expired += 1;
      breakStreak(state);
      // A plate being built for this order goes stale.
      if (state.plate && state.plate.orderId === o.id) {
        state.plate.stale = true;
      }
      // A finished plate waiting on the counter is wasted with the order.
      if (state.readyPlate && state.readyPlate.orderId === o.id) {
        state.readyPlate = null;
      }
      // A plate already being carried for this order is lost too — the
      // customer walked away, so the cook is left holding a dead plate.
      // Drop it with a message instead of soft-locking the player.
      const carried = state.carrying.findIndex((id) => typeof id === 'string' && id === 'plate:' + o.id);
      if (carried !== -1) {
        state.carrying.splice(carried, 1);
        state.message = 'TOO LATE — the customer walked away!';
        state.messageT = 2.5;
      }
      if (sfx) sfx.expire();
    }
  }
  state.orders = state.orders.filter((o) => o.state === 'open' || o.state === 'serving');
}

export function openOrders(state) {
  return state.orders.filter((o) => o.state === 'open');
}

export function earliestOrder(state) {
  const open = openOrders(state);
  return open.length ? open[0] : null;
}

export function orderPrice(state, order) {
  return RECIPES[order.recipeId].price;
}
