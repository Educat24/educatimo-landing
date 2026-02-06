const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const pgSession = require('connect-pg-simple')(session);
const { v4: uuidv4 } = require('uuid');
const { KEYWORD_MAPS, TERMS } = require('./seo_config');



const app = express();
const port = 3000;

// Database configuration
const pool = new Pool({
    connectionString: 'postgresql://cognitive_tests_user:NewPasswordForCognitiveDb-2025!@localhost:5432/cognitive_tests_db'
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

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

// Explicitly handle root to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Explicitly handle clean URLs for specific languages to ensure they work
['ru', 'ua', 'en', 'pl', 'cz', 'team', 'team-ua', 'team-en', 'team-pl', 'team-cz'].forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', `${page}.html`));
    });
});

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

// API Endpoint
app.post('/api/register', async (req, res) => {
    const { email, center_name } = req.body;

    if (!email || !center_name) {
        return res.status(400).json({ error: 'Email and Center Name are required' });



    }

    try {
        const result = await pool.query(
            'INSERT INTO landing_waitlist (email, center_name) VALUES ($1, $2) RETURNING *',
            [email, center_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving to database', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
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

// Sitemap XML Endpoint
app.get('/sitemap.xml', async (req, res) => {
    try {
        const result = await pool.query('SELECT slug, updated_at, created_at FROM articles ORDER BY created_at DESC');
        const articles = result.rows;
        const baseUrl = 'https://neuro.educatimo.com'; // Change to localhost for dev: req.protocol + '://' + req.get('host')

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Static pages
        ['', 'ua', 'en', 'pl', 'cz'].forEach(page => {
            xml += `
   <url>
      <loc>${baseUrl}/${page}</loc>
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
        const language = req.query.language || 'ru'; // Default to RU
        const terms = TERMS[language] || TERMS['ru'];

        let query = 'SELECT * FROM articles WHERE language = $1 ORDER BY created_at DESC';
        let params = [language];

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
            language: language,
            terms: terms,
            currentPath: '/blog',
            currentLanguage: language
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
        const terms = TERMS[language] || TERMS['ru'];

        // Auto-linking
        article.content = linkify(article.content, language);

        // Hreflang alternates
        let alternates = [];
        if (article.translation_id) {
            const altResult = await pool.query('SELECT language, slug FROM articles WHERE translation_id = $1', [article.translation_id]);
            alternates = altResult.rows.map(row => ({
                lang: row.language === 'ua' ? 'uk' : (row.language === 'cz' ? 'cs' : row.language), // ISO fix
                slug: row.slug
            }));
        } else {
            // Fallback if no grouping (self-ref)
            alternates.push({
                lang: language === 'ua' ? 'uk' : (language === 'cz' ? 'cs' : language),
                slug: article.slug
            });
        }

        // Ensure default x-default exists (e.g. English or current)
        const hasEn = alternates.find(a => a.lang === 'en');
        const defaultAlt = hasEn ? hasEn : alternates[0];

        // JSON-LD Schema
        const schemaJson = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://neuro.educatimo.com/blog/${slug}?language=${language}`
            },
            "headline": article.title,
            "image": article.image_url ? [article.image_url] : ["https://neuro.educatimo.com/img/hero-background.jpeg"],
            "datePublished": article.created_at,
            "dateModified": article.updated_at || article.created_at,
            "author": {
                "@type": "Person",
                "name": "Vladimir",
                "url": "https://neuro.educatimo.com/team" // Link to team page
            },
            "publisher": {
                "@type": "Organization",
                "name": "Neuro Educatimo",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://neuro.educatimo.com/favicon.png"
                }
            },
            "mentions": [{
                "@type": "Service",
                "name": "Cognitive Testing SaaS",
                "url": "https://neuro.educatimo.com"
            }]
        };

        const localeMap = {
            'ru': 'ru_RU', 'ua': 'uk_UA', 'en': 'en_US', 'pl': 'pl_PL', 'cz': 'cs_CZ'
        };

        res.render('article', {
            article: article,
            language: language,
            terms: terms,
            currentPath: `/blog/${slug}?language=${language}`,
            currentUrl: `https://neuro.educatimo.com/blog/${slug}?language=${language}`,
            pageTitle: article.title,
            metaDescription: article.summary,
            keywords: article.keywords,
            imageUrl: article.image_url,

            ogType: 'article',
            ogLocale: localeMap[language] || 'en_US',

            alternates: alternates,
            defaultAlt: defaultAlt,
            baseUrl: 'https://neuro.educatimo.com',
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
