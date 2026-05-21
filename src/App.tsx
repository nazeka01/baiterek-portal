import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// ---- AUTH HELPER ----
const getAuthHeaders = (tok?: string | null): Record<string, string> =>
  tok ? { 'Authorization': `Bearer ${tok}` } : {};

const getJsonAuthHeaders = (tok?: string | null): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...getAuthHeaders(tok),
});

// ---- TYPES & INTERFACES ----
type Screen =
  | 'home'
  | 'catalog'
  | 'service'
  | 'app'
  | 'success'
  | 'login'
  | 'adminlogin'
  | 'dash'
  | 'admin'
  | 'org_details'
  | 'news_details'
  | 'news'
  | 'knowledge'
  | 'contacts'
  | 'vacancies'
  | 'about';

interface User {
  id?: number | string;
  name: string;
  iin: string;
  email?: string;
  phone?: string;
  companyName?: string;
  position?: string;
  role?: string;
}

interface AppRecord {
  id: string;
  title: string;
  date: string;
  userName?: string;
  userIin?: string;
  status: string;
  formData?: any;
}

interface Service {
  title: string;
  titleKz?: string;
  org: string;
  stage: number | null;
  cat: string;
  dur: string;
  result: string;
  desc: string;
  descKz?: string;
  conds: string[];
  condsKz?: string[];
  docs: string[];
  docsKz?: string[];
  eish?: string;
}

interface SchemaField {
  id: string;
  type: string;
  label: string;
  labelKz?: string;
  required?: boolean;
  disabled?: boolean;
  width?: string;
  options?: { v: string; l: string; lKz?: string }[];
  formula?: string;
  hint?: string;
  hintKz?: string;
  hasEgov?: boolean;
  cond?: { fieldId: string; value: string };
}

interface SchemaStep {
  id: string;
  title: string;
  titleKz?: string;
  fields: SchemaField[];
}

// ---- DICTIONARY FOR LOCALIZATION (RU / KZ) ----
const TRANSLATIONS: Record<string, Record<string, string>> = {
  ru: {
    logoTitle: 'Байтерек',
    logoSub: 'Единый портал поддержки бизнеса',
    navHome: 'Главная',
    navCatalog: 'Услуги',
    navNews: 'Новости',
    navFAQ: 'База знаний',
    navContacts: 'Контакты',
    navVacancies: 'Вакансии',
    cabinet: 'Личный кабинет',
    adminPanel: 'Панель администратора',
    login: 'Войти',
    logout: 'Выйти',
    applyBtn: 'Подать заявку',
    heroTitle: 'Единый портал поддержки бизнеса',
    heroSub: 'Республика Казахстан · Холдинг «Байтерек»',
    heroDesc: 'Все меры государственной поддержки в одном окне. Подайте заявку онлайн, отслеживайте статус, получайте результат.',
    catalogTitle: 'Каталог мер поддержки',
    searchPlaceholder: 'Поиск по услугам...',
    orgsHeader: 'Организации Холдинга',
    popularHeader: 'Популярные услуги',
    newsHeader: 'Новости холдинга',
    faqHeader: 'Вопросы и ответы',
    contactsHeader: 'Контакты и обратная связь',
    vacanciesHeader: 'Вакансии группы компаний',
    backBtn: ' Назад',
    loading: 'Загрузка...',
    all: 'Все',
    leasing: 'Лизинг',
    credits: 'Кредиты',
    subsidies: 'Субсидии',
    guarantees: 'Гарантии',
    searchBtn: 'Найти',
    a11yTitle: 'Версия для слабовидящих',
    a11yTextNormal: 'Обычный шрифт',
    a11yTextLarge: 'Крупный шрифт',
    a11yContrastNormal: 'Обычная контрастность',
    a11yContrastHigh: 'Высокая контрастность',
    breadcrumbsHome: 'Главная',
    breadcrumbsCatalog: 'Каталог услуг',
    breadcrumbsService: 'Детали услуги',
    breadcrumbsApp: 'Подача заявки',
    breadcrumbsCabinet: 'Личный кабинет',
    breadcrumbsOrg: 'Организация',
    breadcrumbsFAQ: 'База знаний',
    breadcrumbsContacts: 'Контакты',
    breadcrumbsVacancies: 'Вакансии',
  },
  kz: {
    logoTitle: 'Бәйтерек',
    logoSub: 'Бизнесті қолдау бірыңғай порталы',
    navHome: 'Басты бет',
    navCatalog: 'Қызметтер',
    navNews: 'Жаңалықтар',
    navFAQ: 'Білім базасы',
    navContacts: 'Байланыс',
    navVacancies: 'Бос орындар',
    cabinet: 'Жеке кабинет',
    adminPanel: 'Әкімшілік панелі',
    login: 'Кіру',
    logout: 'Шығу',
    applyBtn: 'Өтінім беру',
    heroTitle: 'Бизнесті қолдаудың бірыңғай порталы',
    heroSub: 'Қазақстан Республикасы · «Бәйтерек» холдингі',
    heroDesc: 'Мемлекеттік қолдаудың барлық шаралары бір терезеде. Өтінімді онлайн беріңіз, мәртебені бақылаңыз, нәтиже алыңыз.',
    catalogTitle: 'Қолдау шараларының каталогы',
    searchPlaceholder: 'Қызметтер бойынша іздеу...',
    orgsHeader: 'Холдинг ұйымдары',
    popularHeader: 'Танымал қызметтер',
    newsHeader: 'Холдинг жаңалықтары',
    faqHeader: 'Сұрақтар мен жауаптар',
    contactsHeader: 'Байланыс және кері байланыс',
    vacanciesHeader: 'Компаниялар тобының бос орындары',
    backBtn: ' Артқа',
    loading: 'Жүктелуде...',
    all: 'Барлығы',
    leasing: 'Лизинг',
    credits: 'Несиелер',
    subsidies: 'Субсидиялар',
    guarantees: 'Кепілдіктер',
    searchBtn: 'Іздеу',
    a11yTitle: 'Нашар көретіндерге арналған нұсқа',
    a11yTextNormal: 'Қалыпты қаріп',
    a11yTextLarge: 'Үлкен қаріп',
    a11yContrastNormal: 'Қалыпты контраст',
    a11yContrastHigh: 'Жоғары контраст',
    breadcrumbsHome: 'Басты бет',
    breadcrumbsCatalog: 'Қызметтер каталогы',
    breadcrumbsService: 'Қызмет мәліметтері',
    breadcrumbsApp: 'Өтінім беру',
    breadcrumbsCabinet: 'Жеке кабинет',
    breadcrumbsOrg: 'Ұйым',
    breadcrumbsFAQ: 'Білім базасы',
    breadcrumbsContacts: 'Байланыс',
    breadcrumbsVacancies: 'Бос орындар',
  }
};

// ---- SERVICES LIST DATA ----
const SERVICES: Service[] = [
  {
    title: 'Лизинг авиатранспорта и вагонов — I Этап',
    titleKz: 'Авиакөлік және вагондарды лизингке алу — I Кезең',
    org: 'БРК Лизинг',
    stage: 1,
    cat: 'leasing',
    dur: 'до 15 рабочих дней',
    result: 'Индикативное решение о возможности финансирования',
    desc: 'Предварительная заявка на финансовый лизинг авиатранспорта или железнодорожных вагонов через БРК Лизинг',
    descKz: 'Бәйтерек Девелопмент немесе ҚДБ Лизинг арқылы авиакөлік немесе теміржол вагондарының қаржылық лизингіне алдын ала өтінім беру',
    conds: ['Резидент РК', 'Срок деятельности более 1 года', 'Отсутствие налоговой задолженности', 'Сумма от 80 млн ₸'],
    condsKz: ['ҚР резиденті', 'Қызмет мерзімі 1 жылдан астам', 'Салық берешегінің болмауы', 'Суммасы 80 млн ₸-ден бастап'],
    docs: ['Устав компании', 'Свидетельство о регистрации', 'Финотчётность за 2 года', 'Бизнес-план проекта'],
    docsKz: ['Компания жарғысы', 'Тіркеу туралы куәлік', '2 жылдық қаржылық есептілік', 'Жобаның бизнес-жоспары']
  },
  {
    title: 'Лизинг авиатранспорта и вагонов — II Этап',
    titleKz: 'Авиакөлік және вагондарды лизингке алу — II Кезең',
    org: 'БРК Лизинг',
    stage: 2,
    cat: 'leasing',
    dur: 'до 45 рабочих дней',
    result: 'Договор финансового лизинга',
    desc: 'Основная заявка на лизинг после получения положительного индикативного решения первого этапа',
    descKz: 'Бірінші кезеңнің оң индикативтік шешімін алғаннан кейінгі лизингке негізгі өтінім',
    conds: ['Наличие одобрения I Этапа', 'Выполнение условий индикативного решения'],
    condsKz: ['I кезеңнің мақұлдануының болуы', 'Индикативтік шешім шарттарының орындалуы'],
    docs: ['Документы по сделке купли-продажи', 'Договор с поставщиком', 'Документы по залоговому обеспечению'],
    docsKz: ['Сатып алу-сату мәмілесі бойынша құжаттар', 'Жеткізушімен шарт', 'Кепілдік қамтамасыз ету бойынша құжаттар']
  },
  {
    title: 'Субсидирование процентной ставки по кредитам',
    titleKz: 'Несиелер бойынша пайыздық мөлшерлемені субсидиялау',
    org: 'Даму',
    stage: null,
    cat: 'subsidy',
    dur: 'до 30 рабочих дней',
    result: 'Снижение ставки вознаграждения до 7-8%',
    desc: 'Субсидирование процентной ставки по кредитам малого и среднего предпринимательства для снижения финансовой нагрузки',
    descKz: 'Қаржылық жүктемені азайту үшін шағын және орта кәсіпкерлік несиелері бойынша пайыздық мөлшерлемені субсидиялау',
    conds: ['Субъект МСБ', 'Кредит оформлен в банке-партнере', 'Деятельность в приоритетных секторах экономики'],
    condsKz: ['ШОБ субъектісі', 'Несие серіктес банкте рәсімделген', 'Экономиканың басым секторларындағы қызмет'],
    docs: ['Заявление-анкета', 'Кредитный договор с графиком погашения', 'Бизнес-план / Описание проекта'],
    docsKz: ['Өтінім-сауалнама', 'Өтеу кестесі бар несиелік шарт', 'Бизнес-жоспар / Жоба сипаттамасы']
  },
  {
    title: 'Долгосрочное кредитование проектов',
    titleKz: 'Жобаларды ұзақ мерзімді несиелеу',
    org: 'БРК',
    stage: null,
    cat: 'credit',
    dur: 'до 60 рабочих дней',
    result: 'Финансирование инвестиционного проекта',
    desc: 'Долгосрочное кредитование крупных инвестиционных и инфраструктурных проектов от 5 млрд тенге',
    descKz: 'Ірі инвестициялық және инфрақұрылымдық жобаларды 5 млрд теңгеден бастап ұзақ мерзімді несиелеу',
    conds: ['Сумма кредита от 5 млрд тенге', 'Окупаемость проекта', 'Собственное участие не менее 20%'],
    condsKz: ['Несие сомасы 5 млрд теңгеден бастап', 'Жобаның өзін-өзі ақтауы', 'Меншікті қатысу 20%-дан кем емес'],
    docs: ['Бизнес-план по стандартам БРК', 'Финансовые модели и отчетность за 3 года', 'Аудит залогов'],
    docsKz: ['ҚДБ стандарттары бойынша бизнес-жоспар', 'Қаржылық модельдер және 3 жылдық есептілік', 'Кепілдер аудиті']
  },
  {
    title: 'Гарантирование кредитов МСБ',
    titleKz: 'ШОБ несиелерін кепілдендіру',
    org: 'Даму',
    stage: null,
    cat: 'guarantee',
    dur: 'до 20 рабочих дней',
    result: 'Предоставление гарантийного сертификата до 85% от суммы кредита',
    desc: 'Предоставление гарантий фонда Даму при нехватке собственного залогового обеспечения в банках второго уровня',
    descKz: 'Екінші деңгейлі банктерде меншікті кепілдік қамтамасыз ету жеткіліксіз болған жағдайда Даму қорының кепілдіктерін ұсыну',
    conds: ['Нехватка собственного залога', 'Положительное решение банка о выдаче кредита', 'Отсутствие просроченной задолженности'],
    condsKz: ['Меншікті кепілдің жеткіліксіздігі', 'Банктің несие беру туралы оң шешімі', 'Мерзімі өткен берешектің болмауы'],
    docs: ['Заявление на гарантирование', 'Решение кредитного комитета банка', 'Копии документов по залогам'],
    docsKz: ['Кепілдік беруге өтінім', 'Банктің несие комитетінің шешімі', 'Кепілдер бойынша құжаттардың көшірмелері']
  },
  {
    title: 'Льготное кредитование АПК',
    titleKz: 'АӨК-ні жеңілдікті несиелеу',
    org: 'КазАгро',
    stage: null,
    cat: 'credit',
    dur: 'до 25 рабочих дней',
    result: 'Финансирование сельскохозяйственного производства по ставке от 6%',
    desc: 'Льготное кредитование агропромышленных предприятий, фермерских хозяйств и сельхозкооперативов для модернизации производства',
    descKz: 'Ауылшаруашылық өндірісін жаңғырту үшін агроөнеркәсіптік кәсіпорындарды, фермерлік шаруашылықтарды және ауыл шаруашылығы кооперативтерін жеңілдікті несиелеу',
    conds: ['Деятельность в сфере АПК', 'Наличие земельного или производственного актива', 'Опыт хозяйствования не менее 1 года', 'Сумма от 5 млн ₸'],
    condsKz: ['АӨК саласындағы қызмет', 'Жер немесе өндірістік активтің болуы', 'Шаруашылық жүргізу тәжірибесі 1 жылдан кем емес', 'Сомасы 5 млн ₸-ден бастап'],
    docs: ['Заявление-анкета на кредитование', 'Правоустанавливающие документы на землю/технику', 'Бизнес-план / Технико-экономическое обоснование', 'Финансовая отчетность за 1-2 года'],
    docsKz: ['Несиелеуге өтінім-сауалнама', 'Жерге/техникаға меншік құқығын белгілейтін құжаттар', 'Бизнес-жоспар / Техника-экономикалық негіздеме', '1-2 жылдық қаржылық есептілік']
  },
  {
    title: 'Экспортное финансирование МСБ',
    titleKz: 'ШОБ экспортын қаржыландыру',
    org: 'Даму',
    stage: null,
    cat: 'credit',
    dur: 'до 30 рабочих дней',
    result: 'Финансирование экспортных контрактов под гарантию сделки',
    desc: 'Поддержка экспортно-ориентированных малых и средних предприятий через льготное кредитование под экспортные контракты',
    descKz: 'Экспорттық шарттар бойынша жеңілдікті несиелеу арқылы экспортқа бағытталған шағын және орта кәсіпорындарды қолдау',
    conds: ['Субъект МСБ — экспортер', 'Наличие подписанного экспортного контракта', 'Деятельность в несырьевом секторе', 'Опыт экспортной деятельности не менее 6 месяцев'],
    condsKz: ['ШОБ субъектісі — экспорттаушы', 'Қол қойылған экспорттық шарттың болуы', 'Шикізаттық емес секторда қызмет', 'Экспорттық қызмет тәжірибесі 6 айдан кем емес'],
    docs: ['Копия экспортного контракта', 'Паспорт сделки', 'Финансовая отчетность за 2 года', 'Справка об отсутствии задолженности'],
    docsKz: ['Экспорттық шарттың көшірмесі', 'Мәміле паспорты', '2 жылдық қаржылық есептілік', 'Берешектің жоқтығы туралы анықтама']
  },
  {
    title: 'Регистрация компании в МФЦА',
    titleKz: 'МҚТА-да компанияны тіркеу',
    org: 'МФЦА',
    stage: null,
    cat: 'guarantee',
    dur: 'до 10 рабочих дней',
    result: 'Свидетельство о регистрации участника МФЦА и доступ к юрисдикции английского права',
    desc: 'Содействие в регистрации инвестиционных компаний, фондов и финтех-стартапов в Международном финансовом центре «Астана»',
    descKz: '«Астана» халықаралық қаржы орталығында инвестициялық компанияларды, қорларды және финтех-стартаптарды тіркеуге жәрдемдесу',
    conds: ['Финансовая или инвестиционная деятельность', 'Уставный капитал согласно классу лицензии', 'Наличие квалифицированного персонала'],
    condsKz: ['Қаржылық немесе инвестициялық қызмет', 'Лицензия сыныбына сәйкес жарғылық капитал', 'Білікті персоналдың болуы'],
    docs: ['Заявление о регистрации', 'Меморандум и устав', 'Бизнес-план на 3 года', 'Резюме директоров и акционеров', 'Документы AML/KYC'],
    docsKz: ['Тіркеу туралы өтінім', 'Меморандум және жарғы', '3 жылдық бизнес-жоспар', 'Директорлар мен акционерлердің түйіндемесі', 'AML/KYC құжаттары']
  },
  {
    title: 'Прямые инвестиции в несырьевой сектор',
    titleKz: 'Шикізаттық емес секторға тікелей инвестициялар',
    org: 'KIC',
    stage: null,
    cat: 'credit',
    dur: 'до 90 рабочих дней',
    result: 'Долевое инвестирование в капитал компании от 500 млн до 5 млрд ₸',
    desc: 'Прямые equity-инвестиции в несырьевые отрасли казахстанской экономики через КИК (Kazakhstan Investment Corporation)',
    descKz: 'ҚИК (Kazakhstan Investment Corporation) арқылы Қазақстан экономикасының шикізаттық емес салаларына тікелей equity-инвестициялар',
    conds: ['Несырьевой сектор экономики', 'Выручка от 1 млрд ₸ в год', 'Действующий бизнес с историей не менее 3 лет', 'Потенциал экспорта или импортозамещения'],
    condsKz: ['Экономиканың шикізаттық емес секторы', 'Жылдық кіріс 1 млрд ₸-ден бастап', 'Кем дегенде 3 жылдық тарихы бар қолданыстағы бизнес', 'Экспорт немесе импортты алмастыру потенциалы'],
    docs: ['Инвестиционный меморандум', 'Финансовые модели и прогнозы на 5 лет', 'Аудированная отчетность за 3 года', 'Структура акционерного капитала', 'Оценка бизнеса'],
    docsKz: ['Инвестициялық меморандум', '5 жылдық қаржылық модельдер мен болжамдар', '3 жылдық аудиторланған есептілік', 'Акционерлік капитал құрылымы', 'Бизнесті бағалау']
  }
];

// ---- NO-CODE FORM SCHEMA ----
const LEASING_SCHEMA: SchemaStep[] = [
  {
    id: 's1',
    title: 'Сведения о компании',
    titleKz: 'Компания туралы мәліметтер',
    fields: [
      { id: 'bin', type: 'iin_bin', label: 'БИН компании', labelKz: 'Компания БИН-і', required: true, width: 'half', hasEgov: true },
      { id: 'company_name', type: 'text', label: 'Наименование компании', labelKz: 'Компания атауы', required: true, width: 'full', disabled: true },
      { id: 'oked_name', type: 'text', label: 'Вид деятельности (ОКЭД)', labelKz: 'Қызмет түрі (ЭҚЖЖ)', width: 'half', disabled: true },
      { id: 'director', type: 'text', label: 'Руководитель', labelKz: 'Басшы', width: 'half', disabled: true },
      { id: 'phone', type: 'phone', label: 'Контактный телефон', labelKz: 'Байланыс телефоны', required: true, width: 'half' },
      { id: 'email', type: 'email', label: 'Электронная почта', labelKz: 'Электрондық пошта', required: true, width: 'half' },
    ]
  },
  {
    id: 's2',
    title: 'Предмет лизинга',
    titleKz: 'Лизинг нысаны',
    fields: [
      {
        id: 'leasing_type',
        type: 'radio',
        label: 'Тип предмета лизинга',
        labelKz: 'Лизинг нысанының түрі',
        required: true,
        width: 'full',
        options: [
          { v: 'aviation', l: 'Авиатранспорт (воздушные суда)', lKz: 'Авиакөлік (әуе кемелері)' },
          { v: 'wagons', l: 'Железнодорожные вагоны', lKz: 'Теміржол вагондары' }
        ]
      },
      {
        id: 'aviation_type',
        type: 'select',
        label: 'Тип воздушного судна',
        labelKz: 'Әуе кемесінің түрі',
        width: 'half',
        options: [
          { v: 'passenger', l: 'Пассажирское', lKz: 'Жолаушылар' },
          { v: 'cargo', l: 'Грузовое', lKz: 'Жүк таситын' },
          { v: 'helicopter', l: 'Вертолёт', lKz: 'Тікұшақ' }
        ],
        cond: { fieldId: 'leasing_type', value: 'aviation' }
      },
      {
        id: 'wagon_type',
        type: 'select',
        label: 'Тип вагонов',
        labelKz: 'Вагондардың түрі',
        width: 'half',
        options: [
          { v: 'covered', l: 'Крытые вагоны', lKz: 'Жабық вагондар' },
          { v: 'flatcar', l: 'Платформы', lKz: 'Платформалар' },
          { v: 'tank', l: 'Цистерны', lKz: 'Цистерналар' },
          { v: 'hopper', l: 'Хопперы', lKz: 'Хопперлер' }
        ],
        cond: { fieldId: 'leasing_type', value: 'wagons' }
      },
      { id: 'asset_cost', type: 'currency', label: 'Стоимость предмета лизинга (₸)', labelKz: 'Лизинг нысанының құны (₸)', required: true, width: 'half', hint: 'Минимум 80 000 000 ₸', hintKz: 'Минимум 80 000 000 ₸' },
      {
        id: 'supplier_country',
        type: 'select',
        label: 'Страна поставщика',
        labelKz: 'Жеткізуші ел',
        required: true,
        width: 'half',
        options: [
          { v: 'kz', l: 'Казахстан', lKz: 'Қазақстан' },
          { v: 'ru', l: 'Россия', lKz: 'Ресей' },
          { v: 'cn', l: 'Китай', lKz: 'Қытай' },
          { v: 'eu', l: 'Европа', lKz: 'Еуропа' }
        ]
      },
    ]
  },
  {
    id: 's3',
    title: 'Параметры финансирования',
    titleKz: 'Қаржыландыру параметрлері',
    fields: [
      {
        id: 'term',
        type: 'select',
        label: 'Срок лизинга',
        labelKz: 'Лизинг мерзімі',
        required: true,
        width: 'half',
        options: [
          { v: '3', l: '3 года', lKz: '3 жыл' },
          { v: '5', l: '5 лет', lKz: '5 жыл' },
          { v: '7', l: '7 лет', lKz: '7 жыл' },
          { v: '10', l: '10 лет', lKz: '10 жыл' }
        ]
      },
      {
        id: 'adv_pct',
        type: 'select',
        label: 'Авансовый платёж',
        labelKz: 'Аванстық төлем',
        required: true,
        width: 'half',
        options: [
          { v: '15', l: '15%', lKz: '15%' },
          { v: '20', l: '20%', lKz: '20%' },
          { v: '25', l: '25%', lKz: '25%' },
          { v: '30', l: '30%', lKz: '30%' }
        ]
      },
      { id: 'adv_amt', type: 'calculated', label: 'Сумма аванса (₸)', labelKz: 'Аванс сомасы (₸)', formula: 'asset_cost*adv_pct/100', width: 'half' },
      { id: 'fin_amt', type: 'calculated', label: 'Сумма финансирования (₸)', labelKz: 'Қаржыландыру сомасы (₸)', formula: 'asset_cost-adv_amt', width: 'half' },
      { id: 'monthly', type: 'calculated', label: 'Ориентировочный платёж/месяц (₸)', labelKz: 'Айлық төлем (бағдарлы) (₸)', formula: 'fin_amt/(term*12)', width: 'full' },
      { id: 'purpose', type: 'textarea', label: 'Описание проекта', labelKz: 'Жобаның сипаттамасы', required: true, width: 'full' },
    ]
  },
  {
    id: 's4',
    title: 'Документы',
    titleKz: 'Құжаттар',
    fields: [
      { id: 'doc1', type: 'file', label: 'Устав компании', labelKz: 'Компания жарғысы', required: true, width: 'full' },
      { id: 'doc2', type: 'file', label: 'Свидетельство о государственной регистрации', labelKz: 'Мемлекеттік тіркеу туралы куәлік', required: true, width: 'full' },
      { id: 'doc3', type: 'file', label: 'Финансовая отчётность за последние 2 года', labelKz: 'Соңғы 2 жылдағы қаржылық есептілік', required: true, width: 'full' },
      { id: 'doc4', type: 'file', label: 'Бизнес-план проекта', labelKz: 'Жобаның бизнес-жоспары', required: true, width: 'full' },
    ]
  }
];

