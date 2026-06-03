import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Icons from './icons';
import { Icon, IconHome, IconUsers, IconArchive, IconSettings, IconFolder, IconFile, IconUpload, IconPlus, IconArrowLeft, IconArrowRight, IconChevron, IconPencil, IconMagic, IconMic, IconSearch, IconClose, IconCheck, IconDownload, IconSave, IconSend, IconSparkle, IconBookmark, IconDoc, IconWave, IconGrid, IconList, IconClock, IconArchiveBox, IconAlert, IconGraduationCap } from './icons';
import { STUDENTS, EVAL_CATEGORIES, EVIDENCES, RUBRIC_DETAILS, ARCHIVED, SMART_QUESTIONS, STAGE_LABELS, CYCLE_STATUS } from './data';



function Sidebar({ activeScreen, onNav, instructorName, mobOpen, onMobClose, onLogout }) {
  const initials = (instructorName || 'מ').slice(0, 1);
  return (
    <>
      {mobOpen&&<div className="mob-overlay mob-open" onClick={onMobClose}/>}
    <aside className={`sidebar${mobOpen?' mob-open':''}`}>
      <div className="brand-mark">
        <div className="brand-glyph">ה</div>
        <div className="brand-text"><b>הערכה</b><span>כלי הדרכה פדגוגית</span></div>
      </div>
      <div className="user-chip">
        <div className="avatar">{initials}</div>
        <div>
          <div style={{color:'var(--ink-1)',fontWeight:500}}>שלום, {instructorName}</div>
          <div style={{fontSize:11,color:'var(--ink-3)'}}>מדריכה פדגוגית</div>
        </div>
      </div>
      <div>
        <div className="nav-section-label">עבודה</div>
        <nav className="nav">
          <button className={`nav-item ${activeScreen==='dashboard'?'active':''}`} onClick={()=>onNav('dashboard')}><IconUsers className="icon" /> הסטודנטים שלי</button>
          <button className={`nav-item ${activeScreen==='archive'?'active':''}`} onClick={()=>onNav('archive')}><IconArchiveBox className="icon" /> ארכיון הערכות</button>
          <button className={`nav-item ${activeScreen==='rubrics'?'active':''}`} onClick={()=>onNav('rubrics')}><IconBookmark className="icon" /> מחוונים</button>
        </nav>
      </div>
      <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:2}}>
        <button className="nav-item"><IconSettings className="icon" /> הגדרות</button>
        {onLogout && (
          <button className="nav-item" onClick={onLogout} style={{color:'var(--warn)'}}>
            <IconArrowLeft className="icon"/> יציאה
          </button>
        )}
      </div>
    </aside>
    </>
  );
}

