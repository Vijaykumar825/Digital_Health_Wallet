import express from 'express';
import { all, get, run } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function isOwner(userId, reportId) {
  const row = await get('SELECT id FROM reports WHERE id = ? AND owner_id = ?', [reportId, userId]);
  return !!row;
}

// Grant access to a report for a user by email
router.post('/:reportId', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (!(await isOwner(req.user.id, reportId))) return res.status(403).json({ error: 'Forbidden' });
    const user = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });
    await run('INSERT OR IGNORE INTO shares (report_id, shared_with_user_id, role) VALUES (?,?,?)', [reportId, user.id, 'viewer']);
    const shares = await all(
      `SELECT s.id, u.name, u.email, s.role, s.created_at FROM shares s
       JOIN users u ON u.id = s.shared_with_user_id WHERE s.report_id = ?`,
      [reportId]
    );
    res.status(201).json(shares);
  } catch (e) {
    res.status(500).json({ error: 'Share failed' });
  }
});

// List shares for a report
router.get('/:reportId', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    if (!(await isOwner(req.user.id, reportId))) return res.status(403).json({ error: 'Forbidden' });
    const shares = await all(
      `SELECT s.id, u.name, u.email, s.role, s.created_at FROM shares s
       JOIN users u ON u.id = s.shared_with_user_id WHERE s.report_id = ?`,
      [reportId]
    );
    res.json(shares);
  } catch (e) {
    res.status(500).json({ error: 'List shares failed' });
  }
});

// Revoke share
router.delete('/:reportId/:shareId', requireAuth, async (req, res) => {
  try {
    const { reportId, shareId } = req.params;
    if (!(await isOwner(req.user.id, reportId))) return res.status(403).json({ error: 'Forbidden' });
    await run('DELETE FROM shares WHERE id = ? AND report_id = ?', [shareId, reportId]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Revoke failed' });
  }
});

export default router;
