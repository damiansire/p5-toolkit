# p5-toolkit

Creative-coding utilities for [p5.js](https://p5js.org/), organized as an npm-workspaces monorepo. Each package is published to npm under its own name, but they evolve together here.

## Packages

| Package | npm | What it does |
|---|---|---|
| [`draw-axis`](packages/draw-axis) | [npm](https://www.npmjs.com/package/draw-axis-p5js) | Draw coordinate axes in p5.js sketches. |

## Conventions

Every package follows the same shape so they stay easy to publish and maintain:

- Takes the **p5 instance as an argument** (works in instance mode and global
  mode) — never reaches into `window` or assumes global mode.
- `p5` is a **peer dependency** (`^1.0.0`), never a hard dependency.
- An `exports` map + a `files` allowlist so the published tarball ships only the
  source, README and LICENSE.
- Pure, p5-free logic split out into testable functions, covered by
  `node --test` (no canvas needed).

## Roadmap

`draw-axis` is the first published utility. Candidate additions (only when each
is genuinely useful and tested, not to inflate the monorepo):

- A grid / ruler helper.
- Coordinate-mapping utilities (screen ↔ world space).
- Small color / palette helpers.

## Development

```bash
npm ci
npm test --workspaces --if-present     # run every package's tests
npm pack --workspaces --dry-run        # validate the publishable tarballs
```

CI (`.github/workflows/ci.yml`) runs the test + build matrix (Node 18/20/22) and
a `npm pack` dry-run on every push and pull request.