function Dashboard({ students = STUDENTS, onOpenStudent, cardLayout, onCreateStudent, onImportCSV }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', school: '', grade: '', subjectTrack: '' });
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const counts = { pending:students.filter(s=>s.status==='pending').length, ready:students.filter(s=>s.status==='ready').length, in_progress:students.filter(s=>s.status==='in_progress').length, not_started:students.filter(s=>s.status==='not_started').length };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (onCreateStudent) {
      await onCreateStudent(newStudent);
      setShowAddModal(false);
      setNewStudent({ name: '', school: '', grade: '', subjectTrack: '' });
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!onImportCSV) return;
    setImporting(true);
    try {
      await onImportCSV(csvText);
      setShowImportModal(false);
      setCsvText('');
    } catch {}
    setImporting(false);
  };

  const handleFileRead = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="main-inner fade-in">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'var(--gap-5)'}}>
        <div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,letterSpacing:'0.02em'}}>סמסטר ב׳ · תשפ"ו · קבוצת הדרכה 14</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em',lineHeight:1.1}}>הסטודנטים שלי</h1>
          <p style={{fontSize:15,color:'var(--ink-2)',margin:'10px 0 0',maxWidth:540,lineHeight:1.6}}>ריכוז של כלל הסטודנטים תחת אחריותך. בחרי כרטיסיה כדי להעלות חומרים, להפעיל ניתוח ולערוך טיוטת הערכה.</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary btn-lg" onClick={()=>setShowImportModal(true)}><IconUpload size={16}/> ייבוא רשימה</button>
          <button className="btn btn-primary btn-lg" onClick={()=>setShowAddModal(true)}><IconPlus size={16}/> הוסף סטודנט</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'var(--gap-3)',marginBottom:'var(--gap-5)'}}>
        <StatTile n={counts.pending} label="ממתינות להתייחסותך" tone="warn" icon={<IconAlert size={14}/>}/>
        <StatTile n={counts.in_progress} label="בעבודה" tone="info" icon={<IconClock size={14}/>}/>
        <StatTile n={counts.ready} label="מוכנות לייצוא" tone="ok" icon={<IconCheck size={14}/>}/>
        <StatTile n={counts.not_started} label="טרם הותחלו" tone="neutral" icon={<IconFolder size={14}/>}/>
      </div>
      <div className="section-title"><h2>הקבוצה</h2><div style={{display:'flex',alignItems:'center',gap:12}}><span className="hint">{students.length} סטודנטים</span></div></div>
      {cardLayout==='grid' ? <StudentsGrid students={students} onOpen={onOpenStudent}/> : <StudentsList students={students} onOpen={onOpenStudent}/>}

      {/* Add single student modal */}
      {showAddModal && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="card fade-in" style={{width: 400, padding: 24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0}}>הוסף סטודנט חדש</h2>
              <button className="btn-ghost" onClick={()=>setShowAddModal(false)}><IconClose size={16}/></button>
            </div>
            <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">שם מלא</label>
                <input className="input" required value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name: e.target.value})} placeholder="לדוגמה: משה לוי" />
              </div>
              <div>
                <label className="label">בית ספר מאמן</label>
                <input className="input" value={newStudent.school} onChange={e=>setNewStudent({...newStudent, school: e.target.value})} placeholder="לדוגמה: יסודי הרצוג" />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label className="label">כיתה</label>
                  <input className="input" value={newStudent.grade} onChange={e=>setNewStudent({...newStudent, grade: e.target.value})} placeholder="לדוגמה: כיתה ד׳" />
                </div>
                <div>
                  <label className="label">מסלול הוראה</label>
                  <input className="input" value={newStudent.subjectTrack} onChange={e=>setNewStudent({...newStudent, subjectTrack: e.target.value})} placeholder="מתמטיקה, אנגלית..." />
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowAddModal(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary"><IconCheck size={14}/> שמור</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV import modal */}
      {showImportModal && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="card fade-in" style={{width:520,padding:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0}}>ייבוא רשימת סטודנטים</h2>
              <button className="btn-ghost" onClick={()=>setShowImportModal(false)}><IconClose size={16}/></button>
            </div>
            <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:16,lineHeight:1.6,background:'var(--surface-2)',padding:'10px 14px',borderRadius:'var(--r-sm)'}}>
              <strong>פורמט CSV:</strong> שורה ראשונה = כותרות, לפחות עמודת <code>שם</code>.<br/>
              עמודות אופציונליות: <code>בית ספר, כיתה, מסלול</code><br/>
              <strong>דוגמה:</strong> <code style={{direction:'ltr',display:'inline-block'}}>שם,בית ספר,כיתה,מסלול</code>
            </div>
            <form onSubmit={handleImport} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">טעינת קובץ CSV</label>
                <input type="file" accept=".csv,.txt" onChange={handleFileRead} style={{fontSize:13,color:'var(--ink-2)'}}/>
              </div>
              <div>
                <label className="label">או הדבק תוכן CSV</label>
                <textarea className="input" rows={8} dir="ltr" value={csvText} onChange={e=>setCsvText(e.target.value)}
                  style={{fontFamily:'var(--font-mono)',fontSize:12}}
                  placeholder={"שם,בית ספר,כיתה,מסלול\nמשה לוי,יסודי הרצוג,כיתה ד׳,מתמטיקה\nדנה כהן,ניסויי יסוד,כיתה ב׳,אנגלית"}/>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowImportModal(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary" disabled={importing || !csvText.trim()}>
                  <IconUpload size={14}/> {importing ? 'מייבא...' : 'ייבא סטודנטים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ n, label, tone, icon }) {
  const toneMap = { warn:{fg:'var(--warn)',bg:'var(--warn-soft)'}, ok:{fg:'var(--ok)',bg:'var(--ok-soft)'}, info:{fg:'var(--info)',bg:'var(--info-soft)'}, neutral:{fg:'var(--ink-3)',bg:'var(--surface-2)'} };
  const c = toneMap[tone];
  return (
    <div className="card" style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:14}}>
      <div style={{width:36,height:36,borderRadius:8,background:c.bg,color:c.fg,display:'grid',placeItems:'center',flexShrink:0}}>{icon}</div>
      <div><div style={{fontFamily:'var(--font-serif)',fontSize:26,fontWeight:600,color:'var(--ink-1)',lineHeight:1}}>{n}</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:4}}>{label}</div></div>
    </div>
  );
}

