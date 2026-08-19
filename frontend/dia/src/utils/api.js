export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getToken() {
  return localStorage.getItem('dia_token');
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  let data = null;
  try { data = await response.json(); } catch { /* empty body */ }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
}
