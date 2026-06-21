# flow-field-p5js

Build **Perlin-noise flow fields** and advect particles through them to make
those swirly, hair-like generative drawings, on a [p5.js](https://p5js.org/)
canvas.

The drawing helpers take a p5 instance as their first argument, so the package
works in **instance mode** (and global mode too). The field math — the angle
grid, the per-step particle motion and the canvas wrapping — is pure and
decoupled from p5, so it can be used and tested without a canvas.

## Installation

```bash
npm install flow-field-p5js
```

`p5` is a peer dependency (`^1.0.0`); install it alongside if you haven't already:

```bash
npm install p5
```

## Usage (instance mode)

```js
const p5 = require("p5");
const { buildFlowField, stepParticle } = require("flow-field-p5js");

new p5((p) => {
  let field;
  let particles;

  p.setup = () => {
    p.createCanvas(600, 600);
    p.background(10);
    // `field` carries its own resolution/width/height, so stepParticle never
    // needs you to repeat them.
    field = buildFlowField(p, 20, { noiseScale: 0.08, turns: 1 });
    particles = Array.from({ length: 800 }, () => ({
      x: p.random(p.width),
      y: p.random(p.height),
    }));
  };

  p.draw = () => {
    p.stroke(255, 12);
    for (let i = 0; i < particles.length; i++) {
      const next = stepParticle(particles[i], field, { speed: 1.5 });
      p.line(particles[i].x, particles[i].y, next.x, next.y);
      particles[i] = next;
    }
  };
});
```

To preview the raw field while tuning it, draw the angle grid directly:

```js
const { buildFlowField, drawFlowField } = require("flow-field-p5js");

const field = buildFlowField(p, 20, { noiseScale: 0.08, turns: 2 });
drawFlowField(p, field);
```

## API

### `buildFlowField(p, resolution = 20, opts = {})`

Samples `p.noise` over the canvas to build the angle grid sized to fit
`p.width × p.height` in cells of `resolution` pixels. Returns a **field object**
`{ angles, resolution, width, height }` — pass it straight to `stepParticle` /
`drawFlowField` and the cell size travels with the data, so producer and
consumer can never disagree about `resolution`.

- `opts.noiseScale` — how fast the noise input advances per cell. Default `0.1`.
- `opts.turns` — how many full turns the angle sweeps across the noise range.
  Default `1`.

### `stepParticle(particle, field, opts = {})`

Advances one `{ x, y }` particle a single step along the field and wraps it
around the canvas edges (a torus). Returns a fresh `{ x, y }`. `field` is a field
object from `buildFlowField` (it supplies `resolution`/`width`/`height`), or a
bare angle grid plus `opts.resolution`/`opts.width`/`opts.height`.

- `opts.speed` — pixels per step. Default `1`.
- `opts.resolution`, `opts.width`, `opts.height` — only needed when `field` is a
  bare angle grid rather than a field object.

### `drawFlowField(p, field, resolution = 20, length = null)`

Draws the field as a grid of short line segments. `field` may be a field object
(its `resolution` is used) or a bare angle grid plus the `resolution` argument.
`length` defaults to `resolution * 0.8`.

### Pure helpers (no p5 needed)

- `flowFieldAngles(cols, rows, noiseFn, opts)` — builds the angle grid from a
  `noiseFn(nx, ny) -> [0, 1]` you provide. Returns `number[][]`.
- `noiseToAngle(noiseValue, turns = 1)` — maps a `[0, 1]` noise value to an
  angle in radians.
- `angleAt(angles, px, py, resolution)` — reads the angle at the cell under a
  pixel, clamped to the grid edges.

```js
const { flowFieldAngles } = require("flow-field-p5js");

flowFieldAngles(2, 2, () => 0.5);
// => [[Math.PI, Math.PI], [Math.PI, Math.PI]]
```

## License

MIT © Damian Sire
