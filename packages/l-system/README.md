# l-system-p5js

Grow **L-systems** (Lindenmayer systems) — fractal plants, Koch curves,
Sierpinski triangles, dragon curves — and render them with turtle graphics on a
[p5.js](https://p5js.org/) canvas.

The drawing helper takes a p5 instance as its first argument, so the package
works in **instance mode** (and global mode too). The grammar (string
rewriting) and the turtle interpreter are pure and decoupled from p5, so they
can be used and tested without a canvas.

## Installation

```bash
npm install l-system-p5js
```

`p5` is a peer dependency (`^1.0.0`); install it alongside if you haven't already:

```bash
npm install p5
```

## Usage (instance mode)

```js
const p5 = require('p5');
const { generate, drawLSystem, PRESETS } = require('l-system-p5js');

new p5((p) => {
    p.setup = () => {
        p.createCanvas(600, 600);
        p.background(255);
        p.translate(p.width / 2, p.height); // grow up from the bottom-center
        const segments = generate(PRESETS.plant, 5, { length: 6 });
        drawLSystem(p, segments);
    };
});
```

## The turtle alphabet

`turtleSegments` understands the classic L-system alphabet:

| Symbol   | Meaning                             |
| -------- | ----------------------------------- |
| `F`, `G` | move forward, drawing a segment     |
| `f`      | move forward without drawing        |
| `+`      | turn left by `angle`                |
| `-`      | turn right by `angle`               |
| `[`      | push the current position + heading |
| `]`      | pop the saved state (branch back)   |

Any other symbol is a no-op for drawing, so you can use letters like `X` purely
to drive the rewriting.

## API

### `generate(spec, generations, opts = {})`

Expands `spec` (a `{ axiom, rules, angle }` object or one of the `PRESETS`)
`generations` times and returns the turtle segments ready to draw.

- `opts.x`, `opts.y` — turtle start. Default `(0, 0)`.
- `opts.length` — segment length. Default `10`.
- `opts.angle` — turn angle in degrees. Defaults to the spec's angle.
- `opts.heading` — initial heading in degrees. Default `-90` (points up).

### `drawLSystem(p, segments)`

Draws a list of `[x1, y1, x2, y2]` segments with `p.line`.

### `PRESETS`

Ready-to-use specs: `plant`, `kochCurve`, `sierpinski`, `dragon`. Each is a
`{ axiom, rules, angle }`.

### Pure helpers (no p5 needed)

- `expand(axiom, rules, generations)` — rewrites the axiom string. Returns the
  expanded string.
- `turtleSegments(commands, opts)` — walks an expanded string as a turtle.
  Returns `Array<[x1, y1, x2, y2]>`.

```js
const { expand } = require('l-system-p5js');

expand('F', { F: 'F+F-F-F+F' }, 1);
// => "F+F-F-F+F"
```

## License

MIT © Damian Sire
