import { useState, useEffect } from 'react';
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakColor, TweakSelect, useTweaks } from './tweaks-panel';
import { TopbarNav, Dashboard, Workspace } from './screens-1-2';
import { HumanNodeModal, SplitEditor } from './screens-3-4';
import { ArchiveScreen, RubricsScreen } from './screens-archive-rubrics';
import { SettingsScreen } from './screens-settings';
import { ExportScreen, AnalyzingScreen, Toast } from './screens-5-app';
import { STUDENTS, EVAL_CATEGORIES, SMART_QUESTIONS } from './data';
import { IconMenu } from './icons';
import { Login } from './Login';
import * as API from './api';

// ─── Convert AI draft → editor categories ─────────────────────────────────────
function draftToCategories(draftCats) {
  if (!draftCats || !Array.isArray(draftCats) || draftCats.length === 0) return EVAL_CATEGORIES;
  return draftCats.map(c => ({
    id: c.id,
    name: c.name,
    weight: c.weight,
    overallLevel: c.overallLevel,
    lessonPlan: c.lessonPlanLevel ? { level: c.lessonPlanLevel, note: c.lessonPlanNote || '', ev: null } : null,
    observation: c.observationLevel ? { level: c.observationLevel, note: c.observationNote || '', ev: null } : null,
    gap: c.hasGap ? { summary: c.gapSummary || '', decisionKey: null, resolution: null } : null,
    balance: c.balance || '',
    emptyHint: c.overallLevel ? undefined : 'תחום זה דורש את הערכתך הישירה.',
  }));
}

