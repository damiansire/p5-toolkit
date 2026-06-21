// Pure coordinate generation, decoupled from drawing and from p5 globals so it
// can be tested without a canvas.
function axisPoints(width, height, step = 100) {
    const points = [];
    for (let x = 0; x <= width; x += step) {
        points.push([x, 0]);
    }
    for (let y = step; y <= height; y += step) {
        points.push([0, y]);
    }
    return points;
}

function drawAxis(p, step = 100) {
    // X axis (horizontal) and Y axis (vertical) through the origin.
    p.strokeWeight(1);
    p.line(0, 0, p.width, 0);
    p.line(0, 0, 0, p.height);
    // Tick labels along each axis — iterate the pure point list and draw.
    for (const [x, y] of axisPoints(p.width, p.height, step)) {
        drawPoint(p, x, y);
    }
}

function drawPoint(p, x, y) {
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

module.exports = { drawAxis, drawPoint, axisPoints, gridPoints };
