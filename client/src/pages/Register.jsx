import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../util/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault(); // 🔥 prevents page navigation
    setErr("");

    try {
      const res = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });

      login(res.data);
      navigate("/");
    } catch (error) {
      console.error("REGISTER ERROR:", error?.response?.data || error.message);
      setErr(
        error?.response?.data?.message || "Registration failed. Try again."
      );
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>

      <form onSubmit={submit} className="card grid gap-3">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
            required
          />
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <button type="submit" className="btn-primary">
          Register
        </button>
      </form>

      <p className="mt-3 text-sm">
        Have an account?{" "}
        <Link className="text-blue-600" to="/login">
          Login
        </Link>
      </p>
    </div>
  );
}
