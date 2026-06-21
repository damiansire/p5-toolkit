const test = require('node:test');
const assert = require('node:assert/strict');
const { fakeP5 } = require('../../test/fake-p5.js');
const {
    rotatePoint,
    sliceAngles,
    symmetryPoints,
    replicateMotif,
    drawMandala,
} = require('./mandala-p5js.js');

// Helper: compara puntos con tolerancia (rotaciones traen floats sucios).
function closePoint(a, b, eps = 1e-9) {
    return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
}

test('rotatePoint 90 grados mapea (1,0) -> (0,1)', () => {
    const r = rotatePoint(1, 0, Math.PI / 2);
    assert.ok(closePoint(r, { x: 0, y: 1 }));
});

test('rotatePoint 180 grados invierte el punto', () => {
    const r = rotatePoint(2, 3, Math.PI);
    assert.ok(closePoint(r, { x: -2, y: -3 }));
});

test('symmetryPoints genera una copia por slice', () => {
    const pts = symmetryPoints(10, 0, 4);
    assert.equal(pts.length, 4);
    // 4 slices de (10,0): derecha, arriba, izquierda, abajo.
    assert.ok(closePoint(pts[0], { x: 10, y: 0 }));
    assert.ok(closePoint(pts[1], { x: 0, y: 10 }));
    assert.ok(closePoint(pts[2], { x: -10, y: 0 }));
    assert.ok(closePoint(pts[3], { x: 0, y: -10 }));
});

test('mirror duplica la cantidad de puntos por slice', () => {
    const plain = symmetryPoints(10, 5, 6);
    const mirrored = symmetryPoints(10, 5, 6, true);
    assert.equal(plain.length, 6);
    assert.equal(mirrored.length, 12);
});

test('mirror refleja sobre el eje x en la primera slice', () => {
    // Slice 0 (sin rotación): el gemelo de (10, 5) es (10, -5).
    const pts = symmetryPoints(10, 5, 4, true);
    assert.ok(closePoint(pts[0], { x: 10, y: 5 }));
    assert.ok(closePoint(pts[1], { x: 10, y: -5 }));
});

test('symmetryPoints rechaza slices inválidos', () => {
    assert.throws(() => symmetryPoints(1, 1, 0), RangeError);
    assert.throws(() => symmetryPoints(1, 1, -3), RangeError);
    assert.throws(() => symmetryPoints(1, 1, 2.5), RangeError);
});

test('replicateMotif replica cada punto del motivo en todas las slices', () => {
    const motif = [
        [10, 0],
        [20, 0],
    ];
    const out = replicateMotif(motif, 4);
    // 2 puntos x 4 slices = 8 copias.
    assert.equal(out.length, 8);
    // Cada elemento es un par [x, y].
    assert.equal(out[0].length, 2);
});

test('sliceAngles es la fuente de verdad del paso angular y el mirror', () => {
    const plain = sliceAngles(4);
    assert.deepEqual(
        plain.map((s) => s.angle),
        [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
    );
    assert.ok(plain.every((s) => s.mirror === false));
    // Con mirror, cada fold gana un gemelo reflejado.
    const mirrored = sliceAngles(4, true);
    assert.equal(mirrored.length, 8);
    assert.deepEqual(
        mirrored.map((s) => s.mirror),
        [false, true, false, true, false, true, false, true],
    );
});

test('sliceAngles rechaza slices inválidos (validación única)', () => {
    assert.throws(() => sliceAngles(0), RangeError);
    assert.throws(() => sliceAngles(-3), RangeError);
    assert.throws(() => sliceAngles(2.5), RangeError);
});

test('drawMandala usa el mismo paso/mirror que symmetryPoints', () => {
    // El render rota a los mismos ángulos que produce la capa pura, y el gemelo
    // mirror (scale(1,-1)) coincide con la reflexión y -> -y de symmetryPoints.
    const p = fakeP5();
    const rotations = [];
    let scaledTwins = 0;
    p.rotate = (a) => {
        rotations.push(a);
        p.calls.push(['rotate', a]);
    };
    p.scale = (sx, sy) => {
        if (sx === 1 && sy === -1) scaledTwins++;
        p.calls.push(['scale', sx, sy]);
    };
    drawMandala(p, () => {}, { slices: 6, mirror: true });
    assert.ok(p.balanced(), 'push/pop deben balancear');
    // Ángulos de rotación esperados de la capa pura (un par por fold con mirror).
    const expected = sliceAngles(6, true).map((s) => s.angle);
    assert.deepEqual(rotations, expected);
    // Un gemelo reflejado por fold.
    assert.equal(scaledTwins, 6);
});

test('drawMandala pasa un sliceIndex consecutivo por fold (no por gemelo)', () => {
    const p = fakeP5();
    const seen = [];
    drawMandala(p, (_p, i) => seen.push(i), { slices: 4, mirror: true });
    // 4 folds, cada uno dibuja base + gemelo con el MISMO índice.
    assert.deepEqual(seen, [0, 0, 1, 1, 2, 2, 3, 3]);
});
