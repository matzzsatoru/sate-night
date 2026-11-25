// hud.js — the top bar (order board, shift timer, coins), the bottom bar,
// banners, and the title / game-over screens. One job: everything drawn
// as UI chrome around the playfield, all on the same canvas.
// All text is English so the game reads internationally.

import { VIEW_W, VIEW_H, COLORS, TICKET_W, TICKET_H, RECIPES, INGREDIENTS, SHIFT_SECONDS, PASS_TARGET } from './data.js';
import { drawIngredientIcon } from './render.js';
import { plateProgress } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}

function drawTicket(ctx, order, x, y, t) {
  const rec = RECIPES[order.recipeId];
  const urgent = order.timeLeft < 12;
  const pulse = urgent ? 0.6 + 0.4 * Math.sin(t * 8) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.paper;
  rr(ctx, x, y, TICKET_W, TICKET_H, 8); ctx.fill();
  ctx.strokeStyle = urgent ? '#e23b2e' : '#8a6a3b';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, TICKET_W, TICKET_H, 8); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(rec.name, x + 8, y + 14);
  ctx.fillStyle = '#8a6a3b';
  ctx.font = '11px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(order.customer.name, x + 8, y + 30);
  // recipe icons
  const needs = [...new Set(rec.needs)];
  needs.forEach((id, i) => drawIngredientIcon(ctx, id, x + 20 + i * 30, y + 50, 0.8));
  // price
  ctx.fillStyle = '#2b7a2b';
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`$${rec.price}`, x + TICKET_W - 8, y + 26);
  // countdown bar
  const frac = Math.max(0, order.timeLeft / order.total);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, x + 8, y + TICKET_H - 16, TICKET_W - 16, 8, 4); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7cb342' : frac > 0.25 ? '#e8a13c' : '#e23b2e';
  rr(ctx, x + 8, y + TICKET_H - 16, (TICKET_W - 16) * frac, 8, 4); ctx.fill();
  ctx.fillStyle = urgent ? '#e23b2e' : COLORS.ink;
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.ceil(order.timeLeft)} sec`, x + TICKET_W / 2, y + TICKET_H - 24);
}

export function drawTopBar(ctx, state, t) {
  ctx.fillStyle = '#0a060a';
  ctx.fillRect(0, 0, VIEW_W, 108);
  // title block
  ctx.fillStyle = COLORS.amber;
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥 SATE NIGHT', 16, 26);
  ctx.fillStyle = 'rgba(255,243,214,0.75)';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Night shift • grill • build • serve', 16, 50);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Target: ${state.served}/${PASS_TARGET} orders`, 16, 72);
  // tickets
  const open = state.orders.filter((o) => o.state === 'open');
  open.forEach((o, i) => drawTicket(ctx, o, 252 + i * (TICKET_W + 10), 10, t));
  if (open.length === 0 && state.mode === 'playing') {
    ctx.fillStyle = 'rgba(255,243,214,0.6)';
    ctx.font = 'italic 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Waiting for orders…', 260, 54);
  }
  // right block: shift timer ring + coins + streak
  const cx = 1150;
  const cy = 54;
  const frac = Math.max(0, state.timeLeft / SHIFT_SECONDS);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = frac > 0.3 ? COLORS.amber : '#e23b2e';
  ctx.beginPath(); ctx.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(fmtTime(state.timeLeft), cx, cy);
  ctx.fillStyle = 'rgba(255,243,214,0.6)';
  ctx.font = '10px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('SHIFT', cx, cy + 48);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`$${state.coins}`, 1096, 40);
  ctx.fillStyle = 'rgba(255,243,214,0.75)';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Served: ${state.served}`, 1096, 64);
  ctx.fillStyle = state.multiplier > 1 ? '#ff9d5c' : 'rgba(255,243,214,0.5)';
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(state.multiplier > 1 ? `COMBO x${state.multiplier}  •  streak ${state.streak}` : 'COMBO x1', 1096, 88);
}

export function drawBottomBar(ctx, state) {
  ctx.fillStyle = '#0a060a';
  ctx.fillRect(0, 660, VIEW_W, 60);
  // carrying
  ctx.fillStyle = 'rgba(255,243,214,0.75)';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('CARRYING:', 16, 690);
  if (state.carrying.length === 0) {
    ctx.fillStyle = 'rgba(255,243,214,0.45)';
    ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('empty hands', 96, 690);
  } else {
    state.carrying.forEach((id, i) => {
      const x = 116 + i * 34;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      rr(ctx, x - 14, 676, 28, 28, 6); ctx.fill();
      if (typeof id === 'string' && id.startsWith('plate:')) {
        ctx.fillStyle = '#f5f0dc';
        ctx.beginPath(); ctx.ellipse(x, 690, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        drawIngredientIcon(ctx, id, x, 690, 0.85);
      }
    });
  }
  ctx.fillStyle = 'rgba(255,243,214,0.75)';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows to move  •  E use station  •  F fan the coals  •  click a station to walk there  •  P pause  •  M sound', 640, 690);
  ctx.textAlign = 'right';
  ctx.fillText(state.muted ? 'Sound: OFF (M)' : 'Sound: ON (M)', 1264, 690);
}

export function drawRushBanner(ctx, state, t) {
  if (!state.rush) return;
  const pulse = 0.75 + 0.25 * Math.sin(t * 10);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#e23b2e';
  rr(ctx, 440, 616, 400, 34, 17); ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 19px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🔥 RUSH HOUR!  2x EARNINGS  •  ${Math.ceil(state.rushLeft)} sec`, 640, 634);
  ctx.restore();
}

