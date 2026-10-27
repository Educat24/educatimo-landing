'use strict';
// Execute the production route definitions with an in-memory DB fixture. Never
// import index.js: that starts migrations, integration jobs and real mail clients.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const { TERMS, KEYWORD_MAPS } = require('../seo_config');
const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
const base = 'https://www.neuro.educatimo.com';
const locales = { ru: 'ru_RU', uk: 'uk_UA', en: 'en_US', pl: 'pl_PL', cs: 'cs_CZ' };
const dbCode = lang => ({ uk: 'ua', cs: 'cz' }[lang] || lang);
const rows = Object.keys(locales).map(lang => ({
    slug: `fixture-${lang}`, language: dbCode(lang), translation_id: 'fixture-group',
    title: `Title ${lang}`, summary: `Summary ${lang}`, content: `<p>Content ${lang}</p>`,
    created_at: '2026-10-18T12:00:00Z', updated_at: '2026-10-18T12:00:00Z',
    image_url: '/fixture.png', keywords: lang
}));
function harness() {
    const app = express();
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../views'));
    const queries = [];
    const context = vm.createContext({ app, TERMS, KEYWORD_MAPS, URL, console,
        pool: { async query(sql, params) {
            queries.push({ sql, params });
            const selected = sql.includes('WHERE language') ? rows.filter(r => r.language === params[0])
                : sql.includes('WHERE slug') ? rows.filter(r => r.slug === params[0]) : rows;
            return { rows: selected.map(r => ({ ...r })) };
        } }
    });
    vm.runInContext(source.match(/const BLOG_LOCALES = .*;/)[0], context);
    vm.runInContext(source.slice(source.indexOf('function toIsoLang('), source.indexOf('// View Engine')), context);
    vm.runInContext(source.slice(source.indexOf('// Sitemap XML Endpoint'), source.indexOf("app.get('/admin',")), context);
    app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, '../../robots.txt')));
    return { app, queries };
}
function decode(s) { return s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&#34;/g, '"'); }
function signals(html) {
    const meta = key => decode(html.match(new RegExp(`<meta (?:name|property)="${key}"\\s+content="([^"]*)"`))?.[1] || '');
    return {
        lang: html.match(/<html\s+lang="([^"]+)"/)?.[1],
        canonical: decode(html.match(/rel="canonical" href="([^"]+)"/)?.[1] || ''),
        hreflang: Object.fromEntries([...html.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], decode(m[2])])),
        title: html.match(/<title>\s*([^<]*?)\s*<\/title>/)?.[1],
        description: meta('description'), ogDescription: meta('og:description'),
        ogLocale: meta('og:locale'), ogUrl: meta('og:url')
    };
}

