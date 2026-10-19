import { useState } from 'react';
import { apiFetch } from '../api.js';

export default function OrderForm({ product, user, onSubmitted }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));

    try {
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          name: values.name,
          email: values.email,
          phone: values.phone,
          quantity: Number(values.quantity),
          date: values.date || null,
          comment: values.comment || null,
        }),
      });
      onSubmitted();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="order-form" onSubmit={handleSubmit}>
      <h4>Заявка на «{product.name}»</h4>
      <div className="form-grid">
        <label>Ваше имя<input name="name" defaultValue={user?.name || ''} required maxLength={120} /></label>
        <label>Email<input name="email" type="email" defaultValue={user?.email || ''} required maxLength={254} /></label>
        <label>Телефон<input name="phone" type="tel" placeholder="+7" maxLength={30} /></label>
        <label>Количество, {product.unit}<input name="quantity" type="number" min="10" step="1" defaultValue="10" required /></label>
        <label>Желаемая дата<input name="date" type="date" /></label>
        <label className="form-wide">Комментарий<textarea name="comment" rows="2" maxLength="1000" placeholder="Пожелания к заказу" /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button-dark" type="submit" disabled={loading}>
        {loading ? 'Отправляем…' : 'Отправить заявку'}
      </button>
    </form>
  );
}
