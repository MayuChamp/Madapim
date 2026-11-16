const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { q } = require('../db');
const { signSession, publicUser, isPending, resolveSetPasswordLink, forgetUser } = require('../services/auth');

const MIN_PASSWORD = 6;

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = await q.userByEmail(email.toLowerCase().trim());
  // An invited account has no password until its link is used.
  const valid = user && !isPending(user.password_hash) && await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });

  res.json({ token: signSession(user), user: publicUser(user) });
});

// POST /api/auth/check-link — who a set-password link belongs to (public)
router.post('/check-link', async (req, res) => {
  const { user, error } = await resolveSetPasswordLink(req.body?.token);
  if (error) return res.status(400).json({ error });
  res.json({ name: user.name, email: user.email, isNew: isPending(user.password_hash) });
});

// POST /api/auth/set-password — choose a password through a link, then log in (public)
router.post('/set-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!password || password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD} תווים` });
  }
  const { user, error } = await resolveSetPasswordLink(token);
  if (error) return res.status(400).json({ error });

  await q.updateUserPassword(user.id, await bcrypt.hash(password, 10));
  forgetUser(user.id);
  res.json({ token: signSession(user), user: publicUser(user) });
});

// GET /api/auth/me — the session's user, re-read from the DB by requireAuth
router.get('/me', (req, res) => {
  res.json({ user: req.user });
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
  forgetUser(req.user.id);

  const updated = await q.userById(req.user.id);
  res.json({ token: signSession(updated), user: publicUser(updated) });
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
  if (newPassword.length < MIN_PASSWORD) return res.status(400).json({ error: `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD} תווים` });

  const user = await q.userById(req.user.id);
  const valid = !isPending(user.password_hash) && await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'הסיסמה הנוכחית שגויה' });

  const hash = await bcrypt.hash(newPassword, 10);
  await q.updateUserPassword(req.user.id, hash);

  res.json({ ok: true });
});

module.exports = router;
