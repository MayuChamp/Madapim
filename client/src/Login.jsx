import { useState } from 'react';
import { login } from './api';
import { IconGraduationCap, IconArrowLeft } from './icons';

export function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'שם משתמש או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', direction: 'rtl' }}>
      <div className="card fade-in" style={{ width: 400, padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'var(--brand)', color: '#fff', borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <IconGraduationCap size={24} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink-1)', margin: '0 0 8px' }}>כניסת מדריכים</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>התחבר למערכת ההערכה הפדגוגית</p>
        </div>

        {error && (
          <div style={{ background: 'var(--warn-soft)', color: 'var(--warn)', padding: '10px 14px', borderRadius: 'var(--r-sm)', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-2)', marginBottom: 6, fontWeight: 500 }}>כתובת דוא״ל</label>
            <input
              className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', direction: 'ltr', textAlign: 'left' }}
              dir="ltr" placeholder="name@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-2)', marginBottom: 6, fontWeight: 500 }}>סיסמה</label>
            <input
              className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', direction: 'ltr', textAlign: 'left' }}
              dir="ltr" placeholder="••••••••"
            />
          </div>
          <button
            type="submit" className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }} disabled={loading}
          >
            {loading ? 'מתחבר...' : 'התחבר למערכת'}
            <IconArrowLeft size={16} style={{ marginInlineStart: 8 }} />
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--ink-3)' }}>
          <strong style={{ color: 'var(--ink-2)' }}>פיילוט — פרטי כניסה:</strong><br />
          דוא״ל: yearad@dyellin.ac.il<br />
          סיסמה: pilot2026
        </div>
      </div>
    </div>
  );
}
