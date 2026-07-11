# draw-axis-p5js

Draw coordinate axes with labeled tick points on a [p5.js](https://p5js.org/) canvas.

The drawing functions take a p5 instance as their first argument, so the package
works in **instance mode** (and global mode too). Coordinate generation is a pure
function, decoupled from p5, so it can be used and tested without a canvas.

Written in **TypeScript**, ships its own `.d.ts` types (no `@types/` package
needed), and exports the `P5Like` interface it types `p` against, in case you
want to type your own draw helpers against the same minimal p5 surface.

## Installation

```bash
npm install draw-axis-p5js
```

`p5` is a peer dependency (`^1.0.0`); install it alongside if you haven't already:

```bash
npm install p5
```

## Usage (instance mode)

```js
const p5 = require('p5');
const { drawAxis } = require('draw-axis-p5js');

new p5((p) => {
    p.setup = () => {
        p.createCanvas(400, 400);
    };

    p.draw = () => {
        p.background(255);
        drawAxis(p); // X and Y axes through the origin, with labeled points every 100px
    };
});
```

To change the spacing between labeled points, pass a `step`:

```js
drawAxis(p, 50); // a labeled point every 50px
```

TypeScript consumers get full types on import, no setup needed:

```ts
import { drawAxis, axisPoints, type P5Like, type AxisPoint } from 'draw-axis-p5js';
```

## API

### `drawAxis(p, step = 100)`

Draws the X axis (horizontal) and Y axis (vertical) through the origin `(0, 0)`,
then a labeled point along each axis every `step` pixels.

- `p` — a p5 instance (or `window` in global mode, e.g. `drawAxis(window)`,
  since global mode binds the p5 methods to the window).
- `step` — pixel spacing between labeled points. Default `100`.

### `drawPoint(p, x, y)`

Draws a single point at `(x, y)` and labels it with its coordinates.

- `p` — a p5 instance.
- `x`, `y` — point coordinates.

### `axisPoints(width, height, step = 100)`

Pure function (no p5 needed). Returns the list of points used by `drawAxis`:
points along the X axis from `0` to `width`, and along the Y axis from `step` to
`height`.

- Returns `Array<[x, y]>`.

```js
const { axisPoints } = require('draw-axis-p5js');

axisPoints(200, 200, 100);
// => [[0, 0], [100, 0], [200, 0], [0, 100], [0, 200]]
```

> Also exported as `gridPoints`, a deprecated alias kept for backward
> compatibility. Prefer `axisPoints` — these are axis points, not a grid.

## License

MIT © Damian Sire
