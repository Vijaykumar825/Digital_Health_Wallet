import React, { useEffect, useState } from "react";
import { api } from "../util/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function ReportsList({ onSelect, onShare }) {
  const [reports, setReports] = useState([]);
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [vitalType, setVitalType] = useState("");
  const [err, setErr] = useState("");
  const auth = useAuth();

  async function load() {
    setErr("");
    const params = new URLSearchParams();
    const norm = (d) => {
      if (!d) return d;
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const m = d.match(/^(\d{2})[-\/.](\d{2})[-\/.](\d{4})$/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
    };
    let vt = vitalType.trim();
    if (vt.toLowerCase() === "hr") vt = "heartRate";
    if (category) params.set("category", category.trim());
    if (from) params.set("from", norm(from));
    if (to) params.set("to", norm(to));
    if (vt) params.set("vitalType", vt);
    try {
      const res = await api.get(`/reports?${params.toString()}`);
      setReports(res);
      // Do not auto-select any report; keep Preview empty until user clicks
    } catch (e) {
      setErr("Failed to load reports");
      setReports([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Refresh when other components signal a reports update
  useEffect(() => {
    function onRefresh() {
      load();
    }
    window.addEventListener("reports:refresh", onRefresh);
    return () => window.removeEventListener("reports:refresh", onRefresh);
  }, [category, from, to, vitalType]);

  async function deleteReport(id) {
    const ok = window.confirm("Delete this report permanently?");
    if (!ok) return;
    try {
      await api.delete(`/reports/${id}`);
      // Clear preview selection if any
      onSelect?.(null);
      // Refresh list
      await load();
      // Notify charts to refresh vitals data (mirrored vitals may have been removed)
      window.dispatchEvent(new Event("vitals:refresh"));
    } catch (e) {
      setErr("Failed to delete report");
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">Reports</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          className="input max-w-[160px]"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          className="input max-w-[180px]"
          placeholder="Vital key (e.g. bp)"
          value={vitalType}
          onChange={(e) => setVitalType(e.target.value)}
        />
        <button className="btn-secondary" onClick={load}>
          Filter
        </button>
      </div>
      {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
      <ul className="divide-y divide-gray-100">
        {reports.map((r) => (
          <li key={r.id} className="py-2 flex items-center">
            <button
              onClick={() => onSelect?.(r)}
              className="btn-secondary mr-2"
            >
              Preview
            </button>
            <button onClick={() => onShare?.(r)} className="btn-secondary mr-2">
              Share
            </button>
            {auth?.user?.id === r.owner_id && (
              <button
                onClick={() => deleteReport(r.id)}
                className="btn-secondary mr-2"
                title="Delete report"
              >
                Delete
              </button>
            )}
            <a
              className="btn-primary"
              href={`/api/reports/${r.id}/download`}
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
            <span className="ml-3 text-sm text-gray-700">
              [{r.category}] {r.original_name} — {r.date}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
