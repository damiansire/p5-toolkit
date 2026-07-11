// Pure coordinate generation, decoupled from drawing and from p5 globals so it
// can be tested without a canvas.

/** A single `[x, y]` axis point, in canvas pixel coordinates. */
export type AxisPoint = [x: number, y: number];

/**
 * The subset of the p5 instance-mode API `drawAxis`/`drawPoint` depend on.
 * Deliberately narrow (not the full `p5` type) so consumers can pass a real
 * `p5` instance, a fake in tests, or any other object shaped like this.
 */
export interface P5Like {
    readonly width: number;
    readonly height: number;
    push(): void;
    pop(): void;
    strokeWeight(weight: number): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    point(x: number, y: number): void;
    noStroke(): void;
    fill(gray: number): void;
    textSize(size: number): void;
    text(str: string, x: number, y: number): void;
}

function axisPoints(width: number, height: number, step = 100): AxisPoint[] {
    // step<=0 never advances the loops toward the edge -> an infinite loop that
    // hangs the sketch. Reject the degenerate input instead of hanging.
    if (!(step > 0)) {
        throw new RangeError(`step must be > 0, received ${step}`);
    }
    const points: AxisPoint[] = [];
    for (let x = 0; x <= width; x += step) {
        points.push([x, 0]);
    }
    for (let y = step; y <= height; y += step) {
        points.push([0, y]);
    }
    return points;
}

function drawAxis(p: P5Like, step = 100): void {
    // Wrap in push/pop so the strokeWeight we set here never leaks into the
    // consumer's global p5 state — matching the isolation contract the other
    // draw helpers follow.
    p.push();
    // X axis (horizontal) and Y axis (vertical) through the origin.
    p.strokeWeight(1);
    p.line(0, 0, p.width, 0);
    p.line(0, 0, 0, p.height);
    // Tick labels along each axis — iterate the pure point list and draw.
    for (const [x, y] of axisPoints(p.width, p.height, step)) {
        drawPoint(p, x, y);
    }
    p.pop();
}

function drawPoint(p: P5Like, x: number, y: number): void {
    p.push();
    p.strokeWeight(8);
    p.point(x, y);
    p.noStroke();
    p.fill(0);
    p.textSize(15);
    p.text(`(${x},${y})`, x, y + 18);
    p.pop();
}

// `gridPoints` is kept as a backward-compatible alias for `axisPoints`.
const gridPoints = axisPoints;

// Compiled with `"module": "commonjs"`, so this becomes
// `exports.drawAxis = ...` etc. — the same shape `require('draw-axis-p5js')`
// consumers got from the pre-TS `module.exports = { ... }`.
export { drawAxis, drawPoint, axisPoints, gridPoints };