export function drawMessage(ctx, state) {
  if (!state.message || state.messageT <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.messageT);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  rr(ctx, 390, 480, 500, 54, 12); ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  rr(ctx, 390, 480, 500, 54, 12); ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.message, 640, 508);
  ctx.restore();
}

export function drawPause(ctx, state) {
  if (!state.paused) return;
  ctx.fillStyle = 'rgba(12,6,12,0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 54px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('⏸  PAUSED', 640, 300);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Press P to keep cooking  •  M toggles sound', 640, 360);
}

export function drawTitle(ctx, state, t) {
  ctx.fillStyle = 'rgba(12,6,12,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const bob = Math.sin(t * 2) * 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.amber;
  ctx.font = 'bold 84px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('🔥 SATE NIGHT 🔥', 640, 190 + bob);
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('A Jakarta satay stall at night — grill, build, serve before customers walk away!', 640, 262);
  ctx.fillStyle = 'rgba(255,243,214,0.85)';
  ctx.font = '17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('4 recipes • charcoal grill • rush hour 2x earnings • 3-minute shift', 640, 296);
  // how to play card
  ctx.fillStyle = 'rgba(255,243,214,0.08)';
  rr(ctx, 340, 330, 600, 150, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,179,71,0.5)';
  ctx.lineWidth = 2;
  rr(ctx, 340, 330, 600, 150, 14); ctx.stroke();
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('HOW TO PLAY', 640, 356);
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('1. Grab raw skewers from the crates, grill them just right — don\'t burn them', 640, 388);
  ctx.fillText('2. Build the order at the Assembly Counter, then serve it at the Serve Window', 640, 414);
  ctx.fillText(`3. Serve ${PASS_TARGET} orders before the shift ends. F = fan the coals to cook faster`, 640, 440);
  const pulse = 0.7 + 0.3 * Math.sin(t * 5);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.gold;
  rr(ctx, 440, 510, 400, 60, 14); ctx.fill();
  ctx.fillStyle = '#3a2415';
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('▶  START COOKING  (Enter)', 640, 541);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,243,214,0.6)';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('WASD / arrows + E, or mouse • a complete, original game — Sate Night', 640, 606);
}

export function drawGameOver(ctx, state, t) {
  const s = state.endStats;
  ctx.fillStyle = 'rgba(12,6,12,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = s.passed ? COLORS.gold : '#ff8a7a';
  ctx.font = 'bold 56px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(s.passed ? 'GREAT SHIFT! 🎉' : 'SHIFT OVER 😞', 640, 150);
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(
    s.passed ? `Shift complete — ${s.served} orders served, $${s.coins} earned!` : `Only ${s.served} orders — the target of ${PASS_TARGET} was missed. Try again!`,
    640, 214,
  );
  // stars
  for (let i = 0; i < 3; i++) {
    ctx.font = '54px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = i < s.stars ? COLORS.gold : 'rgba(255,255,255,0.18)';
    ctx.fillText('★', 540 + i * 100, 290);
  }
  ctx.fillStyle = COLORS.cream;
  ctx.font = '19px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Orders served: ${s.served}   •   Earnings: $${s.coins}   •   Best combo: x${Math.min(1 + Math.floor(s.bestStreak / 2), 5)} (streak ${s.bestStreak})`, 640, 360);
  const pulse = 0.7 + 0.3 * Math.sin(t * 5);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.gold;
  rr(ctx, 490, 410, 300, 56, 14); ctx.fill();
  ctx.fillStyle = '#3a2415';
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('↻  PLAY AGAIN  (R)', 640, 439);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,243,214,0.6)';
  ctx.font = '14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Press R for a new shift, or M to go back to the menu', 640, 500);
}
