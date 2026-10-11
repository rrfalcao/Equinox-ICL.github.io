/* ================================================================
   Equinox ICL - secondary-page interactions (about / projects /
   connect). Loaded after scroll.js. Currently:
   - Connect form submit success morph (label crossfade + checkmark
     stroke-dasharray draw + bg colour shift). Doesn't block submission.
   ================================================================ */

(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Connect form: when the user submits, immediately morph the button
       to a "sent" state. We don't preventDefault — staticforms.xyz still
       gets the POST and its redirectTo brings the user back. The class
       persists for the brief moment before the redirect lands. */
    const form = document.getElementById('contactForm');
    if (form) {
        const button = form.querySelector('.submit-btn');
        form.addEventListener('submit', () => {
            if (button && !button.classList.contains('is-sent')) {
                button.classList.add('is-sent');
            }
        });
    }
})();
