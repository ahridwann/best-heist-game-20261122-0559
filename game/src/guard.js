// Midnight Vault — the guards.
// One job: patrol, vision cones, detection, and the AI states
// patrol -> suspicious -> alerted -> search -> patrol.

import { GUARD, ALARM } from './config.js';
import { dist, angleDiff, lineBlocked, playerHidden, playerInShadow, playerInLight, collideCircle } from './world.js';

// Can this guard see the player right now? Cone + range + line of sight.
// A player hidden in a plant is invisible unless the guard is very close.
export function guardCanSee(world, guard) {
  const p = world.player;
  const level = world.level;
  const d = dist(guard.x, guard.y, p.x, p.y);
  if (d > GUARD.coneRange) return false;
  const hidden = playerHidden(level, p.x, p.y);
  if (hidden && d > 62) return false;
  const angleToPlayer = Math.atan2(p.y - guard.y, p.x - guard.x);
  if (Math.abs(angleDiff(angleToPlayer, guard.dir)) > GUARD.coneHalfAngle) return false;
  if (lineBlocked(level, guard.x, guard.y, p.x, p.y)) return false;
  return true;
}

// How fast the detection meter fills while the guard sees the player.
// Close, running, and lit players are spotted much faster; shadows slow it.
function detectRate(world, guard) {
  const p = world.player;
  const level = world.level;
  const d = dist(guard.x, guard.y, p.x, p.y);
  let rate = GUARD.detectFill * (1.9 - (d / GUARD.coneRange) * 1.6);
  if (!p.sneaking) rate *= 1.6;
  if (playerInShadow(level, p.x, p.y)) rate *= 0.55;
  if (playerInLight(level, p.x, p.y)) rate *= 1.25;
  return rate;
}

function moveToward(world, guard, tx, ty, speed, dt) {
  const d = dist(guard.x, guard.y, tx, ty);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  const nx = guard.x + ((tx - guard.x) / d) * step;
  const ny = guard.y + ((ty - guard.y) / d) * step;
  const solved = collideCircle(world.level, nx, ny, GUARD.radius);
  guard.x = solved.x;
  guard.y = solved.y;
  guard.dir = Math.atan2(ny - guard.y, nx - guard.x);
  if (Number.isNaN(guard.dir)) guard.dir = 0;
  return d - step < 4;
}

export function updateGuard(world, guard, dt) {
  const p = world.player;
  const sees = guardCanSee(world, guard);

  // Detection meter fills on sight, decays when hidden.
  if (sees) {
    const before = guard.detect;
    guard.detect = Math.min(1, guard.detect + detectRate(world, guard) * dt);
    if (before < GUARD.suspiciousAt && guard.detect >= GUARD.suspiciousAt && guard.state === 'patrol') {
      guard.state = 'suspicious';
      guard.investigate = { x: p.x, y: p.y };
      guard.pauseTimer = 0.6;
      world.events.push('suspicious');
    }
    if (guard.detect >= 1 && guard.state !== 'alerted') {
      guard.state = 'alerted';
      guard.unseenTimer = 0;
      world.alarm = Math.min(100, world.alarm + ALARM.guardSpot);
      world.everDetected = true;
      world.events.push('alarm');
    }
  } else {
    guard.detect = Math.max(0, guard.detect - GUARD.detectDecay * dt);
  }

  // State machine.
  if (guard.state === 'patrol') {
    const target = guard.waypoints[guard.wpIndex];
    if (moveToward(world, guard, target.x, target.y, guard.speed, dt)) {
      guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
    }
  } else if (guard.state === 'suspicious') {
    if (sees) {
      guard.investigate = { x: p.x, y: p.y };
      guard.dir = Math.atan2(p.y - guard.y, p.x - guard.x);
    }
    if (guard.pauseTimer > 0) {
      guard.pauseTimer -= dt;
      guard.dir += dt * 0.8; // look around while pausing
    } else if (guard.investigate) {
      const arrived = moveToward(world, guard, guard.investigate.x, guard.investigate.y, GUARD.investigateSpeed, dt);
      if (arrived) {
        guard.state = 'search';
        guard.searchTimer = GUARD.searchTime;
      }
    }
    if (!sees && guard.detect < GUARD.suspiciousAt) {
      guard.state = 'patrol';
      guard.investigate = null;
    }
  } else if (guard.state === 'alerted') {
    if (sees) {
      guard.unseenTimer = 0;
      guard.investigate = { x: p.x, y: p.y };
      moveToward(world, guard, p.x, p.y, GUARD.chaseSpeed, dt);
    } else {
      guard.unseenTimer += dt;
      if (guard.investigate) moveToward(world, guard, guard.investigate.x, guard.investigate.y, GUARD.investigateSpeed, dt);
      if (guard.unseenTimer > GUARD.loseSightAfter) {
        guard.state = 'search';
        guard.searchTimer = GUARD.searchTime;
        guard.investigate = { x: p.x, y: p.y };
      }
    }
  } else if (guard.state === 'search') {
    guard.searchTimer -= dt;
    guard.dir += dt * 1.4; // sweep the room looking
    if (sees) {
      guard.state = 'suspicious';
      guard.investigate = { x: p.x, y: p.y };
      guard.pauseTimer = 0.3;
    } else if (guard.searchTimer <= 0) {
      guard.state = 'patrol';
      guard.investigate = null;
      // resume at the nearest waypoint
      let best = 0;
      let bestD = Infinity;
      guard.waypoints.forEach((w, i) => {
        const d = dist(guard.x, guard.y, w.x, w.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      guard.wpIndex = best;
    }
  }

  guard.spottedPlayer = sees;
  return sees;
}
