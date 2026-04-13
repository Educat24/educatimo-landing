const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
// Проверка загрузки переменных для почты (без вывода значений)
const hasMailUser = !!(process.env.EMAIL_USER || process.env.GMAIL_USER);
const hasMailPass = !!(process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD);
if (!hasMailUser || !hasMailPass) {
    console.warn('Почта отключена: в server/.env должны быть GMAIL_USER и GMAIL_APP_PASSWORD (без пробелов вокруг =)');
}

// Brevo transactional email
const { BrevoClient } = require('@getbrevo/brevo');
const _brevoRawClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY || '' });
const brevoTransac = _brevoRawClient.transactionalEmails;
const BREVO_SENDER = { name: 'Олексій | Neuro.Educatimo', email: 'hello@neuro.educatimo.com' };
const VIDEO_PREVIEW_URL = 'https://www.neuro.educatimo.com/images/video-preview.png';
const VIDEO_URL = 'https://youtu.be/Mb19fifkauY';
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

function toIsoLang(lang) {
    if (lang === 'ua') return 'uk';
    if (lang === 'cz') return 'cs';
    return lang;
}

function toDbLang(lang) {
    if (lang === 'uk') return 'ua';
    if (lang === 'cs') return 'cz';
    return lang;
}

function buildAlternateMap(rows, baseUrl) {
    const altMap = {};
    (rows || []).forEach(row => {
        const iso = toIsoLang(row.language || 'ru');
        if (!altMap[iso]) {
            altMap[iso] = `${baseUrl}/blog/${row.slug}`;
        }
    });
    return altMap;
}

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
    res.redirect(302, LOCALE_MAP.uk);
});

// New URL structure: /ru/, /en/, /uk/, /pl/, /cs/ (for local dev without nginx)
const LANGS = ['ru', 'en', 'uk', 'pl', 'cs'];
LANGS.forEach(lang => {
    app.get(`/${lang}/`, (req, res) => res.sendFile(path.join(__dirname, '..', lang, 'index.html')));
    app.get(`/${lang}/team`, (req, res) => res.sendFile(path.join(__dirname, '..', lang, 'team.html')));
    app.get(`/${lang}`, (req, res) => res.redirect(302, `/${lang}/`));
});

