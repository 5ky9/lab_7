import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const statuses = [
  ['new', 'Новая'],
  ['processing', 'В обработке'],
  ['done', 'Выполнена'],
  ['cancelled', 'Отменена'],
];

export default function OrdersPanel({ refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setOrders(await apiFetch('/orders'));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, refreshKey]);

  async function updateStatus(orderId, status) {
    setError('');
    try {
      const updated = await apiFetch(`/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...updated } : order));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  return (
    <div className="orders-card">
      {loading && <p className="muted">Загружаем заявки…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && orders.length === 0 && <p className="muted">Новых заявок пока нет.</p>}
      {!loading && orders.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Покупатель</th><th>Продукт</th><th>Количество</th><th>Контакты</th><th>Дата</th><th>Статус</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.name}</strong><small>{order.comment || 'Без комментария'}</small></td>
                  <td>{order.product_name || 'Товар удалён'}</td>
                  <td>{order.quantity} кг</td>
                  <td><a href={`mailto:${order.email}`}>{order.email}</a>{order.phone && <small>{order.phone}</small>}</td>
                  <td>{order.delivery_date ? new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString('ru-RU') : 'Не указана'}</td>
                  <td>
                    <select aria-label={`Статус заявки ${order.id}`} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                      {statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
