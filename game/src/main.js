// Midnight Vault — boot and game loop.
// One job: wire input, audio, world and renderer together; run the screens
// (title / play / paused / won / lost) on a fixed 60 Hz step.
// ?shot=cover|patrol|alarm|win&seed=N renders one staged frame and sets
// window.__shotReady when it has painted twice.

import { FIELD_W, FIELD_H } from './config.js';
import { LEVELS } from './level.js';
import { createWorld, step } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { drawWorld, drawTitle, drawPaused, drawGameOver, drawWin } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 7);

const input = createInput(canvas);
const audio = createAudio();

let screen = 'title'; // title | play | paused | over | win
let world = createWorld(0, seed);
let totalLoot = 0;
let totalTime = 0;
let levelLoot = 0;
let levelTime = 0;

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function startLevel(index) {
  world = createWorld(index, seed + index);
  levelLoot = 0;
  levelTime = 0;
  screen = 'play';
  setStatus(`${world.level.name} — steal the main loot, then reach the exit.`);
}

function advanceLevel() {
  totalLoot += world.lootValue;
  totalTime += world.time;
  if (world.levelIndex + 1 < LEVELS.length) {
    startLevel(world.levelIndex + 1);
  } else {
    screen = 'win';
    setStatus(`Heist complete — $${totalLoot} in ${Math.floor(totalTime)}s.`);
    audio.win();
  }
}

function restartLevel() {
  totalLoot -= levelLoot;
  totalTime -= levelTime;
  startLevel(world.levelIndex);
}

// --- screenshot mode: one staged frame, then signal readiness -------------
if (shotName) {
  const shotWorld = stageShot(shotName, seed);
  if (shotName === 'win') {
    drawWin(ctx, shotWorld, 4600, 167);
  } else {
    drawWorld(ctx, shotWorld);
  }
  // Paint twice so gradients settle, then tell the screenshot tool.
  requestAnimationFrame(() => {
    if (shotName === 'win') drawWin(ctx, shotWorld, 4600, 167);
    else drawWorld(ctx, shotWorld);
    window.__shotReady = true;
  });
} else {
  // --- normal game loop ----------------------------------------------------
  let last = performance.now();
  let acc = 0;
  const STEP = 1000 / 60;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(100, now - last);
    last = now;

    if (input.take('mute')) {
      const muted = audio.toggleMute();
      setStatus(muted ? 'Sound off.' : 'Sound on.');
    }

    if (screen === 'title') {
      drawTitle(ctx, world);
      if (input.take('start') || input.takeClick()) {
        audio.unlock();
        totalLoot = 0;
        totalTime = 0;
        startLevel(0);
      }
      return;
    }

    if (screen === 'paused') {
      drawPaused(ctx, world);
      if (input.take('pause') || input.take('start')) screen = 'play';
      if (input.take('restart')) restartLevel();
      return;
    }

    if (screen === 'over') {
      drawGameOver(ctx, world);
      if (input.take('restart') || input.take('start')) restartLevel();
      return;
    }

    if (screen === 'win') {
      drawWin(ctx, world, totalLoot, totalTime);
      if (input.take('restart') || input.take('start')) {
        totalLoot = 0;
        totalTime = 0;
        startLevel(0);
      }
      return;
    }

    // Playing.
    if (input.take('pause')) {
      screen = 'paused';
      setStatus('Paused.');
      return;
    }
    if (input.take('restart')) {
      restartLevel();
      return;
    }

    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      const mv = input.move();
      const emp = input.take('emp');
      const beforeEvents = world.events.length;
      step(world, { mx: mv.mx, my: mv.my, sneak: mv.sneak, emp }, 1 / 60);
      levelLoot = world.lootValue;
      levelTime = world.time;
      for (const ev of world.events) {
        if (ev === 'footstep') audio.footstep(!mv.sneak);
        if (ev === 'suspicious') audio.suspicious();
        if (ev === 'beep') audio.beep();
        if (ev === 'alarm') audio.alarm();
        if (ev === 'pickup') audio.pickup();
        if (ev === 'emp') audio.emp();
        if (ev === 'lose') audio.lose();
      }
      if (world.status === 'won' || world.status === 'lockdown-escape') {
        advanceLevel();
        break;
      }
      if (world.status === 'lost') {
        screen = 'over';
        setStatus(world.loseReason);
        break;
      }
      void beforeEvents;
    }
    drawWorld(ctx, world);
  }

  canvas.width = FIELD_W;
  canvas.height = FIELD_H;
  setStatus('MIDNIGHT VAULT — press ENTER or click to start.');
  requestAnimationFrame(frame);
}

// Exposed for play-testing and debugging from the console.
window.__game = {
  get world() { return world; },
  get screen() { return screen; },
  startLevel,
  advanceLevel,
};
