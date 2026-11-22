// Midnight Vault — everything the player sees.
// One job: draw the world, the HUD and the screens on a 2D canvas.

import { FIELD_W, FIELD_H, HUD_H, PALETTE, FONT, GUARD, CAMERA, ALARM, EMP } from './config.js';
import { ratingFor } from './world.js';

function conePath(ctx, x, y, dir, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - halfAngle, dir + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, dir, halfAngle, range, color) {
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  conePath(ctx, x, y, dir, halfAngle, range);
  ctx.fill();
}

function drawFloor(ctx, level) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  const tile = 64;
  for (let y = 0; y < FIELD_H; y += tile) {
    for (let x = 0; x < FIELD_W; x += tile) {
      if (((x / tile) + (y / tile)) % 2 === 0) {
        ctx.fillStyle = PALETTE.floorB;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD_W; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD_H); ctx.stroke();
  }
  for (let y = 0; y <= FIELD_H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD_W, y); ctx.stroke();
  }
  // Warm light pools under the lamps.
  for (const lamp of level.lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 10, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, PALETTE.lampGlow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2); ctx.fill();
  }
  // Dark shadow pools: what is safe.
  for (const s of level.shadows) {
    ctx.fillStyle = PALETTE.shadow;
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(120,140,190,0.35)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawWallsAndCover(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, Math.min(4, w.h));
  }
  for (const d of level.desks) {
    ctx.fillStyle = PALETTE.desk;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = PALETTE.deskTop;
    ctx.fillRect(d.x + 4, d.y + 4, d.w - 8, d.h - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(d.x + 8, d.y + 8, 18, 12);
    ctx.fillRect(d.x + d.w - 26, d.y + d.h - 20, 18, 12);
  }
  // Potted plants: hide spots.
  for (const p of level.plants) {
    ctx.fillStyle = PALETTE.plantDark;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.plant;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * p.r * 0.55, p.y + Math.sin(a) * p.r * 0.55, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8a5a2e';
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
  }
}

