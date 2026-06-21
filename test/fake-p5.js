// Shared fake p5 for testing the draw* helpers without a canvas. It records
// every call so a test can assert push/pop balance, that no global style leaks
// outside a push/pop pair, and what geometry was drawn.
//
// Dev-only: it lives outside `packages/` and is never in any package's `files`
// allowlist, so it never ships to npm and creates no runtime cross-package
// dependency. The packages stay independent.

const RECORDED = [
    "push",
    "pop",
    "line",
    "rect",
    "point",
    "text",
    "fill",
    "stroke",
    "strokeWeight",
    "noStroke",
    "noFill",
    "textSize",
    "translate",
    "rotate",
    "scale",
    "triangle",
    "circle",
    "color",
];

const STYLE_METHODS = /^(stroke|fill|strokeWeight|noStroke|noFill|textSize)$/;

function fakeP5({ width = 200, height = 200 } = {}) {
    const calls = [];
    let depth = 0;
    let minDepth = 0;
    const styleOutsidePush = [];

    const p = {
        width,
        height,
        calls,
        get depth() {
            return depth;
        },
        get minDepth() {
            return minDepth;
        },
        get styleOutsidePush() {
            return styleOutsidePush;
        },
        // Count how many times a given method was called.
        count(name) {
            return calls.filter((c) => c[0] === name).length;
        },
        // True when every push has a matching pop and we never popped too far.
        balanced() {
            return depth === 0 && minDepth === 0 && p.count("push") === p.count("pop");
        },
    };

    for (const name of RECORDED) {
        p[name] =
            name === "color"
                ? // `color` returns a value the sketch keeps; model it as an {r,g,b} tag.
                  (r, g, b) => {
                      calls.push(["color", r, g, b]);
                      return { r, g, b };
                  }
                : (...args) => {
                      if (name === "push") depth++;
                      else if (name === "pop") {
                          depth--;
                          if (depth < minDepth) minDepth = depth;
                      } else if (STYLE_METHODS.test(name) && depth === 0) {
                          styleOutsidePush.push(name);
                      }
                      calls.push([name, ...args]);
                  };
    }

    return p;
}

module.exports = { fakeP5 };
