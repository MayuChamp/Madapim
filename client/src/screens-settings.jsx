import React, { useState, useEffect } from 'react';
import { IconUser, IconBell, IconLock, IconPalette, IconUsers, IconTrash, IconPlus, IconDoc, IconEye } from './icons';
import * as API from './api';
import { useLanguage } from './i18n';

export function SettingsScreen({ user, onLogout, onUserUpdate }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="main-inner fade-in">
      <div style={{ marginBottom: 'var(--gap-5)' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 600, margin: 0, color: 'var(--ink-1)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{t('settings_title')}</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '10px 0 0', maxWidth: 540, lineHeight: 1.6 }}>{t('settings_desc')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--gap-5)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <TabButton active={activeTab === 'account'}       onClick={() => setActiveTab('account')}       icon={<IconUser size={18} />}    label={t('tab_account')} />
          <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<IconBell size={18} />}    label={t('tab_notifications')} />
          <TabButton active={activeTab === 'security'}      onClick={() => setActiveTab('security')}      icon={<IconLock size={18} />}    label={t('tab_security')} />
          <TabButton active={activeTab === 'appearance'}    onClick={() => setActiveTab('appearance')}    icon={<IconPalette size={18} />} label={t('tab_appearance')} />
          <TabButton active={activeTab === 'program'}       onClick={() => setActiveTab('program')}       icon={<IconDoc size={18} />}     label={t('tab_program')} />
          {user?.role === 'admin' && (
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<IconUsers size={18} />} label={t('tab_users')} />
          )}
          <div style={{ margin: '12px 0', height: 1, background: 'var(--border)' }} />
          <TabButton onClick={onLogout} icon={<IconUser size={18} />} label={t('tab_logout')} danger />
        </div>

        <div className="card" style={{ minHeight: 400 }}>
          {activeTab === 'account'       && <AccountSettings  user={user}  onUserUpdate={onUserUpdate} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security'      && <SecuritySettings />}
          {activeTab === 'appearance'    && <AppearanceSettings />}
          {activeTab === 'program'       && <ProgramSettings />}
          {activeTab === 'users'         && <UsersManagement currentUserId={user?.id} />}
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
  const { t } = useLanguage();
  const nameParts = (user?.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName,  setLastName]  = useState(nameParts.slice(1).join(' ') || '');
  const [email,     setEmail]     = useState(user?.email || '');
  const [saving,    setSaving]    = useState(false);
  const [status,    setStatus]    = useState(null);

  async function handleSave() {
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!fullName || !email.trim()) {
      setStatus({ type: 'error', msg: t('error_fill_name_email') });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const updatedUser = await API.updateProfile(fullName, email.trim());
      onUserUpdate(updatedUser);
      setStatus({ type: 'ok', msg: t('profile_updated') });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || t('error_update_profile') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>{t('account_title')}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-serif)' }}>
          {(user?.name || 'מ')[0]}
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('profile_pic_soon')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div>
          <label className="label">{t('field_first_name')}</label>
          <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('field_last_name')}</label>
          <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="label">{t('field_email_label')}</label>
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" type="email" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="label">{t('field_role_label')}</label>
          <input className="input" value={t('role_instructor_val')} disabled />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('saving') : t('btn_save_changes')}
        </button>
      </div>

      <StatusMsg status={status} />
    </div>
  );
}

