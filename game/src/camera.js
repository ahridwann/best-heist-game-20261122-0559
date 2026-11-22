// Midnight Vault — the security cameras.
// One job: sweeping vision cones. Cameras never move, but their cones sweep
// the room; a camera that spots the player raises the alarm fast and beeps.
// An EMP pulse disables every camera for a few seconds.

import { CAMERA } from './config.js';
import { dist, angleDiff, lineBlocked, playerHidden } from './world.js';

// Can this camera see the player right now? Cone + range + line of sight.
export function cameraCanSee(world, camera) {
  if (camera.disabledTimer > 0) return false;
  const p = world.player;
  const level = world.level;
  const d = dist(camera.x, camera.y, p.x, p.y);
  if (d > camera.range) return false;
  if (playerHidden(level, p.x, p.y) && d > 62) return false;
  const angleToPlayer = Math.atan2(p.y - camera.y, p.x - camera.x);
  if (Math.abs(angleDiff(angleToPlayer, camera.angle)) > CAMERA.coneHalfAngle) return false;
  if (lineBlocked(level, camera.x, camera.y, p.x, p.y)) return false;
  return true;
}

export function updateCamera(world, camera, dt) {
  if (camera.disabledTimer > 0) {
    camera.disabledTimer -= dt;
    camera.spotting = false;
    return false;
  }
  // Sweep the cone back and forth around its mounting angle.
  camera.angle = camera.base + Math.sin(world.time * camera.speed) * camera.sweep;

  const sees = cameraCanSee(world, camera);
  camera.spotting = sees;
  if (sees) {
    world.alarm = Math.min(100, world.alarm + CAMERA.spotFill * 10 * dt);
    world.everDetected = true;
    camera.beepTimer -= dt;
    if (camera.beepTimer <= 0) {
      camera.beepTimer = CAMERA.beepInterval;
      world.events.push('beep');
    }
  }
  return sees;
}
