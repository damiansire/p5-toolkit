const test = require("node:test");
const assert = require("node:assert/strict");
const {
    wrapHue,
    harmonyOffsets,
    palette,
    randomPalette,
    hslToRgb,
} = require("./color-palette-p5js.js");

test("wrapHue normaliza al rango [0, 360)", () => {
    assert.equal(wrapHue(0), 0);
    assert.equal(wrapHue(360), 0);
    assert.equal(wrapHue(400), 40);
    assert.equal(wrapHue(-30), 330);
});

test("complementary devuelve base + opuesto", () => {
    assert.deepEqual(harmonyOffsets("complementary"), [0, 180]);
});

test("triadic reparte en 120 grados", () => {
    assert.deepEqual(harmonyOffsets("triadic"), [0, 120, 240]);
});

test("analogous se reparte simétricamente alrededor de la base", () => {
    // 5 swatches, paso 30 -> [-60, -30, 0, 30, 60].
    assert.deepEqual(harmonyOffsets("analogous", 5), [-60, -30, 0, 30, 60]);
});

test("harmonyOffsets rechaza armonías desconocidas", () => {
    assert.throws(() => harmonyOffsets("plaid"), RangeError);
});

test("palette aplica los offsets de la armonía sobre la base, con wrap", () => {
    const pal = palette(200, "complementary");
    assert.equal(pal.length, 2);
    assert.equal(pal[0].h, 200);
    assert.equal(pal[1].h, wrapHue(200 + 180)); // 20
});

test("palette mantiene saturación y rampa de luminosidad dentro de [0,100]", () => {
    const pal = palette(0, "triadic", { saturation: 80, lightness: 50, lightnessRange: 40 });
    for (const swatch of pal) {
        assert.equal(swatch.s, 80);
        assert.ok(swatch.l >= 0 && swatch.l <= 100);
    }
    // Con rango 40 centrado en 50: primer swatch 30, último 70.
    assert.ok(Math.abs(pal[0].l - 30) < 1e-9);
    assert.ok(Math.abs(pal[pal.length - 1].l - 70) < 1e-9);
});

test("randomPalette es determinista con un randomFn inyectado", () => {
    const seq = [0, 0]; // primera armonía, hue 0
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const a = randomPalette(rng);
    i = 0;
    const b = randomPalette(rng);
    assert.deepEqual(a, b);
});

test("hslToRgb convierte colores conocidos", () => {
    assert.deepEqual(hslToRgb({ h: 0, s: 100, l: 50 }), { r: 255, g: 0, b: 0 });
    assert.deepEqual(hslToRgb({ h: 120, s: 100, l: 50 }), { r: 0, g: 255, b: 0 });
    assert.deepEqual(hslToRgb({ h: 240, s: 100, l: 50 }), { r: 0, g: 0, b: 255 });
    assert.deepEqual(hslToRgb({ h: 0, s: 0, l: 100 }), { r: 255, g: 255, b: 255 });
    assert.deepEqual(hslToRgb({ h: 0, s: 0, l: 0 }), { r: 0, g: 0, b: 0 });
});
