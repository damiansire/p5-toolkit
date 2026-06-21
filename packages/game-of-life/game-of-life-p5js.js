// Conway's Game of Life (and its B/S relatives) as a pure cellular automaton.
//
// The grid model and the step rule are pure and decoupled from p5, so the whole
// simulation can be tested without a canvas. p5 only appears in `drawGrid`,
// which takes the instance as its first argument (instance and global mode both
// work).

// Creates a `rows × cols` grid filled with `fill` (0 = dead, 1 = alive).
function createGrid(cols, rows, fill = 0) {
    // A grid with no cells would make `step` a no-op and silently draw nothing.
    // Reject the degenerate size so the caller notices the mistake.
    if (!(cols > 0) || !(rows > 0)) {
        throw new RangeError(`cols and rows must be > 0, received ${cols}×${rows}`);
    }
    return Array.from({ length: rows }, () => new Array(cols).fill(fill));
}

// Seeds a grid randomly. `randomFn` returns a value in [0, 1) (p5's `p.random`
// without args does); injecting it keeps the function deterministic in tests.
function randomGrid(cols, rows, density = 0.3, randomFn = Math.random) {
    const grid = createGrid(cols, rows);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            grid[y][x] = randomFn() < density ? 1 : 0;
        }
    }
    return grid;
}

// Counts the live cells in the 8-neighbourhood of `(x, y)`. The grid wraps
// around the edges (a torus), so gliders fly off one side and come back the
// other — the classic infinite-playfield feel.
function countNeighbors(grid, x, y) {
    const rows = grid.length;
    const cols = grid[0].length;
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + cols) % cols;
            const ny = (y + dy + rows) % rows;
            count += grid[ny][nx];
        }
    }
    return count;
}

// Advances the whole grid one generation and returns a fresh grid (never
// mutates the input — every cell is decided from the same snapshot). The rule
// is given as B/S sets so the same engine runs Life (`B3/S23`) or variants like
// HighLife (`B36/S23`).
function step(grid, rule = { birth: [3], survival: [2, 3] }) {
    const rows = grid.length;
    const cols = grid[0].length;
    // A neighbour count is always 0–8, so the rule fits in two fixed-size
    // boolean tables. Building these once per call (instead of two `Set`s plus a
    // `.has` per cell) keeps the per-frame allocation flat for big grids.
    const birth = ruleLookup(rule.birth);
    const survival = ruleLookup(rule.survival);
    const next = createGrid(cols, rows);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const neighbors = countNeighbors(grid, x, y);
            next[y][x] = grid[y][x] ? survival[neighbors] : birth[neighbors];
        }
    }
    return next;
}

// Turns a B/S digit list into a length-9 lookup (index = neighbour count,
// value = 1 if that count keeps/makes a cell alive, else 0). Counts outside
// 0–8 are impossible in an 8-neighbourhood, so they're simply absent.
function ruleLookup(counts) {
    const table = new Array(9).fill(0);
    for (const n of counts) {
        if (n >= 0 && n <= 8) table[n] = 1;
    }
    return table;
}

// Parses a rulestring like "B3/S23" (or "B36/S23") into `{ birth, survival }`
// arrays. Convenient when a sketch wants to expose the rule as a string.
function parseRule(rulestring) {
    const match = /^B(\d*)\/S(\d*)$/i.exec(rulestring.trim());
    if (!match) {
        throw new SyntaxError(`invalid rulestring: "${rulestring}" (expected something like "B3/S23")`);
    }
    const toDigits = (s) => s.split("").map(Number);
    return { birth: toDigits(match[1]), survival: toDigits(match[2]) };
}

// Draws the grid as a block of cells `cellSize` pixels wide. Only live cells are
// filled; the background is left to the caller so trails/fades are possible.
function drawGrid(p, grid, cellSize = 10) {
    p.push();
    p.noStroke();
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x]) {
                p.rect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    p.pop();
}

module.exports = {
    createGrid,
    randomGrid,
    countNeighbors,
    step,
    parseRule,
    drawGrid,
};
