import test from 'node:test';
import assert from 'node:assert/strict';
import { gridPoints, drawAxis, type P5Like } from './draw-axis-p5js.js';

// Minimal fake p5: records the calls a draw helper makes so we can assert
// push/pop balance and that no global style leaks outside a push/pop pair.
type RecordedCall = [name: string, ...args: unknown[]];

interface FakeP5 extends P5Like {
    readonly calls: RecordedCall[];
    readonly styleOutsidePush: string[];
    readonly minDepth: number;
    readonly depth: number;
}

function fakeP5({ width = 200, height = 100 } = {}): FakeP5 {
    const calls: RecordedCall[] = [];
    let depth = 0;
    let minDepth = 0;
    const styleOutsidePush: string[] = [];
    const rec =
        (name: string) =>
        (...args: unknown[]) => {
            if (name === 'push') depth++;
            else if (name === 'pop') {
                depth--;
                if (depth < minDepth) minDepth = depth;
            } else if (
                /^(stroke|fill|strokeWeight|noStroke|noFill|textSize)$/.test(name) &&
                depth === 0
            ) {
                styleOutsidePush.push(name);
            }
            calls.push([name, ...args]);
        };

    const methodNames = [
        'push',
        'pop',
        'line',
        'point',
        'text',
        'fill',
        'strokeWeight',
        'noStroke',
        'textSize',
    ] as const;
    const methods = Object.fromEntries(methodNames.map((m) => [m, rec(m)])) as Pick<
        FakeP5,
        (typeof methodNames)[number]
    >;

    return {
        width,
        height,
        calls,
        get styleOutsidePush() {
            return styleOutsidePush;
        },
        get minDepth() {
            return minDepth;
        },
        get depth() {
            return depth;
        },
        ...methods,
    };
}

test('step que divide exacto incluye el borde', () => {
    assert.deepEqual(gridPoints(200, 0, 100), [
        [0, 0],
        [100, 0],
        [200, 0],
    ]);
});

test('step que no divide se detiene antes de pasarse del borde', () => {
    assert.deepEqual(gridPoints(250, 0, 100), [
        [0, 0],
        [100, 0],
        [200, 0],
    ]);
});

test('genera puntos sobre ambos ejes', () => {
    assert.deepEqual(gridPoints(100, 100, 100), [
        [0, 0],
        [100, 0],
        [0, 100],
    ]);
});

test('dimensiones 0 solo deja el origen', () => {
    assert.deepEqual(gridPoints(0, 0, 100), [[0, 0]]);
});

test('eje Y arranca en step, nunca duplica el origen', () => {
    const points = gridPoints(0, 300, 100);
    assert.deepEqual(points, [
        [0, 0],
        [0, 100],
        [0, 200],
        [0, 300],
    ]);
});

test('drawAxis balancea push/pop y no fuga estilo al estado global', () => {
    const p = fakeP5({ width: 200, height: 200 });
    drawAxis(p, 100);
    const pushes = p.calls.filter((c) => c[0] === 'push').length;
    const pops = p.calls.filter((c) => c[0] === 'pop').length;
    assert.equal(pushes, pops, 'push y pop deben quedar balanceados');
    assert.equal(p.depth, 0, 'el estado debe volver a profundidad 0');
    assert.equal(p.minDepth, 0, 'nunca debe hacer pop de más');
    // El bug original: strokeWeight(1) se aplicaba fuera de cualquier push/pop.
    assert.deepEqual(p.styleOutsidePush, [], 'ningún estilo debe mutarse fuera de push/pop');
});

test('drawAxis dibuja los dos ejes desde el origen', () => {
    const p = fakeP5({ width: 200, height: 200 });
    drawAxis(p, 100);
    const lines = p.calls.filter((c) => c[0] === 'line');
    assert.ok(lines.some((l) => l[1] === 0 && l[2] === 0 && l[3] === 200 && l[4] === 0));
    assert.ok(lines.some((l) => l[1] === 0 && l[2] === 0 && l[3] === 0 && l[4] === 200));
});
