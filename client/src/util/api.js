const API_BASE = import.meta.env.VITE_API_URL; // MUST be full backend URL

if (!API_BASE) {
  throw new Error("VITE_API_URL is not defined");
}

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(t) {
    this.token = t;
  }

  headers(isJson = true) {
    const h = {};
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    if (isJson) h["Content-Type"] = "application/json";
    return h;
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

  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: this.headers(),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export const api = new ApiClient();
