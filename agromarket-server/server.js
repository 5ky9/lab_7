import 'dotenv/config';
import app from './app.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET в .env должен быть случайной строкой не короче 32 символов');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API запущен: http://localhost:${PORT}`);
});
