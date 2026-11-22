// Midnight Vault — screenshot staging.
// One job: put a fresh world into a photogenic state for each screenshot,
// then render it with the real renderer. No composites, no edits:
// every frame is the game itself, drawn by render.js.
// Usage: ?shot=cover|patrol|alarm|win&seed=N

import { createWorld, step } from './world.js';
import { GUARD } from './config.js';

function freshWorld(seed) {
  return createWorld(0, seed || 7);
}

// The thief crosses the room toward the glowing vault loot, a guard cone
// sweeping nearby, a camera cone crossing the floor, alarm meter showing.
export function stageCover(seed) {
  const world = freshWorld(seed);
  world.player.x = 640;
  world.player.y = 480;
  world.player.dir = -Math.PI / 2;
  world.player.sneaking = true;
  // One guard mid-patrol with its cone aimed across the thief's path.
  const guard = world.guards[1];
  guard.x = 820;
  guard.y = 380;
  guard.dir = Math.PI;
  guard.detect = 0.42;
  guard.state = 'suspicious';
  guard.investigate = { x: 640, y: 480 };
  // A second guard on patrol at the left.
  world.guards[0].x = 420;
  world.guards[0].y = 300;
  world.guards[0].dir = 0.4;
  // Camera cone sweeping across the vault approach.
  world.cameras[0].angle = Math.PI * 0.75;
  world.cameras[1].angle = Math.PI / 2;
  world.alarm = 34;
  world.maxAlarm = 34;
  world.everDetected = true;
  return world;
}

// The thief hidden in a plant while guards patrol and a camera sweeps.
export function stagePatrol(seed) {
  const world = freshWorld(seed);
  world.player.x = 180;
  world.player.y = 150;
  world.player.sneaking = true;
  world.player.dir = Math.PI / 2;
  world.guards[0].x = 420;
  world.guards[0].y = 240;
  world.guards[0].dir = Math.PI / 2;
  world.guards[3].x = 300;
  world.guards[3].y = 520;
  world.guards[3].dir = -Math.PI / 2;
  world.cameras[1].angle = Math.PI * 0.4;
  world.alarm = 6;
  world.maxAlarm = 6;
  return world;
}

// Near-miss: an alerted guard closing in, red cone, alarm meter high.
export function stageAlarm(seed) {
  const world = freshWorld(seed);
  world.player.x = 700;
  world.player.y = 430;
  world.player.dir = Math.PI;
  world.player.sneaking = false;
  const guard = world.guards[1];
  guard.x = 780;
  guard.y = 430;
  guard.dir = Math.PI;
  guard.detect = 1;
  guard.state = 'alerted';
  guard.investigate = { x: 700, y: 430 };
  world.guards[0].x = 560;
  world.guards[0].y = 300;
  world.guards[0].dir = 0.9;
  world.guards[0].detect = 0.7;
  world.guards[0].state = 'suspicious';
  world.cameras[0].angle = Math.PI * 0.6;
  world.cameras[0].spotting = true;
  world.alarm = 82;
  world.maxAlarm = 82;
  world.everDetected = true;
  world.lootValue = 800;
  world.loot[1].taken = true;
  return world;
}

// Win screen: GHOST rating, loot value, time. The world behind it is the
// vault floor after a clean getaway.
export function stageWin(seed) {
  const world = freshWorld(seed);
  world.status = 'won';
  world.lootValue = 4600;
  world.loot[0].taken = true;
  world.loot[1].taken = true;
  world.loot[2].taken = true;
  world.mainLootTaken = true;
  world.time = 167;
  world.maxAlarm = 0;
  world.everDetected = false;
  world.player.x = 1180;
  world.player.y = 620;
  return world;
}

export function stageShot(name, seed) {
  if (name === 'cover') return stageCover(seed);
  if (name === 'patrol') return stagePatrol(seed);
  if (name === 'alarm') return stageAlarm(seed);
  if (name === 'win') return stageWin(seed);
  return stageCover(seed);
}

// Advance a world a fixed number of steps with a scripted input, for
// autopilot-style staging. Not used by the four shots above (they place
// state directly), but kept for honest play-through frames.
export function autopilot(world, frames, input) {
  for (let i = 0; i < frames; i++) step(world, input, 1 / 60);
  return world;
}

export { GUARD };
