import React, { useEffect, useState } from "react";
import { api, apiUrl } from "../util/api.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function ReportsList({ onSelect, onShare }) {
  const [reports, setReports] = useState([]);
  const [err, setErr] = useState("");
  const auth = useAuth();

  async function load() {
    try {
      const res = await api.get("/reports");
      setReports(res);
    } catch {
      setErr("Failed to load reports");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteReport(id) {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/reports/${id}`);
      onSelect?.(null);
      load();
      window.dispatchEvent(new Event("vitals:refresh"));
    } catch {
      setErr("Failed to delete report");
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">Reports</h3>
      {err && <div className="text-red-600">{err}</div>}
      <ul className="divide-y">
        {reports.map((r) => (
          <li key={r.id} className="py-2 flex items-center">
            <button
              className="btn-secondary mr-2"
              onClick={() => onSelect?.(r)}
            >
              Preview
            </button>
            <button className="btn-secondary mr-2" onClick={() => onShare?.(r)}>
              Share
            </button>
            {auth?.user?.id === r.owner_id && (
              <button
                className="btn-secondary mr-2"
                onClick={() => deleteReport(r.id)}
              >
                Delete
              </button>
            )}
            <a
              className="btn-primary"
              href={apiUrl(`/reports/${r.id}/download`)}
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
            <span className="ml-3 text-sm">
              [{r.category}] {r.original_name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