// Quiz page (UK only for now)
app.get('/uk/quiz', (req, res) => res.sendFile(path.join(__dirname, '..', 'uk', 'quiz.html')));
app.get('/uk/quiz/', (req, res) => res.redirect(301, '/uk/quiz'));

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
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'landing_waitlist' AND column_name = 'phone') THEN
                    ALTER TABLE landing_waitlist ADD COLUMN phone VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'landing_waitlist' AND column_name = 'org_type') THEN
                    ALTER TABLE landing_waitlist ADD COLUMN org_type VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'landing_waitlist' AND column_name = 'students_count') THEN
                    ALTER TABLE landing_waitlist ADD COLUMN students_count VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'landing_waitlist' AND column_name = 'source') THEN
                    ALTER TABLE landing_waitlist ADD COLUMN source VARCHAR(50) DEFAULT 'landing_form';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'landing_waitlist' AND column_name = 'quiz_answers') THEN
                    ALTER TABLE landing_waitlist ADD COLUMN quiz_answers JSONB;
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
async function sendRegistrationEmail(data) {
    const { email, center_name, lang, phone, org_type, students_count, source, quiz_answers,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, landing_page, referrer } = data;
    const to = process.env.RECIPIENT_EMAIL || 'svetlichnyioleksiy@gmail.com';
    const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
        console.warn('Registration email skipped: set EMAIL_USER and EMAIL_PASS (or GMAIL_USER and GMAIL_APP_PASSWORD) in .env');
        return null;
    }
    const langLabel = getLangLabel(lang);
    const sourceLabel = source === 'quiz' ? 'Квиз (/uk/quiz)' : 'Лендинг (форма регистрации)';
    const orgTypeMap = { center: 'Навч. центр / Learning center', school: 'Школа / School', neuro: 'Нейропсихол. центр / Neuropsych. center', other: 'Інше / Other' };
    const studentsMap = { lt50: 'До 50 учнів', '50to200': '50–200 учнів', gt200: 'Більше 200 учнів' };
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });
    const quizSection = quiz_answers
        ? `\n\nВідповіді квізу:\n${Object.entries(quiz_answers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`
        : '';
    const quizHtml = quiz_answers
        ? `<tr><td><strong>Відповіді квізу:</strong></td><td><pre style="font-size:12px">${JSON.stringify(quiz_answers, null, 2)}</pre></td></tr>`
        : '';
    const hasUtm = utm_source || utm_medium || utm_campaign || utm_content || utm_term || fbclid;
    const utmSection = hasUtm
        ? `\n\nUTM / Джерело трафіку:\n  utm_source: ${utm_source || '—'}\n  utm_medium: ${utm_medium || '—'}\n  utm_campaign: ${utm_campaign || '—'}\n  utm_content: ${utm_content || '—'}\n  utm_term: ${utm_term || '—'}\n  fbclid: ${fbclid || '—'}\n  landing_page: ${landing_page || '—'}\n  referrer: ${referrer || '—'}`
        : '';
    const utmHtml = hasUtm
        ? `<tr><td colspan="2" style="padding:8px 12px 2px;color:#666;font-size:12px;border-top:1px solid #eee"><em>UTM / Джерело трафіку</em></td></tr>
            <tr><td style="padding:3px 12px;color:#888;font-size:12px">utm_source</td><td style="padding:3px 12px;font-size:12px">${utm_source || '—'}</td></tr>
            <tr><td style="padding:3px 12px;color:#888;font-size:12px">utm_medium</td><td style="padding:3px 12px;font-size:12px">${utm_medium || '—'}</td></tr>
            <tr><td style="padding:3px 12px;color:#888;font-size:12px">utm_campaign</td><td style="padding:3px 12px;font-size:12px">${utm_campaign || '—'}</td></tr>
            <tr><td style="padding:3px 12px;color:#888;font-size:12px">utm_content</td><td style="padding:3px 12px;font-size:12px">${utm_content || '—'}</td></tr>
            <tr><td style="padding:3px 12px;color:#888;font-size:12px">utm_term</td><td style="padding:3px 12px;font-size:12px">${utm_term || '—'}</td></tr>
            <tr><td style="padding:3px 12px;color:#888;font-size:12px">fbclid</td><td style="padding:3px 12px;font-size:12px">${fbclid || '—'}</td></tr>
            <tr><td style="padding:3px 12px;color:#888;font-size:12px">landing_page</td><td style="padding:3px 12px;font-size:12px">${landing_page || '—'}</td></tr>
            <tr><td style="padding:3px 12px;color:#888;font-size:12px">referrer</td><td style="padding:3px 12px;font-size:12px">${referrer || '—'}</td></tr>`
        : '';
    await transporter.sendMail({
        from: user,
        to,
        subject: `Нова реєстрація: ${center_name}`,
        text: `Нова заявка з лендингу:\n\nОрганізація: ${center_name}\nEmail: ${email}\nТелефон: ${phone || '—'}\nТип закладу: ${orgTypeMap[org_type] || org_type || '—'}\nКількість учнів: ${studentsMap[students_count] || students_count || '—'}\nМова: ${langLabel}\nДжерело: ${sourceLabel}\nДата: ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })}${utmSection}${quizSection}`,
        html: `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
            <tr><td style="padding:6px 12px;color:#666">Організація:</td><td style="padding:6px 12px"><strong>${center_name}</strong></td></tr>
            <tr><td style="padding:6px 12px;color:#666">Email:</td><td style="padding:6px 12px">${email}</td></tr>
            <tr><td style="padding:6px 12px;color:#666">Телефон:</td><td style="padding:6px 12px">${phone || '—'}</td></tr>
            <tr><td style="padding:6px 12px;color:#666">Тип закладу:</td><td style="padding:6px 12px">${orgTypeMap[org_type] || org_type || '—'}</td></tr>
            <tr><td style="padding:6px 12px;color:#666">К-сть учнів:</td><td style="padding:6px 12px">${studentsMap[students_count] || students_count || '—'}</td></tr>
            <tr><td style="padding:6px 12px;color:#666">Мова:</td><td style="padding:6px 12px">${langLabel}</td></tr>
            <tr><td style="padding:6px 12px;color:#666">Джерело:</td><td style="padding:6px 12px">${sourceLabel}</td></tr>
            <tr><td style="padding:6px 12px;color:#666">Дата:</td><td style="padding:6px 12px">${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })}</td></tr>
            ${utmHtml}
            ${quizHtml}
        </table>`
    });
    console.log('Registration email sent to', to);
    return true;
}

