// SEO Configuration and Localization

const KEYWORD_MAPS = {
    ru: [
        { word: 'внимание', link: '/#features' },
        { word: 'память', link: '/#features' },
        { word: 'мышление', link: '/#features' },
        { word: 'когнитивн', link: '/#features' }, // matches когнитивный, когнитивное etc. simple check
        { word: 'диагностика', link: '/#how-it-works' },
        { word: 'тестирование', link: '/#how-it-works' },
        { word: 'платформа', link: '/#hero' },
        { word: 'Neuro Educatimo', link: '/#hero' },
        { word: 'Шульте', link: '/#faq' },
        { word: 'педагог', link: '/#audience' },
        { word: 'учитель', link: '/#audience' },
        { word: 'родител', link: '/#problem-solution' }
    ],
    ua: [
        { word: 'увага', link: '/ua#features' },
        { word: 'пам\'ять', link: '/ua#features' },
        { word: 'мислення', link: '/ua#features' },
        { word: 'когнітивн', link: '/ua#features' },
        { word: 'діагностика', link: '/ua#how-it-works' },
        { word: 'тестування', link: '/ua#how-it-works' },
        { word: 'платформа', link: '/ua#hero' },
        { word: 'Neuro Educatimo', link: '/ua#hero' },
        { word: 'Шульте', link: '/ua#faq' },
        { word: 'педагог', link: '/ua#audience' },
        { word: 'вчитель', link: '/ua#audience' },
        { word: 'батьк', link: '/ua#problem-solution' }
    ],
    en: [
        { word: 'attention', link: '/en#features' },
        { word: 'memory', link: '/en#features' },
        { word: 'thinking', link: '/en#features' },
        { word: 'cognitive', link: '/en#features' },
        { word: 'diagnostics', link: '/en#how-it-works' },
        { word: 'testing', link: '/en#how-it-works' },
        { word: 'platform', link: '/en#hero' },
        { word: 'Neuro Educatimo', link: '/en#hero' },
        { word: 'Schulte', link: '/en#faq' },
        { word: 'teacher', link: '/en#audience' },
        { word: 'educator', link: '/en#audience' },
        { word: 'parent', link: '/en#problem-solution' }
    ],
    pl: [
        { word: 'uwaga', link: '/pl#features' },
        { word: 'pamięć', link: '/pl#features' },
        { word: 'myślenie', link: '/pl#features' },
        { word: 'poznawcz', link: '/pl#features' },
        { word: 'diagnostyka', link: '/pl#how-it-works' },
        { word: 'testowanie', link: '/pl#how-it-works' },
        { word: 'platforma', link: '/pl#hero' },
        { word: 'Neuro Educatimo', link: '/pl#hero' },
        { word: 'Schulte', link: '/pl#faq' },
        { word: 'nauczyciel', link: '/pl#audience' },
        { word: 'rodzic', link: '/pl#problem-solution' }
    ],
    cz: [
        { word: 'pozornost', link: '/cz#features' },
        { word: 'paměť', link: '/cz#features' },
        { word: 'myšlení', link: '/cz#features' },
        { word: 'kognitivn', link: '/cz#features' },
        { word: 'diagnostika', link: '/cz#how-it-works' },
        { word: 'testování', link: '/cz#how-it-works' },
        { word: 'platforma', link: '/cz#hero' },
        { word: 'Neuro Educatimo', link: '/cz#hero' },
        { word: 'Schulte', link: '/cz#faq' },
        { word: 'učitel', link: '/cz#audience' },
        { word: 'rodič', link: '/cz#problem-solution' }
    ]
};

const TERMS = {
    ru: {
        blogTitle: 'Блог Neuro Educatimo',
        blogSubtitle: 'Последние новости, статьи и исследования в области когнитивного развития.',
        readMore: 'Читать далее',
        backToBlog: 'Вернуться в блог',
        noArticles: 'Статей пока нет.',
        menuBlog: 'Блог'
    },
    ua: {
        blogTitle: 'Блог Neuro Educatimo',
        blogSubtitle: 'Останні новини, статті та дослідження в галузі когнітивного розвитку.',
        readMore: 'Читати далі',
        backToBlog: 'Повернутися до блогу',
        noArticles: 'Статей поки немає.',
        menuBlog: 'Блог'
    },
    en: {
        blogTitle: 'Neuro Educatimo Blog',
        blogSubtitle: 'Latest news, articles and research in cognitive development.',
        readMore: 'Read more',
        backToBlog: 'Back to Blog',
        noArticles: 'No articles yet.',
        menuBlog: 'Blog'
    },
    pl: {
        blogTitle: 'Blog Neuro Educatimo',
        blogSubtitle: 'Najnowsze wiadomości, artykuły i badania z zakresu rozwoju poznawczego.',
        readMore: 'Czytaj więcej',
        backToBlog: 'Wróć do bloga',
        noArticles: 'Brak artykułów.',
        menuBlog: 'Blog'
    },
    cz: {
        blogTitle: 'Blog Neuro Educatimo',
        blogSubtitle: 'Nejnovější zprávy, články a výzkum v oblasti kognitivního rozvoje.',
        readMore: 'Číst dále',
        backToBlog: 'Zpět na blog',
        noArticles: 'Zatím žádné články.',
        menuBlog: 'Blog'
    }
};

module.exports = { KEYWORD_MAPS, TERMS };
