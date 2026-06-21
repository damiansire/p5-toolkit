const test = require("node:test");
const assert = require("node:assert/strict");
const { fakeP5 } = require("../../test/fake-p5.js");
const {
    createGrid,
    randomGrid,
    countNeighbors,
    step,
    parseRule,
    drawGrid,
} = require("./game-of-life-p5js.js");

test("createGrid arma una grilla rows×cols de ceros", () => {
    const grid = createGrid(3, 2);
    assert.equal(grid.length, 2);
    assert.equal(grid[0].length, 3);
    assert.deepEqual(grid[0], [0, 0, 0]);
});

test("createGrid rechaza dimensiones degeneradas", () => {
    assert.throws(() => createGrid(0, 5), RangeError);
    assert.throws(() => createGrid(5, -1), RangeError);
});

test("randomGrid respeta la densidad con un random inyectado", () => {
    const dead = randomGrid(2, 2, 0.3, () => 0.9); // 0.9 >= 0.3 -> todo muerto
    assert.deepEqual(dead, [[0, 0], [0, 0]]);
    const alive = randomGrid(2, 2, 0.3, () => 0.1); // 0.1 < 0.3 -> todo vivo
    assert.deepEqual(alive, [[1, 1], [1, 1]]);
});

test("countNeighbors envuelve en los bordes (toro)", () => {
    // Una sola celda viva en la esquina; su vecino diagonal por wrap es ella
    // misma desde la esquina opuesta -> el centro de un 3x3 la ve una vez.
    const grid = [
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    // El vecindario de la esquina opuesta (2,2) envuelve hasta (0,0).
    assert.equal(countNeighbors(grid, 2, 2), 1);
});

test("un blinker oscila con período 2", () => {
    // Blinker horizontal en una grilla 5x5.
    let grid = createGrid(5, 5);
    grid[2][1] = grid[2][2] = grid[2][3] = 1;
    const vertical = step(grid);
    // Tras un paso debe quedar vertical.
    assert.equal(vertical[1][2], 1);
    assert.equal(vertical[2][2], 1);
    assert.equal(vertical[3][2], 1);
    assert.equal(vertical[2][1], 0);
    assert.equal(vertical[2][3], 0);
    // Y tras otro paso, horizontal de nuevo.
    const horizontal = step(vertical);
    assert.deepEqual(horizontal, grid);
});

test("step no muta la grilla de entrada", () => {
    const grid = createGrid(3, 3);
    grid[1][1] = 1;
    const snapshot = grid.map((row) => row.slice());
    step(grid);
    assert.deepEqual(grid, snapshot);
});

test("un block es naturaleza muerta (estable)", () => {
    let grid = createGrid(4, 4);
    grid[1][1] = grid[1][2] = grid[2][1] = grid[2][2] = 1;
    assert.deepEqual(step(grid), grid);
});

test("parseRule entiende B3/S23 y variantes", () => {
    assert.deepEqual(parseRule("B3/S23"), { birth: [3], survival: [2, 3] });
    assert.deepEqual(parseRule("B36/S23"), { birth: [3, 6], survival: [2, 3] });
});

test("parseRule rechaza strings inválidas", () => {
    assert.throws(() => parseRule("vivir y dejar morir"), SyntaxError);
});

test("HighLife (B36/S23) nace con 6 vecinos donde Life no", () => {
    // Lookup-table regression: un patrón con exactamente 6 vecinos vivos.
    // Centro muerto rodeado de 6 vivos -> nace en HighLife, sigue muerto en Life.
    const grid = createGrid(3, 3);
    grid[0][0] = grid[0][1] = grid[0][2] = 1;
    grid[2][0] = grid[2][1] = grid[2][2] = 1;
    // countNeighbors del centro (1,1) ve los 6 vivos (con wrap no agrega más
    // porque la fila del medio está vacía y el wrap vertical repite las filas).
    const life = step(grid, { birth: [3], survival: [2, 3] });
    const highlife = step(grid, { birth: [3, 6], survival: [2, 3] });
    assert.equal(countNeighbors(grid, 1, 1), 6);
    assert.equal(life[1][1], 0, "Life no nace con 6 vecinos");
    assert.equal(highlife[1][1], 1, "HighLife sí nace con 6 vecinos");
});

test("drawGrid balancea push/pop y dibuja solo las celdas vivas", () => {
    const p = fakeP5({ width: 100, height: 100 });
    const grid = createGrid(3, 3);
    grid[0][0] = grid[1][1] = grid[2][2] = 1; // 3 vivas
    drawGrid(p, grid, 10);
    assert.ok(p.balanced());
    assert.equal(p.count("rect"), 3);
    assert.deepEqual(p.styleOutsidePush, []);
});