// ─── Brevo i18n — все тексты писем сгруппированы по языку ────────────────
// Чтобы добавить новый язык (ru/en/pl/cs): скопировать блок 'uk', перевести тексты.
// Строки answers.* должны совпадать с текстами вариантов ответов в quiz.html.
const BREVO_I18N = {
    uk: {
        tagline: 'Доказова освіта для вашого центру',
        signature: {
            regards:  'З повагою,',
            name:     'Олексій Светлічний',
            title:    'CEO & Founder, Neuro.Educatimo',
            contacts: '+380503281224 · @alekssvet · neuro.educatimo.com',
            footer:   'Neuro.Educatimo · hello@neuro.educatimo.com',
        },
        videoCaption: 'Учні → Аналітика → Звіти під вашим брендом · 2 хв 29 сек',
        landing: {
            subject:  (name) => `${name}, дякуємо за реєстрацію — ось що далі`,
            greeting: (name) => `Вітаємо, ${name}! 👋`,
            p1:       'Дякуємо за реєстрацію в Neuro.Educatimo.',
            p2:       (bold) => `Протягом кількох годин ми активуємо ваш <strong>${bold}</strong> та надішлемо запрошення для входу в платформу.`,
            p2bold:   'безкоштовний місяць доступу',
            p3:       'А поки що — подивіться коротке відео про те, як платформа виглядає зсередини:',
            nextTitle: 'Що буде далі:',
            steps: [
                '✅ &nbsp;Ми активуємо ваш акаунт',
                '📧 &nbsp;Надішлемо запрошення з посиланням для входу',
                '🚀 &nbsp;Повний доступ на 1 місяць безкоштовно',
            ],
        },
        quiz: {
            subject:   (name) => `${name}, ось ваш персональний розбір — Neuro.Educatimo`,
            greeting:  (name) => `Вітаємо, ${name}!`,
            quizTitle: 'Ви щойно пройшли квіз «Чи готовий ваш центр до доказового навчання?»',
            quizIntro: 'Ми проаналізували ваші відповіді та підготували персональний розбір — де саме ваш центр зараз втрачає клієнтів і гроші, та як це виправити.',
            nextTitle: 'Що далі?',
            nextP1:    'Протягом кількох годин ми надішлемо запрошення для входу в платформу разом з місяцем безкоштовного доступу. Нічого додатково робити не потрібно.',
            nextP2:    'А поки що — подивіться як платформа виглядає зсередини:',
            fallback:  'Ваш центр вже на хорошому рівні організації! Neuro.Educatimo допоможе вивести доказовий підхід на наступний рівень та зміцнити довіру батьків через об\'єктивні дані.',
            segments: {
                churn: {
                    title: '🔴 ТОЧКА ВТРАТ: Батьки йдуть, бо не бачать результату',
                    p1: 'Ви відзначили, що батьки регулярно скаржаться на відсутність видимого прогресу. Це найпоширеніша причина відтоку в освітніх центрах — і вона вирішується не «кращими поясненнями», а цифрами.',
                    p2: 'Батько, який бачить графік «було → стало» по увазі та пам\'яті своєї дитини, не ставить питання «навіщо ми сюди ходимо?». Він продовжує абонемент. Сам.',
                    p3: 'Наші партнери зафіксували зниження відтоку на 25% вже в перші 3 місяці після впровадження Neuro.Educatimo.',
                },
                control: {
                    title: '🔴 ТОЧКА ВТРАТ: Якість навчання залежить від конкретного педагога',
                    p1: 'Ви відзначили, що єдиного стандарту діагностики немає або кожен педагог оцінює по-своєму. При масштабуванні або зміні педагога якість «плаває» — і ви не маєте інструменту це об\'єктивно виміряти.',
                    p2: 'Кожні 3 місяці Neuro.Educatimo автоматично збирає когнітивний зріз по кожному учню. Директор бачить тверді дані, а не суб\'єктивний звіт педагога. Якщо група просідає — система сигналізує негайно.',
                },
                upsell: {
                    title: '🔴 ТОЧКА ВТРАТ: Ви не монетизуєте діагностику',
                    p1: 'Ви відзначили що підготовка звіту займає багато часу або допродажі відбуваються інтуїтивно. А між тим когнітивна діагностика — це окрема послуга вартістю 300–800 грн за сесію.',
                    p2: 'Neuro.Educatimo генерує повний звіт автоматично — за лічені секунди. Звіт виходить під брендом вашого центру (White Label). Наші партнери отримали новий revenue stream без додаткових витрат.',
                },
                scale: {
                    title: '🔴 ТОЧКА ВТРАТ: Якість не масштабується на нові філії',
                    p1: 'Ви відзначили що при відкритті нових філій або навчанні нових педагогів якість важко підтримувати на єдиному рівні.',
                    p2: 'Neuro.Educatimo дає керівнику мережі єдиний стандарт вимірювання якості по всіх локаціях. White Label: кожна філія отримує звіти під своїм брендом, але за єдиною методологією.',
                },
                burnout: {
                    title: '🔴 ТОЧКА ВТРАТ: Вигорання педагогів та втрата "складних" учнів',
                    p1: 'Ви відзначили, що стандартні методики навчання працюють не для всіх дітей, або підхід доводиться шукати інтуїтивно. Без розуміння когнітивних причин неуспішності педагоги вигорають, а батьки часто забирають дітей до інших фахівців, що призводить до втрати прибутку.',
                    p2: 'Neuro.Educatimo працює як "рентген" когнітивних здібностей. Платформа показує, яка саме функція (наприклад, увага, робоча пам\'ять чи швидкість обробки інформації) гальмує навчання. Завдяки цьому педагог може підібрати індивідуальний підхід, спираючись на виміряні сильні сторони дитини, що робить інклюзію системною та зберігає клієнтів у вашому закладі.',
                },
            },
            // Точные строки ответов — должны совпадать с вариантами в quiz.html
            answers: {
                q2_churn:   ['Дуже часто — це головна причина відходу', 'Час від часу, особливо через 2–3 місяці'],
                q1_control: ['Тільки словесна оцінка педагога', 'Домашні завдання та тести'],
                q3_control: ['Ні, педагог оцінює сам', 'Так, але різні педагоги роблять по-різному'],
                q4_upsell:  ['Понад годину — це великий біль', '30–60 хвилин'],
                q5_upsell:  ['Ні, не знаємо що пропонувати', 'Іноді, але інтуїтивно', 'Пробували, але без системи'],
                q6_scale:   ['Важко — якість залежить від конкретних людей', 'Повільно — потрібно навчати кожного педагога'],
                q7_burnout: ['Так, це часта проблема, яка призводить до вигорання вчителів.', 'Буває з окремими дітьми, намагаємося підібрати підхід інтуїтивно.', 'Рекомендуємо батькам звернутися до сторонніх фахівців.'],
            },
        },
    },
    // ru: { ... },  // добавить при запуске RU-версии
    // en: { ... },  // добавить при запуске EN-версии
    // pl: { ... },  // добавить при запуске PL-версии
    // cs: { ... },  // добавить при запуске CS-версии
};

