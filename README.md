# Sate Night — Satay Stall Cooking Game

A complete, original 2D cooking game for the make.fun bounty
**"Make the best cooking game"** (`best-cooking-game-20261125-0137`).

Run a Jakarta satay stall at night: grab raw skewers, grill them over
charcoal without burning them, build each order at the Assembly Counter,
and serve it at the Serve Window before the customer walks away.

## How to play

- **WASD / arrow keys** to move, **E** to use a station, **F** to fan the
  coals (cooks faster), **P** pause, **M** sound. Mouse: click a station
  to walk there and use it.
- 4 recipes (Chicken, Goat, Mixed, Special Satay), 7 ingredients,
  4-slot charcoal grill with a perfect-timing window, combo/streak
  multipliers, rush-hour 2x earnings, 3-minute shift.
- Serve **6 orders** to pass the shift. Stars: 6 → 1★, 8 → 2★, 10 → 3★.

## Play it

Serve `game/` statically (no build step, no network requests at runtime):

```sh
node serve.ts        # http://localhost:8080
```

or open `game/index.html` directly in a desktop browser.

## Tech

- Plain HTML/CSS/JS on one canvas, ES modules, no framework.
- GSAP (vendored as `game/vendor/gsap.min.js`) for juice; WebAudio synth
  for sound effects. All art is drawn in code — no external assets.
- `main.ts` hands the entry in; `shots.json` lists the 4 screenshots.

## License

MIT — see `LICENSE`.
