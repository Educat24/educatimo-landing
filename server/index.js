const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
// Проверка загрузки переменных для почты (без вывода значений)
const hasMailUser = !!(process.env.EMAIL_USER || process.env.GMAIL_USER);
const hasMailPass = !!(process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD);
if (!hasMailUser || !hasMailPass) {
    console.warn('Почта отключена: в server/.env должны быть GMAIL_USER и GMAIL_APP_PASSWORD (без пробелов вокруг =)');
}
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const nodemailer = require('nodemailer');
const pgSession = require('connect-pg-simple')(session);
const { v4: uuidv4 } = require('uuid');
const { KEYWORD_MAPS, TERMS } = require('./seo_config');

const app = express();
const port = 3000;

// Database configuration (DATABASE_URL on production)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://cognitive_tests_user:NewPasswordForCognitiveDb-2025!@localhost:5432/cognitive_tests_db'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: function (req, file, cb) {
        // Unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
const parseForm = multer().none(); // for multipart form without files (registration form)

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session for Admin (Simple)
app.use(session({
    store: new pgSession({
        pool: pool,                // Connection pool
        tableName: 'session'       // Use custom table name (default is 'session')
    }),
    secret: 'neuro-educatimo-secret-key-2025',
    resave: false,
    saveUninitialized: false, // Recommended for login sessions
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: false } // 30 days
}));

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/login');
};

const isAdminApi = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

// Root route: language detection and 302 redirect (SEO: root is router, no content)
const LOCALE_MAP = { ru: '/ru/', uk: '/uk/', en: '/en/', pl: '/pl/', cs: '/cs/' };
app.get('/', (req, res) => {
    const acceptLanguage = (req.get('Accept-Language') || '').toLowerCase();
    const preferred = acceptLanguage.split(',')[0].trim().split('-')[0];
    const target = LOCALE_MAP[preferred] || LOCALE_MAP.en;
    res.redirect(302, target);
});

// New URL structure: /ru/, /en/, /uk/, /pl/, /cs/ (for local dev without nginx)
const LANGS = ['ru', 'en', 'uk', 'pl', 'cs'];
LANGS.forEach(lang => {
    app.get(`/${lang}/`, (req, res) => res.sendFile(path.join(__dirname, '..', lang, 'index.html')));
    app.get(`/${lang}/team`, (req, res) => res.sendFile(path.join(__dirname, '..', lang, 'team.html')));
    app.get(`/${lang}`, (req, res) => res.redirect(302, `/${lang}/`));
});

// Serve static files (style.css, img/, favicon, etc.)
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

// --- Auth Routes ---

