import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// ---- TYPES ----
type Screen = 'home'|'catalog'|'service'|'app'|'success'|'login'|'adminlogin'|'dash'|'admin';
interface User { name: string; iin: string; }
interface AppRecord { id: string; title: string; date: string; }
interface Service {
  title: string; org: string; stage: number|null; cat: string;
  dur: string; result: string; eish: string; desc: string;
  conds: string[]; docs: string[];
}
interface SchemaField {
  id: string; type: string; label: string; required?: boolean;
  disabled?: boolean; width?: string; options?: {v:string;l:string}[];
  formula?: string; hint?: string; hasEgov?: boolean;
  cond?: {fieldId:string; value:string};
}
interface SchemaStep { id: string; title: string; fields: SchemaField[]; }

// ---- DATA ----
const SERVICES: Service[] = [
  { title:'Лизинг авиатранспорта и вагонов — I Этап', org:'БРК Лизинг', stage:1, cat:'leasing',
    dur:'до 15 рабочих дней', result:'Индикативное решение', eish:'/api/eish/brk/stage1',
    desc:'Предварительная заявка на финансовый лизинг авиатранспорта или ж/д вагонов',
    conds:['Резидент РК','Срок деятельности ≥ 1 года','Нет задолженности перед бюджетом','Сумма ≥ 80 млн ₸'],
    docs:['Устав компании','Свидетельство о регистрации','Финотчётность за 2 года','Бизнес-план']},
  { title:'Лизинг авиатранспорта и вагонов — II Этап', org:'БРК Лизинг', stage:2, cat:'leasing',
    dur:'до 45 рабочих дней', result:'Договор лизинга', eish:'/api/eish/brk/stage2',
    desc:'Основная заявка после положительного индикативного решения',
    conds:['Наличие решения I Этапа','Выполнение условий'],
    docs:['Документы по сделке','Договор с поставщиком','Документы по залогу']},
  { title:'Субсидирование ставки вознаграждения', org:'Даму', stage:null, cat:'subsidy',
    dur:'до 30 рабочих дней', result:'Субсидирование до 7%', eish:'/api/eish/damu/subsidy',
    desc:'Субсидирование процентной ставки по кредитам МСБ',
    conds:['МСБ, резидент РК','Кредит в банке-партнёре','Приоритетные отрасли'],
    docs:['Заявление','Документы по кредиту','Финотчётность']},
  { title:'Долгосрочное кредитование проектов', org:'БРК', stage:null, cat:'credit',
    dur:'до 60 рабочих дней', result:'Кредитный договор', eish:'/api/eish/brk/credit',
    desc:'Финансирование крупных инвестиционных проектов от 5 млрд тенге',
    conds:['Сумма ≥ 5 млрд ₸','Инвестиционный проект'],
    docs:['Бизнес-план','Финотчётность','Документы по залогу']},
  { title:'Гарантирование кредитов МСБ', org:'Даму', stage:null, cat:'guarantee',
    dur:'до 20 рабочих дней', result:'Гарантийный сертификат', eish:'/api/eish/damu/guarantee',
    desc:'Частичное гарантирование кредитов субъектов МСБ',
    conds:['МСБ','Нехватка залога','Банк-партнёр'],
    docs:['Заявление','Кредитный договор']},
];

const LEASING_SCHEMA: SchemaStep[] = [
  { id:'s1', title:'Сведения о компании', fields:[
    {id:'bin',type:'iin_bin',label:'БИН компании',required:true,width:'half',hasEgov:true},
    {id:'company_name',type:'text',label:'Наименование компании',required:true,width:'full',disabled:true},
    {id:'oked_name',type:'text',label:'Вид деятельности (ОКЭД)',width:'half',disabled:true},
    {id:'director',type:'text',label:'Руководитель',width:'half',disabled:true},
    {id:'phone',type:'phone',label:'Контактный телефон',required:true,width:'half'},
    {id:'email',type:'email',label:'Email',required:true,width:'half'},
  ]},
  { id:'s2', title:'Предмет лизинга', fields:[
    {id:'leasing_type',type:'radio',label:'Тип предмета лизинга',required:true,width:'full',
      options:[{v:'aviation',l:'Авиатранспорт (воздушные суда)'},{v:'wagons',l:'Железнодорожные вагоны'}]},
    {id:'aviation_type',type:'select',label:'Тип воздушного судна',width:'half',
      options:[{v:'passenger',l:'Пассажирское'},{v:'cargo',l:'Грузовое'},{v:'helicopter',l:'Вертолёт'}],
      cond:{fieldId:'leasing_type',value:'aviation'}},
    {id:'wagon_type',type:'select',label:'Тип вагонов',width:'half',
      options:[{v:'covered',l:'Крытые'},{v:'flatcar',l:'Платформы'},{v:'tank',l:'Цистерны'},{v:'hopper',l:'Хопперы'}],
      cond:{fieldId:'leasing_type',value:'wagons'}},
    {id:'asset_cost',type:'currency',label:'Стоимость предмета лизинга (₸)',required:true,width:'half',hint:'Минимум 80 000 000 ₸'},
    {id:'supplier_country',type:'select',label:'Страна поставщика',required:true,width:'half',
      options:[{v:'kz',l:'Казахстан'},{v:'ru',l:'Россия'},{v:'cn',l:'Китай'},{v:'eu',l:'Европа'}]},
  ]},
  { id:'s3', title:'Параметры финансирования', fields:[
    {id:'term',type:'select',label:'Срок лизинга',required:true,width:'half',
      options:[{v:'3',l:'3 года'},{v:'5',l:'5 лет'},{v:'7',l:'7 лет'},{v:'10',l:'10 лет'}]},
    {id:'adv_pct',type:'select',label:'Авансовый платёж',required:true,width:'half',
      options:[{v:'15',l:'15%'},{v:'20',l:'20%'},{v:'25',l:'25%'},{v:'30',l:'30%'}]},
    {id:'adv_amt',type:'calculated',label:'Сумма аванса (₸)',formula:'asset_cost*adv_pct/100',width:'half'},
    {id:'fin_amt',type:'calculated',label:'Сумма финансирования (₸)',formula:'asset_cost-adv_amt',width:'half'},
    {id:'monthly',type:'calculated',label:'Ориентировочный платёж/месяц (₸)',formula:'fin_amt/(term*12)',width:'full'},
    {id:'purpose',type:'textarea',label:'Цель приобретения и описание проекта',required:true,width:'full'},
  ]},
  { id:'s4', title:'Документы', fields:[
    {id:'doc1',type:'file',label:'Устав компании',required:true,width:'full'},
    {id:'doc2',type:'file',label:'Свидетельство о государственной регистрации',required:true,width:'full'},
    {id:'doc3',type:'file',label:'Финансовая отчётность за 2 года',required:true,width:'full'},
    {id:'doc4',type:'file',label:'Бизнес-план проекта',required:true,width:'full'},
  ]},
];

