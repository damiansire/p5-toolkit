const test = require("node:test");
const assert = require("node:assert/strict");
const { fakeP5 } = require("../../test/fake-p5.js");
const {
    wrapHue,
    harmonyOffsets,
    palette,
    randomPalette,
    hslToRgb,
    applyPalette,
    drawPalette,
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

test("analogous con count par también queda centrado en la base", () => {
    // 4 swatches: deben straddlear la base, no sesgarse hacia +hue.
    assert.deepEqual(harmonyOffsets("analogous", 4), [-45, -15, 15, 45]);
    // La suma de offsets es 0 -> simétrico alrededor de la base.
    const sum = harmonyOffsets("analogous", 4).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum) < 1e-9);
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

test("palette propaga count en analogous (la armonía por defecto)", () => {
    const pal = palette(200, "analogous", { count: 5 });
    assert.equal(pal.length, 5);
    // Hues = base + [-60,-30,0,30,60] con wrap.
    assert.deepEqual(
        pal.map((s) => s.h),
        [140, 170, 200, 230, 260]
    );
});

test("palette monochromatic mantiene un solo hue y rampa la luminosidad", () => {
    const pal = palette(200, "monochromatic", { count: 4 });
    assert.equal(pal.length, 4);
    for (const s of pal) assert.equal(s.h, 200);
    // Luminosidad estrictamente creciente.
    for (let i = 1; i < pal.length; i++) {
        assert.ok(pal[i].l > pal[i - 1].l, `l[${i}] debe crecer`);
    }
});

test("randomPalette usa de verdad el randomFn inyectado y elige armonía != índice 0", () => {
    // randomFn devuelve 0.6 (armonía) y luego 0.5 (hue): NO debe caer en la
    // primera armonía ni en hue 0, lo que delataría que ignora la inyección.
    const seq = [0.6, 0.5];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const pal = randomPalette(rng);
    const harmonies = [
        "analogous",
        "triadic",
        "complementary",
        "splitComplementary",
        "tetradic",
        "monochromatic",
    ];
    const expectedHarmony = harmonies[Math.floor(0.6 * harmonies.length)]; // tetradic
    const expectedBase = Math.floor(0.5 * 360); // 180
    const expected = palette(expectedBase, expectedHarmony);
    assert.deepEqual(pal, expected);
    // Sanidad: no es la armonía del índice 0 (analogous con 5 swatches).
    assert.notEqual(pal.length, palette(expectedBase, "analogous").length);
});

test("randomPalette: secuencias distintas dan paletas distintas", () => {
    const palA = randomPalette(() => 0.1);
    const palB = randomPalette(() => 0.95);
    assert.notDeepEqual(palA, palB);
});

test("hslToRgb convierte colores conocidos", () => {
    assert.deepEqual(hslToRgb({ h: 0, s: 100, l: 50 }), { r: 255, g: 0, b: 0 });
    assert.deepEqual(hslToRgb({ h: 120, s: 100, l: 50 }), { r: 0, g: 255, b: 0 });
    assert.deepEqual(hslToRgb({ h: 240, s: 100, l: 50 }), { r: 0, g: 0, b: 255 });
    assert.deepEqual(hslToRgb({ h: 0, s: 0, l: 100 }), { r: 255, g: 255, b: 255 });
    assert.deepEqual(hslToRgb({ h: 0, s: 0, l: 0 }), { r: 0, g: 0, b: 0 });
});

test("applyPalette pasa a p.color los RGB que produce hslToRgb", () => {
    const p = fakeP5();
    const pal = [
        { h: 0, s: 100, l: 50 }, // rojo
        { h: 240, s: 100, l: 50 }, // azul
    ];
    const colors = applyPalette(p, pal);
    // Devuelve un color por swatch.
    assert.equal(colors.length, 2);
    // Llamó p.color con los RGB exactos de hslToRgb.
    const colorCalls = p.calls.filter((c) => c[0] === "color");
    assert.deepEqual(colorCalls[0], ["color", 255, 0, 0]);
    assert.deepEqual(colorCalls[1], ["color", 0, 0, 255]);
});

test("drawPalette balancea push/pop y dibuja un rect por swatch", () => {
    const p = fakeP5({ width: 200, height: 100 });
    const pal = palette(0, "triadic"); // 3 swatches
    drawPalette(p, pal);
    assert.ok(p.balanced());
    assert.equal(p.count("rect"), 3);
    assert.deepEqual(p.styleOutsidePush, []);
});
