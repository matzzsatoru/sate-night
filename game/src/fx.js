// fx.js — juice: GSAP tweens on plain objects, plus particle bursts.
// One job: make actions feel good (motion_design: Playful archetype —
// back.out pops, 150-300ms, overshoot 10-20%, three layers: primary +
// secondary + ambient). GSAP is window.gsap, vendored locally.

import { STATIONS, grillSlotPos, COLORS } from './data.js';

function gsap() {
  return window.gsap || null;
}

export function createFx(state) {
  const g = gsap();

  function floatText(x, y, text, color, size = 26) {
    const f = { x, y, text, color, size, alpha: 1, scale: 0.6 };
    state.floats.push(f);
    if (g) {
      g.to(f, { y: y - 64, alpha: 0, scale: 1.15, duration: 1.0, ease: 'power2.out',
        onComplete: () => {
          const i = state.floats.indexOf(f);
          if (i !== -1) state.floats.splice(i, 1);
        } });
      g.to(f, { scale: 1, duration: 0.22, ease: 'back.out(2.2)' });
    } else {
      f.scale = 1;
    }
    return f;
  }

  function burst(x, y, n, colors, speed = 120) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
        life: 0, maxLife: 0.6 + Math.random() * 0.5,
        size: 3 + Math.random() * 5,
        color: colors[i % colors.length], kind: 'spark',
      });
    }
  }

  return {
    cookPop(pos, quality) {
      if (quality === 'perfect') {
        floatText(pos.x, pos.y - 30, 'PERFECT!', COLORS.gold, 24);
        burst(pos.x, pos.y, 10, [COLORS.gold, COLORS.amber, '#fff3d6']);
      } else if (quality === 'burnt') {
        floatText(pos.x, pos.y - 30, 'BURNT!', '#ff6b5e', 22);
      }
    },
    servePop(amount, multiplier) {
      const s = STATIONS.serve;
      const cx = s.x + s.w / 2;
      floatText(cx, s.y + 40, `+$${amount}`, COLORS.gold, 34);
      if (multiplier > 1) floatText(cx, s.y + 78, `COMBO x${multiplier}`, '#ff9d5c', 20);
      burst(cx, s.y + 60, 16, [COLORS.gold, COLORS.amber, '#fff3d6', '#ffb347'], 160);
      state.servedFlash = 1;
    },
    plateReady() {
      const a = STATIONS.assembly;
      floatText(a.x + a.w / 2, a.y - 14, 'READY TO SERVE!', COLORS.leaf, 24);
      burst(a.x + a.w / 2, a.y + a.h / 2, 12, [COLORS.leaf, '#fff3d6', COLORS.gold]);
    },
    fanBurst() {
      const gr = STATIONS.grill;
      burst(gr.x + gr.w / 2, gr.y + 40, 18, [COLORS.ember, COLORS.emberHot, COLORS.gold], 200);
    },
    shake() {
      state.shake = 1;
      if (g) g.to(state, { shake: 0, duration: 0.35, ease: 'power1.out' });
    },
    ticketIn(el) {
      // el is a plain {y, alpha} used by hud when a ticket appears.
      if (!g || !el) return;
      g.fromTo(el, { y: -18, alpha: 0 }, { y: 0, alpha: 1, duration: 0.3, ease: 'back.out(1.7)' });
    },
  };
}

export function updateParticles(state, dt) {
  for (const p of state.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'smoke') { p.vy -= 12 * dt; p.size += 14 * dt; }
    if (p.kind === 'spark') { p.vy += 260 * dt; }
    if (p.kind === 'ember') { p.y -= 22 * dt; p.x += Math.sin(p.life * 6 + p.seed) * 12 * dt; }
  }
  state.particles = state.particles.filter((p) => p.life < p.maxLife);
  if (state.servedFlash > 0) state.servedFlash = Math.max(0, state.servedFlash - dt * 2.2);
}

export function spawnAmbient(state, dt, rand) {
  // Smoke from the grill + embers + string-light flicker handled in render.
  const gr = STATIONS.grill;
  const cooking = state.grill.filter(Boolean).length;
  if (cooking > 0 && Math.random() < dt * (4 + cooking * 3)) {
    const slot = grillSlotPos(Math.floor(Math.random() * 4));
    state.particles.push({
      x: slot.x + (Math.random() - 0.5) * 30, y: gr.y + 30,
      vx: (Math.random() - 0.5) * 8, vy: -26 - Math.random() * 18,
      life: 0, maxLife: 1.6 + Math.random(), size: 5 + Math.random() * 5,
      color: COLORS.smoke, kind: 'smoke', seed: Math.random() * 10,
    });
  }
  if (Math.random() < dt * 6) {
    state.particles.push({
      x: gr.x + 20 + Math.random() * (gr.w - 40), y: gr.y + gr.h - 14,
      vx: 0, vy: 0, life: 0, maxLife: 0.9 + Math.random() * 0.8,
      size: 2 + Math.random() * 3,
      color: Math.random() < 0.5 ? COLORS.ember : COLORS.emberHot, kind: 'ember', seed: Math.random() * 10,
    });
  }
}
