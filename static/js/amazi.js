/* ================================================================
   Equinox ICL - Project Amazi page interactions
   - Yield chart: month readout on hover/tap, province focus
   - Province map <-> table focus linking
   - System diagram markers <-> parts list
   - Chapter nav: highlight the section in view
   ================================================================ */

(() => {
    'use strict';

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                    'August', 'September', 'October', 'November', 'December'];

    /* ---------- Yield chart ---------- */
    const chart = document.querySelector('[data-yield]');
    const list = document.querySelector('[data-yield-list]');
    const title = document.querySelector('[data-yield-title]');
    if (chart && list && title) {
        const series = Array.from(chart.querySelectorAll('.series')).map((g) => ({
            el: g,
            name: g.dataset.name,
            color: g.dataset.color,
            values: g.dataset.values.split(',').map(Number),
        }));
        const avg = (v) => v.reduce((a, b) => a + b, 0) / v.length;
        const cursor = chart.querySelector('.cursor');
        const hit = chart.querySelector('.hit');
        const firstDot = (s, i) => s.el.querySelectorAll('circle')[i];

        const render = (month) => {
            title.textContent = month == null ? 'Year average' : MONTHS[month];
            list.innerHTML = series
                .map((s) => {
                    const v = month == null ? avg(s.values) : s.values[month];
                    const low = v < 40 ? ' class="is-low"' : '';
                    return `<li data-name="${s.name}"><span><i style="background:${s.color}"></i>${s.name}</span><b${low}>${Math.round(v)}%</b></li>`;
                })
                .join('');
        };
        render(null);

        const setFocus = (name) => {
            chart.classList.toggle('has-focus', !!name);
            series.forEach((s) => s.el.classList.toggle('is-focus', s.name === name));
            list.querySelectorAll('li').forEach((li) => li.classList.toggle('is-focus', li.dataset.name === name));
        };
        list.addEventListener('pointerover', (e) => {
            const li = e.target.closest('li');
            if (li) setFocus(li.dataset.name);
        });
        list.addEventListener('pointerleave', () => setFocus(null));

        const toMonth = (evt) => {
            const pt = chart.createSVGPoint();
            pt.x = evt.clientX;
            pt.y = evt.clientY;
            const p = pt.matrixTransform(chart.getScreenCTM().inverse());
            const s0 = series[0];
            const x0 = Number(firstDot(s0, 0).getAttribute('cx'));
            const x11 = Number(firstDot(s0, 11).getAttribute('cx'));
            const i = Math.round((p.x - x0) / ((x11 - x0) / 11));
            return { i: Math.max(0, Math.min(11, i)), x0, step: (x11 - x0) / 11 };
        };
        const onMove = (evt) => {
            const { i, x0, step } = toMonth(evt);
            const x = x0 + i * step;
            cursor.setAttribute('x1', x);
            cursor.setAttribute('x2', x);
            chart.classList.add('is-hover');
            render(i);
        };
        hit.addEventListener('pointermove', onMove);
        hit.addEventListener('pointerdown', onMove);
        hit.addEventListener('pointerleave', () => {
            chart.classList.remove('is-hover');
            render(null);
        });
    }

    /* ---------- Province map <-> table ---------- */
    const map = document.querySelector('.map');
    const rows = document.querySelectorAll('.prov-table tbody tr');
    if (map && rows.length) {
        const focus = (name) => {
            map.classList.toggle('has-focus', !!name);
            map.querySelectorAll('.prov').forEach((p) => p.classList.toggle('is-focus', p.dataset.prov === name));
            rows.forEach((r) => r.classList.toggle('is-focus', r.dataset.prov === name));
        };
        rows.forEach((r) => {
            r.addEventListener('pointerenter', () => focus(r.dataset.prov));
            r.addEventListener('pointerleave', () => focus(null));
        });
        map.querySelectorAll('.prov').forEach((p) => {
            p.addEventListener('pointerenter', () => focus(p.dataset.prov));
            p.addEventListener('pointerleave', () => focus(null));
        });
    }

    /* ---------- Diagram markers <-> parts list ---------- */
    const parts = document.querySelectorAll('.parts li[data-part]');
    const markers = document.querySelectorAll('.diagram .marker');
    if (parts.length && markers.length) {
        const on = (n) => {
            parts.forEach((li) => li.classList.toggle('is-on', li.dataset.part === n));
            markers.forEach((m) => m.classList.toggle('is-on', m.dataset.part === n));
        };
        parts.forEach((li) => {
            li.addEventListener('pointerenter', () => on(li.dataset.part));
            li.addEventListener('pointerleave', () => on(null));
        });
        markers.forEach((m) => {
            m.addEventListener('pointerenter', () => on(m.dataset.part));
            m.addEventListener('pointerleave', () => on(null));
        });
    }

    /* ---------- Chapter nav ---------- */
    const links = document.querySelectorAll('.chapters a');
    if (links.length && 'IntersectionObserver' in window) {
        const byId = new Map(Array.from(links).map((a) => [a.getAttribute('href').slice(1), a]));
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                links.forEach((a) => a.classList.remove('is-active'));
                const a = byId.get(e.target.id);
                if (a) {
                    a.classList.add('is-active');
                    const ol = a.closest('ol');
                    ol.scrollTo({ left: a.offsetLeft - ol.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        byId.forEach((_, id) => {
            const s = document.getElementById(id);
            if (s) io.observe(s);
        });
    }
})();
