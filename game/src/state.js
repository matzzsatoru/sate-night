// state.js — the live game state: shift clock, coins, streak, rush, plates.
// One job: create and own the mutable state every other module reads/writes.

import { SHIFT_SECONDS, PASS_TARGET, RECIPES } from './data.js';

export function createState() {
  return {
    mode: 'title', // 'title' | 'playing' | 'over'
    time: 0, // seconds since shift start
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    expired: 0,
    streak: 0,
    bestStreak: 0,
    multiplier: 1,
    rush: false,
    rushLeft: 0,
    rushAt: [60, 125],
    rushDone: [],
    orders: [], // {id, recipeId, customer, timeLeft, total, state}
    nextOrderId: 1,
    spawnIn: 2,
    grill: [null, null, null, null], // {ing, cookT} cookT seconds on grill
    fanBoost: 0,
    fanCooldown: 0,
    plate: null, // {orderId, recipeId, placed: [ingIds]}
    readyPlate: null, // finished plate waiting to be carried
    carrying: [], // ingredient ids, or ['plate:<orderId>']
    cook: { x: 640, y: 520, tx: 640, ty: 520, moving: false, face: 1, squash: 0 },
    floats: [], // {x,y,text,color,t,life} floating score popups (GSAP-tweened)
    shake: 0,
    message: null, // {text, t} banner text
    messageT: 0,
    particles: [], // smoke/ember/spark particles {x,y,vx,vy,life,maxLife,size,color,kind}
    servedFlash: 0,
    endStats: null, // {stars, served, coins, bestStreak, passed}
    muted: false,
    paused: false,
  };
}

export function recipeNeeds(recipeId) {
  return [...RECIPES[recipeId].needs];
}

export function plateProgress(state) {
  if (!state.plate) return null;
  const needs = recipeNeeds(state.plate.recipeId);
  const pool = [...state.plate.placed];
  const remaining = needs.filter((n) => {
    const i = pool.indexOf(n);
    if (i === -1) return true;
    pool.splice(i, 1);
    return false;
  });
  return { placed: state.plate.placed.length, total: needs.length, remaining };
}

export function addCoins(state, base) {
  const amount = base * state.multiplier * (state.rush ? 2 : 1);
  state.coins += amount;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.multiplier = Math.min(1 + Math.floor(state.streak / 2), 5);
  return amount;
}

export function breakStreak(state) {
  state.streak = 0;
  state.multiplier = 1;
}

export function finishShift(state) {
  const passed = state.served >= PASS_TARGET;
  const stars = state.served >= 10 ? 3 : state.served >= 8 ? 2 : passed ? 1 : 0;
  state.mode = 'over';
  state.endStats = { stars, served: state.served, coins: state.coins, bestStreak: state.bestStreak, passed };
  return state.endStats;
}

export function startRush(state, seconds = 20) {
  state.rush = true;
  state.rushLeft = seconds;
  state.message = 'RUSH HOUR!  2x EARNINGS';
  state.messageT = 2.5;
}
