const test = require("node:test");
const assert = require("node:assert/strict");
const {
    expand,
    turtleSegments,
    generate,
    PRESETS,
} = require("./l-system-p5js.js");

test("expand con 0 generaciones devuelve el axioma", () => {
    assert.equal(expand("F", { F: "FF" }, 0), "F");
});

test("expand aplica la regla una vez por generación", () => {
    assert.equal(expand("F", { F: "FF" }, 1), "FF");
    assert.equal(expand("F", { F: "FF" }, 3), "FFFFFFFF");
});

test("expand copia los símbolos sin regla (constantes)", () => {
    // '+' y '[' no tienen regla -> sobreviven intactos.
    assert.equal(expand("F+[F]", { F: "FF" }, 1), "FF+[FF]");
});

test("expand rechaza generaciones no enteras o negativas", () => {
    assert.throws(() => expand("F", {}, -1), RangeError);
    assert.throws(() => expand("F", {}, 1.5), RangeError);
});

test("turtleSegments dibuja un segmento por cada F", () => {
    // Heading 0 (hacia +X), largo 10: F F genera dos segmentos contiguos.
    const segs = turtleSegments("FF", { heading: 0, length: 10 });
    assert.equal(segs.length, 2);
    assert.deepEqual(segs[0], [0, 0, 10, 0]);
    assert.deepEqual(segs[1], [10, 0, 20, 0]);
});

test("turtleSegments ignora símbolos desconocidos", () => {
    const segs = turtleSegments("FXF", { heading: 0, length: 5 });
    assert.equal(segs.length, 2);
});

test("turtleSegments respeta push/pop de estado con corchetes", () => {
    // Dibuja F, guarda, gira y dibuja una rama, restaura, dibuja otra F desde
    // donde quedó el tronco -> tres segmentos, el tercero arranca en (10,0).
    const segs = turtleSegments("F[+F]F", { heading: 0, length: 10, angle: 90 });
    assert.equal(segs.length, 3);
    assert.deepEqual(segs[0], [0, 0, 10, 0]);
    assert.deepEqual(segs[2][0], 10);
    assert.deepEqual(segs[2][1], 0);
});

test("turtleSegments no se rompe con un corchete de cierre suelto", () => {
    assert.doesNotThrow(() => turtleSegments("]F", { heading: 0 }));
});

test("generate combina expand y turtle con el ángulo del preset", () => {
    const segs = generate(PRESETS.dragon, 2, { length: 10 });
    // dragon gen2: F -> F+G -> F+G+F-G; F y G ambos dibujan -> 4 segmentos.
    assert.equal(segs.length, 4);
});

test("los presets exponen axiom, rules y angle", () => {
    for (const name of Object.keys(PRESETS)) {
        const p = PRESETS[name];
        assert.equal(typeof p.axiom, "string");
        assert.equal(typeof p.rules, "object");
        assert.equal(typeof p.angle, "number");
    }
});
