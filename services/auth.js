const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { q } = require('../db');

// The service-role key is always set (the DB needs it), so it is a safe secret
// fallback — unlike a constant committed to the repository.
const SECRET = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SECRET) throw new Error('JWT_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be set');

// Set-password links use their own key, so a link can never act as a session.
const LINK_SECRET = crypto.createHmac('sha256', SECRET).update('set-password-link').digest('hex');
const LINK_TTL = '72h';
const LINK_TTL_HOURS = 72;

const PENDING_PREFIX = 'pending:';

// ─── Sessions ────────────────────────────────────────────────────────────────
function signSession(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    SECRET,
    { expiresIn: '30d' }
  );
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

// ─── Accounts awaiting their first password ──────────────────────────────────
// A user created by invitation has no password yet. The marker can never match
// a bcrypt hash, so such an account cannot log in until the link is used.
function pendingHash() {
  return PENDING_PREFIX + crypto.randomBytes(16).toString('hex');
}

function isPending(passwordHash) {
  return !passwordHash || passwordHash.startsWith(PENDING_PREFIX);
}

// ─── Set-password links (invitation and reset) ───────────────────────────────
// Stateless: the link is bound to the account's current password hash, so it
// stops working the moment a password is set — no tokens are stored in the DB.
function hashFingerprint(passwordHash) {
  return crypto.createHash('sha256').update(String(passwordHash)).digest('hex').slice(0, 16);
}

function signSetPasswordLink(user) {
  return jwt.sign({ sub: user.id, ph: hashFingerprint(user.password_hash) }, LINK_SECRET, { expiresIn: LINK_TTL });
}

// Returns { user } or { error } with a message the person can act on.
async function resolveSetPasswordLink(token) {
  let payload;
  try {
    payload = jwt.verify(String(token || ''), LINK_SECRET);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { error: 'פג תוקף הקישור. יש לבקש קישור חדש ממנהלת המערכת.' };
    }
    return { error: 'הקישור אינו תקין. יש לוודא שהוא הועתק במלואו.' };
  }
  const user = await q.userById(payload.sub);
  if (!user) return { error: 'החשבון לא נמצא. יש לפנות למנהלת המערכת.' };
  if (payload.ph !== hashFingerprint(user.password_hash)) {
    return { error: 'הקישור כבר נוצל או הוחלף בקישור חדש. יש לבקש קישור חדש ממנהלת המערכת.' };
  }
  return { user };
}

// ─── Request authentication ──────────────────────────────────────────────────
// Every /api request needs a valid session, except the routes that let a
// person log in or set a password. The user is re-read from the DB (cached
// briefly) so a deleted account loses access right away.
const PUBLIC_PATHS = new Set(['/auth/login', '/auth/check-link', '/auth/set-password', '/health']);
const USER_CACHE_MS = 60 * 1000;
const userCache = new Map();

function forgetUser(id) {
  userCache.delete(id);
}

async function activeUser(id) {
  const hit = userCache.get(id);
  if (hit && Date.now() - hit.at < USER_CACHE_MS) return hit.user;
  const row = await q.userById(id);
  const user = row ? publicUser(row) : null;
  userCache.set(id, { user, at: Date.now() });
  return user;
}

async function requireAuth(req, res, next) {
  if (PUBLIC_PATHS.has(req.path)) return next();

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let payload = null;
  if (token) {
    try { payload = jwt.verify(token, SECRET); } catch { /* invalid or expired */ }
  }
  if (!payload?.id) return res.status(401).json({ error: 'נדרשת התחברות' });

  try {
    const user = await activeUser(payload.id);
    if (!user) return res.status(401).json({ error: 'נדרשת התחברות' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signSession,
  publicUser,
  pendingHash,
  isPending,
  signSetPasswordLink,
  resolveSetPasswordLink,
  LINK_TTL_HOURS,
  requireAuth,
  forgetUser,
};
