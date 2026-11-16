import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
import { useLanguage } from './i18n';

class EditorErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{display:'grid',placeItems:'center',height:'100vh',background:'var(--bg)',textAlign:'center',padding:32}}>
          <div>
            <div style={{fontSize:18,fontWeight:600,color:'var(--ink-1)',marginBottom:8}}>שגיאה בטעינת הניתוח</div>
            <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:16,maxWidth:400}}>{this.state.error.message}</div>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>רענן דף</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import * as Icons from './icons';
import { Icon, IconHome, IconUsers, IconArchive, IconSettings, IconFolder, IconFile, IconUpload, IconPlus, IconArrowLeft, IconArrowRight, IconChevron, IconPencil, IconMagic, IconMic, IconSearch, IconClose, IconCheck, IconDownload, IconSave, IconSend, IconSparkle, IconBookmark, IconDoc, IconWave, IconGrid, IconList, IconClock, IconArchiveBox, IconAlert, IconGraduationCap, IconEye } from './icons';
import { EVAL_CATEGORIES, EVIDENCES, LEVELS, LEVEL_KEYS, QA_SUGGESTIONS, levelFromScore, weightedScore } from './data';
import { chatEvaluation } from './api';



// ─── "השלמת מידע" — questions before the analysis ─────────────────────────────
// The questions come from POST /evaluations/prescan (services/questions.js).
// Each answer goes back with its question, so the analysis sees what was asked.
// A question left without an answer counts as skipped.
const QUESTION_TONE = {
  gap:          { fg: 'var(--lp)',    bg: 'var(--lp-soft)' },
  evidence:     { fg: 'var(--ob)',    bg: 'var(--ob-soft)' },
  requirements: { fg: 'var(--gold)',  bg: 'var(--gold-soft)' },
  content:      { fg: 'var(--gold)',  bg: 'var(--gold-soft)' },
  fixed:        { fg: 'var(--brand)', bg: 'var(--brand-soft)' },
};

function hasAnswer(a) {
  if (!a || a.skipped) return false;
  return !!(a.value || (a.note || '').trim() || a.indicatorId || (a.items && Object.values(a.items).some(Boolean)));
}

function noteMissing(Q, a) {
  if (!Q || !a || a.skipped || !a.value) return false;
  return (Q.note?.requiredFor || []).includes(a.value) && !(a.note || '').trim();
}

function resolveAnswers(questions, answers, skipAll) {
  return questions.map(Q => {
    const a = answers[Q.id] || {};
    const skipped = skipAll || !hasAnswer(a);
    const option = (Q.options || []).find(o => o.value === a.value);
    return {
      id: Q.id, kind: Q.kind, codes: Q.codes || [], topic: Q.topic, question: Q.question, context: Q.context || null,
      skipped,
      value: skipped ? null : (a.value || null),
      answer: skipped ? null : (option?.label || null),
      note: skipped ? '' : (a.note || '').trim(),
      items: skipped ? [] : (Q.items || [])
        .map(it => ({ label: it.label, answer: it.options.find(o => o.value === a.items?.[it.key])?.label || null }))
        .filter(i => i.answer),
      indicator: skipped ? null : ((Q.indicatorOptions || []).find(i => i.id === a.indicatorId) || null),
    };
  });
}

