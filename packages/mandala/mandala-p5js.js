// Radial symmetry: take a single "wedge" of shapes and replicate it around a
// centre to make mandalas, kaleidoscopes and rosette patterns. Optionally
// mirror each wedge for the extra fold of symmetry you see in real mandalas.
//
// The transform math (how a point lands in each replicated slice) is pure and
// decoupled from p5, so it can be tested without a canvas. p5 only appears in
// the drawing helpers, which take the instance as their first argument.

// Rotates a point `(x, y)` around the origin by `angle` radians. Building block
// for every replication below.
function rotatePoint(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: x * cos - y * sin, y: x * sin + y * cos };
}

// Given one point relative to the centre, returns every replicated copy for a
// mandala with `slices` rotational folds. With `mirror`, each slice also gets a
// reflected twin (reflection across the x-axis before rotating), doubling the
// symmetry the way kaleidoscopes do.
function symmetryPoints(x, y, slices, mirror = false) {
    // 0 or negative slices have no rotational symmetry to speak of and would
    // divide by zero below. Reject the degenerate input.
    if (!(slices > 0) || !Number.isInteger(slices)) {
        throw new RangeError(`slices debe ser un entero > 0, se recibió ${slices}`);
    }
    const step = (Math.PI * 2) / slices;
    const points = [];
    for (let i = 0; i < slices; i++) {
        const angle = step * i;
        points.push(rotatePoint(x, y, angle));
        if (mirror) {
            // Reflect across the x-axis, then rotate into this slice.
            points.push(rotatePoint(x, -y, angle));
        }
    }
    return points;
}

// Replicates a whole list of points (a "motif" relative to the centre) across
// all slices. Returns a flat list of replicated points — handy for stippling /
// scatter mandalas.
function replicateMotif(motif, slices, mirror = false) {
    const out = [];
    for (const [x, y] of motif) {
        for (const p of symmetryPoints(x, y, slices, mirror)) {
            out.push([p.x, p.y]);
        }
    }
    return out;
}

// Draws a mandala by calling `wedgeFn(p, sliceIndex)` once per slice, with the
// canvas already translated to `(cx, cy)` and rotated into that slice. The
// caller draws a single wedge in `wedgeFn`; the symmetry is handled here. With
// `mirror`, every other call is drawn flipped, so the wedge tiles seamlessly.
function drawMandala(p, wedgeFn, opts = {}) {
    const { cx = p.width / 2, cy = p.height / 2, slices = 12, mirror = false } = opts;
    if (!(slices > 0) || !Number.isInteger(slices)) {
        throw new RangeError(`slices debe ser un entero > 0, se recibió ${slices}`);
    }
    const step = (Math.PI * 2) / slices;
    p.push();
    p.translate(cx, cy);
    for (let i = 0; i < slices; i++) {
        p.push();
        p.rotate(step * i);
        wedgeFn(p, i);
        p.pop();
        if (mirror) {
            p.push();
            p.rotate(step * i);
            p.scale(1, -1); // reflected twin
            wedgeFn(p, i);
            p.pop();
        }
    }
    p.pop();
}

// A turtle-free convenience: draws the same list of `[x, y]` points (a motif
// relative to the centre) replicated across every slice as small dots. Good for
// quick generative-dot mandalas.
function drawMotif(p, motif, opts = {}) {
    const { cx = p.width / 2, cy = p.height / 2, slices = 12, mirror = false, dotSize = 3 } = opts;
    p.push();
    p.translate(cx, cy);
    for (const [x, y] of replicateMotif(motif, slices, mirror)) {
        p.circle(x, y, dotSize);
    }
    p.pop();
}

module.exports = {
    rotatePoint,
    symmetryPoints,
    replicateMotif,
    drawMandala,
    drawMotif,
};
