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
        throw new RangeError(`cols y rows deben ser > 0, se recibió ${cols}×${rows}`);
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

// Reads the flow angle at the cell that contains pixel `(px, py)`. The lookup
// floors to the cell and clamps to the edges so a particle that drifts a hair
// past the border still gets a valid angle instead of `undefined`.
function angleAt(angles, px, py, resolution) {
    const rows = angles.length;
    const cols = rows > 0 ? angles[0].length : 0;
    const col = Math.min(cols - 1, Math.max(0, Math.floor(px / resolution)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(py / resolution)));
    return angles[row][col];
}

// Advances one particle a single step along the field and wraps it around the
// canvas edges (a torus), so a particle never escapes and the trails fill the
// frame. Returns a fresh particle; the caller keeps the trail history.
function stepParticle(particle, angles, opts) {
    const { resolution, width, height, speed = 1 } = opts;
    const angle = angleAt(angles, particle.x, particle.y, resolution);
    let x = particle.x + Math.cos(angle) * speed;
    let y = particle.y + Math.sin(angle) * speed;
    // Wrap with a double-mod so negative coordinates land back in [0, size).
    x = ((x % width) + width) % width;
    y = ((y % height) + height) % height;
    return { x, y };
}

// Drives the field with p5's own noise so the look matches the rest of a
// sketch. Builds the angle grid sized to the canvas and the requested cell
// `resolution`.
function buildFlowField(p, resolution = 20, opts = {}) {
    const cols = Math.max(1, Math.floor(p.width / resolution));
    const rows = Math.max(1, Math.floor(p.height / resolution));
    return flowFieldAngles(cols, rows, (nx, ny) => p.noise(nx, ny), opts);
}

// Draws the field as a grid of short line segments — handy while tuning
// `noiseScale`/`turns` before committing to particles.
function drawFlowField(p, angles, resolution = 20, length = null) {
    const len = length == null ? resolution * 0.8 : length;
    p.push();
    for (let row = 0; row < angles.length; row++) {
        for (let col = 0; col < angles[row].length; col++) {
            const a = angles[row][col];
            const x = col * resolution + resolution / 2;
            const y = row * resolution + resolution / 2;
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
