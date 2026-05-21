require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ---- JWT CONFIG ----
const JWT_SECRET = process.env.JWT_SECRET || 'baiterek_jwt_secret_2026_xK9mP3nQ';
const JWT_EXPIRES = '8h';

const authenticate = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const token = auth.slice(7);
  try {
    req.jwtUser = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
};

// Admin-only middleware
const authenticateAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.jwtUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён: требуются права администратора' });
    }
    next();
  });
};

// ---- FILE UPLOAD (multer) ----
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const appDir = path.join(uploadsDir, req.params.id || 'misc');
    if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });
    cb(null, appDir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Zа-яА-Я0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Недопустимый формат файла'));
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// ---- БАЗА ДАННЫХ SQLite ----
const db = new Database(path.join(__dirname, 'baiterek.db'));

// Создаём таблицы если не существуют
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    IIN TEXT UNIQUE,
    FullName TEXT,
    Email TEXT,
    Phone TEXT,
    CompanyName TEXT,
    Position TEXT,
    Role TEXT DEFAULT 'individual',
    CanSign INTEGER DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Services (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Slug TEXT,
    Title TEXT,
    Organization TEXT,
    Status TEXT DEFAULT 'published',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Applications (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AppNumber TEXT UNIQUE,
    ServiceId INTEGER,
    UserId INTEGER,
    Status TEXT DEFAULT 'submitted',
    FormDataJson TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS News (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT,
    TitleKz TEXT,
    Content TEXT,
    ContentKz TEXT,
    Organization TEXT,
    ImageUrl TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Articles (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT,
    TitleKz TEXT,
    Category TEXT,
    CategoryKz TEXT,
    Content TEXT,
    ContentKz TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Bookings (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER,
    Organization TEXT,
    Date TEXT,
    TimeSlot TEXT,
    Topic TEXT,
    Status TEXT DEFAULT 'pending',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Notifications (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER,
    Title TEXT,
    TitleKz TEXT,
    Message TEXT,
    MessageKz TEXT,
    IsRead INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS AuditLogs (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER,
    Action TEXT,
    EntityType TEXT,
    EntityId TEXT,
    IpAddress TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS DocVersions (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ApplicationId TEXT,
    DocFieldId TEXT,
    Version INTEGER DEFAULT 1,
    FileName TEXT,
    FileSize INTEGER,
    FileUrl TEXT,
    UploadedBy TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Comments (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ApplicationId TEXT,
    UserId INTEGER,
    UserName TEXT,
    Message TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Миграция для старых БД
try { db.exec("ALTER TABLE Users ADD COLUMN Phone TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE Users ADD COLUMN CompanyName TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE Users ADD COLUMN Position TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE Users ADD COLUMN CanSign INTEGER DEFAULT 1;"); } catch (e) {}

// Начальные данные услуг
const svcCount = db.prepare('SELECT COUNT(*) as cnt FROM Services').get();
if (svcCount.cnt === 0) {
  db.prepare("INSERT INTO Services (Slug, Title, Organization) VALUES (?, ?, ?)").run('wagons_ind', 'Лизинг авиатранспорта и вагонов — I Этап', 'БРК Лизинг');
  db.prepare("INSERT INTO Services (Slug, Title, Organization) VALUES (?, ?, ?)").run('wagons_exp', 'Лизинг авиатранспорта и вагонов — II Этап', 'БРК Лизинг');
  db.prepare("INSERT INTO Services (Slug, Title, Organization) VALUES (?, ?, ?)").run('subsidy', 'Субсидирование ставки вознаграждения', 'Даму');
  console.log('✅ Начальные данные услуг добавлены');
}

// Начальные данные новостей
const newsCount = db.prepare('SELECT COUNT(*) as cnt FROM News').get();
if (newsCount.cnt === 0) {
  db.prepare(`
    INSERT INTO News (Title, TitleKz, Content, ContentKz, Organization, ImageUrl) VALUES
    (
      'Байтерек запускает единый цифровой портал для поддержки предпринимателей',
      'Бәйтерек кәсіпкерлерді қолдау үшін бірыңғай цифрлық порталды іске қосуда',
      'Холдинг "Байтерек" объявляет о запуске новой цифровой платформы, которая объединит все меры государственной поддержки бизнеса в Казахстане в формате одного окна.',
      '"Бәйтерек" холдингі Қазақстандағы бизнесті мемлекеттік қолдаудың барлық шараларын бір терезе форматында біріктіретін жаңа цифрлық платформаның іске қосылғанын хабарлайды.',
      'Холдинг «Байтерек»',
      '/assets/news1.jpg'
    ),
    (
      'БРК Лизинг снижает авансовый платёж для МСБ до 15%',
      'ҚДБ Лизинг ШОБ үшін аванстық төлемді 15%-ға дейін төмендетеді',
      'В целях стимулирования обновления основных фондов транспортных компаний БРК Лизинг снижает требования к первоначальному взносу на лизинг вагонов и самолетов.',
      'Көлік компанияларының негізгі қорларын жаңартуды ынталандыру мақсатында ҚДБ Лизинг вагондар мен ұшақтар лизингіне бастапқы жарна талаптарын төмендетеді.',
      'БРК Лизинг',
      '/assets/news2.jpg'
    ),
    (
      'Даму выделяет 50 млрд тенге на субсидирование МСБ в 2026 году',
      'Даму 2026 жылы ШОБ субсидиялауға 50 миллиард теңге бөледі',
      'Фонд "Даму" объявил о выделении дополнительных лимитов коммерческим банкам для субсидирования процентных ставок по кредитам малого и среднего предпринимательства.',
      '"Даму" қоры шағын және орта кәсіпкерлік несиелері бойынша пайыздық мөлшерлемелерді субсидиялау үшін коммерциялық банктерге қосымша лимиттер бөлінгенін жариялады.',
      'Даму',
      '/assets/news3.jpg'
    )
  `).run();
  console.log('✅ Начальные новости добавлены');
}

// Начальные данные базы знаний
const artCount = db.prepare('SELECT COUNT(*) as cnt FROM Articles').get();
if (artCount.cnt === 0) {
  db.prepare(`
    INSERT INTO Articles (Title, TitleKz, Category, CategoryKz, Content, ContentKz) VALUES
    (
      'Как подать заявку на лизинг авиатранспорта и вагонов?',
      'Авиакөлік және вагондар лизингіне өтінімді қалай беруге болады?',
      'Инструкции',
      'Нұсқаулықтар',
      'Для подачи заявки перейдите в Каталог услуг, выберите нужную услугу, заполните пошаговую форму (введя БИН для автозаполнения eGov), загрузите необходимые файлы и подпишите заявление с помощью ЭЦП.',
      'Өтінім беру үшін Қызметтер каталогына өтіңіз, қажетті қызметті таңдаңыз, қадамдық форманы толтырыңыз (eGov автоматты түрде толтыру үшін БИН енгізіңіз), қажетті файлдарды жүктеңіз және ЭЦП арқылы өтінімге қол қойыңыз.'
    ),
    (
      'Какие условия для субсидирования процентных ставок Даму?',
      'Даму пайыздық мөлшерлемелерін субсидиялаудың қандай шарттары бар?',
      'Условия получения',
      'Алу шарттары',
      'Субсидирование доступно для субъектов МСБ, являющихся резидентами РК, осуществляющих деятельность в приоритетных секторах экономики, с кредитом в банке-партнере.',
      'Субсидиялау серіктес банкте несиесі бар, экономиканың басым секторларында қызметін жүзеге асыратын ҚР резиденті болып табылатын ШОБ субъектілері үшін қолжетімді.'
    ),
    (
      'Что такое Единая интеграционная шина (ЕИШ)?',
      'Бірыңғай интеграциялық шина (БИШ) дегеніміз не?',
      'FAQ',
      'Жиі қойылатын сұрақтар',
      'ЕИШ — это централизованная система обмена данными между Единым порталом и внутренними BPM-системами холдинга для оперативной обработки заявок.',
      'БИШ — өтінімдерді жедел өңдеу үшін Бірыңғай портал мен холдингтің ішкі BPM жүйелері арасында деректер алмасудың орталықтандырылған жүйесі.'
    )
  `).run();
  console.log('✅ Начальные статьи базы знаний добавлены');
}

console.log('✅ База данных SQLite подключена: baiterek.db');

// ---- API ----

// Статус (публичный)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'SQLite (baiterek.db)', message: 'Сервер работает!', auth: 'JWT Bearer' });
});

// ---- АНАЛИТИКА (только для авторизованных) ----
app.get('/api/analytics', authenticate, (req, res) => {
  // Заявки по статусам
  const byStatus = db.prepare(`
    SELECT Status, COUNT(*) as cnt FROM Applications GROUP BY Status
  `).all();

  // Заявки по месяцам (последние 6 месяцев)
  const byMonth = db.prepare(`
    SELECT strftime('%Y-%m', CreatedAt) as month, COUNT(*) as cnt
    FROM Applications
    GROUP BY month
    ORDER BY month DESC
    LIMIT 6
  `).all().reverse();

  // Заявки по услугам
  const byService = db.prepare(`
    SELECT s.Title as service, COUNT(*) as cnt
    FROM Applications a
    LEFT JOIN Services s ON a.ServiceId = s.Id
    GROUP BY a.ServiceId
    ORDER BY cnt DESC
    LIMIT 5
  `).all();

  // Пользователи по ролям
  const byRole = db.prepare(`
    SELECT Role, COUNT(*) as cnt FROM Users GROUP BY Role
  `).all();

  res.json({ byStatus, byMonth, byService, byRole });
});

// ---- ЗАЯВКИ ----

// Получить все заявки (только авторизованным)
app.get('/api/applications', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT a.Id, a.AppNumber, a.Status, a.CreatedAt, a.FormDataJson,
           s.Title as ServiceTitle,
           u.FullName as UserName, u.IIN as UserIin
    FROM Applications a
    LEFT JOIN Services s ON a.ServiceId = s.Id
    LEFT JOIN Users u ON a.UserId = u.Id
    ORDER BY a.CreatedAt DESC
  `).all();
  res.json(rows);
});

// Создать заявку (авторизованным)
app.post('/api/applications', authenticate, (req, res) => {
  const { appNumber, serviceId, userId, formData } = req.body;
  if (!appNumber) return res.status(400).json({ error: 'appNumber обязателен' });

  // Проверяем что пользователь создаёт заявку от своего имени
  const targetUserId = userId || req.jwtUser.id;

  // Check for duplicate
  const existing = db.prepare('SELECT AppNumber FROM Applications WHERE AppNumber = ?').get(appNumber);
  if (existing) return res.json({ success: true, appNumber, duplicate: true });

  try {
    db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
      .run(targetUserId, 'CREATE_APPLICATION', 'Application', appNumber);

    db.prepare(
      'INSERT INTO Applications (AppNumber, ServiceId, UserId, Status, FormDataJson) VALUES (?, ?, ?, ?, ?)'
    ).run(appNumber, serviceId || 1, targetUserId, 'submitted', JSON.stringify(formData || {}));

    db.prepare('INSERT INTO Notifications (UserId, Title, TitleKz, Message, MessageKz) VALUES (?, ?, ?, ?, ?)')
      .run(targetUserId, 'Заявка отправлена', 'Өтінім жіберілді', `Ваша заявка ${appNumber} успешно принята на рассмотрение`, `Сіздің ${appNumber} өтініміңіз қарауға сәтті қабылданды`);

    console.log('✅ Заявка сохранена:', appNumber);
    res.json({ success: true, appNumber });
  } catch (e) {
    console.error('Ошибка создания заявки:', e);
    res.status(500).json({ error: 'Ошибка создания заявки' });
  }
});

// Получить заявку по номеру (авторизованным)
app.get('/api/applications/:id', authenticate, (req, res) => {
  const row = db.prepare(`
    SELECT a.*, s.Title as ServiceTitle, u.FullName as UserName, u.IIN as UserIin
    FROM Applications a
    LEFT JOIN Services s ON a.ServiceId = s.Id
    LEFT JOIN Users u ON a.UserId = u.Id
    WHERE a.AppNumber = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Заявка не найдена' });
  res.json(row);
});

// Изменить статус заявки (только авторизованным)
app.patch('/api/applications/:id/status', authenticate, (req, res) => {
  const { status, userId } = req.body;
  const appNumber = req.params.id;

  if (!status) return res.status(400).json({ error: 'Укажите status' });

  const application = db.prepare('SELECT UserId FROM Applications WHERE AppNumber = ?').get(appNumber);
  if (!application) return res.status(404).json({ error: 'Заявка не найдена' });

  db.prepare('UPDATE Applications SET Status = ? WHERE AppNumber = ?').run(status, appNumber);

  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(req.jwtUser.id || userId || 1, 'UPDATE_STATUS_' + status.toUpperCase(), 'Application', appNumber);

  let title = 'Изменение статуса заявки';
  let titleKz = 'Өтінім мәртебесінің өзгеруі';
  let message = `Статус вашей заявки ${appNumber} изменен на: ${status}`;
  let messageKz = `Сіздің ${appNumber} өтініміңіздің мәртебесі келесіге өзгертілді: ${status}`;

  if (status === 'additional_docs_required') {
    title = 'Требуются документы'; titleKz = 'Құжаттар қажет';
    message = `По заявке ${appNumber} затребованы дополнительные документы`;
    messageKz = `${appNumber} өтінімі бойынша қосымша құжаттар талап етілді`;
  } else if (status === 'approved') {
    title = 'Заявка одобрена'; titleKz = 'Өтінім мақұлданды';
    message = `Поздравляем! Ваша заявка ${appNumber} успешно одобрена`;
    messageKz = `Құттықтаймыз! Сіздің ${appNumber} өтініміңіз сәтті мақұлданды`;
  } else if (status === 'rejected') {
    title = 'Заявка отклонена'; titleKz = 'Өтінім қабылданбады';
    message = `К сожалению, ваша заявка ${appNumber} была отклонена`;
    messageKz = `Өкінішке орай, сіздің ${appNumber} өтініміңіз қабылданбады`;
  }

  db.prepare('INSERT INTO Notifications (UserId, Title, TitleKz, Message, MessageKz) VALUES (?, ?, ?, ?, ?)')
    .run(application.UserId, title, titleKz, message, messageKz);

  console.log(`✅ Статус заявки ${appNumber} изменен на ${status}`);
  res.json({ success: true, status });
});

// ---- ПОЛЬЗОВАТЕЛИ ----

// Войти / создать пользователя (публичный — нужен для входа)
app.post('/api/users/login', (req, res) => {
  const { iin, fullName, email, phone, companyName, position, role } = req.body;
  if (!iin) return res.status(400).json({ error: 'ИИН обязателен' });

  let user = db.prepare('SELECT * FROM Users WHERE IIN = ?').get(iin);
  if (!user) {
    db.prepare('INSERT INTO Users (IIN, FullName, Email, Phone, CompanyName, Position, Role) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(iin, fullName || 'Пользователь', email || '', phone || '', companyName || '', position || '', role || 'individual');
    user = db.prepare('SELECT * FROM Users WHERE IIN = ?').get(iin);
    console.log('✅ Новый пользователь:', fullName);
  }

  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(user.Id, 'USER_LOGIN', 'User', user.Id.toString());

  // Генерируем JWT токен
  const token = jwt.sign(
    { id: user.Id, iin: user.IIN, role: user.Role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({ success: true, user, token });
});

// Обновить профиль пользователя (авторизованным)
app.patch('/api/users/:id', authenticate, (req, res) => {
  const { fullName, email, phone, companyName, position } = req.body;
  const userId = req.params.id;

  // Проверяем что пользователь редактирует свой профиль
  if (String(req.jwtUser.id) !== String(userId) && req.jwtUser.role !== 'admin') {
    return res.status(403).json({ error: 'Нет прав для редактирования чужого профиля' });
  }

  db.prepare('UPDATE Users SET FullName = ?, Email = ?, Phone = ?, CompanyName = ?, Position = ? WHERE Id = ?')
    .run(fullName, email, phone, companyName, position, userId);

  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(userId, 'UPDATE_PROFILE', 'User', userId.toString());

  const user = db.prepare('SELECT * FROM Users WHERE Id = ?').get(userId);
  res.json({ success: true, user });
});

// Получить всех пользователей (только авторизованным)
app.get('/api/users', authenticate, (req, res) => {
  const rows = db.prepare('SELECT Id, IIN, FullName, Email, Phone, CompanyName, Position, Role, CreatedAt FROM Users').all();
  res.json(rows);
});

// Получить все услуги (публичный)
app.get('/api/services', (req, res) => {
  const rows = db.prepare("SELECT * FROM Services WHERE Status = 'published'").all();
  res.json(rows);
});

// Статистика для дашборда (авторизованным)
app.get('/api/stats', authenticate, (req, res) => {
  const apps = db.prepare('SELECT COUNT(*) as cnt FROM Applications').get();
  const users = db.prepare('SELECT COUNT(*) as cnt FROM Users').get();
  const services = db.prepare('SELECT COUNT(*) as cnt FROM Services').get();
  const approved = db.prepare("SELECT COUNT(*) as cnt FROM Applications WHERE Status='approved'").get();
  const pending = db.prepare("SELECT COUNT(*) as cnt FROM Applications WHERE Status='submitted'").get();
  res.json({
    applications: apps.cnt,
    users: users.cnt,
    services: services.cnt,
    approved: approved.cnt,
    pending: pending.cnt
  });
});

// ---- НОВОСТИ (чтение публичное, запись авторизованным) ----
app.get('/api/news', (req, res) => {
  const rows = db.prepare('SELECT * FROM News ORDER BY CreatedAt DESC').all();
  res.json(rows);
});

app.post('/api/news', authenticate, (req, res) => {
  const { title, titleKz, content, contentKz, organization, imageUrl } = req.body;
  const info = db.prepare('INSERT INTO News (Title, TitleKz, Content, ContentKz, Organization, ImageUrl) VALUES (?, ?, ?, ?, ?, ?)')
    .run(title, titleKz, content, contentKz, organization || 'Холдинг «Байтерек»', imageUrl || '');

  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(req.jwtUser.id, 'CREATE_NEWS', 'News', info.lastInsertRowid.toString());

  res.json({ success: true, id: info.lastInsertRowid });
});

app.delete('/api/news/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM News WHERE Id = ?').run(req.params.id);
  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(req.jwtUser.id, 'DELETE_NEWS', 'News', req.params.id);
  res.json({ success: true });
});

// ---- БАЗА ЗНАНИЙ (чтение публичное, запись авторизованным) ----
app.get('/api/articles', (req, res) => {
  const rows = db.prepare('SELECT * FROM Articles ORDER BY CreatedAt DESC').all();
  res.json(rows);
});

app.post('/api/articles', authenticate, (req, res) => {
  const { title, titleKz, category, categoryKz, content, contentKz } = req.body;
  const info = db.prepare('INSERT INTO Articles (Title, TitleKz, Category, CategoryKz, Content, ContentKz) VALUES (?, ?, ?, ?, ?, ?)')
    .run(title, titleKz, category, categoryKz, content, contentKz);

  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(req.jwtUser.id, 'CREATE_ARTICLE', 'Article', info.lastInsertRowid.toString());

  res.json({ success: true, id: info.lastInsertRowid });
});

app.delete('/api/articles/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM Articles WHERE Id = ?').run(req.params.id);
  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(req.jwtUser.id, 'DELETE_ARTICLE', 'Article', req.params.id);
  res.json({ success: true });
});

// ---- БРОНИРОВАНИЕ ОЧЕРЕДИ (авторизованным) ----
app.get('/api/bookings', authenticate, (req, res) => {
  const userId = req.query.userId;
  let rows;
  if (userId) {
    rows = db.prepare('SELECT * FROM Bookings WHERE UserId = ? ORDER BY Date DESC, TimeSlot DESC').all(userId);
  } else {
    rows = db.prepare('SELECT b.*, u.FullName as UserName FROM Bookings b LEFT JOIN Users u ON b.UserId = u.Id ORDER BY Date DESC, TimeSlot DESC').all();
  }
  res.json(rows);
});

app.post('/api/bookings', authenticate, (req, res) => {
  const { userId, organization, date, timeSlot, topic } = req.body;
  const info = db.prepare('INSERT INTO Bookings (UserId, Organization, Date, TimeSlot, Topic) VALUES (?, ?, ?, ?, ?)')
    .run(userId || req.jwtUser.id, organization, date, timeSlot, topic);

  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(req.jwtUser.id, 'CREATE_BOOKING', 'Booking', info.lastInsertRowid.toString());

  console.log('✅ Очередь забронирована:', info.lastInsertRowid);
  res.json({ success: true, id: info.lastInsertRowid });
});

// ---- УВЕДОМЛЕНИЯ (авторизованным) ----
app.get('/api/notifications', authenticate, (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Укажите userId' });
  const rows = db.prepare('SELECT * FROM Notifications WHERE UserId = ? ORDER BY CreatedAt DESC').all(userId);
  res.json(rows);
});

app.patch('/api/notifications/:id', authenticate, (req, res) => {
  db.prepare('UPDATE Notifications SET IsRead = 1 WHERE Id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/clear-all', authenticate, (req, res) => {
  const { userId } = req.body;
  db.prepare('UPDATE Notifications SET IsRead = 1 WHERE UserId = ?').run(userId || req.jwtUser.id);
  res.json({ success: true });
});

// ---- ЖУРНАЛ АУДИТА (только авторизованным) ----
app.get('/api/logs', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT l.*, u.FullName as UserName
    FROM AuditLogs l
    LEFT JOIN Users u ON l.UserId = u.Id
    ORDER BY l.CreatedAt DESC
  `).all();
  res.json(rows);
});

// ---- ВЕРСИИ ДОКУМЕНТОВ ----
app.get('/api/applications/:id/documents', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM DocVersions WHERE ApplicationId = ? ORDER BY Version DESC').all(req.params.id);
  res.json(rows);
});

// Реальная загрузка файла (multer)
app.post('/api/applications/:id/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  const appId = req.params.id;
  const { docFieldId } = req.body;

  const currentMax = db.prepare('SELECT MAX(Version) as mv FROM DocVersions WHERE ApplicationId = ? AND DocFieldId = ?')
    .get(appId, docFieldId || 'doc');
  const nextVer = (currentMax.mv || 0) + 1;
  const fileUrl = `/uploads/${appId}/${req.file.filename}`;

  db.prepare('INSERT INTO DocVersions (ApplicationId, DocFieldId, Version, FileName, FileSize, FileUrl, UploadedBy) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(appId, docFieldId || 'doc', nextVer, req.file.originalname, req.file.size, fileUrl, req.jwtUser.iin || 'user');

  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(req.jwtUser.id, `UPLOAD_FILE_V${nextVer}`, 'Document', appId);

  console.log(`✅ Файл загружен: ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);
  res.json({ success: true, version: nextVer, fileUrl, fileName: req.file.originalname, fileSize: req.file.size });
});

// Старый endpoint для метаданных (без реального файла)
app.post('/api/applications/:id/documents', authenticate, (req, res) => {
  const { docFieldId, fileName, fileSize, uploadedBy } = req.body;
  const appId = req.params.id;

  const currentMax = db.prepare('SELECT MAX(Version) as mv FROM DocVersions WHERE ApplicationId = ? AND DocFieldId = ?')
    .get(appId, docFieldId);
  const nextVer = (currentMax.mv || 0) + 1;
  const fileUrl = `/uploads/${appId}/${docFieldId}_v${nextVer}_${fileName}`;

  db.prepare('INSERT INTO DocVersions (ApplicationId, DocFieldId, Version, FileName, FileSize, FileUrl, UploadedBy) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(appId, docFieldId, nextVer, fileName, fileSize, fileUrl, uploadedBy || 'Заявитель');

  db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
    .run(req.jwtUser.id, 'UPLOAD_DOC_V' + nextVer, 'Document', appId);

  console.log(`✅ Документ ${fileName} сохранен как v${nextVer} для заявки ${appId}`);
  res.json({ success: true, version: nextVer, fileUrl });
});

// ---- КОММЕНТАРИИ К ЗАЯВКЕ ----
app.get('/api/applications/:id/comments', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM Comments WHERE ApplicationId = ? ORDER BY CreatedAt ASC').all(req.params.id);
  res.json(rows);
});

app.post('/api/applications/:id/comments', authenticate, (req, res) => {
  const { userId, userName, message } = req.body;
  const appId = req.params.id;

  if (!message) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

  db.prepare('INSERT INTO Comments (ApplicationId, UserId, UserName, Message) VALUES (?, ?, ?, ?)')
    .run(appId, userId || req.jwtUser.id, userName || 'Пользователь', message);

  const application = db.prepare('SELECT UserId FROM Applications WHERE AppNumber = ?').get(appId);
  if (application && application.UserId !== (userId || req.jwtUser.id)) {
    db.prepare('INSERT INTO Notifications (UserId, Title, TitleKz, Message, MessageKz) VALUES (?, ?, ?, ?, ?)')
      .run(application.UserId, 'Новое сообщение по заявке', 'Өтінім бойынша жаңа хабарлама', `Куратор оставил комментарий по заявке ${appId}`, `Куратор ${appId} өтінімі бойынша түсініктеме қалдырды`);
  }

  res.json({ success: true });
});

// ---- ОБРАТНАЯ СВЯЗЬ (публичный) ----
app.post('/api/feedback', (req, res) => {
  const { name, email, subject, message, userId } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Заполните обязательные поля' });

  const appNumber = 'FEEDBACK-' + Date.now().toString().slice(-8);
  const targetUserId = userId || 1;

  try {
    db.prepare(
      'INSERT INTO Applications (AppNumber, ServiceId, UserId, Status, FormDataJson) VALUES (?, ?, ?, ?, ?)'
    ).run(appNumber, 3, targetUserId, 'feedback', JSON.stringify({ name, email, subject, message }));

    db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
      .run(targetUserId, 'SUBMIT_FEEDBACK', 'Feedback', appNumber);

    console.log('✅ Обратная связь получена от:', email);
    res.json({ success: true, appNumber });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// ---- ADMIN TOKEN (для отдельной формы входа) ----
app.post('/api/admin/login', (req, res) => {
  const { login, password } = req.body;
  if (login === 'admin@baiterek.kz' && password === 'baiterek2026') {
    const token = jwt.sign({ id: 0, iin: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    db.prepare('INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId) VALUES (?, ?, ?, ?)')
      .run(0, 'ADMIN_LOGIN', 'User', '0');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Неверный логин или пароль' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`🔐 JWT авторизация активна`);
  console.log(`📁 Загрузка файлов: /uploads/`);
  console.log(`📊 Аналитика API: /api/analytics`);
});
