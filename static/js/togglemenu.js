function highlightMenu() {
    const menu = document.getElementById('headerList');
    if (!menu) return;
    const path = window.location.pathname;
    for (const child of menu.children) {
        const name = child.getAttribute('name');
        if (!name) continue;
        const isHome = path === '/' && name === 'home';
        const isMatch = name !== 'home' && path.includes(name);
        if (isHome || isMatch) {
            child.classList.remove('rust');
            child.classList.add('darkrust');
            child.setAttribute('aria-current', 'page');
            break;
        }
    }
}

document.addEventListener('includes:loaded', highlightMenu);