// ---- ENGINE ----
type FV = Record<string, unknown>;
function isVis(f: SchemaField, fv: FV): boolean {
  if (!f.cond) return true;
  return String(fv[f.cond.fieldId]) === f.cond.value;
}
function calcFormula(formula: string, fv: FV): number | null {
  let expr = formula;
  Object.keys(fv).sort((a,b) => b.length - a.length).forEach(k => {
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

// ---- MAIN APP ----
const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [svcIdx, setSvcIdx] = useState(0);
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [successId, setSuccessId] = useState('');

  const go = useCallback((s: Screen, idx?: number) => {
    if (s === 'service' && idx !== undefined) setSvcIdx(idx);
    setScreen(s);
    window.scrollTo(0, 0);
  }, []);

  const onLogin = (u: User) => { setUser(u); go('dash'); };
  const onAdminLogin = () => { setIsAdmin(true); go('admin'); };
  const onSubmitApp = (id: string) => {
    setSuccessId(id);
    setApps(prev => [...prev, { id, title: SERVICES[svcIdx].title, date: new Date().toLocaleDateString('ru-KZ') }]);
    go('success');
  };

  const navScreens: Record<string, string> = { home: 'Главная', catalog: 'Услуги' };
  const nav = (
    <div className="main-nav">
      {(['home','catalog'] as Screen[]).map(s => (
        <button key={s} className={`nav-item ${screen === s ? 'active' : ''}`} onClick={() => go(s)}>
          navScreens[s]
        </button>
      ))}
      <button className="nav-item">Новости</button>
      <button className="nav-item">Контакты</button>
    </div>
  );

  const hdrRight = user
    ? <><div className="user-chip"><div className="user-av">{user.name[0]}</div>{user.name.split(' ')[0]}</div><button className="btn btn-sm btn-primary" onClick={() => go('dash')}>Кабинет</button></>
    : <><button className="btn btn-sm" onClick={() => go('login')}>Войти</button><button className="btn btn-sm btn-primary" onClick={() => go('login')}>Подать заявку</button></>;

  const adminHdrRight = <><div className="user-chip"><div className="user-av">A</div>admin@baiterek.kz</div><button className="btn btn-sm" onClick={() => { setIsAdmin(false); go('home'); }}>Выйти</button></>;

  if (screen === 'home') return <Layout nav={nav} hdrRight={hdrRight}><HomePage onGoService={(i) => go('service', i)} onGoCatalog={() => go('catalog')} onLogin={() => go('login')} /></Layout>;
  if (screen === 'catalog') return <Layout nav={nav} hdrRight={hdrRight}><CatalogPage onSelectService={(i) => go('service', i)} /></Layout>;
  if (screen === 'service') return <Layout nav={nav} hdrRight={hdrRight} onBack={() => go('catalog')}><ServicePage svc={SERVICES[svcIdx]} onApply={() => go('app')} /></Layout>;
  if (screen === 'app') return <AppFlow steps={LEASING_SCHEMA} svc={SERVICES[svcIdx]} onBack={() => go('service')} onSubmit={onSubmitApp} />;
  if (screen === 'success') return <Layout hdrRight={hdrRight}><SuccessPage appId={successId} svc={SERVICES[svcIdx]} onDash={() => go('dash')} /></Layout>;
  if (screen === 'login') return <Layout hdrRight={hdrRight} onBack={() => go('home')}><LoginPage onLogin={onLogin} onAdminLogin={() => go('adminlogin')} /></Layout>;
  if (screen === 'adminlogin') return <Layout hdrRight={hdrRight} onBack={() => go('login')}><AdminLoginPage onLogin={onAdminLogin} /></Layout>;
  if (screen === 'dash') return <Layout hdrRight={hdrRight}><DashPage user={user!} apps={apps} onGoService={(i) => go('service', i)} onGoCatalog={() => go('catalog')} /></Layout>;
  if (screen === 'admin' && isAdmin) return <AdminPanel hdrRight={adminHdrRight} apps={apps} user={user} />;
  return <Layout nav={nav} hdrRight={hdrRight}><HomePage onGoService={(i) => go('service', i)} onGoCatalog={() => go('catalog')} onLogin={() => go('login')} /></Layout>;
};

// ---- LAYOUT ----
const Layout: React.FC<{ children: React.ReactNode; nav?: React.ReactNode; hdrRight?: React.ReactNode; onBack?: () => void }> = ({ children, nav, hdrRight, onBack }) => (
  <div className="app-layout">
    <header className="app-header">
      <div className="header-left">
        {onBack && <button className="btn btn-sm" onClick={onBack}>← Назад</button>}
        <div className="logo">
          <div className="logo-mark">Б</div>
          <div><div className="logo-name">Байтерек</div><div className="logo-sub">Единый портал поддержки бизнеса</div></div>
        </div>
        {nav}
      </div>
      <div className="header-right">{hdrRight}</div>
    </header>
    <main>{children}</main>
  </div>
);

// ---- HOME ----
const ORGS = [
  { abbr:'БРК', name:'Банк развития Казахстана', color:'#e6f1fb', text:'#185fa5' },
  { abbr:'БРК-Л', name:'БРК Лизинг', color:'#eaf3de', text:'#3b6d11' },
  { abbr:'Даму', name:'Фонд развития МСБ', color:'#faeeda', text:'#854f0b' },
  { abbr:'КА', name:'КазАгро Холдинг', color:'#fcebeb', text:'#a32d2d' },
  { abbr:'МФЦА', name:'Международный финансовый центр', color:'#e1f5ee', text:'#0f6e56' },
  { abbr:'KIC', name:'Инвестиционная корпорация', color:'#eeedfe', text:'#534ab7' },
];

const HomePage: React.FC<{ onGoService: (i: number) => void; onGoCatalog: () => void; onLogin: () => void }> = ({ onGoService, onGoCatalog, onLogin }) => (
  <div style={{ overflowY: 'auto' }}>
    <div className="hero">
      <div className="hero-eyebrow">Республика Казахстан · Холдинг «Байтерек»</div>
      <h1 className="hero-title">Единый портал<br /><span>поддержки бизнеса</span></h1>
      <p className="hero-desc">Все меры государственной поддержки в одном окне. Подайте заявку онлайн, отслеживайте статус, получайте результат.</p>
      <div className="hero-btns">
        <button className="btn btn-gold btn-lg" onClick={onGoCatalog}>Каталог услуг</button>
        <button className="btn btn-outline btn-lg" onClick={onLogin}>Личный кабинет</button>
      </div>
      <div className="hero-stats">
        <div><div className="hstat-num">70+</div><div className="hstat-lbl">Мер поддержки</div></div>
        <div><div className="hstat-num">6</div><div className="hstat-lbl">Организаций</div></div>
        <div><div className="hstat-num">50К+</div><div className="hstat-lbl">Предпринимателей</div></div>
      </div>
    </div>
    <div className="section">
      <div className="section-header"><div className="section-title">Организации Холдинга</div></div>
      <div className="orgs-grid">
        {ORGS.map(o => (
          <div className="org-card" key={o.abbr}>
            <div className="org-icon" style={{ background: o.color, color: o.text }}>{o.abbr}</div>
            <div className="org-name">{o.abbr === 'БРК-Л' ? 'БРК Лизинг' : o.abbr === 'КА' ? 'КазАгро' : o.abbr}</div>
            <div className="org-desc">{o.name}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="section" style={{ paddingTop: 0 }}>
      <div className="section-header"><div className="section-title">Популярные услуги</div><div className="section-link" onClick={onGoCatalog}>Все услуги →</div></div>
      <div className="services-grid">
        {SERVICES.slice(0, 4).map((s, i) => (
          <div className="service-card" key={i} onClick={() => onGoService(i)}>
            <div className="service-org">{s.org}{s.stage ? ` · Этап ${s.stage}` : ''}</div>
            <div className="service-title">{s.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span className={`badge badge-${{ leasing:'blue', subsidy:'green', credit:'amber', guarantee:'gray' }[s.cat] || 'gray'}`}>{{ leasing:'Лизинг', subsidy:'Субсидии', credit:'Кредит', guarantee:'Гарантия' }[s.cat]}</span>
              <span className="service-dur">⏱ {s.dur}</span>
            </div>
            <div className="service-arrow">Подать заявку →</div>
          </div>
        ))}
      </div>
    </div>
    <div className="section" style={{ paddingTop: 0 }}>
      <div className="section-title" style={{ marginBottom: 14 }}>Новости</div>
      <div className="news-list">
        {[
          { title: 'Байтерек запускает единый цифровой портал для поддержки предпринимателей', org: 'Холдинг «Байтерек»', date: '30.04.2026' },
          { title: 'БРК Лизинг снижает авансовый платёж для МСБ до 15%', org: 'БРК Лизинг', date: '28.04.2026' },
          { title: 'Даму выделяет 50 млрд тенге на субсидирование МСБ в 2026 году', org: 'Даму', date: '25.04.2026' },
        ].map((n, i) => (
          <div className="news-item" key={i}>
            <div style={{ flex: 1 }}>
              <div className="news-title">{n.title}</div>
              <div className="news-meta">{n.org}</div>
            </div>
            <div className="news-date">{n.date}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ---- CATALOG ----
const CatalogPage: React.FC<{ onSelectService: (i: number) => void }> = ({ onSelectService }) => {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const filtered = SERVICES.filter(s =>
    (cat === 'all' || s.cat === cat) &&
    (s.title.toLowerCase().includes(search.toLowerCase()) || s.org.toLowerCase().includes(search.toLowerCase()))
  );
  const cats = [{ v:'all',l:'Все' },{ v:'leasing',l:'Лизинг' },{ v:'credit',l:'Кредиты' },{ v:'subsidy',l:'Субсидии' },{ v:'guarantee',l:'Гарантии' }];
  return (
    <div>
      <div className="catalog-header">
        <div className="catalog-title">Каталог услуг</div>
        <div className="catalog-search-wrap">
          <span className="catalog-search-icon">🔍</span>
          <input className="catalog-search" placeholder="Поиск по услугам..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-chips">
          {cats.map(c => (
            <button key={c.v} className={`filter-chip ${cat === c.v ? 'active' : ''}`} onClick={() => setCat(c.v)}>{c.l}</button>
          ))}
        </div>
      </div>
      <div className="catalog-grid">
        {filtered.map((s, i) => {
          const realIdx = SERVICES.indexOf(s);
          const catColors: Record<string, string> = { leasing:'badge-blue', subsidy:'badge-green', credit:'badge-amber', guarantee:'badge-gray' };
          const catLabels: Record<string, string> = { leasing:'Лизинг', subsidy:'Субсидии', credit:'Кредиты', guarantee:'Гарантии' };
          return (
            <div className="cat-card" key={i} onClick={() => onSelectService(realIdx)}>
              <div className="cat-card-top">
                <span className={`badge ${catColors[s.cat] || 'badge-gray'}`}>{catLabels[s.cat] || s.cat}</span>
                {s.stage && <span className="badge badge-gray">Этап {s.stage}</span>}
              </div>
              <div className="cat-card-title">{s.title}</div>
              <div className="cat-card-desc">{s.org} · {s.desc.slice(0, 70)}...</div>
              <div className="cat-card-footer"><span>⏱ {s.dur}</span><span className="cat-card-cta">Подробнее →</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- SERVICE DETAIL ----
const ServicePage: React.FC<{ svc: Service; onApply: () => void }> = ({ svc, onApply }) => (
  <div>
    <div className="service-hero">
      <span className="badge badge-blue">{svc.org}{svc.stage ? ` · Этап ${svc.stage}` : ''}</span>
      <h1 className="service-hero-title">{svc.title}</h1>
      <p className="service-hero-desc">{svc.desc}</p>
      <button className="btn btn-gold" onClick={onApply}>📝 Подать заявку</button>
    </div>
    <div className="service-detail-grid">
      <div className="detail-card"><h3>Условия получения</h3><ul>{svc.conds.map((c,i) => <li key={i}>{c}</li>)}</ul></div>
      <div className="detail-card"><h3>Необходимые документы</h3><ul>{svc.docs.map((d,i) => <li key={i}>{d}</li>)}</ul></div>
      <div className="meta-grid">
        <div className="meta-box"><div className="meta-box-label">Срок рассмотрения</div><div className="meta-box-value">{svc.dur}</div></div>
        <div className="meta-box"><div className="meta-box-label">Результат</div><div className="meta-box-value" style={{fontSize:12}}>{svc.result}</div></div>
        <div className="meta-box"><div className="meta-box-label">Шагов в форме</div><div className="meta-box-value">{LEASING_SCHEMA.length}</div></div>
      </div>
    </div>
  </div>
);

// ---- APPLICATION FLOW ----
const AppFlow: React.FC<{ steps: SchemaStep[]; svc: Service; onBack: () => void; onSubmit: (id: string) => void }> = ({ steps, svc, onBack, onSubmit }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [fv, setFv] = useState<FV>({});
  const [loading, setLoading] = useState(false);
  const [autofill, setAutofill] = useState(false);

  const computed = reCalc(steps, fv);
  const curStep = steps[stepIdx];
  const pct = Math.round(stepIdx / steps.length * 100);

  const setVal = useCallback((id: string, val: unknown) => {
    setFv(prev => reCalc(steps, { ...prev, [id]: val }));
  }, [steps]);

  useEffect(() => {
    const binF = curStep.fields.find(f => f.hasEgov);
    if (!binF) return;
    const bin = String(computed[binF.id] || '');
    if (bin.length === 12) {
      setAutofill(true);
      setTimeout(() => {
        setFv(prev => reCalc(steps, { ...prev, company_name: 'ТОО "АвиаТранс Казахстан"', oked_name: '51.10 — Воздушный транспорт', director: 'Сейткали Ержан Бекович' }));
        setAutofill(false);
      }, 1100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed.bin]);

 const nextStep = async () => {
    if (stepIdx < steps.length - 1) { setStepIdx(s => s + 1); }
    else {
      setLoading(true);
      const id = 'BRK-' + Date.now().toString().slice(-8);
      try {
        await fetch('http://localhost:3001/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appNumber: id, serviceId: 1, formData: computed })
        });
        console.log('✅ Заявка сохранена в БД:', id);
      } catch(e) {
        console.log('⚠️ Работаем без БД');
      }
      setLoading(false);
      onSubmit(id);
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <button className="btn btn-sm" onClick={onBack}>← Назад</button>
          <div className="logo"><div className="logo-mark">Б</div><div><div className="logo-name">Подача заявки</div><div className="logo-sub">{svc.org}</div></div></div>
        </div>
        <div className="header-right" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Шаг {stepIdx + 1} из {steps.length}</div>
      </header>
      <div className="application-layout">
        <aside className="app-sidebar">
          <div className="app-sidebar-title">{svc.title}</div>
          <div className="app-sidebar-org">{svc.org}{svc.stage ? ` · Этап ${svc.stage}` : ''}</div>
          <div className="app-steps">
            {steps.map((s, i) => (
              <div key={s.id} className={`app-step ${i === stepIdx ? 'current' : i < stepIdx ? 'done' : ''}`}>
                <div className="app-step-circle">{i < stepIdx ? '✓' : i + 1}</div>
                <div className="app-step-label">{s.title}</div>
              </div>
            ))}
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <div className="progress-label">{pct}% заполнено</div>
        </aside>
        <div className="app-form-area">
          <h2 className="step-title-h">{curStep.title}</h2>
          {stepIdx === 0 && <p className="step-desc-p">Данные компании заполняются автоматически из eGov по введённому БИН</p>}
          {autofill && <div className="autofill-banner"><div className="spinner" />Загрузка данных из eGov...</div>}
          <div className="fields-grid">
            {curStep.fields.filter(f => isVis(f, computed)).map(f => (
              <FieldInput key={f.id} field={f} value={computed[f.id]} onChange={val => setVal(f.id, val)} />
            ))}
          </div>
          <div className="form-nav">
            {stepIdx > 0 && <button className="btn" onClick={() => setStepIdx(s => s - 1)}>← Назад</button>}
            <button className="btn btn-primary btn-lg" onClick={nextStep} disabled={loading}>
              {loading ? <><span className="spinner" /> Отправка в ЕИШ...</> : stepIdx < steps.length - 1 ? 'Далее →' : 'Подать заявку ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FieldInput: React.FC<{ field: SchemaField; value: unknown; onChange: (v: unknown) => void }> = ({ field, value, onChange }) => {
  const str = String(value ?? '');
  const cls = field.width === 'half' ? 'field-half' : 'field-full';
  const disabled = field.disabled || field.type === 'calculated';
  return (
    <div className={cls}>
      <label className="form-label">{field.label}{field.required && <span className="required"> *</span>}</label>
      {field.type === 'calculated' ? (
        <div className="calc-display">
          <span className="calc-value">{value !== undefined && value !== '' ? fmtCur(Number(value)) : '—'}</span>
          <span className="calc-tag">авторасчёт</span>
        </div>
      ) : field.type === 'radio' ? (
        <div className="radio-group">
          {(field.options || []).map(o => (
            <div key={o.v} className={`radio-option ${str === o.v ? 'selected' : ''}`} onClick={() => onChange(o.v)}>
              <div className="radio-dot" />{o.l}
            </div>
          ))}
        </div>
      ) : field.type === 'select' ? (
        <select className="form-control" value={str} disabled={disabled} onChange={e => onChange(e.target.value)}>
          <option value="">— Выберите —</option>
          {(field.options || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea className="form-control textarea" value={str} rows={4} placeholder="Опишите проект..." onChange={e => onChange(e.target.value)} />
      ) : field.type === 'file' ? (
        <div className="file-upload">
          <span style={{ fontSize: 20 }}>📎</span>
          <div><div style={{ fontSize: 13, fontWeight: 500 }}>Нажмите для загрузки</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>PDF · до 10 МБ</div></div>
          <input type="file" />
        </div>
      ) : field.type === 'currency' ? (
        <div className="currency-wrap">
          <input className="form-control" style={{ paddingRight: 24 }} value={str ? Number(str).toLocaleString('ru-KZ') : ''} placeholder="0" disabled={disabled}
            onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
            onInput={(e: React.FormEvent<HTMLInputElement>) => {
              if (field.id === 'bin') {
                const val = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                onChange(val);
              }
            }}
          />
          <span className="currency-suffix">₸</span>
          {field.hint && <div className="form-hint">{field.hint}</div>}
        </div>
      ) : (
        <input className="form-control" type={field.type === 'email' ? 'email' : 'text'} value={str} disabled={disabled} placeholder={field.type === 'iin_bin' ? '____________' : field.type === 'phone' ? '+7 (___) ___-__-__' : ''}
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
      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:5, fontSize:12, color:'var(--text-muted)', textAlign:'left' }}>
        <div>📧 Уведомление отправлено на email</div>
        <div>⏱ Срок рассмотрения: {svc.dur}</div>
        <div>📊 Статус можно отслеживать в личном кабинете</div>
      </div>
      <div className="eish-badge"><span style={{ color:'var(--success)', fontWeight:600 }}>✓ Передано в ЕИШ</span><span style={{ fontFamily:'monospace', color:'var(--text-muted)' }}>{svc.eish}</span></div>
      <button className="btn btn-primary" onClick={onDash}>← В личный кабинет</button>
    </div>
  </div>
);

// ---- LOGIN ----
const LoginPage: React.FC<{ onLogin: (u: User) => void; onAdminLogin: () => void }> = ({ onLogin, onAdminLogin }) => {
  const [iin, setIin] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = () => {
    if (iin.length !== 12) { setErr('ИИН должен содержать 12 цифр'); return; }
    if (pass.length < 3) { setErr('Пароль слишком короткий'); return; }
    setErr(''); setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ name: 'Сериков Алмас Бекович', iin }); }, 900);
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:600, marginBottom:4 }}>Вход в личный кабинет</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Единый портал поддержки бизнеса</div>
        </div>
        <div className="egov-row"><div className="egov-pill">eGov</div>Авторизация через портал egov.kz</div>
        <div className="form-group"><label className="form-label">ИИН <span className="required">*</span></label>
          <input className="form-control" maxLength={12} placeholder="____________" value={iin} onChange={e => setIin(e.target.value.replace(/\D/g,'').slice(0,12))} /></div>
        <div className="form-group"><label className="form-label">Пароль <span className="required">*</span></label>
          <input className="form-control" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        {err && <div className="form-error">⚠ {err}</div>}
        <button className="btn btn-primary btn-lg" style={{ width:'100%' }} onClick={submit} disabled={loading}>
          {loading ? <><span className="spinner" /> Подключение к eGov...</> : 'Войти через eGov'}
        </button>
        <div className="login-demo">Демо: любые 12 цифр + пароль от 3 символов</div>
        <div style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>
          Администратор? <span style={{ color:'var(--blue)', cursor:'pointer' }} onClick={onAdminLogin}>Войти в панель управления →</span>
        </div>
      </div>
    </div>
  );
};

// ---- ADMIN LOGIN ----
const AdminLoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (login === 'admin' && pass === 'baiterek2026') onLogin();
    else setErr('Неверный логин или пароль');
  };
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="admin-icon">⚙️</div>
          <div><div style={{ fontSize:15, fontWeight:600 }}>Панель администратора</div><div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Только для уполномоченных сотрудников</div></div>
        </div>
        <div className="admin-notice">Доступ ограничен. Войдите с корпоративными данными Холдинга «Байтерек».</div>
        <div className="form-group"><label className="form-label">Логин <span className="required">*</span></label>
          <input className="form-control" placeholder="admin@baiterek.kz" value={login} onChange={e => setLogin(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Пароль <span className="required">*</span></label>
          <input className="form-control" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        {err && <div className="form-error">⚠ {err}</div>}
        <button className="btn btn-primary" style={{ width:'100%' }} onClick={submit}>Войти</button>
        <div className="login-demo">Демо: логин <strong>admin</strong> · пароль <strong>baiterek2026</strong></div>
      </div>
    </div>
  );
};

// ---- DASHBOARD ----
const DashPage: React.FC<{ user: User; apps: AppRecord[]; onGoService: (i:number)=>void; onGoCatalog:()=>void }> = ({ user, apps, onGoService, onGoCatalog }) => (
  <div style={{ overflowY:'auto' }}>
    <div style={{ background:'linear-gradient(135deg,#0c447c,#185fa5)', padding:'22px 28px' }}>
      <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginBottom:4 }}>Личный кабинет</div>
      <div style={{ fontSize:20, fontWeight:600, color:'#fff', marginBottom:3 }}>{user.name}</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>Холдинг «Байтерек» · Единый портал</div>
      <div style={{ display:'flex', gap:12, marginTop:14 }}>
        <div style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, padding:'8px 18px', textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:600, color:'var(--gold)' }}>{apps.length}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.55)' }}>Заявок</div>
        </div>
        <div style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, padding:'8px 18px', textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:600, color:'var(--gold)' }}>70+</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.55)' }}>Мер поддержки</div>
        </div>
      </div>
    </div>
    <div className="section">
      <div className="section-header"><div className="section-title">Доступные услуги</div><div className="section-link" onClick={onGoCatalog}>Каталог →</div></div>
      <div className="services-grid">
        {SERVICES.slice(0,4).map((s,i) => (
          <div className="service-card" key={i} onClick={() => onGoService(i)}>
            <div className="service-org">{s.org}{s.stage?` · Этап ${s.stage}`:''}</div>
            <div className="service-title">{s.title}</div>
            <div className="service-arrow">Подать заявку →</div>
          </div>
        ))}
      </div>
    </div>
    {apps.length > 0 && (
      <div className="section" style={{ paddingTop:0 }}>
        <div className="section-title" style={{ marginBottom:12 }}>Мои заявки</div>
        {apps.map(a => (
          <div key={a.id} style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:8, padding:'11px 14px', display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{a.title}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace', marginTop:2 }}>{a.id}</div>
            </div>
            <span className="badge badge-blue">Подана</span>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{a.date}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ---- ADMIN PANEL ----
type AdminTab = 'dashboard'|'constructor'|'services'|'applications'|'users'|'content'|'news'|'logs';
const AdminPanel: React.FC<{ hdrRight: React.ReactNode; apps: AppRecord[]; user: User|null }> = ({ hdrRight, apps, user }) => {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const navItems: { tab: AdminTab; label: string; icon: string; section?: string }[] = [
    { tab:'dashboard', label:'Дашборд', icon:'◈', section:'Обзор' },
    { tab:'constructor', label:'Конструктор форм', icon:'⊞', section:'Услуги' },
    { tab:'services', label:'Список услуг', icon:'☰' },
    { tab:'applications', label:'Заявки', icon:'◫', section:'Заявки' },
    { tab:'users', label:'Пользователи', icon:'⊙', section:'Система' },
    { tab:'content', label:'Страницы', icon:'✎', section:'Контент' },
    { tab:'news', label:'Новости', icon:'◉' },
    { tab:'logs', label:'Журнал', icon:'≡' },
  ];
  return (
    <div className="app-layout" style={{ height:'100vh' }}>
      <header className="app-header">
        <div className="header-left">
          <div className="logo"><div className="logo-mark">Б</div><div><div className="logo-name">Байтерек</div><div className="logo-sub">Панель администратора</div></div></div>
        </div>
        <div className="header-right">{hdrRight}</div>
      </header>
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <nav className="admin-sidebar">
          {navItems.map((item, i) => (
            <React.Fragment key={item.tab}>
              {item.section && <div className="admin-nav-section">{item.section}</div>}
              <button className={`admin-nav-item ${tab === item.tab ? 'active' : ''}`} onClick={() => setTab(item.tab)}>
                <span style={{ width:20, textAlign:'center' }}>{item.icon}</span>{item.label}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="admin-main">
          {tab === 'dashboard' && <AdminDashboard apps={apps} user={user} />}
          {tab === 'constructor' && <AdminConstructor />}
          {tab === 'services' && <AdminServices />}
          {tab === 'applications' && <AdminApplications apps={apps} user={user} />}
          {tab === 'users' && <AdminUsers user={user} />}
          {(tab === 'content' || tab === 'news' || tab === 'logs') && (
            <div><div className="admin-page-title">{{ content:'Управление страницами', news:'Новости', logs:'Журнал действий' }[tab]}</div>
              <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:12, padding:24, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Раздел в разработке</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ apps: AppRecord[]; user: User|null }> = ({ apps, user }) => (
  <div>
    <div className="admin-page-title">Дашборд</div>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-card-label">Заявок подано</div><div className="stat-card-value" style={{color:'var(--info)'}}>{apps.length}</div><div className="stat-card-sub">через портал</div></div>
      <div className="stat-card"><div className="stat-card-label">Услуг опубликовано</div><div className="stat-card-value" style={{color:'var(--success)'}}>{SERVICES.length}</div><div className="stat-card-sub">из 70+ планируемых</div></div>
      <div className="stat-card"><div className="stat-card-label">Пользователей</div><div className="stat-card-value" style={{color:'var(--warning)'}}>{user ? 1 : 0}</div><div className="stat-card-sub">зарегистрировано</div></div>
      <div className="stat-card"><div className="stat-card-label">Статус ЕИШ</div><div className="stat-card-value" style={{color:'var(--success)',fontSize:14}}>● Онлайн</div><div className="stat-card-sub">Mock режим</div></div>
    </div>
    <div className="table-wrap">
      <div className="table-header"><div className="table-title">Последние заявки</div></div>
      <table className="data-table">
        <thead><tr><th>Номер</th><th>Услуга</th><th>Статус</th><th>Дата</th></tr></thead>
        <tbody>
          {apps.length ? apps.map(a => (
            <tr key={a.id}>
              <td style={{fontFamily:'monospace'}}>{a.id}</td>
              <td>{a.title.slice(0,35)}...</td>
              <td><span className="badge badge-blue">Подана</span></td>
              <td>{a.date}</td>
            </tr>
          )) : <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text-muted)',padding:20}}>Заявок пока нет</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const AdminServices: React.FC = () => (
  <div>
    <div className="admin-page-title">Список услуг</div>
    <div className="table-wrap">
      <div className="table-header"><div className="table-title">Каталог услуг</div><button className="btn btn-xs btn-primary">+ Создать</button></div>
      <table className="data-table">
        <thead><tr><th>Название</th><th>Организация</th><th>Категория</th><th>Статус</th></tr></thead>
        <tbody>
          {SERVICES.map((s,i) => (
            <tr key={i}>
              <td style={{fontWeight:500}}>{s.title.slice(0,40)}...</td>
              <td>{s.org}</td>
              <td><span className="badge badge-blue">{s.cat}</span></td>
              <td><span className="badge badge-green">Опубликована</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AdminApplications: React.FC<{ apps: AppRecord[]; user: User|null }> = ({ apps, user }) => (
  <div>
    <div className="admin-page-title">Заявки</div>
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Номер</th><th>Услуга</th><th>Пользователь</th><th>Статус</th><th>Дата</th></tr></thead>
        <tbody>
          {apps.length ? apps.map(a => (
            <tr key={a.id}>
              <td style={{fontFamily:'monospace'}}>{a.id}</td>
              <td>{a.title.slice(0,30)}...</td>
              <td>{user?.name || '—'}</td>
              <td><span className="badge badge-blue">Подана</span></td>
              <td>{a.date}</td>
            </tr>
          )) : <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-muted)',padding:20}}>Заявок нет</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const AdminUsers: React.FC<{ user: User|null }> = ({ user }) => (
  <div>
    <div className="admin-page-title">Пользователи</div>
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>ФИО / Логин</th><th>ИИН</th><th>Роль</th><th>Статус</th></tr></thead>
        <tbody>
          <tr><td style={{fontWeight:500}}>admin@baiterek.kz</td><td>—</td><td><span className="badge badge-red">Администратор</span></td><td><span className="badge badge-green">Активен</span></td></tr>
          {user && <tr><td style={{fontWeight:500}}>{user.name}</td><td style={{fontFamily:'monospace'}}>{user.iin}</td><td><span className="badge badge-blue">Пользователь</span></td><td><span className="badge badge-green">Активен</span></td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

// ---- CONSTRUCTOR ----
const FTYPES = [
  {t:'text',i:'T',l:'Текст'},{t:'number',i:'#',l:'Число'},{t:'currency',i:'₸',l:'Сумма'},
  {t:'iin_bin',i:'ID',l:'ИИН/БИН'},{t:'phone',i:'☏',l:'Телефон'},{t:'email',i:'@',l:'Email'},
  {t:'select',i:'▾',l:'Список'},{t:'radio',i:'◉',l:'Выбор'},{t:'date',i:'📅',l:'Дата'},
  {t:'textarea',i:'≡',l:'Textarea'},{t:'file',i:'📎',l:'Файл'},{t:'calculated',i:'∑',l:'Расчётное'},
];

const AdminConstructor: React.FC = () => {
  const [schema, setSchema] = useState({ title: 'Лизинг — I Этап', eish: '/api/eish/brk/stage1', steps: LEASING_SCHEMA.map(s => ({ ...s, fields: [...s.fields] })) });
  const [stepIdx, setStepIdx] = useState(0);
  const [activeId, setActiveId] = useState<string|null>(null);
  const [showJson, setShowJson] = useState(false);
  const [saved, setSaved] = useState(false);
  const [propTab, setPropTab] = useState<'props'|'logic'|'val'>('props');

  const curStep = schema.steps[stepIdx];
  const activeField = curStep?.fields.find(f => f.id === activeId) ?? null;

  const addField = (type: string) => {
    const ft = FTYPES.find(t => t.t === type);
    const nf: SchemaField = { id:'f'+Date.now(), type, label:`${ft?.l} (новое)`, required:false, width:'half' };
    if (type==='select'||type==='radio') nf.options=[{v:'opt1',l:'Вариант 1'},{v:'opt2',l:'Вариант 2'}];
    if (type==='calculated') nf.formula='';
    setSchema(s => ({ ...s, steps: s.steps.map((st,i) => i===stepIdx ? {...st, fields:[...st.fields, nf]} : st) }));
    setActiveId(nf.id);
  };

  const updateField = (id: string, upd: Partial<SchemaField>) => {
    setSchema(s => ({ ...s, steps: s.steps.map((st,i) => i===stepIdx ? {...st, fields: st.fields.map(f => f.id===id ? {...f,...upd} : f)} : st) }));
  };

  const deleteField = (id: string) => {
    setSchema(s => ({ ...s, steps: s.steps.map((st,i) => i===stepIdx ? {...st, fields: st.fields.filter(f => f.id!==id)} : st) }));
    setActiveId(null);
  };

  const moveField = (id: string, dir: -1|1) => {
    setSchema(s => ({ ...s, steps: s.steps.map((st,i) => {
      if (i!==stepIdx) return st;
      const fields=[...st.fields];
      const idx=fields.findIndex(f=>f.id===id);
      if(idx<0||idx+dir<0||idx+dir>=fields.length) return st;
      [fields[idx],fields[idx+dir]]=[fields[idx+dir],fields[idx]];
      return {...st,fields};
    })}));
  };

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div className="admin-page-title" style={{marginBottom:0}}>Конструктор форм</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span className="save-toast">✓ Сохранено</span>}
          <button className="btn btn-sm" onClick={()=>setShowJson(!showJson)}>{showJson?'Скрыть JSON':'JSON схема'}</button>
          <button className="btn btn-sm btn-primary" onClick={save}>💾 Сохранить</button>
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
          <div className="palette-section">Услуга</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <div><div className="prop-label">Название</div><input className="form-control" value={schema.title} onChange={e=>setSchema(s=>({...s,title:e.target.value}))} style={{fontSize:11}} /></div>
            <div><div className="prop-label">ЕИШ endpoint</div><input className="form-control" value={schema.eish} onChange={e=>setSchema(s=>({...s,eish:e.target.value}))} style={{fontSize:11}} /></div>
          </div>
        </div>
        {/* Canvas */}
        <div className="con-canvas">
          <div className="steps-tabs">
            {schema.steps.map((st,i) => (
              <button key={st.id} className={`step-tab ${i===stepIdx?'active':''}`} onClick={()=>{setStepIdx(i);setActiveId(null);}}>
                {i+1}. {st.title}<span className="step-tab-count">{st.fields.length}</span>
              </button>
            ))}
            <button className="btn btn-xs" style={{marginLeft:4}} onClick={()=>{
              setSchema(s=>({...s,steps:[...s.steps,{id:'s'+Date.now(),title:`Шаг ${s.steps.length+1}`,fields:[]}]}));
              setStepIdx(schema.steps.length);
            }}>+ Шаг</button>
          </div>
          <div className="step-edit-bar">
            <input className="step-title-input" value={curStep?.title||''} onChange={e=>setSchema(s=>({...s,steps:s.steps.map((st,i)=>i===stepIdx?{...st,title:e.target.value}:st)}))} />
          </div>
          {showJson ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',background:'#0f1929',margin:10,borderRadius:8,overflow:'hidden'}}>
              <div style={{padding:'8px 12px',background:'#1a2540',fontSize:11,color:'#94a3b8',borderBottom:'1px solid #2a3550',display:'flex',justifyContent:'space-between'}}>
                <span>JSON схема</span><span style={{fontSize:10}}>{schema.steps.reduce((a,s)=>a+s.fields.length,0)} полей</span>
              </div>
              <pre className="json-preview-box">{JSON.stringify(schema,null,2)}</pre>
            </div>
          ) : (
            <div className="fields-list">
              {curStep?.fields.length === 0 ? (
                <div className="fields-empty"><div style={{fontSize:24,opacity:.3}}>⊕</div>Нажмите на тип поля слева, чтобы добавить</div>
              ) : curStep?.fields.map((f,i) => {
                const ft = FTYPES.find(t=>t.t===f.type)||{i:'?',l:f.type};
                return (
                  <div key={f.id} className={`field-card ${activeId===f.id?'active':''} ${f.cond?'has-cond':''}`} onClick={()=>setActiveId(f.id===activeId?null:f.id)}>
                    <div className="field-icon">{ft.i}</div>
                    <div className="field-info">
                      <div className="field-label">{f.label}</div>
                      <div className="field-tags">
                        <span className="field-type-text">{ft.l}</span>
                        {f.required && <span className="field-tag tag-required">обяз.</span>}
                        {f.cond && <span className="field-tag tag-cond">⚡ условие</span>}
                        {f.type==='calculated'&&f.formula && <span className="field-tag tag-formula">∑ {f.formula}</span>}
                        {f.hasEgov && <span className="field-tag tag-egov">eGov</span>}
                      </div>
                    </div>
                    <div className="field-actions" onClick={e=>e.stopPropagation()}>
                      {i>0 && <button className="icon-btn" onClick={()=>moveField(f.id,-1)}>↑</button>}
                      {i<curStep.fields.length-1 && <button className="icon-btn" onClick={()=>moveField(f.id,1)}>↓</button>}
                      <button className="icon-btn danger" onClick={()=>deleteField(f.id)}>✕</button>
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
              <button className="btn btn-xs btn-danger" onClick={()=>deleteField(activeField.id)}>Удалить</button>
            </div>
            <div className="props-tabs">
              {(['props','logic','val'] as const).map(t => (
                <button key={t} className={`props-tab ${propTab===t?'active':''}`} onClick={()=>setPropTab(t)}>
                  {{props:'Поле',logic:'Логика',val:'Валидация'}[t]}
                </button>
              ))}
            </div>
            <div className="props-body">
              {propTab==='props' && (
                <>
                  <div className="prop-row"><div className="prop-label">Название поля</div><input className="form-control" value={activeField.label} onChange={e=>updateField(activeField.id,{label:e.target.value})} /></div>
                  <div className="prop-row"><div className="prop-label">Ширина</div>
                    <select className="form-control" value={activeField.width||'full'} onChange={e=>updateField(activeField.id,{width:e.target.value})}>
                      <option value="full">Полная</option><option value="half">Половина</option>
                    </select>
                  </div>
                  <div className="check-row"><input type="checkbox" checked={!!activeField.required} onChange={e=>updateField(activeField.id,{required:e.target.checked})} /><label>Обязательное</label></div>
                  <div className="check-row"><input type="checkbox" checked={!!activeField.disabled} onChange={e=>updateField(activeField.id,{disabled:e.target.checked})} /><label>Только чтение</label></div>
                  {activeField.type==='calculated' && (
                    <div className="prop-row"><div className="prop-label">Формула</div>
                      <input className="form-control" style={{fontFamily:'monospace',fontSize:12}} value={activeField.formula||''} placeholder="asset_cost*0.2" onChange={e=>updateField(activeField.id,{formula:e.target.value})} />
                      <div className="form-hint">Используйте id полей: asset_cost, adv_pct...</div>
                    </div>
                  )}
                  {activeField.options && (
                    <>
                      <div className="prop-label" style={{marginTop:4}}>Варианты</div>
                      {activeField.options.map((o,i) => (
                        <div key={i} className="option-row">
                          <input className="form-control" value={o.l} onChange={e=>{const opts=[...(activeField.options||[])];opts[i]={...opts[i],l:e.target.value};updateField(activeField.id,{options:opts});}} />
                          <button className="icon-btn danger" onClick={()=>{const opts=(activeField.options||[]).filter((_,j)=>j!==i);updateField(activeField.id,{options:opts});}}>✕</button>
                        </div>
                      ))}
                      <button className="btn btn-ghost btn-xs" onClick={()=>{const opts=[...(activeField.options||[])];opts.push({v:'opt'+(opts.length+1),l:'Вариант '+(opts.length+1)});updateField(activeField.id,{options:opts});}}>+ Вариант</button>
                    </>
                  )}
                </>
              )}
              {propTab==='logic' && (
                <>
                  <div style={{fontSize:12,color:'var(--text-muted)',padding:8,background:'var(--blue-light)',borderRadius:6,lineHeight:1.5}}>Поле показывается только при выполнении условия</div>
                  {activeField.cond ? (
                    <div style={{padding:10,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,display:'flex',flexDirection:'column',gap:7}}>
                      <div className="prop-label" style={{color:'var(--info)'}}>Показать если:</div>
                      <select className="form-control" value={activeField.cond.fieldId} onChange={e=>updateField(activeField.id,{cond:{...activeField.cond!,fieldId:e.target.value}})}>
                        {curStep.fields.filter(f=>f.id!==activeField.id).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{fontSize:12,color:'var(--text-muted)',whiteSpace:'nowrap'}}>равно</span>
                        <input className="form-control" value={activeField.cond.value} onChange={e=>updateField(activeField.id,{cond:{...activeField.cond!,value:e.target.value}})} />
                      </div>
                      <button className="btn btn-xs btn-danger" onClick={()=>updateField(activeField.id,{cond:undefined})}>Удалить правило</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm" onClick={()=>{
                      const other=curStep.fields.find(f=>f.id!==activeField.id);
                      updateField(activeField.id,{cond:{fieldId:other?.id||'',value:''}});
                    }}>+ Добавить условие показа</button>
                  )}
                </>
              )}
              {propTab==='val' && (
                <>
                  <div className="check-row"><input type="checkbox" checked={!!activeField.required} onChange={e=>updateField(activeField.id,{required:e.target.checked})} /><label>Обязательное поле</label></div>
                  <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Дополнительные правила валидации добавляются здесь</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
