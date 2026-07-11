// Performance benchmark for `flock()` at scale. Not part of the test suite
// (it asserts nothing), it's a standalone measurement tool, run on demand:
//
//   node packages/boids/benchmark.js
//
// `flock()` is pure and p5-free (see boids-p5js.js), so it can be benchmarked
// headless with plain `performance.now()`, no canvas or p5 instance needed.
const { performance } = require('node:perf_hooks');
const { createBoid, flock } = require('./boids-p5js.js');

// A fixed 800x600 canvas on purpose, see docs/benchmarks.md. `perception`
// and `separationDist` are absolute pixel radii, so keeping canvas size fixed
// while `n` grows is what exposes the real bottleneck: cell occupancy (and
// therefore per-boid neighbour-scan cost) grows with `n`, not with area.
const WIDTH = 800;
const HEIGHT = 600;
const WARMUP_TICKS = 1;
const TICKS = 8;

function makeFlock(n) {
    const boids = new Array(n);
    for (let i = 0; i < n; i++) {
        boids[i] = createBoid(
            Math.random() * WIDTH,
            Math.random() * HEIGHT,
            Math.random() * 4 - 2,
            Math.random() * 4 - 2,
        );
    }
    return boids;
}

function bench(n) {
    let boids = makeFlock(n);
    // One warm-up tick so the measurement isn't dominated by first-call JIT
    // compilation. Kept to 1 (not more) because at n=10000 each tick already
    // costs multiple seconds, see the results table this prints.
    for (let i = 0; i < WARMUP_TICKS; i++) {
        boids = flock(boids, { width: WIDTH, height: HEIGHT });
    }

    const start = performance.now();
    for (let i = 0; i < TICKS; i++) {
        boids = flock(boids, { width: WIDTH, height: HEIGHT });
    }
    const elapsed = performance.now() - start;

    const msPerTick = elapsed / TICKS;
    return { n, elapsed, msPerTick, fps: 1000 / msPerTick };
}

console.log(
    `flock() benchmark: ${TICKS} ticks per size (${WIDTH}x${HEIGHT} canvas), spatial-hash grid neighbour lookup\n`,
);
console.log(
    'boids'.padStart(8),
    'total ms'.padStart(12),
    'ms/tick'.padStart(10),
    'est. fps'.padStart(10),
);

for (const n of [1000, 5000, 10000]) {
    const { elapsed, msPerTick, fps } = bench(n);
    console.log(
        String(n).padStart(8),
        elapsed.toFixed(1).padStart(12),
        msPerTick.toFixed(3).padStart(10),
        fps.toFixed(1).padStart(10),
    );
}
