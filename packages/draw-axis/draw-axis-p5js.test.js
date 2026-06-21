const test = require("node:test");
const assert = require("node:assert/strict");
const { gridPoints } = require("./draw-axis-p5js.js");

test("step que divide exacto incluye el borde", () => {
    assert.deepEqual(gridPoints(200, 0, 100), [
        [0, 0],
        [100, 0],
        [200, 0],
    ]);
});

test("step que no divide se detiene antes de pasarse del borde", () => {
    assert.deepEqual(gridPoints(250, 0, 100), [
        [0, 0],
        [100, 0],
        [200, 0],
    ]);
});

test("genera puntos sobre ambos ejes", () => {
    assert.deepEqual(gridPoints(100, 100, 100), [
        [0, 0],
        [100, 0],
        [0, 100],
    ]);
});

test("dimensiones 0 solo deja el origen", () => {
    assert.deepEqual(gridPoints(0, 0, 100), [[0, 0]]);
});

test("eje Y arranca en step, nunca duplica el origen", () => {
    const points = gridPoints(0, 300, 100);
    assert.deepEqual(points, [
        [0, 0],
        [0, 100],
        [0, 200],
        [0, 300],
    ]);
});
