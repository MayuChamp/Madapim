import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Icons from './icons';
import { Icon, IconHome, IconUsers, IconArchive, IconSettings, IconFolder, IconFile, IconUpload, IconPlus, IconArrowLeft, IconArrowRight, IconChevron, IconPencil, IconMagic, IconMic, IconSearch, IconClose, IconCheck, IconDownload, IconSave, IconSend, IconSparkle, IconBookmark, IconDoc, IconWave, IconGrid, IconList, IconClock, IconArchiveBox, IconAlert, IconGraduationCap, IconEye, IconTrash } from './icons';
import { STUDENTS, EVAL_CATEGORIES, STAGE_LABELS, CYCLE_STATUS, STATUS_META } from './data';
import { useLanguage } from './i18n';



function TopbarNav({ activeScreen, onNav, instructorName, onLogout, studentCount = 0 }) {
  const { t, lang, setLang } = useLanguage();
  const initials = (instructorName || 'מ').slice(0, 1);
  return (
    <nav className="topnav">
      <div className="topnav-bar">
        <div className="brand-mark">
          <div className="brand-glyph">ה</div>
          <div className="brand-text"><b>הערכה</b><span>{t('brand_tagline')}</span></div>
        </div>
        <div className="topnav-pills">
          <button className={`topnav-pill ${activeScreen === 'dashboard' ? 'active' : ''}`} onClick={() => onNav('dashboard')}>
            <Icons.IconUsers size={16} /> {t('nav_my_students')} <span className="pill-count">{studentCount}</span>
          </button>
          <button className={`topnav-pill ${activeScreen === 'archive' ? 'active' : ''}`} onClick={() => onNav('archive')}>
            <Icons.IconArchiveBox size={16} /> {t('nav_archive')}
          </button>
          <button className={`topnav-pill ${activeScreen === 'rubrics' ? 'active' : ''}`} onClick={() => onNav('rubrics')}>
            <Icons.IconBookmark size={16} /> {t('nav_rubrics')}
          </button>
        </div>
        <div className="topnav-actions">
          <div style={{display:'flex',alignItems:'center',gap:2,padding:'4px 6px',borderRadius:'var(--r-sm)',background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            {[{code:'he',label:'עב'},{code:'en',label:'EN'},{code:'ar',label:'ع'}].map(l=>(
              <button key={l.code} onClick={()=>setLang(l.code)} style={{padding:'2px 6px',borderRadius:4,border:'none',fontSize:11,fontWeight:lang===l.code?700:400,background:lang===l.code?'var(--brand)':'transparent',color:lang===l.code?'#fff':'var(--ink-2)',cursor:'pointer',lineHeight:1.4}}>{l.label}</button>
            ))}
          </div>
          <button className="icon-btn" onClick={() => onNav('settings')} title={t('nav_settings_title')}><Icons.IconSettings size={18} /></button>
          {onLogout && <button className="icon-btn" onClick={onLogout} title={t('nav_logout')}><Icons.IconArrowLeft size={18} /></button>}
          <div className="user-pill">
            <div className="avatar">{initials}</div>
            <div>
              <div className="u-name">{instructorName}</div>
              <div className="u-role">{t('role_instructor')}</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Dashboard({ students = STUDENTS, onOpenStudent, cardLayout, onCreateStudent, onImportCSV, onDeleteStudent }) {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', school: '', grade: '', subjectTrack: '', gender: 'female' });
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(null);
  const counts = { pending:students.filter(s=>s.status==='pending').length, ready:students.filter(s=>s.status==='ready').length, in_progress:students.filter(s=>s.status==='in_progress').length, not_started:students.filter(s=>s.status==='not_started').length };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (onCreateStudent) {
      await onCreateStudent(newStudent);
      setShowAddModal(false);
      setNewStudent({ name: '', school: '', grade: '', subjectTrack: '', gender: 'female' });
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
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,letterSpacing:'0.02em'}}>{t('semester_label')}</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em',lineHeight:1.1}}>{t('dashboard_title')}</h1>
          <p style={{fontSize:15,color:'var(--ink-2)',margin:'10px 0 0',maxWidth:540,lineHeight:1.6}}>{t('dashboard_subtitle')}</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary btn-lg" onClick={()=>setShowImportModal(true)}><IconUpload size={16}/> {t('btn_import_list')}</button>
          <button className="btn btn-primary btn-lg" onClick={()=>setShowAddModal(true)}><IconPlus size={16}/> {t('btn_add_student')}</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'var(--gap-3)',marginBottom:'var(--gap-5)'}}>
        <StatTile n={counts.pending} label={t('stat_pending')} tone="warn" icon={<IconAlert size={14}/>}/>
        <StatTile n={counts.in_progress} label={t('stat_in_progress')} tone="info" icon={<IconClock size={14}/>}/>
        <StatTile n={counts.ready} label={t('stat_ready')} tone="ok" icon={<IconCheck size={14}/>}/>
        <StatTile n={counts.not_started} label={t('stat_not_started')} tone="neutral" icon={<IconFolder size={14}/>}/>
      </div>
      <div className="section-title" style={{marginTop:'var(--gap-5)'}}><h2>{t('group_section')}</h2><div style={{display:'flex',alignItems:'center',gap:12}}><span className="hint">{t('students_count', { n: students.length })}</span></div></div>
      {cardLayout==='grid' ? <StudentsGrid students={students} onOpen={onOpenStudent} onDelete={setConfirmDeleteStudent}/> : <StudentsList students={students} onOpen={onOpenStudent} onDelete={setConfirmDeleteStudent}/>}

      {/* Confirm delete modal */}
      {confirmDeleteStudent && (
        <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="card fade-in" style={{width:380,padding:28,textAlign:'center'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'var(--warn-soft)',color:'var(--warn)',display:'grid',placeItems:'center',margin:'0 auto 16px'}}>
              <IconTrash size={22}/>
            </div>
            <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:'0 0 8px'}}>{t('delete_student_title')}</h2>
            <p style={{fontSize:14,color:'var(--ink-2)',lineHeight:1.6,margin:'0 0 24px'}}>
              {t('delete_student_confirm_1')} <strong>{confirmDeleteStudent.name}</strong>?<br/>
              {t('delete_student_confirm_2')}
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn btn-ghost" style={{minWidth:100}} onClick={()=>setConfirmDeleteStudent(null)}>{t('cancel')}</button>
              <button className="btn" style={{minWidth:100,background:'var(--warn)',color:'#fff',border:'none'}} onClick={()=>{onDeleteStudent&&onDeleteStudent(confirmDeleteStudent);setConfirmDeleteStudent(null);}}>
                <IconTrash size={14}/> {t('delete_student_btn')}
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
              <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0}}>{t('add_student_title')}</h2>
              <button className="btn-ghost" onClick={()=>setShowAddModal(false)}><IconClose size={16}/></button>
            </div>
            <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">{t('field_full_name')}</label>
                <input className="input" required value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name: e.target.value})} placeholder={t('field_full_name_ph')} />
              </div>
              <div>
                <label className="label">{t('field_school')}</label>
                <input className="input" value={newStudent.school} onChange={e=>setNewStudent({...newStudent, school: e.target.value})} placeholder={t('field_school_ph')} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label className="label">{t('field_grade')}</label>
                  <input className="input" value={newStudent.grade} onChange={e=>setNewStudent({...newStudent, grade: e.target.value})} placeholder={t('field_grade_ph')} />
                </div>
                <div>
                  <label className="label">{t('field_subject_track')}</label>
                  <input className="input" value={newStudent.subjectTrack} onChange={e=>setNewStudent({...newStudent, subjectTrack: e.target.value})} placeholder={t('field_subject_track_ph')} />
                </div>
              </div>
              <div>
                <label className="label">{t('field_gender')}</label>
                <div style={{display:'flex',gap:8,marginTop:4}}>
                  {[{value:'female',labelKey:'gender_female'},{value:'male',labelKey:'gender_male'}].map(opt=>(
                    <label key={opt.value} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:'var(--r-sm)',border:`1.5px solid ${newStudent.gender===opt.value?'var(--accent)':'var(--border)'}`,background:newStudent.gender===opt.value?'var(--accent-soft)':'transparent',cursor:'pointer',fontSize:14,fontWeight:newStudent.gender===opt.value?500:400,transition:'all .12s'}}>
                      <input type="radio" name="gender" value={opt.value} checked={newStudent.gender===opt.value} onChange={()=>setNewStudent({...newStudent,gender:opt.value})} style={{display:'none'}}/>
                      {t(opt.labelKey)}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowAddModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary"><IconCheck size={14}/> {t('save')}</button>
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
              <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0}}>{t('csv_import_title')}</h2>
              <button className="btn-ghost" onClick={()=>setShowImportModal(false)}><IconClose size={16}/></button>
            </div>
            <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:16,lineHeight:1.6,background:'var(--surface-2)',padding:'10px 14px',borderRadius:'var(--r-sm)'}}>
              <strong>פורמט CSV:</strong> שורה ראשונה = כותרות, לפחות עמודת <code>שם</code>.<br/>
              עמודות אופציונליות: <code>בית ספר, כיתה, מסלול</code><br/>
              <strong>דוגמה:</strong> <code style={{direction:'ltr',display:'inline-block'}}>שם,בית ספר,כיתה,מסלול</code>
            </div>
            <form onSubmit={handleImport} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">{t('csv_upload_label')}</label>
                <input type="file" accept=".csv,.txt" onChange={handleFileRead} style={{fontSize:13,color:'var(--ink-2)'}}/>
              </div>
              <div>
                <label className="label">{t('csv_paste_label')}</label>
                <textarea className="input" rows={8} dir="ltr" value={csvText} onChange={e=>setCsvText(e.target.value)}
                  style={{fontFamily:'var(--font-mono)',fontSize:12}}
                  placeholder={"שם,בית ספר,כיתה,מסלול\nמשה לוי,יסודי הרצוג,כיתה ד׳,מתמטיקה\nדנה כהן,ניסויי יסוד,כיתה ב׳,אנגלית"}/>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowImportModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={importing || !csvText.trim()}>
                  <IconUpload size={14}/> {importing ? t('importing') : t('btn_import_students')}
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
  const { t } = useLanguage();
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
          {onDelete && <button onClick={e=>{e.stopPropagation();onDelete(s);}} style={{padding:'3px 6px',borderRadius:4,border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-4)',transition:'color .15s'}} title={t('delete_student_btn')} onMouseEnter={e=>e.currentTarget.style.color='var(--warn)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-4)'}><IconTrash size={13}/></button>}
        </div>
      </div>
      <div style={{fontSize:13,color:'var(--ink-2)',display:'flex',alignItems:'center',gap:6, justifyContent:'center', marginBottom:20}}>
        <IconGraduationCap size={14} stroke="var(--ink-3)"/>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.school}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12, marginBottom:20}}>
        <TrackProgressMini kind="lp" label={t('track_lp_title')} complete={lp.complete} total={lp.total}/>
        <TrackProgressMini kind="ob" label={t('track_ob_title')} complete={ob.complete} total={ob.total}/>
      </div>
      <div style={{marginTop:'auto',display:'flex',alignItems:'center',justifyContent:'space-between', paddingTop:16, borderTop:'1px solid var(--border)'}}>
        <span style={{fontSize:13,color:'var(--brand)',display:'flex',alignItems:'center',gap:4,fontWeight:600}}>{t('open')} <IconArrowLeft size={14} strokeWidth={2.5}/></span>
        <span className={`badge ${meta.cls}`} style={{padding:'6px 12px', fontSize:12.5, borderRadius:6}}>{t('status_' + s.status)}</span>
      </div>
    </div>
  );
}

