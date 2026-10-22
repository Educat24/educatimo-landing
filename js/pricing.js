/* Commercial prices match billing/admin screenshots dated 2026-10-22.
 * EUR: ECB 2026-10-21, 1 EUR = 1.1234 USD; ceil once on the term total.
 * No live FX service or changes to account billing/payment currencies. */
(() => {
  'use strict';
  const totalsUAH = {1: [2500,3750,6000],3: [6750,10000,16250],6: [12750,19000,30500],12: [25000,37500,60000]};
  const usdPerEuro = 1.1234;
  const copy = {
  "uk": {
    "title": "Тарифи",
    "intro": "Індивідуальне тестування, когнітивні тренування та робота з групами — оберіть можливості для вашої практики.",
    "language": "Мова",
    "currency": "Валюта",
    "term": "Термін підписки",
    "terms": [
      "1 місяць",
      "3 місяці",
      "6 місяців",
      "12 місяців"
    ],
    "choose": "Оберіть свій план",
    "taglines": [
      "Індивідуальне тестування",
      "Тестування та індивідуальний розвиток",
      "Для центрів, шкіл і груп"
    ],
    "features": [
      "Індивідуальне тестування онлайн та офлайн",
      "До 20 індивідуальних тестувань на місяць",
      "Безлімітне індивідуальне тестування",
      "Когнітивний паспорт",
      "Звіти та інтерпретація результатів",
      "Індивідуальні когнітивні тренування",
      "Групове тестування",
      "Групові когнітивні тренування"
    ],
    "includes": "Усе з Plus, а також:",
    "start": "Спробувати безкоштовно",
    "popular": "Для регулярної практики",
    "compare": "Порівняйте можливості",
    "assessmentLimit": "Індивідуальних тестувань на місяць",
    "cap": "Ліміт тестувань у Basic діє щомісяця за будь-якого терміну підписки.",
    "unlimited": "Безліміт",
    "limit": "20 / міс.",
    "available": "Включено",
    "unavailable": "Не включено",
    "total": "за весь термін",
    "month": "за місяць",
    "annual": "12 місяців за ціною 10",
    "reference": "Ціни в EUR — довідковий еквівалент доларових цін, округлений вгору до цілого євро.",
    "rate": "Курс ЄЦБ від 21.10.2026: 1 EUR = 1,1234 USD.",
    "payment": "Оплата підписки в особистому кабінеті — у гривнях. Умови оплати з інших країн уточнюйте під час демо.",
    "help": "Потрібна допомога з вибором?",
    "helpText": "Покажемо платформу та допоможемо обрати план для вашого формату роботи.",
    "demo": "Записатися на демо",
    "home": "Головна",
    "back": "На головну",
    "nojs": "Для вибору валюти й терміну підписки увімкніть JavaScript. Нижче вказані ціни за один місяць у доларах."
  },
  "en": {
    "title": "Pricing",
    "intro": "Individual assessments, cognitive training and group sessions — choose the tools for your practice.",
    "language": "Language",
    "currency": "Currency",
    "term": "Subscription term",
    "terms": [
      "1 month",
      "3 months",
      "6 months",
      "12 months"
    ],
    "choose": "Choose your plan",
    "taglines": [
      "Individual assessments",
      "Assessment and individual development",
      "For centres, schools and groups"
    ],
    "features": [
      "Individual assessments online and in person",
      "Up to 20 individual assessments per month",
      "Unlimited individual assessments",
      "Cognitive passport",
      "Reports and interpretation of results",
      "Individual cognitive training",
      "Group assessments",
      "Group cognitive training"
    ],
    "includes": "Everything in Plus, plus:",
    "start": "Start a free trial",
    "popular": "For regular practice",
    "compare": "Compare features",
    "assessmentLimit": "Individual assessments per month",
    "cap": "The Basic assessment limit applies each month, regardless of subscription term.",
    "unlimited": "Unlimited",
    "limit": "20 / month",
    "available": "Included",
    "unavailable": "Not included",
    "total": "for the full term",
    "month": "per month",
    "annual": "12 months for the price of 10",
    "reference": "EUR prices are indicative USD equivalents, rounded up to the next whole euro.",
    "rate": "ECB rate on 21 Oct 2026: EUR 1 = USD 1.1234.",
    "payment": "Subscriptions in your account are paid in Ukrainian hryvnias. For payment from other countries, please ask during your demo.",
    "help": "Need help choosing?",
    "helpText": "We will show you the platform and help you choose a plan for your practice.",
    "demo": "Book a demo",
    "home": "Home",
    "back": "Back to home",
    "nojs": "Enable JavaScript to choose currency and term. Prices below are for one month in USD."
  },
  "ru": {
    "title": "Тарифы",
    "intro": "Индивидуальное тестирование, когнитивные тренировки и работа с группами — выберите возможности для вашей практики.",
    "language": "Язык",
    "currency": "Валюта",
    "term": "Срок подписки",
    "terms": [
      "1 месяц",
      "3 месяца",
      "6 месяцев",
      "12 месяцев"
    ],
    "choose": "Выберите свой план",
    "taglines": [
      "Индивидуальное тестирование",
      "Тестирование и индивидуальное развитие",
      "Для центров, школ и групп"
    ],
    "features": [
      "Индивидуальное тестирование онлайн и офлайн",
      "До 20 индивидуальных тестирований в месяц",
      "Безлимитное индивидуальное тестирование",
      "Когнитивный паспорт",
      "Отчёты и интерпретация результатов",
      "Индивидуальные когнитивные тренировки",
      "Групповое тестирование",
      "Групповые когнитивные тренировки"
    ],
    "includes": "Всё из Plus, а также:",
    "start": "Попробовать бесплатно",
    "popular": "Для регулярной практики",
    "compare": "Сравните возможности",
    "assessmentLimit": "Индивидуальных тестирований в месяц",
    "cap": "Лимит тестирований Basic действует каждый месяц при любом сроке подписки.",
    "unlimited": "Безлимит",
    "limit": "20 / мес.",
    "available": "Включено",
    "unavailable": "Не включено",
    "total": "за весь срок",
    "month": "за месяц",
    "annual": "12 месяцев по цене 10",
    "reference": "Цены в EUR — справочный эквивалент долларовых цен, округлённый вверх до целого евро.",
    "rate": "Курс ЕЦБ на 21.10.2026: 1 EUR = 1,1234 USD.",
    "payment": "Оплата подписки в личном кабинете — в гривнах. Условия оплаты из других стран уточняйте во время демо.",
    "help": "Нужна помощь с выбором?",
    "helpText": "Покажем платформу и поможем выбрать план под ваш формат работы.",
    "demo": "Записаться на демо",
    "home": "Главная",
    "back": "На главную",
    "nojs": "Для выбора валюты и срока включите JavaScript. Ниже цены за месяц в долларах."
  },
  "pl": {
    "title": "Cennik",
    "intro": "Badania indywidualne, trening poznawczy i praca z grupami — wybierz narzędzia dla swojej praktyki.",
    "language": "Język",
    "currency": "Waluta",
    "term": "Okres subskrypcji",
    "terms": [
      "1 miesiąc",
      "3 miesiące",
      "6 miesięcy",
      "12 miesięcy"
    ],
    "choose": "Wybierz swój plan",
    "taglines": [
      "Badania indywidualne",
      "Badania i rozwój indywidualny",
      "Dla centrów, szkół i grup"
    ],
    "features": [
      "Badania indywidualne online i stacjonarnie",
      "Do 20 badań indywidualnych miesięcznie",
      "Badania indywidualne bez limitu",
      "Paszport poznawczy",
      "Raporty i interpretacja wyników",
      "Indywidualny trening poznawczy",
      "Badania grupowe",
      "Grupowy trening poznawczy"
    ],
    "includes": "Wszystko z Plus oraz:",
    "start": "Wypróbuj bezpłatnie",
    "popular": "Do regularnej pracy",
    "compare": "Porównaj możliwości",
    "assessmentLimit": "Badania indywidualne miesięcznie",
    "cap": "Limit badań w Basic obowiązuje co miesiąc, niezależnie od okresu subskrypcji.",
    "unlimited": "Bez limitu",
    "limit": "20 / mies.",
    "available": "W pakiecie",
    "unavailable": "Poza pakietem",
    "total": "za cały okres",
    "month": "za miesiąc",
    "annual": "12 miesięcy w cenie 10",
    "reference": "Ceny w EUR to orientacyjny odpowiednik cen w USD, zaokrąglony w górę do pełnego euro.",
    "rate": "Kurs EBC z 21.10.2026: 1 EUR = 1,1234 USD.",
    "payment": "Subskrypcję w panelu opłaca się w hrywnach ukraińskich. O płatności z innych krajów zapytaj podczas prezentacji.",
    "help": "Potrzebujesz pomocy w wyborze?",
    "helpText": "Pokażemy platformę i pomożemy wybrać plan odpowiedni do Twojej pracy.",
    "demo": "Umów prezentację",
    "home": "Strona główna",
    "back": "Na stronę główną",
    "nojs": "Włącz JavaScript, aby wybrać walutę i okres. Poniżej ceny za miesiąc w USD."
  },
  "cs": {
    "title": "Ceník",
    "intro": "Individuální vyšetření, kognitivní trénink a práce se skupinami — vyberte si nástroje pro svou praxi.",
    "language": "Jazyk",
    "currency": "Měna",
    "term": "Délka předplatného",
    "terms": [
      "1 měsíc",
      "3 měsíce",
      "6 měsíců",
      "12 měsíců"
    ],
    "choose": "Vyberte si plán",
    "taglines": [
      "Individuální vyšetření",
      "Vyšetření a individuální rozvoj",
      "Pro centra, školy a skupiny"
    ],
    "features": [
      "Individuální vyšetření online i prezenčně",
      "Až 20 individuálních vyšetření měsíčně",
      "Neomezené individuální vyšetření",
      "Kognitivní pas",
      "Zprávy a interpretace výsledků",
      "Individuální kognitivní trénink",
      "Skupinové vyšetření",
      "Skupinový kognitivní trénink"
    ],
    "includes": "Vše z Plus a navíc:",
    "start": "Vyzkoušet zdarma",
    "popular": "Pro pravidelnou praxi",
    "compare": "Porovnejte možnosti",
    "assessmentLimit": "Individuální vyšetření měsíčně",
    "cap": "Limit vyšetření v Basic platí každý měsíc bez ohledu na délku předplatného.",
    "unlimited": "Neomezeně",
    "limit": "20 / měs.",
    "available": "Zahrnuto",
    "unavailable": "Nezahrnuto",
    "total": "za celé období",
    "month": "za měsíc",
    "annual": "12 měsíců za cenu 10",
    "reference": "Ceny v EUR jsou orientačním přepočtem cen v USD, zaokrouhleným nahoru na celé euro.",
    "rate": "Kurz ECB k 21. 10. 2026: 1 EUR = 1,1234 USD.",
    "payment": "Předplatné v účtu se platí v ukrajinských hřivnách. Na platby z jiných zemí se zeptejte při ukázce.",
    "help": "Potřebujete poradit s výběrem?",
    "helpText": "Ukážeme vám platformu a pomůžeme vybrat plán pro vaši praxi.",
    "demo": "Domluvit ukázku",
    "home": "Úvod",
    "back": "Zpět na úvod",
    "nojs": "Pro výběr měny a období zapněte JavaScript. Níže jsou měsíční ceny v USD."
  }
};
  const params = new URLSearchParams(location.search);
  const language = document.getElementById('language');
  const currency = document.getElementById('currency');
  let referrerLanguage = 'uk';
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === location.origin) referrerLanguage = referrer.pathname.split('/')[1];
  } catch { /* Direct visit: Ukrainian defaults. */ }
  const requestedLanguage = params.get('lang') || referrerLanguage;
  language.value = Object.hasOwn(copy, requestedLanguage) ? requestedLanguage : 'uk';
  currency.value = ['USD','UAH','EUR'].includes(params.get('currency')) ? params.get('currency') : language.value === 'uk' ? 'UAH' : 'EUR';
  let months = 1;
  function render() {
    const lang = language.value;
    const text = copy[lang];
    document.documentElement.lang = lang;
    document.title = text.title + ' — Neuro.Educatimo';
    document.querySelector('meta[name="description"]').content = text.intro;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = text[el.dataset.i18n]; });
    document.querySelectorAll('[data-feature]').forEach(el => { el.textContent = text.features[Number(el.dataset.feature)]; });
    document.querySelectorAll('[data-tagline]').forEach(el => { el.textContent = text.taglines[Number(el.dataset.tagline)]; });
    document.querySelectorAll('[data-limit]').forEach(el => { el.textContent = text.limit; });
    document.querySelectorAll('[data-unlimited]').forEach(el => { el.textContent = text.unlimited; });
    document.querySelectorAll('[data-home]').forEach(el => { el.href = '/' + lang + '/'; });
    document.querySelectorAll('[data-registration]').forEach(el => { el.href = '/' + lang + '/#registration'; el.textContent = text.start; });
    document.querySelectorAll('[data-months]').forEach((el,i) => {
      el.textContent = text.terms[i];
      el.setAttribute('aria-pressed', String(Number(el.dataset.months) === months));
    });
    const formatter = new Intl.NumberFormat(lang, {style:'currency', currency:currency.value, maximumFractionDigits:0, minimumFractionDigits:0});
    document.querySelectorAll('[data-price]').forEach(el => {
      const uah = totalsUAH[months][Number(el.dataset.price)];
      const amount = currency.value === 'UAH' ? uah : currency.value === 'EUR' ? Math.ceil((uah / 50) / usdPerEuro) : uah / 50;
      el.textContent = formatter.format(amount);
    });
    document.querySelectorAll('[data-period]').forEach(el => { el.textContent = months === 1 ? text.month : text.total + ' · ' + text.terms[[1,3,6,12].indexOf(months)]; });
    document.getElementById('annual-note').hidden = months !== 12;
    document.getElementById('eur-note').hidden = currency.value !== 'EUR';
  }
  function update() {
    render();
    const url = new URL(location.href);
    url.searchParams.set('lang', language.value);
    url.searchParams.set('currency', currency.value);
    history.replaceState(null, '', url);
  }
  language.addEventListener('change', update);
  currency.addEventListener('change', update);
  document.querySelectorAll('[data-months]').forEach(el => el.addEventListener('click', () => { months = Number(el.dataset.months); render(); }));
  render();
})();
