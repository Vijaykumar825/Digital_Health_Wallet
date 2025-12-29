import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../util/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res);
      nav("/");
    } catch (e) {
      setErr("Login failed");
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      <form onSubmit={submit} className="card grid gap-3">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="btn-primary">Login</button>
      </form>
      <p className="mt-3 text-sm">
        No account?{" "}
        <Link className="text-blue-600" to="/register">
          Register
        </Link>
      </p>
    </div>
  );
}
