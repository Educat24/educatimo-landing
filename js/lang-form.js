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

    function getFormLang(form) {
        var explicit = form.getAttribute('data-lang');
        if (explicit) {
            var code = normalize(String(explicit).trim().toLowerCase());
            if (SUPPORTED.indexOf(code) !== -1) return code;
        }
        return getPageLang();
    }

    function ensureFormLang(form) {
        var lang = getFormLang(form);
        var input = form.querySelector('input[name="lang"]');
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'lang';
            form.appendChild(input);
        }
        input.value = lang;
    }

    // Country-neutral syntax check only; does not establish ownership/reachability.
    function normalizePhone(value) {
        var raw = String(value || '').trim();
        if (!/^\+[0-9\s()\-]+$/.test(raw)) return null;
        var normalized = raw.replace(/[\s()\-]/g, '');
        return /^\+[1-9][0-9]{6,14}$/.test(normalized) ? normalized : null;
    }

    var phoneErrors = {
        uk: 'Введіть +, код країни та номер (7–15 цифр). Можна використовувати пробіли й дефіси.',
        ru: 'Введите +, код страны и номер (7–15 цифр). Пробелы и дефисы допустимы.',
        en: 'Enter +, country code and number (7–15 digits). Spaces and hyphens are accepted.',
        cs: 'Zadejte +, předvolbu země a číslo (7–15 číslic). Mezery a pomlčky jsou povoleny.',
        pl: 'Wpisz +, kod kraju i numer (7–15 cyfr). Spacje i myślniki są dozwolone.'
    };

    function validatePhone(form) {
        var input = form.querySelector('input[name="phone"]');
        if (!input) return true;
        var normalized = normalizePhone(input.value);
        var optionalEmpty = !input.required && !input.value.trim();
        input.setCustomValidity(normalized || optionalEmpty ? '' : phoneErrors[getFormLang(form)]);
        if (normalized) input.value = normalized;
        return !!normalized || optionalEmpty;
    }

    function preparePhone(form) {
        var input = form.querySelector('input[name="phone"]');
        if (!input || input.dataset.phonePrepared) return;
        input.dataset.phonePrepared = 'true';
        input.placeholder = getFormLang(form) === 'uk' ? '+380 XX XXX XX XX' : '+XXXXXXXXXXX';
        input.inputMode = 'tel';
        input.autocomplete = 'tel';
        input.addEventListener('input', function () { input.setCustomValidity(''); });
        input.addEventListener('blur', function () { if (input.value.trim()) validatePhone(form); });
    }

    function injectLangInputs() {
        var forms = document.querySelectorAll('form[action*="/api/register"]');
        for (var i = 0; i < forms.length; i++) {
            ensureFormLang(forms[i]);
            preparePhone(forms[i]);
        }
    }

    document.addEventListener('submit', function (e) {
        if (e.target && e.target.action && e.target.action.indexOf('/api/register') !== -1) {
            ensureFormLang(e.target);
            preparePhone(e.target);
            if (!validatePhone(e.target)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.target.querySelector('input[name="phone"]').reportValidity();
            }
        }
    }, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLangInputs);
    } else {
        injectLangInputs();
    }
})();
