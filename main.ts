// SATE NIGHT — a best-cooking-game-01 entry (Node 22, standard library only).
// A 2D time-management cooking game set at a Jakarta street satay stall after dark:
// charcoal glowing orange, smoke curling up, skewers sizzling on the grill, peanut
// sauce, lontong rice cakes, shallots and chili on the counter. Orders arrive on
// tickets with prices and countdowns; the cook grills each satay to the right
// doneness (flip it before it burns), assembles the plate with sauce and lontong,
// and serves it before the customer loses patience. Coins, score, streaks and a
// shift timer drive the rush; too many failed orders and the night ends early.
// The game itself is this directory's game/ folder — plain static files a desktop
// browser loads offline (game/index.html and its ES modules, GSAP vendored locally
// under game/vendor/, no network request) — and this program hands it in: it copies
// game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored make.fun
// library. Screenshots live in screenshots/ (the first by name is the cover).
//
// Local preview: run `node serve.ts` and open http://localhost:8080.
// To run the hand-in outside the grader, point MAKEFUN_OUTPUT_DIR at a folder:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