// ─── Tweaks config ─────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = { density: 'comfortable', theme: 'honey', dark: false };

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen]   = useState('dashboard');
  const [student, setStudent] = useState(null);
  const [students, setStudents] = useState(STUDENTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [smartQuestions, setSmartQuestions] = useState(SMART_QUESTIONS);
  const [instructorAnswers, setInstructorAnswers] = useState({});
  const [evaluationDraft, setEvaluationDraft] = useState(null);
  const [evaluationId, setEvaluationId] = useState(null);
  const [, setAnalyzeError] = useState(null);
  const [toast, setToast] = useState(null);
  const [studentFiles, setStudentFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // ── Check saved token on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!API.hasToken()) { setLoadingAuth(false); return; }
    API.getMe()
      .then(({ user: u }) => setUser(u))
      .catch(() => { API.logout(); })
      .finally(() => setLoadingAuth(false));
  }, []);

  // ── Load students after login ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    API.getStudents()
      .then(data => { if (data && data.length > 0) setStudents(data); })
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
    document.documentElement.style.removeProperty('--font-sans');
    document.documentElement.style.removeProperty('--font-serif');
  }, [tweaks.density, tweaks.dark, tweaks.theme]);

  // Expose upload helper to Workspace (which calls window.API_uploadFile)
  window.API_uploadFile = API.uploadFile;
  window.API_deleteFile = API.deleteFile;
  window.API_updateCycleTopic = API.updateCycleTopic;

  const refreshStudents = () =>
    API.getStudents().then(data => { if (data?.length) setStudents(data); }).catch(() => {});

  const openStudent = async (s) => {
    setStudent(s);
    setScreen('workspace');
    try {
      const full = await API.getStudent(s.id);
      setStudent(full);
    } catch {}
  };

  const onAnalyze = () => { setAnalyzeError(null); setModalOpen(true); };

  const runAnalysis = async (answers) => {
    setInstructorAnswers(answers || {});
    setModalOpen(false);
    setScreen('analyzing');
    setAnalyzeError(null);
    try {
      const result = await API.analyze(student.id, answers || {});
      setEvaluationId(result.evaluation_id);
      setEvaluationDraft(result.draft);
      if (result.smart_questions?.length) setSmartQuestions(result.smart_questions);
      const files = await API.getFiles(student.id).catch(() => []);
      setStudentFiles(files.filter(f => f.has_text));
      refreshStudents();
      setScreen('editor');
    } catch (err) {
      setAnalyzeError(err.message);
      setScreen('workspace');
      setToast(`שגיאה בניתוח: ${err.message}`);
    }
  };

  const onModalComplete = (answers) => runAnalysis(answers);
  const onModalSkip    = ()         => runAnalysis({});

  const onExport = () => setScreen('export');

  const onFinishExport = async (format = 'pdf') => {
    if (format === 'link') {
      setToast('קישור לשיתוף: ' + window.location.origin + '/eval/' + evaluationId);
      return;
    }
    if (evaluationId) {
      try {
        await API.exportPdf(evaluationId, format);
        await API.saveEvaluation(evaluationId, { status: 'finalized' });
      } catch (e) {
        setToast(`שגיאה בייצוא: ${e.message}`);
        return;
      }
    }
    setToast('ההערכה יוצאה בהצלחה · נשמרה לארכיון');
    setTimeout(() => { setScreen('dashboard'); setStudent(null); setEvaluationDraft(null); setEvaluationId(null); setStudentFiles([]); }, 600);
  };

  const handleLogout = () => { API.logout(); setUser(null); setScreen('dashboard'); };

  const editorCategories = evaluationDraft ? draftToCategories(evaluationDraft.categories) : EVAL_CATEGORIES;
  const editorSummary    = evaluationDraft ? { text: evaluationDraft.summary, score: evaluationDraft.score } : null;

  const showSidebar = ['dashboard', 'workspace', 'archive', 'rubrics', 'settings'].includes(screen);
  const tabBtnStyle = (active) => ({
    padding: '6px 8px', fontSize: 11,
    border: `1px solid ${active ? '#1e3a5f' : 'rgba(0,0,0,.1)'}`,
    background: active ? '#1e3a5f' : 'rgba(255,255,255,.6)',
    color: active ? '#fff' : '#29261b',
    borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
  });
  const firstStudent = students[0] || STUDENTS[0];

  if (loadingAuth) return <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>טוען...</div>;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className={showSidebar ? 'app' : ''} style={!showSidebar ? { height: '100vh', overflow: 'hidden' } : {}}>
      {showSidebar && (
        <TopbarNav
          activeScreen={screen}
          onNav={(s) => { setStudent(null); setScreen(s); setSidebarOpen(false); }}
          instructorName={user.name || user.email.split('@')[0]}
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
                setToast('סטודנט נוצר בהצלחה');
              } catch (err) {
                setToast('שגיאה ביצירת סטודנט: ' + err.message);
              }
            }}
            onImportCSV={async (csvText) => {
              try {
                const result = await API.importStudentsCSV(csvText);
                await refreshStudents();
                setToast(`יובאו ${result.imported} סטודנטים בהצלחה`);
              } catch (err) {
                setToast('שגיאה בייבוא: ' + err.message);
              }
            }}
            onDeleteStudent={async (s) => {
              try {
                await API.deleteStudent(s.id);
                await refreshStudents();
                setToast(`הסטודנט ${s.name} נמחק בהצלחה`);
              } catch (err) {
                setToast('שגיאה במחיקת הסטודנט: ' + err.message);
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
            evaluationId={evaluationId}
            evidenceFiles={studentFiles}
            onBack={() => setScreen('workspace')}
            onExport={onExport}
            onSave={evaluationId ? (draft) => API.saveEvaluation(evaluationId, { draft_json: draft }) : null}
          />
        )}
        {screen === 'export' && student && (
          <ExportScreen
            student={student}
            instructorAnswers={instructorAnswers}
            evaluationDraft={evaluationDraft}
            onBack={() => setScreen('editor')}
            onFinish={onFinishExport}
          />
        )}
      </main>

      <HumanNodeModal
        open={modalOpen}
        questions={smartQuestions}
        onComplete={onModalComplete}
        onSkip={onModalSkip}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="צפיפות" />
        <TweakRadio label="צפיפות" value={tweaks.density} options={[{ value: 'compact', label: 'דחוס' }, { value: 'comfortable', label: 'נוח' }]} onChange={(v) => setTweak('density', v)} />
        <TweakToggle label="מצב כהה" value={!!tweaks.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakSection label="ערכת נושא" />
        <TweakRadio label="ערכת נושא" value={tweaks.theme} options={[{ value: 'honey', label: 'Honey' }, { value: 'mist', label: 'Mist' }, { value: 'clay', label: 'Clay' }]} onChange={(v) => setTweak('theme', v)} />
        <TweakSection label="ניווט" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: '4px 0' }}>
          <button onClick={() => setScreen('dashboard')}                                                  style={tabBtnStyle(screen === 'dashboard')}>1 · דף הבית</button>
          <button onClick={() => { if (!student) setStudent(firstStudent); setScreen('workspace'); }}     style={tabBtnStyle(screen === 'workspace')}>2 · העלאה</button>
          <button onClick={() => { if (!student) setStudent(firstStudent); setModalOpen(true); }}         style={tabBtnStyle(modalOpen)}>3 · מודאל</button>
          <button onClick={() => { if (!student) setStudent(firstStudent); setScreen('editor'); }}        style={tabBtnStyle(screen === 'editor')}>4 · עורך</button>
          <button onClick={() => { if (!student) setStudent(firstStudent); setScreen('export'); }}        style={tabBtnStyle(screen === 'export')}>5 · ייצוא</button>
        </div>
      </TweaksPanel>
    </div>
  );
}

export default App;
