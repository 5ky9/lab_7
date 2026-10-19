import { useState } from 'react';
import { apiFetch } from '../api.js';

export default function ChangePasswordForm() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    try {
      const result = await apiFetch('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });
      setMessage(result.message);
      form.reset();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="change-password-form" onSubmit={handleSubmit}>
      <h3>Сменить пароль</h3>
      <label>Текущий пароль<input type="password" name="oldPassword" autoComplete="current-password" required /></label>
      <label>Новый пароль<input type="password" name="newPassword" autoComplete="new-password" minLength="8" required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success-message" role="status">{message}</p>}
      <button className="button button-outline" type="submit" disabled={loading}>{loading ? 'Сохраняем…' : 'Обновить пароль'}</button>
    </form>
  );
}
