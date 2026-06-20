function drawAxis(p, step = 100) {
    // X axis (horizontal) and Y axis (vertical) through the origin.
    p.strokeWeight(1);
    p.line(0, 0, p.width, 0);
    p.line(0, 0, 0, p.height);
    // Tick labels along each axis.
    for (let indexX = 0; indexX <= p.width; indexX += step) {
        drawPoint(p, indexX, 0);
    }
    for (let indexY = step; indexY <= p.height; indexY += step) {
        drawPoint(p, 0, indexY);
    }
}

function drawPoint(p, x, y) {
    p.strokeWeight(8);
    p.point(x, y);
    p.textSize(15);
    p.text(`(${x},${y})`, x, y + 18);
}

module.exports = { drawAxis, drawPoint };
