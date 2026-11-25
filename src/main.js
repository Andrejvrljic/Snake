// Darstellung und Eingabe im Browser. Die Regeln stehen in game.js.
import { createGame, queueDirection, step, togglePause, tickMs } from './game.js';

const COLS = 20;
const ROWS = 20;
const BEST_KEY = 'snake.best';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayButton = document.getElementById('overlay-button');

const colors = {
  grid: '#1b2836',
  head: '#86efac',
  body: '#4ade80',
  food: '#f87171',
  eye: '#0f1720',
};

function readBest() {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}
function writeBest(value) {
  try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* privat-Modus o. Ä. */ }
}

let state = createGame({ cols: COLS, rows: ROWS });
let best = readBest();
let accumulator = 0;
let lastTime = performance.now();
let lastStatus = null;

// ---------- Zeichnen ----------

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  draw();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function draw() {
  const cell = canvas.width / COLS;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Schachbrettmuster
  ctx.fillStyle = colors.grid;
  for (let y = 0; y < ROWS; y++) {
    for (let x = (y % 2); x < COLS; x += 2) ctx.fillRect(x * cell, y * cell, cell, cell);
  }

  // Futter
  if (state.food) {
    ctx.fillStyle = colors.food;
    ctx.beginPath();
    ctx.arc((state.food.x + 0.5) * cell, (state.food.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }

  // Schlange (vom Schwanz zum Kopf, damit der Kopf oben liegt)
  const pad = cell * 0.08;
  for (let i = state.snake.length - 1; i >= 0; i--) {
    const c = state.snake[i];
    ctx.fillStyle = i === 0 ? colors.head : colors.body;
    roundRect(c.x * cell + pad, c.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.25);
  }

  // Augen
  const head = state.snake[0];
  const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[state.direction];
  const cx = (head.x + 0.5) * cell;
  const cy = (head.y + 0.5) * cell;
  const side = [-dir[1], dir[0]];
  ctx.fillStyle = colors.eye;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + dir[0] * cell * 0.18 + side[0] * s * cell * 0.2,
            cy + dir[1] * cell * 0.18 + side[1] * s * cell * 0.2,
            cell * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}

function showOverlay(title, text, button) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = button;
  overlay.hidden = false;
}

function syncUi() {
  scoreEl.textContent = state.score;
  if (state.score > best) {
    best = state.score;
    writeBest(best);
  }
  bestEl.textContent = best;

  if (state.status === lastStatus) return;
  lastStatus = state.status;

  switch (state.status) {
    case 'ready':
      showOverlay('Snake', 'Pfeiltaste drücken oder wischen zum Starten', 'Start');
      break;
    case 'paused':
      showOverlay('Pause', 'Leertaste zum Weiterspielen', 'Weiter');
      break;
    case 'over':
      showOverlay('Game Over', `${state.score} Punkte`, 'Nochmal');
      break;
    case 'won':
      showOverlay('Gewonnen! 🎉', `Das ganze Feld ist voll – ${state.score} Punkte`, 'Nochmal');
      break;
    default:
      overlay.hidden = true;
  }
}

// ---------- Spielschleife ----------

function frame(now) {
  // Nach einem Tab-Wechsel nicht hunderte Schritte nachholen.
  accumulator += Math.min(now - lastTime, 250);
  lastTime = now;

  if (state.status === 'running') {
    while (accumulator >= tickMs(state.score) && state.status === 'running') {
      accumulator -= tickMs(state.score);
      state = step(state);
    }
  } else {
    accumulator = 0;
  }

  draw();
  syncUi();
  requestAnimationFrame(frame);
}

// ---------- Eingabe ----------

function turn(dir) {
  state = queueDirection(state, dir);
}

function restart() {
  state = createGame({ cols: COLS, rows: ROWS });
  accumulator = 0;
}

function primaryAction() {
  if (state.status === 'over' || state.status === 'won') restart();
  else if (state.status === 'ready') turn('right');
  else state = togglePause(state);
}

const KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

window.addEventListener('keydown', (e) => {
  const dir = KEYS[e.code];
  if (dir) {
    e.preventDefault();
    if (state.status === 'over' || state.status === 'won') restart();
    if (state.status === 'paused') state = togglePause(state);
    turn(dir);
  } else if (e.code === 'Space' || e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    if (state.status === 'running' || state.status === 'paused') state = togglePause(state);
    else if (e.code === 'Space') primaryAction();
  } else if (e.code === 'Enter' || e.code === 'KeyR') {
    if (state.status !== 'running') {
      e.preventDefault();
      primaryAction();
    }
  }
});

overlayButton.addEventListener('click', primaryAction);
document.getElementById('pause').addEventListener('click', () => {
  state = togglePause(state);
});
document.querySelectorAll('[data-dir]').forEach((btn) => {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state.status === 'over' || state.status === 'won') restart();
    if (state.status === 'paused') state = togglePause(state);
    turn(btn.dataset.dir);
  });
});

// Wischen auf dem Spielfeld
let touchStart = null;
const board = canvas.parentElement;
board.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
board.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; // nur ein Tipp
  if (state.status === 'over' || state.status === 'won') restart();
  if (state.status === 'paused') state = togglePause(state);
  turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});

// Beim Verlassen des Tabs automatisch pausieren
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.status === 'running') state = togglePause(state);
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(frame);
