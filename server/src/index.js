import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import reportRoutes from "./routes/reports.js";
import vitalsRoutes from "./routes/vitals.js";
import shareRoutes from "./routes/shares.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Respond to Chrome DevTools probe to avoid 404 noise in console
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => {
  res.json({ name: "health-wallet-backend", ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/vitals", vitalsRoutes);
app.use("/api/shares", shareRoutes);

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server listening on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Failed to init DB", err);
    process.exit(1);
  });