// ─── Вспомогательный HTML-каркас письма ──────────────────────────────────
function _brevoEmailWrap(t, bodyHtml) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#1B4F72;padding:32px 40px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:22px;font-weight:bold;">Neuro.Educatimo</p>
    <p style="margin:8px 0 0;color:#AED6F1;font-size:14px;">${t.tagline}</p>
  </td></tr>
  ${bodyHtml}
  <tr><td style="padding:0 40px 40px;">
    <p style="margin:0 0 4px;font-size:15px;color:#2C3E50;">${t.signature.regards}</p>
    <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#1B4F72;">${t.signature.name}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#7F8C8D;">${t.signature.title}</p>
    <p style="margin:0;font-size:13px;color:#7F8C8D;">${t.signature.contacts}</p>
  </td></tr>
  <tr><td style="background:#F8F9FA;padding:20px 40px;text-align:center;border-top:1px solid #EAECEE;">
    <p style="margin:0;font-size:12px;color:#BDC3C7;">${t.signature.footer}</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function _brevoVideoBlock(t) {
    return `
  <tr><td style="padding:0 40px 32px;">
    <a href="${VIDEO_URL}" target="_blank" style="display:block;text-decoration:none;">
      <img src="${VIDEO_PREVIEW_URL}" alt="Огляд Neuro.Educatimo" width="520" style="width:100%;max-width:520px;display:block;border-radius:8px;"/>
    </a>
    <p style="margin:12px 0 0;text-align:center;font-size:13px;color:#7F8C8D;">${t.videoCaption}</p>
  </td></tr>`;
}

