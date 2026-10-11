/* ================================================================
   Equinox ICL - connect page interactions. Loaded after scroll.js.
   - Confirmation note after staticforms redirects back (?sent=1).
   - Submit button morph (label crossfade + checkmark draw + colour
     shift). Doesn't block submission.
   ================================================================ */

(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Connect form: when the user submits, immediately morph the button
       to a "sent" state. We don't preventDefault: staticforms.xyz still
       gets the POST and its redirectTo brings the user back. The class
       persists for the brief moment before the redirect lands. */
    const form = document.getElementById('contactForm');

    /* staticforms redirects back to connect.html?sent=1 after a
       successful submission: confirm it above the form. */
    const sent = document.getElementById('formSent');
    if (sent && new URLSearchParams(window.location.search).has('sent')) {
        sent.hidden = false;
    }

    if (form) {
        const button = form.querySelector('.submit-btn');
        form.addEventListener('submit', () => {
            if (button && !button.classList.contains('is-sent')) {
                button.classList.add('is-sent');
            }
        });
    }
})();
