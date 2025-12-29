import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { all, get, run } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Store uploads under server/data/uploads so a single persistent disk can mount there in Render
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, unique + ext);
  },
});

const allowed = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

function fileFilter(_req, file, cb) {
  if (allowed.has(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported file type'));
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { category, date, vitals } = req.body;
    if (!category || !date || !req.file) return res.status(400).json({ error: 'Missing fields' });
    let vitals_json = null;
    if (vitals) {
      try { vitals_json = JSON.stringify(typeof vitals === 'string' ? JSON.parse(vitals) : vitals); } catch { vitals_json = null; }
    }
    const { id } = await run(
      `INSERT INTO reports (owner_id, category, date, vitals_json, original_name, stored_name, mime_type, size)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id, category, date, vitals_json, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size]
    );
    const report = await get('SELECT * FROM reports WHERE id = ?', [id]);

    // Best-effort: mirror numeric vitals into the time-series vitals table for charts
    try {
      if (vitals_json) {
        const parsed = JSON.parse(vitals_json);
        // Sugar
        if (parsed.sugar !== undefined) {
          const sugarVal = parseFloat(parsed.sugar);
          if (!Number.isNaN(sugarVal)) {
            await run(
              'INSERT INTO vitals (user_id, type, value, unit, date, report_id) VALUES (?,?,?,?,?,?)',
              [req.user.id, 'sugar', sugarVal, 'mg/dL', date, report.id]
            );
          }
        }
        // Heart Rate
        if (parsed.heartRate !== undefined) {
          const hrVal = parseFloat(parsed.heartRate);
          if (!Number.isNaN(hrVal)) {
            await run(
              'INSERT INTO vitals (user_id, type, value, unit, date, report_id) VALUES (?,?,?,?,?,?)',
              [req.user.id, 'heartRate', hrVal, 'bpm', date, report.id]
            );
          }
        }
        // BP optional: store systolic if provided as "SYS/DIA"
        if (parsed.bp && typeof parsed.bp === 'string') {
          const match = parsed.bp.match(/^(\d{2,3})\/(\d{2,3})/);
          if (match) {
            const sys = parseFloat(match[1]);
            const dia = parseFloat(match[2]);
            if (!Number.isNaN(sys)) {
              await run(
                'INSERT INTO vitals (user_id, type, value, unit, date, report_id) VALUES (?,?,?,?,?,?)',
                [req.user.id, 'bp_systolic', sys, 'mmHg', date, report.id]
              );
            }
            if (!Number.isNaN(dia)) {
              await run(
                'INSERT INTO vitals (user_id, type, value, unit, date, report_id) VALUES (?,?,?,?,?,?)',
                [req.user.id, 'bp_diastolic', dia, 'mmHg', date, report.id]
              );
            }
          }
        }
      }
    } catch (e) {
      // non-fatal: uploading should not fail if vitals mirroring fails
    }
    res.status(201).json(report);
  } catch (e) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    let { category, from, to, vitalType } = req.query;

    // Normalize incoming dates like DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
    function normalizeDate(d) {
      if (!d) return d;
      // Already ISO-like
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const m = d.match(/^(\d{2})[-\/.](\d{2})[-\/.](\d{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      return d;
    }
    from = normalizeDate(from);
    to = normalizeDate(to);

    // Normalize vitalType aliases
    if (typeof vitalType === 'string') {
      const vt = vitalType.trim().toLowerCase();
      if (vt === 'hr' || vt === 'heartrate') vitalType = 'heartRate';
      else if (vt === 'bp') vitalType = 'bp';
      else vitalType = vitalType.trim();
    }
    const conds = [];
    const filterParams = [];
    if (category) { conds.push('r.category = ?'); filterParams.push(category); }
    if (from) { conds.push('r.date >= ?'); filterParams.push(from); }
    if (to) { conds.push('r.date <= ?'); filterParams.push(to); }
    if (vitalType) {
      // Avoid json_extract to be compatible even if JSON1 extension is unavailable
      conds.push('(r.vitals_json LIKE ?)');
      filterParams.push(`%"${vitalType}"%`);
    }
    const whereFilters = conds.length ? ' AND ' + conds.join(' AND ') : '';

    const sql = `
      SELECT DISTINCT r.*
      FROM reports r
      LEFT JOIN shares s ON s.report_id = r.id AND s.shared_with_user_id = ?
      WHERE (r.owner_id = ? OR s.id IS NOT NULL)
      ${whereFilters}
      ORDER BY date(r.date) DESC, r.id DESC
    `;
    const params = [req.user.id, req.user.id, ...filterParams];

    const rows = await all(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('List reports failed', e);
    res.status(500).json({ error: 'List failed' });
  }
});

async function canViewReport(userId, reportId) {
  const owned = await get('SELECT id FROM reports WHERE id = ? AND owner_id = ?', [reportId, userId]);
  if (owned) return true;
  const shared = await get('SELECT id FROM shares WHERE report_id = ? AND shared_with_user_id = ?', [reportId, userId]);
  return !!shared;
}

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!(await canViewReport(req.user.id, id))) return res.status(403).json({ error: 'Forbidden' });
    const report = await get('SELECT * FROM reports WHERE id = ?', [id]);
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!(await canViewReport(req.user.id, id))) return res.status(403).json({ error: 'Forbidden' });
    const report = await get('SELECT * FROM reports WHERE id = ?', [id]);
    if (!report) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(uploadsDir, report.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
    res.download(filePath, report.original_name);
  } catch (e) {
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await get('SELECT * FROM reports WHERE id = ?', [id]);
    if (!report) return res.status(404).json({ error: 'Not found' });
    if (report.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    // Remove mirrored vitals linked to this report (manual vitals remain)
    await run('DELETE FROM vitals WHERE report_id = ?', [id]);
    await run('DELETE FROM reports WHERE id = ?', [id]);
    const filePath = path.join(uploadsDir, report.stored_name);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
