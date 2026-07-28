const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildLeadRebookMessage,
    deriveTelegramWebhookSecret,
    escapeTelegramHtml,
    isMatchingSecret,
    normalizeLeadLang,
    parseDemoNoShowCallback,
} = require('../demo-no-show');

test('parses only positive integer no-show callback IDs', () => {
    assert.equal(parseDemoNoShowCallback('demo_no_show:42'), 42);
    assert.equal(parseDemoNoShowCallback('demo_no_show:0'), null);
    assert.equal(parseDemoNoShowCallback('demo_no_show:1 OR 1=1'), null);
    assert.equal(parseDemoNoShowCallback('demo_confirm'), null);
});

test('normalizes all supported lead languages and falls back to Ukrainian', () => {
    assert.equal(normalizeLeadLang('ua'), 'uk');
    assert.equal(normalizeLeadLang('cz'), 'cs');
    assert.equal(normalizeLeadLang('RU'), 'ru');
    assert.equal(normalizeLeadLang('de'), 'uk');
});

test('builds localized Calendly action without callback side effects', () => {
    const action = buildLeadRebookMessage('pl', 'https://calendly.example/demo');
    const markup = JSON.parse(action.replyMarkup);
    assert.match(action.text, /dziś/);
    assert.equal(markup.inline_keyboard[0][0].url, 'https://calendly.example/demo');
    assert.equal(markup.inline_keyboard[0][0].callback_data, undefined);
});

test('derives stable webhook secret and compares it safely', () => {
    const secret = deriveTelegramWebhookSecret('', 'bot-token');
    assert.equal(secret.length, 64);
    assert.equal(secret, deriveTelegramWebhookSecret('', 'bot-token'));
    assert.equal(deriveTelegramWebhookSecret('configured', 'bot-token'), 'configured');
    assert.equal(isMatchingSecret(secret, secret), true);
    assert.equal(isMatchingSecret(secret, `${secret}x`), false);
    assert.equal(isMatchingSecret(secret, ''), false);
});

test('escapes Telegram HTML in administrator notifications', () => {
    assert.equal(escapeTelegramHtml('A&B <Center>'), 'A&amp;B &lt;Center&gt;');
});
