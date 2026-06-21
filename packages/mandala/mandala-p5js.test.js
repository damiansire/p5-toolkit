const test = require("node:test");
const assert = require("node:assert/strict");
const {
    rotatePoint,
    symmetryPoints,
    replicateMotif,
} = require("./mandala-p5js.js");

// Helper: compara puntos con tolerancia (rotaciones traen floats sucios).
function closePoint(a, b, eps = 1e-9) {
    return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
}

test("rotatePoint 90 grados mapea (1,0) -> (0,1)", () => {
    const r = rotatePoint(1, 0, Math.PI / 2);
    assert.ok(closePoint(r, { x: 0, y: 1 }));
});

test("rotatePoint 180 grados invierte el punto", () => {
    const r = rotatePoint(2, 3, Math.PI);
    assert.ok(closePoint(r, { x: -2, y: -3 }));
});

test("symmetryPoints genera una copia por slice", () => {
    const pts = symmetryPoints(10, 0, 4);
    assert.equal(pts.length, 4);
    // 4 slices de (10,0): derecha, arriba, izquierda, abajo.
    assert.ok(closePoint(pts[0], { x: 10, y: 0 }));
    assert.ok(closePoint(pts[1], { x: 0, y: 10 }));
    assert.ok(closePoint(pts[2], { x: -10, y: 0 }));
    assert.ok(closePoint(pts[3], { x: 0, y: -10 }));
});

test("mirror duplica la cantidad de puntos por slice", () => {
    const plain = symmetryPoints(10, 5, 6);
    const mirrored = symmetryPoints(10, 5, 6, true);
    assert.equal(plain.length, 6);
    assert.equal(mirrored.length, 12);
});

test("mirror refleja sobre el eje x en la primera slice", () => {
    // Slice 0 (sin rotación): el gemelo de (10, 5) es (10, -5).
    const pts = symmetryPoints(10, 5, 4, true);
    assert.ok(closePoint(pts[0], { x: 10, y: 5 }));
    assert.ok(closePoint(pts[1], { x: 10, y: -5 }));
});

test("symmetryPoints rechaza slices inválidos", () => {
    assert.throws(() => symmetryPoints(1, 1, 0), RangeError);
    assert.throws(() => symmetryPoints(1, 1, -3), RangeError);
    assert.throws(() => symmetryPoints(1, 1, 2.5), RangeError);
});

test("replicateMotif replica cada punto del motivo en todas las slices", () => {
    const motif = [[10, 0], [20, 0]];
    const out = replicateMotif(motif, 4);
    // 2 puntos x 4 slices = 8 copias.
    assert.equal(out.length, 8);
    // Cada elemento es un par [x, y].
    assert.equal(out[0].length, 2);
});
