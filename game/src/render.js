// Every pixel the player sees: the gallery, the cones, the thief, the HUD
// and the menu / caught / escaped screens. All art is canvas paths.
import { VIEW, HUD_HEIGHT, ROOM, COLORS, GUARD, CAMERA, ALARM } from './config.js';
import { EXIT_DOOR, LOOT_SPOTS, OBSTACLES } from './world.js';

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, g) {
  drawCone(ctx, g.x, g.y, g.angle, GUARD.coneRange, GUARD.coneHalfAngle, COLORS.cone, COLORS.coneEdge);
  ctx.beginPath();
  ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.guard;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.guardTrim;
  ctx.stroke();
  // Facing tick + torch dot.
  const fx = g.x + Math.cos(g.angle) * GUARD.radius;
  const fy = g.y + Math.sin(g.angle) * GUARD.radius;
  ctx.beginPath();
  ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe9a8';
  ctx.fill();
  // "!" when investigating.
  if (g.mode !== 'patrol') {
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - GUARD.radius - 6);
  }
}

function drawCamera(ctx, c) {
  const disabled = c.disabledTimer > 0;
  if (!disabled) {
    drawCone(ctx, c.x, c.y, c.angle, CAMERA.range, CAMERA.coneHalfAngle, COLORS.cameraCone, 'rgba(255,122,26,0.5)');
  }
  ctx.fillStyle = '#2b3247';
  ctx.fillRect(c.x - 9, c.y - 7, 18, 14);
  ctx.fillStyle = disabled ? '#5a6478' : '#ff5a3c';
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.angle) * 8, c.y + Math.sin(c.angle) * 8, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (disabled) {
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFF', c.x, c.y - 14);
  }
}

