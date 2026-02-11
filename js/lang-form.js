/**
 * Landing form: inject hidden "lang" into all /api/register forms.
 * Detection order: URL path → <html lang="..."> → browser (navigator.languages) → default "en".
 * Supported codes: ru, uk, en, pl, cs (URL may use "ua" → normalized to "uk").
 */
(function () {
    var SUPPORTED = ['ru', 'uk', 'en', 'pl', 'cs'];

    function normalize(code) {
        if (code === 'ua') return 'uk';
        return code;
    }

    function getPageLang() {
        var path = window.location.pathname.replace(/\/$/, '').replace(/^\//, '');
        var seg = path.split('/')[0];
        if (seg) {
            seg = seg.toLowerCase();
            if (seg === 'ua' || seg === 'uk') return 'uk';
            if (SUPPORTED.indexOf(seg) !== -1) return seg;
        }
        var htmlLang = document.documentElement.getAttribute('lang');
        if (htmlLang) {
            var code = normalize(htmlLang.split('-')[0].toLowerCase());
            if (SUPPORTED.indexOf(code) !== -1) return code;
        }
        var nav = (navigator.languages && navigator.languages[0] ? navigator.languages[0] : (navigator.language || navigator.userLanguage || 'en'));
        var browserCode = normalize(String(nav).split('-')[0].toLowerCase());
        if (SUPPORTED.indexOf(browserCode) !== -1) return browserCode;
        return 'en';
    }

    function injectLangInputs() {
        var lang = getPageLang();
        var forms = document.querySelectorAll('form[action*="/api/register"]');
        for (var i = 0; i < forms.length; i++) {
            var form = forms[i];
            if (form.querySelector('input[name="lang"]')) continue;
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'lang';
            input.value = lang;
            form.appendChild(input);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLangInputs);
    } else {
        injectLangInputs();
    }
})();
