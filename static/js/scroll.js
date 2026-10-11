/* ================================================================
   Equinox ICL — scroll-driven behaviour
   - Reveal-on-scroll (`[data-reveal]` fades to .is-lit when visible)
   - Stats counter (`[data-count-to]` counts up once in view; supports
     `data-count-prefix`, `data-count-suffix`, `data-count-decimals`,
     and emits `count:tick` events on each frame)
   - [data-stagger] index assignment (each child gets --i = its index
     so children can cascade with the helper.css transition-delay rule)
   - Hero scroll parallax (logo rises, copy drifts, bg parallaxes)
   - SVG draw helper ([data-svg-draw]) — sets stroke-dasharray and
     dashoffset to total length, removes offset on .is-lit
   - Scroll-progress bar (writes --p on body during scroll)
   - Spotlight cursor on [data-spotlight]
   ================================================================ */

(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Scroll-progress bar ----------
       Body-level CSS var --p tracks scroll progress 0..1. The bar at
       the top of the header reads this and scales horizontally. */
    {
        let ticking = false;
        const writeProgress = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
            document.body.style.setProperty('--p', p.toFixed(4));
            ticking = false;
        };
        const onScroll = () => {
            if (!ticking) { requestAnimationFrame(writeProgress); ticking = true; }
        };
        if (!prefersReducedMotion) {
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });
            writeProgress();
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

    /* ---------- Hero scroll animation ----------
       Logo rises, scales down, and fades as the user scrolls past the
       hero. The headline/eyebrow drift up slightly slower, and the
       background image runs a gentle parallax. Load animations (see
       index.css) play for the first ~1.7s; the scroll handler holds off
       until then so it never fights the entrance. */
    const heroEl = document.querySelector('.hero');
    const heroLogo = document.querySelector('.hero__logo');
    const heroCopy = document.querySelector('.hero__copy');
    const heroBgImg = document.querySelector('.hero__bg img');
    const heroScrollCue = document.querySelector('.hero__scroll-cue');

    if (heroEl && !prefersReducedMotion) {
        const startHeroParallax = () => {
            let ticking = false;
            const apply = () => {
                const rect = heroEl.getBoundingClientRect();
                const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);

                if (heroLogo) {
                    const y = -progress * 80;                     // rises
                    const scale = 1 - progress * 0.35;            // shrinks
                    const op = Math.max(0, 1 - progress * 1.35);  // fades
                    heroLogo.style.transform = `translateY(${y}px) scale(${scale})`;
                    heroLogo.style.opacity = String(op);
                }
                if (heroCopy) {
                    const y = -progress * 50;
                    const op = Math.max(0, 1 - progress * 1.6);
                    heroCopy.style.transform = `translateY(${y}px)`;
                    heroCopy.style.opacity = String(op);
                }
                if (heroBgImg) {
                    const y = progress * 40;                      // parallax
                    const scale = 1 + progress * 0.05;            // slight zoom
                    heroBgImg.style.transform = `translateY(${y}px) scale(${scale})`;
                }
                if (heroScrollCue) {
                    heroScrollCue.style.opacity = String(Math.max(0, 1 - progress * 3));
                }
                ticking = false;
            };
            const onScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(apply);
                    ticking = true;
                }
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });
            apply();
        };

        // Delay until the CSS load animations finish so JS transforms
        // don't override them mid-flight.
        setTimeout(startHeroParallax, 1700);
    }

    /* ---------- Spotlight cursor ----------
       Scoped to [data-spotlight] sections.
       - Desktop with fine pointer: follow the cursor.
       - Touch / coarse pointer: CSS runs a slow diagonal drift (fallback).
       - Reduced motion: disabled entirely via CSS. */
    const spotlights = document.querySelectorAll('[data-spotlight]');
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (spotlights.length && canHover && !prefersReducedMotion) {
        spotlights.forEach((el) => {
            let ticking = false;
            let lastX = 0, lastY = 0;
            const apply = () => {
                el.style.setProperty('--mx', lastX + 'px');
                el.style.setProperty('--my', lastY + 'px');
                ticking = false;
            };
            el.addEventListener('pointerenter', (e) => {
                const rect = el.getBoundingClientRect();
                lastX = e.clientX - rect.left;
                lastY = e.clientY - rect.top;
                apply();
                el.classList.add('is-lit');
            });
            el.addEventListener('pointermove', (e) => {
                const rect = el.getBoundingClientRect();
                lastX = e.clientX - rect.left;
                lastY = e.clientY - rect.top;
                if (!ticking) { requestAnimationFrame(apply); ticking = true; }
            });
            el.addEventListener('pointerleave', () => {
                el.classList.remove('is-lit');
            });
        });
    }
})();