// ─── Brevo: письмо лиду после формы лендинга ──────────────────────────────
function buildLandingEmailHtml(orgName, lang = 'uk') {
    const t = BREVO_I18N[lang] || BREVO_I18N.uk;
    const l = t.landing;
    const stepsHtml = l.steps.map(s =>
        `<p style="margin:0 0 6px;font-size:14px;color:#2C3E50;">${s}</p>`
    ).join('');

    const body = `
  <tr><td style="padding:40px 40px 24px;">
    <h1 style="margin:0 0 16px;font-size:24px;color:#1B4F72;">${l.greeting(orgName)}</h1>
    <p style="font-size:16px;color:#2C3E50;line-height:1.6;">${l.p1}</p>
    <p style="font-size:16px;color:#2C3E50;line-height:1.6;">${l.p2(l.p2bold)}</p>
    <p style="font-size:16px;color:#2C3E50;line-height:1.6;">${l.p3}</p>
  </td></tr>
  ${_brevoVideoBlock(t)}
  <tr><td style="padding:0 40px 32px;">
    <table width="100%" style="background:#EBF5FB;border-radius:8px;border-left:4px solid #2E86C1;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#1B4F72;">${l.nextTitle}</p>
      ${stepsHtml}
    </td></tr></table>
  </td></tr>`;

    return _brevoEmailWrap(t, body);
}

// ─── Brevo: письмо лиду после квиза ──────────────────────────────────────
function buildQuizEmailHtml(orgName, qa, lang = 'uk') {
    const t  = BREVO_I18N[lang] || BREVO_I18N.uk;
    const q  = t.quiz;
    const an = q.answers;
    const sg = q.segments;

    const q1 = qa.q1 || '';
    const q2 = qa.q2 || '';
    const q3 = qa.q3 || '';
    const q4 = qa.q4 || '';
    const q5 = qa.q5 || '';
    const q6 = qa.q6 || '';
    const q7 = qa.q7 || '';

    const seg_churn   = an.q2_churn.includes(q2);
    const seg_control = an.q1_control.includes(q1) || an.q3_control.includes(q3);
    const seg_upsell  = an.q4_upsell.includes(q4)  || an.q5_upsell.includes(q5);
    const seg_scale   = an.q6_scale.includes(q6);
    const seg_burnout = an.q7_burnout.includes(q7);

    const segBlock = (s) => `
    <div style="margin:0 0 24px;padding:20px 24px;background:#FDF2F8;border-left:4px solid #C0392B;border-radius:4px;">
      <h3 style="margin:0 0 12px;color:#C0392B;font-size:16px;">${s.title}</h3>
      <p style="margin:0 0 8px;font-size:14px;color:#2C3E50;line-height:1.6;">${s.p1}</p>
      ${s.p2 ? `<div style="margin-top:10px;padding:10px 14px;background-color:#f0fdf4;border-radius:6px;">
        <p style="margin:0;font-size:14px;color:#15803d;line-height:1.6;font-weight:500;"><strong>🟢 Рішення:</strong> ${s.p2}</p>
      </div>` : ''}
      ${s.p3 ? `<p style="margin:8px 0 0;font-size:14px;color:#2C3E50;line-height:1.6;">${s.p3}</p>` : ''}
    </div>`;

    let blocks = '';
    if (seg_churn)   blocks += segBlock(sg.churn);
    if (seg_control) blocks += segBlock(sg.control);
    if (seg_upsell)  blocks += segBlock(sg.upsell);
    if (seg_scale)   blocks += segBlock(sg.scale);
    if (seg_burnout) blocks += segBlock(sg.burnout);
    if (!blocks) blocks = `
    <div style="margin:0 0 24px;padding:20px 24px;background:#EBF5FB;border-left:4px solid #2E86C1;border-radius:4px;">
      <p style="margin:0;font-size:14px;color:#2C3E50;line-height:1.6;">${q.fallback}</p>
    </div>`;

    const body = `
  <tr><td style="padding:40px 40px 24px;">
    <h1 style="margin:0 0 16px;font-size:24px;color:#1B4F72;">${q.greeting(orgName)}</h1>
    <p style="font-size:16px;color:#2C3E50;line-height:1.6;">${q.quizTitle}</p>
    <p style="font-size:16px;color:#2C3E50;line-height:1.6;">${q.quizIntro}</p>
  </td></tr>
  <tr><td style="padding:0 40px;">${blocks}</td></tr>
  <tr><td style="padding:24px 40px 32px;">
    <table width="100%" style="background:#EBF5FB;border-radius:8px;border-left:4px solid #2E86C1;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#1B4F72;">${q.nextTitle}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#2C3E50;line-height:1.6;">${q.nextP1}</p>
      <p style="margin:0;font-size:14px;color:#2C3E50;">${q.nextP2}</p>
    </td></tr></table>
  </td></tr>
  ${_brevoVideoBlock(t)}`;

    return _brevoEmailWrap(t, body);
}

