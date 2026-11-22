// Midnight Vault — rules and state.
// One job: the game state and its fixed step. No drawing, no browser calls.
// Pure geometry helpers live here so guards and cameras share one sight model.

import { LEVELS } from './level.js';
import { ALARM, EMP, GUARD, PLAYER } from './config.js';
import { updatePlayer } from './player.js';
import { updateGuard } from './guard.js';
import { updateCamera } from './camera.js';

// --- geometry ---------------------------------------------------------------

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const d1 = (bx - ax) * (y1 - ay) - (by - ay) * (x1 - ax);
    const d2 = (bx - ax) * (y2 - ay) - (by - ay) * (x2 - ax);
    const d3 = (x2 - x1) * (ay - y1) - (y2 - y1) * (ax - x1);
    const d4 = (x2 - x1) * (by - y1) - (y2 - y1) * (bx - x1);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  }
  return false;
}

// True when a wall or desk blocks the line of sight between two points.
export function lineBlocked(level, x1, y1, x2, y2) {
  for (const r of level.walls) if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  for (const r of level.desks) if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  return false;
}

// True when the player stands inside a plant hide spot.
export function playerHidden(level, px, py) {
  for (const p of level.plants) {
    if (dist(px, py, p.x, p.y) < p.r) return true;
  }
  return false;
}

// True when the player stands in a dark shadow pool (detection is slower there).
export function playerInShadow(level, px, py) {
  for (const s of level.shadows) {
    if (dist(px, py, s.x, s.y) < s.r) return true;
  }
  return false;
}

// True when the player stands in a lamp's light pool (detection is faster there).
export function playerInLight(level, px, py) {
  for (const l of level.lamps) {
    if (dist(px, py, l.x, l.y) < l.r) return true;
  }
  return false;
}

// Circle-vs-rect collision: push the circle out of every wall it overlaps.
export function collideCircle(level, x, y, radius) {
  for (const r of level.walls) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * radius;
        y = cy + (dy / d) * radius;
      } else {
        y = r.y - radius; // centre inside the wall: push up out of it
      }
    }
  }
  return { x, y };
}

// --- state ------------------------------------------------------------------

export function createWorld(levelIndex, seed) {
  const level = LEVELS[levelIndex];
  return {
    levelIndex,
    level,
    seed,
    time: 0,
    status: 'playing', // playing | won | lost | lockdown-escape
    loseReason: '',
    player: {
      x: level.spawn.x,
      y: level.spawn.y,
      dir: 0,
      sneaking: false,
      moving: false,
      noiseTimer: 0,
      empCooldown: 0,
    },
    guards: level.guards.map((g) => ({
      x: g.x,
      y: g.y,
      waypoints: g.waypoints,
      wpIndex: 0,
      speed: g.speed,
      dir: Math.PI / 2,
      state: 'patrol', // patrol | suspicious | alerted | search
      detect: 0,
      investigate: null,
      unseenTimer: 0,
      searchTimer: 0,
      pauseTimer: 0,
      spottedPlayer: false,
    })),
    cameras: level.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      base: c.base,
      sweep: c.sweep,
      range: c.range,
      speed: c.speed,
      angle: c.base,
      disabledTimer: 0,
      spotting: false,
      beepTimer: 0,
    })),
    loot: level.loot.map((l) => ({ ...l, taken: false })),
    alarm: 0,
    maxAlarm: 0,
    lockdown: 0, // seconds left once the alarm hits 100
    lockdownActive: false,
    empCharges: level.empCharges,
    empPulse: 0, // visual pulse timer
    lootValue: 0,
    mainLootTaken: false,
    everDetected: false,
    noiseRings: [], // {x, y, r, max} expanding rings for the renderer
    events: [], // one-frame events for audio: 'footstep', 'suspicious', 'alarm', 'pickup', 'emp', 'beep', 'win', 'lose'
    flashes: [], // {x, y, text, t} floating pickup labels
  };
}

export function ratingFor(world) {
  if (!world.everDetected && world.maxAlarm < 1) return 'GHOST';
  if (world.maxAlarm < 50) return 'SHADOW';
  return 'LOUD';
}

function addEvent(world, name) {
  world.events.push(name);
}

// One fixed step of the simulation. `input` is {mx, my, sneak, emp}.
export function step(world, input, dt) {
  if (world.status !== 'playing') return;
  world.time += dt;
  world.events.length = 0;

  updatePlayer(world, input, dt);

  let anySpot = false;
  for (const guard of world.guards) {
    const spotted = updateGuard(world, guard, dt);
    if (spotted) anySpot = true;
  }
  for (const camera of world.cameras) {
    const spotted = updateCamera(world, camera, dt);
    if (spotted) anySpot = true;
  }

  // Alarm decays while nobody sees the player and nothing is loud.
  if (!anySpot) {
    world.alarm = Math.max(0, world.alarm - ALARM.decay * dt);
  }
  world.maxAlarm = Math.max(world.maxAlarm, world.alarm);

  // Lockdown: the alarm hit 100. Reach the exit before the countdown ends.
  if (world.lockdownActive) {
    world.lockdown -= dt;
    if (world.lockdown <= 0) {
      world.status = 'lost';
      world.loseReason = 'LOCKDOWN — the bank sealed itself with you inside.';
      addEvent(world, 'lose');
    }
  } else if (world.alarm >= ALARM.lockdownAt) {
    world.lockdownActive = true;
    world.lockdown = ALARM.lockdownSeconds;
    addEvent(world, 'alarm');
  }

  // Loot pickup.
  for (const item of world.loot) {
    if (item.taken) continue;
    if (dist(world.player.x, world.player.y, item.x, item.y) < PLAYER.pickupRadius) {
      item.taken = true;
      world.lootValue += item.value;
      if (item.main) world.mainLootTaken = true;
      world.flashes.push({ x: item.x, y: item.y - 20, text: `+$${item.value}`, t: 1.2 });
      addEvent(world, 'pickup');
    }
  }

  // Exit: only open once the main loot is taken.
  const ex = world.level.exit;
  const inExit =
    world.player.x > ex.x && world.player.x < ex.x + ex.w &&
    world.player.y > ex.y && world.player.y < ex.y + ex.h;
  if (inExit && world.mainLootTaken) {
    world.status = world.lockdownActive ? 'lockdown-escape' : 'won';
    addEvent(world, 'win');
  }

  // Caught: an alerted guard touches the player.
  for (const guard of world.guards) {
    if (guard.state === 'alerted' && dist(guard.x, guard.y, world.player.x, world.player.y) < GUARD.catchRadius) {
      world.status = 'lost';
      world.loseReason = 'CAUGHT — a guard grabbed Rook by the collar.';
      addEvent(world, 'lose');
      break;
    }
  }

  // Age the visual effects.
  for (const ring of world.noiseRings) ring.r += 260 * dt;
  world.noiseRings = world.noiseRings.filter((r) => r.r < r.max);
  for (const f of world.flashes) f.t -= dt;
  world.flashes = world.flashes.filter((f) => f.t > 0);
  if (world.empPulse > 0) world.empPulse -= dt;
}