function drawLoot(ctx, spot, taken) {
  if (taken.has(spot.id)) return;
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 280);
  ctx.save();
  ctx.shadowColor = spot.main ? COLORS.sapphire : COLORS.gold;
  ctx.shadowBlur = 18 * pulse;
  if (spot.id === 'sapphire') {
    ctx.fillStyle = COLORS.sapphire;
    ctx.beginPath();
    ctx.moveTo(spot.x, spot.y - 13);
    ctx.lineTo(spot.x + 10, spot.y);
    ctx.lineTo(spot.x, spot.y + 13);
    ctx.lineTo(spot.x - 10, spot.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#eaf7ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (spot.id === 'mask') {
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5a12';
    ctx.beginPath();
    ctx.ellipse(spot.x - 5, spot.y - 1, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(spot.x + 5, spot.y - 1, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#3fae7a';
    ctx.beginPath();
    ctx.moveTo(spot.x - 6, spot.y - 12);
    ctx.quadraticCurveTo(spot.x - 12, spot.y + 2, spot.x - 7, spot.y + 11);
    ctx.lineTo(spot.x + 7, spot.y + 11);
    ctx.quadraticCurveTo(spot.x + 12, spot.y + 2, spot.x + 6, spot.y - 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  if (spot.main) {
    ctx.fillStyle = '#dff4ff';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('STAR SAPPHIRE', spot.x, spot.y + 30);
  }
}

function drawObstacle(ctx, o) {
  if (o.kind === 'case') {
    ctx.fillStyle = '#3a2f22';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = COLORS.caseGlass;
    ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
    ctx.strokeStyle = '#6b5a3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  } else if (o.kind === 'pillar') {
    ctx.fillStyle = '#8d97ad';
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8d0e0';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (o.kind === 'statue') {
    ctx.fillStyle = '#4a5468';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#aeb8cc';
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2 - 4, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(o.x + o.w / 2 - 12, o.y + o.h / 2 + 6, 24, 10);
  } else if (o.kind === 'rope') {
    ctx.strokeStyle = COLORS.rope;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + 5);
    ctx.quadraticCurveTo(o.x + o.w / 2, o.y + 14, o.x + o.w, o.y + 5);
    ctx.stroke();
    ctx.fillStyle = '#d8b25a';
    ctx.beginPath();
    ctx.arc(o.x, o.y + 5, 3.5, 0, Math.PI * 2);
    ctx.arc(o.x + o.w, o.y + 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.thief;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = p.sneaking ? COLORS.safe : COLORS.thiefTrim;
  ctx.stroke();
  // Hood point + eyes face the walk direction.
  ctx.rotate(p.angle);
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(2, -6);
  ctx.lineTo(2, 6);
  ctx.closePath();
  ctx.fillStyle = COLORS.thiefTrim;
  ctx.fill();
  ctx.restore();
  // Grab channel ring.
  if (p.grabTarget) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, -Math.PI / 2, -Math.PI / 2 + p.grabProgress * Math.PI * 2);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (p.sneaking) {
    ctx.fillStyle = COLORS.safe;
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', p.x, p.y - 18);
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE GILDED GALLERY', 14, 21);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12px Georgia, serif';
  ctx.fillText('Steal the Star Sapphire, then slip out the door.', 14, 40);

  // Alarm meter.
  const ax = 330;
  const aw = 220;
  ctx.fillStyle = '#3a2027';
  ctx.fillRect(ax, 12, aw, 16);
  const frac = game.alarm / ALARM.caughtAt;
  ctx.fillStyle = frac < 0.65 ? '#e8a13c' : COLORS.danger;
  ctx.fillRect(ax, 12, aw * frac, 16);
  ctx.strokeStyle = '#6b5a3e';
  ctx.strokeRect(ax, 12, aw, 16);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 42);
  if (game.spotted) {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('SPOTTED!', ax + 70, 42);
  }

  // Loot, tools, timer.
  const p = game.player;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`LOOT $${p.lootValue}  (${p.loot.length}/3)`, 580, 22);
  ctx.fillText(`COIN ${p.coins}   SMOKE ${p.smokeBombs}   EMP ${p.emps}`, 580, 41);
  ctx.textAlign = 'right';
  const mins = Math.floor(game.elapsed / 60);
  const secs = Math.floor(game.elapsed % 60).toString().padStart(2, '0');
  ctx.fillText(`${mins}:${secs}`, VIEW.width - 14, 22);
  ctx.fillText(game.player.loot.includes('sapphire') ? '→ EXIT!' : '→ SAPPHIRE', VIEW.width - 14, 41);
  ctx.textAlign = 'left';
}

function drawRoom(ctx) {
  // Floor + tiles.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.width, ROOM.height);
  ctx.fillStyle = COLORS.floorTile;
  for (let x = ROOM.x + 46; x < ROOM.x + ROOM.width; x += 92) {
    for (let y = ROOM.y + 46; y < ROOM.y + ROOM.height; y += 92) {
      ctx.fillRect(x, y, 2, 2);
    }
  }
  // Walls.
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 6;
  ctx.strokeRect(ROOM.x, ROOM.y, ROOM.width, ROOM.height);
  // Exit door (bottom wall, left).
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(EXIT_DOOR.x, EXIT_DOOR.y, EXIT_DOOR.w, EXIT_DOOR.h);
  ctx.strokeStyle = COLORS.safe;
  ctx.lineWidth = 2;
  ctx.strokeRect(EXIT_DOOR.x, EXIT_DOOR.y, EXIT_DOOR.w, EXIT_DOOR.h);
  ctx.fillStyle = COLORS.safe;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT_DOOR.x + EXIT_DOOR.w / 2, EXIT_DOOR.y + 17);
  // Paintings on the top wall for gallery flavour.
  const frames = [60, 380, 700, 880];
  for (const fx of frames) {
    ctx.fillStyle = '#6b5a3e';
    ctx.fillRect(fx, ROOM.y + 6, 34, 22);
    ctx.fillStyle = ['#7a4a3a', '#3a5a7a', '#4a7a5a', '#7a6a3a'][frames.indexOf(fx) % 4];
    ctx.fillRect(fx + 3, ROOM.y + 9, 28, 16);
  }
}

function drawHint(ctx, game) {
  if (game.hintTimer > 0 && game.hint) {
    ctx.fillStyle = 'rgba(16, 24, 43, 0.9)';
    const w = ctx.measureText(game.hint).width + 28;
    ctx.fillRect((VIEW.width - w) / 2, VIEW.height - 44, w, 28);
    ctx.fillStyle = COLORS.goldGlow;
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.hint, VIEW.width / 2, VIEW.height - 25);
  }
  const near = game.player.grabTarget;
  if (near) {
    ctx.fillStyle = COLORS.goldGlow;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Hold E — grabbing the ${near.name}…`, VIEW.width / 2, HUD_HEIGHT + 24);
  }
}

function overlay(ctx, title, titleColor, lines, footer) {
  ctx.fillStyle = 'rgba(8, 12, 24, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(title, VIEW.width / 2, 210);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '17px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 260 + i * 30));
  ctx.fillStyle = COLORS.gold;
  ctx.font = '15px Georgia, serif';
  ctx.fillText(footer, VIEW.width / 2, 260 + lines.length * 30 + 26);
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawRoom(ctx);
  for (const o of OBSTACLES) drawObstacle(ctx, o);
  for (const spot of LOOT_SPOTS) drawLoot(ctx, spot, game.taken);
  for (const s of game.smokes) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.smoke;
    ctx.fill();
  }
  if (game.player.lastCoin) {
    ctx.beginPath();
    ctx.arc(game.player.lastCoin.x, game.player.lastCoin.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.goldGlow;
    ctx.fill();
  }
  for (const c of game.cameras) drawCamera(ctx, c);
  for (const g of game.guards) drawGuard(ctx, g);
  if (game.state !== 'menu') drawPlayer(ctx, game.player);
  drawHud(ctx, game);
  drawHint(ctx, game);

  // Spotted red edge pulse.
  if (game.flash > 0) {
    ctx.strokeStyle = `rgba(229, 72, 77, ${game.flash * 0.7})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, VIEW.width - 10, VIEW.height - 10);
  }

  if (game.state === 'menu') {
    overlay(
      ctx,
      'THE GILDED GALLERY',
      COLORS.gold,
      [
        'Midnight at the museum. The Star Sapphire glows in its case —',
        'and three guards, two cameras and one very loud alarm stand between you and it.',
        '',
        'WASD / arrows — move      Shift — sneak      E — grab loot',
        'Click — throw a coin (lures guards)      1 — smoke bomb      2 — EMP the cameras',
        'Grab the sapphire, then slip out the EXIT door. Fill the alarm meter and you are caught.',
      ],
      'Click or press Enter to start the heist',
    );
  } else if (game.state === 'caught') {
    overlay(
      ctx,
      'BUSTED!',
      COLORS.danger,
      [
        `The alarm hit full with $${game.player.lootValue} of loot in your pockets.`,
        `Alarms raised: ${game.alarmsRaised}    Time in the gallery: ${Math.floor(game.elapsed)}s`,
        'The guards were faster than your feet this time.',
      ],
      'Press R to try the gallery again',
    );
  } else if (game.state === 'escaped') {
    const timeBonus = Math.max(0, 300 - Math.floor(game.elapsed) * 2);
    overlay(
      ctx,
      'GETAWAY!',
      COLORS.safe,
      [
        `You slipped out with $${game.player.lootValue} of loot in ${Math.floor(game.elapsed)} seconds.`,
        `Loot $${game.player.lootValue}  +  time bonus $${timeBonus}  −  alarms $${game.alarmsRaised * 25}`,
        `FINAL SCORE: $${game.score}`,
        'The Star Sapphire is yours. The museum never saw you coming.',
      ],
      'Press R to plan the next heist',
    );
  }
}