function SecuritySettings() {
  const { t } = useLanguage();
  const [current,  setCurrent]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [status,   setStatus]   = useState(null);

  async function handleChange() {
    if (!current || !newPass || !confirm) {
      setStatus({ type: 'error', msg: t('error_fill_all') });
      return;
    }
    if (newPass !== confirm) {
      setStatus({ type: 'error', msg: t('error_pw_mismatch') });
      return;
    }
    if (newPass.length < 6) {
      setStatus({ type: 'error', msg: t('error_pw_short') });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await API.changePassword(current, newPass);
      setCurrent(''); setNewPass(''); setConfirm('');
      setStatus({ type: 'ok', msg: t('pw_updated') });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || t('error_update_pw') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>{t('security_title')}</h2>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{t('change_password')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <div>
            <label className="label">{t('field_current_pw')}</label>
            <input className="input" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('field_new_pw')}</label>
            <input className="input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('field_confirm_pw')}</label>
            <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={handleChange} disabled={saving}>
            {saving ? t('updating') : t('btn_update_pw')}
          </button>
        </div>
        <StatusMsg status={status} />
      </div>
    </div>
  );
}

function NotificationSettings() {
  const { t } = useLanguage();
  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>{t('notifications_title')}</h2>
      <p style={{ color: 'var(--ink-2)', marginBottom: 24, fontSize: 14 }}>{t('notifications_desc')}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ToggleRow label={t('notif_new_students_label')} description={t('notif_new_students_desc')} defaultChecked={true} />
        <ToggleRow label={t('notif_weekly_label')} description={t('notif_weekly_desc')} defaultChecked={true} />
        <ToggleRow label={t('notif_system_label')} description={t('notif_system_desc')} defaultChecked={true} />
        <ToggleRow label={t('notif_marketing_label')} description={t('notif_marketing_desc')} defaultChecked={false} />
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const { t, lang, setLang } = useLanguage();
  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>{t('appearance_title')}</h2>
      <p style={{ color: 'var(--ink-2)', marginBottom: 24, fontSize: 14 }}>{t('appearance_desc')}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ToggleRow label={t('appearance_dark_label')} description={t('appearance_dark_desc')} defaultChecked={false} />
        <ToggleRow label={t('appearance_animations_label')} description={t('appearance_animations_desc')} defaultChecked={true} />
      </div>

      <div style={{ paddingTop: 20, borderTop: '1px solid var(--border-soft)', marginTop: 4 }}>
        <div style={{ fontWeight: 500, color: 'var(--ink-1)', marginBottom: 4 }}>{t('language_label')}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {[
            { code: 'he', label: t('language_he') },
            { code: 'en', label: t('language_en') },
            { code: 'ar', label: t('language_ar') },
          ].map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                padding: '8px 18px', borderRadius: 'var(--r-md)', border: `1.5px solid ${lang === l.code ? 'var(--brand)' : 'var(--border)'}`,
                background: lang === l.code ? 'var(--brand-soft)' : 'transparent',
                color: lang === l.code ? 'var(--brand)' : 'var(--ink-2)',
                fontWeight: lang === l.code ? 600 : 400, fontSize: 14, cursor: 'pointer', transition: 'all .15s',
                fontFamily: 'inherit',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgramSettings() {
  const { t } = useLanguage();
  const [maxLessonPlans, setMaxLessonPlans] = useState(5);
  const [maxObservations, setMaxObservations] = useState(3);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    API.getProgramSettings()
      .then(data => {
        setMaxLessonPlans(data.maxLessonPlans);
        setMaxObservations(data.maxObservations);
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await API.updateProgramSettings({ maxLessonPlans, maxObservations });
      setStatus({ type: 'ok', msg: t('program_settings_saved') });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
    }
  }

  function QuotaInput({ value, onChange, icon, label, description }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</div>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--ink-1)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.4 }}>{description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => onChange(Math.max(1, value - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 18, color: 'var(--ink-2)', display: 'grid', placeItems: 'center' }}>−</button>
          <div style={{ minWidth: 36, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--ink-1)' }}>{value}</div>
          <button onClick={() => onChange(Math.min(20, value + 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 18, color: 'var(--ink-2)', display: 'grid', placeItems: 'center' }}>+</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 8px', color: 'var(--ink-1)' }}>{t('program_settings_title')}</h2>
      <p style={{ color: 'var(--ink-2)', marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>{t('program_settings_desc')}</p>

      <QuotaInput
        value={maxLessonPlans}
        onChange={setMaxLessonPlans}
        icon={<IconDoc size={18} />}
        label={t('program_lesson_plans_label')}
        description={t('program_lesson_plans_desc')}
      />
      <QuotaInput
        value={maxObservations}
        onChange={setMaxObservations}
        icon={<IconEye size={18} />}
        label={t('program_observations_label')}
        description={t('program_observations_desc')}
      />

      <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
        ⚠ {t('program_settings_note')}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('saving') : t('btn_save_changes')}
        </button>
      </div>

      <StatusMsg status={status} />
    </div>
  );
}

function UsersManagement({ currentUserId }) {
  const { t } = useLanguage();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [status,   setStatus]   = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('instructor');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    API.getUsers()
      .then(setUsers)
      .catch(err => setStatus({ type: 'error', msg: err.message }))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setStatus({ type: 'error', msg: t('error_fill_all_fields') });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const newUser = await API.createUser({ name: name.trim(), email: email.trim(), password, role });
      setUsers(prev => [...prev, newUser]);
      setName(''); setEmail(''); setPassword(''); setRole('instructor');
      setShowForm(false);
      setStatus({ type: 'ok', msg: t('user_created_msg', { name: newUser.name }) });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || t('error_create_user') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(userId, userName) {
    if (!window.confirm(t('confirm_delete_user', { name: userName }))) return;
    setDeleting(userId);
    try {
      await API.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setStatus({ type: 'ok', msg: t('user_deleted_msg', { name: userName }) });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || t('error_delete_user') });
    } finally {
      setDeleting(null);
    }
  }

  const roleLabel = r => r === 'admin' ? t('role_admin_label') : t('role_instructor_label');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: 0, color: 'var(--ink-1)' }}>{t('users_title')}</h2>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => { setShowForm(f => !f); setStatus(null); }}
        >
          <IconPlus size={16} />
          {t('btn_new_user')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface-1)', borderRadius: 'var(--r-md)', padding: 24, marginBottom: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: 'var(--ink-1)' }}>{t('create_user_title')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">{t('field_full_name')}</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" />
            </div>
            <div>
              <label className="label">{t('field_email_label')}</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" dir="ltr" />
            </div>
            <div>
              <label className="label">{t('field_password_label')}</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="label">{t('field_role_select')}</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="instructor">{t('opt_instructor')}</option>
                <option value="admin">{t('opt_admin')}</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('creating') : t('btn_create_user')}</button>
          </div>
        </form>
      )}

      <StatusMsg status={status} />

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>{t('loading')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
                  {(u.name || u.email)[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--ink-1)', fontSize: 14 }}>{u.name || '—'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)' }} dir="ltr">{u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: u.role === 'admin' ? 'var(--brand-soft)' : 'var(--surface-2)', color: u.role === 'admin' ? 'var(--brand)' : 'var(--ink-2)', fontWeight: 500 }}>
                  {roleLabel(u.role)}
                </span>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id, u.name || u.email)}
                    disabled={deleting === u.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--warn)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}
                    title={t('delete_user_title')}
                  >
                    <IconTrash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>{t('no_users')}</div>
          )}
        </div>
      )}
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