function StudentsGrid({ students = STUDENTS, onOpen }) {
  return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'var(--gap-3)'}}>{students.map(s=><StudentCard key={s.id} s={s} onClick={()=>onOpen(s)}/>)}</div>;
}

function TrackProgressMini({ kind, label, complete, total }) {
  const colors = { lp:{fg:'#1e3a5f',bg:'rgba(30,58,95,0.08)'}, ob:{fg:'#2f7a4e',bg:'rgba(47,122,78,0.10)'} };
  const c = colors[kind]; const pct = total===0?0:(complete/total)*100; const isFull = complete===total&&total>0;
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:11.5}}>
      <span style={{color:'var(--ink-3)',minWidth:70}}>{label}</span>
      <div style={{flex:1,height:6,borderRadius:100,background:c.bg,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',insetInlineEnd:0,top:0,bottom:0,width:`${pct}%`,background:c.fg,transition:'width .4s'}}/>
      </div>
      <span style={{color:isFull?c.fg:'var(--ink-2)',fontWeight:isFull?600:500,minWidth:28,textAlign:'start',fontFamily:'var(--font-mono)'}}>{complete}/{total}</span>
    </div>
  );
}

function StudentCard({ s, onClick }) {
  const meta = STATUS_META[s.status]; const lp = s.lessonProgress||{complete:0,total:0}; const ob = s.observationProgress||{complete:0,total:0};
  return (
    <div className="card card-hover" onClick={onClick}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
        <div style={{width:44,height:44,borderRadius:10,background:'var(--brand-soft)',color:'var(--brand)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,flexShrink:0}}>{s.initials}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,color:'var(--ink-1)',letterSpacing:'-0.01em'}}>{s.name}</div>
          <div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:2}}>{s.grade}</div>
        </div>
      </div>
      <div style={{marginTop:12,fontSize:12.5,color:'var(--ink-2)',display:'flex',alignItems:'center',gap:6}}>
        <IconGraduationCap size={13} stroke="var(--ink-3)"/>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.school}</span>
      </div>
      <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6}}>
        <TrackProgressMini kind="lp" label="מערכי שיעור" complete={lp.complete} total={lp.total}/>
        <TrackProgressMini kind="ob" label="צפיות" complete={ob.complete} total={ob.total}/>
      </div>
      <div style={{marginTop:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span className={`badge ${meta.cls}`}>{meta.label}</span>
        <span style={{fontSize:12,color:'var(--brand)',display:'flex',alignItems:'center',gap:4,fontWeight:500}}>פתח <IconArrowLeft size={13}/></span>
      </div>
    </div>
  );
}

