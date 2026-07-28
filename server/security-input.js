'use strict';

const path = require('path');

const REGISTRATION_FORM_LIMITS = Object.freeze({
    fieldNameSize: 100,
    fieldSize: 64 * 1024,
    fields: 32,
    parts: 32
});

const ADMIN_IMAGE_LIMITS = Object.freeze({
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 2,
    parts: 3
});

const IMAGE_MIME_BY_EXTENSION = Object.freeze({
    '.jpg': new Set(['image/jpeg', 'image/pjpeg']),
    '.jpeg': new Set(['image/jpeg', 'image/pjpeg']),
    '.png': new Set(['image/png']),
    '.webp': new Set(['image/webp'])
});

function getSafeImageExtension(file) {
    const extension = path.extname(String(file?.originalname || '')).toLowerCase();
    const allowedMimeTypes = IMAGE_MIME_BY_EXTENSION[extension];
    const mimeType = String(file?.mimetype || '').toLowerCase();

    return allowedMimeTypes?.has(mimeType) ? extension : null;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function sanitizeEmailSubject(value) {
    return String(value ?? '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
}

module.exports = {
    ADMIN_IMAGE_LIMITS,
    REGISTRATION_FORM_LIMITS,
    escapeHtml,
    getSafeImageExtension,
    sanitizeEmailSubject
};