test('blog HTTP language, metadata, redirects, articles, sitemap and robots regressions', async t => {
    const { app, queries } = harness();
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    t.after(() => new Promise(resolve => server.close(resolve)));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const matrix = [];
    async function read(url) {
        const res = await fetch(origin + url, { redirect: 'manual' });
        const body = await res.text();
        matrix.push({ url, status: res.status, location: res.headers.get('location'), ...signals(body) });
        return { res, body, seo: signals(body) };
    }
    for (const [lang, ogLocale] of Object.entries(locales)) {
        await t.test(`list ${lang}`, async () => {
            const { res, body, seo } = await read(`/blog?language=${lang}`);
            assert.equal(res.status, 200);
            assert.equal(seo.lang, lang);
            assert.equal(seo.canonical, `${base}/blog?language=${lang}`);
            assert.equal(seo.ogUrl, seo.canonical);
            assert.equal(seo.ogLocale, ogLocale);
            assert.equal(seo.description, TERMS[lang].blogSubtitle);
            assert.equal(seo.ogDescription, seo.description);
            assert.equal(seo.title, TERMS[lang].blogTitle);
            assert.deepEqual(seo.hreflang, Object.fromEntries([...Object.keys(locales).map(l => [l, `${base}/blog?language=${l}`]), ['x-default', `${base}/blog?language=uk`]]));
            assert.match(body, new RegExp(`href="/blog\\?language=${lang}" class="active"`));
            assert.ok(!/language=(cz|ua)/.test(body));
            assert.match(body, new RegExp(`/blog/fixture-${lang}`));
            assert.equal(queries.at(-1).params[0], dbCode(lang));
        });
        await t.test(`article ${lang}`, async () => {
            const { res, body, seo } = await read(`/blog/fixture-${lang}`);
            assert.equal(res.status, 200);
            assert.equal(seo.lang, lang);
            assert.equal(seo.ogLocale, ogLocale);
            assert.equal(seo.description, `Summary ${lang}`);
            assert.equal(seo.ogDescription, seo.description);
            assert.equal(seo.canonical, `${base}/blog/fixture-${lang}`);
            assert.equal(seo.hreflang[lang], seo.canonical);
            assert.equal(Object.keys(seo.hreflang).length, 6);
            assert.ok(!/language=(cz|ua)/.test(body));
            assert.match(body, new RegExp(`href="/blog\\?language=${lang}" class="btn`));
        });
    }
    for (const [before, after] of [
        ['/blog?language=cz', '/blog?language=cs'],
        ['/blog?language=ua', '/blog?language=uk'],
        ['/blog?language=cz&page=2&category=memory&utm_source=a&tag=x&tag=y', '/blog?language=cs&page=2&category=memory&utm_source=a&tag=x&tag=y'],
        ['/blog/fixture-cs?language=cz&utm_content=a%26b', '/blog/fixture-cs?language=cs&utm_content=a%26b'],
        ['/blog?language=%63%7A', '/blog?language=cs']
    ]) await t.test(`redirect ${before}`, async () => {
        const count = queries.length;
        const { res } = await read(before);
        assert.equal(res.status, 301);
        assert.equal(res.headers.get('location'), after);
        assert.equal(queries.length, count);
        const target = await read(after);
        assert.equal(target.res.status, 200); // no redirect loop/chain
    });
    await t.test('default and ignored pagination/filter/tracking parameters', async () => {
        const plain = await read('/blog');
        assert.equal(plain.res.status, 200);
        assert.equal(plain.seo.lang, 'ru');
        const decorated = await read('/blog?language=cs&page=2&category=memory&utm_source=test');
        const clean = await read('/blog?language=cs');
        assert.deepEqual(decorated.seo, clean.seo);
        assert.equal(decorated.body, clean.body);
    });
    for (const query of ['language=de', 'language=', 'language=cz&language=en']) {
        await t.test(`invalid ${query}`, async () => assert.equal((await read('/blog?' + query)).res.status, 400));
    }
    await t.test('article metadata also accepts ISO database language codes', async () => {
        for (const lang of ['cs', 'uk']) {
            const row = rows.find(r => r.slug === `fixture-${lang}`);
            const old = row.language;
            try {
                row.language = lang;
                const { res, seo } = await read(`/blog/fixture-${lang}`);
                assert.equal(res.status, 200);
                assert.equal(seo.lang, lang);
                assert.equal(seo.ogLocale, locales[lang]);
            } finally { row.language = old; }
        }
    });
    await t.test('shared header preserves legacy admin filters', async () => {
        const ejs = require('ejs');
        for (const [lang, legacy] of [['cs', 'cz'], ['uk', 'ua']]) {
            const html = await ejs.renderFile(path.join(__dirname, '../views/partials/header.ejs'), {
                currentPath: '/admin', language: legacy
            });
            assert.match(html, new RegExp(`href="/admin\\?language=${legacy}" class="active"`));
            assert.equal(signals(html).lang, lang);
        }
    });
    await t.test('redirect preserves search and hostile-looking parameters on same origin', async () => {
        const query = 'language=cz&page=3&q=a%26b&search=%C4%8Desk%C3%BD&utm_campaign=x&next=https%3A%2F%2Fevil.invalid&redirect=%2F%2Fevil.invalid&tag=a&tag=b';
        const { res } = await read('/blog?' + query);
        assert.equal(res.status, 301);
        const location = res.headers.get('location');
        const destination = new URL(location, origin);
        assert.equal(destination.origin, origin);
        assert.equal(destination.pathname, '/blog');
        const expected = new URLSearchParams(query);
        expected.set('language', 'cs');
        assert.deepEqual([...destination.searchParams], [...expected]);
        assert.equal((await read(location)).res.status, 200);
    });
    await t.test('article language and canonical do not follow list filters', async () => {
        const original = await read('/blog/fixture-en');
        for (const language of ['ru', 'uk', 'pl', 'cs']) {
            const filtered = await read(`/blog/fixture-en?language=${language}&page=2&q=memory`);
            assert.equal(filtered.res.status, 200);
            assert.deepEqual(filtered.seo, original.seo);
            assert.equal(filtered.body, original.body);
        }
        const legacy = await read('/blog/fixture-en?language=cz');
        assert.equal(legacy.res.status, 301);
        const target = await read(legacy.res.headers.get('location'));
        assert.deepEqual(target.seo, original.seo);
    });
    await t.test('untranslated article uses itself for x-default', async () => {
        const row = rows.find(r => r.slug === 'fixture-cs');
        const old = row.translation_id;
        try {
            row.translation_id = null;
            const { seo } = await read('/blog/fixture-cs');
            assert.deepEqual(seo.hreflang, { cs: base + '/blog/fixture-cs', 'x-default': base + '/blog/fixture-cs' });
        } finally { row.translation_id = old; }
    });
    await t.test('missing article', async () => assert.equal((await read('/blog/missing')).res.status, 404));
    await t.test('sitemap and robots', async () => {
        const { res, body } = await read('/sitemap.xml');
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type'), /application\/xml/);
        assert.equal((body.match(/<url>/g) || []).length, 10);
        assert.ok(!/hreflang="(?:cz|ua)"/.test(body));
        for (const lang of Object.keys(locales)) {
            assert.ok(body.includes(`<loc>${base}/${lang}/</loc>`));
            assert.ok(body.includes(`hreflang="${lang}" href="${base}/blog/fixture-${lang}"`));
        }
        const robots = await read('/robots.txt');
        assert.equal(robots.res.status, 200);
        assert.ok(robots.body.includes(`Sitemap: ${base}/sitemap.xml`));
        assert.match(robots.body, /Allow: \//);
        if (process.env.SEO_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.SEO_EVIDENCE_DIR, 'sitemap-fixture.xml'), body);
    });
    if (process.env.SEO_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.SEO_EVIDENCE_DIR, 'url-matrix.json'), JSON.stringify(matrix, null, 2) + '\n');
});