function drawVaultAndLoot(ctx, world) {
  const v = world.level.vault;
  ctx.fillStyle = PALETTE.vault;
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = PALETTE.vaultDoor;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 44, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 30, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = PALETTE.vaultDoor;
  ctx.beginPath(); ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9cedb';
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('VAULT', v.x + v.w / 2, v.y + 18);

  for (const item of world.loot) {
    if (item.taken) continue;
    const pulse = 1 + Math.sin(world.time * 4) * 0.12;
    const g = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, 46 * pulse);
    g.addColorStop(0, PALETTE.lootGlow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(item.x, item.y, 46 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.loot;
    if (item.kind === 'gold') {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(-0.3);
      ctx.fillRect(-14, -8, 28, 16);
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(-14, -8, 28, 5);
      ctx.restore();
    } else if (item.kind === 'jewels') {
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 14);
      ctx.lineTo(item.x + 12, item.y);
      ctx.lineTo(item.x, item.y + 14);
      ctx.lineTo(item.x - 12, item.y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(item.x - 13, item.y - 8, 26, 16);
      ctx.fillStyle = '#7ee787';
      ctx.font = `bold 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('$', item.x, item.y + 4);
    }
    ctx.fillStyle = '#fff3b0';
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(item.label, item.x, item.y - 24);
  }
}

function drawExit(ctx, world) {
  const ex = world.level.exit;
  const open = world.mainLootTaken;
  const glow = ctx.createRadialGradient(
    ex.x + ex.w / 2, ex.y + ex.h / 2, 6,
    ex.x + ex.w / 2, ex.y + ex.h / 2, 70,
  );
  glow.addColorStop(0, open ? PALETTE.exitGlow : 'rgba(120,120,120,0.18)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(ex.x - 40, ex.y - 40, ex.w + 80, ex.h + 80);
  ctx.fillStyle = open ? PALETTE.exit : '#5a5f6b';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = '#eaffea';
  ctx.lineWidth = 3;
  ctx.strokeRect(ex.x + 3, ex.y + 3, ex.w - 6, ex.h - 6);
  ctx.fillStyle = '#06210c';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', ex.x + ex.w / 2, ex.y + ex.h / 2 + 4);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText(ex.label, ex.x + ex.w / 2, ex.y - 8);
}

function drawCameras(ctx, world) {
  for (const cam of world.cameras) {
    const disabled = cam.disabledTimer > 0;
    if (!disabled) {
      drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA.coneHalfAngle, cam.range,
        cam.spotting ? 'rgba(255,40,120,0.45)' : PALETTE.cameraCone);
    }
    // Camera body on the wall.
    ctx.fillStyle = disabled ? '#3a3f4a' : PALETTE.cameraBody;
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = disabled ? '#666' : '#ff5fa2';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = disabled ? '#9aa0b0' : '#ff5fa2';
    ctx.font = `bold 10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(disabled ? 'EMP OFF' : 'CAM', cam.x, cam.y - 16);
  }
}

function drawGuards(ctx, world) {
  for (const g of world.guards) {
    const alerted = g.state === 'alerted';
    const suspicious = g.state === 'suspicious' || g.state === 'search';
    drawCone(ctx, g.x, g.y, g.dir, GUARD.coneHalfAngle, GUARD.coneRange,
      alerted ? PALETTE.coneAlert : (suspicious ? 'rgba(255,140,40,0.36)' : PALETTE.coneCalm));
    // Guard body: navy uniform with a gold trim ring.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alerted ? '#ff4030' : PALETTE.guardTrim;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2); ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#e8e6df';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * (GUARD.radius + 6), g.y + Math.sin(g.dir) * (GUARD.radius + 6));
    ctx.stroke();
    // Detection meter above the guard.
    if (g.detect > 0.05) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(g.x - 18, g.y - 30, 36, 6);
      ctx.fillStyle = g.detect >= 1 ? '#ff4030' : '#ffb02e';
      ctx.fillRect(g.x - 17, g.y - 29, 34 * g.detect, 4);
    }
    if (alerted) {
      ctx.fillStyle = '#ff4030';
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 34);
    } else if (suspicious) {
      ctx.fillStyle = '#ffb02e';
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 34);
    }
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(232,230,223,0.5)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = PALETTE.playerHood;
  ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PALETTE.player;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PALETTE.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.dir) * 18, p.y + Math.sin(p.dir) * 18);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 10px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ROOK', p.x, p.y - 20);
}

function drawEffects(ctx, world) {
  for (const ring of world.noiseRings) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.5 - ring.r / ring.max)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2); ctx.stroke();
  }
  if (world.empPulse > 0) {
    ctx.strokeStyle = `rgba(120,220,255,${world.empPulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(world.player.x, world.player.y, EMP.radius * (1 - world.empPulse), 0, Math.PI * 2); ctx.stroke();
  }
  for (const f of world.flashes) {
    ctx.globalAlpha = Math.min(1, f.t);
    ctx.fillStyle = PALETTE.loot;
    ctx.font = `bold 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, FIELD_W, HUD_H);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(world.level.name, 14, 22);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = `12px ${FONT}`;
  ctx.fillText(world.level.subtitle, 14, 42);

  // Alarm meter: the big one, centre top.
  const ax = 470;
  const aw = 340;
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(ax, 26, aw, 16);
  const alarmColor = world.alarm < 40 ? PALETTE.alarmLow : world.alarm < 75 ? PALETTE.alarmMid : PALETTE.alarmHigh;
  ctx.fillStyle = alarmColor;
  ctx.fillRect(ax, 26, aw * (world.alarm / 100), 16);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 26, aw, 16);
  if (world.lockdownActive) {
    ctx.fillStyle = '#ff4030';
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`LOCKDOWN ${Math.ceil(world.lockdown)}s — REACH THE EXIT!`, ax, 52);
  } else if (world.alarm > 60) {
    ctx.fillStyle = PALETTE.alarmHigh;
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillText('SECURITY IS ONTO YOU', ax, 52);
  }

  // Right side: loot, EMP, timer, objectives.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(`LOOT $${world.lootValue}`, FIELD_W - 16, 22);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `13px ${FONT}`;
  const mins = Math.floor(world.time / 60);
  const secs = Math.floor(world.time % 60);
  ctx.fillText(`EMP ${'●'.repeat(world.empCharges)}${'○'.repeat(Math.max(0, world.level.empCharges - world.empCharges))}   ${mins}:${String(secs).padStart(2, '0')}`, FIELD_W - 16, 42);
  ctx.fillStyle = world.mainLootTaken ? '#7ee787' : PALETTE.hudDim;
  ctx.font = `12px ${FONT}`;
  ctx.fillText(world.mainLootTaken ? '✓ MAIN LOOT — GO TO THE EXIT' : '○ STEAL THE MAIN LOOT', FIELD_W - 16, 56 - 14 + 14);
}

function drawCenteredPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8,10,16,0.78)';
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  ctx.fillStyle = accent;
  ctx.font = `bold 44px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(title, FIELD_W / 2, 250);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `18px ${FONT}`;
  let y = 300;
  for (const line of lines) {
    ctx.fillText(line, FIELD_W / 2, y);
    y += 30;
  }
}

export function drawWorld(ctx, world) {
  drawFloor(ctx, world.level);
  drawVaultAndLoot(ctx, world);
  drawExit(ctx, world);
  drawWallsAndCover(ctx, world.level);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawPlayer(ctx, world);
  drawEffects(ctx, world);
  drawHud(ctx, world);
}

export function drawTitle(ctx, world) {
  drawWorld(ctx, world);
  ctx.fillStyle = 'rgba(8,10,16,0.72)';
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  ctx.fillStyle = PALETTE.title;
  ctx.font = `bold 64px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('MIDNIGHT VAULT', FIELD_W / 2, 210);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `22px ${FONT}`;
  ctx.fillText('A bank heist in the dark — steal the gold, dodge the cones, vanish.', FIELD_W / 2, 258);
  ctx.font = `17px ${FONT}`;
  const lines = [
    'WASD / arrows — move      SHIFT — sneak (slow, silent, hard to spot)',
    'E — EMP pulse: kills all cameras for 6s (2 per level)',
    'Grab the glowing main loot, then reach the green exit. 3 floors. Don\'t get caught.',
    'Running is loud — guards hear it. Shadows hide you. Plants hide you better.',
  ];
  let y = 330;
  for (const line of lines) {
    ctx.fillText(line, FIELD_W / 2, y);
    y += 30;
  }
  ctx.fillStyle = PALETTE.exit;
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText('Press ENTER or click to start', FIELD_W / 2, 500);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = `14px ${FONT}`;
  ctx.fillText('P pause   •   R restart   •   M mute', FIELD_W / 2, 540);
}

export function drawPaused(ctx, world) {
  drawWorld(ctx, world);
  drawCenteredPanel(ctx, 'PAUSED', ['Press P or Esc to keep stealing.'], PALETTE.hudText);
}

export function drawGameOver(ctx, world) {
  drawWorld(ctx, world);
  drawCenteredPanel(ctx, 'BUSTED', [
    world.loseReason,
    `Loot grabbed: $${world.lootValue}   •   Time: ${Math.floor(world.time)}s`,
    'Press R to try the floor again.',
  ], '#ff4030');
}

export function drawWin(ctx, world, totalLoot, totalTime) {
  drawWorld(ctx, world);
  const rating = ratingFor(world);
  drawCenteredPanel(ctx, rating === 'GHOST' ? 'GHOST — CLEAN GETAWAY!' : 'HEIST COMPLETE!', [
    `Rating: ${rating}   •   Total loot: $${totalLoot}`,
    `Total time: ${Math.floor(totalTime / 60)}:${String(Math.floor(totalTime % 60)).padStart(2, '0')}   •   Peak alarm: ${Math.round(world.maxAlarm)}%`,
    'The crew is rich. Press R to run it back.',
  ], PALETTE.title);
}
