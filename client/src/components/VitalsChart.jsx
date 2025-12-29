import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { api } from "../util/api.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function VitalsChart() {
  const [type, setType] = useState("sugar");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState([]);

  async function load() {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await api.get(`/vitals?${params.toString()}`);
    setData(res);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function onRefresh() {
      load();
    }
    window.addEventListener("vitals:refresh", onRefresh);
    return () => window.removeEventListener("vitals:refresh", onRefresh);
  }, [type, from, to]);

  const chart = useMemo(
    () => ({
      labels: data.map((v) => v.date),
      datasets: [
        {
          label: type,
          data: data.map((v) => v.value),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.2)",
        },
      ],
    }),
    [data, type]
  );

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">Vitals Trend</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          className="input max-w-[200px]"
          placeholder="Type (e.g. sugar)"
          value={type}
          onChange={(e) => setType(e.target.value)}
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
        <button className="btn-secondary" onClick={load}>
          Load
        </button>
      </div>
      <Line data={chart} />
    </div>
  );
}
