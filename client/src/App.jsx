import { useState, useEffect } from 'react';
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakColor, TweakSelect, useTweaks } from './tweaks-panel';
import { AccessibilityBar } from './accessibility-bar';
import { TopbarNav, Dashboard, Workspace } from './screens-1-2';
import { HumanNodeModal, SplitEditor } from './screens-3-4';
import { ArchiveScreen, RubricsScreen } from './screens-archive-rubrics';
import { SettingsScreen } from './screens-settings';
import { ExportScreen, AnalyzingScreen, Toast } from './screens-5-app';
import { STUDENTS, EVAL_CATEGORIES, SMART_QUESTIONS } from './data';
import { IconMenu } from './icons';
import { Login, SetPassword } from './Login';
import { MapaiLogo } from './MapaiLogo';
import * as API from './api';
import { useLanguage } from './i18n';
import { IconCheck } from './icons';

// ─── Convert AI draft → editor categories ─────────────────────────────────────
function draftToCategories(draftCats, emptyHintText) {
  if (!draftCats || !Array.isArray(draftCats) || draftCats.length === 0) return EVAL_CATEGORIES;
  return draftCats.map(c => ({
    id: c.id,
    name: c.name,
    weight: c.weight,
    score: c.score ?? null,
    indicators: Array.isArray(c.indicators) ? c.indicators : null,
    overallLevel: c.overallLevel,
    // Raw AI drafts carry flat fields; drafts saved from the editor carry these objects.
    lessonPlan: c.lessonPlanLevel ? { level: c.lessonPlanLevel, note: c.lessonPlanNote || '', ev: null } : (c.lessonPlan || null),
    observation: c.observationLevel ? { level: c.observationLevel, note: c.observationNote || '', ev: null } : (c.observation || null),
    gap: c.hasGap ? { summary: c.gapSummary || '', decisionKey: null, resolution: null } : (c.gap || null),
    balance: c.balance || '',
    emptyHint: c.overallLevel ? undefined : emptyHintText,
  }));
}

// ─── Tweaks config ─────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = { density: 'comfortable', theme: 'yellin', dark: false };

