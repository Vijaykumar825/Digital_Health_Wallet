import React, { useEffect, useState } from "react";
import UploadForm from "../components/UploadForm.jsx";
import ReportsList from "../components/ReportsList.jsx";
import VitalsChart from "../components/VitalsChart.jsx";
import SharePanel from "../components/SharePanel.jsx";
import ReportPreview from "../components/ReportPreview.jsx";
import { api } from "../util/api.js";

export default function Dashboard() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [vitalType, setVitalType] = useState("sugar");
  const [vitalValue, setVitalValue] = useState("");
  const [vitalUnit, setVitalUnit] = useState("mg/dL");
  const [vitalDate, setVitalDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMsg("");
  }, [selectedReport]);

  async function addVital(e) {
    e.preventDefault();
    const value = parseFloat(vitalValue);
    if (Number.isNaN(value)) return;
    await api.post("/vitals", {
      type: vitalType,
      value,
      unit: vitalUnit,
      date: vitalDate,
    });
    setMsg("Vital added");
    setVitalValue("");
  }

  return (
    <div className="grid gap-4">
      <UploadForm onUploaded={() => {}} />
      <ReportsList onSelect={setSelectedReport} onShare={setSelectedReport} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-4">
          <ReportPreview report={selectedReport} />
          <VitalsChart />
          <form
            onSubmit={addVital}
            className="flex flex-wrap items-center gap-2 mt-2"
          >
            <input
              className="input"
              placeholder="type"
              value={vitalType}
              onChange={(e) => setVitalType(e.target.value)}
            />
            <input
              className="input"
              placeholder="value"
              value={vitalValue}
              onChange={(e) => setVitalValue(e.target.value)}
            />
            <input
              className="input"
              placeholder="unit"
              value={vitalUnit}
              onChange={(e) => setVitalUnit(e.target.value)}
            />
            <input
              className="input"
              type="date"
              value={vitalDate}
              onChange={(e) => setVitalDate(e.target.value)}
            />
            <button className="btn-primary">Add</button>
            {msg && <span className="ml-2 text-sm text-green-700">{msg}</span>}
          </form>
        </div>
        <SharePanel report={selectedReport} />
      </div>
    </div>
  );
}
