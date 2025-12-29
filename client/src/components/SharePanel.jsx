import React, { useEffect, useState } from "react";
import { api } from "../util/api.js";

export default function SharePanel({ report }) {
  const [email, setEmail] = useState("");
  const [shares, setShares] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    if (!report) return;
    const res = await api.get(`/shares/${report.id}`);
    setShares(res);
  }
  useEffect(() => {
    setMsg("");
    setErr("");
    load();
  }, [report?.id]);

  async function share() {
    setMsg("");
    setErr("");
    if (!email) {
      setErr("Please enter an email");
      return;
    }
    // basic email check
    const okEmail = /.+@.+\..+/.test(email);
    if (!okEmail) {
      setErr("Invalid email format");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/shares/${report.id}`, { email });
      setEmail("");
      setMsg("Viewer access granted");
      await load();
    } catch (e) {
      setErr("Failed to grant access (are you the owner?)");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(shareId) {
    setMsg("");
    setErr("");
    try {
      await api.delete(`/shares/${report.id}/${shareId}`);
      setMsg("Access revoked");
      await load();
    } catch (e) {
      setErr("Failed to revoke access");
    }
  }

  if (!report) return null;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">
        Share "{report.original_name}"
      </h3>
      <div className="flex gap-2 mb-3">
        <input
          className="input"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="btn-primary disabled:opacity-50"
          disabled={busy}
          onClick={share}
        >
          Grant viewer access
        </button>
      </div>
      {msg && <div className="text-sm text-green-700 mb-2">{msg}</div>}
      {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
      <ul className="divide-y divide-gray-100">
        {shares.map((s) => (
          <li key={s.id} className="py-2 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {s.name} ({s.email}) — {s.role}
            </span>
            <button
              className="btn-secondary disabled:opacity-50"
              disabled={busy}
              onClick={() => revoke(s.id)}
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
