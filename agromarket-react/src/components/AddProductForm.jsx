import { useState } from 'react';
import { apiFetch } from '../api.js';

export default function AddProductForm({ product = null, onSaved, onCancel }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const data = {
      ...values,
      category: values.category.trim() || null,
      price: Number(values.price),
      unit: values.unit.trim() || 'кг',
    };

    try {
      const savedProduct = await apiFetch(product ? `/products/${product.id}` : '/products', {
        method: product ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      });
      onSaved(savedProduct);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div><span className="eyebrow">КАТАЛОГ</span><h3>{product ? 'Изменить товар' : 'Новый товар'}</h3></div>
        {onCancel && <button className="icon-button" type="button" aria-label="Закрыть форму" onClick={onCancel}>×</button>}
      </div>
      <div className="form-grid">
        <label>Название<input name="name" placeholder="Например, яблоки" defaultValue={product?.name || ''} required maxLength={120} /></label>
        <label>Категория<input name="category" placeholder="Фрукты, молочные…" defaultValue={product?.category || ''} maxLength={80} /></label>
        <label>Цена, ₸<input name="price" type="number" min="0" step="1" placeholder="0" defaultValue={product?.price ?? ''} required /></label>
        <label>Единица измерения<input name="unit" placeholder="кг, л, шт." defaultValue={product?.unit || 'кг'} required maxLength={20} /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="button button-dark" type="submit" disabled={loading}>
          {loading ? 'Сохраняем…' : product ? 'Сохранить изменения' : 'Добавить товар'}
        </button>
        {onCancel && <button className="button button-outline" type="button" onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  );
}
