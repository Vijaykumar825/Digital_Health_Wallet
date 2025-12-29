import React, { useRef, useState } from "react";
import { api } from "../util/api.js";

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [bp, setBp] = useState("");
  const [sugar, setSugar] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    const vitals = {};
    if (bp) vitals.bp = bp;
    if (sugar) vitals.sugar = sugar;
    if (heartRate) vitals.heartRate = heartRate;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    fd.append("date", date);
    if (Object.keys(vitals).length) fd.append("vitals", JSON.stringify(vitals));
    try {
      const res = await api.postForm("/reports", fd);
      onUploaded?.(res);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // notify other components to refresh (e.g., reports list)
      window.dispatchEvent(new CustomEvent("reports:refresh"));
      setCategory("");
      setDate("");
      setBp("");
      setSugar("");
      setHeartRate("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card grid gap-3">
      <h3 className="text-lg font-semibold">Upload Report</h3>
      <input
        type="file"
        accept="application/pdf,image/*"
        ref={fileInputRef}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <div>
        <label className="label">Category</label>
        <input
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="label">BP</label>
          <input
            className="input"
            placeholder="120/80"
            value={bp}
            onChange={(e) => setBp(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Sugar</label>
          <input
            className="input"
            placeholder="mg/dL"
            value={sugar}
            onChange={(e) => setSugar(e.target.value)}
          />
        </div>
        <div>
          <label className="label">HR</label>
          <input
            className="input"
            placeholder="bpm"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
          />
        </div>
      </div>
      <button
        className="btn-primary disabled:opacity-50"
        disabled={!file || busy}
      >
        {busy ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
