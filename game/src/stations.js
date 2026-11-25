// stations.js — the grill, the assembly counter, the serve window and the bin.
// One job: what happens when the cook uses a station.

import { INGREDIENTS, RECIPES, grillSlotPos } from './data.js';
import { addCoins, plateProgress } from './state.js';

export const GRILL_SECONDS = 10; // raw -> burnt (perfect window 6.8-9.6s)
export const PERFECT_FROM = 0.68;
export const PERFECT_TO = 0.96;

export function grillCookPercent(slot) {
  return Math.min(1, slot.cookT / GRILL_SECONDS);
}

export function grillQuality(slot) {
  const p = grillCookPercent(slot);
  if (p >= 1) return 'burnt';
  if (p >= PERFECT_FROM && p <= PERFECT_TO) return 'perfect';
  if (p >= 0.35) return 'cooking';
  return 'raw';
}

export function updateGrill(state, dt) {
  const speed = state.fanBoost > 0 ? 2 : 1;
  if (state.fanBoost > 0) state.fanBoost -= dt;
  if (state.fanCooldown > 0) state.fanCooldown -= dt;
  for (const slot of state.grill) {
    if (slot) slot.cookT += dt * speed;
  }
}

// The cook uses the grill: place a raw skewer, or take the best skewer off.
export function useGrill(state, sfx, fx) {
  const hands = state.carrying;
  const rawIndex = hands.findIndex((id) => INGREDIENTS[id] && INGREDIENTS[id].kind === 'skewer');
  const freeSlot = state.grill.findIndex((s) => s === null);
  if (rawIndex !== -1 && freeSlot !== -1) {
    const id = hands.splice(rawIndex, 1)[0];
    state.grill[freeSlot] = { ing: id, cookT: 0 };
    if (sfx) sfx.place();
    return { ok: true, what: 'place' };
  }
  // Take the best skewer: perfect first, then most cooked.
  // A burnt skewer is only taken when nothing better is on the grill,
  // so a burnt slot can always be cleared and the mess binned.
  let best = -1;
  let bestScore = -1;
  state.grill.forEach((slot, i) => {
    if (!slot) return;
    const q = grillQuality(slot);
    const score = q === 'perfect' ? 100 + grillCookPercent(slot) : q === 'cooking' ? grillCookPercent(slot) : q === 'raw' ? 0.1 : -0.5;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  if (best !== -1 && hands.length < 4 && !hands[0]?.startsWith?.('plate:')) {
    const slot = state.grill[best];
    state.grill[best] = null;
    const q = grillQuality(slot);
    // Only a skewer that has actually cooked comes off done: an undercooked
    // one comes back raw (taking it early must not skip the grill timing),
    // a burnt one comes off as trash.
    const cookedId = q === 'burnt' ? 'gosong' : q === 'raw' ? slot.ing : INGREDIENTS[slot.ing].cooked;
    hands.push(cookedId);
    if (sfx) sfx.take();
    if (fx) fx.cookPop(grillSlotPos(best), q);
    return { ok: true, what: 'take', quality: q };
  }
  if (sfx) sfx.error();
  return { ok: false };
}

export function fanGrill(state, sfx, fx) {
  if (state.fanCooldown > 0) return { ok: false };
  const anyCooking = state.grill.some((s) => s && grillQuality(s) !== 'burnt');
  if (!anyCooking) return { ok: false };
  state.fanBoost = 2;
  state.fanCooldown = 3;
  if (sfx) sfx.fan();
  if (fx) fx.fanBurst();
  return { ok: true };
}

// The assembly counter: deposit carried items the active plate still needs.
export function useAssembly(state, sfx, fx) {
  const hands = state.carrying;
  if (hands.length && hands[0].startsWith('plate:')) {
    if (sfx) sfx.error();
    return { ok: false };
  }
  if (!state.plate) {
    // Build the earliest open order — prefer one that matches something
    // the cook is already carrying, so a grilled skewer is never wasted
    // just because an older ticket asked for the other meat.
    const open = state.orders.filter((o) => o.state === 'open');
    if (!open.length) {
      if (sfx) sfx.error();
      return { ok: false };
    }
    const match = open.find((o) => hands.some((id) => RECIPES[o.recipeId].needs.includes(id)));
    if (!match && hands.length > 0) {
      // Nothing open needs what the cook is carrying: do NOT start a plate
      // for a mismatched order — that traps the cook with food nobody asked
      // for. Empty hands may still start a plate to plan the next order.
      if (sfx) sfx.error();
      if (fx) fx.shake();
      return { ok: false };
    }
    const order = match || open[0];
    state.plate = { orderId: order.id, recipeId: order.recipeId, placed: [], stale: false };
  } else if (state.plate.stale) {
    // A stale plate blocks the counter: clear it first.
    state.plate = null;
    if (sfx) sfx.bin();
    return { ok: false, what: 'cleared-stale' };
  }
  const prog = plateProgress(state);
  let deposited = 0;
  for (let i = hands.length - 1; i >= 0; i--) {
    const id = hands[i];
    if (prog.remaining.includes(id)) {
      state.plate.placed.push(id);
      hands.splice(i, 1);
      const idx = prog.remaining.indexOf(id);
      prog.remaining.splice(idx, 1);
      deposited += 1;
    }
  }
  if (deposited === 0) {
    if (sfx) sfx.error();
    if (fx) fx.shake();
    return { ok: false };
  }
  if (sfx) sfx.assemble();
  const done = plateProgress(state);
  if (done.remaining.length === 0) {
    state.readyPlate = { orderId: state.plate.orderId, recipeId: state.plate.recipeId };
    state.plate = null;
    if (sfx) sfx.ready();
    if (fx) fx.plateReady();
  }
  return { ok: true, deposited };
}

export function takeReadyPlate(state, sfx) {
  if (!state.readyPlate) return { ok: false };
  if (state.carrying.length > 0) return { ok: false };
  state.carrying.push('plate:' + state.readyPlate.orderId);
  state.readyPlate = null;
  if (sfx) sfx.take();
  return { ok: true };
}

// Serve the carried plate. Returns the coins earned, or false.
export function useServe(state, sfx, fx) {
  const hands = state.carrying;
  const plateIdx = hands.findIndex((id) => typeof id === 'string' && id.startsWith('plate:'));
  if (plateIdx === -1) {
    if (sfx) sfx.error();
    return { ok: false };
  }
  const orderId = Number(hands[plateIdx].slice(6));
  const order = state.orders.find((o) => o.id === orderId && o.state === 'open');
  if (!order) {
    if (sfx) sfx.error();
    if (fx) fx.shake();
    return { ok: false };
  }
  hands.splice(plateIdx, 1);
  order.state = 'served';
  state.served += 1;
  const amount = addCoins(state, RECIPES[order.recipeId].price);
  state.servedFlash = 1;
  if (sfx) sfx.serve();
  if (fx) fx.servePop(amount, state.multiplier);
  return { ok: true, amount, order };
}

export function useBin(state, sfx) {
  if (state.carrying.length === 0 && !state.plate?.stale) return { ok: false };
  if (state.plate?.stale) state.plate = null;
  state.carrying.length = 0;
  if (sfx) sfx.bin();
  return { ok: true };
}

export function handsFull(state) {
  return state.carrying.length >= 4;
}
