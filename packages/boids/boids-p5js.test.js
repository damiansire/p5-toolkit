const test = require("node:test");
const assert = require("node:assert/strict");
const {
    createBoid,
    computeSteering,
    flock,
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
