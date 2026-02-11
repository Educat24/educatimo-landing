/**
 * Landing form: inject hidden "lang" into all /api/register forms.
 * Detection order: URL path → <html lang="..."> → browser (navigator.languages) → default "en".
 * Supported codes: ru, uk, en, pl, cs (URL may use "ua" → normalized to "uk").
 * On submit we force-update lang so it is always set (fixes timing/loading issues).
 */
(function () {
    var SUPPORTED = ['ru', 'uk', 'en', 'pl', 'cs'];

    function normalize(code) {
        if (code === 'ua' || code === 'uk') return 'uk';
        if (code === 'cz') return 'cs';
        return code;
    }

    function getPageLang() {
        var pathname = (window.location.pathname || '').replace(/\/$/, '').replace(/^\//, '');
        var parts = pathname.split('/').filter(Boolean);
        var seg = parts[0];
        if (seg) {
            seg = seg.toLowerCase();
            if (seg.indexOf('.') !== -1) seg = seg.split('.')[0];
            seg = normalize(seg);
            if (SUPPORTED.indexOf(seg) !== -1) return seg;
        }
        var htmlLang = document.documentElement.getAttribute('lang');
        if (htmlLang) {
            var code = normalize(String(htmlLang).split('-')[0].toLowerCase());
            if (SUPPORTED.indexOf(code) !== -1) return code;
        }
        var nav = (navigator.languages && navigator.languages[0] ? navigator.languages[0] : (navigator.language || navigator.userLanguage || 'en'));
        var browserCode = normalize(String(nav).split('-')[0].toLowerCase());
        if (SUPPORTED.indexOf(browserCode) !== -1) return browserCode;
        return 'en';
    }

    function ensureFormLang(form) {
        var lang = getPageLang();
        var input = form.querySelector('input[name="lang"]');
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'lang';
            form.appendChild(input);
        }
        input.value = lang;
    }

    function injectLangInputs() {
        var forms = document.querySelectorAll('form[action*="/api/register"]');
        for (var i = 0; i < forms.length; i++) {
            ensureFormLang(forms[i]);
        }
    }

    document.addEventListener('submit', function (e) {
        if (e.target && e.target.action && e.target.action.indexOf('/api/register') !== -1) {
            ensureFormLang(e.target);
        }
    }, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLangInputs);
    } else {
        injectLangInputs();
    }
})();