function StudentsList({ students = STUDENTS, onOpen, onDelete }) {
  const { t } = useLanguage();
  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'40px 1.4fr 1.6fr 1.6fr 1.2fr 80px 40px',padding:'12px 18px',fontSize:11.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
        <span/><span>{t('col_student')}</span><span>{t('col_school')}</span><span>{t('col_progress')}</span><span>{t('col_status')}</span><span/><span/>
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
              <TrackProgressMini kind="lp" label={t('track_lp_title')} complete={lp.complete} total={lp.total}/>
              <TrackProgressMini kind="ob" label={t('track_ob_title')} complete={ob.complete} total={ob.total}/>
            </div>
            <div><span className={`badge ${meta.cls}`}>{t('status_' + s.status)}</span></div>
            <div style={{textAlign:'start'}}><IconArrowLeft size={16} stroke="var(--ink-3)"/></div>
            <div style={{textAlign:'center'}}>
              {onDelete && <button onClick={e=>{e.stopPropagation();onDelete(s);}} style={{padding:'5px 6px',borderRadius:4,border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-4)',transition:'color .15s'}} title={t('delete_student_btn')} onMouseEnter={e=>e.currentTarget.style.color='var(--warn)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-4)'}><IconTrash size={14}/></button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TRACK_COLORS = { lp:{fg:'#1e3a5f',bg:'#e8eef5',name:'מערכי שיעור',Icon:IconDoc}, ob:{fg:'#2f7a4e',bg:'#e3f0e8',name:'צפיות',Icon:IconEye} };

// Format ISO date string or "DD.MM" to display as "DD.MM.YY"
function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    // ISO: YYYY-MM-DD or full timestamp
    const d = new Date(dateStr.length > 10 ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}.${mm}.${yy}`;
  }
  return dateStr; // already "DD.MM"
}

// Sort key for academic year (Sep=start, Aug=end)
function academicSortKey(dateStr) {
  if (!dateStr) return Infinity;
  let day, month, year;
  if (dateStr.includes('-')) {
    const d = new Date(dateStr.length > 10 ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return Infinity;
    day = d.getDate(); month = d.getMonth() + 1; year = d.getFullYear();
  } else {
    const parts = dateStr.split('.');
    day = parseInt(parts[0]); month = parseInt(parts[1]);
    year = month >= 9 ? 2025 : 2026;
  }
  return new Date(year, month - 1, day).getTime();
}

function ProgressPill({ kind, complete, total }) {
  const { t } = useLanguage();
  const c = TRACK_COLORS[kind]; const pct = total===0?0:Math.round(100*complete/total);
  return (
    <div style={{padding:'8px 14px',borderRadius:100,background:c.bg,color:c.fg,fontSize:12.5,display:'flex',alignItems:'center',gap:10,fontWeight:500}}>
      <c.Icon size={13}/><span>{kind === 'lp' ? t('track_lp_title') : t('track_ob_title')}</span><span style={{opacity:.5}}>·</span>
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
  const { t } = useLanguage();
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${stageOrder.length},1fr)`,gap:12,marginTop:14}}>
      {stageOrder.map((stageKey,i)=>{
        const stage=cycle.stages[stageKey]; const done=stage?.done;
        return (
          <div key={stageKey} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'12px 14px',opacity:done?1:0.7}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:done?trackColor:'var(--surface-3)',color:done?'#fff':'var(--ink-3)',display:'grid',placeItems:'center',fontSize:11,fontWeight:700}}>{i+1}</div>
              <div><div style={{fontSize:12.5,fontWeight:600,color:'var(--ink-1)'}}>{t('stage_' + stageKey)}</div><div style={{fontSize:10.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginTop:1}}>{t('stage_' + stageKey + '_who')}</div></div>
            </div>
            {done ? (
              <>
                {stage.date && (
                  <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--ink-3)',marginBottom:4}}>
                    <IconClock size={10}/>{stage.date}
                  </div>
                )}
                <div style={{marginTop:4}}>
                  <ExtraMaterials extras={stage.files || []} studentId={studentId} cycleId={cycle.id} stageKey={stageKey} onFileUploaded={onFileUploaded} buttonLabel={t('add_extra_material')} />
                </div>
                {stage.summary&&<div style={{marginTop:8,fontSize:11.5,color:'var(--ink-2)',lineHeight:1.6,fontStyle:'italic'}}>״{stage.summary}״</div>}
              </>
            ) : (
              <div style={{marginTop:8,padding:'10px 8px',background:'var(--surface-2)',borderRadius:4,fontSize:11.5,textAlign:'center', border: '1px dashed var(--border-strong)'}}>
                <div style={{color:'var(--ink-3)', marginBottom: 6}}>{stage.daysWaiting ? t('waiting_days', { n: stage.daysWaiting }) : t('not_submitted')}</div>
                <ExtraMaterials extras={stage.files || []} studentId={studentId} cycleId={cycle.id} stageKey={stageKey} onFileUploaded={onFileUploaded} buttonLabel={t('upload_material_for_analysis')} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CycleRow({ kind, cycle, cycleIndex, stageOrder, open, onToggle, onUpload, studentId, onFileUploaded }) {
  const { t } = useLanguage();
  const c = TRACK_COLORS[kind]; const status = CYCLE_STATUS[cycle.status];
  const [isEditing, setIsEditing] = useState(false);
  const [topicDraft, setTopicDraft] = useState(cycle.topic);

  const handleSaveTopic = async () => {
    if (topicDraft.trim() !== cycle.topic) {
      try {
        await window.API_updateCycleTopic(cycle.id, topicDraft.trim());
        if (onFileUploaded) onFileUploaded(); // refresh
      } catch (err) {
        alert(t('error_update_topic') + ': ' + err.message);
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
            <div onClick={() => setIsEditing(true)} style={{fontSize:14.5,fontWeight:500,color:'var(--ink-1)', display:'flex', alignItems:'center', gap:6, cursor:'text'}} title={t('click_to_edit_lesson')}>
              {cycle.topic}
              <IconPencil size={11} stroke="var(--ink-3)" style={{opacity:0.6}}/>
            </div>
          )}
          {cycle.subject && <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{cycle.subject}</div>}
        </div>
        <StageDots cycle={cycle} stageOrder={stageOrder} trackColor={c.fg}/>
        <span className={`badge ${status.cls}`}>{t('cycle_' + cycle.status)}</span>
        <IconChevron size={14} stroke="var(--ink-3)" style={{transform:open?'rotate(-90deg)':'rotate(0)',transition:'transform .2s'}}/>
      </div>
      {open&&<div style={{padding:'4px 18px 18px',borderTop:'1px solid var(--border)',background:'var(--surface-2)',animation:'fadeIn .25s'}}>
        <StageTimeline cycle={cycle} stageOrder={stageOrder} trackColor={c.fg} studentId={studentId} onFileUploaded={onFileUploaded} />
        <div style={{marginTop: 24, paddingTop: 16, borderTop: '1px dashed var(--border-strong)'}}>
          <div style={{fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 12}}>{t('additional_materials_cycle')}</div>
          <ExtraMaterials extras={cycle.extraFiles || []} studentId={studentId} cycleId={cycle.id} onFileUploaded={onFileUploaded} />
        </div>
      </div>}
    </div>
  );
}

function TrackSection({ kind, title, subtitle, cycles, stageOrder, openCycle, onToggle, onUpload, studentId, onFileUploaded }) {
  const { t } = useLanguage();
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
        <div style={{fontSize:12,color:'var(--ink-3)'}}>{t('cycles_completed', { done: completeCount, total: cycles.length })}</div>
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

function ExtraMaterials({ extras, studentId, cycleId, stageKey, onFileUploaded, buttonLabel }) {
  const { t } = useLanguage();
  const resolvedButtonLabel = buttonLabel !== undefined ? buttonLabel : t('add_extra_material');
  const [extraDesc, setExtraDesc] = useState('');
  const [materialDate, setMaterialDate] = useState('');
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
          await window.API_uploadFile(studentId, file, cycleId || null, stageKey || null, extraDesc.trim(), materialDate || null);
        }
      } else {
        await window.API_uploadFile(studentId, null, cycleId || null, stageKey || null, extraDesc.trim(), materialDate || null);
      }
      if (onFileUploaded) onFileUploaded();
      setExtraDesc(''); setMaterialDate(''); setShowExtraForm(false);
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
      alert(t('error_delete_file') + ': ' + err.message);
    }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {extras.map(ex=>{
        const displayDate = ex.material_date
          ? formatDateDisplay(ex.material_date)
          : ex.uploaded_at ? formatDateDisplay(ex.uploaded_at) : '';
        return (
          <div key={ex.id} className="card" style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:30,height:36,borderRadius:3,flexShrink:0,background:'var(--accent-soft)',color:'var(--accent)',fontSize:9,fontWeight:700,display:'grid',placeItems:'center'}}>{ex.original_name ? (ex.original_name.split('.').pop() || 'DOC').toUpperCase().slice(0,3) : 'TXT'}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:500,color:'var(--ink-1)'}}>{ex.description || t('no_description')}</div>
              <div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:1}}>{ex.original_name}</div>
              {displayDate && (
                <div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,color:'var(--ink-4)',marginTop:2}}>
                  <IconClock size={10}/>{ex.material_date ? displayDate : t('uploaded_on', { date: displayDate })}
                </div>
              )}
            </div>
            <button className="btn-ghost" onClick={()=>deleteExtra(ex.id)} style={{padding:4,borderRadius:4,color:'var(--ink-4)'}}><IconClose size={14}/></button>
          </div>
        );
      })}
      {showExtraForm ? (
        <div className="card" style={{padding:16}}>
          <label className="label">{t('material_desc_label')}</label>
          <input className="input" autoFocus value={extraDesc} onChange={e=>setExtraDesc(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addExtra();}} placeholder={t('material_desc_ph')}/>
          <label className="label" style={{marginTop:10}}>{t('material_date_label')} <span style={{fontWeight:400,color:'var(--ink-4)'}}>({t('material_date_optional')})</span></label>
          <input type="date" className="input" value={materialDate} onChange={e=>setMaterialDate(e.target.value)} style={{direction:'ltr'}}/>
          <label className="label" style={{marginTop:10}}>{t('file_label')}</label>
          <input id={`extra-file-${cycleId || 'general'}-${stageKey || 'none'}`} type="file" multiple accept=".docx,.doc,.pdf,.txt,.mp4,.mp3,.png,.jpg,.jpeg" className="input" style={{paddingTop:6}}/>
          {uploadError && <div style={{fontSize:12,color:'var(--warn)',marginTop:6}}>{uploadError}</div>}
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn btn-primary btn-sm" onClick={addExtra} disabled={uploading}>
              {uploading ? t('uploading') : <><IconUpload size={13}/> {t('add')}</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setShowExtraForm(false);setExtraDesc('');setMaterialDate('');setUploadError(null);}}>{t('cancel')}</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowExtraForm(true)} style={{border:'2px dashed var(--border-strong)',background:'var(--surface)',borderRadius:'var(--r-md)',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:'var(--ink-2)',fontSize:12.5,fontWeight:500,transition:'all .15s',width:'100%',cursor:'pointer'}}>
          <IconPlus size={14}/> {resolvedButtonLabel}
        </button>
      )}
    </div>
  );
}

