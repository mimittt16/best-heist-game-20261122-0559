// The state machine: menu, playing, caught, escaped. Owns the alarm meter,
// the spotted grace window, scoring, the timer, and the tool clouds.
import { ALARM, TOOLS, SCORE } from './config.js';
import { createPlayer, hasSapphire, atExit } from './player.js';
import { createGuard, updateGuard, guardSees, guardTouches, sendGuardTo } from './guards.js';
import { createCamera, updateCamera, cameraSees, disableCameras } from './cameras.js';
import { playSpotted, playBusted, playEscape, startAlarmHum, setAlarmHum, stopAlarmHum, unlockAudio } from './audio.js';

export function createGame() {
  return {
    state: 'menu', // menu | playing | caught | escaped
    player: createPlayer(),
    guards: [
      createGuard([
        { x: 200, y: 180 },
        { x: 500, y: 180 },
        { x: 500, y: 260 },
        { x: 200, y: 260 },
      ]),
      createGuard([
        { x: 700, y: 300 },
        { x: 700, y: 450 },
        { x: 860, y: 450 },
        { x: 860, y: 300 },
      ]),
      createGuard([
        { x: 350, y: 560 },
        { x: 600, y: 560 },
        { x: 600, y: 470 },
        { x: 350, y: 470 },
      ]),
    ],
    cameras: [
      createCamera(480, 70, Math.PI / 2, 2.1),
      createCamera(936, 350, Math.PI, 1.9),
    ],
    taken: new Set(),
    smokes: [], // {x, y, radius, timer}
    alarm: 0,
    alarmsRaised: 0,
    spotted: false,
    elapsed: 0,
    score: 0,
    hint: '',
    hintTimer: 0,
    flash: 0, // red edge pulse when spotted
  };
}

export function startRun(game) {
  const fresh = createGame();
  Object.assign(game, fresh);
  game.state = 'playing';
  unlockAudio();
  startAlarmHum();
}

function nearestGuard(game) {
  let best = null;
  let bestDist = Infinity;
  for (const g of game.guards) {
    const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

export function updateGame(game, input, dt, playerEvents) {
  if (game.state !== 'playing') return;
  game.elapsed += dt;

  // Tools the player fired this frame.
  for (const e of playerEvents) {
    if (e.type === 'coin') {
      for (const g of game.guards) {
        if (Math.hypot(g.x - e.x, g.y - e.y) < TOOLS.coinLureRadius) sendGuardTo(g, e.x, e.y);
      }
    } else if (e.type === 'smoke') {
      game.smokes.push({ x: e.x, y: e.y, radius: TOOLS.smokeRadius, timer: TOOLS.smokeSeconds });
    } else if (e.type === 'emp') {
      disableCameras(game.cameras, TOOLS.empSeconds);
    } else if (e.type === 'loot' && e.spot.main) {
      game.hint = 'Sapphire secured — get to the exit!';
      game.hintTimer = 3;
    }
  }
  for (const s of game.smokes) s.timer -= dt;
  game.smokes = game.smokes.filter((s) => s.timer > 0);

  for (const g of game.guards) updateGuard(g, dt);
  for (const c of game.cameras) updateCamera(c, dt);

  // Detection: any live cone on the thief raises the alarm.
  const seenByGuard = game.guards.some((g) => guardSees(g, game.player.x, game.player.y, game.smokes));
  const seenByCamera = game.cameras.some((c) => cameraSees(c, game.player.x, game.player.y, game.smokes));
  const seen = seenByGuard || seenByCamera;
  if (seen) {
    game.alarm += (game.player.sneaking ? ALARM.riseSneaking : ALARM.risePerSecond) * dt;
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM.decayPerSecond * dt);
  }
  game.alarm = Math.min(ALARM.caughtAt, game.alarm);

  // Crossing the spotted line: warning, a guard sent to look, one alarm counted.
  if (game.alarm >= ALARM.spottedAt && !game.spotted) {
    game.spotted = true;
    game.alarmsRaised += 1;
    game.flash = 1;
    playSpotted();
    const guard = nearestGuard(game);
    if (guard) sendGuardTo(guard, game.player.x, game.player.y);
  } else if (game.alarm < ALARM.spottedAt - 15) {
    game.spotted = false;
  }
  game.flash = Math.max(0, game.flash - dt * 1.5);
  setAlarmHum(game.alarm >= ALARM.spottedAt);

  // Touched by a guard, or the meter fills: busted.
  const touched = game.guards.some((g) => guardTouches(g, game.player.x, game.player.y, 11));
  if (touched || game.alarm >= ALARM.caughtAt) {
    game.state = 'caught';
    playBusted();
    setAlarmHum(false);
    stopAlarmHum();
    return;
  }

  // The exit only opens with the Star Sapphire.
  if (atExit(game.player)) {
    if (hasSapphire(game.player)) {
      const timeBonus = Math.max(0, SCORE.timeBonusStart - Math.floor(game.elapsed) * SCORE.timeBonusPerSecond);
      game.score = game.player.lootValue + timeBonus - game.alarmsRaised * SCORE.alarmPenalty;
      game.state = 'escaped';
      playEscape();
      setAlarmHum(false);
      stopAlarmHum();
    } else if (game.hintTimer <= 0) {
      game.hint = 'Locked — the Star Sapphire is the key. Grab it first!';
      game.hintTimer = 2.5;
    }
  }
  if (game.hintTimer > 0) game.hintTimer -= dt;
}
