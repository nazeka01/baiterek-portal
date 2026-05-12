const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
 
const app = express();
app.use(cors());
app.use(express.json());
 
// ---- БАЗА ДАННЫХ SQLite ----
const db = new Database(path.join(__dirname, 'baiterek.db'));
 
// Создаём таблицы если не существуют
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    IIN TEXT,
    FullName TEXT,
    Email TEXT,
    Role TEXT DEFAULT 'individual',
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
    AppNumber TEXT,
    ServiceId INTEGER,
    UserId INTEGER,
    Status TEXT DEFAULT 'submitted',
    FormDataJson TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
 
// Добавляем начальные данные услуг
const svcCount = db.prepare('SELECT COUNT(*) as cnt FROM Services').get();
if (svcCount.cnt === 0) {
  db.prepare("INSERT INTO Services (Slug, Title, Organization) VALUES (?, ?, ?)").run('wagons_ind', 'Лизинг авиатранспорта и вагонов — I Этап', 'БРК Лизинг');
  db.prepare("INSERT INTO Services (Slug, Title, Organization) VALUES (?, ?, ?)").run('wagons_exp', 'Лизинг авиатранспорта и вагонов — II Этап', 'БРК Лизинг');
  db.prepare("INSERT INTO Services (Slug, Title, Organization) VALUES (?, ?, ?)").run('subsidy', 'Субсидирование ставки вознаграждения', 'Даму');
  console.log('✅ Начальные данные добавлены');
}
 
console.log('✅ База данных SQLite подключена: baiterek.db');
 
// ---- API ----
 
// Статус
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'SQLite (baiterek.db)', message: 'Сервер работает!' });
});
 
// Получить все заявки
app.get('/api/applications', (req, res) => {
  const rows = db.prepare(`
    SELECT a.Id, a.AppNumber, a.Status, a.CreatedAt,
           s.Title as ServiceTitle,
           u.FullName as UserName
    FROM Applications a
    LEFT JOIN Services s ON a.ServiceId = s.Id
    LEFT JOIN Users u ON a.UserId = u.Id
    ORDER BY a.CreatedAt DESC
  `).all();
  res.json(rows);
});
 
// Создать заявку
app.post('/api/applications', (req, res) => {
  const { appNumber, serviceId, formData } = req.body;
  db.prepare(
    'INSERT INTO Applications (AppNumber, ServiceId, UserId, Status, FormDataJson) VALUES (?, ?, ?, ?, ?)'
  ).run(appNumber, serviceId || 1, 1, 'submitted', JSON.stringify(formData || {}));
  console.log('✅ Заявка сохранена:', appNumber);
  res.json({ success: true, appNumber });
});
 
// Получить заявку по номеру
app.get('/api/applications/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM Applications WHERE AppNumber = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Заявка не найдена' });
  res.json(row);
});
 
// Войти / создать пользователя
app.post('/api/users/login', (req, res) => {
  const { iin, fullName } = req.body;
  let user = db.prepare('SELECT * FROM Users WHERE IIN = ?').get(iin);
  if (!user) {
    db.prepare('INSERT INTO Users (IIN, FullName, Role) VALUES (?, ?, ?)').run(iin, fullName || 'Пользователь', 'individual');
    user = db.prepare('SELECT * FROM Users WHERE IIN = ?').get(iin);
    console.log('✅ Новый пользователь:', fullName);
  }
  res.json({ success: true, user });
});
 
// Получить всех пользователей (для админки)
app.get('/api/users', (req, res) => {
  const rows = db.prepare('SELECT Id, IIN, FullName, Role, CreatedAt FROM Users').all();
  res.json(rows);
});
 
// Получить все услуги
app.get('/api/services', (req, res) => {
  const rows = db.prepare("SELECT * FROM Services WHERE Status = 'published'").all();
  res.json(rows);
});
 
// Статистика для дашборда
app.get('/api/stats', (req, res) => {
  const apps = db.prepare('SELECT COUNT(*) as cnt FROM Applications').get();
  const users = db.prepare('SELECT COUNT(*) as cnt FROM Users').get();
  const services = db.prepare('SELECT COUNT(*) as cnt FROM Services').get();
  res.json({
    applications: apps.cnt,
    users: users.cnt,
    services: services.cnt
  });
});
 
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📊 API готов к работе!`);
  console.log(`\nДоступные endpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/applications`);
  console.log(`  POST /api/applications`);
  console.log(`  GET  /api/users`);
  console.log(`  POST /api/users/login`);
  console.log(`  GET  /api/services`);
  console.log(`  GET  /api/stats`);
});