const express = require('express');
const router = express.Router();
const { q } = require('../db');
const { pendingHash, isPending, signSetPasswordLink, LINK_TTL_HOURS, forgetUser } = require('../services/auth');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'אין הרשאות מנהל' });
  }
  next();
}

// The client turns the token into a full URL with its own origin.
function linkPayload(user) {
  return { token: signSetPasswordLink(user), expiresInHours: LINK_TTL_HOURS };
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

// POST /api/users — invite a new user (admin only). The person chooses their
// own password through the returned link.
router.post('/', requireAdmin, async (req, res) => {
  const { name, email, role } = req.body;
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'שם ודוא"ל נדרשים' });
  }
  if (role && !['instructor', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'תפקיד לא חוקי' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await q.userByEmail(normalizedEmail);
    if (existing) return res.status(409).json({ error: 'כתובת הדוא"ל כבר בשימוש' });

    const id = 'u_' + Date.now();
    const passwordHash = pendingHash();
    const user = await q.createUser({ id, email: normalizedEmail, passwordHash, name: name.trim(), role: role || 'instructor' });
    res.status(201).json({
      user: { ...user, pending: true },
      link: linkPayload({ id, password_hash: passwordHash }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/link — a fresh invitation (not yet activated) or
// password-reset link (active account). Admin only.
router.post('/:id/link', requireAdmin, async (req, res) => {
  try {
    let user = await q.userById(req.params.id);
    if (!user) return res.status(404).json({ error: 'המשתמש לא נמצא' });

    // Re-inviting rotates the placeholder, so earlier invitation links stop working.
    // An active account keeps its password until the person sets a new one.
    if (isPending(user.password_hash)) {
      const passwordHash = pendingHash();
      await q.updateUserPassword(user.id, passwordHash);
      user = { ...user, password_hash: passwordHash };
    }
    res.json({ ...linkPayload(user), pending: isPending(user.password_hash) });
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
    forgetUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
