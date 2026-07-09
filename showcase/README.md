# p5-toolkit showcase

A live gallery that renders every package in this monorepo as an interactive
p5.js sketch on a single page.

```bash
npm install      # from this directory
npm run dev      # http://localhost:5173  (or --port 5234 to match .claude/launch.json)
npm run build    # static build to dist/ (relative base, host-agnostic)
```

## How it works

- Each package is demoed by one sketch in [`src/sketches.js`](src/sketches.js), using
  only that package's public API (mirroring its README) so the tile is a faithful
  demo of what you get from npm.
- The packages are single-file CommonJS modules consumed straight from source via
  Vite aliases (see `vite.config.js`), so the showcase always reflects the working
  tree — no build of the packages needed. `p5` resolves from `node_modules`.
- Sketches are instantiated lazily when their card scrolls into view, and animated
  ones are paused (`noLoop`) while off screen, so seven canvases don't all compete
  for the main thread at once ([`src/main.js`](src/main.js)).

## Adding a package to the gallery

Add an entry to `SKETCHES` in `src/sketches.js` with `{ id, npm, title, blurb,
animated, build(p, size) }`, and an alias in `vite.config.js` pointing at the
package's source file. That's it — the gallery renders it automatically.
