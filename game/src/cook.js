// cook.js — the little chef: movement, carrying, and using stations.
// One job: the player character and how they interact with the stall.

import { STATIONS, stationApproach, stationRect, FLOOR, INGREDIENTS } from './data.js';
import { useGrill, fanGrill, useAssembly, takeReadyPlate, useServe, useBin } from './stations.js';

const SPEED = 340;
const RADIUS = 16;

function clampToFloor(c) {
  c.x = Math.max(FLOOR.x + RADIUS, Math.min(FLOOR.x + FLOOR.w - RADIUS, c.x));
  c.y = Math.max(150, Math.min(FLOOR.y + FLOOR.h - RADIUS, c.y));
}

function collideStations(c) {
  // Push the cook out of station rectangles (top band only).
  const rects = [
    STATIONS.grill, STATIONS.assembly, STATIONS.serve,
    ...STATIONS.crates, STATIONS.bin,
  ];
  for (const r of rects) {
    const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
    const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
    const dx = c.x - nx;
    const dy = c.y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 < RADIUS * RADIUS) {
      if (d2 === 0) { c.y = r.y + r.h + RADIUS; continue; }
      const d = Math.sqrt(d2);
      c.x = nx + (dx / d) * RADIUS;
      c.y = ny + (dy / d) * RADIUS;
    }
  }
}

export function nearestStation(state) {
  const c = state.cook;
  const cands = [];
  STATIONS.crates.forEach((crate, i) => {
    const a = stationApproach('crate', i);
    cands.push({ kind: 'crate', index: i, d: Math.hypot(c.x - a.x, c.y - a.y) });
  });
  for (const kind of ['grill', 'assembly', 'serve', 'bin']) {
    const a = stationApproach(kind);
    cands.push({ kind, index: 0, d: Math.hypot(c.x - a.x, c.y - a.y) });
  }
  cands.sort((a, b) => a.d - b.d);
  return cands[0].d < 120 ? cands[0] : null;
}

export function stationAtPoint(x, y) {
  for (let i = 0; i < STATIONS.crates.length; i++) {
    const r = STATIONS.crates[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { kind: 'crate', index: i };
  }
  for (const kind of ['grill', 'assembly', 'serve', 'bin']) {
    const r = STATIONS[kind];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { kind, index: 0 };
  }
  return null;
}

export function updateCook(state, dt, keys) {
  const c = state.cook;
  let mx = 0;
  let my = 0;
  if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
  if (keys.has('arrowright') || keys.has('d')) mx += 1;
  if (keys.has('arrowup') || keys.has('w')) my -= 1;
  if (keys.has('arrowdown') || keys.has('s')) my += 1;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    c.tx = c.x + (mx / len) * 60;
    c.ty = c.y + (my / len) * 60;
    c.moving = true;
    c.face = mx !== 0 ? Math.sign(mx) : c.face;
  } else if (!c.moving) {
    // idle
  }
  if (c.moving) {
    const dx = c.tx - c.x;
    const dy = c.ty - c.y;
    const d = Math.hypot(dx, dy);
    const step = SPEED * dt;
    if (d <= step) {
      c.x = c.tx;
      c.y = c.ty;
      c.moving = false;
    } else {
      c.x += (dx / d) * step;
      c.y += (dy / d) * step;
      c.face = dx !== 0 ? Math.sign(dx) : c.face;
    }
  }
  c.squash = Math.max(0, c.squash - dt * 6);
  clampToFloor(c);
  collideStations(c);
}

export function walkTo(state, x, y) {
  const c = state.cook;
  c.tx = Math.max(FLOOR.x + RADIUS, Math.min(FLOOR.x + FLOOR.w - RADIUS, x));
  c.ty = Math.max(150, Math.min(FLOOR.y + FLOOR.h - RADIUS, y));
  c.moving = true;
}

export function interact(state, sfx, fx) {
  const near = nearestStation(state);
  if (!near) return { ok: false };
  const c = state.cook;
  c.squash = 1; // anticipation dip, resolved by render
  if (near.kind === 'crate') {
    const ing = STATIONS.crates[near.index].ing;
    if (state.carrying.length >= 4 || state.carrying[0]?.startsWith?.('plate:')) {
      if (sfx) sfx.error();
      return { ok: false };
    }
    state.carrying.push(ing);
    if (sfx) sfx.take();
    return { ok: true, what: 'take-ingredient' };
  }
  if (near.kind === 'grill') return useGrill(state, sfx, fx);
  if (near.kind === 'assembly') {
    if (state.readyPlate) return takeReadyPlate(state, sfx);
    return useAssembly(state, sfx, fx);
  }
  if (near.kind === 'serve') return useServe(state, sfx, fx);
  if (near.kind === 'bin') return useBin(state, sfx);
  return { ok: false };
}

export function interactAt(state, x, y, sfx, fx) {
  const st = stationAtPoint(x, y);
  if (!st) {
    walkTo(state, x, y);
    return { ok: true, what: 'walk' };
  }
  const a = stationApproach(st.kind, st.index);
  walkTo(state, a.x, a.y);
  state.pendingInteract = { kind: st.kind, index: st.index };
  return { ok: true, what: 'walk-interact' };
}

export function updatePendingInteract(state, sfx, fx) {
  if (!state.pendingInteract || state.cook.moving) return;
  const p = state.pendingInteract;
  state.pendingInteract = null;
  const near = nearestStation(state);
  if (!near || near.kind !== p.kind || near.index !== p.index) return;
  interact(state, sfx, fx);
}

export function carryingLabel(state) {
  return state.carrying.map((id) => {
    if (typeof id === 'string' && id.startsWith('plate:')) return 'Serving Plate';
    return INGREDIENTS[id]?.name ?? id;
  });
}
