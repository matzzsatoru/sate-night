// main.js — Warung Sate: bootstrap, game loop, keyboard + mouse input.
// One job: wire every module together and run the game.

import { VIEW_W, VIEW_H, SHIFT_SECONDS } from './data.js';
import { mulberry32 } from './rng.js';
import { createState, finishShift } from './state.js';
import { updateOrders } from './orders.js';
import { updateGrill, fanGrill } from './stations.js';
import { updateCook, interact, interactAt, updatePendingInteract, nearestStation } from './cook.js';
import { drawScene } from './render.js';
import { drawTopBar, drawBottomBar, drawRushBanner, drawMessage, drawTitle, drawGameOver, drawPause } from './hud.js';
import { createAudio } from './audio.js';
import { createFx, updateParticles, spawnAmbient } from './fx.js';
import { buildShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1);

let state = shotName ? buildShot(shotName, seed) : createState();
let shotMode = !!shotName;
let rand = mulberry32((Date.now() % 2147483647) || 1);
let sfx = createAudio();
let fx = createFx(state);
let keys = new Set();
let lastT = performance.now();

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
  return dpr;
}

let dpr = fitCanvas();
window.addEventListener('resize', () => { dpr = fitCanvas(); });

function announce(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function startGame() {
  state = createState();
  state.mode = 'playing';
  rand = mulberry32((Date.now() % 2147483647) || 1);
  fx = createFx(state);
  sfx.unlock();
  announce('Shift started. Grill the satay, build the orders, serve before time runs out.');
}

function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * VIEW_W,
    y: ((e.clientY - r.top) / r.height) * VIEW_H,
  };
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (e.repeat) return;
  sfx.unlock();
  if (shotMode) return;
  keys.add(k);
  if (k === 'enter' && state.mode === 'title') { startGame(); return; }
  if (k === 'r' && state.mode === 'over') { startGame(); return; }
  if (k === 'm' && state.mode === 'over') {
    state = createState();
    return;
  }
  if (k === 'm') { state.muted = !state.muted; sfx.setMuted(state.muted); return; }
  if (k === 'p' && state.mode === 'playing') { state.paused = !state.paused; return; }
  if (state.mode !== 'playing' || state.paused) return;
  if (k === 'e' || k === ' ') interact(state, sfx, fx);
  if (k === 'f') fanGrill(state, sfx, fx);
});

window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

canvas.addEventListener('mousedown', (e) => {
  sfx.unlock();
  if (shotMode) return;
  const p = toLogical(e);
  if (state.mode === 'title') { startGame(); return; }
  if (state.mode === 'over') {
    if (p.y >= 410 && p.y <= 466 && p.x >= 490 && p.x <= 790) startGame();
    return;
  }
  if (state.mode !== 'playing' || state.paused) return;
  interactAt(state, p.x, p.y, sfx, fx);
});

function update(dt, t) {
  if (state.mode === 'playing' && !state.paused && !shotMode) {
    state.time += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.time);
    updateOrders(state, dt, rand, sfx);
    updateGrill(state, dt);
    updateCook(state, dt, keys);
    updatePendingInteract(state, sfx, fx);
    if (state.messageT > 0) state.messageT -= dt;
    if (state.timeLeft <= 0) {
      finishShift(state);
      announce(state.endStats.passed ? 'Shift complete. Great night!' : 'Shift over. Target missed.');
    }
  }
  spawnAmbient(state, dt, rand);
  updateParticles(state, dt);
  const cooking = state.grill.filter(Boolean).length;
  sfx.setSizzle(state.mode === 'playing' ? cooking : 0);
}

function render(t) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  const near = state.mode === 'playing' ? nearestStation(state) : null;
  drawScene(ctx, state, t, near);
  if (state.mode !== 'title') {
    drawTopBar(ctx, state, t);
    drawBottomBar(ctx, state);
    drawRushBanner(ctx, state, t);
    if (state.mode === 'playing') drawMessage(ctx, state);
  }
  if (state.mode === 'title') drawTitle(ctx, state, t);
  if (state.mode === 'over') drawGameOver(ctx, state, t);
  if (state.paused && state.mode === 'playing') drawPause(ctx, state);
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  update(dt, now / 1000);
  render(now / 1000);
  requestAnimationFrame(loop);
}

announce('Sate Night. Press Enter to start cooking.');
requestAnimationFrame(loop);
