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
// Canonical toroidal wrap: folds `v` back into [0, size). `size <= 0` has no
// torus to wrap onto and `% 0` is NaN, so the value is returned untouched.
// (This idiom is duplicated verbatim in flow-field-p5js.js — the packages stay
// independent on purpose, so each keeps its own copy.)
function wrap(v, size) {
    if (!(size > 0)) return v;
    return ((v % size) + size) % size;
}
// Creates a boid at `(x, y)` with an initial velocity. Velocity defaults to zero
// so a deterministic test can set it explicitly.
function createBoid(x, y, vx = 0, vy = 0) {
    return { pos: { x, y }, vel: { x: vx, y: vy }, acc: { x: 0, y: 0 } };
}

// Computes the steering acceleration for one boid given its neighbours. Each
// rule only considers boids within its radius, which is what keeps flocking
// local. Returns the combined acceleration vector — the caller integrates it.
//
// `neighbours` defaults to the whole flock (the simple O(n) scan), but `flock`
// passes only the boids in the nearby grid cells so the per-tick cost stays
// roughly linear instead of O(n²). The accumulators are mutated in place to
// avoid allocating tens of thousands of throwaway vectors per frame.
function computeSteering(boid, boids, opts = {}, neighbours = boids) {
    const {
        perception = 50,
        separationDist = 25,
        maxSpeed = 4,
        maxForce = 0.2,
        separationWeight = 1.5,
        alignmentWeight = 1.0,
        cohesionWeight = 1.0,
    } = opts;

    let sepX = 0;
    let sepY = 0;
    let aliX = 0;
    let aliY = 0;
    let cohX = 0;
    let cohY = 0;
    let sepCount = 0;
    let aliCount = 0;
    let cohCount = 0;

    for (const other of neighbours) {
        if (other === boid) continue;
        const dx = boid.pos.x - other.pos.x;
        const dy = boid.pos.y - other.pos.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < separationDist) {
            // Push away, weighted by closeness (closer => stronger): a unit
            // away-vector scaled by 1/d, all on scalars (no temp objects).
            const inv = 1 / (d * d);
            sepX += dx * inv;
            sepY += dy * inv;
            sepCount++;
        }
        if (d > 0 && d < perception) {
            aliX += other.vel.x;
            aliY += other.vel.y;
            aliCount++;
            cohX += other.pos.x;
            cohY += other.pos.y;
            cohCount++;
        }
    }

    const sepSum = { x: sepX, y: sepY };
    const aliSum = { x: aliX, y: aliY };
    const cohSum = { x: cohX, y: cohY };

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

// Builds a uniform spatial-hash grid over the flock so each boid only has to
// look at the boids in its own cell and the 8 surrounding ones, instead of the
// whole flock. The cell size is the largest neighbourhood radius any rule uses,
// so every boid that can influence another always lands in an adjacent cell.
function buildSpatialGrid(boids, cellSize) {
    const grid = new Map();
    const key = (cx, cy) => cx + "," + cy;
    for (const b of boids) {
        const cx = Math.floor(b.pos.x / cellSize);
        const cy = Math.floor(b.pos.y / cellSize);
        const k = key(cx, cy);
        let cell = grid.get(k);
        if (cell === undefined) {
            cell = [];
            grid.set(k, cell);
        }
        cell.push(b);
    }
    return { grid, cellSize, key };
}

// Returns the boids in the 3×3 block of cells around `boid` — its candidate
// neighbours for steering. Always includes the boid's own cell.
function neighboursOf(boid, { grid, cellSize, key }) {
    const cx = Math.floor(boid.pos.x / cellSize);
    const cy = Math.floor(boid.pos.y / cellSize);
    const out = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const cell = grid.get(key(cx + dx, cy + dy));
            if (cell !== undefined) {
                for (const other of cell) out.push(other);
            }
        }
    }
    return out;
}

// Advances the whole flock one tick: compute every steering force from the same
// snapshot, then integrate position/velocity and wrap around the canvas edges.
// Returns a fresh array of boids (the input flock is not mutated). Uses a
// spatial-hash grid so the per-tick cost is ~O(n) instead of O(n²).
function flock(boids, opts = {}) {
    const {
        maxSpeed = 4,
        width = 800,
        height = 600,
        perception = 50,
        separationDist = 25,
    } = opts;
    // Cell = the largest radius any rule reads, so neighbours never fall outside
    // the 3×3 block we query. Guard against a non-positive size.
    const cellSize = Math.max(1, perception, separationDist);
    const spatial = buildSpatialGrid(boids, cellSize);
    const forces = boids.map((b) => computeSteering(b, boids, opts, neighboursOf(b, spatial)));
    return boids.map((b, i) => {
        const vel = limit(add(b.vel, forces[i]), maxSpeed);
        const x = wrap(b.pos.x + vel.x, width);
        const y = wrap(b.pos.y + vel.y, height);
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
