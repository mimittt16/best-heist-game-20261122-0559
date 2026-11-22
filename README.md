# The Gilded Gallery — a midnight museum heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/mimittt16/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/mimittt16/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A complete 2D top-down stealth game for the make.fun
best-heist-game-20261122-0559 bounty. Midnight at the museum: steal the
Star Sapphire from its glass case, dodge three patrolling guards and two
sweeping security cameras, then slip out the EXIT door before the alarm
meter fills.

## How to play

Serve `game/` with any static HTTP server and open `game/index.html` in
desktop Chrome. No network, no libraries, no build step — vanilla JS,
canvas-drawn art, WebAudio synth sounds.

- **WASD / arrows** — move. **Shift** — sneak (slower, harder to spot).
- **E** (hold) — grab loot from a case. **Click** — throw a coin; the clink
  lures nearby guards to the spot. **1** — smoke bomb (cones can't see
  through it). **2** — EMP (cameras go dark for a while).
- Grab the **Star Sapphire** (worth $500), optionally the Golden Mask
  ($200) and the Jade Vase ($150), then reach the **EXIT** door.
- The **alarm meter** rises while you are inside any vision cone and
  decays when hidden. Cross the spotted line and a guard comes looking;
  fill the meter — or get touched by a guard — and you are **BUSTED**.
- Score: loot value + time bonus − $25 per alarm raised.

## Layout

- `game/index.html` — canvas + HUD shell.
- `game/src/main.js` — boot, game loop, screenshot staging (`?shot=`) and
  self-play (`?autoplay=`) hooks.
- `game/src/config.js` — every tuning number in one place.
- `game/src/world.js` — the gallery room, cover, loot spots, collision and
  line of sight.
- `game/src/guards.js` — patrols, vision cones, investigating noises.
- `game/src/cameras.js` — sweeping camera cones and EMP blackouts.
- `game/src/player.js` — the thief: movement, sneaking, grabbing, tools.
- `game/src/game.js` — the state machine (menu / playing / caught /
  escaped), the alarm meter and scoring.
- `game/src/render.js` — all canvas drawing: room, cones, HUD, screens.
- `game/src/audio.js` — WebAudio synth bleeps (pickup, coin, alarm,
  getaway).
- `screenshots/` — four real renders of the game's own code: the heist in
  full swing, the title screen, a smoke-bomb play, and the getaway.

## Screenshots

1. `1-heist.png` — mid-heist: the room, guards with vision cones,
   cameras, the sapphire target and the alarm meter in one frame.
2. `2-start.png` — title screen over the gallery.
3. `3-tools.png` — a smoke bomb blooming while a guard investigates a
   thrown coin.
4. `4-escape.png` — the GETAWAY screen with the score breakdown.
