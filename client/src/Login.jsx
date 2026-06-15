import { useState } from 'react';
import { login } from './api';
import { IconGraduationCap, IconArrowLeft } from './icons';
import { useLanguage } from './i18n';

export function Login({ onLogin }) {
  const { t, isRTL } = useLanguage();
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
      setError(err.message || t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className="card fade-in" style={{ width: 400, padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'var(--brand)', color: '#fff', borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <IconGraduationCap size={24} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink-1)', margin: '0 0 8px' }}>{t('login_title')}</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>{t('login_subtitle')}</p>
        </div>

        {error && (
          <div style={{ background: 'var(--warn-soft)', color: 'var(--warn)', padding: '10px 14px', borderRadius: 'var(--r-sm)', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-2)', marginBottom: 6, fontWeight: 500 }}>{t('login_email')}</label>
            <input
              className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', direction: 'ltr', textAlign: 'left' }}
              dir="ltr" placeholder="name@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-2)', marginBottom: 6, fontWeight: 500 }}>{t('login_password')}</label>
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
            {loading ? t('login_loading') : t('login_btn')}
            <IconArrowLeft size={16} style={{ marginInlineStart: 8 }} />
          </button>
        </form>

      </div>
    </div>
  );
}