// ---- SUBSIDIARY ORGANIZATIONS DATA ----
const ORGANIZATIONS = [
  { 
    abbr: 'БРК', 
    name: 'Банк Развития Казахстана', 
    nameKz: 'Қазақстанның Даму Банкі',
    color: '#e6f1fb', 
    text: '#185fa5',
    desc: 'Национальный институт развития, специализирующийся на финансировании крупных промышленных и инфраструктурных проектов.',
    descKz: 'Ірі өнеркәсіптік және инфрақұрылымдық жобаларды қаржыландыруға маманданған ұлттық даму институты.',
    director: 'Саркулов Абай Серикович',
    address: 'г. Астана, пр. Мангилик Ел, 55А',
    phone: '+7 (7172) 79-26-79',
    email: 'info@kdb.kz'
  },
  { 
    abbr: 'БРК-Л', 
    name: 'БРК Лизинг', 
    nameKz: 'ҚДБ Лизинг',
    color: '#eaf3de', 
    text: '#3b6d11',
    desc: 'Дочерняя организация Банка Развития Казахстана, предоставляющая услуги финансового лизинга оборудования и техники для крупных предприятий.',
    descKz: 'Қазақстанның Даму Банкінің еншілес ұйымы, ірі кәсіпорындар үшін жабдықтар мен техниканың қаржылық лизингі қызметтерін ұсынады.',
    director: 'Ибрашев Нурлан Бекболатович',
    address: 'г. Астана, пр. Кабанбай батыра, 17',
    phone: '+7 (7172) 79-04-10',
    email: 'info@kdbleasing.kz'
  },
  { 
    abbr: 'Даму', 
    name: 'Фонд развития предпринимательства «Даму»', 
    nameKz: '«Даму» кәсіпкерлікті дамыту қоры',
    color: '#faeeda', 
    text: '#854f0b',
    desc: 'Фонд, реализующий государственные программы финансовой и нефинансовой поддержки малого и среднего бизнеса в Казахстане.',
    descKz: 'Қазақстандағы шағын және орта бизнесті қаржылық және қаржылық емес қолдаудың мемлекеттік бағдарламаларын жүзеге асыратын қор.',
    director: 'Сарсекеев Габит Абдиллаевич',
    address: 'г. Алматы, ул. Гоголя, 111',
    phone: '+7 (727) 244-55-66',
    email: 'info@damu.kz'
  },
  { 
    abbr: 'КазАгро', 
    name: 'Аграрная кредитная корпорация (КазАгро)', 
    nameKz: 'Аграрлық несие корпорациясы (ҚазАгро)',
    color: '#fcebeb', 
    text: '#a32d2d',
    desc: 'Институт развития АПК, содействующий технической модернизации и стимулированию производства сельскохозяйственной продукции.',
    descKz: 'АӨК даму институты, ауыл шаруашылығы өнімдерін өндіруді ынталандыруға және техникалық жаңғыртуға ықпал етеді.',
    director: 'Карашукеев Ербол Шыракпаевич',
    address: 'г. Астана, ул. Кенесары, 18',
    phone: '+7 (7172) 55-99-00',
    email: 'info@acc.kz'
  },
  { 
    abbr: 'МФЦА', 
    name: 'Администрация МФЦА', 
    nameKz: 'АХҚО Әкімшілігі',
    color: '#e1f5ee', 
    text: '#0f6e56',
    desc: 'Финансовый хаб для стран Центральной Азии, Кавказа, ЕАЭС, Ближнего Востока и Западного Китая, работающий в рамках английского общего права.',
    descKz: 'Англияның жалпы құқығы аясында жұмыс істейтін Орталық Азия, Кавказ, ЕАЭО, Таяу Шығыс және Батыс Қытай елдеріне арналған қаржылық хаб.',
    director: 'Келимбетов Кайрат Нематович',
    address: 'г. Астана, пр. Мангилик Ел, 55/18',
    phone: '+7 (7172) 64-72-00',
    email: 'info@aifc.kz'
  },
  { 
    abbr: 'KIC', 
    name: 'Kazakhstan Investment Corporation (KIC)', 
    nameKz: 'Қазақстан Инвестициялық Корпорациясы (KIC)',
    color: '#eeedfe', 
    text: '#534ab7',
    desc: 'Управляющая компания на рынке прямых инвестиций (private equity), инвестирующая в несырьевые секторы экономики.',
    descKz: 'Экономиканың шикізаттық емес секторларына инвестиция салатын тікелей инвестициялар (private equity) нарығындағы басқарушы компания.',
    director: 'Жанадилов Ернар Бейсенулы',
    address: 'г. Астана, ул. Достык, 18',
    phone: '+7 (7172) 79-01-00',
    email: 'info@kic.kz'
  }
];

// ---- HELPER ENGINE FUNCTIONS ----
type FV = Record<string, unknown>;
function isVis(f: SchemaField, fv: FV): boolean {
  if (!f.cond) return true;
  return String(fv[f.cond.fieldId]) === f.cond.value;
}
function calcFormula(formula: string, fv: FV): number | null {
  let expr = formula;
  Object.keys(fv).sort((a, b) => b.length - a.length).forEach(k => {
    const v = parseFloat(String(fv[k] || 0)) || 0;
    expr = expr.replace(new RegExp(`\\b${k}\\b`, 'g'), String(v));
  });
  try {
    if (/^[\d\s+\-*/().]+$/.test(expr)) {
      // eslint-disable-next-line no-new-func
      const r = new Function(`return (${expr})`)() as number;
      return typeof r === 'number' && isFinite(r) ? Math.round(r) : null;
    }
  } catch {}
  return null;
}
function reCalc(steps: SchemaStep[], fv: FV): FV {
  const out = { ...fv };
  for (let i = 0; i < 8; i++) {
    steps.forEach(s => s.fields.forEach(f => {
      if (f.type === 'calculated' && f.formula) {
        const v = calcFormula(f.formula, out);
        if (v !== null) out[f.id] = v;
      }
    }));
  }
  return out;
}
function fmtCur(n: number): string {
  return Number(n).toLocaleString('ru-KZ') + ' ₸';
}

// ---- URL ROUTING MAP ----
const SCREEN_TO_PATH: Partial<Record<Screen, string>> = {
  home: '/',
  catalog: '/catalog',
  news: '/news',
  knowledge: '/knowledge',
  contacts: '/contacts',
  vacancies: '/vacancies',
  about: '/about',
  dash: '/cabinet',
  login: '/login',
  app: '/apply',
  success: '/success',
  org_details: '/org',
  news_details: '/news/article',
};

function screenFromPath(): Screen {
  const p = window.location.pathname;
  if (p === '/' || p === '') return 'home';
  if (p.startsWith('/catalog/service')) return 'service';
  if (p.startsWith('/catalog')) return 'catalog';
  if (p.startsWith('/news/article')) return 'news_details';
  if (p.startsWith('/news')) return 'news';
  if (p.startsWith('/knowledge')) return 'knowledge';
  if (p.startsWith('/contacts')) return 'contacts';
  if (p.startsWith('/vacancies')) return 'vacancies';
  if (p.startsWith('/about')) return 'about';
  if (p.startsWith('/cabinet')) return 'dash';
  if (p.startsWith('/login')) return 'login';
  if (p.startsWith('/apply')) return 'app';
  if (p.startsWith('/success')) return 'success';
  if (p.startsWith('/org')) return 'org_details';
  return 'home';
}

function svcIdxFromPath(): number {
  const match = window.location.pathname.match(/\/catalog\/service\/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ---- MAIN APP ----
const App: React.FC = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const [screen, setScreen] = useState<Screen>(() => screenFromPath());
  const [lang, setLang] = useState<'ru' | 'kz'>('ru');
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont] = useState(false);

  // States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>(() => localStorage.getItem('baiterek_token') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [svcIdx, setSvcIdx] = useState(() => svcIdxFromPath());
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [stats, setStats] = useState({ applications: 0, users: 0, services: 5 });
  const [successId, setSuccessId] = useState('');
  const [activeOrg, setActiveOrg] = useState<typeof ORGANIZATIONS[0] | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Database Data States
  const [news, setNews] = useState<any[]>([]);
  const [activeNews, setActiveNews] = useState<any | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [activeArticle, setActiveArticle] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // User Cabinet Details
  const [activeApp, setActiveApp] = useState<AppRecord | null>(null);
  const [appComments, setAppComments] = useState<any[]>([]);
  const [appDocs, setAppDocs] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Sign State (ECP Modal)
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [signKeyFile, setSignKeyFile] = useState('');
  const [signPassword, setSignPassword] = useState('');
  const [signDocField, setSignDocField] = useState<string>('application');
  const [signError, setSignError] = useState('');
  const [signSuccessMessage, setSignSuccessMessage] = useState('');

  // Online Booking
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingOrg, setBookingOrg] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingTopic, setBookingTopic] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  // Contacts / Feedback
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbSubject, setFbSubject] = useState('');
  const [fbMsg, setFbMsg] = useState('');
  const [fbSuccess, setFbSuccess] = useState(false);

  // Vacancies HR Countdown Redirect
  const [vacancyRedirectCount, setVacancyRedirectCount] = useState<number | null>(null);

  // Audit Logs (Admin)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Breadcrumbs track
  const [pathHistory, setPathHistory] = useState<Screen[]>(['home']);

  // Trans function
  const t = (key: string) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const go = useCallback((s: Screen, idx?: number) => {
    if (s === 'service' && idx !== undefined) setSvcIdx(idx);
    setScreen(s);
    setPathHistory(prev => {
      if (s === 'home') return ['home'];
      if (prev.includes(s)) return prev.slice(0, prev.indexOf(s) + 1);
      return [...prev, s];
    });
    let path = SCREEN_TO_PATH[s] || '/';
    if (s === 'service') path = `/catalog/service/${idx ?? 0}`;
    window.history.pushState({ screen: s, idx }, '', path);
    window.scrollTo(0, 0);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = (e.state?.screen as Screen) || screenFromPath();
      const idx = e.state?.idx ?? svcIdxFromPath();
      if (s === 'service') setSvcIdx(idx);
      setScreen(s);
      setPathHistory(prev => {
        if (s === 'home') return ['home'];
        if (prev.includes(s)) return prev.slice(0, prev.indexOf(s) + 1);
        return [...prev, s];
      });
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Sync class on documentElement for A11y
  useEffect(() => {
    document.documentElement.className = [
      highContrast ? 'high-contrast' : '',
      largeFont ? 'large-font' : '',
    ].filter(Boolean).join(' ');
  }, [highContrast, largeFont]);

  // Load database items
  const fetchNews = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/news');
      if (res.ok) setNews(await res.json());
    } catch (e) {
      console.log('Error loading news:', e);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/articles');
      if (res.ok) setArticles(await res.json());
    } catch (e) {
      console.log('Error loading FAQ:', e);
    }
  };

  const prevNotifCountRef = useRef<number>(-1);

  const showBrowserNotif = (title: string, body: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    const authHeader = getAuthHeaders(localStorage.getItem('baiterek_token'));
    try {
      const res = await fetch(`http://localhost:3001/api/notifications?userId=${user.id}`, { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter((n: any) => !n.IsRead).length;
        if (unread > prevNotifCountRef.current && prevNotifCountRef.current >= 0) {
          const newest = data.find((n: any) => !n.IsRead);
          if (newest) {
            showBrowserNotif('Байтерек Портал', newest.Message || 'Жаңа хабарлама / Новое уведомление');
          }
        }
        prevNotifCountRef.current = unread;
        setNotifications(data);
      }
    } catch (e) {
      console.log('Error loading notifications:', e);
    }
  }, [user]);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    const authHeader = getAuthHeaders(localStorage.getItem('baiterek_token'));
    try {
      const res = await fetch(`http://localhost:3001/api/bookings?userId=${user.id}`, { headers: authHeader });
      if (res.ok) setBookings(await res.json());
    } catch (e) {
      console.log('Error loading bookings:', e);
    }
  }, [user]);

  const fetchAuditLogs = async () => {
    const authHeader = getAuthHeaders(localStorage.getItem('baiterek_token'));
    try {
      const res = await fetch('http://localhost:3001/api/logs', { headers: authHeader });
      if (res.ok) setAuditLogs(await res.json());
    } catch (e) {
      console.log('Error loading audit logs:', e);
    }
  };

  const fetchAppsAndStats = useCallback(async () => {
    const authHeader = getAuthHeaders(localStorage.getItem('baiterek_token'));
    try {
      const appsRes = await fetch('http://localhost:3001/api/applications', { headers: authHeader });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        const mapped = appsData.map((a: any) => ({
          id: a.AppNumber,
          title: a.ServiceTitle || 'Лизинг авиатранспорта и вагонов — I Этап',
          date: new Date(a.CreatedAt).toLocaleDateString('ru-KZ'),
          userName: a.UserName || 'Пользователь',
          userIin: a.UserIin || '',
          status: a.Status || 'submitted',
          formData: JSON.parse(a.FormDataJson || '{}')
        }));
        setApps(mapped);
      }

      const statsRes = await fetch('http://localhost:3001/api/stats', { headers: authHeader });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.log('⚠️ Ошибка подключения к API:', e);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchNews();
    fetchArticles();
    fetchAppsAndStats();
    fetchAuditLogs();

    const savedUser = localStorage.getItem('baiterek_user');
    const savedAdmin = localStorage.getItem('baiterek_admin');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      const urlScreen = screenFromPath();
      // If URL points to a specific page, keep it; otherwise go to cabinet
      const urlSpecific = window.location.pathname !== '/' && window.location.pathname !== '';
      setScreen(urlSpecific ? urlScreen : 'dash');
    } else if (savedAdmin === 'true') {
      setIsAdmin(true);
      setScreen('admin');
    }
  }, [fetchAppsAndStats]);

  // Load User Specifics
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchBookings();
    }
  }, [user, fetchNotifications, fetchBookings]);

  // Poll notifications
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const onLogin = (u: User, t?: string) => {
    setUser(u);
    localStorage.setItem('baiterek_user', JSON.stringify(u));
    if (t) {
      setToken(t);
      localStorage.setItem('baiterek_token', t);
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    go('dash');
  };

  const onAdminLogin = (t?: string) => {
    setIsAdmin(true);
    localStorage.setItem('baiterek_admin', 'true');
    if (t) {
      setToken(t);
      localStorage.setItem('baiterek_token', t);
    }
    go('admin');
  };

  const onLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setToken('');
    localStorage.removeItem('baiterek_user');
    localStorage.removeItem('baiterek_admin');
    localStorage.removeItem('baiterek_token');
    setActiveApp(null);
    go('home');
  };

  const onSubmitApp = (id: string) => {
    setSuccessId(id);
    fetchAppsAndStats();
    go('success');
  };

  // Profile Form Handling
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileCompany, setProfileCompany] = useState(user?.companyName || '');
  const [profilePosition, setProfilePosition] = useState(user?.position || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfileCompany(user.companyName || '');
      setProfilePosition(user.position || '');
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: 'PATCH',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify({
          fullName: profileName,
          email: profileEmail,
          phone: profilePhone,
          companyName: profileCompany,
          position: profilePosition
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updated = {
          id: data.user.Id,
          name: data.user.FullName,
          iin: data.user.IIN,
          email: data.user.Email,
          phone: data.user.Phone,
          companyName: data.user.CompanyName,
          position: data.user.Position,
          role: data.user.Role
        };
        setUser(updated);
        localStorage.setItem('baiterek_user', JSON.stringify(updated));
        setProfileSavedMsg(true);
        setTimeout(() => setProfileSavedMsg(false), 3000);
      }
    } catch(e) {
      console.log('Error saving profile:', e);
    }
  };

  // Appointment Booking Action
  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !bookingOrg || !bookingDate || !bookingTime || !bookingTopic) {
      alert('Заполните все поля бронирования!');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify({
          userId: user.id,
          organization: bookingOrg,
          date: bookingDate,
          timeSlot: bookingTime,
          topic: bookingTopic + (bookingMessage ? ` (${bookingMessage})` : '')
        })
      });
      if (res.ok) {
        alert('Запись успешно забронирована и синхронизирована с CRM Bitrix!');
        setBookingOrg('');
        setBookingDate('');
        setBookingTime('');
        setBookingTopic('');
        setBookingMessage('');
        fetchBookings();
      }
    } catch(e) {
      console.log('Error creating booking:', e);
    }
  };

  // Load comments & doc versions for selected app details
  const loadAppDetails = useCallback(async (appId: string) => {
    const authH = getAuthHeaders(token);
    try {
      const commentsRes = await fetch(`http://localhost:3001/api/applications/${appId}/comments`, { headers: authH });
      if (commentsRes.ok) setAppComments(await commentsRes.json());

      const docsRes = await fetch(`http://localhost:3001/api/applications/${appId}/documents`, { headers: authH });
      if (docsRes.ok) setAppDocs(await docsRes.json());
    } catch(e) {
      console.log('Error loading comments/docs details:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectActiveApp = async (appRecord: AppRecord) => {
    setActiveApp(appRecord);
    await loadAppDetails(appRecord.id);
  };

  // Send application comments
  const sendComment = async () => {
    if (!newCommentText.trim() || !activeApp) return;
    try {
      const res = await fetch(`http://localhost:3001/api/applications/${activeApp.id}/comments`, {
        method: 'POST',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify({
          userId: user?.id || 1,
          userName: user?.name || 'Администратор',
          message: newCommentText
        })
      });
      if (res.ok) {
        setNewCommentText('');
        await loadAppDetails(activeApp.id);
      }
    } catch(e) {
      console.log('Error sending comment:', e);
    }
  };

  // Simulated Document Version upload
  const uploadDocVersion = async (docFieldId: string, label: string) => {
    if (!activeApp) return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.xlsx,.docx';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const res = await fetch(`http://localhost:3001/api/applications/${activeApp.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docFieldId,
            fileName: file.name,
            fileSize: file.size,
            uploadedBy: user?.name || 'Заявитель'
          })
        });
        if (res.ok) {
          alert(`Файл ${file.name} успешно загружен как новая версия документа!`);
          await loadAppDetails(activeApp.id);
        }
      } catch(e) {
        console.log('Error uploading doc version:', e);
      }
    };
    fileInput.click();
  };

  // ECP Signature Mock Execution
  const triggerSignECP = (fieldId: string) => {
    setSignDocField(fieldId);
    setSignKeyFile('');
    setSignPassword('');
    setSignError('');
    setSignSuccessMessage('');
    setIsSigningOpen(true);
  };

  const handleSignConfirm = async () => {
    if (!signKeyFile) {
      setSignError('Выберите файл сертификата ЭЦП');
      return;
    }
    if (signPassword !== '123456') {
      setSignError('Неверный PIN-код сертификата (по умолчанию: 123456)');
      return;
    }
    if (!activeApp) return;

    try {
      // Добавляем запись в комментарии и логи, а также отправляем уведомление об успешной подписи ЭЦП
      const msg = `Документ [${signDocField === 'application' ? 'Форма заявления' : signDocField}] успешно подписан ЭЦП владельца: ${user?.name || 'Сериков А.Б.'} (${signKeyFile}).`;
      
      await fetch(`http://localhost:3001/api/applications/${activeApp.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 1,
          userName: 'Система ЭЦП',
          message: msg
        })
      });

      setSignSuccessMessage('ЭЦП успешно наложена! Проверка НУЦ пройдена.');
      setTimeout(async () => {
        setIsSigningOpen(false);
        await loadAppDetails(activeApp.id);
      }, 1500);
    } catch(e) {
      console.log('Error confirmation sign:', e);
    }
  };

  // Feedback form submit
  const sendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName || !fbEmail || !fbSubject || !fbMsg) {
      alert('Пожалуйста, заполните все поля!');
      return;
    }
    try {
      await fetch('http://localhost:3001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fbName,
          email: fbEmail,
          subject: fbSubject,
          message: fbMsg,
          userId: user?.id || 1
        })
      });
    } catch(e) {
      // offline — still show success to user
    }
    setFbSuccess(true);
    setFbName('');
    setFbEmail('');
    setFbSubject('');
    setFbMsg('');
  };

  // Mark single notification read
  const markNotifRead = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/notifications/${id}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch(e) {
      console.log('Error updating notification read:', e);
    }
  };

  // Clear all notifications
  const clearAllNotifs = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('http://localhost:3001/api/notifications/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch(e) {
      console.log('Error clearing all notifications:', e);
    }
  };

  // External vacancy HR redirect
  const handleVacancyClick = (title: string) => {
    setVacancyRedirectCount(3);
    const interval = setInterval(() => {
      setVacancyRedirectCount(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setVacancyRedirectCount(null);
          window.open('https://qyzmet.kz', '_blank');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Navigation Items Renderer
  const nav = (
    <div className="main-nav">
      {(['home', 'catalog', 'about', 'news', 'knowledge', 'contacts', 'vacancies'] as Screen[]).map(s => {
        const labels: Record<string, string> = {
          home: t('navHome'),
          catalog: t('navCatalog'),
          about: lang === 'ru' ? 'О Холдинге' : 'Холдинг туралы',
          news: t('navNews'),
          knowledge: t('navFAQ'),
          contacts: t('navContacts'),
          vacancies: t('navVacancies')
        };
        return (
          <button key={s} className={`nav-item ${(screen === s || (s === 'news' && screen === 'news_details')) ? 'active' : ''}`} onClick={() => go(s)}>
            {labels[s]}
          </button>
        );
      })}
    </div>
  );

  // Right Header Controls
  const notificationBellCount = notifications.filter(n => !n.IsRead).length;
  const notifBadgeLabel = notificationBellCount > 9 ? '9+' : String(notificationBellCount);

  const a11yPanel = (
    <div className="a11y-controls-bar">
      <span>{t('a11yTitle')}:</span>
      <button className={`btn btn-xs ${largeFont ? 'btn-primary' : ''}`} onClick={() => setLargeFont(!largeFont)}>
        {largeFont ? t('a11yTextNormal') : t('a11yTextLarge')}
      </button>
      <button className={`btn btn-xs ${highContrast ? 'btn-primary' : ''}`} onClick={() => setHighContrast(!highContrast)}>
        {highContrast ? t('a11yContrastNormal') : t('a11yContrastHigh')}
      </button>
    </div>
  );

  const langSwitcher = (
    <div className="lang-switcher">
      <button className={`lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</button>
      <button className={`lang-btn ${lang === 'kz' ? 'active' : ''}`} onClick={() => setLang('kz')}>KZ</button>
    </div>
  );

  const hdrRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {langSwitcher}
      {user ? (
        <>
          {/* Bell Notifications */}
          <div className="notif-bell-wrap" onMouseLeave={() => setIsNotifOpen(false)}>
            <button className="notif-bell-btn" onClick={() => setIsNotifOpen(!isNotifOpen)}>
              🔔 {notificationBellCount > 0 && <span className="notif-badge">{notifBadgeLabel}</span>}
            </button>
            {isNotifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dd-header">
                  <span>Уведомления ({notificationBellCount})</span>
                  <button className="btn btn-xs btn-ghost" onClick={clearAllNotifs}>Прочитать все</button>
                </div>
                <div className="notif-dd-list">
                  {notifications.length ? notifications.map(n => (
                    <div key={n.Id} className={`notif-dd-item ${!n.IsRead ? 'unread' : ''}`} onClick={() => markNotifRead(n.Id)}>
                      <div className="notif-title">{lang === 'ru' ? n.Title : n.TitleKz}</div>
                      <div className="notif-desc">{lang === 'ru' ? n.Message : n.MessageKz}</div>
                      <div className="notif-time">{new Date(n.CreatedAt).toLocaleTimeString()}</div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Нет новых уведомлений</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="user-chip" onClick={() => go('dash')}>
            <div className="user-av">{user.name[0]}</div>
            {user.name.split(' ')[0]}
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => go('dash')}>{t('cabinet')}</button>
          <button className="btn btn-sm btn-ghost" onClick={onLogout}>{t('logout')}</button>
        </>
      ) : (
        <>
          <button className="btn btn-sm" onClick={() => go('login')}>{t('login')}</button>
          <button className="btn btn-sm btn-primary" onClick={() => go('login')}>{t('applyBtn')}</button>
        </>
      )}
    </div>
  );

  const adminHdrRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {langSwitcher}
      {token && (
        <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 6, background: '#16a34a20', color: '#16a34a', fontWeight: 700, border: '1px solid #16a34a40' }}>
          🔐 JWT
        </span>
      )}
      <div className="user-chip">
        <div className="user-av">A</div>
        admin@baiterek.kz
      </div>
      <button className="btn btn-sm btn-ghost" onClick={onLogout}>{t('logout')}</button>
    </div>
  );

  // Render breadcrumbs
  const breadcrumbs = (
    <div className="breadcrumbs">
      {pathHistory.map((scr, idx) => {
        let label = t('breadcrumbsHome');
        if (scr === 'catalog') label = t('breadcrumbsCatalog');
        if (scr === 'service') label = t('breadcrumbsService');
        if (scr === 'app') label = t('breadcrumbsApp');
        if (scr === 'dash') label = t('breadcrumbsCabinet');
        if (scr === 'org_details') label = `${t('breadcrumbsOrg')} (${activeOrg?.abbr || ''})`;
        if (scr === 'knowledge') label = t('breadcrumbsFAQ');
        if (scr === 'contacts') label = t('breadcrumbsContacts');
        if (scr === 'vacancies') label = t('breadcrumbsVacancies');
        if (scr === 'news') label = t('navNews');
        if (scr === 'news_details') label = t('navNews');
        if (scr === 'about') label = lang === 'ru' ? 'О Холдинге' : 'Холдинг туралы';

        const isLast = idx === pathHistory.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="bc-sep">/</span>}
            {isLast ? (
              <span className="bc-item active">{label}</span>
            ) : (
              <span className="bc-item" onClick={() => {
                if (scr === 'home') go('home');
                else if (scr === 'catalog') go('catalog');
                else if (scr === 'dash') go('dash');
                else if (scr === 'knowledge') go('knowledge');
                else if (scr === 'contacts') go('contacts');
                else if (scr === 'vacancies') go('vacancies');
                else if (scr === 'news') go('news');
              }}>{label}</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Layout with Breadcrumbs and accessibility panel
  const CustomLayout: React.FC<{ children: React.ReactNode; nav?: React.ReactNode; hdrRight?: React.ReactNode; onBack?: () => void }> = ({ children, nav, hdrRight, onBack }) => (
    <div className="app-layout">
      {a11yPanel}
      <header className="app-header">
        <div className="header-left">
          {onBack && <button className="btn btn-sm btn-back-custom" onClick={onBack}>← {t('backBtn')}</button>}
          <div className="logo" onClick={() => { go('home'); setMobileMenuOpen(false); }}>
            <div className="logo-mark">Б</div>
            <div>
              <div className="logo-name">BAITEREK</div>
              <div className="logo-sub">{t('logoSub')}</div>
            </div>
          </div>
          {nav}
        </div>
        <div className="header-right">
          {/* Mobile: show compact controls */}
          <div className="hdr-right-mobile">
            {langSwitcher}
            {user && notificationBellCount > 0 && (
              <button className="notif-bell-btn" onClick={() => { go('dash'); setMobileMenuOpen(false); }}>
                🔔 <span className="notif-badge">{notifBadgeLabel}</span>
              </button>
            )}
            <button
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Меню"
            >
              <span className={`ham-line ${mobileMenuOpen ? 'open' : ''}`} />
              <span className={`ham-line ${mobileMenuOpen ? 'open' : ''}`} />
              <span className={`ham-line ${mobileMenuOpen ? 'open' : ''}`} />
            </button>
          </div>
          {/* Desktop: full controls */}
          <div className="hdr-right-desktop">
            {hdrRight}
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span style={{ fontWeight: 700, color: 'var(--bt-navy-900)' }}>Меню</span>
              <button className="btn btn-xs btn-ghost" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>
            {(['home','catalog','about','news','knowledge','contacts','vacancies'] as Screen[]).map(s => {
              const labels: Record<string,string> = {
                home: t('navHome'), catalog: t('navCatalog'),
                about: lang === 'ru' ? 'О Холдинге' : 'Холдинг туралы',
                news: t('navNews'), knowledge: t('navFAQ'),
                contacts: t('navContacts'), vacancies: t('navVacancies')
              };
              return (
                <button key={s} className={`mobile-nav-item ${screen === s ? 'active' : ''}`}
                  onClick={() => { go(s); setMobileMenuOpen(false); }}>
                  {labels[s]}
                </button>
              );
            })}
            <div className="mobile-nav-divider" />
            {user ? (
              <>
                <button className="mobile-nav-item" onClick={() => { go('dash'); setMobileMenuOpen(false); }}>
                  👤 {lang === 'ru' ? 'Личный кабинет' : 'Жеке кабинет'}
                </button>
                <button className="mobile-nav-item" style={{ color: 'var(--danger)' }} onClick={() => { onLogout(); setMobileMenuOpen(false); }}>
                  {t('logout')}
                </button>
              </>
            ) : (
              <button className="mobile-nav-item mobile-nav-cta" onClick={() => { go('login'); setMobileMenuOpen(false); }}>
                {t('login')} →
              </button>
            )}
          </div>
        </div>
      )}

      <div className="app-main-content">
        {breadcrumbs}
        {children}
      </div>
      <AIAssistant lang={lang} />
    </div>
  );

  // ---- ADMIN ROUTE: полностью изолирован от пользовательской части ----
  if (isAdminRoute) {
    if (screen === 'admin' && isAdmin) {
      return (
        <AdminPanel
          hdrRight={adminHdrRight}
          apps={apps}
          stats={stats}
          user={user}
          news={news}
          articles={articles}
          auditLogs={auditLogs}
          lang={lang}
          token={token}
          onRefreshApps={fetchAppsAndStats}
          onRefreshNews={fetchNews}
          onRefreshArticles={fetchArticles}
          onRefreshLogs={fetchAuditLogs}
        />
      );
    }
    return (
      <div className="app-layout">
        {a11yPanel}
        <header className="app-header">
          <div className="header-left">
            <div className="logo">
              <div className="logo-mark">Б</div>
              <div>
                <div className="logo-name">BAITEREK</div>
                <div className="logo-sub" style={{ color: 'var(--danger)', letterSpacing: '0.1em' }}>ADMIN PORTAL</div>
              </div>
            </div>
          </div>
          <div className="header-right">{langSwitcher}</div>
        </header>
        <AdminLoginPage onLogin={onAdminLogin} />
      </div>
    );
  }

  // ---- USER SCREEN ROUTERS ----
  if (screen === 'home') {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight}>
        <HomePage
          stats={stats}
          news={news}
          articles={articles}
          lang={lang}
          onGoService={(i) => go('service', i)}
          onGoCatalog={() => go('catalog')}
          onLogin={() => go('login')}
          onSelectOrg={(org) => {
            setActiveOrg(org);
            go('org_details');
          }}
          onSelectNews={(n) => {
            setActiveNews(n);
            go('news_details');
          }}
          onGoKnowledge={() => go('knowledge')}
          onGoAbout={() => go('about')}
          onGoVacancies={() => go('vacancies')}
          onGoContacts={() => go('contacts')}
          onGoNews={() => go('news')}
        />
      </CustomLayout>
    );
  }

  if (screen === 'catalog') {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight}>
        <CatalogPage 
          lang={lang} 
          onSelectService={(i) => go('service', i)} 
        />
      </CustomLayout>
    );
  }

  if (screen === 'org_details' && activeOrg) {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight} onBack={() => go('home')}>
        <OrgDetailsPage 
          org={activeOrg} 
          lang={lang}
          onGoService={(i) => go('service', i)}
          onBookConsultation={() => {
            setBookingOrg(activeOrg.name);
            if (user) go('dash');
            else go('login');
          }}
        />
      </CustomLayout>
    );
  }

  if (screen === 'news') {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight}>
        <NewsListPage
          news={news}
          lang={lang}
          onSelectNews={(n) => { setActiveNews(n); go('news_details'); }}
        />
      </CustomLayout>
    );
  }

  if (screen === 'news_details' && activeNews) {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight} onBack={() => go('news')}>
        <NewsDetailsPage newsItem={activeNews} lang={lang} />
      </CustomLayout>
    );
  }

  if (screen === 'knowledge') {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight}>
        <KnowledgePage 
          articles={articles} 
          lang={lang} 
          onSelectArticle={(a) => setActiveArticle(a)}
          activeArticle={activeArticle}
        />
      </CustomLayout>
    );
  }

  if (screen === 'contacts') {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight}>
        <ContactsPage 
          name={fbName} setName={setFbName}
          email={fbEmail} setEmail={setFbEmail}
          subject={fbSubject} setSubject={setFbSubject}
          msg={fbMsg} setMsg={setFbMsg}
          success={fbSuccess} setSuccess={setFbSuccess}
          onSubmit={sendFeedback}
        />
      </CustomLayout>
    );
  }

  if (screen === 'vacancies') {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight}>
        <VacanciesPage
          redirectCount={vacancyRedirectCount}
          onApply={handleVacancyClick}
          lang={lang}
        />
      </CustomLayout>
    );
  }

  if (screen === 'about') {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight}>
        <AboutPage lang={lang} onSelectOrg={(org) => { setActiveOrg(org); go('org_details'); }} />
      </CustomLayout>
    );
  }

  if (screen === 'service') {
    return (
      <CustomLayout nav={nav} hdrRight={hdrRight} onBack={() => go('catalog')}>
        <ServicePage 
          svc={SERVICES[svcIdx]} 
          lang={lang} 
          onApply={() => {
            if (user) go('app');
            else go('login');
          }} 
        />
      </CustomLayout>
    );
  }

  if (screen === 'app') {
    return (
      <>
        <AppFlow
          steps={LEASING_SCHEMA}
          svc={SERVICES[svcIdx]}
          lang={lang}
          user={user}
          onBack={() => go('service')}
          onSubmit={onSubmitApp}
          fetchApps={fetchAppsAndStats}
        />
        <AIAssistant lang={lang} />
      </>
    );
  }

  if (screen === 'success') {
    return (
      <CustomLayout hdrRight={hdrRight}>
        <SuccessPage appId={successId} svc={SERVICES[svcIdx]} onDash={() => go('dash')} />
      </CustomLayout>
    );
  }

  if (screen === 'login') {
    return (
      <CustomLayout hdrRight={hdrRight} onBack={() => go('home')}>
        <LoginPage onLogin={onLogin} onAdminLogin={() => go('adminlogin')} />
      </CustomLayout>
    );
  }

  if (screen === 'adminlogin') {
    // Redirect to /admin route
    window.location.href = '/admin';
    return null;
  }

  if (screen === 'dash' && user) {
    return (
      <CustomLayout hdrRight={hdrRight}>
        <DashPage 
          user={user} 
          apps={apps} 
          bookings={bookings}
          activeApp={activeApp}
          appComments={appComments}
          appDocs={appDocs}
          newCommentText={newCommentText}
          setNewCommentText={setNewCommentText}
          isSigningOpen={isSigningOpen}
          signKeyFile={signKeyFile}
          setSignKeyFile={setSignKeyFile}
          signPassword={signPassword}
          setSignPassword={setSignPassword}
          signError={signError}
          signSuccessMessage={signSuccessMessage}
          profileName={profileName} setProfileName={setProfileName}
          profileEmail={profileEmail} setProfileEmail={setProfileEmail}
          profilePhone={profilePhone} setProfilePhone={setProfilePhone}
          profileCompany={profileCompany} setProfileCompany={setProfileCompany}
          profilePosition={profilePosition} setProfilePosition={setProfilePosition}
          profileSavedMsg={profileSavedMsg}
          bookingOrg={bookingOrg} setBookingOrg={setBookingOrg}
          bookingDate={bookingDate} setBookingDate={setBookingDate}
          bookingTime={bookingTime} setBookingTime={setBookingTime}
          bookingTopic={bookingTopic} setBookingTopic={setBookingTopic}
          bookingMessage={bookingMessage} setBookingMessage={setBookingMessage}
          onSaveProfile={saveProfile}
          onBook={createBooking}
          onSelectApp={selectActiveApp}
          onCloseApp={() => setActiveApp(null)}
          onSendComment={sendComment}
          onUploadDocVersion={uploadDocVersion}
          onSignDoc={triggerSignECP}
          onSignConfirm={handleSignConfirm}
          onSignCancel={() => setIsSigningOpen(false)}
          onGoService={(i) => go('service', i)} 
          onGoCatalog={() => go('catalog')} 
          onLogout={onLogout} 
        />
      </CustomLayout>
    );
  }

  // Fallback: unknown screen or missing required state — redirect gracefully
  if (screen === 'dash') { go('login'); return null; }
  if (screen === 'org_details') { go('home'); return null; }
  if (screen === 'news_details') { go('news'); return null; }

  go('home');
  return null;
};

