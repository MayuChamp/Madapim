import { useState } from 'react';
import { login } from './api';
import { IconArrowLeft } from './icons';
import { useLanguage } from './i18n';
import { MapaiLogo } from './MapaiLogo';

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
    <div className="login-page" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className="topstrip">
        <span className="topstrip-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img className="topstrip-emblem" src="/dyellin-emblem.png" alt="" />
          {t('college_name')}
        </span>
      </div>
      <div className="login-body">
      <div className="corner-frame fade-in">
      <div className="card" style={{ width: 400, maxWidth: 'calc(100vw - 50px)', padding: '36px 32px', boxShadow: 'var(--shadow-2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <MapaiLogo height={116} alt={t('app_logo_alt')} style={{ display: 'flex', width: 'fit-content', margin: '0 auto 22px' }} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 8px' }}>{t('login_title')}</h1>
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
      </div>
    </div>
  );
}
