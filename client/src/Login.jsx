import { useEffect, useState } from 'react';
import { login, checkSetPasswordLink, setPasswordWithLink } from './api';
import { IconArrowLeft } from './icons';
import { useLanguage } from './i18n';
import { MapaiLogo } from './MapaiLogo';

const MIN_PASSWORD = 6;

const labelStyle = { display: 'block', fontSize: 13, color: 'var(--ink-2)', marginBottom: 6, fontWeight: 500 };
const ltrInputStyle = { width: '100%', direction: 'ltr', textAlign: 'left' };

function AuthFrame({ title, subtitle, children }) {
  const { t, isRTL } = useLanguage();
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
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 8px' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>{subtitle}</p>}
        </div>
        {children}
      </div>
      </div>
      </div>
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <div style={{ background: 'var(--warn-soft)', color: 'var(--warn)', padding: '10px 14px', borderRadius: 'var(--r-sm)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

export function Login({ onLogin }) {
  const { t } = useLanguage();
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
    <AuthFrame title={t('login_title')} subtitle={t('login_subtitle')}>
      {error && <ErrorBox>{error}</ErrorBox>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>{t('login_email')}</label>
          <input
            className="input" type="email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={ltrInputStyle} dir="ltr" placeholder="name@example.com"
          />
        </div>
        <div>
          <label style={labelStyle}>{t('login_password')}</label>
          <input
            className="input" type="password" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={ltrInputStyle} dir="ltr" placeholder="••••••••"
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

      <p style={{ fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center', margin: '20px 0 0', lineHeight: 1.6 }}>
        {t('login_forgot_hint')}
      </p>
    </AuthFrame>
  );
}

// Reached through an invitation or reset link: /set-password#<token>
export function SetPassword({ token, onDone, onCancel }) {
  const { t } = useLanguage();
  const [account, setAccount] = useState(null);   // { name, email, isNew }
  const [linkError, setLinkError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setLinkError(t('set_password_link_missing')); return; }
    checkSetPasswordLink(token)
      .then(setAccount)
      .catch(err => setLinkError(err.message));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD) { setError(t('set_password_too_short', { n: MIN_PASSWORD })); return; }
    if (password !== confirm) { setError(t('set_password_mismatch')); return; }
    setSaving(true);
    try {
      onDone(await setPasswordWithLink(token, password));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (linkError) {
    return (
      <AuthFrame title={t('set_password_title_reset')}>
        <ErrorBox>{linkError}</ErrorBox>
        <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={onCancel}>
          {t('set_password_back_to_login')}
        </button>
      </AuthFrame>
    );
  }

  if (!account) {
    return <AuthFrame title={t('loading')} />;
  }

  return (
    <AuthFrame
      title={account.isNew ? t('set_password_title_new') : t('set_password_title_reset')}
      subtitle={account.isNew ? t('set_password_subtitle_new', { name: account.name }) : t('set_password_subtitle_reset', { name: account.name })}
    >
      {error && <ErrorBox>{error}</ErrorBox>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>{t('login_email')}</label>
          <input className="input" value={account.email} readOnly disabled style={ltrInputStyle} dir="ltr" />
        </div>
        <div>
          <label style={labelStyle}>{t('set_password_new')}</label>
          <input
            className="input" type="password" value={password} autoFocus autoComplete="new-password"
            onChange={e => setPassword(e.target.value)} required
            style={ltrInputStyle} dir="ltr"
          />
        </div>
        <div>
          <label style={labelStyle}>{t('set_password_confirm')}</label>
          <input
            className="input" type="password" value={confirm} autoComplete="new-password"
            onChange={e => setConfirm(e.target.value)} required
            style={ltrInputStyle} dir="ltr"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={saving}>
          {saving ? t('set_password_saving') : t('set_password_submit')}
          <IconArrowLeft size={16} style={{ marginInlineStart: 8 }} />
        </button>
      </form>
    </AuthFrame>
  );
}
