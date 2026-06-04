import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Icons from './icons';
import { Icon, IconHome, IconUsers, IconArchive, IconSettings, IconFolder, IconFile, IconUpload, IconPlus, IconArrowLeft, IconArrowRight, IconChevron, IconPencil, IconMagic, IconMic, IconSearch, IconClose, IconCheck, IconDownload, IconSave, IconSend, IconSparkle, IconBookmark, IconDoc, IconWave, IconGrid, IconList, IconClock, IconArchiveBox, IconAlert, IconGraduationCap, IconEye, IconTrash } from './icons';
import { STUDENTS, EVAL_CATEGORIES, STAGE_LABELS, CYCLE_STATUS, STATUS_META } from './data';



function TopbarNav({ activeScreen, onNav, instructorName, onLogout }) {
  const initials = (instructorName || 'מ').slice(0, 1);
  return (
    <nav className="topnav">
      <div className="topnav-bar">
        <div className="brand-mark">
          <div className="brand-glyph">ה</div>
          <div className="brand-text"><b>הערכה</b><span>כלי הדרכה פדגוגית</span></div>
        </div>
        <div className="topnav-pills">
          <button className={`topnav-pill ${activeScreen === 'dashboard' ? 'active' : ''}`} onClick={() => onNav('dashboard')}>
            <Icons.IconUsers size={16} /> הסטודנטים שלי <span className="pill-count">6</span>
          </button>
          <button className={`topnav-pill ${activeScreen === 'archive' ? 'active' : ''}`} onClick={() => onNav('archive')}>
            <Icons.IconArchiveBox size={16} /> ארכיון
          </button>
          <button className={`topnav-pill ${activeScreen === 'rubrics' ? 'active' : ''}`} onClick={() => onNav('rubrics')}>
            <Icons.IconBookmark size={16} /> מחוונים
          </button>
        </div>
        <div className="topnav-actions">
          <button className="icon-btn" onClick={() => onNav('settings')} title="הגדרות"><Icons.IconSettings size={18} /></button>
          <button className="icon-btn dot" title="התראות"><Icons.IconAlert size={18} /></button>
          {onLogout && <button className="icon-btn" onClick={onLogout} title="התנתק"><Icons.IconArrowLeft size={18} /></button>}
          <div className="user-pill">
            <div className="avatar">{initials}</div>
            <div>
              <div className="u-name">{instructorName}</div>
              <div className="u-role">מדריכה פדגוגית</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Dashboard({ students = STUDENTS, onOpenStudent, cardLayout, onCreateStudent, onImportCSV, onDeleteStudent }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', school: '', grade: '', subjectTrack: '' });
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(null);
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
      <div className="section-title" style={{marginTop:'var(--gap-5)'}}><h2>הקבוצה</h2><div style={{display:'flex',alignItems:'center',gap:12}}><span className="hint">{students.length} סטודנטים</span></div></div>
      {cardLayout==='grid' ? <StudentsGrid students={students} onOpen={onOpenStudent} onDelete={setConfirmDeleteStudent}/> : <StudentsList students={students} onOpen={onOpenStudent} onDelete={setConfirmDeleteStudent}/>}

      {/* Confirm delete modal */}
      {confirmDeleteStudent && (
        <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="card fade-in" style={{width:380,padding:28,textAlign:'center'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'var(--warn-soft)',color:'var(--warn)',display:'grid',placeItems:'center',margin:'0 auto 16px'}}>
              <IconTrash size={22}/>
            </div>
            <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:'0 0 8px'}}>מחיקת סטודנט</h2>
            <p style={{fontSize:14,color:'var(--ink-2)',lineHeight:1.6,margin:'0 0 24px'}}>
              האם אתה בטוח שברצונך למחוק את <strong>{confirmDeleteStudent.name}</strong>?<br/>
              פעולה זו תמחק את כל הנתונים, הקבצים וההערכות של הסטודנט ואינה ניתנת לביטול.
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn btn-ghost" style={{minWidth:100}} onClick={()=>setConfirmDeleteStudent(null)}>ביטול</button>
              <button className="btn" style={{minWidth:100,background:'var(--warn)',color:'#fff',border:'none'}} onClick={()=>{onDeleteStudent&&onDeleteStudent(confirmDeleteStudent);setConfirmDeleteStudent(null);}}>
                <IconTrash size={14}/> מחק סטודנט
              </button>
            </div>
          </div>
        </div>
      )}

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

function StudentsGrid({ students = STUDENTS, onOpen, onDelete }) {
  return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'var(--gap-3)'}}>{students.map(s=><StudentCard key={s.id} s={s} onClick={()=>onOpen(s)} onDelete={onDelete}/>)}</div>;
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

