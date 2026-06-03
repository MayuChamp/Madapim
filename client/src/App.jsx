import { useState, useEffect } from 'react';
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakColor, TweakSelect, useTweaks } from './tweaks-panel';
import { Sidebar, Dashboard, Workspace } from './screens-1-2';
import { HumanNodeModal, SplitEditor } from './screens-3-4';
import { ArchiveScreen, RubricsScreen } from './screens-archive-rubrics';
import { ExportScreen, AnalyzingScreen, Toast } from './screens-5-app';
import { STUDENTS, EVAL_CATEGORIES, SMART_QUESTIONS } from './data';
import { IconMenu } from './icons';
import { Login } from './Login';
import * as API from './api';

// ─── Convert AI draft → editor categories ─────────────────────────────────────
function draftToCategories(draftCats) {
  if (!draftCats || draftCats.length === 0) return EVAL_CATEGORIES;
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
const TWEAK_DEFAULTS = { density: 'comfortable', cardLayout: 'grid', dark: false, accent: '#1e3a5f', fontPair: 'frank-heebo' };
const FONT_PAIRS = {
  'frank-heebo':    { label: 'Frank Ruhl + Heebo',    sans: "'Heebo',system-ui,sans-serif",      serif: "'Frank Ruhl Libre',serif" },
  'noto-assistant': { label: 'Noto Serif + Assistant', sans: "'Assistant',system-ui,sans-serif",  serif: "'Noto Serif Hebrew',serif" },
  'rubik-shippori': { label: 'Rubik + Shippori',       sans: "'Rubik',system-ui,sans-serif",      serif: "'David Libre','Noto Serif Hebrew',serif" },
};
const ACCENT_PALETTES = [
  ['#1e3a5f', '#2c5282', '#3b6fa5', '#e8eef5', '#f3f6fa'],
  ['#2c4a3e', '#3a5d4f', '#5d8270', '#e6eee9', '#eef4f0'],
  ['#5b3d6e', '#724e89', '#9678a8', '#ede6f0', '#f3eef5'],
  ['#8b3a1a', '#a04b29', '#bb6843', '#f4e3da', '#f8ece2'],
];

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
    const palette = ACCENT_PALETTES.find(p => p[0] === tweaks.accent) || ACCENT_PALETTES[0];
    document.documentElement.style.setProperty('--brand', palette[0]);
    document.documentElement.style.setProperty('--brand-2', palette[1]);
    document.documentElement.style.setProperty('--brand-3', palette[2]);
    document.documentElement.style.setProperty('--brand-soft', palette[3]);
    document.documentElement.style.setProperty('--brand-softer', palette[4]);
    const fp = FONT_PAIRS[tweaks.fontPair] || FONT_PAIRS['frank-heebo'];
    document.documentElement.style.setProperty('--font-sans', fp.sans);
    document.documentElement.style.setProperty('--font-serif', fp.serif);
  }, [tweaks.density, tweaks.dark, tweaks.accent, tweaks.fontPair]);

  const refreshStudents = () =>
    API.getStudents().then(data => { if (data?.length) setStudents(data); }).catch(() => {});

  const openStudent = (s) => { setStudent(s); setScreen('workspace'); };

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

  const onFinishExport = async () => {
    if (evaluationId) {
      try { await API.exportPdf(evaluationId); } catch (e) { console.warn('PDF:', e.message); }
    }
    setToast('ההערכה יוצאה בהצלחה · נשמרה לארכיון');
    setTimeout(() => { setScreen('dashboard'); setStudent(null); setEvaluationDraft(null); setEvaluationId(null); }, 600);
  };

  const handleLogout = () => { API.logout(); setUser(null); setScreen('dashboard'); };

  const editorCategories = evaluationDraft ? draftToCategories(evaluationDraft.categories) : EVAL_CATEGORIES;
  const editorSummary    = evaluationDraft ? { text: evaluationDraft.summary, score: evaluationDraft.score } : null;

  const showSidebar = ['dashboard', 'workspace', 'archive', 'rubrics'].includes(screen);
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
        <Sidebar
          activeScreen={screen}
          onNav={(s) => { setStudent(null); setScreen(s); setSidebarOpen(false); }}
          instructorName={user.name || user.email.split('@')[0]}
          mobOpen={sidebarOpen}
          onMobClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      )}
      {showSidebar && (
        <button className="mob-menu-btn" aria-label="פתח תפריט"
          style={{ position: 'fixed', top: 14, right: 14, zIndex: 30 }}
          onClick={() => setSidebarOpen(true)}>
          <IconMenu size={20} />
        </button>
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
          />
        )}
        {screen === 'archive'   && <ArchiveScreen />}
        {screen === 'rubrics'   && <RubricsScreen />}
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
        <TweakRadio label="תצוגת סטודנטים" value={tweaks.cardLayout} options={[{ value: 'grid', label: 'כרטיסיות' }, { value: 'list', label: 'רשימה' }]} onChange={(v) => setTweak('cardLayout', v)} />
        <TweakToggle label="מצב כהה" value={!!tweaks.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakSection label="עיצוב" />
        <TweakColor label="צבע אקצנט" value={tweaks.accent} options={ACCENT_PALETTES.map(p => p[0])} onChange={(v) => setTweak('accent', v)} />
        <TweakSelect label="גופן" value={tweaks.fontPair} options={Object.keys(FONT_PAIRS).map(k => ({ value: k, label: FONT_PAIRS[k].label }))} onChange={(v) => setTweak('fontPair', v)} />
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
