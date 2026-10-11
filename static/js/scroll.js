/* ================================================================
   Equinox ICL: scroll-driven behaviour
   - Reveal-on-scroll (`[data-reveal]` fades to .is-lit when visible)
   - Stats counter (`[data-count-to]` counts up once in view; supports
     `data-count-prefix`, `data-count-suffix`, `data-count-decimals`,
     and emits `count:tick` events on each frame)
   - [data-stagger] index assignment (each child gets --i = its index
     so children can cascade with the helper.css transition-delay rule)
   - SVG draw helper ([data-svg-draw]): sets stroke-dasharray and
     dashoffset to total length, removes offset on .is-lit
   - Scroll-progress bar (writes --p on .scroll-progress during scroll)
   ================================================================ */

(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Scroll-progress bar ----------
       --p tracks scroll progress 0..1 on the bar itself (not body, so a
       scroll frame never restyles the whole page). The bar is injected
       with the header, so it is looked up lazily. */
    {
        let ticking = false;
        let bar = null;
        const writeProgress = () => {
            ticking = false;
            bar = bar || document.querySelector('.scroll-progress');
            if (!bar) return;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
            bar.style.setProperty('--p', p.toFixed(4));
        };
        const onScroll = () => {
            if (!ticking) { requestAnimationFrame(writeProgress); ticking = true; }
        };
        if (!prefersReducedMotion) {
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });
            document.addEventListener('includes:loaded', writeProgress);
        }
    }

    /* ---------- [data-stagger] index assignment ----------
       Each direct child gets style.--i = its index, so the
       [data-stagger] > * { transition-delay: calc(var(--i)*80ms) }
       rule in helper.css produces a cascade when the parent lights up. */
    const indexStaggerChildren = (root = document) => {
        root.querySelectorAll('[data-stagger]:not([data-staggered])').forEach((parent) => {
            parent.dataset.staggered = '1';
            Array.from(parent.children).forEach((child, i) => {
                child.style.setProperty('--i', i);
            });
        });
    };
    indexStaggerChildren();
    window._equinoxIndexStagger = indexStaggerChildren;

    /* ---------- SVG draw helper ----------
       For every [data-svg-draw] element (a <path>, <line>, <polyline>,
       or <circle>): measure its length, prime stroke-dasharray /
       stroke-dashoffset, and add a CSS transition. The .is-lit class
       (added when the parent enters view, or directly via observer)
       flips dashoffset to 0 to "draw" the stroke. */
    const initSvgDraw = (el) => {
        if (!el || !el.getTotalLength) return;
        const len = el.getTotalLength();
        if (!len) return;
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
        // Allow the per-element override of duration via data-svg-draw="<ms>"
        const dur = Number(el.dataset.svgDraw) || 1100;
        el.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.2, .8, .2, 1)`;
    };
    const svgDrawTargets = document.querySelectorAll('[data-svg-draw]');
    svgDrawTargets.forEach((el) => {
        initSvgDraw(el);
        if (prefersReducedMotion) {
            el.style.transition = 'none';
            el.style.strokeDashoffset = '0';
        }
    });

    /* ---------- Reveal on scroll ---------- */
    let revealObserver = null;
    const observeReveals = (root = document) => {
        const targets = root.querySelectorAll('[data-reveal]:not([data-revealed])');
        if (!targets.length) return;
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            targets.forEach(el => {
                el.dataset.revealed = '1';
                el.classList.add('is-lit');
                el.querySelectorAll('[data-svg-draw]').forEach(s => { s.style.strokeDashoffset = '0'; });
            });
            return;
        }
        if (!revealObserver) {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-lit');
                        // Trigger descendant SVG draws by clearing dashoffset.
                        entry.target.querySelectorAll('[data-svg-draw]').forEach((s) => {
                            const stagger = Number(s.dataset.svgDelay) || 0;
                            setTimeout(() => { s.style.strokeDashoffset = '0'; }, stagger);
                        });
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
        }
        targets.forEach(el => {
            el.dataset.revealed = '1';
            revealObserver.observe(el);
        });
    };
    observeReveals();
    // Public hook for late-mounted DOM (e.g. generateProjects.js).
    window._equinoxObserveReveals = observeReveals;

    /* ---------- Stats counter ----------
       Reads data-count-to (number), optional data-count-prefix /
       suffix / decimals. Emits a `count:tick` CustomEvent on each
       frame so visualisations can sync (year-rail, etc). */
    const counters = document.querySelectorAll('[data-count-to]');
    if (counters.length) {
        const animate = (el) => {
            const target = Number(el.dataset.countTo) || 0;
            const prefix = el.dataset.countPrefix || '';
            const suffix = el.dataset.countSuffix || '';
            const decimals = Math.max(0, Number(el.dataset.countDecimals) || 0);
            const fmt = (v) => prefix + v.toLocaleString('en-GB', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            }) + suffix;

            if (prefersReducedMotion) {
                el.textContent = fmt(target);
                el.dispatchEvent(new CustomEvent('count:tick', { detail: { value: target, progress: 1 } }));
                return;
            }
            const duration = 1200;
            const start = performance.now();
            const from = 0;
            const tick = (now) => {
                const p = Math.min((now - start) / duration, 1);
                // easeOutQuad
                const eased = 1 - (1 - p) * (1 - p);
                const value = from + (target - from) * eased;
                el.textContent = fmt(value);
                el.dispatchEvent(new CustomEvent('count:tick', { detail: { value, progress: p } }));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(el => io.observe(el));
    }
})();