function StudentCard({ s, onClick, onDelete }) {
  const meta = STATUS_META[s.status]; const lp = s.lessonProgress||{complete:0,total:0}; const ob = s.observationProgress||{complete:0,total:0};
  return (
    <div className="card card-hover" onClick={onClick} style={{borderTop:'4px solid var(--brand)', display:'flex', flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12, marginBottom:16}}>
        <div style={{flex:1,minWidth:0, textAlign:'center'}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,color:'var(--ink-1)',letterSpacing:'-0.01em'}}>{s.name}</div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginTop:2}}>{s.grade}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:'var(--brand-soft)',color:'var(--brand)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,flexShrink:0}}>{s.initials}</div>
          {onDelete && <button onClick={e=>{e.stopPropagation();onDelete(s);}} style={{padding:'3px 6px',borderRadius:4,border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-4)',transition:'color .15s'}} title="מחק סטודנט" onMouseEnter={e=>e.currentTarget.style.color='var(--warn)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-4)'}><IconTrash size={13}/></button>}
        </div>
      </div>
      <div style={{fontSize:13,color:'var(--ink-2)',display:'flex',alignItems:'center',gap:6, justifyContent:'center', marginBottom:20}}>
        <IconGraduationCap size={14} stroke="var(--ink-3)"/>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.school}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12, marginBottom:20}}>
        <TrackProgressMini kind="lp" label="מערכי שיעור" complete={lp.complete} total={lp.total}/>
        <TrackProgressMini kind="ob" label="צפיות" complete={ob.complete} total={ob.total}/>
      </div>
      <div style={{marginTop:'auto',display:'flex',alignItems:'center',justifyContent:'space-between', paddingTop:16, borderTop:'1px solid var(--border)'}}>
        <span style={{fontSize:13,color:'var(--brand)',display:'flex',alignItems:'center',gap:4,fontWeight:600}}>פתח <IconArrowLeft size={14} strokeWidth={2.5}/></span>
        <span className={`badge ${meta.cls}`} style={{padding:'6px 12px', fontSize:12.5, borderRadius:6}}>{meta.label}</span>
      </div>
    </div>
  );
}

