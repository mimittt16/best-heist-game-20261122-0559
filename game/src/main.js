// Boot + game loop for The Gilded Gallery. Also holds the staging hooks:
//   ?shot=cover|menu|tools|escape  — freeze a real game state for screenshots
//   ?autoplay=win|busted            — self-play through the real update code
// Both render through the same loop and the same code the player uses.
import { VIEW } from './config.js';
import { createInput, takePressed, clearPressed } from './input.js';
import { createGame, startRun, updateGame } from './game.js';
import { updatePlayer } from './player.js';
import { render } from './render.js';
import { unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const input = createInput(canvas);
const game = createGame();
const params = new URLSearchParams(window.location.search);
const statusEl = document.getElementById('status');

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

// --- Screenshot staging: real states, frozen in place --------------------
function stageShot(kind) {
  if (kind === 'menu') {
    game.state = 'menu';
    return;
  }
  startRun(game);
  if (kind === 'cover') {
    // Mid-heist: thief between two cases, a guard cone sweeping in, the
    // camera cone crossing the room, the sapphire glowing, alarm half full.
    game.player.x = 470;
    game.player.y = 350;
    game.player.angle = Math.PI / 4;
    game.guards[0].x = 385;
    game.guards[0].y = 235;
    game.guards[0].angle = 0.93;
    game.guards[1].x = 700;
    game.guards[1].y = 380;
    game.guards[1].angle = Math.PI;
    game.guards[2].x = 330;
    game.guards[2].y = 520;
    game.guards[2].angle = -Math.PI / 2;
    game.cameras[0].angle = Math.PI / 2.6;
    game.cameras[1].angle = Math.PI * 0.9;
    game.alarm = 52;
    game.elapsed = 47;
  } else if (kind === 'tools') {
    // Smoke bomb blooming beside the thief while a guard walks to a coin.
    game.player.x = 380;
    game.player.y = 340;
    game.player.angle = 0;
    game.player.smokeBombs = 1;
    game.smokes.push({ x: 420, y: 340, radius: 72, timer: 4 });
    game.player.lastCoin = { x: 560, y: 300, timer: 1.2 };
    game.guards[0].x = 500;
    game.guards[0].y = 260;
    game.guards[0].angle = Math.PI / 3;
    game.guards[0].mode = 'investigate';
    game.guards[0].target = { x: 560, y: 300 };
    game.guards[1].x = 700;
    game.guards[1].y = 380;
    game.guards[1].angle = Math.PI;
    game.alarm = 30;
    game.elapsed = 82;
    game.hint = 'Smoke up — the cone cannot see through it!';
    game.hintTimer = 99;
  } else if (kind === 'escape') {
    game.player.loot = ['sapphire', 'mask'];
    game.player.lootValue = 700;
    game.taken.add('sapphire');
    game.taken.add('mask');
    game.elapsed = 96;
    game.alarmsRaised = 1;
    game.score = 700 + (300 - 96 * 2) - 25;
    game.state = 'escaped';
  }
  // Freeze the staged frame: no updates run while a shot is staged.
  game.staged = true;
}

// --- Self-play: drive the real update code, report the outcome ------------
function stageAutoplay(kind) {
  startRun(game);
  game.autoplay = { kind, t: 0, phase: 0, path: [], emped: false };
  if (kind === 'win') {
    // Waypoints: mask case, up the quiet left side, along the top, down
    // the east side to the sapphire, then back the same way to the exit.
    // The thief sneaks the whole way and spends tools when the alarm climbs.
    game.autoplay.path = [
      { x: 255, y: 577, grab: 'mask' },
      { x: 100, y: 470, grab: null },
      { x: 100, y: 75, grab: null },
      { x: 920, y: 75, grab: null },
      { x: 920, y: 177, grab: null },
      { x: 822, y: 177, grab: 'sapphire' },
      { x: 920, y: 177, grab: null },
      { x: 920, y: 75, grab: null },
      { x: 100, y: 75, grab: null },
      { x: 100, y: 470, grab: null },
      { x: 74, y: 620, grab: null },
    ];
  }
}

function autoplayStep(dt) {
  const ap = game.autoplay;
  if (!ap || game.state !== 'playing') return;
  ap.t += dt;
  if (ap.kind === 'busted') {
    // Walk straight into guard 1's patrol until the alarm fills.
    const g = game.guards[0];
    input.keys.clear();
    input.keys.add(g.x > game.player.x ? 'd' : 'a');
    input.keys.add(g.y > game.player.y ? 's' : 'w');
    return;
  }
  const target = ap.path[ap.phase];
  if (!target) return;
  // Spend tools when the heat is on: EMP the cameras on the top run,
  // smoke when the alarm climbs past 30.
  if (ap.phase >= 2 && ap.phase <= 5 && !ap.emped && game.player.emps > 0) {
    input.pressed.add('2');
    ap.emped = true;
  }
  if (game.alarm > 30 && game.player.smokeBombs > 0 && game.smokes.length === 0) input.pressed.add('1');
  const dx = target.x - game.player.x;
  const dy = target.y - game.player.y;
  input.keys.clear();
  input.keys.add('shift'); // sneak the whole heist
  if (Math.abs(dx) > 8) input.keys.add(dx > 0 ? 'd' : 'a');
  if (Math.abs(dy) > 8) input.keys.add(dy > 0 ? 's' : 'w');
  if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8) {
    if (target.grab) {
      input.keys.add('e');
      if (game.player.loot.includes(target.grab)) ap.phase += 1;
    } else {
      ap.phase += 1;
    }
  }
  if (ap.t > 60) {
    setStatus(`AUTOPLAY TIMEOUT phase=${ap.phase} loot=${game.player.loot.join(',')}`);
    game.autoplay = null;
  }
}

const shot = params.get('shot');
const autoplay = params.get('autoplay');
if (shot) stageShot(shot);
else if (autoplay) stageAutoplay(autoplay);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!game.staged) {
    if (game.state === 'menu') {
      if (takePressed(input, 'enter') || input.clickQueue.length > 0) {
        input.clickQueue.length = 0;
        startRun(game);
      }
    } else if (game.state === 'playing') {
      autoplayStep(dt);
      const events = [];
      updatePlayer(game.player, input, dt, game.taken, events);
      updateGame(game, input, dt, events);
    } else if (game.state === 'caught' || game.state === 'escaped') {
      if (takePressed(input, 'r')) startRun(game);
      if (game.state === 'escaped' && !game.reported) {
        game.reported = true;
        setStatus(`AUTOPLAY WIN score=${game.score} loot=${game.player.loot.join(',')} time=${Math.floor(game.elapsed)}s`);
      }
      if (game.state === 'caught' && !game.reported) {
        game.reported = true;
        setStatus(`AUTOPLAY BUSTED alarm=${Math.floor(game.alarm)} time=${Math.floor(game.elapsed)}s`);
      }
    }
    clearPressed(input);
  }
  render(ctx, game);
  requestAnimationFrame(frame);
}

canvas.addEventListener('mousedown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
requestAnimationFrame(frame);
