import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('events.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL -- 'organizer' or 'member'
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    organizer_id TEXT NOT NULL,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS event_members (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    proof_url TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );
`);

const app = express();
app.use(express.json());

// Configure Multer for 10MB photo uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API Routes
app.post('/api/auth', (req, res) => {
  const { id, name, role } = req.body;
  const stmt = db.prepare('INSERT OR IGNORE INTO users (id, name, role) VALUES (?, ?, ?)');
  stmt.run(id, name, role);
  res.json({ success: true });
});

app.post('/api/events', (req, res) => {
  const { id, name, code, organizer_id } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO events (id, name, code, organizer_id) VALUES (?, ?, ?, ?)');
    stmt.run(id, name, code, organizer_id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Event code already exists' });
  }
});

app.get('/api/events/organizer/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM events WHERE organizer_id = ?');
  const events = stmt.all(req.params.id);
  res.json(events);
});

app.post('/api/events/join', (req, res) => {
  const { code, user_id } = req.body;
  const eventStmt = db.prepare('SELECT id FROM events WHERE code = ?');
  const event = eventStmt.get(code) as { id: string } | undefined;
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  try {
    const joinStmt = db.prepare('INSERT INTO event_members (event_id, user_id) VALUES (?, ?)');
    joinStmt.run(event.id, user_id);
    res.json({ success: true, eventId: event.id });
  } catch (e) {
    res.json({ success: true, eventId: event.id }); // Already joined
  }
});

app.get('/api/events/member/:id', (req, res) => {
  const stmt = db.prepare(`
    SELECT e.* FROM events e
    JOIN event_members em ON e.id = em.event_id
    WHERE em.user_id = ?
  `);
  const events = stmt.all(req.params.id);
  res.json(events);
});

app.get('/api/events/:id/tasks', (req, res) => {
  const stmt = db.prepare('SELECT * FROM tasks WHERE event_id = ?');
  const tasks = stmt.all(req.params.id);
  res.json(tasks);
});

app.get('/api/events/:id/members', (req, res) => {
    const stmt = db.prepare(`
      SELECT u.id, u.name FROM users u
      JOIN event_members em ON u.id = em.user_id
      WHERE em.event_id = ?
    `);
    const members = stmt.all(req.params.id);
    res.json(members);
});

app.post('/api/tasks', (req, res) => {
  const { id, event_id, title, description, deadline, assigned_to } = req.body;
  const stmt = db.prepare('INSERT INTO tasks (id, event_id, title, description, deadline, assigned_to) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(id, event_id, title, description, deadline, assigned_to);
  res.json({ success: true });
});

app.post('/api/tasks/:id/submit', upload.single('proof'), (req, res) => {
  const taskId = req.params.id;
  const proofUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  const stmt = db.prepare('UPDATE tasks SET status = "completed", proof_url = ? WHERE id = ?');
  stmt.run(proofUrl, taskId);
  res.json({ success: true, proofUrl });
});

app.post('/api/tasks/:id/revert', (req, res) => {
  const taskId = req.params.id;
  const stmt = db.prepare('UPDATE tasks SET status = "pending", proof_url = NULL WHERE id = ?');
  stmt.run(taskId);
  res.json({ success: true });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function startServer() {
  const PORT: number = Number(process.env.PORT) || 5000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
