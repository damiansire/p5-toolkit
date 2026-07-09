import './style.css';
import p5 from 'p5';
import { SKETCHES } from './sketches.js';

const NPM_BASE = 'https://www.npmjs.com/package/';

/** Builds a gallery card for one sketch and returns its canvas host element. */
function renderCard(sketch) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
    <div class="card__stage" data-host></div>
    <div class="card__meta">
      <div class="card__row">
        <h2 class="card__title">${sketch.title}</h2>
        <a class="card__npm" href="${NPM_BASE}${sketch.npm}" target="_blank" rel="noreferrer noopener">${sketch.npm}</a>
      </div>
      <p class="card__blurb">${sketch.blurb}</p>
    </div>`;
    document.querySelector('#gallery').append(card);
    return card.querySelector('[data-host]');
}

/** Computes an integer canvas size from the host's laid-out width. */
function sizeOf(host) {
    const w = Math.max(240, Math.round(host.clientWidth));
    return { w, h: Math.round(w * 0.72) };
}

/**
 * Lazily instantiates each sketch when its card first scrolls into view, and
 * pauses animated sketches while they are off screen. Seven simultaneous p5
 * canvases running at 60fps would tax the main thread; only the visible,
 * animated ones keep looping.
 */
function mountGallery() {
    const instances = new Map(); // sketch.id -> { p, sketch }

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                const id = entry.target.dataset.sketch;
                const record = instances.get(id);
                if (!record) continue;
                if (!record.sketch.animated) continue;
                if (entry.isIntersecting) record.p.loop();
                else record.p.noLoop();
            }
        },
        { threshold: 0.1 },
    );

    for (const sketch of SKETCHES) {
        const host = renderCard(sketch);
        host.dataset.sketch = sketch.id;

        // Create the instance once the card is near the viewport, then hand the
        // card over to the play/pause observer.
        const primer = new IntersectionObserver(
            (entries, obs) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                obs.disconnect();
                const size = sizeOf(host);
                const instance = new p5((p) => sketch.build(p, size), host);
                instances.set(sketch.id, { p: instance, sketch });
                observer.observe(host);
            },
            { rootMargin: '200px' },
        );
        primer.observe(host);
    }
}

mountGallery();
