async function includeHTML() {
    const includeElements = document.querySelectorAll('[data-include-html]');
    await Promise.all(Array.from(includeElements).map(async (element) => {
        const file = element.getAttribute('data-include-html');
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            element.innerHTML = await response.text();
        } catch (err) {
            console.error(`includeHTML: failed to load ${file}`, err);
        }
    }));
    document.dispatchEvent(new CustomEvent('includes:loaded'));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', includeHTML);
} else {
    includeHTML();
}
