export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get('content-type') || '';
  const data = response.status === 204
    ? null
    : contentType.includes('application/json')
      ? await response.json()
      : null;

  if (response.status === 401 && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('agromarket:unauthorized'));
  }

  if (!response.ok) {
    throw new Error(data?.error || `Ошибка сервера: ${response.status}`);
  }
  return data;
}
