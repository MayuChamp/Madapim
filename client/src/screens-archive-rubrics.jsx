import { useState, useEffect } from 'react';
import { IconDownload, IconDoc, IconSearch, IconPlus, IconChevron, IconPencil, IconClose, IconCheck, IconTrash } from './icons';
import * as API from './api';
import { useLanguage } from './i18n';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelLabel(l) {
  const map = { high: 'גבוהה', mid_high: 'בינונית-גבוהה', mid: 'בינונית', low_mid: 'בינונית-נמוכה' };
  return map[l] || l || '—';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${String(d.getFullYear()).slice(2)}`;
  } catch { return '—'; }
}

// ─── Archive ──────────────────────────────────────────────────────────────────

export function ArchiveScreen() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewEval, setViewEval] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    API.getEvaluations()
      .then(data => setEvaluations(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (ev) => {
    setDeleting(true);
    try {
      await API.deleteEvaluation(ev.id);
      setEvaluations(prev => prev.filter(e => e.id !== ev.id));
      setConfirmDelete(null);
      if (viewEval?.id === ev.id) setViewEval(null);
    } catch {}
    setDeleting(false);
  };

  const filtered = evaluations.filter(ev => {
    if (!search) return true;
    const name = ev.student?.name || '';
    const school = ev.student?.school || '';
    return name.includes(search) || school.includes(search);
  });

  const scoreColor = (s) => s >= 85 ? 'var(--ok)' : s >= 75 ? 'var(--brand)' : 'var(--warn)';
  const scores = evaluations.filter(e => e.score != null).map(e => e.score);
  const avgScore = scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : null;

  if (loading) return <div className="main-inner fade-in">{t('archive_loading')}</div>;

  return (
    <div className="main-inner fade-in">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'var(--gap-5)'}}>
        <button className="btn btn-secondary btn-lg" onClick={()=>{
          const rows = [['שם','בית ספר','כיתה','סטטוס','ציון','רמה כללית','תאריך עדכון']];
          evaluations.forEach(ev=>{
            rows.push([
              ev.student?.name||'',
              ev.student?.school||'',
              ev.student?.grade||'',
              ev.status==='finalized'?t('status_finalized'):t('status_draft_label'),
              ev.score!=null?ev.score:'',
              levelLabel(ev.draft_json?.overallLevel)||'',
              formatDate(ev.updated_at),
            ]);
          });
          const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
          const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
          const url=URL.createObjectURL(blob);
          const a=document.createElement('a');
          a.href=url; a.download='ארכיון-הערכות.csv';
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        }}><IconDownload size={14}/> {t('btn_export_list')}</button>
        <div style={{textAlign:'end'}}>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,letterSpacing:'0.02em'}}>{t('archive_count_label')} · {evaluations.length} {t('archive_evaluations_label')}</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em',lineHeight:1.1}}>{t('archive_title')}</h1>
          <p style={{fontSize:15,color:'var(--ink-2)',margin:'10px 0 0',maxWidth:540,lineHeight:1.6}}>{t('archive_subtitle')}</p>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',marginBottom:'var(--gap-4)'}}>
        <div style={{width:300,position:'relative'}}>
          <IconSearch size={14} stroke="var(--ink-3)" style={{position:'absolute',insetInlineEnd:16,top:'50%',transform:'translateY(-50%)'}}/>
          <input className="input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{borderRadius:100,background:'transparent',padding:'12px 16px 12px 40px',borderColor:'var(--border-strong)'}}/>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1.5fr',gap:'var(--gap-4)',marginBottom:'var(--gap-5)'}}>
        <div className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('last_eval_label')}</div><div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,marginTop:4}}>{evaluations[0] ? formatDate(evaluations[0].updated_at) : '—'}</div></div>
          <div style={{textAlign:'end'}}><div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('finalized_count')}</div><div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600,color:'var(--brand)'}}>{evaluations.filter(e=>e.status==='finalized').length}</div></div>
        </div>
        <div className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('total_evals')}</div>
          <div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600}}>{evaluations.length}</div>
        </div>
        <div className="card" style={{display:'flex',justifyContent:'flex-end',alignItems:'center'}}>
          <div style={{textAlign:'end'}}><div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('avg_score')}</div><div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600,color:'var(--brand)'}}>{avgScore!=null?<>{avgScore}<span style={{fontSize:16,fontWeight:400,color:'var(--ink-3)'}}>/100</span></>:'—'}</div></div>
        </div>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1.2fr 1fr 0.9fr 0.7fr 1fr 60px',padding:'16px 24px',fontSize:12.5,color:'var(--ink-3)',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
          <span>{t('col_student_arch')}</span><span>{t('col_school_arch')}</span><span>{t('col_status_arch')}</span><span>{t('col_date_arch')}</span><span>{t('col_score_arch')}</span><span>{t('col_level_arch')}</span><span/>
        </div>
        {evaluations.length===0 && (
          <div style={{padding:'48px 20px',textAlign:'center',color:'var(--ink-3)',fontSize:14}}>{t('no_evaluations')}</div>
        )}
        {filtered.length===0 && evaluations.length>0 && (
          <div style={{padding:'40px 20px',textAlign:'center',color:'var(--ink-3)',fontSize:14}}>{t('no_results')}</div>
        )}
        {filtered.map((ev,i) => {
          const name = ev.student?.name || '—';
          const school = ev.student?.school || '—';
          const score = ev.score;
          const overallLevel = ev.draft_json?.overallLevel;
          const initials = name.replace(/\.\s/g,'').replace(/[^א-תa-zA-Z]/g,'').slice(0,2) || name.slice(0,2);
          return (
            <div key={ev.id} onClick={()=>setViewEval(ev)} style={{display:'grid',gridTemplateColumns:'1.4fr 1.2fr 1fr 0.9fr 0.7fr 1fr 60px',padding:'16px 24px',alignItems:'center',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',fontSize:14,cursor:'pointer',transition:'background .12s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'var(--brand-soft)',color:'var(--brand)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:13,fontWeight:600,flexShrink:0}}>{initials}</div>
                <span style={{color:'var(--ink-1)',fontWeight:600}}>{name}</span>
              </div>
              <div style={{color:'var(--ink-2)'}}>{school}</div>
              <div><span className={`badge ${ev.status==='finalized'?'badge-ok':''}`}>{ev.status==='finalized'?t('status_finalized'):t('status_draft_label')}</span></div>
              <div style={{color:'var(--ink-3)',fontSize:13}}>{formatDate(ev.updated_at)}</div>
              <div>{score!=null?<><span style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:600,color:scoreColor(score)}}>{score}</span><span style={{fontSize:12,color:'var(--ink-3)'}}>/100</span></>:<span style={{color:'var(--ink-4)'}}>—</span>}</div>
              <div style={{fontSize:13,color:'var(--ink-2)'}}>{levelLabel(overallLevel)}</div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:4}}>
                <button className="btn-ghost" onClick={e=>{e.stopPropagation();setViewEval(ev);}} style={{padding:8,borderRadius:'50%',background:'var(--surface-2)',color:'var(--ink-3)'}} title={t('view_eval_btn')}><IconDoc size={14}/></button>
                <button className="btn-ghost" onClick={e=>{e.stopPropagation();setConfirmDelete(ev);}} style={{padding:8,borderRadius:'50%',background:'var(--surface-2)',color:'var(--ink-3)'}} title={t('delete_eval_btn')} onMouseEnter={e=>e.currentTarget.style.color='var(--warn)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-3)'}><IconTrash size={14}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {viewEval && (
        <EvalViewModal
          ev={viewEval}
          onClose={()=>setViewEval(null)}
          onDelete={()=>setConfirmDelete(viewEval)}
        />
      )}

      {confirmDelete && (
        <div style={{position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={e=>{if(e.target===e.currentTarget)setConfirmDelete(null);}}>
          <div className="card fade-in" style={{width:'min(420px,100%)',padding:'28px 32px',textAlign:'center'}}>
            <div style={{width:48,height:48,borderRadius:'50%',background:'var(--warn-soft,#fff3f0)',display:'grid',placeItems:'center',margin:'0 auto 16px'}}><IconTrash size={20} stroke="var(--warn)"/></div>
            <h3 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:'0 0 8px',color:'var(--ink-1)'}}>{t('delete_eval_title')}</h3>
            <p style={{fontSize:14,color:'var(--ink-2)',lineHeight:1.6,margin:'0 0 24px'}}>{t('delete_eval_confirm', { name: confirmDelete.student?.name || '—' })}</p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn btn-ghost" onClick={()=>setConfirmDelete(null)} disabled={deleting}>{t('cancel')}</button>
              <button className="btn btn-primary" style={{background:'var(--warn)',borderColor:'var(--warn)'}} onClick={()=>handleDelete(confirmDelete)} disabled={deleting}>
                {deleting ? t('deleting_label') : t('delete_btn_label')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvalViewModal({ ev, onClose, onDelete }) {
  const { t } = useLanguage();
  const student = ev.student || {};
  const draft = ev.draft_json || {};
  const cats = draft.categories || [];
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [rubricName, setRubricName] = useState(null);

  useEffect(() => {
    if (!ev.rubric_id) return;
    API.getRubric(ev.rubric_id).then(r => setRubricName(r?.name || null)).catch(() => {});
  }, [ev.rubric_id]);

  const lvlLabel = (l) => ({ high: t('level_high'), mid_high: t('level_mid_high'), mid: t('level_mid'), low_mid: t('level_low_mid') }[l] || l || '—');

  const handleExport = async (format) => {
    setExporting(format);
    setExportOpen(false);
    try { await API.exportPdf(ev.id, format); } catch {}
    setExporting(null);
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card fade-in" style={{width:'min(720px,100%)',maxHeight:'85vh',overflow:'auto',padding:0}}>
        <div style={{padding:'22px 28px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',position:'sticky',top:0,background:'var(--surface)',zIndex:1}}>
          <div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em'}}>{t('view_eval_label')}</div>
            <h2 style={{fontFamily:'var(--font-serif)',fontSize:22,fontWeight:600,margin:'0 0 4px'}}>{student.name || '—'}</h2>
            <div style={{fontSize:13,color:'var(--ink-3)'}}>{[student.school, student.grade].filter(Boolean).join(' · ')}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            {ev.score!=null && (
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'var(--font-serif)',fontSize:34,fontWeight:700,color:'var(--brand)',lineHeight:1}}>{ev.score}</div>
                <div style={{fontSize:11,color:'var(--ink-3)'}}>/100</div>
              </div>
            )}
            <div style={{position:'relative'}}>
              <button
                className="btn btn-secondary"
                style={{padding:'7px 14px',fontSize:13,display:'flex',alignItems:'center',gap:6,opacity:exporting?0.6:1}}
                onClick={()=>setExportOpen(o=>!o)}
                disabled={!!exporting}
                title="ייצוא ניתוח מלא"
              >
                <IconDownload size={13}/>
                {exporting ? t('exporting_label') : t('export_analysis_btn')}
              </button>
              {exportOpen && (
                <div style={{position:'absolute',top:'calc(100% + 6px)',insetInlineEnd:0,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:10,minWidth:160,overflow:'hidden'}}
                  onClick={e=>e.stopPropagation()}>
                  <button
                    style={{width:'100%',padding:'11px 16px',fontSize:13,textAlign:'end',background:'none',border:'none',cursor:'pointer',color:'var(--ink-1)',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid var(--border)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}
                    onClick={()=>handleExport('pdf')}
                  >
                    <IconDownload size={13} stroke="var(--ink-3)"/> {t('pdf_print')}
                  </button>
                  <button
                    style={{width:'100%',padding:'11px 16px',fontSize:13,textAlign:'end',background:'none',border:'none',cursor:'pointer',color:'var(--ink-1)',display:'flex',alignItems:'center',gap:8}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}
                    onClick={()=>handleExport('docx')}
                  >
                    <IconDoc size={13} stroke="var(--ink-3)"/> {t('word_html')}
                  </button>
                </div>
              )}
            </div>
            {onDelete && (
              <button className="btn-ghost" onClick={onDelete} style={{padding:8,borderRadius:'50%',color:'var(--ink-3)'}} title={t('delete_eval_btn')} onMouseEnter={e=>e.currentTarget.style.color='var(--warn)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-3)'}><IconTrash size={16}/></button>
            )}
            <button className="btn-ghost" onClick={onClose} style={{padding:8,borderRadius:'50%'}}><IconClose size={16}/></button>
          </div>
        </div>

        <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            {draft.overallLevel && (
              <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',background:'var(--brand-soft)',borderRadius:100,width:'fit-content'}}>
                <span style={{fontSize:13,color:'var(--brand)',fontWeight:600}}>רמה כללית: {lvlLabel(draft.overallLevel)}</span>
              </div>
            )}
            {rubricName && (
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:100,width:'fit-content'}}>
                <span style={{fontSize:13,color:'var(--ink-2)'}}>מחוון: <b style={{color:'var(--ink-1)'}}>{rubricName}</b></span>
              </div>
            )}
          </div>

          {cats.length > 0 && (
            <div>
              <h3 style={{fontFamily:'var(--font-serif)',fontSize:16,fontWeight:600,margin:'0 0 12px',color:'var(--ink-1)'}}>קריטריונים</h3>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {cats.map((c,i) => (
                  <div key={i} style={{padding:'14px 18px',background:'var(--surface-2)',borderRadius:10,border:'1px solid var(--border)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:c.balance?8:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{width:22,height:22,borderRadius:6,background:'var(--surface)',border:'1px solid var(--border)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:12,fontWeight:600,color:'var(--ink-2)',flexShrink:0}}>{i+1}</span>
                        <span style={{fontWeight:600,color:'var(--ink-1)',fontSize:14}}>{c.name}</span>
                        <span style={{fontSize:12,color:'var(--ink-3)'}}>{c.weight}%</span>
                      </div>
                      {c.overallLevel && (
                        <span style={{fontSize:12.5,color:'var(--brand)',fontWeight:600,padding:'3px 10px',background:'var(--brand-soft)',borderRadius:100,flexShrink:0}}>{lvlLabel(c.overallLevel)}</span>
                      )}
                    </div>
                    {c.balance && <div style={{fontSize:13,color:'var(--ink-2)',lineHeight:1.6}}>{c.balance}</div>}
                    {(c.lessonPlanLevel || c.observationLevel) && (
                      <div style={{display:'flex',gap:16,marginTop:6,fontSize:12,color:'var(--ink-3)'}}>
                        {c.lessonPlanLevel && <span>📘 מערך: {lvlLabel(c.lessonPlanLevel)}</span>}
                        {c.observationLevel && <span>🎯 צפייה: {lvlLabel(c.observationLevel)}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {draft.summary && (
            <div style={{background:'var(--brand-soft)',borderRadius:10,padding:'16px 20px',border:'1px solid rgba(0,0,0,0.05)'}}>
              <h3 style={{fontFamily:'var(--font-serif)',fontSize:15,fontWeight:600,margin:'0 0 8px',color:'var(--brand)'}}>סיכום והמלצות</h3>
              <p style={{fontSize:14,color:'var(--ink-1)',lineHeight:1.7,margin:0}}>{draft.summary}</p>
            </div>
          )}

          {cats.length===0 && !draft.summary && (
            <div style={{textAlign:'center',color:'var(--ink-3)',padding:'32px 0',fontSize:14}}>אין נתונים להצגה בהערכה זו</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Rubrics ──────────────────────────────────────────────────────────────────

export function RubricsScreen() {
  const { t } = useLanguage();
  const [rubric, setRubric] = useState(null);
  const [rubricsList, setRubricsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const loadRubrics = () =>
    API.getRubrics()
      .then(data => {
        if (data?.length) {
          setRubricsList(data);
          setRubric(prev => {
            const updated = data.find(r => r.id === prev?.id);
            return updated || data[0];
          });
        } else {
          setRubricsList([]);
          setRubric(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { loadRubrics(); }, []);

  const handleDelete = async (id) => {
    await API.deleteRubric(id);
    setDeleteConfirm(null);
    await loadRubrics();
  };

  const handleDuplicate = async (source) => {
    setDuplicatingId(source.id);
    try {
      const copy = await API.duplicateRubric(source.id);
      await loadRubrics();
      setRubric(copy);
      setEditOpen(true);
    } finally {
      setDuplicatingId(null);
    }
  };

  if (loading) return <div className="main-inner fade-in">טוען מחוון...</div>;

  return (
    <div className="main-inner fade-in">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'var(--gap-5)'}}>
        <div style={{textAlign:'end',width:'100%'}}>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,letterSpacing:'0.02em'}}>ספריית מחוונים · {rubricsList.length} תבניות פעילות</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em',lineHeight:1.1}}>{t('rubrics_title')}</h1>
          <p style={{fontSize:15,color:'var(--ink-2)',margin:'10px 0 0 0',lineHeight:1.6,float:'left',maxWidth:540,textAlign:'right'}}>{t('rubrics_subtitle')}</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:32,alignItems:'flex-start'}}>
        {rubric ? (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'24px 32px',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
              <span className="badge" style={{marginBottom:12,background:'var(--brand-soft)',color:'var(--brand)',fontSize:13,padding:'4px 12px'}}>{rubric.semester || 'שנתי'}</span>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{display:'flex',gap:8,flexShrink:0}}>
                  <button className="btn btn-secondary" onClick={()=>setEditOpen(true)} style={{display:'flex',alignItems:'center',gap:6}}>
                    <IconPencil size={14}/> ערוך מחוון
                  </button>
                  <button className="btn btn-secondary" onClick={()=>handleDuplicate(rubric)} disabled={duplicatingId===rubric.id} style={{display:'flex',alignItems:'center',gap:6}}>
                    <IconDoc size={14}/> {duplicatingId===rubric.id ? 'משכפל...' : 'שכפל מחוון'}
                  </button>
                </div>
                <div style={{textAlign:'end'}}>
                  <h2 style={{fontFamily:'var(--font-serif)',fontSize:26,fontWeight:600,margin:'0 0 8px',letterSpacing:'-0.01em',color:'var(--ink-1)'}}>{rubric.name}</h2>
                  <p style={{fontSize:14,color:'var(--ink-2)',margin:0,lineHeight:1.6,maxWidth:480}}>{rubric.description || 'אין תיאור'}</p>
                </div>
              </div>
              <div style={{display:'flex',gap:32,marginTop:24,fontSize:13.5,borderTop:'1px solid var(--border)',paddingTop:16}}>
                {[
                  {label:'סה"כ נקודות', value: rubric.total_points ? `${rubric.total_points} נק׳` : 'משוב מעצב'},
                  {label:'קריטריונים',  value: `${rubric.criteria?.length || 0}`},
                  {label:'בעלים',       value: 'חוג להוראה'},
                ].map(m=>(
                  <div key={m.label} style={{textAlign:'center'}}>
                    <div style={{fontSize:11,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{m.label}</div>
                    <div style={{fontSize:15,color:'var(--ink-1)',fontWeight:600}}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:'32px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <h3 style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:600,margin:0,color:'var(--ink-1)'}}>קריטריונים</h3>
                <span style={{fontSize:13,color:'var(--ink-3)'}}>סה"כ משקל: {(rubric.criteria||[]).reduce((a,b)=>a+(b.weight||0),0)}%</span>
              </div>
              {(rubric.criteria||[]).length === 0 && (
                <div style={{textAlign:'center',color:'var(--ink-3)',padding:'32px 0',fontSize:14}}>אין קריטריונים — ערוך את המחוון כדי להוסיף</div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {(rubric.criteria||[]).map((c,i) => (
                  <div key={i} style={{display:'grid',gridTemplateColumns:'60px 1fr 40px',alignItems:'center',gap:16,padding:'16px 20px',background:'var(--surface-2)',borderRadius:12}}>
                    <div style={{textAlign:'start'}}>
                      <span style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,color:'var(--ink-1)'}}>{c.weight}</span>
                      <span style={{fontSize:13,color:'var(--ink-3)'}}>%</span>
                    </div>
                    <div style={{textAlign:'end'}}>
                      <div style={{fontSize:15,fontWeight:600,color:'var(--ink-1)'}}>{c.name}</div>
                      <div style={{fontSize:13,color:'var(--ink-3)',marginTop:4}}>{c.desc}</div>
                    </div>
                    <div style={{width:32,height:32,borderRadius:8,background:'var(--surface)',color:'var(--ink-1)',border:'1px solid var(--border)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:14,fontWeight:600}}>{i+1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'64px 32px',color:'var(--ink-3)',fontSize:15}}>
            אין מחוונים — צור מחוון חדש כדי להתחיל
          </div>
        )}

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card" style={{padding:'16px 20px',background:'var(--info-soft)',border:'1px solid var(--info)',borderRadius:8}}>
            <h3 style={{fontSize:14,fontWeight:600,color:'var(--info)',margin:'0 0 8px'}}>איך לכתוב מחוון אישי? (הנחיות קרן)</h3>
            <ul style={{fontSize:13,color:'var(--ink-2)',margin:0,paddingInlineStart:18,lineHeight:1.6}}>
              <li>הגדירו במדויק את המיומנות או התחום שברצונכם להעריך.</li>
              <li>נסחו קריטריונים ברורים וניתנים למדידה.</li>
              <li>הקפידו על משקל יחסי (באחוזים) המשקף את החשיבות של כל קריטריון, כך שהסה"כ יגיע ל-100%.</li>
              <li>מומלץ לתת תיאור קצר לכל קריטריון שמסביר מה נחשב להצלחה (רמה גבוהה).</li>
            </ul>
          </div>

          <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={()=>setCreateOpen(true)}>
            <IconPlus size={16}/> מחוון חדש
          </button>
          {rubricsList.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {rubricsList.map((r,i) => (
                <div key={r.id||i} onClick={()=>setRubric(r)} className="card card-hover" style={{padding:'16px 20px',border:rubric?.id===r.id?'1px solid var(--ink-1)':'1px solid transparent',background:rubric?.id===r.id?'var(--surface-2)':'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontFamily:'var(--font-serif)',fontSize:16,fontWeight:600,color:'var(--ink-1)',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</div>
                    <div style={{fontSize:13,color:'var(--ink-3)'}}>{r.criteria?.length||0} קריטריונים · {r.semester||'שנתי'}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                    {rubric?.id===r.id && <IconChevron size={16} stroke="var(--ink-1)" style={{transform:'rotate(90deg)'}}/>}
                    <button
                      onClick={(e)=>{e.stopPropagation();handleDuplicate(r);}}
                      disabled={duplicatingId===r.id}
                      title="שכפל מחוון"
                      style={{padding:5,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-4)',display:'grid',placeItems:'center'}}
                      onMouseEnter={e=>e.currentTarget.style.color='var(--brand)'}
                      onMouseLeave={e=>e.currentTarget.style.color='var(--ink-4)'}
                    >
                      <IconDoc size={13}/>
                    </button>
                    <button
                      onClick={(e)=>{e.stopPropagation();setDeleteConfirm(r);}}
                      title="מחק מחוון"
                      style={{padding:5,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-4)',display:'grid',placeItems:'center'}}
                      onMouseEnter={e=>e.currentTarget.style.color='var(--warn)'}
                      onMouseLeave={e=>e.currentTarget.style.color='var(--ink-4)'}
                    >
                      <IconTrash size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editOpen && rubric && (
        <RubricEditModal
          rubric={rubric}
          mode="edit"
          onClose={()=>setEditOpen(false)}
          onSave={async (updated) => {
            await API.updateRubric(rubric.id, updated);
            setEditOpen(false);
            await loadRubrics();
          }}
        />
      )}

      {createOpen && (
        <RubricEditModal
          rubric={{name:'',description:'',semester:'',total_points:'',criteria:[]}}
          mode="create"
          onClose={()=>setCreateOpen(false)}
          onSave={async (data) => {
            const created = await API.createRubric(data);
            setCreateOpen(false);
            await loadRubrics();
            if (created?.id) setRubric(created);
          }}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          rubric={deleteConfirm}
          onClose={()=>setDeleteConfirm(null)}
          onConfirm={()=>handleDelete(deleteConfirm.id)}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({ rubric, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); } catch { setDeleting(false); }
  };
  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card fade-in" style={{width:'min(420px,100%)',padding:32}}>
        <div style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:600,marginBottom:12}}>מחיקת מחוון</div>
        <p style={{fontSize:14,color:'var(--ink-2)',marginBottom:24,lineHeight:1.6}}>
          האם למחוק את <strong>{rubric?.name}</strong>? פעולה זו אינה ניתנת לביטול.
        </p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button className="btn btn-ghost" onClick={onClose} disabled={deleting}>ביטול</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={deleting} style={{background:'var(--warn)',borderColor:'var(--warn)'}}>
            <IconTrash size={14}/> {deleting ? 'מוחק...' : 'מחק'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RubricEditModal({ rubric, mode = 'edit', onSave, onClose }) {
  const [name, setName] = useState(rubric.name || '');
  const [description, setDescription] = useState(rubric.description || '');
  const [semester, setSemester] = useState(rubric.semester || '');
  const [totalPoints, setTotalPoints] = useState(rubric.total_points ?? '');
  const [criteria, setCriteria] = useState(
    (rubric.criteria || []).map((c,i) => ({...c, _key: i}))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const totalWeight = criteria.reduce((a,c) => a + (Number(c.weight)||0), 0);

  const updateCriterion = (key, field, value) =>
    setCriteria(cs => cs.map(c => c._key===key ? {...c, [field]: value} : c));

  const removeCriterion = (key) =>
    setCriteria(cs => cs.filter(c => c._key!==key));

  const addCriterion = () =>
    setCriteria(cs => [...cs, {name:'', weight:0, desc:'', _key: Date.now()}]);

  const handleSave = async () => {
    if (!name.trim()) { setError('שם המחוון נדרש'); return; }
    if (criteria.length > 0 && totalWeight !== 100) { setError(`סכום המשקלים הוא ${totalWeight}%, צריך להיות 100%`); return; }
    setSaving(true);
    setError(null);
    try {
      const cleanCriteria = criteria.map(({_key, ...c}) => ({...c, weight: Number(c.weight)||0}));
      await onSave({ name: name.trim(), description: description.trim(), semester: semester.trim(), total_points: totalPoints===''?null:Number(totalPoints), criteria: cleanCriteria });
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card fade-in" style={{width:'min(680px,100%)',maxHeight:'90vh',overflow:'auto',padding:0}}>
        <div style={{padding:'20px 28px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'var(--surface)',zIndex:1}}>
          <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0}}>{mode==='create' ? 'מחוון חדש' : 'עריכת מחוון'}</h2>
          <button className="btn-ghost" onClick={onClose} style={{padding:8,borderRadius:'50%'}}><IconClose size={16}/></button>
        </div>

        <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:18}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label className="label">שם המחוון</label>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="לדוגמה: הערכת סוף שנה"/>
            </div>
            <div>
              <label className="label">סמסטר / תקופה</label>
              <input className="input" value={semester} onChange={e=>setSemester(e.target.value)} placeholder="שנתי, סמסטר א׳..."/>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 160px',gap:14}}>
            <div>
              <label className="label">תיאור</label>
              <input className="input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="תיאור קצר של המחוון"/>
            </div>
            <div>
              <label className="label">סה"כ נקודות</label>
              <input className="input" type="number" min="0" value={totalPoints} onChange={e=>setTotalPoints(e.target.value)} placeholder="100"/>
            </div>
          </div>

          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <label className="label" style={{margin:0}}>קריטריונים</label>
              <span style={{fontSize:13,color: totalWeight===100 ? 'var(--ok)' : 'var(--warn)', fontWeight:600}}>
                סכום משקלים: {totalWeight}%
              </span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {criteria.map((c) => (
                <div key={c._key} style={{display:'grid',gridTemplateColumns:'1fr 2fr 70px 32px',gap:10,alignItems:'center',padding:'12px 14px',background:'var(--surface-2)',borderRadius:10,border:'1px solid var(--border)'}}>
                  <input className="input" value={c.name} onChange={e=>updateCriterion(c._key,'name',e.target.value)} placeholder="שם הקריטריון" style={{fontSize:13}}/>
                  <input className="input" value={c.desc} onChange={e=>updateCriterion(c._key,'desc',e.target.value)} placeholder="תיאור קצר" style={{fontSize:13}}/>
                  <div style={{position:'relative'}}>
                    <input className="input" type="number" min="0" max="100" value={c.weight} onChange={e=>updateCriterion(c._key,'weight',e.target.value)} placeholder="0" style={{fontSize:13,paddingLeft:24}}/>
                    <span style={{position:'absolute',insetInlineStart:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--ink-3)',pointerEvents:'none'}}>%</span>
                  </div>
                  <button onClick={()=>removeCriterion(c._key)} style={{padding:6,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-4)',display:'grid',placeItems:'center'}} onMouseEnter={e=>e.currentTarget.style.color='var(--warn)'} onMouseLeave={e=>e.currentTarget.style.color='var(--ink-4)'}><IconTrash size={14}/></button>
                </div>
              ))}
              <button onClick={addCriterion} style={{border:'2px dashed var(--border-strong)',background:'var(--surface)',borderRadius:10,padding:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:'var(--ink-2)',fontSize:13,cursor:'pointer'}}>
                <IconPlus size={14}/> הוסף קריטריון
              </button>
            </div>
          </div>

          {error && <div style={{fontSize:13,color:'var(--warn)',padding:'10px 14px',background:'var(--warn-soft)',borderRadius:8}}>{error}</div>}
        </div>

        <div style={{padding:'16px 28px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'flex-start',gap:10,position:'sticky',bottom:0,background:'var(--surface)'}}>
          <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <IconCheck size={14}/> {saving ? 'שומר...' : mode==='create' ? 'צור מחוון' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
}
