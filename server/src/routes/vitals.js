import express from 'express';
import { all, get, run } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, value, unit, date } = req.body;
    if (!type || value === undefined || !date) return res.status(400).json({ error: 'Missing fields' });
    const { id } = await run(
      'INSERT INTO vitals (user_id, type, value, unit, date) VALUES (?,?,?,?,?)',
      [req.user.id, type, value, unit || null, date]
    );
    const vital = await get('SELECT * FROM vitals WHERE id = ?', [id]);
    res.status(201).json(vital);
  } catch (e) {
    res.status(500).json({ error: 'Create failed' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { type, from, to } = req.query;
    const params = [req.user.id];
    const conditions = ['user_id = ?'];
    if (type) { conditions.push('type = ?'); params.push(type); }
    if (from) { conditions.push('date >= ?'); params.push(from); }
    if (to) { conditions.push('date <= ?'); params.push(to); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const rows = await all(`SELECT * FROM vitals ${where} ORDER BY date(date) ASC, id ASC`, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'List failed' });
  }
});

export default router;
