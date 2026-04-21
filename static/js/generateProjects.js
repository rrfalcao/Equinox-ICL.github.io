/* ================================================================
   Renders the Projects archive as a stacked long-read.
   Each project becomes an <article class="chapter"> with a sticky
   image column and a scrolling meta/body/outcomes column.
   Alternating chapters flip left/right for rhythm.

   Project schema (static/json/projects.json):
   {
     title, year, tag, imageStem, imageWidths, imageAlt,
     description, description2, outcomes: string[]
   }
   - imageStem:  base path for image derivatives (e.g. "static/images/2024")
   - imageWidths: widths available as -<w>w.webp / -<w>w.jpg derivatives
   ================================================================ */

(() => {
    'use strict';

    const mount = document.getElementById('contentDiv');
    if (!mount) return;

    fetch('static/json/projects.json')
        .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
        .then(render)
        .catch(err => {
            console.error('generateProjects: failed to load projects.json', err);
            mount.innerHTML = '<p class="chapter__error">Could not load projects. Please try again later.</p>';
        });

    function render(projects) {
        const frag = document.createDocumentFragment();

        const intro = document.createElement('header');
        intro.className = 'projects-intro';
        intro.innerHTML = `
            <p class="eyebrow">The archive</p>
            <h1 class="display">Fifteen years of projects.</h1>
            <p class="projects-intro__copy">
              Every e.quinox expedition is engineered at Imperial, tested by
              students in the field, and handed over to Rwandan partners who
              run it for the long haul. Below: each chapter of that work.
            </p>
        `;
        frag.appendChild(intro);

        projects.forEach((p, i) => frag.appendChild(buildChapter(p, i)));

        mount.replaceChildren(frag);
    }

    function buildChapter(p, index) {
        const chapter = document.createElement('article');
        chapter.className = 'chapter' + (index % 2 ? ' chapter--flip' : '');
        chapter.dataset.year = p.year;

        const sticky = document.createElement('div');
        sticky.className = 'chapter__image';
        sticky.appendChild(buildPicture(p));

        const body = document.createElement('div');
        body.className = 'chapter__meta';
        body.appendChild(buildMeta(p));

        chapter.appendChild(sticky);
        chapter.appendChild(body);
        return chapter;
    }

    function buildPicture(p) {
        const fig = document.createElement('figure');
        const pic = document.createElement('picture');

        const widths = Array.isArray(p.imageWidths) && p.imageWidths.length
            ? p.imageWidths
            : [800, 1600];

        const webpSrcset = widths.map(w => `${p.imageStem}-${w}w.webp ${w}w`).join(', ');
        const jpgSrcset  = widths.map(w => `${p.imageStem}-${w}w.jpg ${w}w`).join(', ');

        const source = document.createElement('source');
        source.type = 'image/webp';
        source.srcset = webpSrcset;
        source.sizes = '(max-width: 900px) 100vw, 50vw';
        pic.appendChild(source);

        const img = document.createElement('img');
        img.srcset = jpgSrcset;
        img.sizes = '(max-width: 900px) 100vw, 50vw';
        img.src = `${p.imageStem}-${widths[widths.length - 1]}w.jpg`;
        img.alt = p.imageAlt || p.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        pic.appendChild(img);

        fig.appendChild(pic);

        const cap = document.createElement('figcaption');
        cap.className = 'caption';
        cap.textContent = `Rwanda · ${p.year}`;
        fig.appendChild(cap);

        return fig;
    }

    function buildMeta(p) {
        const wrap = document.createDocumentFragment();

        const year = document.createElement('p');
        year.className = 'chapter__year display';
        year.textContent = p.year;
        wrap.appendChild(year);

        if (p.tag) {
            const tag = document.createElement('p');
            tag.className = 'eyebrow';
            tag.textContent = p.tag;
            wrap.appendChild(tag);
        }

        const title = document.createElement('h2');
        title.className = 'chapter__title display';
        title.textContent = p.title;
        wrap.appendChild(title);

        if (p.description) {
            const para = document.createElement('p');
            para.className = 'chapter__copy';
            para.textContent = p.description;
            wrap.appendChild(para);
        }
        if (p.description2) {
            const para = document.createElement('p');
            para.className = 'chapter__copy';
            para.textContent = p.description2;
            wrap.appendChild(para);
        }

        if (Array.isArray(p.outcomes) && p.outcomes.length) {
            const oHead = document.createElement('p');
            oHead.className = 'eyebrow chapter__outcomes-head';
            oHead.textContent = 'Outcomes';
            wrap.appendChild(oHead);

            const ul = document.createElement('ul');
            ul.className = 'chapter__outcomes';
            p.outcomes.forEach(o => {
                const li = document.createElement('li');
                li.textContent = o;
                ul.appendChild(li);
            });
            wrap.appendChild(ul);
        }

        return wrap;
    }
})();