function StudentsList({ students = STUDENTS, onOpen, onDelete }) {
  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'40px 1.4fr 1.6fr 1.6fr 1.2fr 80px 40px',padding:'12px 18px',fontSize:11.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
        <span/><span>סטודנט</span><span>בית ספר מאמן</span><span>התקדמות בערוצים</span><span>סטטוס</span><span/><span/>
      </div>
      {students.map((s,i)=>{
        const meta=STATUS_META[s.status]; const lp=s.lessonProgress||{complete:0,total:0}; const ob=s.observationProgress||{complete:0,total:0};
        return (
          <div key={s.id} onClick={()=>onOpen(s)} style={{display:'grid',gridTemplateColumns:'40px 1.4fr 1.6fr 1.6fr 1.2fr 80px 40px',padding:'14px 18px',alignItems:'center',borderBottom:i<students.length-1?'1px solid var(--border)':'none',cursor:'pointer',transition:'background .12s',fontSize:14}}
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
            <div style={{textAlign:'center'}}>
              {onDelete && <button onClick={e=>{e.stopPropagation();onDelete(s);}} style={{padding:'5px 6px',borderRadius:4,border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-4)',transition:'color .15s'}} title="מחק סטודנט" onMouseEnter={e=>e.currentTarget.style.color='var(--warn)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-4)'}><IconTrash size={14}/></button>}
            </div>
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

function StageTimeline({ cycle, stageOrder, trackColor, studentId, onFileUploaded }) {
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
                <div style={{marginTop:8}}>
                  <ExtraMaterials extras={stage.files || []} studentId={studentId} cycleId={cycle.id} stageKey={stageKey} onFileUploaded={onFileUploaded} buttonLabel="הוספת חומר נוסף" />
                </div>
                {stage.summary&&<div style={{marginTop:8,fontSize:11.5,color:'var(--ink-2)',lineHeight:1.6,fontStyle:'italic'}}>״{stage.summary}״</div>}
              </>
            ) : (
              <div style={{marginTop:8,padding:'10px 8px',background:'var(--surface-2)',borderRadius:4,fontSize:11.5,textAlign:'center', border: '1px dashed var(--border-strong)'}}>
                <div style={{color:'var(--ink-3)', marginBottom: 6}}>{stage.daysWaiting?`ממתין ${stage.daysWaiting} ימים`:'טרם הוגש'}</div>
                <ExtraMaterials extras={stage.files || []} studentId={studentId} cycleId={cycle.id} stageKey={stageKey} onFileUploaded={onFileUploaded} buttonLabel="העלאת חומר לניתוח" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CycleRow({ kind, cycle, cycleIndex, stageOrder, open, onToggle, onUpload, studentId, onFileUploaded }) {
  const c = TRACK_COLORS[kind]; const status = CYCLE_STATUS[cycle.status];
  const [isEditing, setIsEditing] = useState(false);
  const [topicDraft, setTopicDraft] = useState(cycle.topic);

  const handleSaveTopic = async () => {
    if (topicDraft.trim() !== cycle.topic) {
      try {
        await window.API_updateCycleTopic(cycle.id, topicDraft.trim());
        if (onFileUploaded) onFileUploaded(); // refresh
      } catch (err) {
        alert('שגיאה בעדכון השם: ' + err.message);
        setTopicDraft(cycle.topic);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="card" style={{padding:0,overflow:'hidden',borderColor:open?c.fg:'var(--border)',transition:'border-color .2s'}}>
      <div onClick={onToggle} style={{width:'100%',textAlign:'start',padding:'14px 18px',display:'grid',gridTemplateColumns:'28px 1fr auto auto auto',alignItems:'center',gap:14,background:'transparent',cursor:'pointer'}}>
        <div style={{width:24,height:24,borderRadius:6,background:c.bg,color:c.fg,display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:12,fontWeight:600}}>{cycleIndex}</div>
        <div style={{minWidth:0}} onClick={e => e.stopPropagation()}>
          {isEditing ? (
            <input 
              autoFocus 
              value={topicDraft} 
              onChange={e => setTopicDraft(e.target.value)} 
              onBlur={handleSaveTopic}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTopic(); if (e.key === 'Escape') { setTopicDraft(cycle.topic); setIsEditing(false); } }}
              style={{fontSize:14.5,fontWeight:500,color:'var(--ink-1)', border:'1px solid var(--brand)', borderRadius:4, padding:'2px 6px', width:'100%', background:'var(--surface)'}} 
            />
          ) : (
            <div onClick={() => setIsEditing(true)} style={{fontSize:14.5,fontWeight:500,color:'var(--ink-1)', display:'flex', alignItems:'center', gap:6, cursor:'text'}} title="לחץ לעריכת שם השיעור">
              {cycle.topic}
              <IconPencil size={11} stroke="var(--ink-3)" style={{opacity:0.6}}/>
            </div>
          )}
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{cycle.subject||`תאריך תצפית: ${cycle.date}`}</div>
        </div>
        <StageDots cycle={cycle} stageOrder={stageOrder} trackColor={c.fg}/>
        <span className={`badge ${status.cls}`}>{status.label}</span>
        <IconChevron size={14} stroke="var(--ink-3)" style={{transform:open?'rotate(-90deg)':'rotate(0)',transition:'transform .2s'}}/>
      </div>
      {open&&<div style={{padding:'4px 18px 18px',borderTop:'1px solid var(--border)',background:'var(--surface-2)',animation:'fadeIn .25s'}}>
        <StageTimeline cycle={cycle} stageOrder={stageOrder} trackColor={c.fg} studentId={studentId} onFileUploaded={onFileUploaded} />
        <div style={{marginTop: 24, paddingTop: 16, borderTop: '1px dashed var(--border-strong)'}}>
          <div style={{fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 12}}>חומרים נוספים למחזור זה</div>
          <ExtraMaterials extras={cycle.extraFiles || []} studentId={studentId} cycleId={cycle.id} onFileUploaded={onFileUploaded} />
        </div>
      </div>}
    </div>
  );
}

function TrackSection({ kind, title, subtitle, cycles, stageOrder, openCycle, onToggle, onUpload, studentId, onFileUploaded }) {
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
        {cycles.map((cy,i)=><CycleRow key={cy.id} kind={kind} cycle={cy} cycleIndex={i+1} stageOrder={stageOrder} open={openCycle===cy.id} onToggle={()=>onToggle(cy.id)} onUpload={(stageKey, file) => onUpload(cy.id, stageKey, file)} studentId={studentId} onFileUploaded={onFileUploaded}/>)}
      </div>
    </section>
  );
}

function transformApiCycle(c) {
  const stagesArr = Array.isArray(c.stages) ? c.stages : [];
  const files = c.files || [];
  const stages = {};
  for (const s of stagesArr) {
    const stageFiles = files.filter(fi => fi.stage_key === s.stage_key);
    stages[s.stage_key] = { done: !!s.done, date: s.date, files: stageFiles, summary: s.summary, daysWaiting: s.days_waiting };
  }
  return { ...c, stages, extraFiles: files.filter(f => !f.stage_key) };
}

function ExtraMaterials({ extras, studentId, cycleId, stageKey, onFileUploaded, buttonLabel = "הוספת חומר נוסף" }) {
  const [extraDesc, setExtraDesc] = useState('');
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const addExtra = async () => {
    const fileInput = document.getElementById(`extra-file-${cycleId || 'general'}-${stageKey || 'none'}`);
    const files = fileInput ? Array.from(fileInput.files) : [];
    
    if (files.length === 0 && !extraDesc.trim()) return;
    
    setUploading(true); setUploadError(null);
    try {
      if (files.length > 0) {
        for (const file of files) {
          await window.API_uploadFile(studentId, file, cycleId || null, stageKey || null, extraDesc.trim());
        }
      } else {
        await window.API_uploadFile(studentId, null, cycleId || null, stageKey || null, extraDesc.trim());
      }
      if (onFileUploaded) onFileUploaded();
      setExtraDesc(''); setShowExtraForm(false);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteExtra = async (id) => {
    try {
      await window.API_deleteFile(id);
      if (onFileUploaded) onFileUploaded();
    } catch (err) {
      alert('שגיאה במחיקת הקובץ: ' + err.message);
    }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {extras.map(ex=>(
        <div key={ex.id} className="card" style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:30,height:36,borderRadius:3,flexShrink:0,background:'var(--accent-soft)',color:'var(--accent)',fontSize:9,fontWeight:700,display:'grid',placeItems:'center'}}>{ex.original_name ? (ex.original_name.split('.').pop() || 'DOC').toUpperCase().slice(0,3) : 'TXT'}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:500,color:'var(--ink-1)'}}>{ex.description || 'ללא תיאור'}</div><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:1}}>{ex.original_name}</div></div>
          <button className="btn-ghost" onClick={()=>deleteExtra(ex.id)} style={{padding:4,borderRadius:4,color:'var(--ink-4)'}}><IconClose size={14}/></button>
        </div>
      ))}
      {showExtraForm ? (
        <div className="card" style={{padding:16}}>
          <label className="label">תיאור החומר</label>
          <input className="input" autoFocus value={extraDesc} onChange={e=>setExtraDesc(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addExtra();}} placeholder="לדוגמה: תיק עבודות תלמידים, סרטון שיעור, תכתובת עם הורה... (רשות)"/>
          <label className="label" style={{marginTop:10}}>קובץ (אפשר לבחור כמה קבצים יחד)</label>
          <input id={`extra-file-${cycleId || 'general'}-${stageKey || 'none'}`} type="file" multiple accept=".docx,.doc,.pdf,.txt,.mp4,.mp3,.png,.jpg,.jpeg" className="input" style={{paddingTop:6}}/>
          {uploadError && <div style={{fontSize:12,color:'var(--warn)',marginTop:6}}>{uploadError}</div>}
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn btn-primary btn-sm" onClick={addExtra} disabled={uploading}>
              {uploading ? 'מעלה...' : <><IconUpload size={13}/> הוסף</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setShowExtraForm(false);setExtraDesc('');setUploadError(null);}}>ביטול</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowExtraForm(true)} style={{border:'2px dashed var(--border-strong)',background:'var(--surface)',borderRadius:'var(--r-md)',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:'var(--ink-2)',fontSize:12.5,fontWeight:500,transition:'all .15s',width:'100%',cursor:'pointer'}}>
          <IconPlus size={14}/> {buttonLabel}
        </button>
      )}
    </div>
  );
}

