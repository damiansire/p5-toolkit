// Generative colour palettes from colour-theory harmonies (complementary,
// analogous, triadic, …) plus deterministic random palettes.
//
// Everything is pure: a palette is just an array of `{ h, s, l }` objects in
// HSL space (hue in degrees 0–360, saturation/lightness 0–100). The only p5
// touchpoint is `applyPalette`, which converts to RGB and feeds p5's colour
// system — it takes the instance as its first argument.

// Normalises a hue into [0, 360). Harmonies add offsets that can overflow, so
// every generated hue passes through here.
function wrapHue(hue) {
    return ((hue % 360) + 360) % 360;
}

// Returns the hue offsets (in degrees) that define each harmony around a base
// hue. `count` only matters for harmonies that fan out (analogous).
function harmonyOffsets(harmony, count = 5) {
    switch (harmony) {
        case 'complementary':
            return [0, 180];
        case 'analogous': {
            // Spread `count` swatches symmetrically around the base, 30° apart.
            // No Math.floor: with an even count the swatches straddle the base
            // (e.g. count=4 -> [-45, -15, 15, 45]) instead of skewing toward +hue.
            const step = 30;
            const start = (-step * (count - 1)) / 2;
            return Array.from({ length: count }, (_, i) => start + i * step);
        }
        case 'triadic':
            return [0, 120, 240];
        case 'tetradic':
            return [0, 90, 180, 270];
        case 'splitComplementary':
            return [0, 150, 210];
        case 'monochromatic':
            // Same hue; the lightness ramp in `palette` does the variation.
            return Array.from({ length: count }, () => 0);
        default:
            throw new RangeError(`unknown harmony: "${harmony}"`);
    }
}

// Builds a palette from a base hue and a harmony. Saturation is fixed and
// lightness ramps across the swatches so even a single-hue (monochromatic)
// palette has visible variety.
function palette(baseHue, harmony = 'analogous', opts = {}) {
    const { count = 5, saturation = 70, lightness = 55, lightnessRange = 30 } = opts;
    const offsets = harmonyOffsets(harmony, count);
    const n = offsets.length;
    return offsets.map((offset, i) => {
        // Ramp lightness from (lightness - range/2) to (lightness + range/2).
        const t = n === 1 ? 0.5 : i / (n - 1);
        const l = lightness - lightnessRange / 2 + t * lightnessRange;
        return {
            h: wrapHue(baseHue + offset),
            s: saturation,
            l: Math.max(0, Math.min(100, l)),
        };
    });
}

// A deterministic random palette. `randomFn` returns [0, 1) (p5's `p.random`
// does); injecting it keeps tests reproducible. Picks a random base hue, then
// reuses a harmony so the result still looks intentional, not muddy.
function randomPalette(randomFn = Math.random, opts = {}) {
    const harmonies = [
        'analogous',
        'triadic',
        'complementary',
        'splitComplementary',
        'tetradic',
        'monochromatic',
    ];
    const harmony = harmonies[Math.floor(randomFn() * harmonies.length)];
    const baseHue = Math.floor(randomFn() * 360);
    return palette(baseHue, harmony, opts);
}

// Converts an `{ h, s, l }` swatch to `{ r, g, b }` (0–255). Standard HSL→RGB.
function hslToRgb({ h, s, l }) {
    const sN = s / 100;
    const lN = l / 100;
    const c = (1 - Math.abs(2 * lN - 1)) * sN;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lN - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
    };
}

// Converts a whole palette to an array of `p5.Color` objects, so a sketch can
// pick from it with `p.fill(colors[i])`. Uses p5's RGB mode via the converter
// above (no dependency on the sketch's current colorMode).
function applyPalette(p, pal) {
    return pal.map((swatch) => {
        const { r, g, b } = hslToRgb(swatch);
        return p.color(r, g, b);
    });
}

// Draws the palette as a row of swatches across the canvas — handy for previews.
function drawPalette(p, pal, x = 0, y = 0, width = null, height = 60) {
    const w = (width == null ? p.width : width) / pal.length;
    p.push();
    p.noStroke();
    pal.forEach((swatch, i) => {
        const { r, g, b } = hslToRgb(swatch);
        p.fill(r, g, b);
        p.rect(x + i * w, y, w, height);
    });
    p.pop();
}

module.exports = {
    wrapHue,
    harmonyOffsets,
    palette,
    randomPalette,
    hslToRgb,
    applyPalette,
    drawPalette,
};