const HEBREW_MONTHS = ['','ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
// Academic year month order: Sep → Aug
const ACADEMIC_MONTH_ORDER = [9,10,11,12,1,2,3,4,5,6,7,8];

function YearTimeline({ studentCycles, extraFiles }) {
  const { t, lang } = useLanguage();
  const events = [];

  for (const cycle of studentCycles) {
    const trackType = cycle.track_type;
    for (const [stageKey, stage] of Object.entries(cycle.stages)) {
      if (stage.done && stage.date) {
        events.push({
          dateStr: stage.date,
          sortKey: academicSortKey(stage.date),
          label: `${cycle.topic} — ${STAGE_LABELS[stageKey]?.full || stageKey}`,
          trackType,
          type: 'stage',
        });
      }
      for (const f of (stage.files || [])) {
        if (f.material_date) {
          events.push({
            dateStr: formatDateDisplay(f.material_date),
            sortKey: academicSortKey(f.material_date),
            label: f.description || f.original_name || 'מסמך',
            trackType,
            type: 'file',
          });
        }
      }
    }
  }

  for (const f of (extraFiles || [])) {
    if (f.material_date) {
      events.push({
        dateStr: formatDateDisplay(f.material_date),
        sortKey: academicSortKey(f.material_date),
        label: f.description || f.original_name || 'מסמך',
        trackType: 'extra',
        type: 'file',
      });
    }
  }

  if (events.length === 0) return null;
  events.sort((a, b) => a.sortKey - b.sortKey);

  // Group by month
  const byMonth = {};
  for (const ev of events) {
    let month;
    if (ev.dateStr.includes('.')) {
      const parts = ev.dateStr.split('.');
      month = parseInt(parts[1]);
    } else {
      month = new Date(ev.dateStr).getMonth() + 1;
    }
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(ev);
  }

  const activeMonths = ACADEMIC_MONTH_ORDER.filter(m => byMonth[m]);

  return (
    <section>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'baseline',gap:10}}>
          <div style={{width:28,height:28,borderRadius:8,background:'var(--surface-3)',color:'var(--ink-2)',display:'grid',placeItems:'center',fontSize:14,transform:'translateY(4px)'}}><IconClock size={15}/></div>
          <div>
            <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em'}}>{t('yearly_timeline')}</h2>
            <div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:2}}>{t('yearly_timeline_desc')}</div>
          </div>
        </div>
        <div style={{fontSize:12,color:'var(--ink-3)'}}>{t('events_documented', { n: events.length })}</div>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {activeMonths.map((month, mi) => {
          const monthEvents = byMonth[month];
          return (
            <div key={month} style={{borderBottom: mi < activeMonths.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <div style={{padding:'8px 18px 6px',background:'var(--surface-2)',fontSize:11,fontWeight:700,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.07em',display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'var(--ink-4)',flexShrink:0,display:'inline-block'}}/>
                {lang === 'he' ? HEBREW_MONTHS[month] : new Date(2000, month - 1, 1).toLocaleString(lang === 'ar' ? 'ar' : 'en', { month: 'long' })}
                <span style={{fontWeight:400,marginInlineStart:4}}>· {monthEvents.length}</span>
              </div>
              <div style={{padding:'8px 18px 12px',display:'flex',flexDirection:'column',gap:6}}>
                {monthEvents.map((ev, i) => {
                  const isLP = ev.trackType === 'lesson_plan';
                  const isOb = ev.trackType === 'observation';
                  const tc = isLP ? TRACK_COLORS.lp : isOb ? TRACK_COLORS.ob : {fg:'var(--accent)',bg:'var(--accent-soft)'};
                  const TrackIcon = isLP ? IconDoc : isOb ? IconEye : IconFile;
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--surface)',borderRadius:'var(--r-sm)',border:`1px solid ${tc.bg}`}}>
                      <span style={{flexShrink:0,width:40,fontFamily:'var(--font-mono)',fontSize:11.5,color:'var(--ink-3)',textAlign:'center'}}>{ev.dateStr}</span>
                      <div style={{width:1,height:20,background:'var(--border)',flexShrink:0}}/>
                      <div style={{width:22,height:22,borderRadius:5,background:tc.bg,color:tc.fg,display:'grid',placeItems:'center',flexShrink:0}}><TrackIcon size={11}/></div>
                      <div style={{flex:1,fontSize:13,color:'var(--ink-1)',lineHeight:1.35}}>{ev.label}</div>
                      {ev.type === 'stage' && <span style={{width:16,height:16,borderRadius:'50%',background:'var(--ok-soft)',color:'var(--ok)',display:'grid',placeItems:'center',flexShrink:0}}><IconCheck size={9}/></span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Workspace({ student, onBack, onAnalyze, onFileUploaded }) {
  const { t } = useLanguage();
  const [openCycle, setOpenCycle] = useState(null);

  const handleCycleUpload = async (cycleId, stageKey, file) => {
    try {
      await window.API_uploadFile(student.id, file, cycleId, stageKey);
      if (onFileUploaded) onFileUploaded();
    } catch (err) {
      alert(t('error_upload') + ': ' + err.message);
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
        <button onClick={onBack} style={{color:'var(--ink-3)',display:'flex',alignItems:'center',gap:4}}><IconArrowRight size={14}/> {t('back_to_students')}</button>
        <span style={{color:'var(--ink-4)'}}>/</span>
        <span style={{color:'var(--ink-1)',fontWeight:500}}>{student.name}</span>
      </div>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28,gap:24}}>
        <div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span>{student.school} · {student.grade}</span>
            {student.subjectTrack&&<span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',borderRadius:100,background:'var(--accent-soft)',color:'var(--accent)',fontSize:11.5,fontWeight:500}}><IconGraduationCap size={12}/> {t('subject_track_label', { track: student.subjectTrack })}</span>}
            <span>· {t('docs_in_portfolio', { n: totalDocs })}</span>
          </div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:32,fontWeight:600,margin:0,letterSpacing:'-0.01em'}}>{student.name} {t('workspace_title_suffix')}</h1>
          <p style={{fontSize:14,color:'var(--ink-2)',margin:'8px 0 0',maxWidth:540,lineHeight:1.6}}>{t('workspace_desc')}</p>
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
          <TrackSection kind="lp" title={t('track_lp_title')} subtitle={t('track_lp_subtitle')} cycles={lpCycles} stageOrder={['submission','instructorNotes','revision']} openCycle={openCycle?.trackType==='lp'?openCycle.cycleId:null} onToggle={(id)=>setOpenCycle(openCycle?.cycleId===id?null:{trackType:'lp',cycleId:id})} onUpload={handleCycleUpload} studentId={student.id} onFileUploaded={onFileUploaded}/>
          <TrackSection kind="ob" title={t('track_ob_title')} subtitle={t('track_ob_subtitle')} cycles={obCycles} stageOrder={['observation','feedback','reflection']} openCycle={openCycle?.trackType==='ob'?openCycle.cycleId:null} onToggle={(id)=>setOpenCycle(openCycle?.cycleId===id?null:{trackType:'ob',cycleId:id})} onUpload={handleCycleUpload} studentId={student.id} onFileUploaded={onFileUploaded}/>
          <YearTimeline studentCycles={studentCycles} extraFiles={student.extraFiles || []}/>
          <section>
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:'var(--accent-soft)',color:'var(--accent)',display:'grid',placeItems:'center',fontSize:14,transform:'translateY(4px)'}}>＋</div>
                <div><h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em'}}>{t('extra_submissions')}</h2><div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:2}}>{t('extra_submissions_desc')}</div></div>
              </div>
            </div>
            <ExtraMaterials extras={student.extraFiles || []} studentId={student.id} cycleId={null} onFileUploaded={onFileUploaded} />
          </section>
        </div>
        <aside style={{position:'sticky',top:28}}>
          <div className="card">
            <h2 style={{fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,margin:'0 0 4px'}}>{t('eval_settings')}</h2>
            <p style={{fontSize:12,color:'var(--ink-3)',margin:'0 0 16px'}}>{t('eval_settings_desc')}</p>
            <label className="label">{t('rubric_label')}</label>
            <div style={{padding:'12px 14px',marginBottom:16,border:'1px solid var(--brand)',background:'var(--brand-softer)',borderRadius:'var(--r-sm)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><IconBookmark size={15} stroke="var(--brand)"/><div style={{fontSize:14,fontWeight:600,color:'var(--ink-1)'}}>{t('rubric_end_year')}</div><span className="badge badge-ok" style={{marginInlineStart:'auto'}}>{t('rubric_active')}</span></div>
              <div style={{fontSize:12,color:'var(--ink-3)',marginTop:6}}>{t('rubric_criteria_info', { track: student.subjectTrack })}</div>
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
            <button className="btn btn-magic btn-lg" style={{width:'100%'}} onClick={()=>onAnalyze('r1')}><IconSparkle size={16}/> {t('btn_analyze')}</button>
            <p style={{fontSize:11.5,color:'var(--ink-3)',textAlign:'center',margin:'10px 0 0',lineHeight:1.5}}>{t('analyze_note')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export {  TopbarNav, Dashboard, Workspace, TRACK_COLORS, TrackProgressMini  };