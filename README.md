# p5-toolkit

Creative-coding utilities for [p5.js](https://p5js.org/), organized as an npm-workspaces monorepo. Each package lives here under its own name and evolves alongside the others; `draw-axis` is published to npm today, and the rest are built and tested in the monorepo, ready to publish as they stabilise.

[![p5-toolkit showcase: boids, a flow field, Game of Life, a mandala, a drifting colour palette, an L-system plant and plotting axes — each a live p5.js sketch](docs/showcase.png)](https://damiansire.github.io/p5-toolkit/)

<p align="center"><em>Every package, rendered live in the <a href="https://damiansire.github.io/p5-toolkit/">showcase</a> gallery — boids, flow fields, Game of Life, mandalas, colour palettes, L-systems and plotting axes.</em></p>

## Showcase

**Live demo: <https://damiansire.github.io/p5-toolkit/>** — every package rendered as
an interactive p5.js sketch on one page (boids flocking, a flow field, Game of Life, a
spinning mandala, an L-system plant, drifting palettes and plotting axes). Sketches are
instantiated lazily and paused off-screen. The source lives in [`showcase/`](showcase)
and deploys to GitHub Pages on every push (`.github/workflows/pages.yml`).

Run it locally:

```bash
cd showcase && npm install && npm run dev
```

## Packages

Only `draw-axis` is published to npm so far. The other six are fully built and tested
in this monorepo and will get their own npm packages as they stabilise — until then,
use them from source (the "Package" column links to each one's code and README).

| Package                                   | npm                                                              | What it does                                      |
| ----------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| [`draw-axis`](packages/draw-axis)         | [`draw-axis-p5js`](https://www.npmjs.com/package/draw-axis-p5js) | Draw coordinate axes in p5.js sketches.           |
| [`flow-field`](packages/flow-field)       | _not yet published_                                              | Perlin-noise flow fields + particle advection.    |
| [`l-system`](packages/l-system)           | _not yet published_                                              | L-systems and turtle-graphics fractal plants.     |
| [`game-of-life`](packages/game-of-life)   | _not yet published_                                              | Conway's Game of Life and B/S cellular automata.  |
| [`boids`](packages/boids)                 | _not yet published_                                              | Boids flocking (separation, alignment, cohesion). |
| [`color-palette`](packages/color-palette) | _not yet published_                                              | Generative palettes from color-theory harmonies.  |
| [`mandala`](packages/mandala)             | _not yet published_                                              | Radial-symmetry mandala / kaleidoscope patterns.  |

> **Known drift:** the published `draw-axis-p5js@1.0.0` on npm is a stale,
> pre-rewrite build (global p5-mode functions, no `module.exports`, no
> instance-mode `p` parameter) and does not match the current source in
> `packages/draw-axis`. The showcase therefore still imports `draw-axis`
> from source like the other six, not from npm, until the package is
> republished. Republishing is a real `npm publish` and only happens on
> explicit request.

## Conventions

Every package follows the same shape so they stay easy to publish and maintain:

- Takes the **p5 instance as an argument** (works in instance mode and global
  mode) — never reaches into `window` or assumes global mode.
- `p5` is a **peer dependency** (`^1.0.0`), never a hard dependency.
- An `exports` map + a `files` allowlist so the published tarball ships only the
  source, README and LICENSE.
- Pure, p5-free logic split out into testable functions, covered by
  `node --test` (no canvas needed).

Performance at scale (measured, not assumed) is covered for `boids` (the
package where it matters most) in [`docs/benchmarks.md`](docs/benchmarks.md).

## TypeScript migration

**Status: 1 of 7 packages migrated (`draw-axis`).** This is a large migration
(each package needs real typing, a build step and updated `exports`/`files`,
not just renaming `.js` to `.ts`), so it's being done incrementally instead of
all at once with `any` sprinkled in to fake completeness.

`draw-axis` went first because it's the smallest package (49 lines) and the
only one already published to npm, so it's the cheapest place to prove the
whole toolchain end to end (per-package `tsconfig.json` extending a shared
`tsconfig.base.json`, `tsc` build to `dist/` with `.d.ts` output, ESLint via
`@typescript-eslint` with type-checked rules, `node --test` against the
compiled output) before rolling it out further. It ships strict types with no
`any`, a `P5Like` interface for the p5 surface it actually uses (not the full
`p5` type), and its tests migrated to TypeScript too. `npm run build`,
`npm run lint`, `npm run format:check` and `npm test` all stay green.

The other six (`boids`, `color-palette`, `flow-field`, `game-of-life`,
`l-system`, `mandala`) are still plain JS. Smallest-first is the plan for
finishing the rollout, so the next candidates are `mandala` (112 lines) and
`game-of-life` (116 lines); `boids` (201 lines, the largest) is last.

## Roadmap

`draw-axis` was the first utility and is the only one published to npm so far; a
family of generative-art modules (flow fields, L-systems, cellular automata, boids,
palettes, mandalas) followed in the monorepo and will be published as they stabilise.
Candidate additions (only when each is genuinely useful and tested, not to
inflate the monorepo):

- A grid / ruler helper.
- Coordinate-mapping utilities (screen ↔ world space).
- More creative-coding modules (reaction-diffusion, Voronoi art, perfect noise
  loops, generative typography).

## Development

```bash
npm ci
npm run lint                           # eslint over the whole monorepo
npm run format:check                   # prettier --check (formatting gate)
npm test --workspaces --if-present     # run every package's tests
npm pack --workspaces --dry-run        # validate the publishable tarballs
```

CI (`.github/workflows/ci.yml`) runs four blocking jobs on every push and pull
request: `lint` (eslint), `format` (`prettier --check`), the `test` + build
matrix (Node 18/20/22), and a `npm pack` dry-run.
