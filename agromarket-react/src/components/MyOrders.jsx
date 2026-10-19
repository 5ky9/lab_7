import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const statuses = {
  new: 'Новая',
  processing: 'В обработке',
  done: 'Выполнена',
  cancelled: 'Отменена',
};

export default function MyOrders({ refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiFetch('/orders/my')
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <div className="orders-card">
      <div className="form-heading"><div><span className="eyebrow">ИСТОРИЯ ПОКУПОК</span><h3>Мои заявки</h3></div></div>
      {loading && <p className="muted">Загружаем заявки…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && orders.length === 0 && <p className="muted">Заявок пока нет. Выберите продукт из каталога.</p>}
      {!loading && orders.length > 0 && (
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-list-item" key={order.id}>
              <div><strong>{order.product_name || 'Товар удалён'}</strong><span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span></div>
              <div className="order-list-meta"><span>{order.quantity} {order.product_unit || 'кг'}</span><span className={`status-pill status-${order.status}`}>{statuses[order.status] || order.status}</span></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
