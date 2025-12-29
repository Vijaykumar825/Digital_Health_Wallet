const apiBase = '/api';

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
    const res = await fetch(`${apiBase}${path}`, { headers: this.headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async post(path, body) {
    const res = await fetch(`${apiBase}${path}`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async postForm(path, formData) {
    const headers = this.headers(false);
    const res = await fetch(`${apiBase}${path}`, { method: 'POST', headers, body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async delete(path) {
    const res = await fetch(`${apiBase}${path}`, { method: 'DELETE', headers: this.headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export const api = new ApiClient();
