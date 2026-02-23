/**
 * demo-slider.js — lightweight slider for the #demo section.
 * Initialises all .demo-slider-wrap elements on the page.
 * Supports: arrow buttons, dot indicators, touch/swipe.
 */
(function () {
    'use strict';

    function initSlider(wrap) {
        var track   = wrap.querySelector('.demo-slider-track');
        var slides  = wrap.querySelectorAll('.demo-slide');
        var inner   = wrap.querySelector('.demo-slides');
        var prevBtn = wrap.querySelector('.demo-arrow.prev');
        var nextBtn = wrap.querySelector('.demo-arrow.next');
        var dotsWrap = wrap.querySelector('.demo-dots');
        var total   = slides.length;
        var current = 0;

        if (!total || !inner) return;

        // Build dots
        var dots = [];
        if (dotsWrap) {
            for (var i = 0; i < total; i++) {
                var dot = document.createElement('span');
                if (i === 0) dot.className = 'active';
                (function (idx) {
                    dot.addEventListener('click', function () { goTo(idx); });
                })(i);
                dotsWrap.appendChild(dot);
                dots.push(dot);
            }
        }

        function goTo(idx) {
            if (idx < 0) idx = total - 1;
            if (idx >= total) idx = 0;
            current = idx;
            inner.style.transform = 'translateX(-' + (100 * current) + '%)';
            dots.forEach(function (d, i) {
                d.className = i === current ? 'active' : '';
            });
        }

        if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

        // Touch / swipe
        var touchStartX = null;
        track.addEventListener('touchstart', function (e) {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        track.addEventListener('touchend', function (e) {
            if (touchStartX === null) return;
            var diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
            touchStartX = null;
        }, { passive: true });
    }

    function init() {
        var all = document.querySelectorAll('.demo-slider-wrap');
        for (var i = 0; i < all.length; i++) initSlider(all[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
