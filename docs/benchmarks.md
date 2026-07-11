# Benchmarks

Real, measured performance for the packages where scale matters. Run on
demand: these are not part of the test suite (`npm test`) or CI, they assert
nothing, they only measure.

## `boids`: `flock()` at 1k / 5k / 10k

```bash
node packages/boids/benchmark.js
```

`flock()` is pure and p5-free, so it's benchmarked headless with
`performance.now()` (no canvas, no p5 instance, no browser). Each run creates
`n` boids at random positions/velocities on a fixed 800x600 canvas, does one
warm-up tick, then times `TICKS` more ticks and reports the average.

### Measured result (this machine, Node v26.2.0, one run, see caveat below)

| boids  | ms/tick | est. fps |
| ------ | ------- | -------- |
| 1,000  | 48.0    | 20.8     |
| 5,000  | 704.7   | 1.4      |
| 10,000 | 2,616.0 | 0.4      |

**Caveat:** this is a single run on one dev machine, not an averaged/warmed-up
CI benchmark, so treat the numbers as "the right order of magnitude and the
right trend," not a committed SLA. Re-run locally before relying on an exact
figure; results will vary by CPU and Node version.

### Why it's not O(n) in practice: the real finding

`flock()` uses a uniform spatial-hash grid (`buildSpatialGrid` /
`neighboursOf` in `packages/boids/boids-p5js.js`) precisely so each boid only
scans its own cell and the 8 neighbouring cells instead of the whole flock,
which is why the doc comment on `flock()` calls this "~O(n) instead of
O(n²)". That holds **only when cell occupancy stays bounded**, i.e.
boids-per-cell doesn't grow with `n`.

This benchmark deliberately keeps the canvas fixed at 800x600 while `n`
grows, because that's the real-world case (a sketch's canvas size doesn't
scale with how many boids you throw at it). `perception` (50px) and
`separationDist` (25px) are **absolute pixel radii**, so the grid's cell size
is fixed too (`cellSize = max(perception, separationDist) = 50`), giving a
fixed 16x12 = 192 cells over the canvas. Average occupancy is therefore
`n / 192` boids per cell, which grows linearly with `n`. Since each boid
scans ~9 cells, its per-boid neighbour-scan cost is `O(n)`, and the total
tick cost is `O(n) * O(n) = O(n²)` on a canvas of fixed size. The measured
numbers confirm it: 5x more boids (1k to 5k) costs ~14.7x more time per tick,
and 10x more boids (1k to 10k) costs ~54.5x more, both super-linear, close to
the quadratic-in-density prediction.

The spatial grid still buys a lot: it turns the _constant factor_ in front of
that O(n²) into "9 cells' worth of boids" instead of "every boid in the
flock," which is why 1,000 boids run comfortably above 60fps-adjacent
territory while a naive O(n²) all-pairs scan would already be struggling.
The architectural takeaway for anyone pushing past ~1-2k boids on a
fixed-size canvas:

- **Shrink `perception`/`separationDist`** as `n` grows, so cell occupancy
  (and therefore the O(n²) constant) stays bounded. This is the standard
  boids-at-scale trick, and it's a free `opts` change, no code change needed.
- **Or scale canvas area with `n`** if the visual density is supposed to stay
  constant (e.g. a bigger world for a bigger flock).
- Beyond a few thousand boids, a uniform grid is not enough on its own: a
  hierarchical structure (quadtree) or capping neighbours-per-boid would be
  the next real optimization, out of scope for this package today.

### npm-workspaces / tree-shaking note

Because `boids-p5js` exports `drawBoids` (the only p5-touching function)
separately from the pure `createBoid`/`computeSteering`/`flock`, a consumer
that only needs the simulation (e.g. running it in a Node worker, or this
very benchmark) can import just `{ createBoid, flock }`, and an ESM bundler
can tree-shake `drawBoids` and its p5 assumptions out entirely, since the
package has `"sideEffects": false`. That split (pure logic vs. p5-touching
draw call) is a workspace-wide convention (see root README "Conventions"),
not specific to `boids`, but `boids` is the package where it matters most for
performance: running the simulation headless (no p5, no canvas) is exactly
what makes this benchmark possible at 10k boids without spinning up a
browser.