function App() {
  const { t, lang } = useLanguage();
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen]   = useState('dashboard');
  const [student, setStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRubricId, setSelectedRubricId] = useState(null);
  const [smartQuestions, setSmartQuestions] = useState(SMART_QUESTIONS);
  const [instructorAnswers, setInstructorAnswers] = useState({});
  const [evaluationDraft, setEvaluationDraft] = useState(null);
  // Latest editor state (instructor edits to text/scores), merged over the AI draft.
  const [editedDraft, setEditedDraft] = useState(null);
  const [evaluationId, setEvaluationId] = useState(null);
  const [, setAnalyzeError] = useState(null);
  const [toast, setToast] = useState(null);
  const [studentFiles, setStudentFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(localStorage.getItem('madapim_privacy_accepted') === 'true');

  // Invitation / reset link: /set-password#<token>
  const [setPasswordToken, setSetPasswordToken] = useState(() => API.readSetPasswordToken());
  const leaveSetPassword = () => { window.history.replaceState(null, '', '/'); setSetPasswordToken(null); };

  // ── Check saved token on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!API.hasToken()) { setLoadingAuth(false); return; }
    API.getMe()
      .then(({ user: u }) => setUser(u))
      .catch(() => { API.logout(); })
      .finally(() => setLoadingAuth(false));
  }, []);

  // ── Back to login when the server rejects the session ─────────────────────
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(API.SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(API.SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // ── Load students after login ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    API.getStudents()
      .then(data => setStudents(data || []))
      .catch(err => console.warn('Could not load students:', err.message));
  }, [user]);

  // ── Tweak CSS vars ────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-density', tweaks.density);
    document.documentElement.setAttribute('data-dark', String(!!tweaks.dark));
    document.documentElement.setAttribute('data-theme', tweaks.theme);

    // Clean up old overridden properties to let the CSS theme take over
    document.documentElement.style.removeProperty('--brand');
    document.documentElement.style.removeProperty('--brand-2');
    document.documentElement.style.removeProperty('--brand-3');
    document.documentElement.style.removeProperty('--brand-soft');
    document.documentElement.style.removeProperty('--brand-softer');

    // Arabic font
    if (lang === 'ar') {
      document.documentElement.style.setProperty('--font-sans', "'Cairo', 'Heebo', sans-serif");
      document.documentElement.style.setProperty('--font-serif', "'Cairo', 'Heebo', sans-serif");
    } else {
      document.documentElement.style.removeProperty('--font-sans');
      document.documentElement.style.removeProperty('--font-serif');
    }
  }, [tweaks.density, tweaks.dark, tweaks.theme, lang]);

  // Expose upload helper to Workspace (which calls window.API_uploadFile)
  window.API_uploadFile = API.uploadFile;
  window.API_deleteFile = API.deleteFile;
  window.API_updateCycleTopic = API.updateCycleTopic;
  window.API_addCycle = API.addCycle;
  window.API_deleteCycle = API.deleteCycle;

  const refreshStudents = () =>
    API.getStudents().then(data => setStudents(data || [])).catch(() => {});

  const openStudent = async (s) => {
    setStudent(s);
    setScreen('workspace');
    try {
      const full = await API.getStudent(s.id);
      setStudent(full);
    } catch {}
  };

  const [evalDateRange, setEvalDateRange] = useState(null);

  const onAnalyze = (rubricId, dateRange) => { 
    setSelectedRubricId(rubricId); 
    setEvalDateRange(dateRange);
    setAnalyzeError(null); 
    setModalOpen(true); 
  };

  const runAnalysis = async (answers) => {
    setInstructorAnswers(answers || {});
    setModalOpen(false);
    setScreen('analyzing');
    setAnalyzeError(null);
    try {
      const result = await API.analyze(student.id, answers || {}, selectedRubricId, evalDateRange);
      setEvaluationId(result.evaluation_id);
      setEvaluationDraft(result.draft);
      setEditedDraft(null);
      if (result.smart_questions?.length) setSmartQuestions(result.smart_questions);
      const files = await API.getFiles(student.id).catch(() => []);
      setStudentFiles(files.filter(f => f.has_text));
      refreshStudents();
      setScreen('editor');
    } catch (err) {
      setAnalyzeError(err.message);
      setScreen('workspace');
      setToast(`${t('error_analysis')}: ${err.message}`);
    }
  };

  const onModalComplete = (answers) => runAnalysis(answers);
  const onModalSkip    = ()         => runAnalysis({});

  const onExport = () => setScreen('export');

  const onFinishExport = async (format = 'pdf') => {
    if (format === 'link') {
      setToast(t('share_link') + ': ' + window.location.origin + '/eval/' + evaluationId);
      return;
    }
    if (evaluationId) {
      try {
        await API.exportPdf(evaluationId, format);
        await API.saveEvaluation(evaluationId, { status: 'finalized' });
      } catch (e) {
        setToast(`${t('error_export')}: ${e.message}`);
        return;
      }
    }
    setToast(t('export_success'));
    setTimeout(() => { setScreen('dashboard'); setStudent(null); setEvaluationDraft(null); setEditedDraft(null); setEvaluationId(null); setStudentFiles([]); }, 600);
  };

  const handleLogout = () => { API.logout(); setUser(null); setScreen('dashboard'); };

  const currentDraft     = editedDraft || evaluationDraft;
  const editorCategories = currentDraft ? draftToCategories(currentDraft.categories, t('empty_hint')) : EVAL_CATEGORIES;
  const editorSummary    = currentDraft ? { text: currentDraft.summary, score: currentDraft.score, strengths: currentDraft.strengths || [], goals: currentDraft.goals || [] } : null;

  const saveEditorDraft = async (draft) => {
    const merged = { ...evaluationDraft, ...draft };
    setEditedDraft(merged);
    const updates = { draft_json: merged };
    if (Number.isFinite(Number(merged.score)) && merged.score !== null && merged.score !== '') updates.score = Number(merged.score);
    return API.saveEvaluation(evaluationId, updates);
  };

  const showSidebar = ['dashboard', 'workspace', 'archive', 'rubrics', 'settings'].includes(screen);
  const tabBtnStyle = (active) => ({
    padding: '6px 8px', fontSize: 11,
    border: `1px solid ${active ? '#1a2a63' : 'rgba(0,0,0,.1)'}`,
    background: active ? '#1a2a63' : 'rgba(255,255,255,.6)',
    color: active ? '#fff' : '#29261b',
    borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
  });
  const firstStudent = students[0] || STUDENTS[0];

  if (setPasswordToken !== null) {
    return <SetPassword token={setPasswordToken} onDone={u => { leaveSetPassword(); setUser(u); }} onCancel={leaveSetPassword} />;
  }
  if (loadingAuth) return <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>{t('loading')}</div>;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className={showSidebar ? 'app' : ''} style={!showSidebar ? { height: '100vh', overflow: 'hidden' } : {}}>
      {showSidebar && (
        <TopbarNav
          activeScreen={screen}
          onNav={(s) => { setStudent(null); setScreen(s); setSidebarOpen(false); }}
          instructorName={user.name || user.email.split('@')[0]}
          studentCount={students.length}
          onLogout={handleLogout}
        />
      )}

      <main className="main" style={!showSidebar ? { height: '100vh', overflow: 'hidden' } : {}}>
        {screen === 'dashboard' && (
          <Dashboard
            students={students}
            onOpenStudent={openStudent}
            cardLayout={tweaks.cardLayout}
            onCreateStudent={async (data) => {
              try {
                await API.createStudent(data);
                await refreshStudents();
                setToast(t('student_created'));
              } catch (err) {
                setToast(`${t('error_create_student')}: ${err.message}`);
              }
            }}
            onImportCSV={async (csvText) => {
              try {
                const result = await API.importStudentsCSV(csvText);
                await refreshStudents();
                setToast(t('students_imported', { n: result.imported }));
              } catch (err) {
                setToast(`${t('error_import')}: ${err.message}`);
              }
            }}
            onDeleteStudent={async (s) => {
              try {
                await API.deleteStudent(s.id);
                await refreshStudents();
                setToast(t('student_deleted', { name: s.name }));
              } catch (err) {
                setToast(`${t('error_delete_student')}: ${err.message}`);
              }
            }}
          />
        )}
        {screen === 'archive'   && <ArchiveScreen />}
        {screen === 'rubrics'   && <RubricsScreen />}
        {screen === 'settings'  && <SettingsScreen user={user} onLogout={handleLogout} onUserUpdate={setUser} />}
        {screen === 'workspace' && student && (
          <Workspace
            student={student}
            onBack={() => setScreen('dashboard')}
            onAnalyze={onAnalyze}
            onFileUploaded={() => API.getStudent(student.id).then(s => setStudent(s)).catch(() => {})}
            onCycleAdded={() => API.getStudent(student.id).then(s => setStudent(s)).catch(() => {})}
          />
        )}
        {screen === 'analyzing' && <AnalyzingScreen />}
        {screen === 'editor' && student && (
          <SplitEditor
            student={student}
            instructorAnswers={instructorAnswers}
            aiTone="formal"
            evalCategories={editorCategories}
            evalSummary={editorSummary}
            rubricName={evaluationDraft?.rubricName || null}
            evaluationId={evaluationId}
            evidenceFiles={studentFiles}
            onBack={() => setScreen('workspace')}
            onExport={onExport}
            onSave={evaluationId ? saveEditorDraft : null}
          />
        )}
        {screen === 'export' && student && (
          <ExportScreen
            student={student}
            instructorAnswers={instructorAnswers}
            evaluationDraft={currentDraft}
            onBack={() => setScreen('editor')}
            onFinish={onFinishExport}
          />
        )}
      </main>

      {/* Privacy & Terms Modal */}
      {!privacyAccepted && user && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card fade-in" style={{ width: 500, padding: 32, background: 'var(--surface-1)' }}>
            <MapaiLogo height={84} alt="מפAI – העוזר החכם למד״פ" style={{ display: 'flex', width: 'fit-content', marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, margin: '0 0 16px', color: 'var(--ink-1)' }}>ברוכים הבאים למפAI</h2>
            <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 24 }}>
              <p style={{ marginBottom: 12 }}><strong>פרטיות מעל הכל:</strong> אנא הקפידו להזין אך ורק <b>שם פרטי</b> של הסטודנטים או המעורבים בשיעור. אין להזין פרטים מזהים כגון תעודת זהות, אימייל, טלפון או שם משפחה.</p>
              <p style={{ marginBottom: 12 }}><strong>איך זה עובד?</strong> המערכת מאפשרת להעלות חומרים מתצפיות ומערכי שיעור (או טקסט ותמלולים). לאחר מכן, מתבצע ניתוח ראשוני מבוסס מחוונים. באפשרותך לערוך את הניתוח, לאשר אותו, ולייצר משוב מנוסח המיועד ישירות לסטודנט/ית.</p>
              <p style={{ marginBottom: 12 }}><strong>זכויות יוצרים:</strong> התוצרים נוצרים בסיוע בינה מלאכותית ויש לעבור עליהם ולאשרם בטרם שליחה. אין להעלות חומרים המוגנים בזכויות יוצרים ללא אישור.</p>
              <p style={{ marginBottom: 0, fontSize: 13, color: 'var(--ink-3)' }}>פותח ע״י דוד ילין. תודה לועדת ההיגוי: (שמות חברי הועדה יתווספו בהמשך).</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-lg" onClick={() => {
                localStorage.setItem('madapim_privacy_accepted', 'true');
                setPrivacyAccepted(true);
              }}>
                <IconCheck size={18} /> קראתי ואני מאשר/ת
              </button>
            </div>
          </div>
        </div>
      )}

      <HumanNodeModal
        open={modalOpen}
        questions={smartQuestions}
        onComplete={onModalComplete}
        onSkip={onModalSkip}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <AccessibilityBar />

      <TweaksPanel title="Tweaks">
        <TweakSection label={t('tweaks_density')} />
        <TweakRadio label={t('tweaks_density')} value={tweaks.density} options={[{ value: 'compact', label: t('tweaks_compact') }, { value: 'comfortable', label: t('tweaks_comfortable') }]} onChange={(v) => setTweak('density', v)} />
        <TweakToggle label={t('tweaks_dark_mode')} value={!!tweaks.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakSection label={t('tweaks_theme')} />
        <TweakRadio label={t('tweaks_theme')} value={tweaks.theme} options={[{ value: 'yellin', label: 'David Yellin' }, { value: 'honey', label: 'Honey' }, { value: 'mist', label: 'Mist' }, { value: 'clay', label: 'Clay' }]} onChange={(v) => setTweak('theme', v)} />
        <TweakSection label={t('tweaks_nav')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: '4px 0' }}>
          <button onClick={() => setScreen('dashboard')}                                                  style={tabBtnStyle(screen === 'dashboard')}>1 · {t('tweaks_home')}</button>
          <button onClick={() => { if (!student) setStudent(firstStudent); setScreen('workspace'); }}     style={tabBtnStyle(screen === 'workspace')}>2 · {t('tweaks_upload')}</button>
          <button onClick={() => { if (!student) setStudent(firstStudent); setModalOpen(true); }}         style={tabBtnStyle(modalOpen)}>3 · {t('tweaks_modal')}</button>
          <button onClick={() => { if (!student) setStudent(firstStudent); setScreen('editor'); }}        style={tabBtnStyle(screen === 'editor')}>4 · {t('tweaks_editor')}</button>
          <button onClick={() => { if (!student) setStudent(firstStudent); setScreen('export'); }}        style={tabBtnStyle(screen === 'export')}>5 · {t('tweaks_export')}</button>
        </div>
      </TweaksPanel>
    </div>
  );
}

export default App;
