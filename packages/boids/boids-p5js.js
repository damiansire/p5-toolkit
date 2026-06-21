// Boids: Craig Reynolds' flocking model. Each agent steers by three local rules
// — separation (avoid crowding), alignment (match heading) and cohesion (steer
// toward the group's centre) — and emergent flocking falls out for free.
//
// The vector math and the per-boid steering are pure and decoupled from p5, so
// the simulation can be tested without a canvas. p5 only appears in `drawBoids`,
// which takes the instance as its first argument.

// Minimal 2D vector helpers. Kept local (no p5.Vector) so the logic is pure.
function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}
function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
}
function scale(v, s) {
    return { x: v.x * s, y: v.y * s };
}
function mag(v) {
    return Math.hypot(v.x, v.y);
}
// Returns `v` resized to length `len` (a no-op direction-keeper). A zero vector
// has no direction, so it stays zero instead of producing NaN.
function setMag(v, len) {
    const m = mag(v);
    return m === 0 ? { x: 0, y: 0 } : scale(v, len / m);
}
// Caps a vector's length at `max` without changing its direction.
function limit(v, max) {
    return mag(v) > max ? setMag(v, max) : v;
}
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// Creates a boid at `(x, y)` with an initial velocity. Velocity defaults to zero
// so a deterministic test can set it explicitly.
function createBoid(x, y, vx = 0, vy = 0) {
    return { pos: { x, y }, vel: { x: vx, y: vy }, acc: { x: 0, y: 0 } };
}

// Computes the steering acceleration for one boid given its neighbours. Each
// rule only considers boids within its radius, which is what keeps flocking
// local. Returns the combined acceleration vector — the caller integrates it.
function computeSteering(boid, boids, opts = {}) {
    const {
        perception = 50,
        separationDist = 25,
        maxSpeed = 4,
        maxForce = 0.2,
        separationWeight = 1.5,
        alignmentWeight = 1.0,
        cohesionWeight = 1.0,
    } = opts;

    let sepSum = { x: 0, y: 0 };
    let aliSum = { x: 0, y: 0 };
    let cohSum = { x: 0, y: 0 };
    let sepCount = 0;
    let aliCount = 0;
    let cohCount = 0;

    for (const other of boids) {
        if (other === boid) continue;
        const d = dist(boid.pos, other.pos);
        if (d > 0 && d < separationDist) {
            // Push away, weighted by closeness (closer => stronger).
            const away = scale(setMag(sub(boid.pos, other.pos), 1), 1 / d);
            sepSum = add(sepSum, away);
            sepCount++;
        }
        if (d > 0 && d < perception) {
            aliSum = add(aliSum, other.vel);
            aliCount++;
            cohSum = add(cohSum, other.pos);
            cohCount++;
        }
    }

    let steer = { x: 0, y: 0 };

    if (sepCount > 0) {
        // Desired = average away-vector at max speed; steer = desired - vel.
        const desired = setMag(scale(sepSum, 1 / sepCount), maxSpeed);
        const force = limit(sub(desired, boid.vel), maxForce);
        steer = add(steer, scale(force, separationWeight));
    }
    if (aliCount > 0) {
        const desired = setMag(scale(aliSum, 1 / aliCount), maxSpeed);
        const force = limit(sub(desired, boid.vel), maxForce);
        steer = add(steer, scale(force, alignmentWeight));
    }
    if (cohCount > 0) {
        const center = scale(cohSum, 1 / cohCount);
        const desired = setMag(sub(center, boid.pos), maxSpeed);
        const force = limit(sub(desired, boid.vel), maxForce);
        steer = add(steer, scale(force, cohesionWeight));
    }

    return steer;
}

// Advances the whole flock one tick: compute every steering force from the same
// snapshot, then integrate position/velocity and wrap around the canvas edges.
// Returns a fresh array of boids (the input flock is not mutated).
function flock(boids, opts = {}) {
    const { maxSpeed = 4, width = 800, height = 600 } = opts;
    const forces = boids.map((b) => computeSteering(b, boids, opts));
    return boids.map((b, i) => {
        const vel = limit(add(b.vel, forces[i]), maxSpeed);
        let x = b.pos.x + vel.x;
        let y = b.pos.y + vel.y;
        x = ((x % width) + width) % width;
        y = ((y % height) + height) % height;
        return { pos: { x, y }, vel, acc: { x: 0, y: 0 } };
    });
}

// Draws each boid as a little triangle pointing along its velocity.
function drawBoids(p, boids, size = 6) {
    p.push();
    for (const b of boids) {
        const heading = Math.atan2(b.vel.y, b.vel.x);
        p.push();
        p.translate(b.pos.x, b.pos.y);
        p.rotate(heading);
        p.triangle(size, 0, -size, size * 0.6, -size, -size * 0.6);
        p.pop();
    }
    p.pop();
}

module.exports = {
    createBoid,
    computeSteering,
    flock,
    drawBoids,
};
