const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { q } = require('../db');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'אין הרשאות מנהל' });
  }
  next();
}

// GET /api/users — list all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await q.allUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — create a new user (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'שם, דוא"ל וסיסמה נדרשים' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
  }
  if (role && !['instructor', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'תפקיד לא חוקי' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await q.userByEmail(normalizedEmail);
    if (existing) return res.status(409).json({ error: 'כתובת הדוא"ל כבר בשימוש' });

    const id = 'u_' + Date.now();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await q.createUser({ id, email: normalizedEmail, passwordHash, name: name.trim(), role: role || 'instructor' });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — delete a user (admin only, cannot delete self)
router.delete('/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'לא ניתן למחוק את החשבון שלך' });
  }
  try {
    await q.deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