function Workspace({ student, onBack, onAnalyze, onFileUploaded }) {
  const [openCycle, setOpenCycle] = useState(null);

  const handleCycleUpload = async (cycleId, stageKey, file) => {
    try {
      await window.API_uploadFile(student.id, file, cycleId, stageKey);
      if (onFileUploaded) onFileUploaded();
    } catch (err) {
      alert('שגיאה בהעלאת הקובץ: ' + err.message);
    }
  };

  const studentCycles = (student.cycles || []).map(transformApiCycle);
  const lpCycles = studentCycles.filter(c => c.track_type === 'lesson_plan');
  const obCycles = studentCycles.filter(c => c.track_type === 'observation');
  const lpComplete = lpCycles.filter(c=>c.status==='complete').length;
  const obComplete = obCycles.filter(c=>c.status==='complete').length;
  const totalDocs = studentCycles.reduce((acc,c)=>acc+Object.values(c.stages).filter(s=>s.done).length,0);
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
            <ProgressPill kind="lp" complete={lpComplete} total={lpCycles.length}/>
            <ProgressPill kind="ob" complete={obComplete} total={obCycles.length}/>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:28,alignItems:'flex-start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:28}}>
          <TrackSection kind="lp" title="מערכי שיעור" subtitle="הגשה → הערות מד״פ → תיקון" cycles={lpCycles} stageOrder={['submission','instructorNotes','revision']} openCycle={openCycle?.trackType==='lp'?openCycle.cycleId:null} onToggle={(id)=>setOpenCycle(openCycle?.cycleId===id?null:{trackType:'lp',cycleId:id})} onUpload={handleCycleUpload} studentId={student.id} onFileUploaded={onFileUploaded}/>
          <TrackSection kind="ob" title="צפיות בשיעורים" subtitle="צפייה → משוב → רפלקציה" cycles={obCycles} stageOrder={['observation','feedback','reflection']} openCycle={openCycle?.trackType==='ob'?openCycle.cycleId:null} onToggle={(id)=>setOpenCycle(openCycle?.cycleId===id?null:{trackType:'ob',cycleId:id})} onUpload={handleCycleUpload} studentId={student.id} onFileUploaded={onFileUploaded}/>
          <section>
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center',fontSize:14,transform:'translateY(4px)'}}>＋</div>
                <div><h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em'}}>הגשות נוספות</h2><div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:2}}>כל חומר אחר — תארי בעצמך מה הוא מכיל</div></div>
              </div>
            </div>
            <ExtraMaterials extras={student.extraFiles || []} studentId={student.id} cycleId={null} onFileUploaded={onFileUploaded} />
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

export {  TopbarNav, Dashboard, Workspace, TRACK_COLORS, TrackProgressMini  };