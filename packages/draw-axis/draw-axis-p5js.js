function drawAxis(p, step = 100) {
    for (let indexY = 0; indexY <= p.height; indexY += step) {
        for (let indexX = 0; indexX <= p.width; indexX += step) {
            drawPoint(p, indexX, indexY);
        }
    }
}

function drawPoint(p, x, y) {
    p.strokeWeight(8);
    p.point(x, y);
    p.textSize(15);
    p.text(`(${x},${y})`, x, y + 18);
}

module.exports = { drawAxis, drawPoint };
