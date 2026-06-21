# boids-p5js

A **boids flocking** simulation for [p5.js](https://p5js.org/) — Craig
Reynolds' three local rules (separation, alignment, cohesion) that make a crowd
of dumb agents move like a flock of birds or a school of fish.

The drawing helper takes a p5 instance as its first argument, so the package
works in **instance mode** (and global mode too). The vector math and the
steering rules are pure and decoupled from p5, so the simulation can be used and
tested without a canvas.

## Installation

```bash
npm install boids-p5js
```

`p5` is a peer dependency (`^1.0.0`); install it alongside if you haven't already:

```bash
npm install p5
```

## Usage (instance mode)

```js
const p5 = require("p5");
const { createBoid, flock, drawBoids } = require("boids-p5js");

new p5((p) => {
  let boids;

  p.setup = () => {
    p.createCanvas(800, 600);
    boids = Array.from({ length: 120 }, () =>
      createBoid(
        p.random(p.width),
        p.random(p.height),
        p.random(-2, 2),
        p.random(-2, 2)
      )
    );
  };

  p.draw = () => {
    p.background(10);
    p.fill(220);
    p.noStroke();
    boids = flock(boids, { width: p.width, height: p.height, maxSpeed: 4 });
    drawBoids(p, boids);
  };
});
```

Tune the flock with the rule weights:

```js
boids = flock(boids, {
  width: p.width,
  height: p.height,
  perception: 60,        // neighbour radius for alignment + cohesion
  separationDist: 30,    // personal space
  separationWeight: 2,   // dial each rule up/down
  alignmentWeight: 1,
  cohesionWeight: 0.8,
});
```

## API

### `createBoid(x, y, vx = 0, vy = 0)`

Builds a boid `{ pos, vel, acc }`.

### `flock(boids, opts = {})`

Advances the whole flock one tick and returns a **fresh** array (the input is
not mutated). Steering forces are all computed from the same snapshot, then
positions are integrated and wrapped around the canvas edges.

- `opts.width`, `opts.height` — canvas size for wrapping.
- `opts.maxSpeed`, `opts.maxForce` — motion limits.
- `opts.perception`, `opts.separationDist` — neighbour radii.
- `opts.separationWeight`, `opts.alignmentWeight`, `opts.cohesionWeight` — rule
  weights.

### `drawBoids(p, boids, size = 6)`

Draws each boid as a triangle pointing along its velocity.

### Pure helper (no p5 needed)

- `computeSteering(boid, boids, opts)` — the combined steering acceleration for
  one boid. Returns a `{ x, y }` vector.

```js
const { createBoid, computeSteering } = require("boids-p5js");

const a = createBoid(0, 0);
const b = createBoid(5, 0); // very close
computeSteering(a, [a, b]).x; // < 0  (a steers away from b)
```

## License

MIT © Damian Sire
