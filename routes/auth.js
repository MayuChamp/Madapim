const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { q } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'madapim-pilot-secret-2026';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = await q.userByEmail(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// GET /api/auth/me — verify token and return user info
router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: { id: payload.id, email: payload.email, name: payload.name, role: payload.role } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// PUT /api/auth/profile — update name and email
router.put('/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, email } = req.body;
  if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'name and email required' });

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await q.userByEmail(normalizedEmail);
  if (existing && existing.id !== req.user.id) {
    return res.status(409).json({ error: 'כתובת הדוא״ל כבר בשימוש' });
  }

  await q.updateUserProfile(req.user.id, { name: name.trim(), email: normalizedEmail });

  const updated = await q.userById(req.user.id);
  const token = jwt.sign(
    { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } });
});

// GET /api/auth/program-settings
router.get('/program-settings', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = await q.userById(req.user.id);
    res.json({ maxLessonPlans: user?.max_lesson_plans ?? 5, maxObservations: user?.max_observations ?? 3 });
  } catch {
    res.json({ maxLessonPlans: 5, maxObservations: 3 });
  }
});

// PUT /api/auth/program-settings
router.put('/program-settings', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { maxLessonPlans, maxObservations } = req.body;
  if (!Number.isInteger(maxLessonPlans) || maxLessonPlans < 1 || maxLessonPlans > 20)
    return res.status(400).json({ error: 'maxLessonPlans חייב להיות בין 1 ל-20' });
  if (!Number.isInteger(maxObservations) || maxObservations < 1 || maxObservations > 20)
    return res.status(400).json({ error: 'maxObservations חייב להיות בין 1 ל-20' });
  try {
    await q.updateUserQuota(req.user.id, maxLessonPlans, maxObservations);
  } catch {
    return res.status(503).json({ error: 'שדות ההגדרות טרם נוצרו. יש להריץ את ה-migration ב-Supabase.' });
  }
  res.json({ ok: true });
});

// PUT /api/auth/password — change password
router.put('/password', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });

  const user = await q.userById(req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'הסיסמה הנוכחית שגויה' });

  const hash = await bcrypt.hash(newPassword, 10);
  await q.updateUserPassword(req.user.id, hash);

  res.json({ ok: true });
});

module.exports = router;
