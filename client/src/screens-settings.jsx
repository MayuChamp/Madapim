import React, { useState } from 'react';
import { IconUser, IconBell, IconLock, IconPalette } from './icons';
import * as API from './api';

export function SettingsScreen({ user, onLogout, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="main-inner fade-in">
      <div style={{ marginBottom: 'var(--gap-5)' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 600, margin: 0, color: 'var(--ink-1)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>הגדרות</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '10px 0 0', maxWidth: 540, lineHeight: 1.6 }}>ניהול החשבון שלך, העדפות אישיות והגדרות מערכת.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--gap-5)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <TabButton active={activeTab === 'account'}       onClick={() => setActiveTab('account')}       icon={<IconUser size={18} />}    label="החשבון שלי" />
          <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<IconBell size={18} />}    label="התראות" />
          <TabButton active={activeTab === 'security'}      onClick={() => setActiveTab('security')}      icon={<IconLock size={18} />}    label="אבטחה ופרטיות" />
          <TabButton active={activeTab === 'appearance'}    onClick={() => setActiveTab('appearance')}    icon={<IconPalette size={18} />} label="תצוגה" />
          <div style={{ margin: '12px 0', height: 1, background: 'var(--border)' }} />
          <TabButton onClick={onLogout} icon={<IconUser size={18} />} label="התנתק" danger />
        </div>

        <div className="card" style={{ minHeight: 400 }}>
          {activeTab === 'account'       && <AccountSettings  user={user}  onUserUpdate={onUserUpdate} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security'      && <SecuritySettings />}
          {activeTab === 'appearance'    && <AppearanceSettings />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderRadius: 'var(--r-md)', background: active ? 'var(--surface-2)' : 'transparent',
        color: danger ? 'var(--warn)' : active ? 'var(--ink-1)' : 'var(--ink-2)',
        fontWeight: active ? 600 : 500, fontSize: 14, border: 'none', cursor: 'pointer',
        textAlign: 'start', transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-1)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusMsg({ status }) {
  if (!status) return null;
  const isError = status.type === 'error';
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 'var(--r-md)', fontSize: 14, marginTop: 16,
      background: isError ? 'var(--warn-soft)' : 'var(--ok-soft, #ecfdf5)',
      color: isError ? 'var(--warn)' : 'var(--ok, #059669)',
      border: `1px solid ${isError ? 'var(--warn-soft)' : 'var(--ok-soft, #a7f3d0)'}`,
    }}>
      {status.msg}
    </div>
  );
}

function AccountSettings({ user, onUserUpdate }) {
  const nameParts = (user?.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName,  setLastName]  = useState(nameParts.slice(1).join(' ') || '');
  const [email,     setEmail]     = useState(user?.email || '');
  const [saving,    setSaving]    = useState(false);
  const [status,    setStatus]    = useState(null);

  async function handleSave() {
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!fullName || !email.trim()) {
      setStatus({ type: 'error', msg: 'יש למלא שם וכתובת דוא״ל' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const updatedUser = await API.updateProfile(fullName, email.trim());
      onUserUpdate(updatedUser);
      setStatus({ type: 'ok', msg: 'הפרטים עודכנו בהצלחה' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'שגיאה בעדכון הפרטים' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>החשבון שלי</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-serif)' }}>
          {(user?.name || 'מ')[0]}
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>תמונת פרופיל — בקרוב</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div>
          <label className="label">שם פרטי</label>
          <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="label">שם משפחה</label>
          <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="label">כתובת דוא״ל</label>
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" type="email" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="label">תפקיד</label>
          <input className="input" value="מדריכה פדגוגית" disabled />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>

      <StatusMsg status={status} />
    </div>
  );
}

function SecuritySettings() {
  const [current,  setCurrent]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [status,   setStatus]   = useState(null);

  async function handleChange() {
    if (!current || !newPass || !confirm) {
      setStatus({ type: 'error', msg: 'יש למלא את כל השדות' });
      return;
    }
    if (newPass !== confirm) {
      setStatus({ type: 'error', msg: 'הסיסמאות החדשות אינן תואמות' });
      return;
    }
    if (newPass.length < 6) {
      setStatus({ type: 'error', msg: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await API.changePassword(current, newPass);
      setCurrent(''); setNewPass(''); setConfirm('');
      setStatus({ type: 'ok', msg: 'הסיסמה עודכנה בהצלחה' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'שגיאה בעדכון הסיסמה' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>אבטחה ופרטיות</h2>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>שינוי סיסמה</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <div>
            <label className="label">סיסמה נוכחית</label>
            <input className="input" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
          <div>
            <label className="label">סיסמה חדשה</label>
            <input className="input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
          </div>
          <div>
            <label className="label">אימות סיסמה חדשה</label>
            <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={handleChange} disabled={saving}>
            {saving ? 'מעדכן...' : 'עדכן סיסמה'}
          </button>
        </div>
        <StatusMsg status={status} />
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>התראות</h2>
      <p style={{ color: 'var(--ink-2)', marginBottom: 24, fontSize: 14 }}>בחר אילו עדכונים ברצונך לקבל ולפלטפורמה המועדפת.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ToggleRow label="עדכונים על סטודנטים חדשים" description="קבל התראה כאשר מתווסף סטודנט לקבוצה שלך." defaultChecked={true} />
        <ToggleRow label="סיכום שבועי" description="דוח שבועי של התקדמות הסטודנטים בהגשות חומרים." defaultChecked={true} />
        <ToggleRow label="התראות מערכת" description="עדכוני גרסה, תחזוקה, והודעות חשובות מהמערכת." defaultChecked={true} />
        <ToggleRow label="הודעות שיווקיות" description="הצעות, טיפים, ועדכונים על כלים חדשים." defaultChecked={false} />
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>תצוגה</h2>
      <p style={{ color: 'var(--ink-2)', marginBottom: 24, fontSize: 14 }}>הגדרות עיצוב מתקדמות זמינות בפאנל "Tweaks" בצד ימין למטה. כאן תוכל לנהל העדפות בסיסיות.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ToggleRow label="מצב כהה" description="הפעלת רקע כהה כברירת מחדל (זמין גם בפאנל Tweaks)." defaultChecked={false} />
        <ToggleRow label="אנימציות" description="הפעלת אפקטי מעבר ואנימציות ממשק לחוויה חלקה." defaultChecked={true} />
      </div>
    </div>
  );
}

function ToggleRow({ label, description, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div>
        <div style={{ fontWeight: 500, color: 'var(--ink-1)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{description}</div>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 100, border: 'none',
          background: checked ? 'var(--brand)' : 'var(--surface-3)',
          position: 'relative', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }} />
      </button>
    </div>
  );
}
