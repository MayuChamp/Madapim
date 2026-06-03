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

  const user = q.userByEmail(email.toLowerCase().trim());
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

module.exports = router;
