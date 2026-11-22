// Midnight Vault — the three floors of Meridian Bank.
// One job: level data only. Walls block movement and sight; desks block sight;
// plants are hide spots; shadow pools slow detection; lamps mark lit (risky) ground.

const BORDER = [
  { x: 0, y: 64, w: 1280, h: 14 }, // top wall, just under the HUD
  { x: 0, y: 706, w: 1280, h: 14 }, // bottom wall
  { x: 0, y: 64, w: 14, h: 656 }, // left wall
  { x: 1266, y: 64, w: 14, h: 656 }, // right wall
];

export const LEVELS = [
  {
    name: 'LEVEL 1 — LOBBY',
    subtitle: 'Slip past the night shift, crack the vault, grab the gold.',
    spawn: { x: 90, y: 620 },
    exit: { x: 1180, y: 620, w: 62, h: 62, label: 'GETAWAY VAN' },
    vault: { x: 1020, y: 300, w: 190, h: 130 },
    empCharges: 2,
    par: 150,
    walls: [
      ...BORDER,
      { x: 300, y: 200, w: 16, h: 220 },
      { x: 560, y: 420, w: 220, h: 16 },
      { x: 780, y: 150, w: 16, h: 180 },
      { x: 560, y: 150, w: 220, h: 16 },
    ],
    desks: [
      { x: 420, y: 300, w: 110, h: 46 },
      { x: 640, y: 560, w: 120, h: 46 },
      { x: 880, y: 480, w: 110, h: 46 },
    ],
    plants: [
      { x: 180, y: 150, r: 30 },
      { x: 480, y: 640, r: 30 },
      { x: 940, y: 200, r: 30 },
    ],
    shadows: [
      { x: 200, y: 480, r: 64 },
      { x: 700, y: 300, r: 70 },
      { x: 1080, y: 560, r: 60 },
    ],
    lamps: [
      { x: 420, y: 180, r: 130 },
      { x: 820, y: 380, r: 130 },
      { x: 1120, y: 300, r: 120 },
    ],
    guards: [
      { x: 420, y: 160, waypoints: [{ x: 420, y: 160 }, { x: 420, y: 520 }, { x: 700, y: 520 }], speed: 72 },
      { x: 700, y: 240, waypoints: [{ x: 700, y: 240 }, { x: 980, y: 240 }, { x: 980, y: 560 }], speed: 72 },
      { x: 980, y: 620, waypoints: [{ x: 980, y: 620 }, { x: 700, y: 620 }, { x: 700, y: 420 }], speed: 66 },
      { x: 180, y: 340, waypoints: [{ x: 180, y: 340 }, { x: 180, y: 620 }, { x: 420, y: 620 }], speed: 66 },
    ],
    cameras: [
      { x: 1010, y: 240, base: Math.PI / 2, sweep: 1.1, range: 260, speed: 0.55 },
      { x: 640, y: 180, base: Math.PI / 2, sweep: 0.9, range: 240, speed: 0.7 },
    ],
    loot: [
      { x: 1115, y: 365, kind: 'gold', value: 3000, main: true, label: 'VAULT GOLD' },
      { x: 475, y: 323, kind: 'cash', value: 800, main: false, label: 'CASH' },
      { x: 700, y: 583, kind: 'cash', value: 800, main: false, label: 'CASH' },
    ],
  },
  {
    name: 'LEVEL 2 — VAULT FLOOR',
    subtitle: 'Tighter patrols, more eyes. The safe-deposit hall holds the diamonds.',
    spawn: { x: 90, y: 130 },
    exit: { x: 90, y: 620, w: 62, h: 62, label: 'SERVICE LIFT' },
    vault: { x: 1020, y: 520, w: 190, h: 130 },
    empCharges: 2,
    par: 180,
    walls: [
      ...BORDER,
      { x: 300, y: 64, w: 16, h: 200 },
      { x: 300, y: 420, w: 16, h: 286 },
      { x: 560, y: 240, w: 16, h: 240 },
      { x: 820, y: 64, w: 16, h: 200 },
      { x: 820, y: 420, w: 16, h: 286 },
      { x: 560, y: 480, w: 260, h: 16 },
    ],
    desks: [
      { x: 420, y: 340, w: 110, h: 46 },
      { x: 940, y: 340, w: 110, h: 46 },
      { x: 660, y: 600, w: 120, h: 46 },
    ],
    plants: [
      { x: 180, y: 360, r: 30 },
      { x: 700, y: 130, r: 30 },
      { x: 1180, y: 360, r: 30 },
    ],
    shadows: [
      { x: 430, y: 560, r: 64 },
      { x: 950, y: 160, r: 66 },
      { x: 660, y: 360, r: 60 },
    ],
    lamps: [
      { x: 430, y: 200, r: 130 },
      { x: 950, y: 480, r: 130 },
      { x: 700, y: 620, r: 120 },
    ],
    guards: [
      { x: 430, y: 130, waypoints: [{ x: 430, y: 130 }, { x: 700, y: 130 }, { x: 700, y: 360 }], speed: 78 },
      { x: 950, y: 130, waypoints: [{ x: 950, y: 130 }, { x: 950, y: 360 }, { x: 1180, y: 360 }], speed: 78 },
      { x: 700, y: 560, waypoints: [{ x: 700, y: 560 }, { x: 950, y: 560 }, { x: 950, y: 360 }], speed: 78 },
      { x: 180, y: 500, waypoints: [{ x: 180, y: 500 }, { x: 180, y: 200 }, { x: 430, y: 200 }], speed: 72 },
      { x: 1180, y: 620, waypoints: [{ x: 1180, y: 620 }, { x: 1180, y: 420 }, { x: 950, y: 420 }], speed: 72 },
    ],
    cameras: [
      { x: 860, y: 300, base: -Math.PI / 2, sweep: 1.0, range: 260, speed: 0.6 },
      { x: 600, y: 90, base: Math.PI / 2, sweep: 0.9, range: 250, speed: 0.75 },
      { x: 1115, y: 500, base: Math.PI, sweep: 0.8, range: 250, speed: 0.65 },
    ],
    loot: [
      { x: 1115, y: 585, kind: 'gold', value: 5000, main: true, label: 'DIAMONDS' },
      { x: 475, y: 363, kind: 'cash', value: 1200, main: false, label: 'CASH' },
      { x: 995, y: 363, kind: 'jewels', value: 1500, main: false, label: 'JEWELS' },
    ],
  },
  {
    name: 'LEVEL 3 — ROOFTOP GETAWAY',
    subtitle: 'One last sweep. Cross the roof, take the crown jewels, reach the helicopter.',
    spawn: { x: 90, y: 620 },
    exit: { x: 1180, y: 120, w: 62, h: 62, label: 'HELICOPTER' },
    vault: { x: 1020, y: 300, w: 190, h: 130 },
    empCharges: 2,
    par: 210,
    walls: [
      ...BORDER,
      { x: 300, y: 300, w: 16, h: 260 },
      { x: 640, y: 64, w: 16, h: 220 },
      { x: 640, y: 440, w: 16, h: 266 },
      { x: 940, y: 240, w: 16, h: 240 },
    ],
    desks: [
      { x: 420, y: 160, w: 110, h: 46 },
      { x: 760, y: 560, w: 120, h: 46 },
      { x: 1080, y: 480, w: 110, h: 46 },
    ],
    plants: [
      { x: 180, y: 200, r: 30 },
      { x: 500, y: 620, r: 30 },
      { x: 820, y: 160, r: 30 },
    ],
    shadows: [
      { x: 220, y: 420, r: 64 },
      { x: 760, y: 340, r: 66 },
      { x: 1120, y: 620, r: 60 },
    ],
    lamps: [
      { x: 420, y: 480, r: 130 },
      { x: 820, y: 480, r: 130 },
      { x: 1120, y: 300, r: 120 },
    ],
    guards: [
      { x: 420, y: 130, waypoints: [{ x: 420, y: 130 }, { x: 420, y: 480 }, { x: 640, y: 480 }], speed: 84 },
      { x: 760, y: 160, waypoints: [{ x: 760, y: 160 }, { x: 760, y: 560 }, { x: 1080, y: 560 }], speed: 84 },
      { x: 1080, y: 160, waypoints: [{ x: 1080, y: 160 }, { x: 1080, y: 480 }, { x: 820, y: 480 }], speed: 84 },
      { x: 180, y: 360, waypoints: [{ x: 180, y: 360 }, { x: 180, y: 620 }, { x: 480, y: 620 }], speed: 78 },
      { x: 1180, y: 300, waypoints: [{ x: 1180, y: 300 }, { x: 1180, y: 620 }, { x: 940, y: 620 }], speed: 78 },
    ],
    cameras: [
      { x: 640, y: 300, base: 0, sweep: 1.1, range: 270, speed: 0.7 },
      { x: 980, y: 90, base: Math.PI / 2, sweep: 0.9, range: 260, speed: 0.8 },
      { x: 340, y: 560, base: -Math.PI / 2, sweep: 0.9, range: 250, speed: 0.65 },
      { x: 1180, y: 300, base: Math.PI, sweep: 0.8, range: 250, speed: 0.75 },
    ],
    loot: [
      { x: 1115, y: 365, kind: 'gold', value: 8000, main: true, label: 'CROWN JEWELS' },
      { x: 475, y: 183, kind: 'cash', value: 1500, main: false, label: 'CASH' },
      { x: 820, y: 583, kind: 'jewels', value: 2000, main: false, label: 'JEWELS' },
    ],
  },
];

export function levelCount() {
  return LEVELS.length;
}
