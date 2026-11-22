// Midnight Vault — tuning numbers and palette.
// One job: every magic number the game balances on lives here.

export const FIELD_W = 1280;
export const FIELD_H = 720;
export const HUD_H = 56;

export const PLAYER = {
  radius: 14,
  walkSpeed: 170, // px per second, running
  sneakSpeed: 95, // px per second, sneaking
  noiseRadius: 230, // how far running footsteps carry
  noiseInterval: 0.38, // seconds between noise rings while running
  pickupRadius: 30,
  hideRadius: 62, // a guard must be closer than this to spot a hidden player
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 72,
  investigateSpeed: 105,
  chaseSpeed: 148,
  coneRange: 235,
  coneHalfAngle: 0.52, // radians, ~30 degrees each side
  catchRadius: 24,
  detectFill: 0.9, // base detection meter fill per second at point blank
  detectDecay: 0.45, // meter decay per second while unseen
  suspiciousAt: 0.35,
  loseSightAfter: 3.0, // seconds unseen before an alerted guard gives up
  searchTime: 4.0,
};

export const CAMERA = {
  coneRange: 260,
  coneHalfAngle: 0.46,
  spotFill: 1.9, // alarm per second while a camera sees the player
  beepInterval: 0.7,
};

export const ALARM = {
  guardSpot: 26, // alarm points when a guard fully spots the player
  decay: 5.0, // alarm points per second while hidden and quiet
  lockdownAt: 100,
  lockdownSeconds: 8,
};

export const EMP = {
  chargesPerLevel: 2,
  disableSeconds: 6,
  radius: 420, // visual pulse reach
};

export const PALETTE = {
  floorA: '#2b2f3a',
  floorB: '#262a34',
  floorLine: '#343947',
  wall: '#4a4f63',
  wallTop: '#5d6380',
  desk: '#6b4f2e',
  deskTop: '#8a6a3d',
  plant: '#2e6b3a',
  plantDark: '#1d4a26',
  shadow: '#14161d',
  lampGlow: 'rgba(255, 196, 110, 0.16)',
  player: '#e8e6df',
  playerHood: '#23262e',
  guard: '#2c4a7c',
  guardTrim: '#d8b13c',
  coneCalm: 'rgba(255, 176, 66, 0.30)',
  coneAlert: 'rgba(255, 64, 48, 0.42)',
  cameraCone: 'rgba(255, 64, 190, 0.30)',
  cameraBody: '#8a2f6b',
  loot: '#ffd94a',
  lootGlow: 'rgba(255, 217, 74, 0.35)',
  exit: '#39d353',
  exitGlow: 'rgba(57, 211, 83, 0.30)',
  vault: '#7d838f',
  vaultDoor: '#9aa1b5',
  hudBg: 'rgba(10, 12, 18, 0.82)',
  hudText: '#f2f0e8',
  hudDim: '#9aa0b0',
  alarmLow: '#39d353',
  alarmMid: '#ffb02e',
  alarmHigh: '#ff4030',
  title: '#ffd94a',
};

export const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
