import express from 'express';
import bcrypt from 'bcryptjs';
import { run, get } from '../lib/db.js';
import { signToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 10);
    const { id } = await run('INSERT INTO users(name, email, password_hash) VALUES (?, ?, ?)', [name, email, password_hash]);
    const token = signToken({ id, email, name });
    return res.status(201).json({ token, user: { id, name, email } });
  } catch (e) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

export default router;
