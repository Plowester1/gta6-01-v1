# SOLMARINA build STATE (v1, @sunny-heron-22) — DONE

Build finished 2026-11-18 ~21:00 WIB. All files written by hand in this
session (small chunks, no opencode/HCNSEC). Starter replaced completely:
world.js deleted, all 7 starter game files rewritten, 11 new game files.

## What was built
- 3200x2400 city: 6 districts (Downtown, Beachfront, Harbor, Old Town,
  Industrial, Highway ring), 87 buildings, parks, palms, containers, pier.
- On foot (WASD, Shift run, Space punch, mouse aim, click shoot), 6 car
  types with damage smoke/fire/explosion, steal any car (E).
- AI traffic (lanes, red lights, braking, honking), pedestrians (flee),
  wanted 1-5 stars, police chase/ram, foot cops, bust, roadblocks 3+.
- 6 Mara Voss missions (drive/pickup/tail/escape/deliver/shootout),
  pistol + ammo, HUD + minimap, title/pause/wasted/busted screens,
  localStorage save, synthesized WebAudio (engine/siren/shots/chimes).

## Verification (measured)
- CDP smoke test (real browser, real key events): title -> Enter -> play;
  walked to parked sedan, E steals it (inCar=sedan, carsStolen=1,
  wanted=1); teleport to Mara marker starts mission 1 (phase=active);
  wanted=3 spawns 3 cops; screen stays play; ZERO console errors.
- 4 screenshots 1280x720 JPEG, viewed by eye: 1-chase 96,241 B (red
  sports car 169 km/h, 2 police chasing, 3 stars, mission + minimap),
  2-street 96,223 B, 3-mission 93,161 B, 4-city 145,936 B (whole city +
  beach + pier + water). All < 256 KiB, all distinct scenes.
- main.ts run TWICE: out/dossier.json byte-identical. Dossier 655,726 B
  (< 1.5 MiB), text 77,490 B (< 160 KiB), 18 source files (76,300 B).
- game/ total 76,300 B (< 48 MiB), 18 files, index.html 793 B.
- grep: 0 network refs (no http/fetch) in game/, 0 Rockstar names in
  game/ + main.ts + README.md + shots.json + STATE.md.
- .makefun/owner.json and LICENSE untouched (git diff empty).
- Bugs found & fixed during testing: minimap covered cash panel (moved
  to bottom-left); player car stuck at 2 km/h in shots (parked van on the
  chase avenue + police ramming — scenes now clear the avenue); E press
  lost between frames (input.fresh queue); steal gave wanted 0 (float
  floor bug — wanted now integer steps, decays 1 star / 20 s unseen).

## Notes for coordinator
- DO NOT submit / create repo / push — that is your job.
- serve.ts root is game/, so the game is at http://localhost:8080/
  index.html (NOT /game/index.html — the prompt's URL 404s on serve.ts).
  shots.json uses the starter's "?shot=...&seed=1" query format.
- Recording 01a1eb45-45f0-7356-b0f1-1aed0bbba8d9 witnessed the session;
  every counted file was written/rewritten here, incl. README.md and
  main.ts. The only "gta6-01" string left is in the starter's own git
  commit message (.git, pre-existing, not part of the game).
- Dev server on :8080 was stopped at the end.
