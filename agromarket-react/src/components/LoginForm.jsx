import { useState } from 'react';
import { apiFetch } from '../api.js';

export default function LoginForm({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isLogin = mode === 'login';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const result = await apiFetch(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      onLogin(result.user, result.token);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((current) => current === 'login' ? 'register' : 'login');
    setError('');
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <span className="eyebrow">АККАУНТ ПОКУПАТЕЛЯ</span>
      <h3>{isLogin ? 'С возвращением' : 'Создать аккаунт'}</h3>
      {!isLogin && <label>Ваше имя<input name="name" placeholder="Имя" required maxLength={120} autoComplete="name" /></label>}
      <label>Email<input name="email" type="email" placeholder="name@example.com" required maxLength={254} autoComplete="email" /></label>
      <label>Пароль<input name="password" type="password" placeholder={isLogin ? 'Ваш пароль' : 'Не менее 8 символов'} required minLength="8" autoComplete={isLogin ? 'current-password' : 'new-password'} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button-dark" type="submit" disabled={loading}>
        {loading ? 'Подождите…' : isLogin ? 'Войти в аккаунт' : 'Зарегистрироваться'}
      </button>
      <button className="mode-toggle" type="button" onClick={toggleMode}>
        {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
      </button>
    </form>
  );
}