// ---- HOME PAGE ----
const HomePage: React.FC<{
  stats: any;
  news: any[];
  articles: any[];
  lang: string;
  onGoService: (i: number) => void;
  onGoCatalog: () => void;
  onLogin: () => void;
  onSelectOrg: (org: typeof ORGANIZATIONS[0]) => void;
  onSelectNews: (item: any) => void;
  onGoKnowledge: () => void;
  onGoAbout: () => void;
  onGoVacancies: () => void;
  onGoContacts: () => void;
  onGoNews: () => void;
}> = ({ stats, news, articles, lang, onGoService, onGoCatalog, onLogin, onSelectOrg, onSelectNews, onGoKnowledge, onGoAbout, onGoVacancies, onGoContacts, onGoNews }) => {
  const [heroSearch, setHeroSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; idx?: number; item?: any }[]>([]);

  const doSearch = (q: string) => {
    setHeroSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lq = q.toLowerCase();
    const results: typeof searchResults = [];
    SERVICES.forEach((s, i) => {
      if (s.title.toLowerCase().includes(lq) || s.org.toLowerCase().includes(lq) || s.desc.toLowerCase().includes(lq)) {
        results.push({ type: 'service', title: lang === 'ru' ? s.title : s.titleKz || s.title, idx: i });
      }
    });
    news.forEach(n => {
      if ((n.Title || '').toLowerCase().includes(lq) || (n.Organization || '').toLowerCase().includes(lq)) {
        results.push({ type: 'news', title: lang === 'ru' ? n.Title : n.TitleKz, item: n });
      }
    });
    articles.forEach(a => {
      if ((a.Title || '').toLowerCase().includes(lq) || (a.Content || '').toLowerCase().includes(lq)) {
        results.push({ type: 'article', title: lang === 'ru' ? a.Title : a.TitleKz, item: a });
      }
    });
    setSearchResults(results.slice(0, 7));
  };

  return (
    <div>
      {/* ---- HERO ---- */}
      <div className="hero">
        <div className="hero-inner">
          {/* Left column */}
          <div>
            <div className="hero-eyebrow">{lang === 'ru' ? 'Республика Казахстан · Холдинг «Байтерек»' : 'Қазақстан Республикасы · «Бәйтерек» холдингі'}</div>
            <h1 className="hero-title">
              {lang === 'ru' ? 'Единый портал' : 'Бизнесті қолдаудың'}<br />
              <span>{lang === 'ru' ? 'поддержки бизнеса' : 'бірыңғай порталы'}</span>
            </h1>
            <p className="hero-desc">
              {lang === 'ru'
                ? 'Все меры государственной поддержки в одном окне. Подайте заявку онлайн, отслеживайте статус, получайте результат.'
                : 'Мемлекеттік қолдаудың барлық шаралары бір терезеде. Өтінімді онлайн беріңіз, мәртебені бақылаңыз, нәтиже алыңыз.'}
            </p>

            {/* Global Search */}
            <div className="hero-search-wrap">
              <input
                className="hero-search-input"
                placeholder={lang === 'ru' ? '🔍  Поиск по услугам, новостям, базе знаний...' : '🔍  Қызметтер, жаңалықтар, білім базасы...'}
                value={heroSearch}
                onChange={e => doSearch(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="hero-search-results">
                  {searchResults.map((r, i) => (
                    <div key={i} className="hero-search-result-item" onClick={() => {
                      setHeroSearch(''); setSearchResults([]);
                      if (r.type === 'service' && r.idx !== undefined) onGoService(r.idx);
                      else if (r.type === 'news') onSelectNews(r.item);
                      else if (r.type === 'article') onGoKnowledge();
                    }}>
                      <span className={`badge ${r.type === 'service' ? 'badge-navy' : r.type === 'news' ? 'badge-green' : 'badge-amber'}`}>
                        {r.type === 'service' ? (lang === 'ru' ? 'Услуга' : 'Қызмет') : r.type === 'news' ? (lang === 'ru' ? 'Новость' : 'Жаңалық') : (lang === 'ru' ? 'Статья' : 'Мақала')}
                      </span>
                      <span style={{ fontSize: 13 }}>{r.title}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="hero-chips">
                {(lang === 'ru'
                  ? ['Лизинг авиатранспорта', 'Кредиты МСБ', 'Гарантии Даму', 'МФЦА регистрация']
                  : ['Авиакөлік лизингі', 'МСБ несиелері', 'Даму кепілдіктері', 'ҚАӨА тіркеу']
                ).map(chip => (
                  <button key={chip} className="hero-chip" onClick={() => doSearch(chip)}>{chip}</button>
                ))}
              </div>
            </div>

            <div className="hero-btns">
              <button className="btn btn-gold btn-lg" onClick={onGoCatalog}>{lang === 'ru' ? 'Каталог услуг' : 'Қызметтер каталогы'}</button>
              <button className="btn btn-outline btn-lg" onClick={onLogin}>{lang === 'ru' ? 'Личный кабинет' : 'Жеке кабинет'}</button>
            </div>

            <div className="hero-stats">
              <div><div className="hstat-num">{SERVICES.length + 62}+</div><div className="hstat-lbl">{lang === 'ru' ? 'Мер поддержки' : 'Қолдау шарасы'}</div></div>
              <div><div className="hstat-num">6</div><div className="hstat-lbl">{lang === 'ru' ? 'Организаций' : 'Ұйымдар'}</div></div>
              <div><div className="hstat-num">{stats.users > 0 ? (50000 + stats.users).toLocaleString() : '50К+'}</div><div className="hstat-lbl">{lang === 'ru' ? 'Предпринимателей' : 'Кәсіпкерлер'}</div></div>
              <div><div className="hstat-num">₸184 млрд</div><div className="hstat-lbl">{lang === 'ru' ? 'Выдано в 2025' : '2025 ж. берілді'}</div></div>
            </div>
          </div>

          {/* Right column — stat cards */}
          <div className="hero-stat-cards">
            {[
              { value: '2 847', label: lang === 'ru' ? 'Заявок в 2026 году' : '2026 жылдағы өтінімдер', sub: lang === 'ru' ? '+18% к прошлому году' : 'өткен жылға қарағанда +18%' },
              { value: '67.6%', label: lang === 'ru' ? 'Одобрено заявок' : 'Мақұлданған өтінімдер', sub: lang === 'ru' ? 'Средний показатель' : 'Орташа көрсеткіш' },
              { value: '5.2 дн', label: lang === 'ru' ? 'Среднее решение' : 'Орташа шешім', sub: lang === 'ru' ? 'Рекорд по SLA' : 'SLA бойынша рекорд' },
              { value: '73', label: lang === 'ru' ? 'Активных услуги' : 'Белсенді қызметтер', sub: lang === 'ru' ? 'Во всех организациях' : 'Барлық ұйымдарда' },
            ].map((card, i) => (
              <div key={i} className="hero-stat-card">
                <div className="hero-stat-card-value">{card.value}</div>
                <div className="hero-stat-card-label">{card.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>{card.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- ORGANIZATIONS ---- */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">{lang === 'ru' ? 'Организации Холдинга' : 'Холдинг ұйымдары'}</div>
        </div>
        <div className="orgs-grid">
          {ORGANIZATIONS.map(o => (
            <div className="org-card" key={o.abbr} onClick={() => onSelectOrg(o)}>
              <div className="org-icon">{o.abbr}</div>
              <div className="org-name">{lang === 'ru' ? o.name : o.nameKz}</div>
              <div className="org-desc">{lang === 'ru' ? o.desc.slice(0, 80) : o.descKz?.slice(0, 80)}...</div>
              <div className="service-arrow" style={{ marginTop: 10 }}>{lang === 'ru' ? 'Перейти →' : 'Өту →'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- POPULAR SERVICES ---- */}
      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div className="section-title">{lang === 'ru' ? 'Популярные услуги' : 'Танымал қызметтер'}</div>
          <div className="section-link" onClick={onGoCatalog}>{lang === 'ru' ? 'Все услуги →' : 'Барлық қызметтер →'}</div>
        </div>
        <div className="services-grid">
          {SERVICES.slice(0, 4).map((s, i) => (
            <div className="service-card" key={i} onClick={() => onGoService(i)}>
              <div className="service-org">{s.org}{s.stage ? ` · Этап ${s.stage}` : ''}</div>
              <div className="service-title">{lang === 'ru' ? s.title : s.titleKz || s.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span className={`badge badge-${{ leasing:'navy', subsidy:'green', credit:'amber', guarantee:'gray' }[s.cat] || 'gray'}`}>
                  {s.cat === 'leasing' ? (lang === 'ru' ? 'Лизинг' : 'Лизинг') : s.cat === 'subsidy' ? (lang === 'ru' ? 'Субсидии' : 'Субсидия') : s.cat === 'credit' ? (lang === 'ru' ? 'Кредиты' : 'Несие') : (lang === 'ru' ? 'Гарантия' : 'Кепілдік')}
                </span>
                <span className="service-dur">{s.dur}</span>
              </div>
              <div className="service-arrow">{lang === 'ru' ? 'Подать заявку →' : 'Өтінім беру →'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- NEWS ---- */}
      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div className="section-title">{lang === 'ru' ? 'Последние новости' : 'Соңғы жаңалықтар'}</div>
          <div className="section-link" onClick={onGoKnowledge}>{lang === 'ru' ? 'База знаний →' : 'Білім базасы →'}</div>
        </div>
        <div className="news-list">
          {news.length ? news.slice(0, 5).map((n) => (
            <div className="news-item" key={n.Id} onClick={() => onSelectNews(n)}>
              <div style={{ flex: 1 }}>
                <div className="news-title">{lang === 'ru' ? n.Title : n.TitleKz}</div>
                <div className="news-meta">{n.Organization}</div>
              </div>
              <div className="news-date">{new Date(n.CreatedAt).toLocaleDateString()}</div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-400)', fontSize: 13 }}>{lang === 'ru' ? 'Нет доступных новостей' : 'Жаңалықтар жоқ'}</div>
          )}
        </div>
      </div>

      {/* ---- QUICK ACCESS ---- */}
      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div className="section-title">{lang === 'ru' ? 'Быстрый доступ' : 'Жылдам қол жеткізу'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
          {[
            { icon: '📋', label: lang === 'ru' ? 'Подать заявку' : 'Өтінім беру', action: onGoCatalog },
            { icon: '🧮', label: lang === 'ru' ? 'Смета расходов' : 'Шығын сметасы', action: onLogin },
            { icon: '📚', label: lang === 'ru' ? 'База знаний' : 'Білім базасы', action: onGoKnowledge },
            { icon: '📞', label: lang === 'ru' ? 'Горячая линия 1414' : 'Қоңырау орталығы 1414', action: () => { window.location.href = 'tel:1414'; } },
          ].map((item, i) => (
            <div key={i} className="bt-card" style={{ display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer', padding: '16px 20px', transition: 'all 0.18s ease' }}
              onClick={item.action}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)'; }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- FOOTER ---- */}
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-logo-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="footer-logo-mark">Б</div>
              <div>
                <div className="footer-brand-name">BAITEREK</div>
                <div className="footer-brand-sub">{lang === 'ru' ? 'Портал поддержки' : 'Қолдау порталы'}</div>
              </div>
            </div>
            <div className="footer-desc">{lang === 'ru' ? 'Единый цифровой портал поддержки бизнеса Республики Казахстан. 70+ мер государственной поддержки в одном окне.' : 'Қазақстан Республикасының бизнесті қолдаудың бірыңғай цифрлық порталы. Бір терезеде 70+ мемлекеттік қолдау шарасы.'}</div>
          </div>
          {[
            { title: lang === 'ru' ? 'Холдинг' : 'Холдинг', links: [
              { label: lang === 'ru' ? 'О Холдинге' : 'Холдинг туралы', action: onGoAbout },
              { label: lang === 'ru' ? 'Руководство' : 'Басшылық', action: onGoAbout },
              { label: lang === 'ru' ? 'Структура' : 'Құрылым', action: onGoAbout },
              { label: lang === 'ru' ? 'Отчётность' : 'Есептілік', action: onGoAbout },
              { label: lang === 'ru' ? 'Карьера' : 'Мансап', action: onGoVacancies },
            ]},
            { title: lang === 'ru' ? 'Организации' : 'Ұйымдар', links: [
              { label: 'БРК', action: () => onSelectOrg(ORGANIZATIONS[0]) },
              { label: 'БРК-Лизинг', action: () => onSelectOrg(ORGANIZATIONS[1]) },
              { label: 'ФРП «Даму»', action: () => onSelectOrg(ORGANIZATIONS[2]) },
              { label: 'КазАгро', action: () => onSelectOrg(ORGANIZATIONS[3]) },
              { label: 'МФЦА', action: () => onSelectOrg(ORGANIZATIONS[4]) },
              { label: 'KIC', action: () => onSelectOrg(ORGANIZATIONS[5]) },
            ]},
            { title: lang === 'ru' ? 'Услуги' : 'Қызметтер', links: [
              { label: lang === 'ru' ? 'Каталог услуг' : 'Қызметтер каталогы', action: onGoCatalog },
              { label: lang === 'ru' ? 'База знаний' : 'Білім базасы', action: onGoKnowledge },
              { label: lang === 'ru' ? 'Карта услуг' : 'Қызметтер картасы', action: onGoCatalog },
              { label: 'FAQ', action: onGoKnowledge },
            ]},
            { title: lang === 'ru' ? 'Контакты' : 'Байланыс', links: [
              { label: lang === 'ru' ? 'Колл-центр 1414' : 'Call-орталық 1414', action: () => { window.location.href = 'tel:1414'; } },
              { label: lang === 'ru' ? 'Написать в чат' : 'Чатқа жазу', action: onGoContacts },
              { label: lang === 'ru' ? 'Найти отделение' : 'Бөлімше табу', action: onGoContacts },
              { label: lang === 'ru' ? 'Обратная связь' : 'Кері байланыс', action: onGoContacts },
            ]},
          ].map(col => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              <ul className="footer-links">
                {col.links.map(l => (
                  <li key={l.label} onClick={l.action} style={{ cursor: 'pointer' }}>
                    {l.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div>© 2026 АО «Национальный управляющий холдинг „Байтерек"». {lang === 'ru' ? 'Все права защищены.' : 'Барлық құқықтар қорғалған.'}</div>
          <div className="footer-bottom-links">
            <span style={{ cursor: 'pointer' }} onClick={onGoContacts}>{lang === 'ru' ? 'Политика конфиденциальности' : 'Құпиялылық саясаты'}</span>
            <span style={{ cursor: 'pointer' }} onClick={onGoContacts}>{lang === 'ru' ? 'Условия использования' : 'Пайдалану шарттары'}</span>
            <span style={{ cursor: 'pointer' }} onClick={() => { document.querySelector<HTMLButtonElement>('.btn-xs')?.click(); }}>{lang === 'ru' ? 'Версия для слабовидящих' : 'Нашар көретіндерге арналған нұсқа'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ---- ORGANIZATIONS DETAIL PAGE ----
const ORG_REPORTS: Record<string, { year: number; type: string; titleRu: string; titleKz: string }[]> = {
  'БРК':   [
    { year: 2024, type: 'Годовой отчёт', titleRu: 'Годовой отчёт БРК за 2024 год', titleKz: 'ҚДБ-ның 2024 жылғы жылдық есебі' },
    { year: 2023, type: 'Годовой отчёт', titleRu: 'Годовой отчёт БРК за 2023 год', titleKz: 'ҚДБ-ның 2023 жылғы жылдық есебі' },
    { year: 2024, type: 'Финансовая отчётность', titleRu: 'Финансовая отчётность (МСФО) за 2024 г.', titleKz: '2024 жылғы қаржылық есептілік (ХҚЕС)' },
    { year: 2023, type: 'Финансовая отчётность', titleRu: 'Финансовая отчётность (МСФО) за 2023 г.', titleKz: '2023 жылғы қаржылық есептілік (ХҚЕС)' },
  ],
  'БРК-Л': [
    { year: 2024, type: 'Годовой отчёт', titleRu: 'Годовой отчёт БРК Лизинг за 2024 год', titleKz: 'ҚДБ Лизинг 2024 жылғы жылдық есебі' },
    { year: 2024, type: 'Финансовая отчётность', titleRu: 'Финансовая отчётность (МСФО) за 2024 г.', titleKz: '2024 жылғы қаржылық есептілік (ХҚЕС)' },
  ],
  'Даму':  [
    { year: 2024, type: 'Годовой отчёт', titleRu: 'Годовой отчёт Фонда Даму за 2024 год', titleKz: 'Даму қорының 2024 жылғы жылдық есебі' },
    { year: 2023, type: 'Годовой отчёт', titleRu: 'Годовой отчёт Фонда Даму за 2023 год', titleKz: 'Даму қорының 2023 жылғы жылдық есебі' },
    { year: 2024, type: 'Финансовая отчётность', titleRu: 'Финансовая отчётность (МСФО) за 2024 г.', titleKz: '2024 жылғы қаржылық есептілік (ХҚЕС)' },
  ],
  'КазАгро': [
    { year: 2024, type: 'Годовой отчёт', titleRu: 'Годовой отчёт АКК за 2024 год', titleKz: 'АНК-ның 2024 жылғы жылдық есебі' },
    { year: 2024, type: 'Финансовая отчётность', titleRu: 'Финансовая отчётность (МСФО) за 2024 г.', titleKz: '2024 жылғы қаржылық есептілік (ХҚЕС)' },
  ],
  'МФЦА':  [
    { year: 2024, type: 'Годовой отчёт', titleRu: 'Годовой отчёт МФЦА за 2024 год', titleKz: 'АХҚО-ның 2024 жылғы жылдық есебі' },
    { year: 2024, type: 'Финансовая отчётность', titleRu: 'Финансовые показатели МФЦА 2024', titleKz: 'АХҚО-ның 2024 жылғы қаржылық көрсеткіштері' },
  ],
  'KIC':   [
    { year: 2024, type: 'Годовой отчёт', titleRu: 'Годовой отчёт KIC за 2024 год', titleKz: 'KIC-тің 2024 жылғы жылдық есебі' },
    { year: 2024, type: 'Финансовая отчётность', titleRu: 'Финансовая отчётность (МСФО) за 2024 г.', titleKz: '2024 жылғы қаржылық есептілік (ХҚЕС)' },
  ],
};

const ORG_PROCUREMENTS: Record<string, { num: string; title: string; titleKz: string; deadline: string; status: string; amount: string }[]> = {
  'БРК': [
    { num: 'БРК-2025-001', title: 'Поставка серверного оборудования', titleKz: 'Сервер жабдықтарын жеткізу', deadline: '15.06.2025', status: 'active', amount: '45 000 000 ₸' },
    { num: 'БРК-2025-002', title: 'Услуги по охране объектов', titleKz: 'Объектілерді күзету қызметтері', deadline: '20.06.2025', status: 'active', amount: '12 000 000 ₸' },
    { num: 'БРК-2024-089', title: 'Разработка ПО для CRM-системы', titleKz: 'CRM жүйесіне арналған бағдарламалық қамтамасыз', deadline: '01.12.2024', status: 'completed', amount: '87 000 000 ₸' },
  ],
  'Даму': [
    { num: 'ДАМУ-2025-014', title: 'Аренда офисных помещений в регионах', titleKz: 'Аймақтарда кеңселік үй-жайларды жалға алу', deadline: '30.06.2025', status: 'active', amount: '36 000 000 ₸' },
    { num: 'ДАМУ-2025-015', title: 'Услуги PR и коммуникации', titleKz: 'PR және коммуникация қызметтері', deadline: '25.07.2025', status: 'active', amount: '18 500 000 ₸' },
  ],
  'КазАгро': [
    { num: 'АКК-2025-007', title: 'Закупка сельскохозяйственной техники', titleKz: 'Ауыл шаруашылық техникасын сатып алу', deadline: '10.07.2025', status: 'active', amount: '120 000 000 ₸' },
  ],
  'МФЦА': [
    { num: 'МФЦА-2025-003', title: 'Организация международной конференции', titleKz: 'Халықаралық конференция ұйымдастыру', deadline: '05.06.2025', status: 'active', amount: '25 000 000 ₸' },
  ],
  'KIC': [
    { num: 'KIC-2025-002', title: 'Консалтинговые услуги по инвестициям', titleKz: 'Инвестиция бойынша консалтингтік қызметтер', deadline: '30.07.2025', status: 'active', amount: '55 000 000 ₸' },
  ],
  'БРК-Л': [
    { num: 'БРКЛ-2025-004', title: 'Страхование лизингового имущества', titleKz: 'Лизингтік мүлікті сақтандыру', deadline: '15.07.2025', status: 'active', amount: '8 200 000 ₸' },
  ],
};

type OrgTab = 'services' | 'reports' | 'procurement' | 'contacts';

const OrgDetailsPage: React.FC<{
  org: typeof ORGANIZATIONS[0];
  lang: string;
  onGoService: (i: number) => void;
  onBookConsultation: () => void;
}> = ({ org, lang, onGoService, onBookConsultation }) => {
  const [tab, setTab] = useState<OrgTab>('services');
  const ru = lang === 'ru';
  const orgServices = SERVICES.filter(s => s.org === org.abbr || (org.abbr === 'БРК-Л' && s.org === 'БРК Лизинг'));
  const reports = ORG_REPORTS[org.abbr] || [];
  const procurements = ORG_PROCUREMENTS[org.abbr] || [];

  const tabs: { id: OrgTab; label: string; labelKz: string; count?: number }[] = [
    { id: 'services', label: 'Услуги', labelKz: 'Қызметтер', count: orgServices.length },
    { id: 'reports', label: 'Финансовая отчётность', labelKz: 'Қаржылық есептілік', count: reports.length },
    { id: 'procurement', label: 'Закупки', labelKz: 'Сатып алулар', count: procurements.length },
    { id: 'contacts', label: 'Контакты', labelKz: 'Байланыстар' },
  ];

  const mockDownload = (title: string) => {
    const content = `${title}\n\nДокумент сформирован: ${new Date().toLocaleDateString('ru-KZ')}\nОрганизация: ${org.name}\n\n[Демонстрационный файл портала Байтерек]`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title.slice(0, 40)}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Hero */}
      <div className="service-hero" style={{ background: `linear-gradient(135deg, ${org.text} 0%, #0f172a 100%)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="bt-badge badge-gold">{org.abbr}</span>
        </div>
        <h1 className="service-hero-title">{ru ? org.name : org.nameKz}</h1>
        <p className="service-hero-desc" style={{ maxWidth: 640 }}>{ru ? org.desc : org.descKz}</p>
        <button className="bt-btn bt-btn--gold" onClick={onBookConsultation}>
          📅 {ru ? 'Записаться на консультацию' : 'Кеңеске жазылу'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 64, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontWeight: tab === t.id ? 700 : 500, fontSize: '0.9rem',
              color: tab === t.id ? 'var(--bt-navy-700)' : 'var(--ink-500)',
              borderBottom: tab === t.id ? '2px solid var(--bt-navy-700)' : '2px solid transparent',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {ru ? t.label : t.labelKz}
              {t.count !== undefined && (
                <span style={{ background: tab === t.id ? 'var(--bt-navy-100)' : 'var(--bg)', color: 'var(--ink-500)', fontSize: '0.72rem', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 0' }}>

        {/* TAB: Services */}
        {tab === 'services' && (
          <div>
            <div className="services-grid" style={{ gridTemplateColumns: '1fr' }}>
              {orgServices.length ? orgServices.map(s => {
                const realIdx = SERVICES.findIndex(sv => sv.title === s.title);
                return (
                  <div className="service-card" key={s.title} onClick={() => onGoService(realIdx)}>
                    <div className="service-title">{ru ? s.title : s.titleKz || s.title}</div>
                    <div className="service-dur">⏱ {s.dur}</div>
                    <div className="service-arrow">{ru ? 'Подробнее →' : 'Толығырақ →'}</div>
                  </div>
                );
              }) : (
                <p style={{ color: 'var(--ink-500)', padding: '20px 0' }}>{ru ? 'Услуги не найдены' : 'Қызметтер табылмады'}</p>
              )}
            </div>
          </div>
        )}

        {/* TAB: Financial reports */}
        {tab === 'reports' && (
          <div>
            <p style={{ color: 'var(--ink-500)', fontSize: '0.9rem', marginBottom: 20 }}>
              {ru
                ? 'Финансовая и корпоративная отчётность публикуется в соответствии с требованиями законодательства РК о квазигосударственном секторе.'
                : 'Қаржылық және корпоративтік есептілік ҚР квазимемлекеттік сектор туралы заңнамасының талаптарына сәйкес жарияланады.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reports.map((r, i) => (
                <div key={i} className="bt-card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                  onClick={() => mockDownload(ru ? r.titleRu : r.titleKz)}
                >
                  <div style={{
                    width: 44, height: 44, flexShrink: 0, borderRadius: 10, background: 'var(--bt-navy-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--bt-navy-700)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', lineHeight: 1.2
                  }}>PDF</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink-900)', fontSize: '0.95rem' }}>{ru ? r.titleRu : r.titleKz}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-400)', marginTop: 2 }}>{r.type} · {r.year}</div>
                  </div>
                  <div style={{ color: 'var(--bt-navy-500)', fontSize: '1.1rem', paddingRight: 4 }}>↓</div>
                </div>
              ))}
              {!reports.length && <p style={{ color: 'var(--ink-400)' }}>{ru ? 'Документы обновляются' : 'Құжаттар жаңартылуда'}</p>}
            </div>
          </div>
        )}

        {/* TAB: Procurement */}
        {tab === 'procurement' && (
          <div>
            <p style={{ color: 'var(--ink-500)', fontSize: '0.9rem', marginBottom: 20 }}>
              {ru
                ? 'Информация о закупках размещается в соответствии с Законом РК «О государственных закупках». Для участия в тендерах перейдите на портал государственных закупок.'
                : 'Сатып алу туралы ақпарат ҚР «Мемлекеттік сатып алу туралы» Заңына сәйкес орналастырылады.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {procurements.map((p, i) => (
                <div key={i} className="bt-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-400)' }}>{p.num}</span>
                        <span style={{
                          fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                          background: p.status === 'active' ? '#dcfce7' : '#f1f5f9',
                          color: p.status === 'active' ? '#16a34a' : 'var(--ink-500)',
                        }}>
                          {p.status === 'active' ? (ru ? 'Активный' : 'Белсенді') : (ru ? 'Завершён' : 'Аяқталған')}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--ink-900)', fontSize: '0.95rem', marginBottom: 4 }}>
                        {ru ? p.title : p.titleKz}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)' }}>
                        {ru ? 'Дедлайн' : 'Мерзім'}: {p.deadline}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--bt-navy-700)', fontSize: '1rem' }}>{p.amount}</div>
                      {p.status === 'active' && (
                        <button className="bt-btn bt-btn--secondary" style={{ marginTop: 8, fontSize: '0.78rem', padding: '6px 14px' }}
                          onClick={() => window.open('https://goszakup.gov.kz', '_blank')}
                        >
                          {ru ? 'Участвовать →' : 'Қатысу →'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!procurements.length && <p style={{ color: 'var(--ink-400)' }}>{ru ? 'Активных закупок нет' : 'Белсенді сатып алулар жоқ'}</p>}
            </div>
            <div style={{ background: 'var(--bt-navy-50)', border: '1px solid var(--bt-navy-100)', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ fontSize: '1.6rem' }}>🏛</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--bt-navy-900)', fontSize: '0.9rem', marginBottom: 2 }}>
                  {ru ? 'Портал государственных закупок РК' : 'ҚР Мемлекеттік сатып алулар порталы'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)' }}>goszakup.gov.kz</div>
              </div>
              <button className="bt-btn bt-btn--primary" style={{ marginLeft: 'auto', fontSize: '0.82rem' }}
                onClick={() => window.open('https://goszakup.gov.kz', '_blank')}
              >
                {ru ? 'Перейти' : 'Өту'}
              </button>
            </div>
          </div>
        )}

        {/* TAB: Contacts */}
        {tab === 'contacts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: '👤', label: ru ? 'Руководитель' : 'Басшы', val: org.director },
              { icon: '📍', label: ru ? 'Юридический адрес' : 'Заңды мекенжай', val: org.address },
              { icon: '📞', label: ru ? 'Телефон' : 'Телефон', val: org.phone },
              { icon: '📧', label: 'Email', val: org.email },
            ].map((c, i) => (
              <div key={i} className="bt-card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-400)', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{c.val}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

// ---- NEWS DETAILS ----
const ORG_COLORS: Record<string, string> = {
  'БРК': 'linear-gradient(135deg,#0f3460,#16213e)',
  'Банк Развития Казахстана': 'linear-gradient(135deg,#0f3460,#16213e)',
  'Даму': 'linear-gradient(135deg,#134e4a,#065f46)',
  'БРК Лизинг': 'linear-gradient(135deg,#1e1b4b,#312e81)',
  'КазАгро': 'linear-gradient(135deg,#14532d,#166534)',
  'Байтерек': 'linear-gradient(135deg,#1A3D8F,#2d5bbf)',
  'default': 'linear-gradient(135deg,#1e293b,#0f172a)',
};
const getOrgGradient = (org: string) =>
  Object.keys(ORG_COLORS).find(k => org?.includes(k))
    ? ORG_COLORS[Object.keys(ORG_COLORS).find(k => org?.includes(k))!]
    : ORG_COLORS.default;

const getReadTime = (text: string) => Math.max(1, Math.ceil(text.length / 1200));

const NewsDetailsPage: React.FC<{ newsItem: any; lang: string }> = ({ newsItem, lang }) => {
  const content = lang === 'ru' ? newsItem.Content : (newsItem.ContentKz || newsItem.Content);
  const title = lang === 'ru' ? newsItem.Title : (newsItem.TitleKz || newsItem.Title);
  const date = new Date(newsItem.CreatedAt);
  const readMin = getReadTime(content || '');

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="service-hero" style={{ background: getOrgGradient(newsItem.Organization) }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <span className="badge badge-blue">{newsItem.Organization}</span>
          <span className="badge badge-gray" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
            📅 {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="badge badge-gray" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
            🕐 {readMin} {lang === 'ru' ? 'мин. чтения' : 'мин. оқу'}
          </span>
        </div>
        <h1 className="service-hero-title" style={{ fontSize: 'clamp(1.3rem,4vw,2rem)', lineHeight: 1.35 }}>{title}</h1>
      </div>
      <div style={{ maxWidth: 760, margin: '32px auto', padding: '0 20px' }}>
        <div className="detail-card" style={{ padding: '36px 40px', lineHeight: 1.85, borderTop: '3px solid var(--blue)' }}>
          {(content || '').split('\n').filter(Boolean).map((para: string, i: number) => (
            <p key={i} style={{ fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>{para}</p>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
          <span>🏢 {newsItem.Organization}</span>
          <span>📅 {date.toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    </div>
  );
};

// ---- NEWS LIST PAGE ----
const NewsListPage: React.FC<{
  news: any[];
  lang: string;
  onSelectNews: (item: any) => void;
}> = ({ news, lang, onSelectNews }) => {
  const [orgFilter, setOrgFilter] = useState('all');
  const [search, setSearch] = useState('');

  const orgs = ['all', ...Array.from(new Set(news.map(n => n.Organization).filter(Boolean)))];

  const filtered = news.filter(n => {
    const matchOrg = orgFilter === 'all' || n.Organization === orgFilter;
    const title = lang === 'ru' ? n.Title : (n.TitleKz || n.Title);
    const matchSearch = !search || title?.toLowerCase().includes(search.toLowerCase());
    return matchOrg && matchSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Header */}
      <div className="catalog-header">
        <div className="catalog-title">{lang === 'ru' ? 'Новости холдинга «Байтерек»' : '«Бәйтерек» холдингінің жаңалықтары'}</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div className="catalog-search-wrap" style={{ flex: 1, minWidth: 260 }}>
            <span className="catalog-search-icon">🔍</span>
            <input className="catalog-search" placeholder={lang === 'ru' ? 'Поиск по новостям...' : 'Жаңалықтарды іздеу...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="filter-chips">
          {orgs.map(org => (
            <button key={org} className={`filter-chip ${orgFilter === org ? 'active' : ''}`} onClick={() => setOrgFilter(org)}>
              {org === 'all' ? (lang === 'ru' ? `Все (${filtered.length})` : `Барлығы (${filtered.length})`) : org}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 40px', maxWidth: 1200, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📰</div>
            {lang === 'ru' ? 'Новостей не найдено' : 'Жаңалықтар табылмады'}
          </div>
        ) : (
          <>
            {/* Featured news */}
            {featured && (
              <div
                onClick={() => onSelectNews(featured)}
                style={{
                  cursor: 'pointer',
                  marginTop: 24,
                  marginBottom: 28,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: getOrgGradient(featured.Organization),
                  padding: '36px 40px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 24,
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.26)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)'; }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      ⭐ {lang === 'ru' ? 'Главная новость' : 'Басты жаңалық'}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
                      {featured.Organization}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
                      {new Date(featured.CreatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 style={{ color: '#fff', margin: '0 0 12px', fontSize: 'clamp(1.1rem,3vw,1.5rem)', fontWeight: 700, lineHeight: 1.35 }}>
                    {lang === 'ru' ? featured.Title : (featured.TitleKz || featured.Title)}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.72)', margin: 0, fontSize: 14, lineHeight: 1.65, maxWidth: 620 }}>
                    {(lang === 'ru' ? featured.Content : (featured.ContentKz || featured.Content) || '').slice(0, 200)}...
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 20px', color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {lang === 'ru' ? 'Читать →' : 'Оқу →'}
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginTop: 4 }}>{getReadTime((lang === 'ru' ? featured.Content : featured.ContentKz) || '')} мин.</div>
                </div>
              </div>
            )}

            {/* News grid */}
            {rest.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                {rest.map(n => {
                  const title = lang === 'ru' ? n.Title : (n.TitleKz || n.Title);
                  const content = lang === 'ru' ? n.Content : (n.ContentKz || n.Content);
                  const date = new Date(n.CreatedAt);
                  return (
                    <div
                      key={n.Id}
                      onClick={() => onSelectNews(n)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: 'var(--white)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.18s, box-shadow 0.18s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                    >
                      {/* Card color strip */}
                      <div style={{ height: 5, background: getOrgGradient(n.Organization) }} />
                      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ background: '#EFF6FF', color: '#1A3D8F', padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{n.Organization}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4 }}>
                          {title}
                        </h3>
                        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
                          {(content || '').slice(0, 110)}...
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🕐 {getReadTime(content || '')} мин.</span>
                          <span style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600 }}>
                            {lang === 'ru' ? 'Читать далее →' : 'Толығырақ →'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ---- KNOWLEDGE PAGE (FAQ) ----
const KnowledgePage: React.FC<{ 
  articles: any[]; 
  lang: string;
  onSelectArticle: (a: any) => void;
  activeArticle: any;
}> = ({ articles, lang, onSelectArticle, activeArticle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filtered = articles.filter(a => {
    const title = lang === 'ru' ? a.Title : a.TitleKz;
    const content = lang === 'ru' ? a.Content : a.ContentKz;
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const TEMPLATES = [
    { icon: '📄', name: lang === 'ru' ? 'Устав компании' : 'Компания жарғысы', file: '/templates/Шаблон_Устава.rtf', size: '14 КБ' },
    { icon: '📊', name: lang === 'ru' ? 'Бизнес-план проекта' : 'Жобаның бизнес-жоспары', file: '/templates/Бизнес_План.rtf', size: '18 КБ' },
    { icon: '💰', name: lang === 'ru' ? 'Финансовая отчётность' : 'Қаржылық есептілік', file: '/templates/Финансовая_Отчетность.rtf', size: '16 КБ' },
    { icon: '📝', name: lang === 'ru' ? 'Заявление на финансирование' : 'Қаржыландыру туралы өтініш', file: '/templates/Заявление_на_финансирование.rtf', size: '12 КБ' },
  ];

  return (
    <div style={{ padding: '0 20px 40px' }}>
      <div className="service-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <h1 className="service-hero-title">{lang === 'ru' ? 'База знаний и инструкций' : 'Білім және нұсқаулықтар базасы'}</h1>
        <p className="service-hero-desc">{lang === 'ru' ? 'Найдите ответы на часто задаваемые вопросы, скачайте официальные шаблоны и ознакомьтесь с регламентами подачи заявок.' : 'Жиі қойылатын сұрақтарға жауаптар табыңыз, ресми шаблондарды жүктеп алыңыз және өтінім беру ережелерімен танысыңыз.'}</p>
        
        <div className="catalog-search-wrap" style={{ maxWidth: 600, marginTop: '20px' }}>
          <span className="catalog-search-icon">🔍</span>
          <input 
            className="catalog-search" 
            placeholder={lang === 'ru' ? 'Поиск статей по ключевым словам...' : 'Кілт сөздер бойынша мақалаларды іздеу...'} 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div>
          <h3>{lang === 'ru' ? 'Инструкции и ответы' : 'Нұсқаулықтар мен жауаптар'}</h3>
          <div className="news-list" style={{ marginTop: '14px' }}>
            {filtered.map(a => (
              <div 
                key={a.Id} 
                className={`news-item ${activeArticle?.Id === a.Id ? 'active' : ''}`}
                style={{ flexDirection: 'column', alignItems: 'flex-start', borderLeft: activeArticle?.Id === a.Id ? '4px solid var(--blue)' : '1px solid var(--border)' }}
                onClick={() => onSelectArticle(activeArticle?.Id === a.Id ? null : a)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span className="badge badge-blue">{lang === 'ru' ? a.Category : a.CategoryKz}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(a.CreatedAt).toLocaleDateString()}</span>
                </div>
                <h4 style={{ margin: '8px 0 4px', fontSize: 15 }}>{lang === 'ru' ? a.Title : a.TitleKz}</h4>
                {activeArticle?.Id === a.Id && (
                  <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, background: '#f8fafc', padding: 15, borderRadius: 8, width: '100%' }}>
                    {lang === 'ru' ? a.Content : a.ContentKz}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="detail-card">
          <h3>{lang === 'ru' ? 'Шаблоны документов' : 'Құжаттар үлгілері'}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            {lang === 'ru' ? 'Скачайте официальные бланки и заполните перед подачей заявки.' : 'Ресми бланкілерді жүктеп алыңыз және өтінім берер алдында толтырыңыз.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TEMPLATES.map(t => (
              <a
                key={t.file}
                href={t.file}
                download
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', border: '1px solid var(--border)',
                  borderRadius: 10, background: 'var(--bg)',
                  textDecoration: 'none', color: 'var(--ink)',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#EFF6FF'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--blue)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
              >
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>RTF · {t.size}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600 }}>⬇ {lang === 'ru' ? 'Скачать' : 'Жүктеу'}</span>
              </a>
            ))}
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12 }}>
            {lang === 'ru' ? '* Файлы в формате RTF, открываются в Word, LibreOffice' : '* RTF форматындағы файлдар, Word, LibreOffice-те ашылады'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ---- CATALOG PAGE ----
const CatalogPage: React.FC<{
  lang: string;
  onSelectService: (i: number) => void;
}> = ({ lang, onSelectService }) => {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const filtered = SERVICES.filter(s =>
    (cat === 'all' || s.cat === cat) &&
    (s.title.toLowerCase().includes(search.toLowerCase()) || s.org.toLowerCase().includes(search.toLowerCase()))
  );

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const tA = lang === 'ru' ? a.title : a.titleKz || a.title;
    const tB = lang === 'ru' ? b.title : b.titleKz || b.title;
    return sortOrder === 'asc' ? tA.localeCompare(tB) : tB.localeCompare(tA);
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (newCat: string) => { setCat(newCat); setPage(1); };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearch = (q: string) => { setSearch(q); setPage(1); };

  const cats = [
    { v: 'all', l: 'Все', lKz: 'Барлығы' }, 
    { v: 'leasing', l: 'Лизинг', lKz: 'Лизинг' }, 
    { v: 'credit', l: 'Кредиты', lKz: 'Несиелер' }, 
    { v: 'subsidy', l: 'Субсидии', lKz: 'Субсидиялар' }, 
    { v: 'guarantee', l: 'Гарантии', lKz: 'Кепілдіктер' }
  ];

  return (
    <div>
      <div className="catalog-header">
        <div className="catalog-title">{lang === 'ru' ? 'Каталог мер поддержки бизнеса' : 'Бизнесті қолдау шараларының каталогы'}</div>
        
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div className="catalog-search-wrap" style={{ flex: 1, minWidth: '280px' }}>
            <span className="catalog-search-icon">🔍</span>
            <input 
              className="catalog-search" 
              placeholder={lang === 'ru' ? 'Поиск услуг по названию или организации...' : 'Атауы немесе ұйымы бойынша қызметтерді іздеу...'} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <select className="form-control" style={{ width: '180px' }} value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}>
            <option value="asc">{lang === 'ru' ? 'Сортировка: А-Я' : 'Сұрыптау: А-Я'}</option>
            <option value="desc">{lang === 'ru' ? 'Сортировка: Я-А' : 'Сұрыптау: Я-А'}</option>
          </select>
        </div>

        <div className="filter-chips">
          {cats.map(c => (
            <button key={c.v} className={`filter-chip ${cat === c.v ? 'active' : ''}`} onClick={() => handleFilter(c.v)}>
              {lang === 'ru' ? c.l : c.lKz || c.l}
              {c.v === 'all' ? ` (${filtered.length})` : ` (${filtered.filter(s => s.cat === c.v).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="catalog-grid">
        {paginated.map((s) => {
          const realIdx = SERVICES.indexOf(s);
          const catColors: Record<string, string> = { leasing: 'badge-navy', subsidy: 'badge-green', credit: 'badge-amber', guarantee: 'badge-gray' };
          const catLabels: Record<string, string> = { leasing: 'Лизинг', subsidy: 'Субсидии', credit: 'Кредиты', guarantee: 'Гарантии' };
          const catLabelsKz: Record<string, string> = { leasing: 'Лизинг', subsidy: 'Субсидиялар', credit: 'Несиелер', guarantee: 'Кепілдіктер' };

          return (
            <div className="cat-card" key={s.title} onClick={() => onSelectService(realIdx)}>
              <div className="cat-card-top">
                <span className={`badge ${catColors[s.cat] || 'badge-gray'}`}>{lang === 'ru' ? catLabels[s.cat] : catLabelsKz[s.cat] || s.cat}</span>
                {s.stage && <span className="badge badge-gray">{lang === 'ru' ? `Этап ${s.stage}` : `${s.stage}-Кезең`}</span>}
              </div>
              <div className="cat-card-title">{lang === 'ru' ? s.title : s.titleKz || s.title}</div>
              <div className="cat-card-desc">{s.org} · {lang === 'ru' ? s.desc.slice(0, 80) : s.descKz?.slice(0, 80)}...</div>
              <div className="cat-card-footer"><span>{s.dur}</span><span className="cat-card-cta">{lang === 'ru' ? 'Подробнее →' : 'Толығырақ →'}</span></div>
            </div>
          );
        })}
        {paginated.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 14 }}>
            {lang === 'ru' ? 'Услуги не найдены' : 'Қызметтер табылмады'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '16px 24px 28px' }}>
          <button
            className="btn btn-sm btn-secondary"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ opacity: page === 1 ? 0.4 : 1 }}
          >← {lang === 'ru' ? 'Назад' : 'Артқа'}</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className="btn btn-sm"
              onClick={() => setPage(p)}
              style={{
                minWidth: 36,
                background: p === page ? 'var(--bt-navy-800)' : 'var(--white)',
                color: p === page ? 'white' : 'var(--ink-700)',
                borderColor: p === page ? 'var(--bt-navy-800)' : 'var(--border)',
                fontWeight: p === page ? 700 : 500,
              }}
            >{p}</button>
          ))}
          <button
            className="btn btn-sm btn-secondary"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ opacity: page === totalPages ? 0.4 : 1 }}
          >{lang === 'ru' ? 'Вперёд' : 'Алға'} →</button>
          <span style={{ fontSize: 12, color: 'var(--ink-400)', marginLeft: 8 }}>
            {lang === 'ru' ? `${sorted.length} услуг` : `${sorted.length} қызмет`}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- SERVICE DETAIL ----
const ServicePage: React.FC<{ svc: Service; lang: string; onApply: () => void }> = ({ svc, lang, onApply }) => {
  return (
    <div>
      <div className="service-hero">
        <span className="badge badge-blue">{svc.org}{svc.stage ? ` · Этап ${svc.stage}` : ''}</span>
        <h1 className="service-hero-title">{lang === 'ru' ? svc.title : svc.titleKz || svc.title}</h1>
        <p className="service-hero-desc">{lang === 'ru' ? svc.desc : svc.descKz || svc.desc}</p>
        <button 
          className="btn btn-gold" 
          onClick={svc.stage === 2 ? () => { 
            alert(lang === 'ru' ? 'Внимание: Подача на II Этап требует наличия одобренной заявки первого этапа!' : 'Назар аударыңыз: II кезеңге өтінім беру үшін бірінші кезеңнің мақұлданған өтінімі болуы қажет!'); 
            onApply(); 
          } : onApply}
        >
          📝 {lang === 'ru' ? 'Подать заявку онлайн' : 'Өтінімді онлайн беру'}
        </button>
      </div>
      <div className="service-detail-grid">
        <div className="detail-card">
          <h3>{lang === 'ru' ? 'Условия получения' : 'Алу шарттары'}</h3>
          <ul>{lang === 'ru' ? svc.conds.map((c, i) => <li key={i}>{c}</li>) : (svc.condsKz || svc.conds).map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
        <div className="detail-card">
          <h3>{lang === 'ru' ? 'Необходимые документы' : 'Қажетті құжаттар'}</h3>
          <ul>{lang === 'ru' ? svc.docs.map((d, i) => <li key={i}>{d}</li>) : (svc.docsKz || svc.docs).map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
        <div className="meta-grid">
          <div className="meta-box"><div className="meta-box-label">{lang === 'ru' ? 'Срок рассмотрения' : 'Қарау мерзімі'}</div><div className="meta-box-value">{svc.dur}</div></div>
          <div className="meta-box"><div className="meta-box-label">{lang === 'ru' ? 'Результат' : 'Нәтиже'}</div><div className="meta-box-value" style={{ fontSize: 12 }}>{svc.result}</div></div>
          <div className="meta-box"><div className="meta-box-label">{lang === 'ru' ? 'Электронная форма' : 'Электрондық форма'}</div><div className="meta-box-value" style={{ color: 'var(--success)' }}>100% {lang === 'ru' ? 'Онлайн' : 'Онлайн'}</div></div>
        </div>
      </div>
    </div>
  );
};

// ---- APPLICATION FORM FLOW (NO-CODE) ----
const AppFlow: React.FC<{ 
  steps: SchemaStep[]; 
  svc: Service; 
  lang: string;
  user: User | null;
  onBack: () => void; 
  onSubmit: (id: string) => void; 
  fetchApps: () => void;
}> = ({ steps, svc, lang, user, onBack, onSubmit, fetchApps }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [fv, setFv] = useState<FV>({
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [autofill, setAutofill] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const computed = reCalc(steps, fv);
  const curStep = steps[stepIdx];
  const pct = Math.round((stepIdx / steps.length) * 100);

  const setVal = useCallback((id: string, val: unknown) => {
    setFv(prev => reCalc(steps, { ...prev, [id]: val }));
    setErrors(prev => ({ ...prev, [id]: '' }));
  }, [steps]);

  // Simulated eGov auto-fill
  useEffect(() => {
    const binF = curStep.fields.find(f => f.hasEgov);
    if (!binF) return;
    const bin = String(computed[binF.id] || '');
    if (bin.length === 12) {
      setAutofill(true);
      const timer = setTimeout(() => {
        setFv(prev => reCalc(steps, { 
          ...prev, 
          company_name: bin === '123456789012' ? 'ТОО "АвиаТранс Казахстан"' : bin === '987654321098' ? 'АО "ГрузовагонСервис"' : 'ТОО "Демо Компания"', 
          oked_name: bin === '123456789012' ? '51.10 — Деятельность воздушного транспорта' : bin === '987654321098' ? '49.20 — Деятельность грузового ж/д транспорта' : '68.20 — Аренда и управление недвижимостью', 
          director: bin === '123456789012' ? 'Сейткали Ержан Бекович' : bin === '987654321098' ? 'Ахметов Дамир Нурланович' : 'Иванов Иван Иванович' 
        }));
        setAutofill(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed.bin, curStep, steps]);

  // Validation
  const validateCurrentStep = () => {
    const stepErrors: Record<string, string> = {};
    curStep.fields.forEach(f => {
      if (!isVis(f, computed)) return;
      if (f.required && (!computed[f.id] || String(computed[f.id]).trim() === '')) {
        stepErrors[f.id] = lang === 'ru' ? `Поле "${f.label}" обязательно для заполнения` : `"${f.labelKz || f.label}" толтыру қажет`;
      }
    });
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateCurrentStep()) return;

    if (stepIdx < steps.length - 1) { 
      setStepIdx(s => s + 1); 
    } else {
      setLoading(true);
      const id = 'BRK-' + Date.now().toString().slice(-8);
      try {
        await fetch('http://localhost:3001/api/applications', {
          method: 'POST',
          headers: getJsonAuthHeaders(localStorage.getItem('baiterek_token')),
          body: JSON.stringify({
            appNumber: id,
            serviceId: svc.stage === 2 ? 2 : 1,
            userId: user?.id || 1,
            formData: computed
          })
        });
        console.log('✅ Заявка сохранена в БД:', id);
        await fetchApps();
      } catch(e) {
        console.log('⚠️ Работаем в локальном режиме без бэкенда');
      }
      setLoading(false);
      onSubmit(id);
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header app-header-glass">
        <div className="header-left">
          <button className="btn btn-sm btn-back-custom" onClick={onBack}>← Назад</button>
          <div className="logo"><div className="logo-mark">Б</div><div><div className="logo-name">Подача заявки</div><div className="logo-sub">{svc.org}</div></div></div>
        </div>
        <div className="header-right" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Шаг {stepIdx + 1} из {steps.length}</div>
      </header>
      <div className="application-layout">
        <aside className="app-sidebar">
          <div className="app-sidebar-title">{lang === 'ru' ? svc.title : svc.titleKz || svc.title}</div>
          <div className="app-sidebar-org">{svc.org}{svc.stage ? ` · Этап ${svc.stage}` : ''}</div>
          <div className="app-steps">
            {steps.map((s, i) => (
              <div key={s.id} className={`app-step ${i === stepIdx ? 'current' : i < stepIdx ? 'done' : ''}`}>
                <div className="app-step-circle">{i < stepIdx ? '✓' : i + 1}</div>
                <div className="app-step-label">{lang === 'ru' ? s.title : s.titleKz || s.title}</div>
              </div>
            ))}
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <div className="progress-label">{pct}% заполнено</div>
        </aside>
        <div className="app-form-area">
          <h2 className="step-title-h">{lang === 'ru' ? curStep.title : curStep.titleKz || curStep.title}</h2>
          {stepIdx === 0 && <p className="step-desc-p">Данные компании заполняются автоматически из eGov по введённому БИН</p>}
          {autofill && <div className="autofill-banner"><div className="spinner" />Загрузка данных из eGov...</div>}
          
          <div className="fields-grid">
            {curStep.fields.filter(f => isVis(f, computed)).map(f => (
              <div key={f.id} className={f.width === 'half' ? 'field-half' : 'field-full'}>
                <FieldInput field={f} value={computed[f.id]} onChange={val => setVal(f.id, val)} lang={lang} />
                {errors[f.id] && <div className="form-error">⚠ {errors[f.id]}</div>}
              </div>
            ))}
          </div>
          
          <div className="form-nav">
            {stepIdx > 0 && <button className="btn" onClick={() => setStepIdx(s => s - 1)}>← Назад</button>}
            <button className="btn btn-primary btn-lg" onClick={nextStep} disabled={loading}>
              {loading ? <><span className="spinner" /> Отправка...</> : stepIdx < steps.length - 1 ? 'Далее →' : 'Подать заявку ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FieldInput: React.FC<{ field: SchemaField; value: unknown; onChange: (v: unknown) => void; lang: string }> = ({ field, value, onChange, lang }) => {
  const str = String(value ?? '');
  const disabled = field.disabled || field.type === 'calculated';
  const label = lang === 'ru' ? field.label : field.labelKz || field.label;
  const hint = lang === 'ru' ? field.hint : field.hintKz || field.hint;

  return (
    <div style={{ width: '100%' }}>
      <label className="form-label">{label}{field.required && <span className="required"> *</span>}</label>
      {field.type === 'calculated' ? (
        <div className="calc-display">
          <span className="calc-value">{value !== undefined && value !== '' ? fmtCur(Number(value)) : '—'}</span>
          <span className="calc-tag">авторасчёт</span>
        </div>
      ) : field.type === 'radio' ? (
        <div className="radio-group">
          {(field.options || []).map(o => (
            <div key={o.v} className={`radio-option ${str === o.v ? 'selected' : ''}`} onClick={() => onChange(o.v)}>
              <div className="radio-dot" />{lang === 'ru' ? o.l : o.lKz || o.l}
            </div>
          ))}
        </div>
      ) : field.type === 'select' ? (
        <select className="form-control" value={str} disabled={disabled} onChange={e => onChange(e.target.value)}>
          <option value="">— Выберите —</option>
          {(field.options || []).map(o => <option key={o.v} value={o.v}>{lang === 'ru' ? o.l : o.lKz || o.l}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea className="form-control textarea" value={str} rows={4} placeholder="Опишите проект..." onChange={e => onChange(e.target.value)} />
      ) : field.type === 'file' ? (
        <div className="file-upload">
          <span style={{ fontSize: 20 }}>📎</span>
          <div><div style={{ fontSize: 13, fontWeight: 500 }}>Нажмите для загрузки</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>PDF · до 10 МБ</div></div>
          <input type="file" onChange={(e: any) => {
            const f = e.target.files[0];
            if (f) onChange(f.name);
          }} />
          {str && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>Загружен: {str}</div>}
        </div>
      ) : field.type === 'currency' ? (
        <div className="currency-wrap">
          <input className="form-control" style={{ paddingRight: 24 }} value={str ? Number(str).toLocaleString('ru-KZ') : ''} placeholder="0" disabled={disabled}
            onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <span className="currency-suffix">₸</span>
          {hint && <div className="form-hint">{hint}</div>}
        </div>
      ) : field.type === 'iin_bin' ? (
        <input className="form-control" type="text" maxLength={12} placeholder="____________" value={str} disabled={disabled}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '');
            onChange(val);
          }}
        />
      ) : field.type === 'phone' ? (
        <input className="form-control" type="text" placeholder="+7 (707) 123-45-67" value={str} disabled={disabled}
          onChange={e => {
            let val = e.target.value;
            if (!val.startsWith('+7')) val = '+7' + val.replace(/\D/g, '');
            onChange(val);
          }}
        />
      ) : (
        <input className="form-control" type={field.type === 'email' ? 'email' : 'text'} value={str} disabled={disabled}
          onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
};

// ---- SUCCESS ----
const SuccessPage: React.FC<{ appId: string; svc: Service; onDash: () => void }> = ({ appId, svc, onDash }) => (
  <div className="success-page">
    <div className="success-card">
      <div className="success-icon">✅</div>
      <div className="success-title">Заявка успешно подана!</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Зарегистрирована в <strong>{svc.org}</strong></div>
      <div className="success-number">Номер заявки: {appId}</div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}>
        <div>📧 Уведомление отправлено на email</div>
        <div>⏱ Срок рассмотрения: {svc.dur}</div>
        <div>📊 Статус можно отслеживать в личном кабинете</div>
      </div>
      <div className="eish-badge"><span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Передано в ЕИШ</span><span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{svc.eish || '/api/eish/brk'}</span></div>
      <button className="btn btn-primary" onClick={onDash}>← В личный кабинет</button>
    </div>
  </div>
);

// ---- LOGIN ----
const LoginPage: React.FC<{ onLogin: (u: User, token?: string) => void; onAdminLogin: (token?: string) => void }> = ({ onLogin, onAdminLogin }) => {
  const [iin, setIin] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [step, setStep] = useState<'form' | 'redirect' | 'fetch' | 'done'>('form');

  const iinValid = iin.length === 12;
  const passValid = pass.length >= 3;

  const submit = async () => {
    if (!iinValid) { setErr('ИИН должен содержать ровно 12 цифр'); return; }
    if (!passValid) { setErr('Пароль должен содержать не менее 3 символов'); return; }
    setErr('');

    // Step 1 — simulate redirect to eGov IDP
    setStep('redirect');
    await new Promise(r => setTimeout(r, 900));

    // Step 2 — simulate token exchange + user data fetch
    setStep('fetch');
    await new Promise(r => setTimeout(r, 800));

    const demoName = iin === '123456789012' ? 'Сейткали Ержан Бекович' : 'Сериков Алмас Бекович';
    const company = iin === '123456789012' ? 'ТОО "АвиаТранс Казахстан"' : 'ИП Сериков А.Б.';

    try {
      const res = await fetch('http://localhost:3001/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iin, fullName: demoName, email: `${iin}@egov.kz`, phone: '+7 (701) 999-99-99', companyName: company, position: 'Директор' })
      });
      if (res.ok) {
        const data = await res.json();
        setStep('done');
        setTimeout(() => onLogin(
          { id: data.user.Id, name: data.user.FullName, iin: data.user.IIN, email: data.user.Email, phone: data.user.Phone, companyName: data.user.CompanyName, position: data.user.Position, role: data.user.Role },
          data.token
        ), 400);
        return;
      }
    } catch {}
    setStep('done');
    setTimeout(() => onLogin({ name: demoName, iin, email: `${iin}@egov.kz`, phone: '+7 (701) 999-99-99', companyName: company, id: Date.now() }), 400);
  };

  // OAuth flow steps UI
  if (step !== 'form') {
    const steps = [
      { id: 'redirect', label: 'Перенаправление на eGov IDP', done: step === 'fetch' || step === 'done' },
      { id: 'fetch',    label: 'Получение данных профиля (OpenID Connect)', done: step === 'done' },
      { id: 'done',     label: 'Авторизация завершена', done: step === 'done' },
    ];
    return (
      <div className="login-page">
        <div className="login-card login-card-glass" style={{ textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#1A3D8F,#3D6FC9)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>eG</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink-900)', marginBottom: 6 }}>Авторизация через eGov IDP</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)', marginBottom: 24 }}>idp.egov.kz · OAuth 2.0 / OpenID Connect</div>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {steps.map((s, i) => {
              const isActive = !s.done && steps.slice(0, i).every(x => x.done);
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, fontSize: '0.78rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: s.done ? '#16a34a' : isActive ? 'var(--bt-navy-700)' : 'var(--bg)',
                    color: s.done || isActive ? '#fff' : 'var(--ink-400)',
                    border: s.done || isActive ? 'none' : '1.5px solid var(--border)',
                  }}>
                    {s.done ? '✓' : isActive ? <span className="spinner" style={{ width: 12, height: 12 }} /> : i + 1}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: s.done ? 'var(--ink-700)' : isActive ? 'var(--ink-900)' : 'var(--ink-400)', fontWeight: isActive ? 600 : 400 }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card login-card-glass">
        {/* eGov header */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--bt-navy-900)', borderRadius: 12, padding: '10px 20px', marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1A3D8F,#3D6FC9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>eG</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
              eGov IDP<br/><span style={{ fontWeight: 400, fontSize: '0.7rem', opacity: 0.7 }}>idp.egov.kz</span>
            </div>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink-900)', marginBottom: 2 }}>Вход в личный кабинет</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>Единый портал поддержки бизнеса Байтерек</div>
        </div>

        {/* Protocol badge */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '8px 0 16px' }}>
          {['OAuth 2.0', 'OpenID Connect', 'ИИН-аутентификация'].map(b => (
            <span key={b} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10, background: 'var(--bt-navy-50)', color: 'var(--bt-navy-700)', fontWeight: 600 }}>{b}</span>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">ИИН <span className="required">*</span></label>
          <input className="form-control" maxLength={12} placeholder="000000000000" value={iin}
            onChange={e => { setIin(e.target.value.replace(/\D/g, '').slice(0, 12)); setErr(''); }}
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }} />
          <div style={{ fontSize: '0.72rem', color: iin.length === 12 ? '#16a34a' : 'var(--ink-400)', marginTop: 4 }}>
            {iin.length}/12 {iin.length === 12 ? '✓' : ''}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Пароль eGov <span className="required">*</span></label>
          <input className="form-control" type="password" placeholder="••••••••" value={pass}
            onChange={e => { setPass(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        {err && <div className="form-error">⚠ {err}</div>}
        <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }} onClick={submit} disabled={!iinValid || !passValid}>
          Войти через eGov →
        </button>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-400)', textAlign: 'center', marginTop: 8 }}>
          Демо: ИИН — любые 12 цифр, пароль — любые ≥ 3 символа
        </div>
      </div>
    </div>
  );
};

// ---- ADMIN LOGIN ----
const AdminLoginPage: React.FC<{ onLogin: (token?: string) => void }> = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data.token);
      } else {
        // Fallback для офлайн-демо
        if (login === 'admin' || login === 'admin@baiterek.kz') {
          onLogin();
        } else {
          setErr('Неверный логин или пароль');
        }
      }
    } catch {
      // Офлайн-режим: проверяем локально
      if ((login === 'admin' || login === 'admin@baiterek.kz') && pass === 'baiterek2026') {
        onLogin();
      } else {
        setErr('Неверный логин или пароль');
      }
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="admin-icon">⚙️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Панель администратора</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Только для сотрудников Холдинга</div>
          </div>
        </div>
        <div className="admin-notice">
          🔐 Доступ защищён JWT-токеном. Войдите с корпоративными учётными данными.
        </div>
        <div className="form-group"><label className="form-label">Логин <span className="required">*</span></label>
          <input className="form-control" placeholder="admin@baiterek.kz" value={login} onChange={e => setLogin(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Пароль <span className="required">*</span></label>
          <input className="form-control" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        {err && <div className="form-error">⚠ {err}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={submit} disabled={loading}>
          {loading ? '⏳ Проверка...' : '🔐 Войти'}
        </button>
        <div className="login-demo">Демо: логин <strong>admin@baiterek.kz</strong> · пароль <strong>baiterek2026</strong></div>
      </div>
    </div>
  );
};

// ---- CABINET (DASHBOARD) ----
const DashPage: React.FC<{ 
  user: User; 
  apps: AppRecord[];
  bookings: any[];
  activeApp: AppRecord | null;
  appComments: any[];
  appDocs: any[];
  newCommentText: string;
  setNewCommentText: (s: string) => void;
  isSigningOpen: boolean;
  signKeyFile: string;
  setSignKeyFile: (s: string) => void;
  signPassword: string;
  setSignPassword: (s: string) => void;
  signError: string;
  signSuccessMessage: string;
  profileName: string; setProfileName: (s: string) => void;
  profileEmail: string; setProfileEmail: (s: string) => void;
  profilePhone: string; setProfilePhone: (s: string) => void;
  profileCompany: string; setProfileCompany: (s: string) => void;
  profilePosition: string; setProfilePosition: (s: string) => void;
  profileSavedMsg: boolean;
  bookingOrg: string; setBookingOrg: (s: string) => void;
  bookingDate: string; setBookingDate: (s: string) => void;
  bookingTime: string; setBookingTime: (s: string) => void;
  bookingTopic: string; setBookingTopic: (s: string) => void;
  bookingMessage: string; setBookingMessage: (s: string) => void;
  onSaveProfile: (e: React.FormEvent) => void;
  onBook: (e: React.FormEvent) => void;
  onSelectApp: (app: AppRecord) => void;
  onCloseApp: () => void;
  onSendComment: () => void;
  onUploadDocVersion: (fieldId: string, label: string) => void;
  onSignDoc: (fieldId: string) => void;
  onSignConfirm: () => void;
  onSignCancel: () => void;
  onGoService: (i: number) => void; 
  onGoCatalog: () => void; 
  onLogout: () => void;
}> = ({ 
  user, apps, bookings, activeApp, appComments, appDocs, newCommentText, setNewCommentText,
  isSigningOpen, signKeyFile, setSignKeyFile, signPassword, setSignPassword, signError, signSuccessMessage,
  profileName, setProfileName, profileEmail, setProfileEmail, profilePhone, setProfilePhone,
  profileCompany, setProfileCompany, profilePosition, setProfilePosition, profileSavedMsg,
  bookingOrg, setBookingOrg, bookingDate, setBookingDate, bookingTime, setBookingTime, bookingTopic, setBookingTopic, bookingMessage, setBookingMessage,
  onSaveProfile, onBook, onSelectApp, onCloseApp, onSendComment, onUploadDocVersion, onSignDoc, onSignConfirm, onSignCancel,
  onGoService, onGoCatalog, onLogout 
}) => {
  const [cabinetTab, setCabinetTab] = useState<'applications' | 'booking' | 'profile' | 'calculator'>('applications');
  const userApps = apps.filter(a => a.userIin === user.iin || a.userName === user.name);

  // Status mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <span className="badge badge-blue">На рассмотрении</span>;
      case 'in_review': return <span className="badge badge-amber">В процессе обработки</span>;
      case 'additional_docs_required': return <span className="badge badge-red">Требуются доп. документы</span>;
      case 'approved': return <span className="badge badge-green">Одобрено</span>;
      case 'rejected': return <span className="badge badge-red">Отклонено</span>;
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div style={{ overflowY: 'auto' }}>
      <div className="cabinet-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginBottom: 4 }}>Личный кабинет предпринимателя</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>ИИН: {user.iin} · Резидент Республики Казахстан</div>
          </div>
          <button className="btn btn-sm btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={onLogout}>Выйти</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <button className={`btn btn-sm ${cabinetTab === 'applications' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCabinetTab('applications')}>📋 Мои обращения</button>
          <button className={`btn btn-sm ${cabinetTab === 'booking' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCabinetTab('booking')}>📅 Запись на очередь</button>
          <button className={`btn btn-sm ${cabinetTab === 'calculator' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCabinetTab('calculator')}>🧮 Смета расходов</button>
          <button className={`btn btn-sm ${cabinetTab === 'profile' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCabinetTab('profile')}>👤 Профиль компании</button>
        </div>
      </div>

      {cabinetTab === 'applications' && (
        <div className="section">
          {activeApp ? (
            /* DETAILS APPLICATON VIEW */
            <div className="detail-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <button className="btn btn-sm" onClick={onCloseApp}>← Назад к списку</button>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Номер заявки: <strong style={{ color: 'var(--text)' }}>{activeApp.id}</strong></div>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{activeApp.title}</h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                <span>Статус: {getStatusBadge(activeApp.status)}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Дата подачи: {activeApp.date}</span>
              </div>

              {/* Status Timeline */}
              <div style={{ margin: '20px 0', padding: '15px 20px', background: '#f8fafc', borderRadius: 12 }}>
                <h4>Этапы обработки заявки:</h4>
                <div className="status-timeline-track" style={{ display: 'flex', gap: '20px', marginTop: '15px', position: 'relative' }}>
                  <div className={`timeline-step ${['submitted', 'in_review', 'additional_docs_required', 'approved', 'rejected'].includes(activeApp.status) ? 'active' : ''}`}>
                    <div className="tl-dot">1</div><div className="tl-label">Подано</div>
                  </div>
                  <div className={`timeline-step ${['in_review', 'additional_docs_required', 'approved', 'rejected'].includes(activeApp.status) ? 'active' : ''}`}>
                    <div className="tl-dot">2</div><div className="tl-label">В обработке</div>
                  </div>
                  {activeApp.status === 'additional_docs_required' && (
                    <div className="timeline-step active error">
                      <div className="tl-dot">!</div><div className="tl-label">Нужны док-ты</div>
                    </div>
                  )}
                  <div className={`timeline-step ${['approved', 'rejected'].includes(activeApp.status) ? 'active' : ''}`}>
                    <div className="tl-dot">3</div><div className="tl-label">Решение</div>
                  </div>
                </div>
              </div>

              {/* Document Versioning Section */}
              <div style={{ margin: '24px 0' }}>
                <h3>Документы к заявке и версионирование</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>В случае запроса дополнительных документов, загрузите новую версию необходимого файла ниже.</p>
                
                <table className="data-table" style={{ width: '100%', marginBottom: 14 }}>
                  <thead>
                    <tr><th>Название документа</th><th>Статус ЭЦП</th><th>Версии файлов</th><th>Действие</th></tr>
                  </thead>
                  <tbody>
                    {LEASING_SCHEMA[3].fields.map(f => {
                      const docHistory = appDocs.filter(d => d.DocFieldId === f.id);
                      const latestVersion = docHistory.length ? docHistory[0] : null;
                      const hasSign = appComments.some(c => c.UserName === 'Система ЭЦП' && c.Message.includes(f.id));

                      return (
                        <tr key={f.id}>
                          <td><strong>{f.label}</strong>{f.required && <span className="required"> *</span>}</td>
                          <td>
                            {hasSign ? (
                              <span className="badge badge-green">✓ Подписано ЭЦП</span>
                            ) : (
                              <button className="btn btn-xs btn-gold" onClick={() => onSignDoc(f.id)}>Подписать ЭЦП</button>
                            )}
                          </td>
                          <td>
                            {latestVersion ? (
                              <div>
                                <span className="badge badge-blue">v{latestVersion.Version}</span> {latestVersion.FileName} 
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Загрузил: {latestVersion.UploadedBy}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--error)' }}>Файл не прикреплен</span>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-xs btn-primary" onClick={() => onUploadDocVersion(f.id, f.label)}>Загрузить версию</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Chat & comments with consultant */}
              <div style={{ marginTop: '30px' }}>
                <h3>Консультации и чат с куратором</h3>
                <div className="chat-box" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 18, background: '#f8fafc', height: 260, overflowY: 'auto', margin: '12px 0' }}>
                  {appComments.length ? appComments.map(c => {
                    const isSystem = c.UserName === 'Система ЭЦП';
                    const isManager = c.UserName === 'Администратор' || c.UserName === 'Куратор';
                    return (
                      <div key={c.Id} style={{ 
                        background: isSystem ? '#fef3c7' : isManager ? '#eff6ff' : '#fff', 
                        padding: '10px 14px', 
                        borderRadius: 8, 
                        marginBottom: 10, 
                        borderLeft: isSystem ? '4px solid var(--gold)' : isManager ? '4px solid var(--blue)' : '1px solid var(--border)',
                        alignSelf: isManager ? 'flex-start' : 'flex-end'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                          <span>{c.UserName}</span>
                          <span>{new Date(c.CreatedAt).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text)' }}>{c.Message}</div>
                      </div>
                    );
                  }) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Сообщений нет. Задайте вопрос куратору.</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <input 
                    className="form-control" 
                    placeholder="Напишите сообщение куратору..." 
                    value={newCommentText} 
                    onChange={e => setNewCommentText(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && onSendComment()}
                  />
                  <button className="btn btn-primary" onClick={onSendComment}>Отправить</button>
                </div>
              </div>
            </div>
          ) : (
            /* APPLICATION LISTS */
            <>
              <div className="section-title" style={{ marginBottom: 14 }}>Мои поданные заявки ({userApps.length})</div>
              {userApps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {userApps.map(a => (
                    <div key={a.id} className="submitted-app-card" style={{ cursor: 'pointer' }} onClick={() => onSelectApp(a)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>ID: {a.id}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {getStatusBadge(a.status)}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{a.date}</span>
                        <span style={{ color: 'var(--blue)' }}>Открыть детали →</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                  У вас пока нет активных заявок. Воспользуйтесь разделом "Каталог услуг" для подачи.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ONLINE BOOKING COMPONENT */}
      {cabinetTab === 'booking' && (
        <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="detail-card">
            <h3>Забронировать электронную очередь</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Запишитесь на онлайн-консультацию к специалистам холдинга и получите ответы в назначенное время.</p>
            
            <form onSubmit={onBook}>
              <div className="form-group">
                <label className="form-label">Организация холдинга *</label>
                <select className="form-control" value={bookingOrg} onChange={e => setBookingOrg(e.target.value)} required>
                  <option value="">— Выбрать организацию —</option>
                  {ORGANIZATIONS.map(o => <option key={o.abbr} value={o.name}>{o.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Дата *</label>
                  <input className="form-control" type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Время *</label>
                  <select className="form-control" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required>
                    <option value="">— Время —</option>
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="11:00 - 12:00">11:00 - 12:00</option>
                    <option value="14:00 - 15:00">14:00 - 15:00</option>
                    <option value="15:00 - 16:00">15:00 - 16:00</option>
                    <option value="16:00 - 17:00">16:00 - 17:00</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Тема консультации *</label>
                <input className="form-control" placeholder="Например: Необходимые документы для лизинга" value={bookingTopic} onChange={e => setBookingTopic(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Дополнительные комментарии</label>
                <textarea className="form-control" rows={3} placeholder="Описание вашей проблемы..." value={bookingMessage} onChange={e => setBookingMessage(e.target.value)} />
              </div>

              <button className="btn btn-primary" type="submit">📅 Подтвердить бронирование</button>
            </form>
          </div>

          <div>
            <h3>История моих бронирований ({bookings.length})</h3>
            <div className="news-list" style={{ marginTop: '14px' }}>
              {bookings.length ? bookings.map(b => (
                <div key={b.Id} className="news-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span className="badge badge-blue">{b.Organization}</span>
                    <span className="badge badge-green">Подтверждено в CRM</span>
                  </div>
                  <h4 style={{ margin: '8px 0 4px' }}>{b.Topic}</h4>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    📅 Дата: <strong>{b.Date}</strong> | ⏱ Время: <strong>{b.TimeSlot}</strong>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: 30, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)' }}>Записей не обнаружено</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE COMPONENT */}
      {cabinetTab === 'profile' && (
        <div className="section" style={{ maxWidth: 600 }}>
          <div className="detail-card">
            <h3>Профиль компании и предпринимателя</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Редактируйте свои контактные данные. Это необходимо для связи кураторов холдинга с вашей организацией.</p>
            
            <form onSubmit={onSaveProfile}>
              <div className="form-group">
                <label className="form-label">ФИО представителя *</label>
                <input className="form-control" value={profileName} onChange={e => setProfileName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">ИИН (Недоступно для редактирования)</label>
                <input className="form-control" value={user.iin} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Контактный телефон *</label>
                <input className="form-control" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email адрес *</label>
                <input className="form-control" type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Название организации</label>
                <input className="form-control" value={profileCompany} onChange={e => setProfileCompany(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Должность в компании</label>
                <input className="form-control" value={profilePosition} onChange={e => setProfilePosition(e.target.value)} />
              </div>

              {profileSavedMsg && <div className="save-toast" style={{ marginBottom: 10 }}>✓ Профиль успешно обновлен в БД!</div>}
              <button className="btn btn-primary" type="submit">💾 Сохранить изменения</button>
            </form>
          </div>
        </div>
      )}

      {/* BUSINESS EXPENSE CALCULATOR */}
      {cabinetTab === 'calculator' && <BusinessCalculator />}

      {/* MOCK EGOV NCALAYER SIGNING MODAL */}
      {isSigningOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#fff', padding: 30, borderRadius: 12, maxWidth: 440, width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3>Подписание ЭЦП (NCALayer)</h3>
              <button className="icon-btn" onClick={onSignCancel}>✕</button>
            </div>
            
            <div className="egov-row" style={{ marginBottom: 14 }}><div className="egov-pill">eGov</div>Интеграция с НУЦ РК активна</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Выберите файл закрытого ключа (формат .p12) и введите пароль.</p>
            
            <div className="form-group">
              <label className="form-label">Файл сертификата ЭЦП *</label>
              <select className="form-control" value={signKeyFile} onChange={e => setSignKeyFile(e.target.value)} required>
                <option value="">— Выбрать файл сертификата —</option>
                <option value={`SIGN_FL_${user.iin}.p12`}>SIGN_FL_{user.iin}.p12 (Ключ подписи физлица)</option>
                <option value={`AUTH_FL_${user.iin}.p12`}>AUTH_FL_{user.iin}.p12 (Ключ авторизации физлица)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Пароль / PIN-код сертификата *</label>
              <input className="form-control" type="password" placeholder="Пароль ЭЦП (по умолчанию: 123456)" value={signPassword} onChange={e => setSignPassword(e.target.value)} />
            </div>

            {signError && <div className="form-error" style={{ marginBottom: 10 }}>⚠ {signError}</div>}
            {signSuccessMessage && <div className="save-toast" style={{ marginBottom: 10 }}>{signSuccessMessage}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn" onClick={onSignCancel}>Отмена</button>
              <button className="btn btn-primary" onClick={onSignConfirm}>Подписать документ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- BUSINESS CALCULATOR (СМЕТА РАСХОДОВ) ----
const BusinessCalculator: React.FC = () => {
  type CalcItem = { id: number; name: string; qty: number; price: number; category: string };
  const [items, setItems] = useState<CalcItem[]>([
    { id: 1, name: 'Аренда помещения (м²/мес)', qty: 100, price: 3500, category: 'Аренда' },
    { id: 2, name: 'Оборудование (единиц)', qty: 5, price: 450000, category: 'Основные средства' },
    { id: 3, name: 'Заработная плата (сотрудников)', qty: 10, price: 220000, category: 'ФОТ' },
    { id: 4, name: 'Коммунальные услуги (мес)', qty: 1, price: 85000, category: 'Операционные' },
    { id: 5, name: 'Маркетинг и реклама', qty: 1, price: 150000, category: 'Маркетинг' },
  ]);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);
  const [newCategory, setNewCategory] = useState('Операционные');
  const [projectName, setProjectName] = useState('Мой инвестиционный проект');

  const categories = ['Аренда', 'Основные средства', 'ФОТ', 'Операционные', 'Маркетинг', 'Сырьё и материалы', 'Транспорт и логистика', 'Прочее'];
  const catColors: Record<string, string> = {
    'Аренда': 'badge-blue', 'Основные средства': 'badge-amber', 'ФОТ': 'badge-green',
    'Операционные': 'badge-gray', 'Маркетинг': 'badge-red', 'Сырьё и материалы': 'badge-amber',
    'Транспорт и логистика': 'badge-blue', 'Прочее': 'badge-gray'
  };

  const addItem = () => {
    if (!newName.trim() || newPrice <= 0) return;
    setItems(prev => [...prev, { id: Date.now(), name: newName, qty: newQty, price: newPrice, category: newCategory }]);
    setNewName(''); setNewQty(1); setNewPrice(0);
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: number, field: keyof CalcItem, val: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const byCategory = categories.reduce((acc, cat) => {
    const catTotal = items.filter(i => i.category === cat).reduce((s, i) => s + i.qty * i.price, 0);
    if (catTotal > 0) acc[cat] = catTotal;
    return acc;
  }, {} as Record<string, number>);

  const exportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,Наименование,Категория,Количество,Цена (₸),Итого (₸)\n';
    items.forEach(i => { csv += `"${i.name}","${i.category}",${i.qty},${i.price},${i.qty * i.price}\n`; });
    csv += `,,,,\nИТОГО,,,,${total}\n`;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Smeta_${projectName.replace(/\s/g, '_')}.csv`);
    link.click();
  };

  return (
    <div className="section">
      <div className="detail-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3>Калькулятор сметы расходов</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Рассчитайте ориентировочные затраты проекта для подготовки бизнес-плана и заявки на финансирование</p>
          </div>
          <button className="btn btn-sm btn-primary" onClick={exportCSV}>📥 Экспорт в CSV</button>
        </div>

        <div className="form-group">
          <label className="form-label">Название проекта</label>
          <input className="form-control" value={projectName} onChange={e => setProjectName(e.target.value)} style={{ maxWidth: 400 }} />
        </div>

        <table className="data-table" style={{ width: '100%', marginBottom: 16 }}>
          <thead>
            <tr><th>Наименование статьи</th><th>Категория</th><th style={{ width: 90 }}>Кол-во</th><th style={{ width: 140 }}>Цена (₸)</th><th style={{ width: 140 }}>Итого (₸)</th><th style={{ width: 60 }}>—</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td><input className="form-control" style={{ fontSize: 12, padding: '4px 8px' }} value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} /></td>
                <td>
                  <select className="form-control" style={{ fontSize: 12, padding: '4px 8px' }} value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td><input className="form-control" style={{ fontSize: 12, padding: '4px 8px' }} type="number" min={1} value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} /></td>
                <td><input className="form-control" style={{ fontSize: 12, padding: '4px 8px' }} type="number" min={0} value={item.price} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} /></td>
                <td><strong style={{ color: 'var(--blue)' }}>{(item.qty * item.price).toLocaleString('ru-KZ')} ₸</strong></td>
                <td><button className="btn btn-xs" style={{ color: 'var(--error)', padding: '2px 8px' }} onClick={() => removeItem(item.id)}>✕</button></td>
              </tr>
            ))}
            <tr style={{ background: '#f0fdf4' }}>
              <td><input className="form-control" style={{ fontSize: 12, padding: '4px 8px' }} placeholder="Новая статья расходов..." value={newName} onChange={e => setNewName(e.target.value)} /></td>
              <td>
                <select className="form-control" style={{ fontSize: 12, padding: '4px 8px' }} value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td><input className="form-control" style={{ fontSize: 12, padding: '4px 8px' }} type="number" min={1} value={newQty} onChange={e => setNewQty(Number(e.target.value))} /></td>
              <td><input className="form-control" style={{ fontSize: 12, padding: '4px 8px' }} type="number" min={0} placeholder="0" value={newPrice || ''} onChange={e => setNewPrice(Number(e.target.value))} /></td>
              <td><strong style={{ color: 'var(--success)' }}>{(newQty * newPrice).toLocaleString('ru-KZ')} ₸</strong></td>
              <td><button className="btn btn-xs btn-primary" onClick={addItem}>+</button></td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ background: '#eff6ff', fontWeight: 700 }}>
              <td colSpan={4}><strong>ИТОГО ПО СМЕТЕ</strong></td>
              <td colSpan={2}><strong style={{ fontSize: 16, color: 'var(--blue)' }}>{total.toLocaleString('ru-KZ')} ₸</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="detail-card">
          <h4 style={{ marginBottom: 14 }}>Структура расходов по категориям</h4>
          {Object.entries(byCategory).map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className={`badge ${catColors[cat] || 'badge-gray'}`}>{cat}</span>
                <strong style={{ fontSize: 12 }}>{amt.toLocaleString('ru-KZ')} ₸</strong>
              </div>
              <div style={{ background: '#f1f5f9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{ background: 'var(--blue)', height: '100%', width: `${Math.round((amt / total) * 100)}%`, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{Math.round((amt / total) * 100)}% от общей сметы</div>
            </div>
          ))}
        </div>

        <div className="detail-card">
          <h4 style={{ marginBottom: 14 }}>Рекомендуемые программы финансирования</h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>На основе вашей сметы ({total.toLocaleString('ru-KZ')} ₸) подходящие меры поддержки:</p>
          {total > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {total >= 80000000 && (
                <div style={{ padding: '10px 14px', background: 'var(--blue-light)', borderRadius: 8, borderLeft: '4px solid var(--blue)' }}>
                  <strong style={{ fontSize: 13 }}>БРК Лизинг</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Лизинг оборудования — от 80 млн ₸</div>
                </div>
              )}
              {total >= 5000000 && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, borderLeft: '4px solid var(--success)' }}>
                  <strong style={{ fontSize: 13 }}>Даму — Субсидирование ставки</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Снижение ставки кредита до 7-8%</div>
                </div>
              )}
              {total >= 5000000 && (
                <div style={{ padding: '10px 14px', background: '#fefce8', borderRadius: 8, borderLeft: '4px solid #eab308' }}>
                  <strong style={{ fontSize: 13 }}>КазАгро — Льготный кредит АПК</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Для АПК — ставка от 6% годовых</div>
                </div>
              )}
              {total >= 1000000000 && (
                <div style={{ padding: '10px 14px', background: '#f5f3ff', borderRadius: 8, borderLeft: '4px solid #7c3aed' }}>
                  <strong style={{ fontSize: 13 }}>KIC — Прямые инвестиции</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Equity-инвестиции от 500 млн ₸</div>
                </div>
              )}
              {total < 5000000 && (
                <div style={{ padding: '10px 14px', background: '#fff7ed', borderRadius: 8, borderLeft: '4px solid var(--warning)' }}>
                  <strong style={{ fontSize: 13 }}>Даму — Гарантирование</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Гарантия до 85% при нехватке залога</div>
                </div>
              )}
            </div>
          )}
          {total === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Добавьте статьи расходов для получения рекомендаций.</p>}
        </div>
      </div>
    </div>
  );
};

// ---- CONTACTS PAGE ----
const ContactsPage: React.FC<{
  name: string; setName: (s: string) => void;
  email: string; setEmail: (s: string) => void;
  subject: string; setSubject: (s: string) => void;
  msg: string; setMsg: (s: string) => void;
  success: boolean; setSuccess: (b: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}> = ({ name, setName, email, setEmail, subject, setSubject, msg, setMsg, success, setSuccess, onSubmit }) => {
  return (
    <div style={{ padding: '0 20px 40px' }}>
      <div className="service-hero" style={{ background: 'linear-gradient(135deg, #0c447c 0%, #1e429f 100%)' }}>
        <h1 className="service-hero-title">Контакты холдинга и обратная связь</h1>
        <p className="service-hero-desc">Свяжитесь со специалистами службы поддержки или направьте официальное обращение в канцелярию холдинга «Байтерек».</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 20 }}>
        <div className="detail-card">
          <h3>Форма обратной связи</h3>
          {success ? (
            <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: 20, borderRadius: 8, marginTop: 14 }}>
              <h4>✓ Ваше обращение успешно отправлено!</h4>
              <p style={{ fontSize: 12, marginTop: 6 }}>Мы зарегистрировали его в журнале и ответим вам на указанный email в течение 2-х рабочих часов.</p>
              <button className="btn btn-sm btn-primary" style={{ marginTop: 14 }} onClick={() => setSuccess(false)}>Отправить еще одно сообщение</button>
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
              <div className="form-group">
                <label className="form-label">Ваше ФИО / Название организации *</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Электронная почта для ответа *</label>
                <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Тема сообщения *</label>
                <input className="form-control" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Текст сообщения *</label>
                <textarea className="form-control" rows={5} value={msg} onChange={e => setMsg(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit">✉ Отправить сообщение</button>
            </form>
          )}
        </div>

        <div>
          <h3>Контактная информация</h3>
          <div className="detail-card" style={{ marginTop: 14, marginBottom: 20 }}>
            <h4>Служба поддержки и Call-центр</h4>
            <p style={{ marginTop: 8 }}>📞 Телефон горячей линии: <strong style={{ color: 'var(--blue)' }}>1402</strong> (бесплатно по РК)</p>
            <p>📧 Единый email поддержки: <strong style={{ color: 'var(--blue)' }}>support@baiterek.gov.kz</strong></p>
            <p>⏰ Режим работы: Пн-Пт, с 09:00 до 18:30 (перерыв: 13:00 - 14:30)</p>
          </div>
          
          <div className="detail-card">
            <h4>Центральный офис</h4>
            <p style={{ marginTop: 8 }}>📍 Адрес: г. Астана, район Есиль, пр. Мангилик Ел, 55А (Бизнес-центр "Baiterek Tower")</p>
            <p>☎ Приемная канцелярии: +7 (7172) 79-65-00</p>
            <p>🤖 Поддержка в мессенджерах: WhatsApp / Telegram Bot (<span style={{ color: 'var(--blue)', cursor: 'pointer' }}>@BaiterekPortalBot</span>)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- VACANCIES PAGE ----
const VacanciesPage: React.FC<{ redirectCount: number | null; onApply: (title: string) => void; lang?: string }> = ({ redirectCount, onApply, lang = 'ru' }) => {
  const ru = lang === 'ru';
  const list = [
    {
      title: 'Главный аналитик департамента кредитования',
      titleKz: 'Несиелеу департаментінің бас талдаушысы',
      org: 'Банк Развития Казахстана',
      salary: 'от 450 000 ₸',
      experience: ru ? '3-6 лет' : '3-6 жыл',
      type: ru ? 'Полная занятость' : 'Толық жұмыс уақыты',
      city: 'Астана',
      url: 'https://hh.kz/search/vacancy?text=%D0%91%D0%B0%D0%BD%D0%BA+%D0%A0%D0%B0%D0%B7%D0%B2%D0%B8%D1%82%D0%B8%D1%8F+%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD%D0%B0&area=160',
    },
    {
      title: 'Старший менеджер Департамента субсидирования',
      titleKz: 'Субсидиялау департаментінің аға менеджері',
      org: 'Даму',
      salary: 'от 380 000 ₸',
      experience: ru ? '1-3 года' : '1-3 жыл',
      type: ru ? 'Полная занятость' : 'Толық жұмыс уақыты',
      city: 'Алматы',
      url: 'https://hh.kz/search/vacancy?text=%D0%94%D0%B0%D0%BC%D1%83&area=160',
    },
    {
      title: 'Юрисконсульт по сопровождению лизинговых сделок',
      titleKz: 'Лизингтік мәмілелерді сүйемелдеу жөніндегі заңгер',
      org: 'БРК Лизинг',
      salary: ru ? 'По договорённости' : 'Келісім бойынша',
      experience: ru ? 'более 5 лет' : '5 жылдан астам',
      type: ru ? 'Полная занятость' : 'Толық жұмыс уақыты',
      city: 'Астана',
      url: 'https://hh.kz/search/vacancy?text=%D0%BB%D0%B8%D0%B7%D0%B8%D0%BD%D0%B3+%D1%8E%D1%80%D0%B8%D1%81%D1%82&area=160',
    },
    {
      title: 'Главный специалист Департамента информационных технологий',
      titleKz: 'Ақпараттық технологиялар департаментінің бас маманы',
      org: 'Холдинг «Байтерек»',
      salary: 'от 550 000 ₸',
      experience: ru ? '3-6 лет' : '3-6 жыл',
      type: ru ? 'Полная занятость' : 'Толық жұмыс уақыты',
      city: 'Астана',
      url: 'https://hh.kz/search/vacancy?text=%D0%91%D0%B0%D0%B9%D1%82%D0%B5%D1%80%D0%B5%D0%BA+IT&area=160',
    },
    {
      title: 'Риск-менеджер (кредитный портфель)',
      titleKz: 'Тәуекел-менеджер (несиелік портфель)',
      org: 'Банк Развития Казахстана',
      salary: 'от 500 000 ₸',
      experience: ru ? '3-6 лет' : '3-6 жыл',
      type: ru ? 'Полная занятость' : 'Толық жұмыс уақыты',
      city: 'Астана',
      url: 'https://hh.kz/search/vacancy?text=%D1%80%D0%B8%D1%81%D0%BA+%D0%BC%D0%B5%D0%BD%D0%B5%D0%B4%D0%B6%D0%B5%D1%80+%D0%B1%D0%B0%D0%BD%D0%BA&area=160',
    },
    {
      title: 'Специалист по работе с клиентами МСБ',
      titleKz: 'ШОБ клиенттерімен жұмыс жөніндегі маман',
      org: 'Даму',
      salary: 'от 280 000 ₸',
      experience: ru ? '1-3 года' : '1-3 жыл',
      type: ru ? 'Полная занятость' : 'Толық жұмыс уақыты',
      city: 'Алматы / Астана',
      url: 'https://hh.kz/search/vacancy?text=%D0%94%D0%B0%D0%BC%D1%83+%D0%9C%D0%A1%D0%91&area=160',
    },
  ];

  const orgColors: Record<string, string> = {
    'БРК': '#0f3460', 'Банк Развития': '#0f3460',
    'Даму': '#065f46', 'Лизинг': '#312e81',
    'Байтерек': '#1A3D8F',
  };
  const getOrgColor = (org: string) =>
    Object.keys(orgColors).find(k => org.includes(k)) ? orgColors[Object.keys(orgColors).find(k => org.includes(k))!] : '#1e293b';

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="service-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1A3D8F 100%)' }}>
        <h1 className="service-hero-title">{ru ? 'Карьера в группе компаний Байтерек' : 'Байтерек компаниялар тобында мансап'}</h1>
        <p className="service-hero-desc">{ru ? 'Присоединяйтесь к команде профессионалов, создающих будущее финансовой экосистемы Казахстана.' : 'Қазақстанның қаржылық экожүйесінің болашағын қалыптастыратын мамандар командасына қосылыңыз.'}</p>
        <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { val: list.length.toString(), label: ru ? 'открытых вакансий' : 'ашық бос орын' },
            { val: '6', label: ru ? 'организаций' : 'ұйым' },
            { val: ru ? 'Астана / Алматы' : 'Астана / Алматы', label: ru ? 'города' : 'қалалар' },
          ].map(f => (
            <div key={f.val} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 20px' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{f.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '24px auto', padding: '0 20px' }}>
        {redirectCount !== null && (
          <div className="autofill-banner" style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', marginBottom: 20 }}>
            <span>⚠️</span>
            <div>
              <strong>{ru ? 'Перенаправление на hh.kz' : 'hh.kz сайтына бағыттау'}</strong>
              <div style={{ fontSize: 11, marginTop: 4 }}>{ru ? `Автоматически через: ${redirectCount} сек.` : `Автоматты түрде: ${redirectCount} сек.`}</div>
            </div>
          </div>
        )}

        <h3 style={{ marginBottom: 16, fontSize: 17 }}>
          {ru ? `Актуальные вакансии (${list.length})` : `Өзекті бос орындар (${list.length})`}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map(v => (
            <div
              key={v.title}
              style={{
                borderRadius: 14, border: '1px solid var(--border)',
                background: 'var(--white)', overflow: 'hidden',
                display: 'flex', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {/* Org color strip */}
              <div style={{ width: 5, background: getOrgColor(v.org), flexShrink: 0 }} />
              <div style={{ padding: '16px 20px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: '#EFF6FF', color: getOrgColor(v.org), padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{v.org}</span>
                    <span style={{ background: '#F0FDF4', color: '#166534', padding: '2px 9px', borderRadius: 20, fontSize: 11 }}>📍 {v.city}</span>
                    <span style={{ background: '#F5F3FF', color: '#5b21b6', padding: '2px 9px', borderRadius: 20, fontSize: 11 }}>{v.type}</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35 }}>
                    {ru ? v.title : v.titleKz}
                  </h4>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    💼 {ru ? 'Опыт' : 'Тәжірибе'}: <strong>{v.experience}</strong>
                    &nbsp;·&nbsp;
                    💰 <strong style={{ color: '#166534' }}>{v.salary}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '9px 18px', borderRadius: 10,
                      background: 'linear-gradient(135deg,#1A3D8F,#2d5bbf)',
                      color: '#fff', fontWeight: 600, fontSize: 13,
                      textDecoration: 'none', whiteSpace: 'nowrap',
                      display: 'inline-block',
                    }}
                  >
                    {ru ? 'Откликнуться →' : 'Жауап беру →'}
                  </a>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>hh.kz</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, padding: '18px 20px', borderRadius: 12, background: '#F0F9FF', border: '1px solid #BAE6FD', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 28 }}>🔔</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{ru ? 'Не нашли подходящую вакансию?' : 'Сәйкес бос орын таппадыңыз ба?'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{ru ? 'Все актуальные вакансии холдинга размещены на ' : 'Холдингтің барлық өзекті бос орындары '}<a href="https://hh.kz/employer/3927?hhtmFrom=vacancy_search_list" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>hh.kz</a>{ru ? ' и ' : ' және '}<a href="https://qyzmet.gov.kz" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>qyzmet.gov.kz</a>{ru ? '.' : ' сайттарында орналастырылған.'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- ABOUT PAGE (Корпоративный раздел Холдинга) ----
const AboutPage: React.FC<{
  lang: string;
  onSelectOrg: (org: typeof ORGANIZATIONS[0]) => void;
}> = ({ lang, onSelectOrg }) => {
  const ru = lang === 'ru';

  const leadership = [
    { name: 'Дошаев Нуржан Избасарович', role: ru ? 'Председатель Правления Холдинга «Байтерек»' : '«Байтерек» Холдингінің Басқарма Төрағасы', since: ru ? 'с 2022 года' : '2022 жылдан' },
    { name: 'Кайыпов Бауыржан Ерланович', role: ru ? 'Заместитель Председателя Правления' : 'Басқарма Төрағасының орынбасары', since: ru ? 'с 2021 года' : '2021 жылдан' },
    { name: 'Ибраева Динара Кайратовна', role: ru ? 'Главный финансовый директор' : 'Бас қаржы директоры', since: ru ? 'с 2020 года' : '2020 жылдан' },
    { name: 'Сатаев Серик Болатович', role: ru ? 'Директор по стратегии и развитию' : 'Стратегия және даму директоры', since: ru ? 'с 2023 года' : '2023 жылдан' },
  ];

  const docs = [
    { title: ru ? 'Стратегия развития Холдинга «Байтерек» 2023–2030' : '«Байтерек» Холдингінің 2023–2030 жж. даму стратегиясы', type: 'PDF', year: 2023 },
    { title: ru ? 'Годовой отчёт Холдинга за 2024 год' : 'Холдингтің 2024 жылғы жылдық есебі', type: 'PDF', year: 2024 },
    { title: ru ? 'Кодекс корпоративного управления' : 'Корпоративтік басқару кодексі', type: 'PDF', year: 2022 },
    { title: ru ? 'Политика устойчивого развития (ESG)' : 'Тұрақты даму саясаты (ESG)', type: 'PDF', year: 2023 },
    { title: ru ? 'Дивидендная политика Холдинга' : 'Холдингтің дивидендтік саясаты', type: 'PDF', year: 2022 },
  ];

  const facts = [
    { val: '6', label: ru ? 'дочерних организаций' : 'еншілес ұйым' },
    { val: '30+', label: ru ? 'лет на рынке' : 'жыл нарықта' },
    { val: '₸12 трлн', label: ru ? 'активы под управлением' : 'басқарудағы активтер' },
    { val: '500+', label: ru ? 'проектов профинансировано' : 'жоба қаржыландырылды' },
  ];

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Hero */}
      <div className="service-hero" style={{ background: 'linear-gradient(135deg, var(--bt-navy-900) 0%, var(--bt-navy-700) 100%)', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span className="bt-badge badge-gold">{ru ? 'О Холдинге' : 'Холдинг туралы'}</span>
        </div>
        <h1 className="service-hero-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', marginBottom: 16 }}>
          {ru ? 'Холдинг «Байтерек»' : '«Байтерек» Холдингі'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1.05rem', maxWidth: 680, lineHeight: 1.7, marginBottom: 32 }}>
          {ru
            ? 'Национальный управляющий холдинг в сфере поддержки предпринимательства, промышленности, агропромышленного комплекса и финансового рынка Республики Казахстан.'
            : 'Қазақстан Республикасының кәсіпкерлікті, өнеркәсіпті, агроөнеркәсіптік кешені мен қаржы нарығын қолдау саласындағы ұлттық басқарушы холдинг.'}
        </p>

        {/* Key facts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, maxWidth: 700 }}>
          {facts.map(f => (
            <div key={f.val} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--bt-gold-400)', letterSpacing: '-0.02em' }}>{f.val}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

        {/* Mission & Vision */}
        <section style={{ paddingTop: 52 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="bt-card" style={{ borderTop: '3px solid var(--bt-gold-500)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bt-gold-700)', marginBottom: 10 }}>
                {ru ? 'Миссия' : 'Миссия'}
              </div>
              <p style={{ color: 'var(--ink-700)', lineHeight: 1.75, margin: 0 }}>
                {ru
                  ? 'Обеспечение устойчивого экономического роста Казахстана через финансовую и нефинансовую поддержку предпринимательства, привлечение инвестиций и развитие человеческого капитала.'
                  : 'Кәсіпкерлікті қаржылық және қаржылық емес қолдау, инвестицияларды тарту және адами капиталды дамыту арқылы Қазақстанның тұрақты экономикалық өсуін қамтамасыз ету.'}
              </p>
            </div>
            <div className="bt-card" style={{ borderTop: '3px solid var(--bt-navy-700)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bt-navy-700)', marginBottom: 10 }}>
                {ru ? 'Стратегическое видение' : 'Стратегиялық көзқарас'}
              </div>
              <p style={{ color: 'var(--ink-700)', lineHeight: 1.75, margin: 0 }}>
                {ru
                  ? 'К 2030 году стать ведущим центром компетенций в области государственного финансирования развития в Центральной Азии, обеспечивая инновационные инструменты поддержки бизнеса.'
                  : '2030 жылға қарай Орталық Азиядағы мемлекеттік даму қаржыландыруы саласындағы жетекші құзыреттілік орталығына айналу, бизнесті қолдаудың инновациялық құралдарын қамтамасыз ету.'}
              </p>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section style={{ paddingTop: 52 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--bt-navy-900)', marginBottom: 24 }}>
            {ru ? 'Руководство Холдинга' : 'Холдинг басшылығы'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {leadership.map((l, i) => (
              <div key={i} className="bt-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--bt-navy-800), var(--bt-navy-500))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '1.1rem'
                }}>
                  {l.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-900)', marginBottom: 4 }}>{l.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)', lineHeight: 1.5, marginBottom: 6 }}>{l.role}</div>
                  <span className="bt-badge badge-navy" style={{ fontSize: '0.7rem' }}>{l.since}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Organizational structure */}
        <section style={{ paddingTop: 52 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--bt-navy-900)', marginBottom: 24 }}>
            {ru ? 'Структура группы компаний' : 'Компаниялар тобының құрылымы'}
          </h2>
          {/* Structure diagram */}
          <div style={{ background: 'var(--bt-navy-900)', borderRadius: 16, padding: 32, marginBottom: 24 }}>
            {/* Holding node */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ background: 'var(--bt-gold-500)', color: 'var(--bt-navy-900)', fontWeight: 800, padding: '14px 36px', borderRadius: 12, fontSize: '1rem', textAlign: 'center' }}>
                {ru ? 'Холдинг «Байтерек»' : '«Байтерек» Холдингі'}
                <div style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, marginTop: 2 }}>{ru ? 'Единственный акционер — Правительство РК' : 'Жалғыз акционер — ҚР Үкіметі'}</div>
              </div>
            </div>
            {/* Connector line */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 2, height: 24, background: 'rgba(255,255,255,0.3)' }} />
            </div>
            {/* Subsidiaries */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {ORGANIZATIONS.map(o => (
                <button key={o.abbr} onClick={() => onSelectOrg(o)} style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                >
                  <div style={{ fontWeight: 700, color: 'var(--bt-gold-400)', fontSize: '0.9rem', marginBottom: 4 }}>{o.abbr}</div>
                  <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.75rem', lineHeight: 1.4 }}>{ru ? o.name : o.nameKz}</div>
                </button>
              ))}
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-500)', textAlign: 'center' }}>
            {ru ? '* Нажмите на карточку организации для просмотра подробной информации' : '* Толық ақпарат үшін ұйымның картасын басыңыз'}
          </p>
        </section>

        {/* Strategic documents */}
        <section style={{ paddingTop: 52 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--bt-navy-900)', marginBottom: 24 }}>
            {ru ? 'Стратегические документы' : 'Стратегиялық құжаттар'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {docs.map((d, i) => (
              <div key={i} className="bt-card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                onClick={() => alert(ru ? 'Документ временно недоступен для скачивания' : 'Құжат уақытша жүктеу үшін қол жетімді емес')}
              >
                <div style={{
                  width: 44, height: 44, background: 'var(--bt-navy-100)', borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bt-navy-700)', fontWeight: 700, fontSize: '0.7rem'
                }}>{d.type}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink-900)', fontSize: '0.95rem' }}>{d.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)', marginTop: 2 }}>{d.year} {ru ? 'год' : 'жыл'}</div>
                </div>
                <div style={{ color: 'var(--bt-navy-500)', fontSize: '1.1rem' }}>↓</div>
              </div>
            ))}
          </div>
        </section>

        {/* Contacts */}
        <section style={{ paddingTop: 52 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--bt-navy-900)', marginBottom: 24 }}>
            {ru ? 'Контактные данные Холдинга' : 'Холдингтің байланыс деректері'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: '📍', label: ru ? 'Юридический адрес' : 'Заңды мекенжай', val: 'г. Астана, пр. Мангилик Ел, 55/20, Z05T3D0' },
              { icon: '📞', label: ru ? 'Телефон приёмной' : 'Қабылдаухана телефоны', val: '+7 (7172) 79-57-97' },
              { icon: '📧', label: ru ? 'Электронная почта' : 'Электрондық пошта', val: 'info@baiterek.kz' },
              { icon: '🌐', label: ru ? 'Официальный сайт' : 'Ресми сайт', val: 'www.baiterek.kz' },
            ].map((c, i) => (
              <div key={i} className="bt-card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-400)', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink-900)', fontSize: '0.95rem' }}>{c.val}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

// ---- ADMIN PANEL ----
type AdminTab = 'dashboard' | 'constructor' | 'services' | 'applications' | 'users' | 'content' | 'news' | 'logs';

const AdminPanel: React.FC<{
  hdrRight: React.ReactNode;
  apps: AppRecord[];
  stats: any;
  user: User | null;
  news: any[];
  articles: any[];
  auditLogs: any[];
  lang: string;
  token: string;
  onRefreshApps: () => void;
  onRefreshNews: () => void;
  onRefreshArticles: () => void;
  onRefreshLogs: () => void;
}> = ({ hdrRight, apps, stats, user, news, articles, auditLogs, lang, token, onRefreshApps, onRefreshNews, onRefreshArticles, onRefreshLogs }) => {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const navItems: { tab: AdminTab; label: string; icon: string; section?: string }[] = [
    { tab: 'dashboard', label: 'Дашборд', icon: '◈', section: 'Обзор' },
    { tab: 'constructor', label: 'Конструктор форм', icon: '⊞', section: 'Услуги' },
    { tab: 'services', label: 'Список услуг', icon: '☰' },
    { tab: 'applications', label: 'Заявки', icon: '◫', section: 'Заявки' },
    { tab: 'users', label: 'Пользователи', icon: '⊙', section: 'Система' },
    { tab: 'content', label: 'Управление FAQ', icon: '✎', section: 'Контент' },
    { tab: 'news', label: 'Управление новостями', icon: '◉' },
    { tab: 'logs', label: 'Журнал аудита', icon: '≡' },
  ];

  return (
    <div className="app-layout" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div className="header-left">
          <div className="logo"><div className="logo-mark">Б</div><div><div className="logo-name">Байтерек</div><div className="logo-sub">Панель администратора</div></div></div>
        </div>
        <div className="header-right">{hdrRight}</div>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <nav className="admin-sidebar" style={{ overflowY: 'auto' }}>
          {navItems.map((item) => (
            <React.Fragment key={item.tab}>
              {item.section && <div className="admin-nav-section">{item.section}</div>}
              <button className={`admin-nav-item ${tab === item.tab ? 'active' : ''}`} onClick={() => setTab(item.tab)}>
                <span style={{ width: 20, textAlign: 'center' }}>{item.icon}</span>{item.label}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="admin-main" style={{ overflowY: 'auto', flex: 1 }}>
          {tab === 'dashboard' && <AdminDashboard apps={apps} stats={stats} user={user} logs={auditLogs} />}
          {tab === 'constructor' && <AdminConstructor />}
          {tab === 'services' && <AdminServices />}
          {tab === 'applications' && <AdminApplications apps={apps} user={user} token={token} onRefresh={onRefreshApps} />}
          {tab === 'users' && <AdminUsers user={user} token={token} />}
          {tab === 'content' && <AdminContentManager articles={articles} user={user} token={token} onRefresh={onRefreshArticles} />}
          {tab === 'news' && <AdminNewsManager news={news} user={user} token={token} onRefresh={onRefreshNews} />}
          {tab === 'logs' && <AdminAuditLogs logs={auditLogs} />}
        </div>
      </div>
    </div>
  );
};

// ---- SVG BAR CHART (no dependencies) ----
const SvgBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
  height?: number;
}> = ({ data, title, height = 160 }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.floor(280 / data.length) - 8;
  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{title}</div>
      <svg width="100%" viewBox={`0 0 280 ${height + 30}`} style={{ overflow: 'visible' }}>
        {data.map((d, i) => {
          const barH = maxVal > 0 ? Math.round((d.value / maxVal) * height) : 0;
          const x = i * (280 / data.length) + 4;
          const y = height - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={Math.max(barH, 2)} rx="4" fill={d.color} opacity="0.9" />
              {barH > 16 && (
                <text x={x + barWidth / 2} y={y + barH / 2 + 5} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">{d.value}</text>
              )}
              {barH <= 16 && d.value > 0 && (
                <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="11" fill={d.color} fontWeight="700">{d.value}</text>
              )}
              <text x={x + barWidth / 2} y={height + 18} textAnchor="middle" fontSize="9" fill="var(--ink-400)">{d.label}</text>
            </g>
          );
        })}
        <line x1="0" y1={height} x2="280" y2={height} stroke="var(--border)" strokeWidth="1" />
      </svg>
    </div>
  );
};

// ---- SVG DONUT CHART ----
const SvgDonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
}> = ({ data, title }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumAngle = -Math.PI / 2;
  const r = 52, cx = 70, cy = 60;
  const segments = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...d, angle, x1, y1, x2, y2, large };
  });
  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width="140" height="120" viewBox="0 0 140 120">
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="18" />
          ) : (
            segments.filter(s => s.value > 0).map((s, i) => (
              <path key={i}
                d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2} Z`}
                fill={s.color} opacity="0.9"
              />
            ))
          )}
          <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--ink-900)">{total}</text>
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize="8" fill="var(--ink-400)">всего</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--ink-600)' }}>{d.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--ink-900)', marginLeft: 'auto' }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- ADMIN DASHBOARD ----
const AdminDashboard: React.FC<{ apps: AppRecord[]; stats: any; user: User | null; logs: any[] }> = ({ apps, stats, user, logs }) => {

  // Compute status breakdown from apps
  const statusData = [
    { label: 'На рассм.', value: apps.filter(a => a.status === 'submitted').length, color: '#3b82f6' },
    { label: 'В работе', value: apps.filter(a => a.status === 'in_review').length, color: '#f59e0b' },
    { label: 'Доп. документы', value: apps.filter(a => a.status === 'additional_docs_required').length, color: '#f97316' },
    { label: 'Одобрено', value: apps.filter(a => a.status === 'approved').length, color: '#16a34a' },
    { label: 'Отклонено', value: apps.filter(a => a.status === 'rejected').length, color: '#ef4444' },
  ];

  // Compute apps by service
  const svcMap: Record<string, number> = {};
  apps.forEach(a => { svcMap[a.title] = (svcMap[a.title] || 0) + 1; });
  const svcData = Object.entries(svcMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, value], i) => ({
      label: label.length > 14 ? label.slice(0, 14) + '…' : label,
      value,
      color: ['#1A3D8F', '#C9A227', '#16a34a', '#f59e0b'][i]
    }));

  const donutData = [
    { label: 'Одобрено', value: apps.filter(a => a.status === 'approved').length, color: '#16a34a' },
    { label: 'На рассмотрении', value: apps.filter(a => a.status === 'submitted').length, color: '#3b82f6' },
    { label: 'Отклонено', value: apps.filter(a => a.status === 'rejected').length, color: '#ef4444' },
    { label: 'Прочее', value: apps.filter(a => !['approved','submitted','rejected'].includes(a.status)).length, color: '#94a3b8' },
  ];

  // Export CSV Helper
  const downloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,﻿ID,Услуга,Заявитель,Статус,Дата\n';
    apps.forEach(a => {
      csvContent += `"${a.id}","${a.title}","${a.userName}","${a.status}","${a.date}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Baiterek_Analytics_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const approvalRate = apps.length > 0
    ? Math.round((apps.filter(a => a.status === 'approved').length / apps.length) * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="admin-page-title" style={{ marginBottom: 0 }}>Аналитический дашборд</div>
        <button className="btn btn-sm btn-primary" onClick={downloadCSV}>📥 Экспорт в CSV</button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Всего заявок</div>
          <div className="stat-card-value" style={{ color: '#3b82f6' }}>{stats.applications}</div>
          <div className="stat-card-sub">сохранено в SQLite</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Одобрено</div>
          <div className="stat-card-value" style={{ color: '#16a34a' }}>{apps.filter(a => a.status === 'approved').length}</div>
          <div className="stat-card-sub" style={{ color: '#16a34a' }}>конверсия {approvalRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Пользователей</div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>{stats.users}</div>
          <div className="stat-card-sub">в базе данных</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Услуг в системе</div>
          <div className="stat-card-value" style={{ color: '#1A3D8F' }}>{SERVICES.length}</div>
          <div className="stat-card-sub">no-code конструктор</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '20px 0' }}>
        <SvgBarChart
          title="Заявки по статусам"
          data={statusData}
          height={140}
        />
        <SvgDonutChart
          title="Распределение решений"
          data={donutData}
        />
      </div>

      {/* Services chart */}
      {svcData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SvgBarChart
            title="Популярность услуг (топ-4)"
            data={svcData}
            height={100}
          />
        </div>
      )}

      {/* Security badge */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: '🔐 JWT авторизация', color: '#16a34a' },
          { label: '📁 Реальная загрузка файлов', color: '#1A3D8F' },
          { label: '🔄 Bitrix24 CRM ● Active', color: '#C9A227' },
          { label: '🛡 Журнал аудита', color: '#64748b' },
        ].map(b => (
          <span key={b.label} style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 8, background: b.color + '15', color: b.color, fontWeight: 600, border: `1px solid ${b.color}30` }}>{b.label}</span>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-header"><div className="table-title">Последние действия в журнале аудита</div></div>
        <table className="data-table">
          <thead><tr><th>Пользователь</th><th>Действие</th><th>Объект</th><th>Время</th></tr></thead>
          <tbody>
            {logs.slice(0, 8).map(l => (
              <tr key={l.Id}>
                <td><strong>{l.UserName || 'Система'}</strong></td>
                <td><span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>{l.Action}</span></td>
                <td style={{ color: 'var(--ink-500)', fontSize: '0.8rem' }}>{l.EntityType} #{l.EntityId}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--ink-400)' }}>{new Date(l.CreatedAt).toLocaleString('ru-KZ')}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-400)', padding: 20 }}>Действий ещё не зафиксировано</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminServices: React.FC = () => (
  <div>
    <div className="admin-page-title">Реестр мер поддержки</div>
    <div className="table-wrap">
      <div className="table-header"><div className="table-title">Каталог no-code услуг</div><button className="btn btn-xs btn-primary">+ Добавить услугу</button></div>
      <table className="data-table">
        <thead><tr><th>Название</th><th>Ведомство / Организация</th><th>Категория</th><th>Статус</th></tr></thead>
        <tbody>
          {SERVICES.map((s, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 500 }}>{s.title}</td>
              <td>{s.org}</td>
              <td><span className="badge badge-blue">{{ leasing: 'Лизинг', subsidy: 'Субсидии', credit: 'Кредиты', guarantee: 'Гарантии' }[s.cat] || s.cat}</span></td>
              <td><span className="badge badge-green">Активна</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ---- ADMIN APPLICATIONS MANAGEMENT ----
const AdminApplications: React.FC<{ apps: AppRecord[]; user: User | null; token: string; onRefresh: () => void }> = ({ apps, user, token, onRefresh }) => {
  const [selectedApp, setSelectedApp] = useState<AppRecord | null>(null);
  const [statusVal, setStatusVal] = useState('');
  const [commentVal, setCommentVal] = useState('');

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      const authH = getAuthHeaders(token);
      const res = await fetch(`http://localhost:3001/api/applications/${selectedApp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({
          status: statusVal,
          userId: user?.id || 1
        })
      });

      if (res.ok) {
        if (commentVal.trim() !== '') {
          await fetch(`http://localhost:3001/api/applications/${selectedApp.id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authH },
            body: JSON.stringify({
              userId: user?.id || 1,
              userName: 'Куратор холдинга',
              message: commentVal
            })
          });
        }
        alert('Статус заявки успешно изменен и синхронизирован с ЕИШ и Bitrix CRM!');
        setSelectedApp(null);
        setCommentVal('');
        onRefresh();
      }
    } catch(e) {
      console.log('Error status change:', e);
    }
  };

  return (
    <div>
      <div className="admin-page-title">Обращения предпринимателей</div>

      {selectedApp ? (
        <div className="detail-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <button className="btn btn-sm" onClick={() => setSelectedApp(null)}>← Закрыть детальный просмотр</button>
            <span>Заявка ID: <strong>{selectedApp.id}</strong></span>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{selectedApp.title}</h2>
          <p>Заявитель: <strong>{selectedApp.userName}</strong> (ИИН: {selectedApp.userIin})</p>

          <form onSubmit={handleStatusChange} style={{ margin: '20px 0', padding: 20, background: '#f8fafc', borderRadius: 12 }}>
            <h3>Изменить статус и маршрут заявки</h3>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">Новый статус</label>
              <select className="form-control" value={statusVal} onChange={e => setStatusVal(e.target.value)} required>
                <option value="">— Выбрать статус —</option>
                <option value="submitted">На рассмотрении</option>
                <option value="in_review">В процессе обработки в CRM</option>
                <option value="additional_docs_required">Запросить дополнительные документы (ошибка в файлах)</option>
                <option value="approved">Одобрить (Финальное решение)</option>
                <option value="rejected">Отклонить (Отказ финансирования)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Комментарий для предпринимателя</label>
              <textarea className="form-control" rows={3} placeholder="Причина отказа или перечень необходимых документов..." value={commentVal} onChange={e => setCommentVal(e.target.value)} />
            </div>

            <button className="btn btn-primary" type="submit">💾 Сохранить новый статус</button>
          </form>

          <div>
            <h3>Отправленные данные формы (JSON)</h3>
            <pre style={{ background: '#0f172a', color: '#38bdf8', padding: 14, borderRadius: 8, overflowX: 'auto', fontSize: 11, marginTop: 10 }}>
              {JSON.stringify(selectedApp.formData, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Номер</th><th>Выбранная услуга</th><th>Заявитель</th><th>Статус рассмотрения</th><th>Дата подачи</th><th>Управление</th></tr></thead>
            <tbody>
              {apps.length ? apps.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.id}</td>
                  <td>{a.title}</td>
                  <td>{a.userName}</td>
                  <td>
                    {a.status === 'submitted' && <span className="badge badge-blue">На рассмотрении</span>}
                    {a.status === 'in_review' && <span className="badge badge-amber">В обработке</span>}
                    {a.status === 'additional_docs_required' && <span className="badge badge-red">Доп. документы</span>}
                    {a.status === 'approved' && <span className="badge badge-green">Одобрено</span>}
                    {a.status === 'rejected' && <span className="badge badge-red">Отклонено</span>}
                  </td>
                  <td>{a.date}</td>
                  <td>
                    <button className="btn btn-xs btn-primary" onClick={() => {
                      setSelectedApp(a);
                      setStatusVal(a.status);
                    }}>Просмотр</button>
                  </td>
                </tr>
              )) : <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Заявок не обнаружено</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AdminUsers: React.FC<{ user: User | null; token: string }> = ({ user, token }) => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/users', {
          headers: getAuthHeaders(token)
        });
        if (res.ok) setUsers(await res.json());
      } catch (e) {
        console.log('Error users list:', e);
      }
    };
    fetchUsers();
  }, [user, token]);

  return (
    <div>
      <div className="admin-page-title">Реестр пользователей системы</div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>ФИО / Логин</th><th>ИИН</th><th>Компания</th><th>Должность</th><th>Роль</th></tr></thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 500 }}>admin@baiterek.kz</td>
              <td>—</td>
              <td>АО Холдинг Байтерек</td>
              <td>Администратор системы</td>
              <td><span className="badge badge-red">Администратор</span></td>
            </tr>
            {users.map((u: any) => (
              <tr key={u.Id}>
                <td style={{ fontWeight: 500 }}>{u.FullName}</td>
                <td style={{ fontFamily: 'monospace' }}>{u.IIN}</td>
                <td>{u.CompanyName || '—'}</td>
                <td>{u.Position || '—'}</td>
                <td>
                  <span className={`badge ${u.Role === 'admin' ? 'badge-red' : 'badge-blue'}`}>
                    {u.Role === 'admin' ? 'Администратор' : 'Предприниматель'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---- CONTENT MANAGER CMS (FAQ) ----
const AdminContentManager: React.FC<{ articles: any[]; user: User | null; token: string; onRefresh: () => void }> = ({ articles, user, token, onRefresh }) => {
  const [title, setTitle] = useState('');
  const [titleKz, setTitleKz] = useState('');
  const [category, setCategory] = useState('Инструкции');
  const [categoryKz, setCategoryKz] = useState('Нұсқаулықтар');
  const [content, setContent] = useState('');
  const [contentKz, setContentKz] = useState('');

  const submitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/articles', {
        method: 'POST',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify({
          title, titleKz, category, categoryKz, content, contentKz, userId: user?.id || 1
        })
      });
      if (res.ok) {
        alert('Статья базы знаний успешно опубликована!');
        setTitle(''); setTitleKz('');
        setContent(''); setContentKz('');
        onRefresh();
      }
    } catch(e) {
      console.log('Error creating faq:', e);
    }
  };

  const deleteArticle = async (id: number) => {
    if (!window.confirm('Удалить эту статью?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/articles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });
      if (res.ok) onRefresh();
    } catch(e) {
      console.log('Error deleting article:', e);
    }
  };

  return (
    <div>
      <div className="admin-page-title">Управление базой знаний (FAQ)</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="detail-card">
          <h3>Добавить статью</h3>
          <form onSubmit={submitArticle} style={{ marginTop: 14 }}>
            <div className="form-group"><label className="form-label">Заголовок (RU) *</label>
              <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Заголовок (KZ) *</label>
              <input className="form-control" value={titleKz} onChange={e => setTitleKz(e.target.value)} required /></div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}><label className="form-label">Категория (RU)</label>
                <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Инструкции">Инструкции</option><option value="FAQ">FAQ</option><option value="Условия получения">Условия получения</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}><label className="form-label">Категория (KZ)</label>
                <select className="form-control" value={categoryKz} onChange={e => setCategoryKz(e.target.value)}>
                  <option value="Нұсқаулықтар">Нұсқаулықтар</option><option value="Жиі қойылатын сұрақтар">Жиі қойылатын сұрақтар</option><option value="Алу шарттары">Алу шарттары</option>
                </select>
              </div>
            </div>

            <div className="form-group"><label className="form-label">Содержимое статьи (RU) *</label>
              <textarea className="form-control" rows={4} value={content} onChange={e => setContent(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Содержимое статьи (KZ) *</label>
              <textarea className="form-control" rows={4} value={contentKz} onChange={e => setContentKz(e.target.value)} required /></div>
            
            <button className="btn btn-primary" type="submit">Опубликовать</button>
          </form>
        </div>

        <div>
          <h3>Список опубликованных FAQ ({articles.length})</h3>
          <div className="news-list" style={{ marginTop: 14 }}>
            {articles.map(a => (
              <div key={a.Id} className="news-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-blue">{a.Category}</span>
                  <h4 style={{ fontSize: 13, marginTop: 4 }}>{a.Title}</h4>
                </div>
                <button className="btn btn-xs btn-danger" onClick={() => deleteArticle(a.Id)}>Удалить</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- NEWS MANAGER CMS ----
const AdminNewsManager: React.FC<{ news: any[]; user: User | null; token: string; onRefresh: () => void }> = ({ news, user, token, onRefresh }) => {
  const [title, setTitle] = useState('');
  const [titleKz, setTitleKz] = useState('');
  const [org, setOrg] = useState('Холдинг «Байтерек»');
  const [content, setContent] = useState('');
  const [contentKz, setContentKz] = useState('');

  const submitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/news', {
        method: 'POST',
        headers: getJsonAuthHeaders(token),
        body: JSON.stringify({
          title, titleKz, content, contentKz, organization: org, userId: user?.id || 1
        })
      });
      if (res.ok) {
        alert('Новость успешно опубликована в ленту!');
        setTitle(''); setTitleKz('');
        setContent(''); setContentKz('');
        onRefresh();
      }
    } catch(e) {
      console.log('Error creating news:', e);
    }
  };

  const deleteNews = async (id: number) => {
    if (!window.confirm('Удалить эту новость?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/news/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });
      if (res.ok) onRefresh();
    } catch(e) {
      console.log('Error deleting news:', e);
    }
  };

  return (
    <div>
      <div className="admin-page-title">Управление новостной лентой</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="detail-card">
          <h3>Опубликовать новость</h3>
          <form onSubmit={submitNews} style={{ marginTop: 14 }}>
            <div className="form-group"><label className="form-label">Заголовок новости (RU) *</label>
              <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Заголовок новости (KZ) *</label>
              <input className="form-control" value={titleKz} onChange={e => setTitleKz(e.target.value)} required /></div>
            
            <div className="form-group"><label className="form-label">Организация-автор</label>
              <select className="form-control" value={org} onChange={e => setOrg(e.target.value)}>
                <option value="Холдинг «Байтерек»">Холдинг «Байтерек»</option>
                {ORGANIZATIONS.map(o => <option key={o.abbr} value={o.name}>{o.name}</option>)}
              </select>
            </div>

            <div className="form-group"><label className="form-label">Текст новости (RU) *</label>
              <textarea className="form-control" rows={5} value={content} onChange={e => setContent(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Текст новости (KZ) *</label>
              <textarea className="form-control" rows={5} value={contentKz} onChange={e => setContentKz(e.target.value)} required /></div>
            
            <button className="btn btn-primary" type="submit">Опубликовать в ленту</button>
          </form>
        </div>

        <div>
          <h3>Список опубликованных новостей ({news.length})</h3>
          <div className="news-list" style={{ marginTop: 14 }}>
            {news.map(n => (
              <div key={n.Id} className="news-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-amber">{n.Organization}</span>
                  <h4 style={{ fontSize: 13, marginTop: 4 }}>{n.Title}</h4>
                </div>
                <button className="btn btn-xs btn-danger" onClick={() => deleteNews(n.Id)}>Удалить</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- ADMIN AUDIT LOGS ----
const AdminAuditLogs: React.FC<{ logs: any[] }> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState('');

  const filtered = logs.filter(l => l.Action.toLowerCase().includes(filterAction.toLowerCase()));

  return (
    <div>
      <div className="admin-page-title">Журнал системных действий пользователей (Audit Logs)</div>
      
      <div className="catalog-search-wrap" style={{ maxWidth: 400, marginBottom: 14 }}>
        <span className="catalog-search-icon">🔍</span>
        <input className="catalog-search" placeholder="Фильтр по коду действия (например, CREATE)..." value={filterAction} onChange={e => setFilterAction(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Пользователь</th><th>Действие</th><th>Тип сущности</th><th>ID сущности</th><th>Дата и время действия</th></tr></thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.Id}>
                <td><strong>{l.UserName || 'Система'}</strong></td>
                <td><span className="badge badge-amber">{l.Action}</span></td>
                <td>{l.EntityType}</td>
                <td style={{ fontFamily: 'monospace' }}>{l.EntityId}</td>
                <td>{new Date(l.CreatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---- CONSTRUCTOR ----
const FTYPES = [
  { t: 'text', i: 'T', l: 'Текст' }, { t: 'number', i: '#', l: 'Число' }, { t: 'currency', i: '₸', l: 'Сумма' },
  { t: 'iin_bin', i: 'ID', l: 'ИИН/БИН' }, { t: 'phone', i: '☏', l: 'Телефон' }, { t: 'email', i: '@', l: 'Email' },
  { t: 'select', i: '▾', l: 'Список' }, { t: 'radio', i: '◉', l: 'Выбор' }, { t: 'date', i: '📅', l: 'Дата' },
  { t: 'textarea', i: '≡', l: 'Textarea' }, { t: 'file', i: '📎', l: 'Файл' }, { t: 'calculated', i: '∑', l: 'Расчётное' },
];

const AdminConstructor: React.FC = () => {
  const [schema, setSchema] = useState({ title: 'Лизинг — I Этап', eish: '/api/eish/brk/stage1', steps: LEASING_SCHEMA.map(s => ({ ...s, fields: [...s.fields] })) });
  const [stepIdx, setStepIdx] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [saved, setSaved] = useState(false);
  const [propTab, setPropTab] = useState<'props' | 'logic' | 'val'>('props');

  const curStep = schema.steps[stepIdx];
  const activeField = curStep?.fields.find(f => f.id === activeId) ?? null;

  const addField = (type: string) => {
    const ft = FTYPES.find(t => t.t === type);
    const nf: SchemaField = { id: 'f' + Date.now(), type, label: `${ft?.l} (новое)`, required: false, width: 'half' };
    if (type === 'select' || type === 'radio') nf.options = [{ v: 'opt1', l: 'Вариант 1' }, { v: 'opt2', l: 'Вариант 2' }];
    if (type === 'calculated') nf.formula = '';
    setSchema(s => ({ ...s, steps: s.steps.map((st, i) => i === stepIdx ? { ...st, fields: [...st.fields, nf] } : st) }));
    setActiveId(nf.id);
  };

  const updateField = (id: string, upd: Partial<SchemaField>) => {
    setSchema(s => ({ ...s, steps: s.steps.map((st, i) => i === stepIdx ? { ...st, fields: st.fields.map(f => f.id === id ? { ...f, ...upd } : f) } : st) }));
  };

  const deleteField = (id: string) => {
    setSchema(s => ({ ...s, steps: s.steps.map((st, i) => i === stepIdx ? { ...st, fields: st.fields.filter(f => f.id !== id) } : st) }));
    setActiveId(null);
  };

  const moveField = (id: string, dir: -1 | 1) => {
    setSchema(s => ({
      ...s, steps: s.steps.map((st, i) => {
        if (i !== stepIdx) return st;
        const fields = [...st.fields];
        const idx = fields.findIndex(f => f.id === id);
        if (idx < 0 || idx + dir < 0 || idx + dir >= fields.length) return st;
        [fields[idx], fields[idx + dir]] = [fields[idx + dir], fields[idx]];
        return { ...st, fields };
      })
    }));
  };

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="admin-page-title" style={{ marginBottom: 0 }}>Конструктор no-code форм</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span className="save-toast">✓ Успешно сохранено в БД</span>}
          <button className="btn btn-sm" onClick={() => setShowJson(!showJson)}>{showJson ? 'Скрыть JSON' : 'JSON схема'}</button>
          <button className="btn btn-sm btn-primary" onClick={save}>💾 Сохранить схему</button>
        </div>
      </div>
      <div className="constructor-wrap">
        {/* Palette */}
        <div className="con-palette">
          <div className="palette-section">Типы полей</div>
          {FTYPES.map(ft => (
            <button key={ft.t} className="palette-field" onClick={() => addField(ft.t)}>
              <span className="palette-field-icon">{ft.i}</span>{ft.l}
            </button>
          ))}
          <div className="palette-section">Настройки услуги</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><div className="prop-label">Название</div><input className="form-control" value={schema.title} onChange={e => setSchema(s => ({ ...s, title: e.target.value }))} style={{ fontSize: 11 }} /></div>
            <div><div className="prop-label">ЕИШ endpoint</div><input className="form-control" value={schema.eish} onChange={e => setSchema(s => ({ ...s, eish: e.target.value }))} style={{ fontSize: 11 }} /></div>
          </div>
        </div>
        {/* Canvas */}
        <div className="con-canvas">
          <div className="steps-tabs">
            {schema.steps.map((st, i) => (
              <button key={st.id} className={`step-tab ${i === stepIdx ? 'active' : ''}`} onClick={() => { setStepIdx(i); setActiveId(null); }}>
                {i + 1}. {st.title}<span className="step-tab-count">{st.fields.length}</span>
              </button>
            ))}
            <button className="btn btn-xs" style={{ marginLeft: 4 }} onClick={() => {
              setSchema(s => ({ ...s, steps: [...s.steps, { id: 's' + Date.now(), title: `Шаг ${s.steps.length + 1}`, fields: [] }] }));
              setStepIdx(schema.steps.length);
            }}>+ Шаг</button>
          </div>
          <div className="step-edit-bar">
            <input className="step-title-input" value={curStep?.title || ''} onChange={e => setSchema(s => ({ ...s, steps: s.steps.map((st, i) => i === stepIdx ? { ...st, title: e.target.value } : st) }))} />
          </div>
          {showJson ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0f1929', margin: 10, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#1a2540', fontSize: 11, color: '#94a3b8', borderBottom: '1px solid #2a3550', display: 'flex', justifyContent: 'space-between' }}>
                <span>JSON схема</span><span style={{ fontSize: 10 }}>{schema.steps.reduce((a, s) => a + s.fields.length, 0)} полей</span>
              </div>
              <pre className="json-preview-box">{JSON.stringify(schema, null, 2)}</pre>
            </div>
          ) : (
            <div className="fields-list">
              {curStep?.fields.length === 0 ? (
                <div className="fields-empty"><div style={{ fontSize: 24, opacity: .3 }}>⊕</div>Нажмите на тип поля слева, чтобы добавить в форму</div>
              ) : curStep?.fields.map((f, i) => {
                const ft = FTYPES.find(t => t.t === f.type) || { i: '?', l: f.type };
                return (
                  <div key={f.id} className={`field-card ${activeId === f.id ? 'active' : ''} ${f.cond ? 'has-cond' : ''}`} onClick={() => setActiveId(f.id === activeId ? null : f.id)}>
                    <div className="field-icon">{ft.i}</div>
                    <div className="field-info">
                      <div className="field-label">{f.label}</div>
                      <div className="field-tags">
                        <span className="field-type-text">{ft.l}</span>
                        {f.required && <span className="field-tag tag-required">обяз.</span>}
                        {f.cond && <span className="field-tag tag-cond">⚡ условие</span>}
                        {f.type === 'calculated' && f.formula && <span className="field-tag tag-formula">∑ {f.formula}</span>}
                        {f.hasEgov && <span className="field-tag tag-egov">eGov</span>}
                      </div>
                    </div>
                    <div className="field-actions" onClick={e => e.stopPropagation()}>
                      {i > 0 && <button className="icon-btn" onClick={() => moveField(f.id, -1)}>↑</button>}
                      {i < curStep.fields.length - 1 && <button className="icon-btn" onClick={() => moveField(f.id, 1)}>↓</button>}
                      <button className="icon-btn danger" onClick={() => deleteField(f.id)}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Props panel */}
        {activeField && !showJson && (
          <div className="con-props">
            <div className="props-header">
              <div className="props-title">Свойства поля</div>
              <button className="btn btn-xs btn-danger" onClick={() => deleteField(activeField.id)}>Удалить</button>
            </div>
            <div className="props-tabs">
              {(['props', 'logic', 'val'] as const).map(t => (
                <button key={t} className={`props-tab ${propTab === t ? 'active' : ''}`} onClick={() => setPropTab(t)}>
                  {{ props: 'Поле', logic: 'Логика', val: 'Валидация' }[t]}
                </button>
              ))}
            </div>
            <div className="props-body">
              {propTab === 'props' && (
                <>
                  <div className="prop-row"><div className="prop-label">Название поля</div><input className="form-control" value={activeField.label} onChange={e => updateField(activeField.id, { label: e.target.value })} /></div>
                  <div className="prop-row"><div className="prop-label">Ширина</div>
                    <select className="form-control" value={activeField.width || 'full'} onChange={e => updateField(activeField.id, { width: e.target.value })}>
                      <option value="full">Полная</option><option value="half">Половина</option>
                    </select>
                  </div>
                  <div className="check-row"><input type="checkbox" checked={!!activeField.required} onChange={e => updateField(activeField.id, { required: e.target.checked })} /><label>Обязательное</label></div>
                  <div className="check-row"><input type="checkbox" checked={!!activeField.disabled} onChange={e => updateField(activeField.id, { disabled: e.target.checked })} /><label>Только чтение</label></div>
                  {activeField.type === 'calculated' && (
                    <div className="prop-row"><div className="prop-label">Формула</div>
                      <input className="form-control" style={{ fontFamily: 'monospace', fontSize: 12 }} value={activeField.formula || ''} placeholder="asset_cost*0.2" onChange={e => updateField(activeField.id, { formula: e.target.value })} />
                      <div className="form-hint">Используйте id полей: asset_cost, adv_pct...</div>
                    </div>
                  )}
                  {activeField.options && (
                    <>
                      <div className="prop-label" style={{ marginTop: 4 }}>Варианты</div>
                      {activeField.options.map((o, i) => (
                        <div key={i} className="option-row">
                          <input className="form-control" value={o.l} onChange={e => { const opts = [...(activeField.options || [])]; opts[i] = { ...opts[i], l: e.target.value }; updateField(activeField.id, { options: opts }); }} />
                          <button className="icon-btn danger" onClick={() => { const opts = (activeField.options || []).filter((_, j) => j !== i); updateField(activeField.id, { options: opts }); }}>✕</button>
                        </div>
                      ))}
                      <button className="btn btn-ghost btn-xs" onClick={() => { const opts = [...(activeField.options || [])]; opts.push({ v: 'opt' + (opts.length + 1), l: 'Вариант ' + (opts.length + 1) }); updateField(activeField.id, { options: opts }); }}>+ Вариант</button>
                    </>
                  )}
                </>
              )}
              {propTab === 'logic' && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8, background: 'var(--blue-light)', borderRadius: 6, lineHeight: 1.5 }}>Поле показывается только при выполнении условия</div>
                  {activeField.cond ? (
                    <div style={{ padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div className="prop-label" style={{ color: 'var(--info)' }}>Показать если:</div>
                      <select className="form-control" value={activeField.cond.fieldId} onChange={e => updateField(activeField.id, { cond: { ...activeField.cond!, fieldId: e.target.value } })}>
                        {curStep.fields.filter(f => f.id !== activeField.id).map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>равно</span>
                        <input className="form-control" value={activeField.cond.value} onChange={e => updateField(activeField.id, { cond: { ...activeField.cond!, value: e.target.value } })} />
                      </div>
                      <button className="btn btn-xs btn-danger" onClick={() => updateField(activeField.id, { cond: undefined })}>Удалить правило</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm" onClick={() => {
                      const other = curStep.fields.find(f => f.id !== activeField.id);
                      updateField(activeField.id, { cond: { fieldId: other?.id || '', value: '' } });
                    }}>+ Добавить условие показа</button>
                  )}
                </>
              )}
              {propTab === 'val' && (
                <>
                  <div className="check-row"><input type="checkbox" checked={!!activeField.required} onChange={e => updateField(activeField.id, { required: e.target.checked })} /><label>Обязательное поле</label></div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Дополнительные правила валидации добавляются здесь</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- AI ASSISTANT ----
const AI_SYSTEM_PROMPT = `Ты — AI-помощник единого портала поддержки бизнеса Байтерек (Казахстан).
Твоя задача — помочь предпринимателю найти подходящую меру государственной поддержки.
ВАЖНО: Отвечай сразу, без цепочки размышлений. Не пиши "Hmm", "Let me", "Wait" и подобное. Только финальный ответ.

Доступные услуги:
1. Лизинг авиатранспорта и вагонов — I Этап (БРК Лизинг). Предварительная заявка. Сумма от 80 млн ₸. Срок до 15 рабочих дней.
2. Лизинг авиатранспорта и вагонов — II Этап (БРК Лизинг). Основная заявка после одобрения I этапа. Срок до 45 рабочих дней.
3. Субсидирование процентной ставки по кредитам (Даму). Снижение ставки до 7-8%. Для МСБ в приоритетных секторах.
4. Долгосрочное кредитование проектов (БРК). От 5 млрд ₸. Инвестиционные и инфраструктурные проекты.
5. Гарантирование кредитов МСБ (Даму). Гарантия до 85% от суммы кредита при нехватке залога.
6. Льготное кредитование АПК (КазАгро). Ставка от 6%. Для сельскохозяйственных предприятий. От 5 млн ₸.
7. Экспортное финансирование МСБ (Даму). Для экспортёров несырьевого сектора. Под экспортный контракт.
8. Регистрация компании в МФЦА (МФЦА). Доступ к юрисдикции английского права для финтех и инвест-компаний.
9. Прямые инвестиции в несырьевой сектор (KIC). Equity от 500 млн до 5 млрд ₸. Для действующего бизнеса от 3 лет.

Задавай уточняющие вопросы: сфера деятельности, размер бизнеса, нужная сумма, цель финансирования.
Отвечай кратко, по делу. Рекомендуй 1-2 наиболее подходящие услуги с объяснением почему.
Отвечай на том языке, на котором пишет пользователь (русский или казахский).`;

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC<{ lang: string }> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: lang === 'kz'
          ? 'Сәлеметсіз бе! 👋 Мен Байтерек порталының AI-көмекшісімін.\n\nСіздің бизнесіңізге қолайлы мемлекеттік қолдау шарасын табуға көмектесемін.\n\nҚандай сала? Қандай мақсатқа қаражат керек?'
          : 'Здравствуйте! 👋 Я AI-помощник портала Байтерек.\n\nПомогу подобрать подходящую меру государственной поддержки для вашего бизнеса.\n\nРасскажите: какая сфера деятельности и какое финансирование вас интересует?'
      }]);
    }
  }, [isOpen, lang, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setError('');

    const userMsg: AIMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Models in priority order — fallback if rate-limited
    const MODELS = [
      'openai/gpt-oss-120b:free',
      'deepseek/deepseek-v4-flash:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'meta-llama/llama-3.3-70b-instruct:free',
    ];

    const callAPI = async (modelIdx = 0): Promise<string> => {
      const model = MODELS[modelIdx] || MODELS[0];
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Baiterek Portal',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            ...newMessages
          ],
          max_tokens: 600,
          temperature: 0.7,
          include_reasoning: false,
        }),
      });

      // Rate-limited → try next model
      if (response.status === 429) {
        if (modelIdx < MODELS.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
          return callAPI(modelIdx + 1);
        }
        return lang === 'kz'
          ? '⏳ Барлық модельдер жүктелген. 15-20 секунд күтіп, қайталаңыз.'
          : '⏳ Все модели перегружены. Подождите 15-20 секунд и повторите.';
      }

      if (response.ok) {
        const data = await response.json();
        let content: string = data.choices?.[0]?.message?.content?.trim() || '';
        // Strip <think>...</think> and <thinking> tags
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        content = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
        // Remove leading chain-of-thought sentences (English + Russian)
        const thinkPatterns = [
          /^(Okay|Alright|Let me|Hmm|Wait|So,|I need to|I should|I'll think|First,? let me)[^.!?]*[.!?]\s*/i,
          /^(Хорошо,?|Ладно,?|Итак,?|Нужно|Давайте|Вспомним|Посмотрим|Сначала вспомн|Пользователь)[^.!?]*[.!?]\s*/,
        ];
        let cleaned = true;
        while (cleaned) {
          cleaned = false;
          for (const pat of thinkPatterns) {
            if (pat.test(content)) {
              content = content.replace(pat, '').trim();
              cleaned = true;
            }
          }
        }
        return content || (lang === 'kz' ? 'Кешіріңіз, жауап алу мүмкін болмады.' : 'Извините, не удалось получить ответ.');
      }

      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${response.status}`);
    };

    try {
      const reply = await callAPI();
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!isOpen) setHasUnread(true);
    } catch (e: any) {
      const errMsg = lang === 'kz'
        ? '⚠️ Қосылу қатесі. Интернет байланысын тексеріп, кейінірек қайталаңыз.'
        : '⚠️ Ошибка соединения. Проверьте интернет и попробуйте позже.';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      setError(String(e?.message || ''));
    }

    setLoading(false);
  };

  const quickQuestions = lang === 'kz'
    ? ['Лизинг қалай алуға болады?', 'МСБ үшін несие', 'Субсидия шарттары']
    : ['Как получить лизинг?', 'Кредит для МСБ', 'Условия субсидий'];

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ai-chat-avatar">🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                  {lang === 'kz' ? 'Байтерек Көмекшісі' : 'Помощник Байтерек'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  {lang === 'kz' ? 'AI Көмекші · белсенді' : 'AI Консультант · активен'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {messages.length > 1 && (
                <button
                  onClick={() => { setMessages([]); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.7rem', padding: '3px 8px', cursor: 'pointer' }}
                  title="Новый чат"
                >
                  ↺
                </button>
              )}
              <button className="ai-chat-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg-${m.role}`}>
                {m.role === 'assistant' && (
                  <div className="ai-msg-av">🤖</div>
                )}
                <div
                  className="ai-msg-bubble"
                  style={m.role === 'user' ? {
                    background: 'linear-gradient(135deg, #1A3D8F, #2d5bbf)',
                    color: '#ffffff',
                    borderRadius: '16px 4px 16px 16px',
                  } : undefined}
                >
                  {m.content.split('\n').map((line, li) => (
                    <React.Fragment key={li}>
                      {line}
                      {li < m.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-msg-av">🤖</div>
                <div className="ai-msg-bubble ai-typing">
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                </div>
              </div>
            )}

            {/* Quick questions (show only when fresh chat) */}
            {messages.length === 1 && !loading && (
              <div className="ai-quick-questions">
                {quickQuestions.map(q => (
                  <button
                    key={q}
                    className="ai-quick-btn"
                    onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-chat-input-area">
            <input
              ref={inputRef}
              className="ai-chat-input"
              placeholder={lang === 'kz' ? 'Сұрағыңызды жазыңыз...' : 'Введите вопрос...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={loading}
              maxLength={500}
            />
            <button
              className="ai-chat-send"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              title="Отправить"
            >
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '➤'}
            </button>
          </div>

          {/* Footer hint */}
          <div className="ai-chat-footer">
            {lang === 'kz' ? 'AI кеңесші · дәл ақпарат үшін маманға хабарласыңыз' : 'AI-консультант · для точной информации обратитесь к специалисту'}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`ai-float-btn ${isOpen ? 'ai-float-btn-open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        title={lang === 'kz' ? 'AI Көмекшісі' : 'AI Помощник'}
      >
        <span className="ai-float-icon">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && (
          <span className="ai-float-label">{lang === 'kz' ? 'AI' : 'AI'}</span>
        )}
        {hasUnread && !isOpen && <span className="ai-float-badge" />}
      </button>
    </>
  );
};

export default App;
