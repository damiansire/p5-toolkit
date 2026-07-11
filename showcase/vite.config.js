import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));

// The packages are single-file CommonJS modules; alias each name to its source
// file so the showcase consumes the working tree directly (and sidesteps the
// repo's stale node_modules workspace symlinks). p5 resolves from node_modules.
//
// draw-axis-p5js is the one package actually published to npm, but the
// published artifact (v1.0.0) is a stale, pre-rewrite implementation: global
// p5-mode functions, no `module.exports`, no instance-mode `p` parameter. It
// cannot satisfy `import { drawAxis } from 'draw-axis-p5js'` at all (nothing
// is exported), let alone the `drawAxis(p)` call this showcase makes. Pointing
// the showcase at the real npm package would break the build or force a
// feature regression, so it stays aliased to source like the rest until the
// package is republished with the current implementation (a real `npm
// publish`, out of scope here, see README "Estado de publicación").
export default defineConfig({
    base: './',
    resolve: {
        alias: {
            'boids-p5js': here('../packages/boids/boids-p5js.js'),
            'flow-field-p5js': here('../packages/flow-field/flow-field-p5js.js'),
            'mandala-p5js': here('../packages/mandala/mandala-p5js.js'),
            'draw-axis-p5js': here('../packages/draw-axis/draw-axis-p5js.js'),
            'color-palette-p5js': here('../packages/color-palette/color-palette-p5js.js'),
            'game-of-life-p5js': here('../packages/game-of-life/game-of-life-p5js.js'),
            'l-system-p5js': here('../packages/l-system/l-system-p5js.js'),
        },
    },
    // The packages are single-file CommonJS modules that live outside node_modules
    // (aliased above), so Vite/Rollup would not apply its CJS->ESM interop to them
    // by default and named imports would fail at build. Include them explicitly.
    build: {
        commonjsOptions: {
            include: [/packages[\\/].*-p5js\.js$/, /node_modules/],
            transformMixedEsModules: true,
        },
    },
    optimizeDeps: {
        include: [
            'boids-p5js',
            'flow-field-p5js',
            'mandala-p5js',
            'draw-axis-p5js',
            'color-palette-p5js',
            'game-of-life-p5js',
            'l-system-p5js',
        ],
    },
});