app.get('/login', (req, res) => {
    res.render('login', { pageTitle: 'Вход | Neuro Educatimo' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded credentials as requested
    // Login: admin
    // Password: NeuroPassword2025
    if (username === 'admin' && password === 'NeuroPassword2025') {
        req.session.isAuthenticated = true;
        res.redirect('/admin');
    } else {
        res.render('login', { pageTitle: 'Вход', error: 'Неверный логин или пароль' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


// Create table if not exists

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS landing_waitlist (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                center_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'landing_waitlist' AND column_name = 'lang') THEN
                    ALTER TABLE landing_waitlist ADD COLUMN lang VARCHAR(10);
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS articles (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                language VARCHAR(10) NOT NULL DEFAULT 'ru',
                keywords TEXT,
                image_url VARCHAR(255),
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                translation_id UUID
            );
            
            -- Add translation_id if missing (migration)
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='translation_id') THEN 
                    ALTER TABLE articles ADD COLUMN translation_id UUID; 
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='updated_at') THEN 
                    ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP; 
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS "session" (
              "sid" varchar NOT NULL COLLATE "default",
              "sess" json NOT NULL,
              "expire" timestamp(6) NOT NULL,
              CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
            )
            WITH (OIDS=FALSE);
            
            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `);
        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database', err);
    }
};

initDb();

// Display label for lang code in admin email (e.g. RU, PL, EN).
const LANG_LABELS = { ru: 'RU', uk: 'UK', en: 'EN', pl: 'PL', cs: 'CZ', cz: 'CZ' };
function getLangLabel(lang) {
    if (!lang || typeof lang !== 'string') return '—';
    const code = lang.toLowerCase().trim();
    return LANG_LABELS[code] || code.toUpperCase();
}

// Send registration notification to owner. Uses env: RECIPIENT_EMAIL, EMAIL_USER, EMAIL_PASS (or GMAIL_USER, GMAIL_APP_PASSWORD).
async function sendRegistrationEmail(email, center_name, lang) {
    const to = process.env.RECIPIENT_EMAIL || 'svetlichnyioleksiy@gmail.com';
    const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
        console.warn('Registration email skipped: set EMAIL_USER and EMAIL_PASS (or GMAIL_USER and GMAIL_APP_PASSWORD) in .env');
        return null;
    }
    const langLabel = getLangLabel(lang);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });
    await transporter.sendMail({
        from: user,
        to,
        subject: 'Neuro Educatimo: новая заявка в лист ожидания',
        text: `Новая регистрация в пилот:\n\nEmail: ${email}\nНазвание центра: ${center_name}\nЯзык: ${langLabel}\n\nДата: ${new Date().toISOString()}`,
        html: `<p>Новая регистрация в пилот:</p><ul><li><strong>Email:</strong> ${email}</li><li><strong>Название центра:</strong> ${center_name}</li><li><strong>Язык:</strong> ${langLabel}</li></ul><p>Дата: ${new Date().toISOString()}</p>`
    });
    console.log('Registration email sent to', to);
    return true;
}

// API Endpoint: save to DB and/or send email. Success if at least one works (so form works even when DB is unavailable on prod).
app.post('/api/register', parseForm, async (req, res) => {
    const { email, center_name, lang } = req.body;

    if (!email || !center_name) {
        return res.status(400).json({ error: 'Email and Center Name are required' });
    }

    let dbOk = false;
    let emailOk = false;

    try {
        await pool.query(
            'INSERT INTO landing_waitlist (email, center_name, lang) VALUES ($1, $2, $3) RETURNING *',
            [email, center_name, lang || null]
        );
        dbOk = true;
    } catch (err) {
        console.error('Error saving to database', err);
    }

    try {
        const sent = await sendRegistrationEmail(email, center_name, lang);
        if (sent) emailOk = true;
    } catch (err) {
        console.error('Error sending registration email:', err.message || err);
    }

    if (dbOk || emailOk) {
        if (emailOk) console.log('Registration: success (email sent)');
        else console.log('Registration: success (saved to DB only, email not sent)');
        return res.status(201).json({ email, center_name });
    }
    console.log('Registration: failed (DB and email both failed)');
    res.status(500).json({ error: 'Internal Server Error' });
});

// --- Blog API ---

// Get all articles (for admin or public list)
app.get('/api/articles', async (req, res) => {
    try {
        const { language } = req.query;
        let query = 'SELECT * FROM articles ORDER BY created_at DESC';
        let params = [];
        if (language) {
            query = 'SELECT * FROM articles WHERE language = $1 ORDER BY created_at DESC';
            params = [language];
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single article by slug
app.get('/api/articles/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query('SELECT * FROM articles WHERE slug = $1', [slug]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create article
app.post('/api/articles', isAdminApi, async (req, res) => {
    const { title, summary, content, language, keywords, image_url } = req.body;
    let slug = req.body.slug;

    // Auto-generate slug if missing
    if (!slug) {
        slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    try {
        const translation_id = uuidv4();
        const result = await pool.query(
            `INSERT INTO articles (title, slug, content, summary, language, keywords, image_url, published_at, translation_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8) RETURNING *`,
            [title, slug, content, summary, language || 'ru', keywords, image_url, translation_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating article' });
    }
});

// Update article
app.put('/api/articles/:id', isAdminApi, async (req, res) => {
    const { id } = req.params;
    const { title, slug, content, summary, language, keywords, image_url } = req.body;
    try {
        const result = await pool.query(
            `UPDATE articles SET title = $1, slug = $2, content = $3, summary = $4, language = $5, keywords = $6, image_url = $7, updated_at = NOW() WHERE id = $8 RETURNING *`,
            [title, slug, content, summary, language, keywords, image_url, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating article' });
    }
});

// Delete article
app.delete('/api/articles/:id', isAdminApi, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM articles WHERE id = $1', [id]);
        res.json({ message: 'Article deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting article' });
    }
});

// Upload Image Endpoint
app.post('/api/upload', isAdminApi, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Return relative URL
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error uploading file' });
    }
});

// Sitemap XML Endpoint (ISO 639-1 language codes: ru, en, uk, pl, cs only)
app.get('/sitemap.xml', async (req, res) => {
    try {
        const result = await pool.query('SELECT slug, updated_at, created_at FROM articles ORDER BY created_at DESC');
        const articles = result.rows;
        const baseUrl = 'https://www.neuro.educatimo.com';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Static language home pages only (no old ua/cz or index)
        ['ru', 'en', 'uk', 'pl', 'cs'].forEach(lang => {
            xml += `
   <url>
      <loc>${baseUrl}/${lang}/</loc>
      <changefreq>monthly</changefreq>
      <priority>1.0</priority>
   </url>`;
        });

        // Blog pages
        articles.forEach(article => {
            const date = article.updated_at || article.created_at;
            const lastmod = new Date(date).toISOString();
            xml += `
   <url>
      <loc>${baseUrl}/blog/${article.slug}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
   </url>`;
        });

        xml += `
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating sitemap');
    }
});

// --- Page Routes (SSR) ---

// Helper to auto-link keywords in text
const linkify = (text, language) => {
    if (!text || !KEYWORD_MAPS[language]) return text;

    let linkedText = text;
    const keywords = KEYWORD_MAPS[language];

    // Sort keywords by length desc to avoid replacing substrings incorrectly
    // (though for full robustness we'd need more complex parsing to avoid linking inside HTML tags)
    // For this simple implementation, we assume text contains HTML from Quill

    keywords.forEach(({ word, link }) => {
        // Regex to find word, NOT inside HTML tag attributes or already linked
        // This is a simplified regex and has limitations, but sufficient for basic usage
        // Checks for word boundary, ignoring case
        const regex = new RegExp(`(^|\\s|>)(${word})($|\\s|<)`, 'i');

        // Only replace first occurrence to act "by default" and not over-spam
        linkedText = linkedText.replace(regex, `$1<a href="${link}" style="text-decoration: underline; color: var(--primary-color);">$2</a>$3`);
    });

    return linkedText;
};

app.get('/blog', async (req, res) => {
    try {
        const urlLang = req.query.language || 'ru';
        const dbLang = ({ uk: 'ua', cs: 'cz' })[urlLang] || urlLang;
        const terms = TERMS[urlLang] || TERMS[dbLang] || TERMS['ru'];

        let query = 'SELECT * FROM articles WHERE language = $1 ORDER BY created_at DESC';
        let params = [dbLang];

        // Fallback: if no lang specific articles, maybe show all?
        // Specification says: "With each local page... user gets to corresponding local article page".
        // So filtering is correct.

        let result = await pool.query(query, params);

        // If no articles found for this language, maybe fallback or just show empty
        // For better UX during dev, if empty, we might show RU or all, but requirements say "Language... set in admin".
        // Sticky to strict filtering.

        res.render('blog_list', {
            articles: result.rows,
            pageTitle: terms.blogTitle,
            language: urlLang,
            terms: terms,
            currentPath: '/blog',
            currentLanguage: urlLang
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/blog/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await pool.query('SELECT * FROM articles WHERE slug = $1', [slug]);
        if (result.rows.length === 0) {
            return res.status(404).send('Article not found');
        }
        const article = result.rows[0];

        // Language setup
        const language = article.language || 'ru';
        const isoLang = language === 'ua' ? 'uk' : (language === 'cz' ? 'cs' : language);
        const terms = TERMS[language] || TERMS['ru'];

        // Auto-linking
        article.content = linkify(article.content, language);

        // JSON-LD Schema
        const schemaJson = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://www.neuro.educatimo.com/blog/${slug}?language=${language}`
            },
            "headline": article.title,
            "image": article.image_url ? [article.image_url] : ["https://www.neuro.educatimo.com/img/hero-background.jpeg"],
            "datePublished": article.created_at,
            "dateModified": article.updated_at || article.created_at,
            "author": {
                "@type": "Person",
                "name": "Vladimir",
                "url": "https://www.neuro.educatimo.com/en/team"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Neuro Educatimo",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.neuro.educatimo.com/favicon.png"
                }
            },
            "mentions": [{
                "@type": "Service",
                "name": "Cognitive Testing SaaS",
                "url": "https://www.neuro.educatimo.com"
            }]
        };

        const localeMap = {
            'ru': 'ru_RU', 'ua': 'uk_UA', 'en': 'en_US', 'pl': 'pl_PL', 'cz': 'cs_CZ'
        };

        res.render('article', {
            article: article,
            language: language,
            lang: isoLang,
            terms: terms,
            currentPath: `/blog/${slug}?language=${language}`,
            currentUrl: `https://www.neuro.educatimo.com/blog/${slug}?language=${language}`,
            pageTitle: article.title,
            metaDescription: article.summary,
            keywords: article.keywords,
            imageUrl: article.image_url,

            ogType: 'article',
            ogLocale: localeMap[language] || 'en_US',


            baseUrl: 'https://www.neuro.educatimo.com',
            schemaJson: schemaJson
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/admin', isAdmin, (req, res) => {
    const language = req.query.language || 'ru';
    res.render('admin', {
        pageTitle: 'Admin Panel',
        currentPath: '/admin',
        currentLanguage: language
    });
});


// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
