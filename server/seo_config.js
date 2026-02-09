// SEO Configuration and Localization

const KEYWORD_MAPS = {
    ru: [
        { word: 'внимание', link: '/ru/#features' },
        { word: 'память', link: '/ru/#features' },
        { word: 'мышление', link: '/ru/#features' },
        { word: 'когнитивн', link: '/ru/#features' },
        { word: 'диагностика', link: '/ru/#how-it-works' },
        { word: 'тестирование', link: '/ru/#how-it-works' },
        { word: 'платформа', link: '/ru/#hero' },
        { word: 'Neuro Educatimo', link: '/ru/#hero' },
        { word: 'Шульте', link: '/ru/#faq' },
        { word: 'педагог', link: '/ru/#audience' },
        { word: 'учитель', link: '/ru/#audience' },
        { word: 'родител', link: '/ru/#problem-solution' }
    ],
    ua: [
        { word: 'увага', link: '/uk/#features' },
        { word: 'пам\'ять', link: '/uk/#features' },
        { word: 'мислення', link: '/uk/#features' },
        { word: 'когнітивн', link: '/uk/#features' },
        { word: 'діагностика', link: '/uk/#how-it-works' },
        { word: 'тестування', link: '/uk/#how-it-works' },
        { word: 'платформа', link: '/uk/#hero' },
        { word: 'Neuro Educatimo', link: '/uk/#hero' },
        { word: 'Шульте', link: '/uk/#faq' },
        { word: 'педагог', link: '/uk/#audience' },
        { word: 'вчитель', link: '/uk/#audience' },
        { word: 'батьк', link: '/uk/#problem-solution' }
    ],
    en: [
        { word: 'attention', link: '/en/#features' },
        { word: 'memory', link: '/en/#features' },
        { word: 'thinking', link: '/en/#features' },
        { word: 'cognitive', link: '/en/#features' },
        { word: 'diagnostics', link: '/en/#how-it-works' },
        { word: 'testing', link: '/en/#how-it-works' },
        { word: 'platform', link: '/en/#hero' },
        { word: 'Neuro Educatimo', link: '/en/#hero' },
        { word: 'Schulte', link: '/en/#faq' },
        { word: 'teacher', link: '/en/#audience' },
        { word: 'educator', link: '/en/#audience' },
        { word: 'parent', link: '/en/#problem-solution' }
    ],
    pl: [
        { word: 'uwaga', link: '/pl/#features' },
        { word: 'pamięć', link: '/pl/#features' },
        { word: 'myślenie', link: '/pl/#features' },
        { word: 'poznawcz', link: '/pl/#features' },
        { word: 'diagnostyka', link: '/pl/#how-it-works' },
        { word: 'testowanie', link: '/pl/#how-it-works' },
        { word: 'platforma', link: '/pl/#hero' },
        { word: 'Neuro Educatimo', link: '/pl/#hero' },
        { word: 'Schulte', link: '/pl/#faq' },
        { word: 'nauczyciel', link: '/pl/#audience' },
        { word: 'rodzic', link: '/pl/#problem-solution' }
    ],
    cz: [
        { word: 'pozornost', link: '/cs/#features' },
        { word: 'paměť', link: '/cs/#features' },
        { word: 'myšlení', link: '/cs/#features' },
        { word: 'kognitivn', link: '/cs/#features' },
        { word: 'diagnostika', link: '/cs/#how-it-works' },
        { word: 'testování', link: '/cs/#how-it-works' },
        { word: 'platforma', link: '/cs/#hero' },
        { word: 'Neuro Educatimo', link: '/cs/#hero' },
        { word: 'Schulte', link: '/cs/#faq' },
        { word: 'učitel', link: '/cs/#audience' },
        { word: 'rodič', link: '/cs/#problem-solution' }
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
    },
    uk: {
        blogTitle: 'Блог Neuro Educatimo',
        blogSubtitle: 'Останні новини, статті та дослідження в галузі когнітивного розвитку.',
        readMore: 'Читати далі',
        backToBlog: 'Повернутися до блогу',
        noArticles: 'Статей поки немає.',
        menuBlog: 'Блог'
    },
    cs: {
        blogTitle: 'Blog Neuro Educatimo',
        blogSubtitle: 'Nejnovější zprávy, články a výzkum v oblasti kognitivního rozvoje.',
        readMore: 'Číst dále',
        backToBlog: 'Zpět na blog',
        noArticles: 'Zatím žádné články.',
        menuBlog: 'Blog'
    }
};

module.exports = { KEYWORD_MAPS, TERMS };
