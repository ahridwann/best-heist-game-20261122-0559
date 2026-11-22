// Midnight Vault — the thief.
// One job: movement, sneaking, noise, and the EMP tool.

import { PLAYER, EMP } from './config.js';
import { collideCircle, dist } from './world.js';

export function updatePlayer(world, input, dt) {
  const p = world.player;
  const level = world.level;

  // Direction from held keys, normalised.
  let mx = input.mx || 0;
  let my = input.my || 0;
  const len = Math.hypot(mx, my);
  p.moving = len > 0.01;
  if (p.moving) {
    mx /= len;
    my /= len;
    p.sneaking = !!input.sneak;
    const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const nx = p.x + mx * speed * dt;
    const ny = p.y + my * speed * dt;
    const solved = collideCircle(level, nx, ny, PLAYER.radius);
    p.x = solved.x;
    p.y = solved.y;
    p.dir = Math.atan2(my, mx);
  } else {
    p.sneaking = !!input.sneak;
  }

  // Running is loud: expanding noise rings draw nearby guards in.
  if (p.moving && !p.sneaking) {
    p.noiseTimer -= dt;
    if (p.noiseTimer <= 0) {
      p.noiseTimer = PLAYER.noiseInterval;
      world.noiseRings.push({ x: p.x, y: p.y, r: 8, max: PLAYER.noiseRadius });
      world.events.push('footstep');
      for (const guard of world.guards) {
        if (guard.state === 'patrol' && dist(guard.x, guard.y, p.x, p.y) < PLAYER.noiseRadius) {
          guard.state = 'suspicious';
          guard.investigate = { x: p.x, y: p.y };
          guard.pauseTimer = 0.4;
          world.events.push('suspicious');
        }
      }
    }
  }

  // EMP: one press disables every camera for a few seconds. Limited charges.
  if (input.emp && world.empCharges > 0 && p.empCooldown <= 0) {
    world.empCharges -= 1;
    p.empCooldown = 0.5;
    world.empPulse = 0.6;
    for (const camera of world.cameras) camera.disabledTimer = EMP.disableSeconds;
    world.events.push('emp');
  }
  if (p.empCooldown > 0) p.empCooldown -= dt;
}
