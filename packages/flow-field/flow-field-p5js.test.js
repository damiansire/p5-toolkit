const test = require('node:test');
const assert = require('node:assert/strict');
const { fakeP5 } = require('../../test/fake-p5.js');
const {
    noiseToAngle,
    flowFieldAngles,
    angleAt,
    stepParticle,
    buildFlowField,
    drawFlowField,
} = require('./flow-field-p5js.js');

test('noiseToAngle mapea [0,1] a una vuelta completa', () => {
    assert.equal(noiseToAngle(0), 0);
    assert.equal(noiseToAngle(1), Math.PI * 2);
    assert.equal(noiseToAngle(0.5), Math.PI);
});

test('turns escala cuántas vueltas da el campo', () => {
    assert.equal(noiseToAngle(1, 3), 3 * Math.PI * 2);
});

test('flowFieldAngles arma una grilla cols×rows', () => {
    const angles = flowFieldAngles(3, 2, () => 0.5);
    assert.equal(angles.length, 2);
    assert.equal(angles[0].length, 3);
    assert.equal(angles[0][0], Math.PI);
});

test('flowFieldAngles muestrea noiseFn en coordenadas escaladas', () => {
    const seen = [];
    flowFieldAngles(
        2,
        1,
        (nx, ny) => {
            seen.push([nx, ny]);
            return 0;
        },
        { noiseScale: 0.5 },
    );
    assert.deepEqual(seen, [
        [0, 0],
        [0.5, 0],
    ]);
});

test('flowFieldAngles rechaza dimensiones degeneradas', () => {
    assert.throws(() => flowFieldAngles(0, 5, () => 0), RangeError);
    assert.throws(() => flowFieldAngles(5, -1, () => 0), RangeError);
});

test('angleAt clampea coordenadas fuera de la grilla al borde', () => {
    const angles = [
        [0, 1],
        [2, 3],
    ];
    // (px, py) muy negativo cae en la celda (0,0); muy grande, en la última.
    assert.equal(angleAt(angles, -50, -50, 10), 0);
    assert.equal(angleAt(angles, 9999, 9999, 10), 3);
});

test('stepParticle avanza según el ángulo de la celda', () => {
    // Campo de ángulo 0 en todas las celdas -> se mueve sobre +X.
    const angles = [[0]];
    const next = stepParticle({ x: 5, y: 5 }, angles, {
        resolution: 100,
        width: 100,
        height: 100,
        speed: 2,
    });
    assert.ok(Math.abs(next.x - 7) < 1e-9);
    assert.ok(Math.abs(next.y - 5) < 1e-9);
});

test('stepParticle envuelve la partícula en los bordes (toro)', () => {
    const angles = [[Math.PI]]; // ángulo PI -> se mueve sobre -X.
    const next = stepParticle({ x: 0, y: 0 }, angles, {
        resolution: 100,
        width: 100,
        height: 100,
        speed: 5,
    });
    // 0 - 5 = -5 envuelve a 95.
    assert.ok(Math.abs(next.x - 95) < 1e-9);
});

test('buildFlowField devuelve un field con su resolution y la grilla', () => {
    const p = fakeP5({ width: 100, height: 60 });
    p.noise = () => 0.25; // ángulo determinista
    const field = buildFlowField(p, 20);
    assert.equal(field.resolution, 20);
    assert.equal(field.width, 100);
    assert.equal(field.height, 60);
    assert.equal(field.angles.length, 3); // 60/20
    assert.equal(field.angles[0].length, 5); // 100/20
});

test('buildFlowField con resolution > width clampa a una grilla 1x1 sin lanzar', () => {
    const p = fakeP5({ width: 10, height: 10 });
    p.noise = () => 0.5;
    let field;
    assert.doesNotThrow(() => {
        field = buildFlowField(p, 100); // resolution > width/height
    });
    assert.equal(field.angles.length, 1);
    assert.equal(field.angles[0].length, 1);
});

test('stepParticle toma resolution/width/height del field sin repetirlos', () => {
    const p = fakeP5({ width: 100, height: 100 });
    p.noise = () => 0; // ángulo 0 -> se mueve sobre +X
    const field = buildFlowField(p, 50);
    const next = stepParticle({ x: 10, y: 10 }, field, { speed: 3 });
    assert.ok(Math.abs(next.x - 13) < 1e-9);
    assert.ok(Math.abs(next.y - 10) < 1e-9);
});

test('drawFlowField balancea push/pop y acepta el field object', () => {
    const p = fakeP5({ width: 40, height: 40 });
    p.noise = () => 0.5;
    const field = buildFlowField(p, 20);
    drawFlowField(p, field);
    assert.ok(p.balanced());
    // 2x2 celdas -> 4 segmentos.
    assert.equal(p.count('line'), 4);
});
