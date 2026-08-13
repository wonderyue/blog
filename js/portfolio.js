/* Portfolio: image lightbox and reveal-on-scroll.
   No dependencies -- the theme ships jQuery, but none of this needs it. */
(function () {
    'use strict';

    var sections = [].slice.call(document.querySelectorAll('.pf-section'));
    if (!sections.length) return;

    // ---------------------------------------------------------- lightbox
    var box = document.getElementById('pf-lightbox');
    var boxImg = document.getElementById('pf-lb-img');
    var boxCap = document.getElementById('pf-lb-caption');
    var btnPrev = box && box.querySelector('.pf-lb-nav.is-prev');
    var btnNext = box && box.querySelector('.pf-lb-nav.is-next');
    var btnClose = box && box.querySelector('.pf-lb-close');

    var gallery = [];   // zoomable images of the section currently open
    var index = 0;
    var lastFocus = null;

    // Paging stays inside one section -- stepping from the last drawing into
    // a game cover would be disorienting.
    function zoomableIn(section) {
        return [].slice.call(section.querySelectorAll('.pf-cover img, .pf-shot img'));
    }

    function show(i) {
        var img = gallery[i];
        if (!img) return;
        index = i;
        boxImg.src = img.getAttribute('data-zoom') || img.src;
        boxImg.alt = img.alt || '';
        boxCap.textContent = img.getAttribute('data-caption') || '';

        // With a single image there is nothing to page through.
        var many = gallery.length > 1;
        btnPrev.hidden = !many;
        btnNext.hidden = !many;
    }

    function openBox(img, section) {
        gallery = zoomableIn(section);
        var at = gallery.indexOf(img);
        if (at < 0) return;

        lastFocus = document.activeElement;
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        show(at);

        // Next frame, so the opacity transition actually runs.
        requestAnimationFrame(function () { box.classList.add('is-visible'); });
        btnClose.focus();
    }

    function closeBox() {
        box.classList.remove('is-visible');
        box.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        window.setTimeout(function () {
            box.classList.remove('is-open');
            boxImg.src = '';
        }, 200);
        if (lastFocus) lastFocus.focus();
    }

    function step(delta) {
        if (gallery.length < 2) return;
        show((index + delta + gallery.length) % gallery.length);
    }

    if (box) {
        sections.forEach(function (section) {
            section.addEventListener('click', function (e) {
                var btn = e.target.closest ? e.target.closest('.pf-zoom, .pf-shot-btn') : null;
                if (!btn) return;
                var img = btn.querySelector('img') || btn.parentNode.querySelector('img');
                if (img) openBox(img, section);
            });
        });

        btnClose.addEventListener('click', closeBox);
        btnPrev.addEventListener('click', function () { step(-1); });
        btnNext.addEventListener('click', function () { step(1); });

        // Click the backdrop (but not the image itself) to dismiss.
        box.addEventListener('click', function (e) {
            if (e.target === box || e.target.classList.contains('pf-lb-stage')) closeBox();
        });

        document.addEventListener('keydown', function (e) {
            if (!box.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeBox();
            else if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 'ArrowRight') step(1);
        });
    }

    // ------------------------------------------------------------ reveal
    // Added from JS so the cards are never stuck invisible without scripting.
    if ('IntersectionObserver' in window &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

        var cards = [].slice.call(document.querySelectorAll('.pf-card'));
        cards.forEach(function (card) { card.classList.add('pf-reveal'); });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

        cards.forEach(function (card) { io.observe(card); });
    }
}());
