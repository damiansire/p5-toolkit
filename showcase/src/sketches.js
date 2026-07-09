import { createBoid, flock, drawBoids } from 'boids-p5js';
import { buildFlowField, stepParticle } from 'flow-field-p5js';
import { drawMandala } from 'mandala-p5js';
import { drawAxis } from 'draw-axis-p5js';
import { palette, applyPalette } from 'color-palette-p5js';
import { randomGrid, step, drawGrid } from 'game-of-life-p5js';
import { generate, drawLSystem, PRESETS } from 'l-system-p5js';

const INK = [11, 16, 32];

/**
 * One entry per package. `build(p, size)` wires a p5 instance-mode sketch using
 * only the package's public API (mirroring each package README), so the tile is
 * a faithful live demo of what you get from npm. `animated` tells the gallery
 * whether the sketch needs the draw loop running while it is on screen.
 */
export const SKETCHES = [
    {
        id: 'boids',
        npm: 'boids-p5js',
        title: 'Boids',
        blurb: 'Flocking with separation, alignment and cohesion.',
        animated: true,
        build(p, { w, h }) {
            let boids;
            p.setup = () => {
                p.createCanvas(w, h);
                p.frameRate(30);
                boids = Array.from({ length: 70 }, () =>
                    createBoid(p.random(w), p.random(h), p.random(-2, 2), p.random(-2, 2)),
                );
            };
            p.draw = () => {
                p.background(...INK);
                p.noStroke();
                p.fill(226, 232, 245);
                boids = flock(boids, { width: w, height: h, maxSpeed: 3.2 });
                drawBoids(p, boids);
            };
        },
    },
    {
        id: 'flow-field',
        npm: 'flow-field-p5js',
        title: 'Flow field',
        blurb: 'Particles advected through a Perlin-noise field.',
        animated: true,
        build(p, { w, h }) {
            let field;
            let particles;
            p.setup = () => {
                p.createCanvas(w, h);
                p.background(...INK);
                p.frameRate(30);
                field = buildFlowField(p, 16, { noiseScale: 0.08, turns: 1 });
                particles = Array.from({ length: 420 }, () => ({ x: p.random(w), y: p.random(h) }));
            };
            p.draw = () => {
                p.stroke(140, 190, 255, 16);
                for (let i = 0; i < particles.length; i++) {
                    const next = stepParticle(particles[i], field, { speed: 1.3 });
                    p.line(particles[i].x, particles[i].y, next.x, next.y);
                    const off = next.x < 0 || next.x > w || next.y < 0 || next.y > h;
                    particles[i] = off ? { x: p.random(w), y: p.random(h) } : next;
                }
            };
        },
    },
    {
        id: 'game-of-life',
        npm: 'game-of-life-p5js',
        title: 'Game of Life',
        blurb: "Conway's cellular automaton, one generation per frame.",
        animated: true,
        build(p, { w, h }) {
            const cell = 9;
            const cols = Math.floor(w / cell);
            const rows = Math.floor(h / cell);
            let grid;
            const seed = () => randomGrid(cols, rows, 0.3, () => p.random());
            p.setup = () => {
                p.createCanvas(w, h);
                p.frameRate(12);
                grid = seed();
            };
            p.draw = () => {
                p.background(...INK);
                p.fill(0, 255, 140);
                drawGrid(p, grid, cell);
                grid = step(grid);
                if (p.frameCount % 260 === 0) grid = seed(); // keep the tile from stalling
            };
        },
    },
    {
        id: 'mandala',
        npm: 'mandala-p5js',
        title: 'Mandala',
        blurb: 'Radial symmetry: one wedge, replicated and mirrored.',
        animated: true,
        build(p, { w, h }) {
            const r = Math.min(w, h) * 0.48;
            p.setup = () => {
                p.createCanvas(w, h);
                p.frameRate(30);
            };
            p.draw = () => {
                p.background(...INK);
                // drawMandala centres itself on (cx, cy) — default the canvas centre. To
                // spin it in place we translate+rotate here and pass cx=cy=0 so it draws
                // around our already-centred, rotating origin (no double translation).
                p.push();
                p.translate(w / 2, h / 2);
                p.rotate(p.frameCount * 0.003);
                p.noFill();
                p.stroke(255, 216, 77, 170);
                p.strokeWeight(1.1);
                drawMandala(
                    p,
                    (pp) => {
                        pp.line(0, 0, 0, -r);
                        pp.circle(0, -r * 0.82, r * 0.3);
                        pp.circle(0, -r * 0.55, r * 0.18);
                        pp.circle(0, -r * 0.3, r * 0.1);
                        pp.line(0, -r * 0.55, r * 0.22, -r * 0.72);
                    },
                    { cx: 0, cy: 0, slices: 18, mirror: true },
                );
                p.pop();
            };
        },
    },
    {
        id: 'color-palette',
        npm: 'color-palette-p5js',
        title: 'Color palette',
        blurb: 'Harmony schemes from color theory (triadic, drifting hue).',
        animated: true,
        build(p, { w, h }) {
            p.setup = () => {
                p.createCanvas(w, h);
                p.frameRate(24);
                p.noStroke();
            };
            p.draw = () => {
                const hue = (p.frameCount * 0.5) % 360;
                const colors = applyPalette(p, palette(hue, 'triadic', { count: 3 }));
                const bw = w / colors.length;
                for (let i = 0; i < colors.length; i++) {
                    p.fill(colors[i]);
                    p.rect(i * bw, 0, bw + 1, h);
                }
            };
        },
    },
    {
        id: 'l-system',
        npm: 'l-system-p5js',
        title: 'L-system',
        blurb: 'Turtle-graphics fractal plant from a rewrite preset.',
        animated: false,
        build(p, { w, h }) {
            p.setup = () => {
                p.createCanvas(w, h);
                p.background(...INK);
                p.translate(w / 2, h);
                p.stroke(120, 230, 150);
                p.strokeWeight(1);
                const segments = generate(PRESETS.plant, 4, { length: h / 42 });
                drawLSystem(p, segments);
            };
        },
    },
    {
        id: 'draw-axis',
        npm: 'draw-axis-p5js',
        title: 'Draw axis',
        blurb: 'Labeled X/Y axes for plotting and teaching.',
        animated: false,
        build(p, { w, h }) {
            p.setup = () => {
                p.createCanvas(w, h);
                p.background(...INK);
                // drawAxis draws X from (0,0)->(width,0) and Y from (0,0)->(0,height):
                // origin at the corner, positive quadrant (as in the package README). A
                // small margin lifts the axes off the canvas edge so the ticks read.
                p.translate(10, 10);
                p.stroke(159, 176, 212);
                p.fill(159, 176, 212);
                drawAxis(p);
            };
        },
    },
];
