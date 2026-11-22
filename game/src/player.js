// The thief: movement, sneaking, grabbing loot, and the three tools.
// Tools cost a limited count shown in the HUD; coins are thrown with the
// mouse, smoke and EMP with keys.
import { PLAYER, TOOLS } from './config.js';
import { collideCircle, LOOT_SPOTS, EXIT_DOOR } from './world.js';
import { moveDirection, isSneaking } from './input.js';
import { playCoin, playSmoke, playEmp, playPickup } from './audio.js';

export function createPlayer() {
  return {
    x: 74,
    y: 576,
    angle: -Math.PI / 2,
    sneaking: false,
    moving: false,
    loot: [], // collected loot ids
    lootValue: 0,
    coins: TOOLS.coins,
    smokeBombs: TOOLS.smokeBombs,
    emps: TOOLS.emps,
    grabTarget: null, // loot spot being channelled
    grabProgress: 0,
    lastCoin: null, // {x, y, timer} for the renderer's glint
  };
}

function nearestLoot(player, taken) {
  let best = null;
  let bestDist = PLAYER.grabRange;
  for (const spot of LOOT_SPOTS) {
    if (taken.has(spot.id)) continue;
    const d = Math.hypot(spot.x - player.x, spot.y - player.y);
    if (d < bestDist) {
      bestDist = d;
      best = spot;
    }
  }
  return best;
}

export function updatePlayer(player, input, dt, taken, events) {
  const dir = moveDirection(input);
  player.sneaking = isSneaking(input);
  player.moving = dir.x !== 0 || dir.y !== 0;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (player.moving) {
    player.x += dir.x * speed * dt;
    player.y += dir.y * speed * dt;
    player.angle = Math.atan2(dir.y, dir.x);
    player.grabTarget = null;
    player.grabProgress = 0;
  }
  collideCircle(player, PLAYER.radius);

  // Coin throw: click anywhere within range; the clink lures guards.
  while (input.clickQueue.length > 0) {
    const click = input.clickQueue.shift();
    if (player.coins <= 0) {
      events.push({ type: 'noCoins' });
      continue;
    }
    const dx = click.x - player.x;
    const dy = click.y - player.y;
    const dist = Math.hypot(dx, dy);
    const reach = Math.min(dist, TOOLS.coinThrowRange);
    const tx = dist > 0 ? player.x + (dx / dist) * reach : player.x;
    const ty = dist > 0 ? player.y + (dy / dist) * reach : player.y;
    player.coins -= 1;
    player.lastCoin = { x: tx, y: ty, timer: 1.2 };
    playCoin();
    events.push({ type: 'coin', x: tx, y: ty });
  }
  if (player.lastCoin) {
    player.lastCoin.timer -= dt;
    if (player.lastCoin.timer <= 0) player.lastCoin = null;
  }

  // Smoke bomb (key 1) and EMP (key 2).
  if (input.pressed.has('1')) {
    input.pressed.delete('1');
    if (player.smokeBombs > 0) {
      player.smokeBombs -= 1;
      playSmoke();
      events.push({ type: 'smoke', x: player.x, y: player.y });
    }
  }
  if (input.pressed.has('2')) {
    input.pressed.delete('2');
    if (player.emps > 0) {
      player.emps -= 1;
      playEmp();
      events.push({ type: 'emp' });
    }
  }

  // Grab loot: hold E near a case and the channel fills.
  const near = nearestLoot(player, taken);
  if (near && input.keys.has('e')) {
    if (player.grabTarget !== near) {
      player.grabTarget = near;
      player.grabProgress = 0;
    }
    player.grabProgress += dt / PLAYER.grabSeconds;
    if (player.grabProgress >= 1) {
      taken.add(near.id);
      player.loot.push(near.id);
      player.lootValue += near.value;
      player.grabTarget = null;
      player.grabProgress = 0;
      playPickup();
      events.push({ type: 'loot', spot: near });
    }
  } else {
    player.grabTarget = null;
    player.grabProgress = 0;
  }

  return near;
}

export function hasSapphire(player) {
  return player.loot.includes('sapphire');
}

export function atExit(player) {
  return (
    player.x > EXIT_DOOR.x - 6 &&
    player.x < EXIT_DOOR.x + EXIT_DOOR.w + 6 &&
    player.y > EXIT_DOOR.y - 6 &&
    player.y < EXIT_DOOR.y + EXIT_DOOR.h + 6
  );
}
