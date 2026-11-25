// render.js — draws the whole satay stall on one canvas: wall, floor, stations,
// the cook, the food, smoke and embers. One job: everything you SEE in
// the playfield (the HUD bar, tickets and screens live in hud.js).

import { VIEW_W, VIEW_H, COLORS, STATIONS, INGREDIENTS, RECIPES, grillSlotPos, FLOOR } from './data.js';
import { grillCookPercent, grillQuality } from './stations.js';
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

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

// ---- ingredient glyphs (drawn, never images) ----

export function drawIngredientIcon(ctx, id, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const ing = INGREDIENTS[id];
  if (!ing) { ctx.restore(); return; }
  if (id === 'ayamMentah' || id === 'kambingMentah' || id === 'ayamBakar' || id === 'kambingBakar' || id === 'gosong') {
    drawSkewerIcon(ctx, ing.color, id === 'gosong');
  } else if (id === 'lontong') {
    ctx.fillStyle = '#2f7d32';
    rr(ctx, -13, -7, 26, 15, 4); ctx.fill();
    ctx.fillStyle = '#f5f0dc';
    rr(ctx, -10, -5, 20, 11, 3); ctx.fill();
    ctx.strokeStyle = '#d8cf9f';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-4, -5); ctx.lineTo(-4, 6); ctx.moveTo(3, -5); ctx.lineTo(3, 6); ctx.stroke();
  } else if (id === 'kacang' || id === 'sambal') {
    ctx.fillStyle = id === 'kacang' ? '#8a5a2b' : '#b02020';
    ctx.beginPath(); ctx.arc(0, 2, 11, 0, Math.PI); ctx.fill();
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.ellipse(0, 1, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (id === 'sambal') {
      ctx.fillStyle = '#e23b2e';
      ctx.beginPath(); ctx.ellipse(4, -3, 4, 6, 0.6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'kecap') {
    ctx.fillStyle = '#2b1608';
    rr(ctx, -5, -10, 10, 20, 3); ctx.fill();
    ctx.fillStyle = '#e23b2e';
    rr(ctx, -5, -13, 10, 5, 2); ctx.fill();
  } else if (id === 'bawang') {
    ctx.fillStyle = '#e8b04b';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 6, Math.sin(a) * 4, 4, 2, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSkewerIcon(ctx, color, burnt) {
  ctx.strokeStyle = '#d8b98a';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = burnt ? '#14100c' : color;
    rr(ctx, i * 9 - 5, -6, 10, 12, 3); ctx.fill();
    if (!burnt) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      rr(ctx, i * 9 - 5, -6, 10, 4, 2); ctx.fill();
    }
  }
}

function drawSkewerOnGrill(ctx, slot, x, y, t) {
  const p = grillCookPercent(slot);
  const q = grillQuality(slot);
  const base = q === 'burnt' ? '#14100c' : q === 'perfect' ? '#c97b28' : q === 'cooking' ? '#d89a5a' : '#f2a594';
  if (q === 'perfect') {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y, 40, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.5, 1.5);
  drawSkewerIcon(ctx, base, q === 'burnt');
  ctx.restore();
  // cook meter under the skewer
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  rr(ctx, x - 26, y + 12, 52, 6, 3); ctx.fill();
  const col = q === 'burnt' ? '#222' : q === 'perfect' ? COLORS.gold : q === 'cooking' ? COLORS.amber : '#f2a594';
  ctx.fillStyle = col;
  rr(ctx, x - 26, y + 12, 52 * p, 6, 3); ctx.fill();
  // perfect window marker
  ctx.fillStyle = 'rgba(255,210,63,0.9)';
  ctx.fillRect(x - 26 + 52 * 0.68, y + 11, 2, 8);
  ctx.fillRect(x - 26 + 52 * 0.96, y + 11, 2, 8);
}

function drawPlate(ctx, x, y, r, items) {
  ctx.fillStyle = '#f5f0dc';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8cf9f';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.72, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
  if (!items) return;
  items.forEach((id, i) => {
    const a = -Math.PI / 2 + (i / Math.max(1, items.length)) * Math.PI * 2;
    drawIngredientIcon(ctx, id, x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.28, 0.85);
  });
}

// ---- the scene ----

function drawWall(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 150);
  g.addColorStop(0, COLORS.wallTop);
  g.addColorStop(1, COLORS.wallBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, 150);
  // string lights — hung low so they show below the top bar (y 0-108)
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 108);
  for (let x = 0; x <= VIEW_W; x += 64) ctx.lineTo(x, 108 + Math.sin(x / 220) * 5 + 5);
  ctx.stroke();
  for (let x = 32; x < VIEW_W; x += 64) {
    const y = 108 + Math.sin(x / 220) * 5 + 5 + 7;
    const flick = 0.75 + 0.25 * Math.sin(t * 3 + x);
    ctx.save();
    ctx.globalAlpha = flick;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = flick * 0.25;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // stall sign
  ctx.fillStyle = '#3a1f16';
  rr(ctx, 470, 58, 340, 46, 10); ctx.fill();
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 2;
  rr(ctx, 470, 58, 340, 46, 10); ctx.stroke();
  ctx.fillStyle = COLORS.amber;
  ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SATE NIGHT  •  OPEN', 640, 82);
}

// ---- the dining floor: wood planks, warm grill glow, tables with diners ----

function drawPendantLamp(ctx, x, yBulb, t, seed) {
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, yBulb); ctx.stroke();
  const flick = 0.9 + 0.1 * Math.sin(t * 3 + seed);
  const g = ctx.createRadialGradient(x, yBulb + 8, 2, x, yBulb + 8, 58);
  g.addColorStop(0, `rgba(255,210,63,${(0.5 * flick).toFixed(3)})`);
  g.addColorStop(1, 'rgba(255,210,63,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, yBulb + 8, 58, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a2f23';
  ctx.beginPath(); ctx.arc(x, yBulb - 2, 10, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.arc(x, yBulb + 6, 7, 0, Math.PI * 2); ctx.fill();
  // cone of light down to the table
  const cone = ctx.createLinearGradient(0, yBulb + 10, 0, yBulb + 150);
  cone.addColorStop(0, 'rgba(255,210,63,0.13)');
  cone.addColorStop(1, 'rgba(255,210,63,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(x - 9, yBulb + 10); ctx.lineTo(x + 9, yBulb + 10);
  ctx.lineTo(x + 70, yBulb + 150); ctx.lineTo(x - 70, yBulb + 150);
  ctx.closePath(); ctx.fill();
}

function drawDiner(ctx, x, y, skin, shirt, t, seed) {
  const bob = Math.sin(t * 2 + seed) * 1.5;
  ctx.fillStyle = shirt;
  ctx.beginPath(); ctx.arc(x, y + 16 + bob, 20, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - 20, y + 14 + bob, 40, 12);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(x, y + bob, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#241608';
  ctx.beginPath(); ctx.arc(x, y - 4 + bob, 13, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#1c1410';
  ctx.beginPath(); ctx.arc(x - 5, y + bob, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5, y + bob, 1.8, 0, Math.PI * 2); ctx.fill();
}

function drawDiningTable(ctx, x, y, t, seed) {
  drawPendantLamp(ctx, x, y - 132, t, seed);
  // diners sitting on the far side
  drawDiner(ctx, x - 52, y - 46, '#f2c184', '#c0392b', t, seed);
  drawDiner(ctx, x + 52, y - 46, '#e8b88a', '#2b6cb0', t, seed + 2);
  // chairs on the near side
  for (const cx of [x - 52, x + 52]) {
    ctx.fillStyle = '#5a3a20';
    rr(ctx, cx - 18, y + 44, 36, 10, 4); ctx.fill();
    ctx.fillStyle = '#8a5a33';
    rr(ctx, cx - 18, y + 38, 36, 8, 4); ctx.fill();
  }
  // pedestal + round wooden top
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(x - 5, y + 10, 10, 46);
  ctx.fillStyle = '#6b4226';
  ctx.beginPath(); ctx.ellipse(x, y + 56, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath(); ctx.ellipse(x, y, 82, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a9743f';
  ctx.beginPath(); ctx.ellipse(x, y - 3, 82, 24, 0, 0, Math.PI * 2); ctx.fill();
  // plates with satay + glasses of iced tea on the table
  drawPlate(ctx, x - 34, y - 6, 20, ['ayamBakar', 'kacang']);
  drawPlate(ctx, x + 36, y - 4, 20, ['kambingBakar', 'lontong']);
  for (const gx of [x - 8, x + 14]) {
    ctx.fillStyle = 'rgba(255,165,60,0.9)';
    rr(ctx, gx - 5, y - 14, 10, 16, 3); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(gx - 5, y - 14, 10, 3);
    ctx.strokeStyle = '#e23b2e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(gx + 2, y - 14); ctx.lineTo(gx + 6, y - 22); ctx.stroke();
  }
}

function drawFloor(ctx, t) {
  // Warm wood planks: staggered rows, varied browns, grain lines.
  const plankH = 46;
  for (let y = 0; y < 7; y++) {
    const y0 = 330 + y * plankH;
    let x = 8 - ((y * 97) % 200);
    let i = 0;
    while (x < 1272) {
      const w = 190 + ((y * 37 + i * 61) % 70);
      const shade = (y + i) % 3;
      ctx.fillStyle = shade === 0 ? '#4a2e1f' : shade === 1 ? '#54371f' : '#40271a';
      ctx.fillRect(x, y0, Math.min(w, 1272 - x), plankH);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 8, y0 + plankH * 0.35);
      ctx.bezierCurveTo(x + w * 0.3, y0 + plankH * 0.3, x + w * 0.6, y0 + plankH * 0.42, x + w - 8, y0 + plankH * 0.36);
      ctx.moveTo(x + 10, y0 + plankH * 0.7);
      ctx.bezierCurveTo(x + w * 0.35, y0 + plankH * 0.66, x + w * 0.65, y0 + plankH * 0.75, x + w - 10, y0 + plankH * 0.7);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + w - 2, y0, 2, plankH);
      x += w;
      i++;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(8, y0, 1264, 2);
  }
  // warm glow spilling from the charcoal grill onto the floor
  const glow = ctx.createRadialGradient(460, 330, 20, 460, 330, 560);
  glow.addColorStop(0, 'rgba(255,122,26,0.16)');
  glow.addColorStop(1, 'rgba(255,122,26,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(8, 330, 1264, 322);
  // dining tables with customers, under pendant lamps
  drawDiningTable(ctx, 300, 555, t, 0);
  drawDiningTable(ctx, 985, 555, t, 3);
  // woven mat (lesehan corner) with a low table set for two
  ctx.fillStyle = '#7a5a2e';
  rr(ctx, 480, 470, 320, 110, 16); ctx.fill();
  ctx.strokeStyle = '#a8843f';
  ctx.lineWidth = 3;
  rr(ctx, 480, 470, 320, 110, 16); ctx.stroke();
  ctx.strokeStyle = 'rgba(168,132,63,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(660, 500); ctx.lineTo(780, 500);
  ctx.moveTo(660, 525); ctx.lineTo(780, 525);
  ctx.moveTo(660, 550); ctx.lineTo(780, 550);
  ctx.stroke();
  ctx.fillStyle = '#6b4226';
  rr(ctx, 505, 498, 130, 38, 8); ctx.fill();
  ctx.fillStyle = '#8a5a33';
  rr(ctx, 505, 498, 130, 12, 8); ctx.fill();
  drawPlate(ctx, 535, 494, 15, ['ayamBakar']);
  drawPlate(ctx, 600, 494, 15, ['kambingBakar', 'lontong']);
  // two low wooden stools
  for (const sx of [420, 860]) {
    ctx.fillStyle = '#6b4226';
    ctx.beginPath(); ctx.ellipse(sx, 520, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath(); ctx.ellipse(sx, 514, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(sx - 18, 524, 5, 14);
    ctx.fillRect(sx + 13, 524, 5, 14);
  }
  // potted plant by the trash
  ctx.fillStyle = '#7cb342';
  ctx.beginPath(); ctx.ellipse(1240, 588, 10, 22, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1252, 592, 9, 18, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1228, 592, 9, 18, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a8542f';
  ctx.beginPath();
  ctx.moveTo(1226, 606); ctx.lineTo(1254, 606); ctx.lineTo(1249, 628); ctx.lineTo(1231, 628);
  ctx.closePath(); ctx.fill();
  // soft vignette so the edges fall away from the action
  const vg = ctx.createRadialGradient(640, 490, 240, 640, 490, 720);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(8, 330, 1264, 322);
}

function drawCrates(ctx, state, near) {
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  STATIONS.crates.forEach((c, i) => {
    const ing = INGREDIENTS[c.ing];
    const isNear = near && near.kind === 'crate' && near.index === i;
    ctx.fillStyle = isNear ? '#a9743f' : COLORS.wood;
    rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
    ctx.strokeStyle = isNear ? COLORS.gold : '#5a3a20';
    ctx.lineWidth = isNear ? 3 : 2;
    rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.stroke();
    drawIngredientIcon(ctx, c.ing, c.x + 34, c.y + c.h / 2, 1.1);
    ctx.fillStyle = COLORS.cream;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ing.name, c.x + 62, c.y + c.h / 2 - 8);
    ctx.fillStyle = 'rgba(255,243,214,0.65)';
    ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(ing.kind === 'skewer' ? 'raw — grill it' : ing.kind === 'sauce' ? 'sauce' : ing.kind === 'side' ? 'side dish' : 'topping', c.x + 62, c.y + c.h / 2 + 11);
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'right';
    ctx.fillText('E', c.x + c.w - 12, c.y + c.h / 2);
  });
}

function drawGrill(ctx, state, t, near) {
  const g = STATIONS.grill;
  const isNear = near && near.kind === 'grill';
  const gg = ctx.createLinearGradient(0, g.y, 0, g.y + g.h);
  gg.addColorStop(0, '#33200f');
  gg.addColorStop(1, '#1c110a');
  ctx.fillStyle = gg;
  rr(ctx, g.x, g.y, g.w, g.h, 12); ctx.fill();
  ctx.strokeStyle = isNear ? COLORS.gold : '#4a3220';
  ctx.lineWidth = isNear ? 3 : 2;
  rr(ctx, g.x, g.y, g.w, g.h, 12); ctx.stroke();
  // warm glow above the coals
  ctx.save();
  rr(ctx, g.x, g.y, g.w, g.h, 12); ctx.clip();
  const glow = ctx.createRadialGradient(g.x + g.w / 2, g.y + g.h - 30, 10, g.x + g.w / 2, g.y + g.h - 30, 260);
  glow.addColorStop(0, `rgba(255,122,26,${(0.20 + 0.06 * Math.sin(t * 4)).toFixed(3)})`);
  glow.addColorStop(1, 'rgba(255,122,26,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(g.x, g.y, g.w, g.h);
  // grate bars behind the skewers
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const gy = g.y + 44 + i * 22;
    ctx.beginPath(); ctx.moveTo(g.x + 12, gy); ctx.lineTo(g.x + g.w - 12, gy); ctx.stroke();
  }
  ctx.restore();
  // ember bed, brighter and alive
  const pulse = 0.6 + 0.4 * Math.sin(t * 4);
  ctx.save();
  ctx.globalAlpha = 0.65 * pulse;
  ctx.fillStyle = COLORS.ember;
  rr(ctx, g.x + 14, g.y + g.h - 36, g.w - 28, 24, 10); ctx.fill();
  ctx.restore();
  for (let i = 0; i < 12; i++) {
    const ex = g.x + 24 + i * 30 + Math.sin(t * 2 + i * 2) * 3;
    circle(ctx, ex, g.y + g.h - 24, 4 + (i % 3), i % 2 ? COLORS.emberHot : COLORS.ember);
  }
  // flame tongues licking up from the coals
  for (let i = 0; i < 4; i++) {
    const fx0 = g.x + 60 + i * 88;
    const fh = 14 + 8 * Math.sin(t * 7 + i * 2.4);
    const fl = 0.5 + 0.3 * Math.sin(t * 9 + i * 3.1);
    ctx.save();
    ctx.globalAlpha = fl;
    ctx.fillStyle = i % 2 ? '#ffb347' : '#ff7a1a';
    ctx.beginPath();
    ctx.moveTo(fx0 - 9, g.y + g.h - 34);
    ctx.quadraticCurveTo(fx0 - 4, g.y + g.h - 34 - fh, fx0, g.y + g.h - 36 - fh - 6);
    ctx.quadraticCurveTo(fx0 + 4, g.y + g.h - 34 - fh, fx0 + 9, g.y + g.h - 34);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHARCOAL GRILL', g.x + 14, g.y + 16);
  ctx.fillStyle = 'rgba(255,243,214,0.7)';
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('E place / take   •   F fan the coals', g.x + 14, g.y + 34);
  state.grill.forEach((slot, i) => {
    const p = grillSlotPos(i);
    if (slot) drawSkewerOnGrill(ctx, slot, p.x, p.y, t);
    else {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 32, 11, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  if (state.fanBoost > 0) {
    ctx.fillStyle = 'rgba(255,210,63,0.9)';
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FAN! COALS BLAZING', g.x + g.w / 2, g.y + g.h - 44);
  }
}

function drawAssembly(ctx, state, t, near) {
  const a = STATIONS.assembly;
  const isNear = near && near.kind === 'assembly';
  const ready = !!state.readyPlate;
  ctx.fillStyle = ready ? '#5a7a3a' : COLORS.wood;
  rr(ctx, a.x, a.y, a.w, a.h, 12); ctx.fill();
  ctx.strokeStyle = ready ? COLORS.gold : (isNear ? COLORS.gold : '#5a3a20');
  ctx.lineWidth = ready ? 3 : 2;
  rr(ctx, a.x, a.y, a.w, a.h, 12); ctx.stroke();
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ASSEMBLY COUNTER', a.x + 14, a.y + 16);
  const prog = plateProgress(state);
  if (state.readyPlate) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 6);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(a.x + a.w / 2, a.y + 104, 74, 30, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    const rec = RECIPES[state.readyPlate.recipeId];
    drawPlate(ctx, a.x + a.w / 2, a.y + 104, 52, rec.needs);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('READY — take it (E)', a.x + a.w / 2, a.y + 152);
  } else if (state.plate) {
    const rec = RECIPES[state.plate.recipeId];
    drawPlate(ctx, a.x + a.w / 2, a.y + 104, 52, state.plate.placed);
    ctx.fillStyle = state.plate.stale ? '#ff8a7a' : COLORS.cream;
    ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    const label = state.plate.stale ? 'ORDER EXPIRED — bin it' : `Build: ${rec.name}  ${prog.placed}/${prog.total}`;
    ctx.fillText(label, a.x + a.w / 2, a.y + 152);
    // remaining slots
    prog.remaining.forEach((id, i) => {
      drawIngredientIcon(ctx, id, a.x + 40 + i * 34, a.y + 44, 0.8);
    });
  } else {
    ctx.fillStyle = 'rgba(255,243,214,0.6)';
    ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Build orders here (E)', a.x + a.w / 2, a.y + 96);
    ctx.fillText('The ingredients you need appear on their own', a.x + a.w / 2, a.y + 118);
  }
}

function drawServe(ctx, state, t, near) {
  const s = STATIONS.serve;
  const isNear = near && near.kind === 'serve';
  const flash = state.servedFlash;
  ctx.fillStyle = '#2b3a4a';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.strokeStyle = flash > 0.3 ? COLORS.gold : (isNear ? COLORS.gold : '#1c2836');
  ctx.lineWidth = flash > 0.3 ? 4 : 2;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke();
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SERVE WINDOW', s.x + 14, s.y + 16);
  // customer face
  const open = state.orders.filter((o) => o.state === 'open')[0];
  const cx = s.x + s.w / 2;
  const cy = s.y + 92;
  if (open) {
    const cust = open.customer;
    const mood = open.timeLeft < 12 ? 'worried' : open.timeLeft < 25 ? 'neutral' : 'happy';
    circle(ctx, cx, cy, 34, cust.skin);
    ctx.fillStyle = '#5a3a20';
    ctx.beginPath(); ctx.arc(cx, cy - 26, 30, Math.PI, 0); ctx.fill();
    if (cust.hat === 'cap') { ctx.fillStyle = '#c0392b'; rr(ctx, cx - 30, cy - 34, 60, 12, 6); ctx.fill(); }
    if (cust.hat === 'band') { ctx.fillStyle = '#2b6cb0'; rr(ctx, cx - 30, cy - 30, 60, 8, 4); ctx.fill(); }
    ctx.fillStyle = '#1c1410';
    circle(ctx, cx - 12, cy - 4, 3.5, '#1c1410');
    circle(ctx, cx + 12, cy - 4, 3.5, '#1c1410');
    ctx.strokeStyle = '#1c1410';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (mood === 'happy') ctx.arc(cx, cy + 8, 12, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (mood === 'neutral') { ctx.moveTo(cx - 10, cy + 12); ctx.lineTo(cx + 10, cy + 12); }
    else ctx.arc(cx, cy + 22, 10, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = COLORS.cream;
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(open.customer.name, cx, s.y + 152);
  } else {
    ctx.fillStyle = 'rgba(255,243,214,0.6)';
    ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No customers yet', cx, cy);
  }
  // bell
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath(); ctx.arc(s.x + s.w - 26, s.y + 26, 10, Math.PI, 0); ctx.fill();
  ctx.fillRect(s.x + s.w - 32, s.y + 26, 12, 3);
}

function drawBin(ctx, state, near) {
  const b = STATIONS.bin;
  const isNear = near && near.kind === 'bin';
  ctx.fillStyle = '#3a4a5a';
  rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
  ctx.strokeStyle = isNear ? COLORS.gold : '#22303f';
  ctx.lineWidth = 2;
  rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.stroke();
  ctx.fillStyle = '#7a8a9a';
  rr(ctx, b.x + 22, b.y + 22, 72, 46, 6); ctx.fill();
  ctx.fillStyle = '#5a6a7a';
  rr(ctx, b.x + 16, b.y + 14, 84, 10, 4); ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TRASH', b.x + b.w / 2, b.y + b.h - 10);
}

function drawCook(ctx, state, t) {
  const c = state.cook;
  const bob = c.moving ? Math.sin(t * 14) * 2 : 0;
  const squash = 1 - c.squash * 0.12;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  ctx.scale(2 - squash > 1 ? 1 : 1, squash);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 18, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
  // body + apron
  ctx.fillStyle = '#f5f0dc';
  rr(ctx, -14, -6, 28, 26, 8); ctx.fill();
  ctx.fillStyle = '#2b6cb0';
  rr(ctx, -11, 2, 22, 18, 6); ctx.fill();
  // head
  circle(ctx, 0, -16, 12, '#f2c184');
  // chef hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-6, -26, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -26, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-11, -28, 22, 8);
  // eyes
  ctx.fillStyle = '#1c1410';
  circle(ctx, -4 * c.face, -16, 1.8, '#1c1410');
  circle(ctx, 4 * c.face, -16, 1.8, '#1c1410');
  // arms
  ctx.strokeStyle = '#f5f0dc';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-12, 2); ctx.lineTo(-18, 10);
  ctx.moveTo(12, 2); ctx.lineTo(18, 10);
  ctx.stroke();
  ctx.restore();
  // carried items above head
  if (state.carrying.length) {
    const n = state.carrying.length;
    state.carrying.forEach((id, i) => {
      const x = c.x + (i - (n - 1) / 2) * 26;
      const y = c.y - 46;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      circle(ctx, x, y, 13, 'rgba(0,0,0,0.45)');
      if (typeof id === 'string' && id.startsWith('plate:')) {
        drawPlate(ctx, x, y, 12, null);
      } else {
        drawIngredientIcon(ctx, id, x, y, 0.9);
      }
    });
  }
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = Math.max(0, 1 - p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = p.kind === 'smoke' ? a * 0.5 : a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloats(ctx, state) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of state.floats) {
    ctx.save();
    ctx.globalAlpha = f.alpha;
    ctx.translate(f.x, f.y);
    ctx.scale(f.scale, f.scale);
    ctx.font = `bold ${f.size}px "Trebuchet MS", Verdana, sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.strokeText(f.text, 0, 0);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, 0, 0);
    ctx.restore();
  }
}

export function drawScene(ctx, state, t, near) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 8 * state.shake, (Math.random() - 0.5) * 8 * state.shake);
  }
  drawWall(ctx, t);
  drawFloor(ctx, t);
  drawCrates(ctx, state, near);
  drawGrill(ctx, state, t, near);
  drawAssembly(ctx, state, t, near);
  drawServe(ctx, state, t, near);
  drawBin(ctx, state, near);
  drawCook(ctx, state, t);
  drawParticles(ctx, state);
  drawFloats(ctx, state);
  ctx.restore();
}
