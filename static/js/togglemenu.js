function highlightMenu() {
    const menu = document.getElementById('headerList');
    if (!menu) return;
    // "/", "/index.html" -> home; "/amazi" or "/amazi.html" -> amazi
    const page = (window.location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
    const current = page === 'index' ? 'home' : page;
    for (const child of menu.children) {
        if (child.getAttribute('name') === current) {
            child.classList.remove('rust');
            child.classList.add('darkrust');
            child.setAttribute('aria-current', 'page');
            break;
        }
    }
}

document.addEventListener('includes:loaded', highlightMenu);

function wireMobileMenu() {
    const header = document.querySelector('.header');
    const button = document.querySelector('.header__menu');
    if (!header || !button) return;
    const setOpen = (open) => {
        header.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    button.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
    header.querySelectorAll('.nav-buttons a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) setOpen(false); });
}

document.addEventListener('includes:loaded', wireMobileMenu);
