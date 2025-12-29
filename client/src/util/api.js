// client/src/util/api.js

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:4000/api"; // safe fallback for local dev

// derive backend root (without /api) for uploads
const BACKEND_ROOT = API_BASE.replace(/\/api$/, "");

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  headers(isJson = true) {
    const h = {};
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    if (isJson) h["Content-Type"] = "application/json";
    return h;
  }

  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async postForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: this.headers(false),
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export const api = new ApiClient();

// helpers
export const apiUrl = (path) => `${API_BASE}${path}`;
export const uploadsUrl = (filename) =>
  `${BACKEND_ROOT}/uploads/${filename}`;
