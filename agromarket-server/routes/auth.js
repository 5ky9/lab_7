import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Не более 5 неудачных попыток входа за 15 минут с одного IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,       // окно — 15 минут
  limit: 5,                       // не больше 5 попыток в окне
  skipSuccessfulRequests: true,   // считаем только неудачные входы
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// Выпускает токен: внутри id и роль, подпись — нашим секретным ключом
function createToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

// POST /api/auth/register   { name, email, password }
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Поля name, email и password обязательны' });
  }
  if (!String(name).trim() || !String(email).trim()) {
    return res.status(400).json({ error: 'Имя и email не должны быть пустыми' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 8 символов' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  // role не передаём — база поставит DEFAULT 'user' (защита от mass assignment)
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, created_at`,
    [String(name).trim(), String(email).trim().toLowerCase(), passwordHash]
  );
  const user = rows[0];

  // Сразу после регистрации пользователь считается вошедшим
  res.status(201).json({ user, token: createToken(user) });
});

// POST /api/auth/login   { email, password }
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Поля email и password обязательны' });
  }

  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [String(email).trim().toLowerCase()]
  );
  const user = rows[0];

  // Пользователь найден И пароль совпал с хэшем
  const ok = user && (await bcrypt.compare(String(password), user.password_hash));
  if (!ok) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  // Убираем хэш из объекта перед отправкой клиенту
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser, token: createToken(safeUser) });
});

// GET /api/auth/me — нужен токен
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.json(rows[0]);
});

router.patch('/password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Поля oldPassword и newPassword обязательны' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'Новый пароль должен быть не короче 8 символов' });
  }

  const { rows } = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  if (!(await bcrypt.compare(String(oldPassword), rows[0].password_hash))) {
    return res.status(400).json({ error: 'Текущий пароль указан неверно' });
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [passwordHash, req.user.id]
  );
  res.json({ message: 'Пароль успешно изменён' });
});

export default router;