// ─── Brevo: транспортная функция (fire-and-forget) ────────────────────────
async function sendBrevoLeadEmail(toEmail, toName, subject, html) {
    if (!process.env.BREVO_API_KEY) {
        console.warn('Brevo: BREVO_API_KEY not set, skipping lead email');
        return;
    }
    try {
        await brevoTransac.sendTransacEmail({
            sender: BREVO_SENDER,
            to: [{ email: toEmail, name: toName }],
            subject,
            htmlContent: html
        });
        console.log('Brevo lead email sent to', toEmail);
    } catch (err) {
        console.error('Brevo lead email error:', err.message || err);
    }
}

// API Endpoint: save to DB and/or send email. Success if at least one works (so form works even when DB is unavailable on prod).
app.post('/api/register', parseForm, async (req, res) => {
    const { email, lang } = req.body;
    // Support both old field name (center_name) and new (org_name)
    const center_name = req.body.org_name || req.body.center_name;
    const phone = req.body.phone || null;
    const org_type = req.body.org_type || null;
    const students_count = req.body.students_count || null;
    const source = req.body.source || 'landing_form';
    const utm_source   = req.body.utm_source   || '';
    const utm_medium   = req.body.utm_medium   || '';
    const utm_campaign = req.body.utm_campaign || '';
    const utm_content  = req.body.utm_content  || '';
    const utm_term     = req.body.utm_term     || '';
    const fbclid       = req.body.fbclid       || '';
    const landing_page = req.body.landing_page || '';
    const referrer     = req.body.referrer     || '';
    // quiz_answers may be sent as JSON string from quiz page
    let quiz_answers = null;
    if (req.body.quiz_answers) {
        try { quiz_answers = JSON.parse(req.body.quiz_answers); } catch (_) { quiz_answers = req.body.quiz_answers; }
    }

    if (!email || !center_name) {
        return res.status(400).json({ error: 'Email and Organization Name are required' });
    }

    let dbOk = false;
    let emailOk = false;

    try {
        await pool.query(
            `INSERT INTO landing_waitlist (email, center_name, lang, phone, org_type, students_count, source, quiz_answers)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [email, center_name, lang || null, phone, org_type, students_count, source, quiz_answers ? JSON.stringify(quiz_answers) : null]
        );
        dbOk = true;
    } catch (err) {
        console.error('Error saving to database', err);
    }

    try {
        const sent = await sendRegistrationEmail({ email, center_name, lang, phone, org_type, students_count, source, quiz_answers, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, landing_page, referrer });
        if (sent) emailOk = true;
    } catch (err) {
        console.error('Error sending registration email:', err.message || err);
    }

    if (dbOk || emailOk) {
        if (emailOk) console.log('Registration: success (email sent)');
        else console.log('Registration: success (saved to DB only, email not sent)');

        // Brevo: send lead email (fire-and-forget, does not affect response)
        // lang comes as 'UK'/'RU'/'EN'/'PL'/'CZ' — normalise to lowercase
        const langKey = (lang || 'uk').toLowerCase();
        const i18n = BREVO_I18N[langKey] || BREVO_I18N.uk;
        if (source === 'quiz' && quiz_answers) {
            sendBrevoLeadEmail(
                email,
                center_name,
                i18n.quiz.subject(center_name),
                buildQuizEmailHtml(center_name, quiz_answers, langKey)
            );
        } else {
            sendBrevoLeadEmail(
                email,
                center_name,
                i18n.landing.subject(center_name),
                buildLandingEmailHtml(center_name, langKey)
            );
        }

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
        const result = await pool.query(
            'SELECT slug, language, translation_id, updated_at, created_at FROM articles ORDER BY created_at DESC'
        );
        const articles = result.rows;
        const baseUrl = 'https://www.neuro.educatimo.com';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

        // Static language home pages only (no old ua/cz or index)
        ['ru', 'en', 'uk', 'pl', 'cs'].forEach(lang => {
            xml += `
   <url>
      <loc>${baseUrl}/${lang}/</loc>
      <changefreq>monthly</changefreq>
      <priority>1.0</priority>
   </url>`;
        });

        const translationGroups = new Map();
        articles.forEach(article => {
            const key = article.translation_id || `self:${article.slug}`;
            if (!translationGroups.has(key)) translationGroups.set(key, []);
            translationGroups.get(key).push(article);
        });

        // Blog pages with hreflang alternates
        articles.forEach(article => {
            const date = article.updated_at || article.created_at;
            const lastmod = new Date(date).toISOString();
            const key = article.translation_id || `self:${article.slug}`;
            const group = translationGroups.get(key) || [article];
            const altMap = buildAlternateMap(group, baseUrl);
            const xDefault = altMap.en || altMap.uk || altMap.ru || `${baseUrl}/blog/${article.slug}`;
            xml += `
   <url>
      <loc>${baseUrl}/blog/${article.slug}</loc>
      ${Object.entries(altMap).map(([iso, url]) => `<xhtml:link rel="alternate" hreflang="${iso}" href="${url}" />`).join('\n      ')}
      <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault}" />
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
        const dbLang = toDbLang(urlLang);
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
            canonicalUrl: `https://www.neuro.educatimo.com/blog?language=${urlLang}`,
            alternateUrls: {
                ru: 'https://www.neuro.educatimo.com/blog?language=ru',
                en: 'https://www.neuro.educatimo.com/blog?language=en',
                uk: 'https://www.neuro.educatimo.com/blog?language=uk',
                pl: 'https://www.neuro.educatimo.com/blog?language=pl',
                cs: 'https://www.neuro.educatimo.com/blog?language=cs',
                'x-default': 'https://www.neuro.educatimo.com/blog?language=uk'
            },
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
        const isoLang = toIsoLang(language);
        const terms = TERMS[language] || TERMS['ru'];

        let translations = [article];
        if (article.translation_id) {
            const trResult = await pool.query(
                'SELECT slug, language FROM articles WHERE translation_id = $1',
                [article.translation_id]
            );
            if (trResult.rows.length > 0) translations = trResult.rows;
        }

        const alternateUrls = buildAlternateMap(translations, 'https://www.neuro.educatimo.com');
        alternateUrls['x-default'] = alternateUrls.en || alternateUrls.uk || alternateUrls.ru || `https://www.neuro.educatimo.com/blog/${slug}`;

        // Auto-linking
        article.content = linkify(article.content, language);

        // JSON-LD Schema
        const schemaJson = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://www.neuro.educatimo.com/blog/${slug}`
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
            currentUrl: `https://www.neuro.educatimo.com/blog/${slug}`,
            canonicalUrl: `https://www.neuro.educatimo.com/blog/${slug}`,
            alternateUrls,
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
