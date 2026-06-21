const test = require("node:test");
const assert = require("node:assert/strict");
const { fakeP5 } = require("../../test/fake-p5.js");
const {
    createBoid,
    computeSteering,
    flock,
    drawBoids,
} = require("./boids-p5js.js");

test("createBoid arma pos, vel y acc", () => {
    const b = createBoid(10, 20, 1, -1);
    assert.deepEqual(b.pos, { x: 10, y: 20 });
    assert.deepEqual(b.vel, { x: 1, y: -1 });
    assert.deepEqual(b.acc, { x: 0, y: 0 });
});

test("un boid solo no recibe fuerza de dirección", () => {
    const b = createBoid(0, 0, 1, 0);
    const steer = computeSteering(b, [b]);
    assert.deepEqual(steer, { x: 0, y: 0 });
});

test("separación empuja lejos de un vecino muy cercano", () => {
    const a = createBoid(0, 0, 0, 0);
    const b = createBoid(5, 0, 0, 0); // dentro de separationDist
    const steer = computeSteering(a, [a, b], {
        alignmentWeight: 0,
        cohesionWeight: 0,
    });
    // El vecino está a la derecha -> la separación debe empujar a la izquierda.
    assert.ok(steer.x < 0);
});

test("cohesión atrae hacia el centro del grupo", () => {
    const a = createBoid(0, 0, 0, 0);
    const b = createBoid(40, 0, 0, 0); // dentro de perception, fuera de separación
    const steer = computeSteering(a, [a, b], {
        separationWeight: 0,
        alignmentWeight: 0,
    });
    // El grupo está a la derecha -> cohesión empuja a la derecha.
    assert.ok(steer.x > 0);
});

test("alineación apunta hacia la velocidad promedio de los vecinos", () => {
    const a = createBoid(0, 0, 0, 0);
    const b = createBoid(40, 0, 0, 3); // se mueve hacia +Y
    const steer = computeSteering(a, [a, b], {
        separationWeight: 0,
        cohesionWeight: 0,
    });
    // El vecino va hacia +Y y 'a' está quieto -> debe ganar componente +Y.
    assert.ok(steer.y > 0);
});

test("la fuerza de dirección está acotada por maxForce", () => {
    const a = createBoid(0, 0, 0, 0);
    const b = createBoid(40, 0, 0, 0);
    const maxForce = 0.1;
    const steer = computeSteering(a, [a, b], {
        separationWeight: 0,
        alignmentWeight: 0,
        maxForce,
    });
    const mag = Math.hypot(steer.x, steer.y);
    // Una sola regla activa -> su fuerza no puede pasar maxForce (con holgura).
    assert.ok(mag <= maxForce + 1e-9);
});

test("flock no muta la bandada de entrada y envuelve los bordes", () => {
    // vel -5 supera maxSpeed (4) -> se acota a -4 antes de integrar.
    const boids = [createBoid(0, 0, -5, 0)];
    const snapshot = JSON.parse(JSON.stringify(boids));
    const next = flock(boids, { width: 100, height: 100, maxSpeed: 4 });
    assert.deepEqual(boids, snapshot);
    // x = 0 - 4 = -4 envuelve a 96.
    assert.ok(Math.abs(next[0].pos.x - 96) < 1e-9);
});

test("flock acota la velocidad a maxSpeed", () => {
    const boids = [createBoid(50, 50, 100, 0)];
    const next = flock(boids, { maxSpeed: 4, width: 1000, height: 1000 });
    const speed = Math.hypot(next[0].vel.x, next[0].vel.y);
    assert.ok(speed <= 4 + 1e-9);
});

test("drawBoids balancea push/pop y no fuga estilo global", () => {
    const p = fakeP5();
    drawBoids(p, [createBoid(10, 10, 1, 0), createBoid(20, 20, 0, 1)], 6);
    assert.ok(p.balanced(), "push/pop deben quedar balanceados");
    assert.deepEqual(p.styleOutsidePush, []);
    // Un triángulo por boid.
    assert.equal(p.count("triangle"), 2);
});

test("la grilla espacial da el mismo resultado que el barrido O(n²)", () => {
    // Bandada densa repartida por el canvas: si la partición espacial perdiera
    // un vecino legítimo, el resultado divergiría del barrido completo.
    const opts = { width: 200, height: 200, perception: 50, separationDist: 25 };
    const boids = [];
    let seed = 1;
    const rng = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
    for (let i = 0; i < 60; i++) {
        boids.push(createBoid(rng() * 200, rng() * 200, rng() * 4 - 2, rng() * 4 - 2));
    }
    // Resultado con la grilla (flock) vs. el barrido completo boid por boid.
    const viaGrid = flock(boids, opts);
    const viaFull = boids.map((b) => {
        const force = computeSteering(b, boids, opts); // neighbours = todos
        const vel = (() => {
            const v = { x: b.vel.x + force.x, y: b.vel.y + force.y };
            const m = Math.hypot(v.x, v.y);
            return m > 4 ? { x: (v.x / m) * 4, y: (v.y / m) * 4 } : v;
        })();
        let x = b.pos.x + vel.x;
        let y = b.pos.y + vel.y;
        x = ((x % 200) + 200) % 200;
        y = ((y % 200) + 200) % 200;
        return { x, y, vx: vel.x, vy: vel.y };
    });
    for (let i = 0; i < boids.length; i++) {
        assert.ok(Math.abs(viaGrid[i].pos.x - viaFull[i].x) < 1e-9, `pos.x boid ${i}`);
        assert.ok(Math.abs(viaGrid[i].pos.y - viaFull[i].y) < 1e-9, `pos.y boid ${i}`);
        assert.ok(Math.abs(viaGrid[i].vel.x - viaFull[i].vx) < 1e-9, `vel.x boid ${i}`);
        assert.ok(Math.abs(viaGrid[i].vel.y - viaFull[i].vy) < 1e-9, `vel.y boid ${i}`);
    }
});
