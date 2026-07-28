'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    ADMIN_IMAGE_LIMITS,
    REGISTRATION_FORM_LIMITS,
    escapeHtml,
    getSafeImageExtension,
    sanitizeEmailSubject
} = require('../security-input');

test('accepts only matching safe image extensions and MIME types', () => {
    assert.equal(getSafeImageExtension({ originalname: 'photo.JPG', mimetype: 'image/jpeg' }), '.jpg');
    assert.equal(getSafeImageExtension({ originalname: 'chart.png', mimetype: 'image/png' }), '.png');
    assert.equal(getSafeImageExtension({ originalname: 'cover.webp', mimetype: 'image/webp' }), '.webp');
    assert.equal(getSafeImageExtension({ originalname: 'payload.svg', mimetype: 'image/svg+xml' }), null);
    assert.equal(getSafeImageExtension({ originalname: 'payload.html', mimetype: 'image/jpeg' }), null);
    assert.equal(getSafeImageExtension({ originalname: 'payload.jpg', mimetype: 'text/html' }), null);
});

test('multipart limits bound public form and admin upload input', () => {
    assert.equal(REGISTRATION_FORM_LIMITS.fieldSize, 64 * 1024);
    assert.equal(REGISTRATION_FORM_LIMITS.fields, 32);
    assert.equal(ADMIN_IMAGE_LIMITS.fileSize, 10 * 1024 * 1024);
    assert.equal(ADMIN_IMAGE_LIMITS.files, 1);
});

test('escapes untrusted values used in registration email HTML', () => {
    assert.equal(escapeHtml('<img src=x onerror="alert(1)">&'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;');
});

test('removes header line breaks and bounds registration email subject', () => {
    assert.equal(sanitizeEmailSubject('Center\r\nBcc: attacker@example.com'), 'Center Bcc: attacker@example.com');
    assert.equal(sanitizeEmailSubject('x'.repeat(200)).length, 160);
});
