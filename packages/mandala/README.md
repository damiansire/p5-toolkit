# mandala-p5js

Draw **mandalas, kaleidoscopes and rosette patterns** by replicating a single
wedge around a centre, on a [p5.js](https://p5js.org/) canvas. Add mirroring for
the extra fold of symmetry real mandalas have.

The drawing helpers take a p5 instance as their first argument, so the package
works in **instance mode** (and global mode too). The transform math (where a
point lands in each replicated slice) is pure and decoupled from p5, so it can
be used and tested without a canvas.

## Installation

```bash
npm install mandala-p5js
```

`p5` is a peer dependency (`^1.0.0`); install it alongside if you haven't already:

```bash
npm install p5
```

## Usage (instance mode)

You draw a single wedge; the symmetry is handled for you. Inside `wedgeFn` the
canvas is already translated to the centre and rotated into the current slice.

```js
const p5 = require("p5");
const { drawMandala } = require("mandala-p5js");

new p5((p) => {
  p.setup = () => {
    p.createCanvas(600, 600);
    p.background(10);
    p.stroke(255, 120);
    p.noFill();

    drawMandala(p, (pp) => {
      // One wedge, drawn outward from the centre. It gets replicated.
      pp.line(0, 0, 0, -240);
      pp.circle(0, -160, 60);
      pp.circle(0, -100, 24);
    }, { slices: 16, mirror: true });
  };
});
```

For dot / scatter mandalas, replicate a motif of points directly:

```js
const { drawMotif } = require("mandala-p5js");

// A motif is a list of [x, y] points relative to the centre.
const motif = [[40, 0], [80, -20], [120, 10]];
drawMotif(p, motif, { slices: 12, mirror: true, dotSize: 5 });
```

## API

### `drawMandala(p, wedgeFn, opts = {})`

Calls `wedgeFn(p, sliceIndex)` once per slice, with the canvas translated to the
centre and rotated into that slice.

- `opts.cx`, `opts.cy` — centre. Defaults to the canvas centre.
- `opts.slices` — number of rotational folds. Default `12`.
- `opts.mirror` — also draw a reflected twin of each wedge. Default `false`.

### `drawMotif(p, motif, opts = {})`

Replicates a list of `[x, y]` points (relative to the centre) across all slices
and draws them as dots. Same `opts` as `drawMandala`, plus `dotSize`.

### Pure helpers (no p5 needed)

- `symmetryPoints(x, y, slices, mirror = false)` — every replicated copy of one
  point. Returns `Array<{ x, y }>`.
- `replicateMotif(motif, slices, mirror = false)` — replicates a whole motif.
  Returns `Array<[x, y]>`.
- `rotatePoint(x, y, angle)` — rotates a point around the origin.

```js
const { symmetryPoints } = require("mandala-p5js");

symmetryPoints(10, 0, 4);
// => [{x:10,y:0}, {x:0,y:10}, {x:-10,y:0}, {x:0,y:-10}]
```

## License

MIT © Damian Sire