function StudentsList({ students = STUDENTS, onOpen }) {
  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'40px 1.4fr 1.6fr 1.6fr 1.2fr 80px',padding:'12px 18px',fontSize:11.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
        <span/><span>סטודנט</span><span>בית ספר מאמן</span><span>התקדמות בערוצים</span><span>סטטוס</span><span/>
      </div>
      {students.map((s,i)=>{
        const meta=STATUS_META[s.status]; const lp=s.lessonProgress||{complete:0,total:0}; const ob=s.observationProgress||{complete:0,total:0};
        return (
          <div key={s.id} onClick={()=>onOpen(s)} style={{display:'grid',gridTemplateColumns:'40px 1.4fr 1.6fr 1.6fr 1.2fr 80px',padding:'14px 18px',alignItems:'center',borderBottom:i<students.length-1?'1px solid var(--border)':'none',cursor:'pointer',transition:'background .12s',fontSize:14}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
            <div style={{width:32,height:32,borderRadius:8,background:'var(--brand-soft)',color:'var(--brand)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:14,fontWeight:600}}>{s.initials}</div>
            <div><div style={{color:'var(--ink-1)',fontWeight:500}}>{s.name}</div><div style={{color:'var(--ink-3)',fontSize:12}}>{s.grade}</div></div>
            <div style={{color:'var(--ink-2)'}}>{s.school}</div>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <TrackProgressMini kind="lp" label="מערכים" complete={lp.complete} total={lp.total}/>
              <TrackProgressMini kind="ob" label="צפיות" complete={ob.complete} total={ob.total}/>
            </div>
            <div><span className={`badge ${meta.cls}`}>{meta.label}</span></div>
            <div style={{textAlign:'start'}}><IconArrowLeft size={16} stroke="var(--ink-3)"/></div>
          </div>
        );
      })}
    </div>
  );
}

const TRACK_COLORS = { lp:{fg:'#1e3a5f',bg:'#e8eef5',name:'מערכי שיעור',Icon:IconDoc}, ob:{fg:'#2f7a4e',bg:'#e3f0e8',name:'צפיות',Icon:IconEye} };

function ProgressPill({ kind, complete, total }) {
  const c = TRACK_COLORS[kind]; const pct = total===0?0:Math.round(100*complete/total);
  return (
    <div style={{padding:'8px 14px',borderRadius:100,background:c.bg,color:c.fg,fontSize:12.5,display:'flex',alignItems:'center',gap:10,fontWeight:500}}>
      <c.Icon size={13}/><span>{c.name}</span><span style={{opacity:.5}}>·</span>
      <span style={{fontFamily:'var(--font-serif)',fontSize:14,fontWeight:600}}>{complete}/{total}</span>
      <span style={{width:36,height:4,borderRadius:100,background:'rgba(0,0,0,0.08)',position:'relative',overflow:'hidden'}}>
        <span style={{position:'absolute',insetInlineEnd:0,top:0,bottom:0,width:`${pct}%`,background:'currentColor'}}/>
      </span>
    </div>
  );
}

function StageDots({ cycle, stageOrder, trackColor }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      {stageOrder.map((stageKey,i)=>{
        const stage=cycle.stages[stageKey]; const done=stage?.done;
        return (
          <React.Fragment key={stageKey}>
            <div style={{width:16,height:16,borderRadius:'50%',background:done?trackColor:'var(--surface)',border:`1.5px solid ${done?trackColor:'var(--border-strong)'}`,display:'grid',placeItems:'center'}}>
              {done&&<IconCheck size={9} stroke="#fff" strokeWidth={3}/>}
            </div>
            {i<stageOrder.length-1&&<div style={{width:16,height:1.5,background:cycle.stages[stageOrder[i+1]]?.done?trackColor:'var(--border-strong)'}}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StageTimeline({ cycle, stageOrder, trackColor }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${stageOrder.length},1fr)`,gap:12,marginTop:14}}>
      {stageOrder.map((stageKey,i)=>{
        const stage=cycle.stages[stageKey]; const meta=STAGE_LABELS[stageKey]; const done=stage?.done;
        return (
          <div key={stageKey} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'12px 14px',opacity:done?1:0.7}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:done?trackColor:'var(--surface-3)',color:done?'#fff':'var(--ink-3)',display:'grid',placeItems:'center',fontSize:11,fontWeight:700}}>{i+1}</div>
              <div><div style={{fontSize:12.5,fontWeight:600,color:'var(--ink-1)'}}>{meta.full}</div><div style={{fontSize:10.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginTop:1}}>{meta.who}</div></div>
            </div>
            {done ? (
              <>
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8,padding:'5px 8px',background:'var(--surface-2)',borderRadius:4,fontSize:11.5}}>
                  <IconFile size={11} stroke="var(--ink-3)"/>
                  <span style={{color:'var(--ink-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,minWidth:0}}>{stage.file}</span>
                  <span style={{color:'var(--ink-3)',fontSize:10.5}}>{stage.date}</span>
                </div>
                {stage.summary&&<div style={{marginTop:8,fontSize:11.5,color:'var(--ink-2)',lineHeight:1.6,fontStyle:'italic'}}>״{stage.summary}״</div>}
              </>
            ) : (
              <div style={{marginTop:8,padding:'10px 8px',background:'var(--warn-soft)',color:'var(--warn)',borderRadius:4,fontSize:11.5,textAlign:'center'}}>{stage.daysWaiting?`ממתין ${stage.daysWaiting} ימים`:'טרם הוגש'}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CycleRow({ kind, cycle, cycleIndex, stageOrder, open, onToggle }) {
  const c = TRACK_COLORS[kind]; const status = CYCLE_STATUS[cycle.status];
  return (
    <div className="card" style={{padding:0,overflow:'hidden',borderColor:open?c.fg:'var(--border)',transition:'border-color .2s'}}>
      <button onClick={onToggle} style={{width:'100%',textAlign:'start',padding:'14px 18px',display:'grid',gridTemplateColumns:'28px 1fr auto auto auto',alignItems:'center',gap:14,background:'transparent'}}>
        <div style={{width:24,height:24,borderRadius:6,background:c.bg,color:c.fg,display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:12,fontWeight:600}}>{cycleIndex}</div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14.5,fontWeight:500,color:'var(--ink-1)'}}>{cycle.topic}</div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{cycle.subject||`תאריך תצפית: ${cycle.date}`}</div>
        </div>
        <StageDots cycle={cycle} stageOrder={stageOrder} trackColor={c.fg}/>
        <span className={`badge ${status.cls}`}>{status.label}</span>
        <IconChevron size={14} stroke="var(--ink-3)" style={{transform:open?'rotate(-90deg)':'rotate(0)',transition:'transform .2s'}}/>
      </button>
      {open&&<div style={{padding:'4px 18px 18px',borderTop:'1px solid var(--border)',background:'var(--surface-2)',animation:'fadeIn .25s'}}><StageTimeline cycle={cycle} stageOrder={stageOrder} trackColor={c.fg}/></div>}
    </div>
  );
}

function TrackSection({ kind, title, subtitle, cycles, stageOrder, openCycle, onToggle }) {
  const c = TRACK_COLORS[kind]; const completeCount = cycles.filter(cy=>cy.status==='complete').length;
  return (
    <section>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'baseline',gap:10}}>
          <div style={{width:28,height:28,borderRadius:8,background:c.bg,color:c.fg,display:'grid',placeItems:'center',fontSize:14,transform:'translateY(4px)'}}>{c.Icon&&<c.Icon size={15}/>}</div>
          <div>
            <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em'}}>{title}</h2>
            <div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:2}}>{subtitle}</div>
          </div>
        </div>
        <div style={{fontSize:12,color:'var(--ink-3)'}}>{completeCount} מתוך {cycles.length} מחזורים הושלמו</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {cycles.map((cy,i)=><CycleRow key={cy.id} kind={kind} cycle={cy} cycleIndex={i+1} stageOrder={stageOrder} open={openCycle===cy.id} onToggle={()=>onToggle(cy.id)}/>)}
      </div>
    </section>
  );
}

function Workspace({ student, onBack, onAnalyze, onFileUploaded }) {
  const [openCycle, setOpenCycle] = useState(null);
  const [extras, setExtras] = useState([]);
  const [extraDesc, setExtraDesc] = useState('');
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const addExtra = async () => {
    if (!extraDesc.trim()) return;
    // If a file input is attached, upload it; otherwise add as description-only
    const fileInput = document.getElementById('extra-file-input');
    const file = fileInput && fileInput.files[0];
    if (file) {
      setUploading(true); setUploadError(null);
      try {
        const result = await window.API_uploadFile(student.id, file, null, null);
        setExtras(prev => [...prev, { id: result.id, desc: extraDesc.trim(), file: result.original_name }]);
        if (onFileUploaded) onFileUploaded(result);
      } catch (err) {
        setUploadError(err.message);
      } finally {
        setUploading(false);
      }
    } else {
      setExtras(prev => [...prev, { id: Date.now(), desc: extraDesc.trim(), file: 'מסמך_נוסף.pdf' }]);
    }
    setExtraDesc(''); setShowExtraForm(false);
  };
  const lpComplete = LESSON_PLAN_CYCLES.filter(c=>c.status==='complete').length;
  const obComplete = OBSERVATION_CYCLES.filter(c=>c.status==='complete').length;
  const totalDocs = LESSON_PLAN_CYCLES.reduce((acc,c)=>acc+Object.values(c.stages).filter(s=>s.done).length,0)+OBSERVATION_CYCLES.reduce((acc,c)=>acc+Object.values(c.stages).filter(s=>s.done).length,0);
  return (
    <div className="main-inner fade-in" style={{paddingTop:28}}>
      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,marginBottom:18}}>
        <button onClick={onBack} style={{color:'var(--ink-3)',display:'flex',alignItems:'center',gap:4}}><IconArrowRight size={14}/> הסטודנטים שלי</button>
        <span style={{color:'var(--ink-4)'}}>/</span>
        <span style={{color:'var(--ink-1)',fontWeight:500}}>{student.name}</span>
      </div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28,gap:24}}>
        <div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span>{student.school} · {student.grade}</span>
            {student.subjectTrack&&<span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',borderRadius:100,background:'var(--accent-soft)',color:'var(--accent)',fontSize:11.5,fontWeight:500}}><IconGraduationCap size={12}/> מסלול {student.subjectTrack}</span>}
            <span>· {totalDocs} מסמכים בתיק</span>
          </div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:32,fontWeight:600,margin:0,letterSpacing:'-0.01em'}}>{student.name} — תיק התנסות</h1>
          <p style={{fontSize:14,color:'var(--ink-2)',margin:'8px 0 0',maxWidth:540,lineHeight:1.6}}>המערכת מנתחת שני סוגי חומרים: מערכי שיעור (3 שלבים) וצפיות בשיעורים (3 שלבים). השלמת הצומת האנושי תשלב את הידע שלך שאינו כתוב.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
          <div style={{display:'flex',gap:8}}>
            <ProgressPill kind="lp" complete={lpComplete} total={LESSON_PLAN_CYCLES.length}/>
            <ProgressPill kind="ob" complete={obComplete} total={OBSERVATION_CYCLES.length}/>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:28,alignItems:'flex-start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:28}}>
          <TrackSection kind="lp" title="מערכי שיעור" subtitle="הגשה → הערות מד״פ → תיקון" cycles={LESSON_PLAN_CYCLES} stageOrder={['submission','instructorNotes','revision']} openCycle={openCycle?.trackType==='lp'?openCycle.cycleId:null} onToggle={(id)=>setOpenCycle(openCycle?.cycleId===id?null:{trackType:'lp',cycleId:id})}/>
          <TrackSection kind="ob" title="צפיות בשיעורים" subtitle="צפייה → משוב → רפלקציה" cycles={OBSERVATION_CYCLES} stageOrder={['observation','feedback','reflection']} openCycle={openCycle?.trackType==='ob'?openCycle.cycleId:null} onToggle={(id)=>setOpenCycle(openCycle?.cycleId===id?null:{trackType:'ob',cycleId:id})}/>
          <section>
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center',fontSize:14,transform:'translateY(4px)'}}>＋</div>
                <div><h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em'}}>הגשות נוספות</h2><div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:2}}>כל חומר אחר — תארי בעצמך מה הוא מכיל</div></div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {extras.map(ex=>(
                <div key={ex.id} className="card" style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:30,height:36,borderRadius:3,flexShrink:0,background:'var(--accent-soft)',color:'var(--accent)',fontSize:9,fontWeight:700,display:'grid',placeItems:'center'}}>PDF</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:500,color:'var(--ink-1)'}}>{ex.desc}</div><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:1}}>{ex.file}</div></div>
                  <button className="btn-ghost" onClick={()=>setExtras(prev=>prev.filter(e=>e.id!==ex.id))} style={{padding:4,borderRadius:4,color:'var(--ink-4)'}}><IconClose size={14}/></button>
                </div>
              ))}
              {showExtraForm ? (
                <div className="card" style={{padding:16}}>
                  <label className="label">תיאור החומר</label>
                  <input className="input" autoFocus value={extraDesc} onChange={e=>setExtraDesc(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addExtra();}} placeholder="לדוגמה: תיק עבודות תלמידים, סרטון שיעור, תכתובת עם הורה..."/>
                  <label className="label" style={{marginTop:10}}>קובץ (DOCX / PDF, אופציונלי)</label>
                  <input id="extra-file-input" type="file" accept=".docx,.doc,.pdf,.txt" className="input" style={{paddingTop:6}}/>
                  {uploadError && <div style={{fontSize:12,color:'var(--warn)',marginTop:6}}>{uploadError}</div>}
                  <div style={{display:'flex',gap:8,marginTop:12}}>
                    <button className="btn btn-primary btn-sm" onClick={addExtra} disabled={uploading}>
                      {uploading ? 'מעלה...' : <><IconUpload size={13}/> הוסף</>}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>{setShowExtraForm(false);setExtraDesc('');setUploadError(null);}}>ביטול</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setShowExtraForm(true)} style={{border:'2px dashed var(--border-strong)',background:'var(--surface)',borderRadius:'var(--r-md)',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'center',gap:8,color:'var(--ink-2)',fontSize:13.5,fontWeight:500,transition:'all .15s',width:'100%',cursor:'pointer'}}>
                  <IconPlus size={15}/> הוספת חומר נוסף
                </button>
              )}
            </div>
          </section>
        </div>
        <aside style={{position:'sticky',top:28}}>
          <div className="card">
            <h2 style={{fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,margin:'0 0 4px'}}>הגדרות הערכה</h2>
            <p style={{fontSize:12,color:'var(--ink-3)',margin:'0 0 16px'}}>המערכת תאזן בין מערך לצפייה ותשאל אותך השלמות לפני הניתוח.</p>
            <label className="label">מחוון</label>
            <div style={{padding:'12px 14px',marginBottom:16,border:'1px solid var(--brand)',background:'var(--brand-softer)',borderRadius:'var(--r-sm)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><IconBookmark size={15} stroke="var(--brand)"/><div style={{fontSize:14,fontWeight:600,color:'var(--ink-1)'}}>הערכת סוף שנה</div><span className="badge badge-ok" style={{marginInlineStart:'auto'}}>פעיל</span></div>
              <div style={{fontSize:12,color:'var(--ink-3)',marginTop:6}}>7 קריטריונים · 100 נק׳ · מסלול {student.subjectTrack}</div>
              <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:3}}>
                {EVAL_CATEGORIES.map((c,i)=>(
                  <div key={c.id} style={{display:'flex',alignItems:'center',gap:7,fontSize:11.5,color:'var(--ink-2)'}}>
                    <span style={{color:'var(--ink-4)',minWidth:12}}>{i+1}</span>
                    <span style={{flex:1}}>{c.name}</span>
                    <span style={{color:'var(--ink-3)',fontFamily:'var(--font-mono)',fontSize:10.5}}>{c.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:'10px 12px',background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:12,color:'var(--ink-2)',lineHeight:1.6,marginBottom:16,display:'flex',alignItems:'flex-start',gap:8}}>
              <IconSparkle size={13} stroke="var(--brand)" style={{marginTop:2,flexShrink:0}}/>
              <span>המערכת זיהתה <b style={{color:'var(--warn)'}}>2 פערים</b> בין מערך לצפייה, וקריטריון אחד <b style={{color:'var(--warn)'}}>ללא תיעוד</b>. תישאלי <b>3 שאלות</b> השלמה.</span>
            </div>
            <button className="btn btn-magic btn-lg" style={{width:'100%'}} onClick={()=>onAnalyze('r1')}><IconSparkle size={16}/> נתח את התיק</button>
            <p style={{fontSize:11.5,color:'var(--ink-3)',textAlign:'center',margin:'10px 0 0',lineHeight:1.5}}>הניתוח אורך כ-30 שניות. תוכלי לערוך את כל הטקסט בסיום.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export {  Sidebar, Dashboard, Workspace, TRACK_COLORS, TrackProgressMini  };