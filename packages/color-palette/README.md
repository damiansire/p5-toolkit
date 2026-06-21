# color-palette-p5js

Generate **colour palettes from colour-theory harmonies** (complementary,
analogous, triadic, tetradic, split-complementary, monochromatic) — plus
deterministic random palettes — for [p5.js](https://p5js.org/) sketches.

A palette is just an array of `{ h, s, l }` swatches (pure data, no p5 needed).
The only p5 touchpoints — `applyPalette` and `drawPalette` — take the instance
as their first argument, so the package works in **instance mode** (and global
mode too).

## Installation

```bash
npm install color-palette-p5js
```

`p5` is a peer dependency (`^1.0.0`); install it alongside if you haven't already:

```bash
npm install p5
```

## Usage (instance mode)

```js
const p5 = require('p5');
const { palette, applyPalette } = require('color-palette-p5js');

new p5((p) => {
    p.setup = () => {
        p.createCanvas(500, 500);
        // A triadic palette around hue 210 (a cool blue), as p5.Color objects.
        const colors = applyPalette(p, palette(210, 'triadic', { count: 3 }));
        p.background(colors[0]);
        p.fill(colors[1]);
        p.noStroke();
        p.circle(250, 250, 200);
        p.fill(colors[2]);
        p.circle(250, 250, 100);
    };
});
```

Reroll a fresh palette on demand, sharing p5's RNG so a `randomSeed` makes it
reproducible:

```js
const { randomPalette, drawPalette } = require('color-palette-p5js');

const pal = randomPalette(() => p.random());
drawPalette(p, pal); // preview the swatches as a row across the canvas
```

## API

### `palette(baseHue, harmony = "analogous", opts = {})`

Builds a palette from a base hue (degrees) and a harmony. Returns
`Array<{ h, s, l }>`.

- `harmony` — `"complementary"`, `"analogous"`, `"triadic"`, `"tetradic"`,
  `"splitComplementary"` or `"monochromatic"`.
- `opts.count` — swatches for fan-out harmonies (analogous, monochromatic).
- `opts.saturation`, `opts.lightness`, `opts.lightnessRange` — the saturation
  and the lightness ramp across the swatches.

### `randomPalette(randomFn = Math.random, opts = {})`

Picks a random base hue and harmony. `randomFn` returns `[0, 1)`; pass
`() => p.random()` to share p5's RNG.

### `applyPalette(p, palette)`

Converts a palette to an array of `p5.Color` objects.

### `drawPalette(p, palette, x = 0, y = 0, width = null, height = 60)`

Draws the palette as a row of swatches (defaults to the full canvas width).

### Pure helpers (no p5 needed)

- `harmonyOffsets(harmony, count)` — the hue offsets for a harmony.
- `hslToRgb({ h, s, l })` — converts a swatch to `{ r, g, b }` (0–255).
- `wrapHue(hue)` — normalises a hue into `[0, 360)`.

```js
const { palette, hslToRgb } = require('color-palette-p5js');

hslToRgb(palette(0, 'complementary')[1]); // the complement of red
```

## License

MIT © Damian Sire
