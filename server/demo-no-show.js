const crypto = require('crypto');

const LEAD_MESSAGES = {
    uk: 'Схоже, сьогодні не вдалося підключитися до демо. Таке трапляється 🙌\n\nОберіть, будь ласка, новий зручний час — будемо раді зустрітися та показати Neuro.Educatimo.',
    ru: 'Похоже, сегодня не получилось подключиться к демо. Такое бывает 🙌\n\nВыберите, пожалуйста, новое удобное время — будем рады встретиться и показать Neuro.Educatimo.',
    en: 'It looks like you could not join the demo today. It happens 🙌\n\nPlease choose another convenient time — we will be happy to meet and show you Neuro.Educatimo.',
    pl: 'Wygląda na to, że dziś nie udało się dołączyć do demo. To się zdarza 🙌\n\nWybierz proszę nowy dogodny termin — chętnie spotkamy się i pokażemy Neuro.Educatimo.',
    cs: 'Zdá se, že se dnes nepodařilo připojit k demu. To se stává 🙌\n\nVyberte si prosím nový vhodný termín — rádi se setkáme a ukážeme vám Neuro.Educatimo.',
};

const BUTTON_LABELS = {
    uk: '📅 Обрати новий час',
    ru: '📅 Выбрать новое время',
    en: '📅 Choose another time',
    pl: '📅 Wybierz nowy termin',
    cs: '📅 Vybrat nový termín',
};

function normalizeLeadLang(value) {
    const lang = String(value || 'uk').toLowerCase().replace('cz', 'cs').replace('ua', 'uk');
    return Object.hasOwn(LEAD_MESSAGES, lang) ? lang : 'uk';
}

function parseDemoNoShowCallback(value) {
    const match = String(value || '').match(/^demo_no_show:(\d+)$/);
    if (!match) return null;
    const id = Number(match[1]);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function buildLeadRebookMessage(langValue, calendlyUrl) {
    const lang = normalizeLeadLang(langValue);
    return {
        lang,
        text: LEAD_MESSAGES[lang],
        replyMarkup: JSON.stringify({ inline_keyboard: [[{
            text: BUTTON_LABELS[lang],
            url: calendlyUrl,
        }]] }),
    };
}

function deriveTelegramWebhookSecret(configuredSecret, botToken) {
    if (configuredSecret) return configuredSecret;
    if (!botToken) return '';
    return crypto
        .createHmac('sha256', botToken)
        .update('neuro-educatimo-telegram-webhook')
        .digest('hex');
}

function isMatchingSecret(expected, received) {
    if (!expected || !received) return false;
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function escapeTelegramHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

module.exports = {
    buildLeadRebookMessage,
    deriveTelegramWebhookSecret,
    escapeTelegramHtml,
    isMatchingSecret,
    normalizeLeadLang,
    parseDemoNoShowCallback,
};
