# game-of-life-p5js

Run **Conway's Game of Life** (and its B/S relatives like HighLife) on a
[p5.js](https://p5js.org/) canvas. The grid wraps around its edges, so gliders
fly off one side and reappear on the other.

The drawing helper takes a p5 instance as its first argument, so the package
works in **instance mode** (and global mode too). The grid model and the step
rule are pure and decoupled from p5, so the whole simulation can be used and
tested without a canvas.

## Installation

```bash
npm install game-of-life-p5js
```

`p5` is a peer dependency (`^1.0.0`); install it alongside if you haven't already:

```bash
npm install p5
```

## Usage (instance mode)

```js
const p5 = require("p5");
const { randomGrid, step, drawGrid } = require("game-of-life-p5js");

new p5((p) => {
  const cell = 8;
  let grid;

  p.setup = () => {
    p.createCanvas(640, 480);
    p.frameRate(12);
    grid = randomGrid(p.width / cell, p.height / cell, 0.3, () => p.random());
  };

  p.draw = () => {
    p.background(10);
    p.fill(0, 255, 140);
    drawGrid(p, grid, cell);
    grid = step(grid); // advance one generation
  };
});
```

Run a variant by passing a different B/S rule:

```js
const { step, parseRule } = require("game-of-life-p5js");

grid = step(grid, parseRule("B36/S23")); // HighLife (self-replicating patterns)
```

## API

### `randomGrid(cols, rows, density = 0.3, randomFn = Math.random)`

Builds a `rows × cols` grid seeded randomly. `randomFn` returns `[0, 1)`; pass
`() => p.random()` to share p5's RNG.

### `step(grid, rule = { birth: [3], survival: [2, 3] })`

Advances the grid one generation and returns a **fresh** grid (the input is
never mutated). The default rule is Conway's Life (`B3/S23`).

### `parseRule(rulestring)`

Parses a rulestring like `"B3/S23"` or `"B36/S23"` into
`{ birth, survival }` arrays.

### `drawGrid(p, grid, cellSize = 10)`

Draws the live cells as filled squares. The background and fill colour are left
to the caller, so fades and trails are possible.

### Pure helpers (no p5 needed)

- `createGrid(cols, rows, fill = 0)` — an empty `rows × cols` grid.
- `countNeighbors(grid, x, y)` — live neighbours in the wrapped 8-neighbourhood.

```js
const { createGrid, step } = require("game-of-life-p5js");

let grid = createGrid(5, 5);
grid[2][1] = grid[2][2] = grid[2][3] = 1; // a blinker
grid = step(grid); // now vertical
```

## License

MIT © Damian Sire
