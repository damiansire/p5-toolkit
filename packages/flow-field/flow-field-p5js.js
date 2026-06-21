// Perlin-noise flow field + particle advection for generative art.
//
// The math (angle grid + how a particle steps through it + how it wraps the
// canvas) is pure and decoupled from p5, so it can be tested without a canvas.
// p5 only shows up in the drawing helpers, which always take the instance as
// their first argument (instance mode and global mode both work).

// Maps a noise value in [0, 1] to a flow angle. The noise is multiplied so the
// field can complete several full turns across the unit interval, which is what
// gives flow fields their swirly look.
function noiseToAngle(noiseValue, turns = 1) {
    return noiseValue * turns * Math.PI * 2;
}

// Builds the angle grid for a `cols × rows` field by sampling `noiseFn` at each
// cell. `noiseFn(nx, ny)` must return a value in [0, 1] (p5's `p.noise` does);
// keeping it as a parameter lets the tests inject a deterministic stand-in.
function flowFieldAngles(cols, rows, noiseFn, opts = {}) {
    // cols/rows <= 0 would produce an empty field and silently draw nothing,
    // which hides bugs in the caller. Reject the degenerate input instead.
    if (!(cols > 0) || !(rows > 0)) {
        throw new RangeError(`cols and rows must be > 0, received ${cols}×${rows}`);
    }
    const { noiseScale = 0.1, turns = 1 } = opts;
    const angles = [];
    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
            row.push(noiseToAngle(noiseFn(x * noiseScale, y * noiseScale), turns));
        }
        angles.push(row);
    }
    return angles;
}

// A flow field bundles the angle grid with the `resolution` it was baked at, so
// the producer (`buildFlowField`) and the consumers (`angleAt`/`stepParticle`/
// `drawFlowField`) can't silently disagree about the cell size. `angleAt` and
// friends accept either a field object or a bare `number[][]` for backward
// compatibility; this normalises both shapes.
function asField(fieldOrAngles, resolution) {
    if (Array.isArray(fieldOrAngles)) {
        return { angles: fieldOrAngles, resolution };
    }
    // A field object carries its own resolution — ignore the loose argument.
    return fieldOrAngles;
}

// Canonical toroidal wrap: folds a coordinate back into [0, size). `size <= 0`
// has no torus to wrap onto and `% 0` is NaN, so the value is returned
// untouched. (This idiom is duplicated verbatim in boids-p5js.js — the packages
// stay independent on purpose, so each keeps its own copy.)
function wrap(v, size) {
    if (!(size > 0)) return v;
    return ((v % size) + size) % size;
}

// Reads the flow angle at the cell that contains pixel `(px, py)`. The lookup
// floors to the cell and clamps to the edges so a particle that drifts a hair
// past the border still gets a valid angle instead of `undefined`. `field` may
// be a field object (`{ angles, resolution }`) or a bare angle grid plus a
// loose `resolution`.
function angleAt(field, px, py, resolution) {
    const { angles, resolution: res } = asField(field, resolution);
    const rows = angles.length;
    const cols = rows > 0 ? angles[0].length : 0;
    const col = Math.min(cols - 1, Math.max(0, Math.floor(px / res)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(py / res)));
    return angles[row][col];
}

// Advances one particle a single step along the field and wraps it around the
// canvas edges (a torus), so a particle never escapes and the trails fill the
// frame. Returns a fresh particle; the caller keeps the trail history. `field`
// may be a field object (carrying its own resolution/width/height) or a bare
// angle grid, in which case the geometry comes from `opts`.
function stepParticle(particle, field, opts = {}) {
    const f = asField(field, opts.resolution);
    const resolution = f.resolution ?? opts.resolution;
    const width = f.width ?? opts.width;
    const height = f.height ?? opts.height;
    const { speed = 1 } = opts;
    const angle = angleAt(f.angles, particle.x, particle.y, resolution);
    const x = wrap(particle.x + Math.cos(angle) * speed, width);
    const y = wrap(particle.y + Math.sin(angle) * speed, height);
    return { x, y };
}

// Drives the field with p5's own noise so the look matches the rest of a
// sketch. Builds the angle grid sized to the canvas and the requested cell
// `resolution`, and returns a field object `{ angles, resolution, width,
// height }` so downstream calls never need the caller to repeat `resolution`.
function buildFlowField(p, resolution = 20, opts = {}) {
    const cols = Math.max(1, Math.floor(p.width / resolution));
    const rows = Math.max(1, Math.floor(p.height / resolution));
    const angles = flowFieldAngles(cols, rows, (nx, ny) => p.noise(nx, ny), opts);
    return { angles, resolution, width: p.width, height: p.height };
}

// Draws the field as a grid of short line segments — handy while tuning
// `noiseScale`/`turns` before committing to particles. `field` may be a field
// object or a bare angle grid plus a loose `resolution`.
function drawFlowField(p, field, resolution = 20, length = null) {
    const { angles, resolution: res } = asField(field, resolution);
    const len = length == null ? res * 0.8 : length;
    p.push();
    for (let row = 0; row < angles.length; row++) {
        for (let col = 0; col < angles[row].length; col++) {
            const a = angles[row][col];
            const x = col * res + res / 2;
            const y = row * res + res / 2;
            p.line(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
        }
    }
    p.pop();
}

module.exports = {
    noiseToAngle,
    flowFieldAngles,
    angleAt,
    stepParticle,
    buildFlowField,
    drawFlowField,
};
