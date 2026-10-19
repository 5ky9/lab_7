import { Router } from 'express';
import { pool } from '../db/pool.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const adminOnly = [requireAuth, requireRole('admin')];

// GET /api/orders — заявки вместе с названием товара (только admin)
router.get('/', adminOnly, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT o.*, p.name AS product_name, p.unit AS product_unit
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    ORDER BY o.created_at DESC
  `);
  res.json(rows);
});

router.get('/my', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT o.*, p.name AS product_name, p.unit AS product_unit
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC
  `, [req.user.id]);
  res.json(rows);
});

// POST /api/orders — новая заявка (форма из React)
router.post('/', optionalAuth, async (req, res) => {
  const { product_id, name, email, phone, quantity, date, comment } =
    req.body || {};

  if (!name || !String(name).trim() || !email || !String(email).trim() ||
      quantity === undefined || quantity === '') {
    return res.status(400).json({
      error: 'Поля name, email и quantity обязательны',
    });
  }
  const amount = Number(quantity);
  if (!Number.isSafeInteger(amount) || amount < 10) {
    return res.status(400).json({ error: 'Минимальный объём заказа — 10 кг' });
  }

  const { rows } = await pool.query(
    `INSERT INTO orders (product_id, user_id, name, email, phone, quantity, delivery_date, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [product_id || null, req.user?.id ?? null, String(name).trim(),
     String(email).trim().toLowerCase(), phone || null, amount,
     date || null, comment || null]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/orders/3 — тело: { "status": "processing" }
router.patch('/:id', adminOnly, async (req, res) => {
  const { status } = req.body || {};
  if (!['new', 'processing', 'done', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Недопустимый статус заявки' });
  }
  const { rows } = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Заявка не найдена' });
  }
  res.json(rows[0]);
});

export default router;
