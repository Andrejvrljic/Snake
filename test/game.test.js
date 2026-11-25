import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeFood, queueDirection, step, togglePause, tickMs } from '../src/game.js';

const running = (overrides = {}) => ({ ...createGame({ rng: () => 0 }), status: 'running', ...overrides });

test('neues Spiel: Schlange mit 3 Gliedern in der Mitte, Futter nicht auf der Schlange', () => {
  const g = createGame({ cols: 10, rows: 10, rng: () => 0.5 });
  assert.equal(g.snake.length, 3);
  assert.deepEqual(g.snake[0], { x: 5, y: 5 });
  assert.equal(g.status, 'ready');
  assert.ok(!g.snake.some((c) => c.x === g.food.x && c.y === g.food.y));
});

test('Schlange bewegt sich einen Schritt in Laufrichtung', () => {
  const g = running({ food: { x: 0, y: 0 } });
  const n = step(g);
  assert.deepEqual(n.snake[0], { x: g.snake[0].x + 1, y: g.snake[0].y });
  assert.equal(n.snake.length, 3);
});

test('im Status "ready" passiert bei step nichts', () => {
  const g = createGame();
  assert.equal(step(g), g);
});

test('erster Tastendruck startet das Spiel', () => {
  const g = queueDirection(createGame(), 'up');
  assert.equal(g.status, 'running');
  assert.deepEqual(g.queue, ['up']);
});

test('Umkehr in die Gegenrichtung wird ignoriert', () => {
  const g = queueDirection(running(), 'left');
  assert.deepEqual(g.queue, []);
});

test('schnelle Doppel-Eingabe: Umkehr wird gegen die zuletzt gemerkte Richtung geprüft', () => {
  let g = queueDirection(running(), 'up');
  g = queueDirection(g, 'down'); // Gegenteil von "up" -> ignoriert
  g = queueDirection(g, 'left');
  assert.deepEqual(g.queue, ['up', 'left']);
  g = step(g, () => 0);
  assert.equal(g.direction, 'up');
  g = step(g, () => 0);
  assert.equal(g.direction, 'left');
});

test('Fressen lässt die Schlange wachsen und erhöht den Punktestand', () => {
  const g = running();
  const head = g.snake[0];
  const n = step({ ...g, food: { x: head.x + 1, y: head.y } }, () => 0);
  assert.equal(n.score, 1);
  assert.equal(n.snake.length, 4);
  assert.notDeepEqual(n.food, { x: head.x + 1, y: head.y });
});

test('Wand bedeutet Game Over', () => {
  const g = running({ snake: [{ x: 19, y: 5 }, { x: 18, y: 5 }, { x: 17, y: 5 }], food: { x: 0, y: 0 } });
  assert.equal(step(g).status, 'over');
});

test('Biss in den eigenen Körper bedeutet Game Over', () => {
  // Kopf bei (5,5) läuft nach oben in (5,4), das zum Körper gehört.
  const snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 4 }];
  const g = running({ snake, direction: 'left', queue: ['up'], food: { x: 0, y: 0 } });
  assert.equal(step(g).status, 'over');
});

test('in das gerade frei werdende Schwanzfeld darf man laufen', () => {
  const snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 5, y: 4 }];
  const g = running({ snake, direction: 'left', queue: ['up'], food: { x: 0, y: 0 } });
  const n = step(g);
  assert.equal(n.status, 'running');
  assert.deepEqual(n.snake[0], { x: 5, y: 4 });
});

test('Pause und Fortsetzen', () => {
  const g = running();
  const p = togglePause(g);
  assert.equal(p.status, 'paused');
  assert.equal(step(p), p);
  assert.equal(togglePause(p).status, 'running');
});

test('placeFood liefert null, wenn kein Feld frei ist (Sieg)', () => {
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
  assert.equal(placeFood(snake, 2, 1), null);
  assert.deepEqual(placeFood([{ x: 0, y: 0 }], 2, 1, () => 0.99), { x: 1, y: 0 });
});

test('letztes freies Feld fressen = gewonnen', () => {
  const g = { ...running(), cols: 3, rows: 1, snake: [{ x: 1, y: 0 }, { x: 0, y: 0 }], direction: 'right', food: { x: 2, y: 0 } };
  const n = step(g);
  assert.equal(n.status, 'won');
  assert.equal(n.food, null);
});

test('Spiel wird schneller, aber nicht beliebig', () => {
  assert.ok(tickMs(10) < tickMs(0));
  assert.equal(tickMs(1000), 55);
});
