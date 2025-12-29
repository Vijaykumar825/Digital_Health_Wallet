// Configure API base for production deployments (e.g., Railway)
// Examples:
//  - VITE_API_BASE = https://digitalhealthwallet-production.up.railway.app/api
//  - VITE_UPLOADS_BASE optional; defaults to same origin as API at /uploads
const API_BASE = import.meta.env?.VITE_API_BASE || '/api';
const defaultUploadsBase = (() => {
  if (/^https?:\/\//.test(API_BASE)) {
    const root = API_BASE.replace(/\/api\/?$/, '/');
    return new URL('/uploads', root).toString().replace(/\/$/, '');
  }
  return '/uploads';
})();
const UPLOADS_BASE = import.meta.env?.VITE_UPLOADS_BASE || defaultUploadsBase;

class ApiClient {
  constructor() { this.token = null; }
  setToken(t) { this.token = t; }
  headers(isJson = true) {
    const h = {};
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    if (isJson) h['Content-Type'] = 'application/json';
    return h;
  }
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: this.headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async postForm(path, formData) {
    const headers = this.headers(false);
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: this.headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export const api = new ApiClient();
export function apiUrl(p) { return `${API_BASE}${p}`; }
export function uploadsUrl(filename) { return `${UPLOADS_BASE}/${filename}`; }
