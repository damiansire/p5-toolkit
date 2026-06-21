// L-systems (Lindenmayer systems): rewrite a string of symbols generation by
// generation, then walk the result like turtle-graphics to draw fractal plants,
// curves and tilings.
//
// The grammar (string rewriting) and the turtle interpreter (turning symbols
// into line segments) are pure and decoupled from p5, so they can be tested
// without a canvas. p5 only appears in `drawLSystem`, which takes the instance
// as its first argument.

// Expands the axiom `generations` times by replacing every symbol with its rule
// (symbols without a rule are copied through, which is how constants like `[`,
// `]`, `+`, `-` survive). `rules` is a plain object `{ symbol: replacement }`.
function expand(axiom, rules, generations) {
    // Negative or fractional generations have no meaning and would either skip
    // the loop silently or never terminate. Reject the degenerate input.
    if (!Number.isInteger(generations) || generations < 0) {
        throw new RangeError(`generations must be an integer >= 0, received ${generations}`);
    }
    let current = axiom;
    for (let gen = 0; gen < generations; gen++) {
        // Push each replacement into an array and join once: string `+=` in a
        // loop materialises a fresh (and growing) string per symbol, which is
        // quadratic for the exponential presets (e.g. plant's F -> FF).
        const parts = [];
        for (const symbol of current) {
            parts.push(
                Object.prototype.hasOwnProperty.call(rules, symbol) ? rules[symbol] : symbol,
            );
        }
        current = parts.join('');
    }
    return current;
}

// Walks an expanded L-system string as a turtle and returns the list of line
// segments to draw. The turtle understands the classic alphabet:
//   F, G  -> move forward drawing a segment
//   f     -> move forward without drawing
//   +     -> turn left by `angle`
//   -     -> turn right by `angle`
//   [     -> push the current state (position + heading)
//   ]     -> pop the saved state
// Anything else is treated as a no-op so custom symbols can drive rewriting
// without affecting the drawing.
function turtleSegments(commands, opts = {}) {
    const {
        x = 0,
        y = 0,
        angle = 25,
        length = 10,
        heading = -90, // point "up" by default, like a growing plant
    } = opts;
    const toRad = Math.PI / 180;
    const segments = [];
    const stack = [];
    let state = { x, y, heading };
    for (const command of commands) {
        switch (command) {
            case 'F':
            case 'G': {
                const nx = state.x + Math.cos(state.heading * toRad) * length;
                const ny = state.y + Math.sin(state.heading * toRad) * length;
                segments.push([state.x, state.y, nx, ny]);
                state = { ...state, x: nx, y: ny };
                break;
            }
            case 'f': {
                state = {
                    ...state,
                    x: state.x + Math.cos(state.heading * toRad) * length,
                    y: state.y + Math.sin(state.heading * toRad) * length,
                };
                break;
            }
            case '+':
                state = { ...state, heading: state.heading + angle };
                break;
            case '-':
                state = { ...state, heading: state.heading - angle };
                break;
            case '[':
                stack.push({ ...state });
                break;
            case ']':
                // A stray `]` with nothing pushed would pop `undefined` and
                // corrupt the turtle. Ignore it instead of crashing the sketch.
                if (stack.length > 0) {
                    state = stack.pop();
                }
                break;
            default:
                break;
        }
    }
    return segments;
}

// A few ready-to-use presets so a sketch can grow a plant in one line.
// Each carries its own default branching `angle`.
const PRESETS = {
    plant: { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25 },
    kochCurve: { axiom: 'F', rules: { F: 'F+F-F-F+F' }, angle: 90 },
    sierpinski: { axiom: 'F-G-G', rules: { F: 'F-G+F+G-F', G: 'GG' }, angle: 120 },
    dragon: { axiom: 'F', rules: { F: 'F+G', G: 'F-G' }, angle: 90 },
};

// Expands a preset (or any `{ axiom, rules, angle }`) and returns the turtle
// segments ready to draw. Convenience wrapper over `expand` + `turtleSegments`.
function generate(spec, generations, opts = {}) {
    const commands = expand(spec.axiom, spec.rules, generations);
    return turtleSegments(commands, { angle: spec.angle, ...opts });
}

// Draws a list of `[x1, y1, x2, y2]` segments. The segments are already in
// canvas coordinates, so this is a thin loop over `p.line`.
function drawLSystem(p, segments) {
    p.push();
    for (const [x1, y1, x2, y2] of segments) {
        p.line(x1, y1, x2, y2);
    }
    p.pop();
}

module.exports = {
    expand,
    turtleSegments,
    generate,
    drawLSystem,
    PRESETS,
};
