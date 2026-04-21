/* ================================================================
   Equinox ICL — scroll-driven behaviour
   - Reveal-on-scroll (`[data-reveal]` fades to .is-lit when visible)
   - Stats counter (`[data-count-to]` counts up once in view)
   - 15-year arc scroll scrub (Phase 3)
   - SVG wire thread scroll draw (Phase 3)
   - Spotlight cursor on [data-spotlight] (Phase 3)
   ================================================================ */

(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Reveal on scroll ---------- */
    const revealTargets = document.querySelectorAll('[data-reveal]');
    if (revealTargets.length) {
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            revealTargets.forEach(el => el.classList.add('is-lit'));
        } else {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-lit');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });
            revealTargets.forEach(el => io.observe(el));
        }
    }

    /* ---------- Stats counter ---------- */
    const counters = document.querySelectorAll('[data-count-to]');
    if (counters.length) {
        const animate = (el) => {
            const target = Number(el.dataset.countTo) || 0;
            if (prefersReducedMotion) { el.textContent = target.toString(); return; }
            const duration = 1200;
            const start = performance.now();
            const from = 0;
            const tick = (now) => {
                const p = Math.min((now - start) / duration, 1);
                // easeOutQuad
                const eased = 1 - (1 - p) * (1 - p);
                el.textContent = Math.round(from + (target - from) * eased).toString();
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

    /* ---------- 15-year arc scroll scrub ---------- */
    const arc = document.querySelector('.arc');
    const arcSlides = arc ? arc.querySelectorAll('.arc__slide') : [];
    const arcTicks = arc ? arc.querySelectorAll('.arc__rail-tick') : [];
    if (arc && arcSlides.length) {
        let activeIdx = -1;
        const setActive = (idx) => {
            if (idx === activeIdx) return;
            activeIdx = idx;
            arcSlides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
            arcTicks.forEach((t, i) => t.classList.toggle('is-active', i === idx));
        };
        // Start on first slide
        setActive(0);

        const update = () => {
            const rect = arc.getBoundingClientRect();
            const vh = window.innerHeight;
            const runway = rect.height - vh;
            if (runway <= 0) { setActive(0); return; }
            const progress = Math.min(Math.max(-rect.top / runway, 0), 1);
            const idx = Math.min(Math.floor(progress * arcSlides.length), arcSlides.length - 1);
            setActive(idx);
        };

        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => { update(); ticking = false; });
                ticking = true;
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        update();
    }

    /* ---------- SVG wire thread scroll scrub ---------- */
    const wireSvg = document.querySelector('.wire');
    const wire = wireSvg ? wireSvg.querySelector('path') : null;
    if (wireSvg && wire && !prefersReducedMotion) {
        const setup = () => {
            try {
                const length = wire.getTotalLength();
                wire.style.strokeDasharray = String(length);
                wire.style.strokeDashoffset = String(length);
                wireSvg.style.opacity = '1';

                // Waypoints — the three emotional beats of the page.
                const waypointSelectors = ['#arc', '#impact', '#join'];
                const waypoints = waypointSelectors
                    .map(sel => document.querySelector(sel))
                    .filter(Boolean);
                const triggered = new WeakSet();

                const update = () => {
                    const doc = document.documentElement;
                    const max = doc.scrollHeight - window.innerHeight;
                    const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
                    wire.style.strokeDashoffset = String(length * (1 - p));

                    // Fire a brief glow when a waypoint crosses viewport midpoint.
                    const mid = window.innerHeight * 0.5;
                    waypoints.forEach(wp => {
                        if (triggered.has(wp)) return;
                        const top = wp.getBoundingClientRect().top;
                        if (top < mid && top > -wp.getBoundingClientRect().height) {
                            wireSvg.classList.add('is-glowing');
                            triggered.add(wp);
                            setTimeout(() => wireSvg.classList.remove('is-glowing'), 1100);
                        }
                    });
                };
                let ticking = false;
                const onScroll = () => {
                    if (!ticking) {
                        requestAnimationFrame(() => { update(); ticking = false; });
                        ticking = true;
                    }
                };
                window.addEventListener('scroll', onScroll, { passive: true });
                window.addEventListener('resize', onScroll, { passive: true });
                update();
            } catch (e) { /* getTotalLength not supported — skip */ }
        };
        if (document.readyState === 'complete') setup();
        else window.addEventListener('load', setup, { once: true });
    }

    /* ---------- Spotlight cursor ----------
       The "lamp" effect — scoped to [data-spotlight] sections.
       - Desktop with fine pointer: follow the cursor.
       - Touch / coarse pointer: CSS runs a slow diagonal drift (fallback).
       - Reduced motion: disabled entirely via CSS.
       Overlay is dormant until .is-lit is added on pointerenter — this
       keeps the section looking normal on first paint. */
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