function HumanNodeModal({ open, status, data, onComplete, onCancel }) {
  const { t } = useLanguage();
  const questions = data?.questions || [];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showRequired, setShowRequired] = useState(false);
  useEffect(() => { if (open) { setStep(0); setAnswers({}); setShowRequired(false); } }, [open, data]);
  if (!open) return null;

  const ready = status === 'ready' && questions.length > 0;
  const Q = ready ? questions[Math.min(step, questions.length - 1)] : null;
  const a = (Q && answers[Q.id]) || {};
  const tone = (Q && QUESTION_TONE[Q.kind]) || QUESTION_TONE.fixed;
  const isLast = ready && step >= questions.length - 1;
  const noteRequired = !!Q && (Q.note?.requiredFor || []).includes(a.value);
  const missing = showRequired && noteMissing(Q, a);

  const update = patch => setAnswers(prev => ({ ...prev, [Q.id]: { ...(prev[Q.id] || {}), ...patch, skipped: false } }));
  const setItem = (key, value) => setAnswers(prev => {
    const cur = prev[Q.id] || {};
    return { ...prev, [Q.id]: { ...cur, skipped: false, items: { ...(cur.items || {}), [key]: value } } };
  });
  const finish = (next, skipAll = false) => onComplete(resolveAnswers(questions, next, skipAll));
  const goNext = () => {
    if (noteMissing(Q, a)) { setShowRequired(true); return; }
    setShowRequired(false);
    if (isLast) finish(answers); else setStep(step + 1);
  };
  const skipQuestion = () => {
    const next = { ...answers, [Q.id]: { ...(answers[Q.id] || {}), skipped: true } };
    setAnswers(next);
    setShowRequired(false);
    if (isLast) finish(next); else setStep(step + 1);
  };

  const footer = { padding: '14px 24px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' };

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,display:'grid',placeItems:'center',animation:'overlayIn .25s',background:'rgba(20,23,31,0.42)',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)'}}>
      <div role="dialog" aria-modal="true" aria-labelledby="hn-title" style={{width:640,maxWidth:'calc(100vw - 32px)',maxHeight:'calc(100vh - 32px)',display:'flex',flexDirection:'column',background:'var(--surface)',borderRadius:16,boxShadow:'var(--shadow-modal)',overflow:'hidden',animation:'fadeInScale .3s cubic-bezier(.2,.9,.3,1.2)',border:'1px solid var(--border)'}}>
        <div style={{padding:'20px 24px 18px',background:'linear-gradient(180deg,var(--brand-softer),var(--surface))',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:'var(--brand)',color:'#fff',display:'grid',placeItems:'center'}}><IconSparkle size={16}/></div>
              <div><div id="hn-title" style={{fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,color:'var(--ink-1)'}}>{t('modal_title')}</div><div style={{fontSize:12,color:'var(--ink-3)'}}>{t('modal_subtitle')}</div></div>
            </div>
            <button onClick={onCancel} className="btn-ghost" aria-label={t('btn_cancel_analysis')} title={t('btn_cancel_analysis')} style={{padding:6,borderRadius:6,color:'var(--ink-3)'}}><IconClose size={18}/></button>
          </div>
          {ready && (
            <div style={{marginTop:16,display:'flex',gap:4}}>
              {questions.map((q,i)=>{
                const done = hasAnswer(answers[q.id]); const skipped = answers[q.id]?.skipped;
                return (
                  <div key={q.id} style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
                    <div style={{height:3,borderRadius:2,background:i===step||done?'var(--brand)':skipped?'var(--border-strong)':'var(--border)',transition:'background .3s'}}/>
                    <div style={{fontSize:10.5,color:i===step?'var(--brand)':'var(--ink-3)',textAlign:'center',fontWeight:i===step?600:400}}>{skipped&&i!==step?t('question_skipped_label',{n:i+1}):t('question_label',{n:i+1})}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {status === 'loading' && (
          <div style={{padding:'48px 24px',textAlign:'center'}}>
            <IconSparkle size={24} stroke="var(--brand)" style={{animation:'pulse 1s infinite'}}/>
            <div style={{marginTop:12,fontSize:15,fontWeight:600,color:'var(--ink-1)'}}>{t('prescan_loading')}</div>
            <div style={{marginTop:4,fontSize:12.5,color:'var(--ink-3)'}}>{t('prescan_loading_hint')}</div>
          </div>
        )}

        {(status === 'error' || (status === 'ready' && questions.length === 0) || (status !== 'loading' && status !== 'ready' && status !== 'error')) && (
          <>
            <div style={{padding:'32px 24px',display:'flex',gap:12,alignItems:'flex-start'}}>
              {status === 'error' && <IconAlert size={18} stroke="var(--warn)" style={{flexShrink:0,marginTop:2}}/>}
              <div>
                <div style={{fontSize:14.5,fontWeight:600,color:'var(--ink-1)'}}>{status === 'error' ? t('prescan_error') : t('no_questions')}</div>
                {status === 'error' && data?.error && <div style={{marginTop:4,fontSize:12.5,color:'var(--ink-3)'}}>{data.error}</div>}
              </div>
            </div>
            <div style={footer}>
              <button className="btn btn-ghost btn-sm" onClick={onCancel}>{t('btn_cancel_analysis')}</button>
              <button className="btn btn-primary" onClick={()=>onComplete([])}>{t('btn_continue_analysis')} <IconArrowLeft size={14}/></button>
            </div>
          </>
        )}

        {ready && (
          <>
            <div style={{padding:'22px 24px',overflowY:'auto',flex:1}}>
              {step === 0 && data.limited && (
                <div style={{display:'flex',gap:8,alignItems:'flex-start',padding:'10px 12px',marginBottom:14,background:'var(--warn-soft)',borderRadius:'var(--r-sm)',fontSize:12.5,color:'var(--ink-2)',lineHeight:1.55}}>
                  <IconAlert size={14} stroke="var(--warn)" style={{flexShrink:0,marginTop:2}}/>
                  <span>{t('limited_info_warning', { n: data.counts?.lessonPlans ?? 0 })}</span>
                </div>
              )}
              {step === 0 && data.scanFailed && (
                <div style={{padding:'10px 12px',marginBottom:14,background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:12.5,color:'var(--ink-3)',lineHeight:1.55}}>{t('prescan_failed_note')}</div>
              )}
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',background:tone.bg,color:tone.fg,borderRadius:100,fontSize:11.5,fontWeight:500,marginBottom:12}}>
                {Q.codes?.length > 0 && <span dir="ltr" style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{Q.codes.join('–')}</span>}
                {Q.codes?.length > 0 && <span aria-hidden="true">·</span>}
                <span>{Q.topic}</span>
              </div>
              {Q.context && (
                <div style={{padding:'12px 14px',background:'var(--surface-2)',borderInlineStart:`3px solid ${tone.fg}`,borderRadius:6,fontSize:13,color:'var(--ink-2)',lineHeight:1.6,marginBottom:16,whiteSpace:'pre-line'}}>
                  <div style={{fontSize:11,color:tone.fg,fontWeight:600,letterSpacing:'0.06em',marginBottom:4}}>{t('system_detected_label')}</div>
                  {Q.context}
                </div>
              )}
              <div style={{fontFamily:'var(--font-serif)',fontSize:19,fontWeight:600,color:'var(--ink-1)',lineHeight:1.45,marginBottom:16,letterSpacing:'-0.005em'}}>{Q.question}</div>

              {Array.isArray(Q.options) && Q.options.length > 0 && (
                <div role="radiogroup" style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                  {Q.options.map(opt=>{
                    const sel = a.value === opt.value;
                    return (
                      <button key={opt.value} role="radio" aria-checked={sel} onClick={()=>update({value:opt.value})} style={{textAlign:'start',padding:'11px 14px',border:`1px solid ${sel?tone.fg:'var(--border)'}`,background:sel?`color-mix(in srgb, ${tone.bg} 55%, var(--surface))`:'var(--surface)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',gap:12,transition:'all .15s',width:'100%',cursor:'pointer'}}>
                        <div style={{width:16,height:16,borderRadius:'50%',flexShrink:0,border:`1.5px solid ${sel?tone.fg:'var(--border-strong)'}`,background:sel?tone.fg:'transparent',display:'grid',placeItems:'center'}}>
                          {sel&&<span style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                        </div>
                        <div style={{fontSize:14,fontWeight:sel?600:500,color:'var(--ink-1)'}}>{opt.label}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {Array.isArray(Q.items) && Q.items.length > 0 && (
                <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
                  {Q.items.map(it=>(
                    <div key={it.key} style={{padding:'12px 14px',border:'1px solid var(--border)',borderRadius:'var(--r-sm)'}}>
                      <div style={{fontSize:13.5,fontWeight:600,color:'var(--ink-1)',marginBottom:8}}>{it.label}</div>
                      <div role="radiogroup" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {it.options.map(o=>{
                          const sel = a.items?.[it.key] === o.value;
                          return <button key={o.value} role="radio" aria-checked={sel} onClick={()=>setItem(it.key, sel ? null : o.value)} style={{padding:'7px 12px',fontSize:13,border:`1px solid ${sel?tone.fg:'var(--border)'}`,background:sel?tone.bg:'var(--surface)',color:sel?tone.fg:'var(--ink-2)',fontWeight:sel?600:500,borderRadius:'var(--r-sm)',cursor:'pointer'}}>{o.label}</button>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {Q.hint && <div style={{fontSize:12,color:'var(--ink-3)',lineHeight:1.5,margin:'-4px 0 14px'}}>{Q.hint}</div>}

              {Array.isArray(Q.indicatorOptions) && Q.indicatorOptions.length > 0 && (
                <div style={{marginBottom:12}}>
                  <label className="label" htmlFor="hn-indicator">{t('strength_indicator_label')}</label>
                  <select id="hn-indicator" className="input" value={a.indicatorId || ''} onChange={e=>update({indicatorId:e.target.value||null})}>
                    <option value="">{t('strength_indicator_none')}</option>
                    {Q.indicatorOptions.map(i=><option key={i.id} value={i.id}>{i.id} · {i.name}</option>)}
                  </select>
                </div>
              )}

              <label className="label" htmlFor="hn-note">{Q.note?.primary ? t('answer_label') : noteRequired ? t('note_required_label') : t('note_optional_label')}</label>
              <textarea id="hn-note" className="textarea" value={a.note || ''} onChange={e=>update({note:e.target.value})} placeholder={Q.note?.placeholder || ''} aria-invalid={missing || undefined} style={{minHeight:Q.note?.primary?100:64,borderColor:missing?'var(--warn)':undefined}}/>
              {missing && <div role="alert" style={{marginTop:6,fontSize:12,color:'var(--warn)'}}>{t('note_required_msg')}</div>}
            </div>
            <div style={footer}>
              <button className="btn btn-ghost btn-sm" onClick={()=>finish(answers, true)}>{t('btn_skip_all')}</button>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {step>0&&<button className="btn btn-ghost btn-sm" onClick={()=>{setShowRequired(false);setStep(step-1);}}><IconArrowRight size={13}/> {t('btn_back')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={skipQuestion}>{t('btn_skip_question')}</button>
                <button className="btn btn-primary" onClick={goNext}>{isLast ? t('btn_finish_draft') : t('btn_next_question')} <IconArrowLeft size={14}/></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TRACK_TONE = {
  lesson_plan:{bg:'var(--lp-soft)',fg:'var(--lp)',activeBg:'var(--lp)',Icon:IconDoc,label:'מערך שיעור'},
  observation:{bg:'var(--ob-soft)',fg:'var(--ob)',activeBg:'var(--ob)',Icon:IconEye,label:'צפייה בשיעור'},
};

function resolveCategoryInputs(cat, answers) {
  answers = answers||{};
  let instructorText = '';
  if(cat.usesInstructorInput){const a=answers[cat.usesInstructorInput];instructorText=typeof a==='string'?a:(a&&a.note)||'';}
  let decisionText = '';
  if(cat.gap&&cat.gap.decisionKey){const a=answers[cat.gap.decisionKey];if(a&&a.label){decisionText=`לאחר התייעצות החלטת ${a.label}${a.note?` — ${a.note}`:''}. `;}else{decisionText=cat.gap.resolution||'';}}
  else if(cat.gap&&cat.gap.resolution){decisionText=cat.gap.resolution;}
  return {instructorText,decisionText};
}

function renderEvidenceTokens(text, activeEid, onClick, inputs) {
  const {instructorText,decisionText} = inputs||{};
  const parts = text.split(/(\{\{e\d+\}\}|\{\{instructor_input\}\}|\{\{decision\}\})/g);
  return parts.map((part,i)=>{
    const eMatch = part.match(/\{\{(e\d+)\}\}/);
    if(eMatch){
      const eid=eMatch[1]; const ev=EVIDENCES[eid]; const isActive=activeEid===eid;
      const trackColors = ev?.track==='lesson_plan'?TRACK_TONE.lesson_plan:ev?.track==='observation'?TRACK_TONE.observation:{bg:'var(--brand-soft)',fg:'var(--brand)',activeBg:'var(--brand)',Icon:null};
      return <span key={i} onClick={(e)=>{e.stopPropagation();onClick(eid);}} className="tag" style={{margin:'0 2px',cursor:'pointer',background:isActive?trackColors.activeBg:trackColors.bg,color:isActive?'#fff':trackColors.fg,boxShadow:isActive?`0 0 0 3px ${trackColors.bg}`:'none',fontWeight:500,display:'inline-flex',alignItems:'center',gap:3}}>{trackColors.Icon&&<trackColors.Icon size={11}/>}{ev?.label}</span>;
    }
    if(part==='{{instructor_input}}') return <span key={i} style={{background:'var(--accent-soft)',color:'var(--accent)',padding:'1px 6px',borderRadius:3,fontWeight:500}}>{instructorText||'התובנה שלך'}</span>;
    if(part==='{{decision}}'){if(!decisionText)return null;return <span key={i} style={{background:'var(--accent-soft)',color:'var(--accent)',padding:'1px 6px',borderRadius:3,fontWeight:500}}>{decisionText}</span>;}
    return <span key={i}>{part}</span>;
  });
}

function extractEvidenceIds(text) {
  const matches = text.matchAll(/\{\{(e\d+)\}\}/g); return [...new Set([...matches].map(m=>m[1]))];
}

function SourceCell({ track, dim, activeEvidence, onEvidenceClick }) {
  const { t } = useLanguage();
  const tone = TRACK_TONE[track];
  const trackLabel = track === 'lesson_plan' ? t('track_lesson_plan') : t('track_observation_label');
  if(!dim) return (
    <div style={{flex:1,padding:'10px 12px',borderRadius:'var(--r-sm)',background:'var(--surface-2)',border:'1px dashed var(--border-strong)',opacity:0.7}}>
      <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--ink-3)'}}>{tone.Icon&&<tone.Icon size={12} style={{opacity:.5}}/>}<span>{trackLabel}</span></div>
      <div style={{fontSize:12,color:'var(--ink-4)',marginTop:6}}>{t('no_evidence')}</div>
    </div>
  );
  const lvl = LEVELS[dim.level] || { label: dim.level || '—', cls: 'badge-neutral' };
  return (
    <div style={{flex:1,padding:'10px 12px',borderRadius:'var(--r-sm)',background:`color-mix(in srgb, ${tone.bg} 40%, var(--surface))`,border:`1px solid ${tone.bg}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,color:tone.fg}}>{tone.Icon&&<tone.Icon size={12}/>}<span>{trackLabel}</span></div>
        <span style={{fontSize:11,fontWeight:600,color:tone.fg,background:'var(--surface)',padding:'1px 7px',borderRadius:100,border:`1px solid ${tone.bg}`}}>{lvl.label}</span>
      </div>
      <div style={{fontSize:12.5,color:'var(--ink-2)',marginTop:6,lineHeight:1.55}}>{dim.note}</div>
      {dim.ev&&<button onClick={(e)=>{e.stopPropagation();onEvidenceClick(dim.ev);}} className="tag" style={{marginTop:8,cursor:'pointer',background:activeEvidence===dim.ev?tone.activeBg:'var(--surface)',color:activeEvidence===dim.ev?'#fff':tone.fg,border:`1px solid ${tone.bg}`}}>{EVIDENCES[dim.ev]?.label} ›</button>}
    </div>
  );
}

function GapInsight({ cat, answered }) {
  const { t } = useLanguage();
  const g = cat.gap; if(!g) return null;
  const needsDecision = !!g.decisionKey&&!answered;
  if (!needsDecision) return null;
  return (
    <div style={{marginTop:14,padding:'12px 14px',background:'var(--warn-soft)',borderInlineStart:'3px solid var(--warn)',borderRadius:6}}>
      <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--warn)',marginBottom:4,display:'flex',alignItems:'center',gap:6}}><span>⚖</span>{t('gap_detected')}</div>
      <div style={{fontSize:12.5,color:'var(--ink-2)',lineHeight:1.6}}>{g.summary}</div>
    </div>
  );
}

// One rubric indicator inside a criterion card: the level is a dropdown styled as the
// level pill, and the rationale is edited in place (blur or ⌘/Ctrl+Enter saves, Esc cancels).
function IndicatorRow({ ind, onChange }) {
  const { t } = useLanguage();
  const [editingNote, setEditingNote] = useState(false);
  const il = LEVELS[ind.level];
  const levelText = il ? il.label : t('indicator_no_evidence');
  const finishNote = (value, save) => {
    setEditingNote(false);
    const next = (value || '').trim();
    if (save && next !== (ind.note || '')) onChange({ note: next });
  };
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'4px 10px',alignItems:'center'}}>
      <div style={{fontSize:13,color:'var(--ink-1)',fontWeight:500}}><span style={{color:'var(--ink-3)',fontFamily:'var(--font-mono)',fontSize:11.5,marginInlineEnd:6}}>{ind.id}</span>{ind.name}</div>
      {onChange ? (
        <label className={`badge pill-select ${il ? il.cls : 'badge-neutral'}`} style={{fontSize:11.5}} title={t('indicator_level')} onClick={e=>e.stopPropagation()}>
          {levelText}<IconChevron size={11} style={{transform:'rotate(-90deg)',opacity:.7}}/>
          <select value={ind.level || ''} onChange={e=>onChange({ level: e.target.value || null })} aria-label={`${t('indicator_level')} ${ind.id} — ${ind.name}`}>
            {LEVEL_KEYS.map(k=><option key={k} value={k}>{LEVELS[k].label}</option>)}
            <option value="">{t('indicator_no_evidence')}</option>
          </select>
        </label>
      ) : (
        <span className={`badge ${il ? il.cls : 'badge-neutral'}`} style={{fontSize:11}}>{levelText}</span>
      )}
      <div style={{gridColumn:'1 / -1'}}>
        {editingNote ? (
          <textarea
            className="textarea"
            defaultValue={ind.note || ''}
            autoFocus
            aria-label={`${t('indicator_rationale')} ${ind.id}`}
            onClick={e=>e.stopPropagation()}
            onBlur={e=>finishNote(e.target.value, true)}
            onKeyDown={e=>{
              if (e.key === 'Escape') { e.preventDefault(); finishNote('', false); }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.currentTarget.blur(); }
            }}
            style={{minHeight:64,fontSize:13,lineHeight:1.6}}
          />
        ) : (
          <div style={{display:'flex',alignItems:'flex-start',gap:6}}>
            {ind.note && <div style={{fontSize:12.5,color:'var(--ink-3)',lineHeight:1.55}}>{ind.note}</div>}
            {onChange && (
              <button
                type="button"
                onClick={e=>{e.stopPropagation();setEditingNote(true);}}
                className="btn-ghost"
                title={t('indicator_edit_rationale')}
                aria-label={`${ind.note ? t('indicator_edit_rationale') : t('indicator_add_rationale')} ${ind.id}`}
                style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 6px',borderRadius:6,fontSize:12,color:'var(--ink-3)',flexShrink:0}}
              >
                <IconPencil size={12}/>{!ind.note && t('indicator_add_rationale')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryCard({ cat, index, aiTone, instructorAnswers, activeEvidence, onEvidenceClick, editing, onEdit, onEditSave, onScoreChange, onIndicatorChange, onRefine, refining, isActive, onSelect }) {
  const { t } = useLanguage();
  const {instructorText,decisionText} = resolveCategoryInputs(cat,instructorAnswers);
  const baseText = aiTone==='friendly'&&cat.balanceFriendly?cat.balanceFriendly:cat.balance;
  const answered = cat.gap&&cat.gap.decisionKey?!!(instructorAnswers&&instructorAnswers[cat.gap.decisionKey]):(cat.usesInstructorInput?!!(instructorAnswers&&instructorAnswers[cat.usesInstructorInput]):true);
  const rendered = baseText?renderEvidenceTokens(baseText,activeEvidence,onEvidenceClick,{instructorText,decisionText}):null;
  const overallKey = cat.overallLevel||(answered?'mid_high':null);
  const lvl = overallKey?LEVELS[overallKey]:null;
  const hasSplit = cat.lessonPlan||cat.observation;
  const isEmpty = !cat.lessonPlan&&!cat.observation&&cat.gap&&cat.gap.decisionKey&&!answered;
  return (
    <div className="card" style={{marginBottom:16,borderColor:isActive?'var(--brand)':'var(--border)',boxShadow:isActive?'0 0 0 3px var(--brand-softer)':undefined,transition:'all .2s',position:'relative'}} onClick={onSelect}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'var(--surface-3)',color:'var(--ink-1)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:14,fontWeight:600}}>{index+1}</div>
          <div>
            <h3 style={{fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,margin:0,letterSpacing:'-0.005em'}}>{cat.name}</h3>
            <div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:2}}>{t('weight_label', { weight: cat.weight })}</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {cat.score!==undefined&&onScoreChange&&(
            <label onClick={e=>e.stopPropagation()} title={t('criterion_score')} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--ink-3)'}}>
              <input type="number" min="0" max="100" aria-label={`${t('criterion_score')} — ${cat.name}`} value={cat.score??''} onChange={e=>onScoreChange(e.target.value)} className="input" style={{width:62,padding:'4px 6px',fontSize:14,fontWeight:600,textAlign:'center',color:'var(--ink-1)'}}/>
              <span>/100</span>
            </label>
          )}
          {lvl?<span className={`badge ${lvl.cls}`}>{lvl.label}</span>:<span className="badge badge-warn">{t('needs_completion')}</span>}
          <button onClick={(e)=>{e.stopPropagation();onEdit();}} className="btn-ghost" title={t('edit_manually')} style={{width:30,height:30,borderRadius:6,display:'grid',placeItems:'center',color:editing?'var(--brand)':'var(--ink-3)',background:editing?'var(--brand-softer)':'transparent'}}><IconPencil size={14}/></button>
          <button onClick={(e)=>{e.stopPropagation();onRefine();}} className="btn-ghost" title={t('ai_rephrase')} style={{width:30,height:30,borderRadius:6,display:'grid',placeItems:'center',color:'var(--brand)',background:refining?'var(--brand-softer)':'transparent'}}><IconMagic size={14}/></button>
        </div>
      </div>
      {hasSplit&&<div style={{display:'flex',gap:8,marginBottom:14}}><SourceCell track="lesson_plan" dim={cat.lessonPlan} activeEvidence={activeEvidence} onEvidenceClick={onEvidenceClick}/><SourceCell track="observation" dim={cat.observation} activeEvidence={activeEvidence} onEvidenceClick={onEvidenceClick}/></div>}
      {isEmpty?(
        <div style={{padding:'14px 16px',borderRadius:'var(--r-sm)',background:'var(--warn-soft)',color:'var(--warn)',fontSize:13,lineHeight:1.6,textAlign:'center'}}>{cat.emptyHint || t('empty_hint')}</div>
      ):editing?(
        <div style={{position:'relative'}}>
          <textarea className="textarea" defaultValue={(baseText||'').replace(/\{\{e(\d+)\}\}/g,(_,n)=>`[ראיה ${n}]`).replace('{{instructor_input}}',instructorText||'...').replace('{{decision}}',decisionText||'')} style={{minHeight:140,fontSize:14,lineHeight:1.75}} onClick={e=>e.stopPropagation()} autoFocus onBlur={(e) => onEditSave(e.target.value)} />
          <div style={{position:'absolute',bottom:12,left:12}}><button onClick={(e)=>{e.stopPropagation();onEditSave(e.target.previousSibling.value);}} className="btn btn-primary btn-sm"><IconCheck size={14}/> שמור ניסוח</button></div>
        </div>
      ):(
        <div style={{fontSize:14.5,lineHeight:1.85,color:'var(--ink-1)',opacity:refining?0.4:1,transition:'opacity .3s',position:'relative'}}>
          {rendered}
          {refining&&<div style={{position:'absolute',inset:-4,display:'grid',placeItems:'center'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:100,boxShadow:'var(--shadow-2)',fontSize:13,fontWeight:500,color:'var(--brand)'}}><IconSparkle size={14} style={{animation:'pulse 1s infinite'}}/>{t('ai_rephrasing')}</div></div>}
        </div>
      )}
      <GapInsight cat={cat} answered={answered}/>
      {Array.isArray(cat.indicators)&&cat.indicators.length>0&&(
        <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:11.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{t('indicators_title')}</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {cat.indicators.map(ind=>(
              <IndicatorRow key={ind.id} ind={ind} onChange={onIndicatorChange?(patch)=>onIndicatorChange(ind.id, patch):null}/>
            ))}
          </div>
        </div>
      )}
      {extractEvidenceIds(baseText||'').length>0&&(
        <div style={{marginTop:14,display:'flex',alignItems:'center',gap:8,paddingTop:12,borderTop:'1px solid var(--border)',flexWrap:'wrap'}}>
          <span style={{fontSize:11.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('supporting_evidence')}</span>
          {extractEvidenceIds(baseText||'').map(eid=>{
            const ev=EVIDENCES[eid]; const isActive=activeEvidence===eid;
            const tc=ev?.track==='lesson_plan'?TRACK_TONE.lesson_plan:ev?.track==='observation'?TRACK_TONE.observation:{bg:'var(--brand-soft)',fg:'var(--brand)',activeBg:'var(--brand)',Icon:null};
            return <button key={eid} onClick={(e)=>{e.stopPropagation();onEvidenceClick(eid);}} className="tag" style={{cursor:'pointer',background:isActive?tc.activeBg:tc.bg,color:isActive?'#fff':tc.fg,boxShadow:isActive?`0 0 0 3px ${tc.bg}`:'none',display:'inline-flex',alignItems:'center',gap:3}}>{tc.Icon&&<tc.Icon size={11}/>}{ev?.label}{ev?.cycle&&<span style={{opacity:.65,marginInlineStart:4,fontSize:10.5}}>· {ev.cycle}</span>}</button>;
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ summary, onSummaryUpdate }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const text = summary?.text || 'הסטודנטית נמצאת בנקודה טובה בשלב ההכשרה. הכוחות הבולטים: רפלקציה עמוקה, תושייה בכיתה והיכרות תוכנית מבוססת. תחומי הצמיחה: העמקת התכנון לפני השיעור. ההמלצה: מעבר עם ליווי ממוקד.';
  const score = summary?.score ?? '—';
  const strengths = summary?.strengths || [];
  const goals = summary?.goals || [];
  
  const handleSave = (val) => {
    setEditing(false);
    if (onSummaryUpdate) onSummaryUpdate(val);
  };

  return (
    <div className="card" style={{background:'var(--surface-2)',borderColor:'var(--border)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <h3 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:'0 0 12px',color:'var(--ink-1)'}}>{t('summary_title')}</h3>
        <button onClick={()=>setEditing(!editing)} className="btn-ghost" title={t('edit_manually')} style={{width:30,height:30,borderRadius:6,display:'grid',placeItems:'center',color:editing?'var(--brand)':'var(--ink-3)',background:editing?'var(--brand-softer)':'transparent'}}><IconPencil size={14}/></button>
      </div>
      {editing ? (
        <div style={{position:'relative'}}>
          <textarea className="textarea" defaultValue={text} style={{minHeight:140,fontSize:14,lineHeight:1.75}} autoFocus onBlur={(e) => handleSave(e.target.value)} />
          <div style={{position:'absolute',bottom:12,left:12}}><button onClick={(e)=>{e.stopPropagation();handleSave(e.target.previousSibling.value);}} className="btn btn-primary btn-sm"><IconCheck size={14}/> שמור סיכום</button></div>
        </div>
      ) : (
        <p style={{fontSize:15,lineHeight:1.85,color:'var(--ink-1)',margin:0}}>{text}</p>
      )}
      <div style={{marginTop:20,padding:'16px 20px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,display:'flex',alignItems:'center',gap:20}}>
        <div><div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('proposed_score')}</div><div style={{fontFamily:'var(--font-serif)',fontSize:32,fontWeight:600,color:'var(--brand)',lineHeight:1.1,marginTop:4}}>{score} <span style={{fontSize:16,color:'var(--ink-3)',fontWeight:400}}>/ 100</span></div></div>
        <div style={{width:1,height:48,background:'var(--border)'}}/>
        <div style={{fontSize:13.5,color:'var(--ink-2)',lineHeight:1.5}}>{t('score_note_1')}<br/>{t('score_note_2')}</div>
      </div>
      {(strengths.length>0||goals.length>0)&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:16}}>
          {[['doc_strengths',strengths,'var(--ok)'],['doc_goals',goals,'var(--brand)']].map(([key,items,color])=>(
            <div key={key} style={{padding:'14px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12}}>
              <div style={{fontSize:12.5,fontWeight:600,color,marginBottom:6}}>{t(key)}</div>
              {items.length>0
                ? <ul style={{margin:0,paddingInlineStart:18,fontSize:13.5,lineHeight:1.65,color:'var(--ink-1)'}}>{items.map((x,i)=><li key={i}>{x}</li>)}</ul>
                : <div style={{fontSize:13,color:'var(--ink-4)'}}>—</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatBox({ messages, thinking, value, onChange, onSend, student }) {
  const { t } = useLanguage();
  const scrollRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(()=>{ if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[messages,thinking]);
  return (
    <div style={{borderTop:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
      {(messages.length>0||expanded)&&(
        <div ref={scrollRef} className="scroll" style={{maxHeight:220,overflowY:'auto',padding:'14px 18px',display:'flex',flexDirection:'column',gap:10}}>
          {messages.length===0&&<div style={{fontSize:12,color:'var(--ink-3)'}}>{t('chat_example')}</div>}
          {messages.map((m,i)=>(
            <div key={i} style={{alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'88%',padding:'8px 12px',borderRadius:m.role==='user'?'12px 12px 4px 12px':'12px 12px 12px 4px',background:m.role==='user'?'var(--brand)':'var(--surface-2)',color:m.role==='user'?'#fff':'var(--ink-1)',fontSize:13,lineHeight:1.6}}>{m.text}</div>
          ))}
          {thinking&&<div style={{alignSelf:'flex-start',padding:'8px 12px',background:'var(--surface-2)',borderRadius:'12px 12px 12px 4px',fontSize:13,display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--brand)',animation:'pulse 1.2s infinite'}}/><span style={{width:6,height:6,borderRadius:'50%',background:'var(--brand)',animation:'pulse 1.2s infinite .2s'}}/><span style={{width:6,height:6,borderRadius:'50%',background:'var(--brand)',animation:'pulse 1.2s infinite .4s'}}/>
          </div>}
        </div>
      )}
      {messages.length===0&&!expanded&&(
        <div style={{padding:'10px 18px 4px',display:'flex',gap:6,flexWrap:'wrap'}}>
          {QA_SUGGESTIONS.slice(0,3).map(q=><button key={q} onClick={()=>onSend(q)} style={{padding:'5px 10px',fontSize:11.5,border:'1px solid var(--border)',borderRadius:100,color:'var(--ink-2)',background:'var(--surface)',cursor:'pointer'}}>{q}</button>)}
        </div>
      )}
      <form onSubmit={e=>{e.preventDefault();onSend(value);}} style={{display:'flex',alignItems:'center',gap:8,padding:'12px 18px 14px'}}>
        <div style={{width:26,height:26,borderRadius:6,background:'var(--brand)',color:'#fff',display:'grid',placeItems:'center',flexShrink:0}}><IconSparkle size={13}/></div>
        <input className="input" placeholder={t('chat_placeholder', { name: student.name })} value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setExpanded(true)} style={{padding:'8px 12px',fontSize:13}}/>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!value.trim()} style={{width:36,padding:0}}><IconSend size={14}/></button>
      </form>
    </div>
  );
}

function DraftHeader({ student, answersCount, rubricName }) {
  const { t } = useLanguage();
  const legendItems = [
    {Ic:IconDoc, label:t('track_lesson_plan'), fg:'var(--lp)', bg:'var(--lp-soft)'},
    {Ic:IconEye, label:t('track_observation_label'), fg:'var(--ob)', bg:'var(--ob-soft)'},
    {Ic:IconSparkle, label:t('gap_decided'), fg:'var(--gold)', bg:'var(--gold-soft)'},
  ];
  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:6,display:'flex',alignItems:'center',gap:8}}><IconSparkle size={12} stroke="var(--brand)"/>{rubricName&&<><b style={{color:'var(--ink-2)',fontWeight:600}}>{rubricName}</b> · </>}{t('rubric_info')}</div>
      <h1 style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600,margin:0,letterSpacing:'-0.01em'}}>{t('eval_draft_title_prefix')} {student.name}</h1>
      <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
        {legendItems.map(c=><span key={c.label} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:100,background:c.bg,color:c.fg,fontSize:11.5,fontWeight:500}}><c.Ic size={12}/>{c.label}</span>)}
        {answersCount>0&&<span style={{fontSize:12,color:'var(--ink-3)',alignSelf:'center',marginInlineStart:4}}>{t('instructor_insights_integrated', { n: answersCount })}</span>}
      </div>
    </div>
  );
}

function SplitEditor({ student, instructorAnswers, aiTone, onBack, onExport, evalCategories, evalSummary, rubricName, evaluationId, onSave, evidenceFiles }) {
  const { t } = useLanguage();
  const [activeCategories, setActiveCategories] = useState(evalCategories || EVAL_CATEGORIES);
  const [currentSummary, setCurrentSummary] = useState(evalSummary || {text:'', score:'—'});

  // Build live evidences from actual uploaded files
  const liveEvidences = React.useMemo(() => {
    if (!evidenceFiles || evidenceFiles.length === 0) return {};
    const result = {};
    evidenceFiles.forEach((f, i) => {
      const eid = `file_${f.id}`;
      const isObs = f.cycle_id?.startsWith('ob') || ['observation','feedback','reflection'].includes(f.stage_key);
      const track = isObs ? 'observation' : 'lesson_plan';
      const label = (f.original_name || `מסמך ${i+1}`).replace(/\.[^.]+$/, '').slice(0, 28);
      const doc = f.text_preview
        ? f.text_preview.split('\n').reduce((acc, line, idx) => {
            const t = line.trim();
            if (!t) { acc.push({ text: '' }); return acc; }
            acc.push({ text: t, heading: idx === 0 });
            return acc;
          }, [])
        : [{ text: 'תוכן לא זמין', heading: false }];
      result[eid] = { id: eid, label, track, cycle: f.cycle_id || '', fileName: f.original_name || '', doc };
    });
    return result;
  }, [evidenceFiles]);

  const defaultEvidenceId = Object.keys(liveEvidences)[0] || null;
  const [activeEvidence, setActiveEvidence] = useState(defaultEvidenceId);
  useEffect(() => {
    setActiveEvidence(prev => (prev && liveEvidences[prev]) ? prev : (Object.keys(liveEvidences)[0] || null));
  }, [liveEvidences]);
  const [activeCat, setActiveCat] = useState((evalCategories||EVAL_CATEGORIES)[0].id);
  const [editing, setEditing] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatThinking, setChatThinking] = useState(false);
  const [refining, setRefining] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const evidence = liveEvidences[activeEvidence] || Object.values(liveEvidences)[0];
  const handleRefine = (catId) => { setRefining(catId); setTimeout(()=>setRefining(null),1400); };
  const handleSave = async () => {
    if (!onSave) return;
    setSaveStatus('saving');
    try {
      const draft = { categories: activeCategories, summary: currentSummary?.text, score: currentSummary?.score };
      const overall = levelFromScore(currentSummary?.score);
      if (overall) draft.overallLevel = overall;
      await onSave(draft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch { setSaveStatus('idle'); }
  };
  // A criterion score sets its level by the rubric's bands and re-weights the final grade.
  const handleScoreChange = (catId, raw) => {
    const n = Number(raw);
    if (raw !== '' && !Number.isFinite(n)) return;
    const val = raw === '' ? null : Math.max(0, Math.min(100, Math.round(n)));
    const next = activeCategories.map(c => c.id === catId ? { ...c, score: val, overallLevel: val === null ? c.overallLevel : levelFromScore(val) } : c);
    setActiveCategories(next);
    const total = weightedScore(next);
    if (total !== null) setCurrentSummary(prev => ({ ...prev, score: total }));
  };
  const handleIndicatorChange = (catId, indId, patch) => {
    setActiveCategories(prev => prev.map(c => c.id !== catId ? c : {
      ...c,
      indicators: (c.indicators || []).map(ind => ind.id === indId ? { ...ind, ...patch } : ind),
    }));
  };
  const handleExport = async () => {
    if (onSave) await handleSave();
    onExport();
  };
  const handleUpdateCategoryText = (catId, newText) => {
    setActiveCategories(prev => prev.map(c => c.id === catId ? {...c, balance: newText} : c));
    setEditing(null);
  };
  const handleUpdateSummary = (newText) => {
    setCurrentSummary(prev => ({...prev, text: newText}));
  };
  const sendChat = async (msg) => {
    if(!msg.trim()||chatThinking)return;
    const history = chatMessages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', text: m.text }));
    setChatMessages(prev=>[...prev,{role:'user',text:msg}]); setChatInput(''); setChatThinking(true);
    try {
      const draft = {
        categories: activeCategories.map(c => ({ id: c.id, name: c.name, weight: c.weight, score: c.score, overallLevel: c.overallLevel, balance: c.balance })),
        summary: currentSummary?.text,
        score: currentSummary?.score,
      };
      const res = await chatEvaluation(student.id, msg, history, draft);
      // The model may return rewritten draft texts — apply them to the editor.
      if (res.updates) {
        if (Array.isArray(res.updates.categories) && res.updates.categories.length > 0) {
          setActiveCategories(prev => prev.map(c => {
            const u = res.updates.categories.find(x => x && x.id === c.id && typeof x.balance === 'string' && x.balance.trim());
            return u ? { ...c, balance: u.balance } : c;
          }));
        }
        if (typeof res.updates.summary === 'string' && res.updates.summary.trim()) {
          setCurrentSummary(prev => ({ ...prev, text: res.updates.summary }));
        }
      }
      setChatMessages(prev=>[...prev,{role:'ai',text:res.reply || t('chat_error')}]);
    } catch (err) {
      setChatMessages(prev=>[...prev,{role:'ai',text:`${t('chat_error')} (${err.message})`}]);
    } finally {
      setChatThinking(false);
    }
  };
  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 28px',background:'var(--surface)',borderBottom:'1px solid var(--border)',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <button onClick={onBack} className="btn btn-ghost btn-sm" style={{borderRadius:100,padding:'6px 12px'}}><IconArrowRight size={14}/> {t('editor_back')}</button>
          <div style={{width:1,height:24,background:'var(--border)'}}/>
          <div><div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600}}>{t('eval_draft_title_prefix')} {student.name}</div><div style={{fontSize:13,color:'var(--ink-3)',marginTop:2}}>{t('eval_draft_subtitle')}</div></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span className="badge badge-info" style={{borderRadius:100,padding:'4px 12px',fontSize:13}}>{t('editor_draft_badge')}</span>
          <button onClick={handleSave} disabled={saveStatus==='saving'} className="btn btn-secondary btn-sm" style={{borderRadius:100,padding:'6px 16px',minWidth:90}}>
            {saveStatus==='saving'?<><IconSparkle size={13} style={{animation:'pulse 1s infinite'}}/> {t('editor_saving')}</>:saveStatus==='saved'?<><IconCheck size={13} stroke="var(--ok)"/> {t('editor_saved')}</>:<><IconSave size={14}/> {t('editor_save')}</>}
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExport} style={{padding:'6px 16px'}}>{t('editor_export')} <IconArrowLeft size={14}/></button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'36% 64%',flex:1,minHeight:0}}>
        <div style={{borderInlineStart:'1px solid var(--border)',background:'var(--surface-2)',display:'flex',flexDirection:'column',minHeight:0}}>
          <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',background:'var(--surface)',padding:'0 8px',flexShrink:0,minHeight:44,alignItems:'center'}}>
            {Object.values(liveEvidences).length === 0
              ? <span style={{padding:'0 14px',fontSize:12,color:'var(--ink-4)'}}>{t('no_documents')}</span>
              : Object.values(liveEvidences).map(ev=>{
                  const tc=ev.track==='lesson_plan'?'var(--lp)':ev.track==='observation'?'var(--ob)':'var(--brand)';
                  const TrackIc=ev.track==='lesson_plan'?IconDoc:ev.track==='observation'?IconEye:null;
                  const isActive=activeEvidence===ev.id;
                  return <button key={ev.id} onClick={()=>setActiveEvidence(ev.id)} style={{padding:'12px 14px',fontSize:12.5,color:isActive?tc:'var(--ink-3)',fontWeight:isActive?600:400,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6,cursor:'pointer',background:'transparent',border:'none',borderBottom:`2px solid ${isActive?tc:'transparent'}`}}>{TrackIc&&<TrackIc size={12}/>}{ev.label}</button>;
                })
            }
          </div>
          <div className="scroll" style={{flex:1,overflowY:'auto',padding:24,background:'var(--surface-2)'}}>
            {!evidence ? (
              <div style={{display:'grid',placeItems:'center',height:'100%',padding:32,textAlign:'center'}}>
                <div>
                  <IconDoc size={32} style={{opacity:.25,marginBottom:12}}/>
                  <div style={{fontSize:14,color:'var(--ink-3)',lineHeight:1.7}}>{t('no_documents_uploaded')}<br/><span style={{fontSize:12}}>{t('no_documents_hint')}</span></div>
                </div>
              </div>
            ) : (
              <>
                <div className="card" style={{padding:'32px'}}>
                  <div style={{fontSize:11.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{evidence.label} · {evidence.fileName}</div>
                  {evidence.doc.map((line,i)=>{
                    if(line.heading)return <h3 key={i} style={{fontFamily:'var(--font-serif)',fontSize:19,fontWeight:600,margin:'4px 0 12px',color:'var(--ink-1)'}}>{line.text}</h3>;
                    return <p key={i} style={{margin:line.text===''?'6px 0':'8px 0',fontSize:14,lineHeight:1.75,color:'var(--ink-1)'}}>{line.text}</p>;
                  })}
                </div>
                <div style={{marginTop:14,fontSize:12,color:'var(--ink-3)',padding:'0 6px'}}>
                  <span>מקור: {evidence.fileName}</span>
                </div>
              </>
            )}
          </div>
          <ChatBox messages={chatMessages} thinking={chatThinking} value={chatInput} onChange={setChatInput} onSend={sendChat} student={student}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',minHeight:0,background:'var(--bg)'}}>
          <div className="scroll" style={{flex:1,overflowY:'auto',padding:'28px 36px 80px'}}>
            <DraftHeader student={student} rubricName={rubricName} answersCount={Array.isArray(instructorAnswers)?instructorAnswers.filter(x=>!x.skipped).length:0}/>
            {activeCategories.map((cat,idx)=>(
              <CategoryCard key={cat.id} cat={cat} index={idx} aiTone={aiTone} instructorAnswers={instructorAnswers} activeEvidence={activeEvidence} onEvidenceClick={setActiveEvidence} editing={editing===cat.id} onEdit={()=>setEditing(editing===cat.id?null:cat.id)} onEditSave={(newText)=>handleUpdateCategoryText(cat.id, newText)} onScoreChange={(v)=>handleScoreChange(cat.id, v)} onIndicatorChange={(indId, patch)=>handleIndicatorChange(cat.id, indId, patch)} onRefine={()=>handleRefine(cat.id)} refining={refining===cat.id} isActive={activeCat===cat.id} onSelect={()=>setActiveCat(cat.id)}/>
            ))}
            <SummaryCard summary={currentSummary} onSummaryUpdate={handleUpdateSummary}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function SplitEditorWithBoundary(props) {
  return <EditorErrorBoundary><SplitEditor {...props}/></EditorErrorBoundary>;
}

export {  HumanNodeModal, SplitEditorWithBoundary as SplitEditor  };