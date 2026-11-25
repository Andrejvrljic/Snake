// Reine Spiellogik für Snake – kein DOM, damit sie in Node testbar ist.

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const MAX_QUEUED_TURNS = 3;

const sameCell = (a, b) => a.x === b.x && a.y === b.y;

/** Wählt zufällig ein freies Feld für das Futter; null, wenn das Feld voll ist. */
export function placeFood(snake, cols, rows, rng = Math.random) {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
  const free = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.min(free.length - 1, Math.floor(rng() * free.length))];
}

export function createGame({ cols = 20, rows = 20, rng = Math.random } = {}) {
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const snake = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  return {
    cols,
    rows,
    snake,
    direction: 'right',
    queue: [],
    food: placeFood(snake, cols, rows, rng),
    score: 0,
    status: 'ready', // ready | running | paused | over | won
  };
}

/**
 * Merkt sich eine Richtungsänderung für die nächsten Ticks.
 * Umkehr in die Gegenrichtung wird ignoriert; der erste Tastendruck startet das Spiel.
 */
export function queueDirection(state, dir) {
  if (!DIRECTIONS[dir]) return state;
  if (state.status !== 'ready' && state.status !== 'running') return state;

  const last = state.queue.length ? state.queue[state.queue.length - 1] : state.direction;
  const status = 'running';

  if (dir === last || dir === OPPOSITE[last] || state.queue.length >= MAX_QUEUED_TURNS) {
    return state.status === status ? state : { ...state, status };
  }
  return { ...state, status, queue: [...state.queue, dir] };
}

export function togglePause(state) {
  if (state.status === 'running') return { ...state, status: 'paused' };
  if (state.status === 'paused') return { ...state, status: 'running' };
  return state;
}

/** Ein Spielschritt: Schlange bewegen, fressen, Kollisionen prüfen. */
export function step(state, rng = Math.random) {
  if (state.status !== 'running') return state;

  const [direction = state.direction, ...queue] = state.queue;
  const d = DIRECTIONS[direction];
  const head = state.snake[0];
  const next = { x: head.x + d.x, y: head.y + d.y };

  const hitsWall = next.x < 0 || next.y < 0 || next.x >= state.cols || next.y >= state.rows;
  const eats = state.food !== null && sameCell(next, state.food);
  // Der Schwanz rückt nach, außer die Schlange wächst gerade – dann darf man ihn nicht betreten.
  const body = eats ? state.snake : state.snake.slice(0, -1);
  const hitsSelf = body.some((c) => sameCell(c, next));

  if (hitsWall || hitsSelf) {
    return { ...state, direction, queue: [], status: 'over' };
  }

  const snake = [next, ...body];
  if (!eats) return { ...state, direction, queue, snake };

  const food = placeFood(snake, state.cols, state.rows, rng);
  return {
    ...state,
    direction,
    queue,
    snake,
    food,
    score: state.score + 1,
    status: food === null ? 'won' : 'running',
  };
}

/** Tick-Dauer in ms: wird mit jedem Punkt etwas schneller. */
export function tickMs(score) {
  return Math.max(55, 140 - score * 3);
}
