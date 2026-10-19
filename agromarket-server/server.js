import 'dotenv/config'; // ← ПЕРВОЙ строкой: читает .env в process.env
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './db/pool.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET в .env должен быть случайной строкой не короче 32 символов');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet()); // защитные HTTP-заголовки — первым middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10kb' })); // тело запроса не больше 10 КБ
app.use(logger);

// «Жив ли сервер и есть ли связь с базой?»
app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter); // перед /api/products
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

app.use(errorHandler); // ← последний middleware

app.listen(PORT, () => {
  console.log(`API запущен: http://localhost:${PORT}`);
});
