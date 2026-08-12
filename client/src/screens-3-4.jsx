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
import { SMART_QUESTIONS, EVAL_CATEGORIES, EVIDENCES, LEVELS, QA_SUGGESTIONS } from './data';



function HumanNodeModal({ open, onComplete, onSkip, questions }) {
  const { t } = useLanguage();
  const SMART_QUESTIONS_ACTIVE = questions && questions.length > 0 ? questions : SMART_QUESTIONS;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const intervalRef = useRef(null);
  useEffect(()=>{ if(open){setStep(0);setAnswers({});setRecording(false);setRecordTime(0);} },[open]);
  useEffect(()=>{ if(recording){intervalRef.current=setInterval(()=>setRecordTime(t=>t+1),1000);}else{clearInterval(intervalRef.current);} return()=>clearInterval(intervalRef.current); },[recording]);
  if (!open) return null;
  const Q = SMART_QUESTIONS_ACTIVE[step]; const isLast = step===SMART_QUESTIONS_ACTIVE.length-1;
  const rawVal = answers[Q.id]; const isDecision = Q.type==='decision';
  const currentChoice = isDecision&&rawVal?rawVal.value:null;
  const currentNote = isDecision?(rawVal?rawVal.note||'':''):(typeof rawVal==='string'?rawVal:'');
  const setCurrentNote = (val) => setAnswers(prev=>({...prev,[Q.id]:isDecision?{...(prev[Q.id]||{}),note:val}:val}));
  const setChoice = (opt) => setAnswers(prev=>({...prev,[Q.id]:{value:opt.value,label:opt.label,note:(prev[Q.id]&&prev[Q.id].note)||''}}));
  const gapTone = Q.gap==='lessonPlan'?{fg:'#1e3a5f',bg:'#e8eef5'}:Q.gap==='observation'?{fg:'#2f7a4e',bg:'#e3f0e8'}:{fg:'#b08552',bg:'#f4ecdf'};
  return (
    <div style={{position:'fixed',inset:0,zIndex:100,display:'grid',placeItems:'center',animation:'overlayIn .25s',background:'rgba(20,23,31,0.42)',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)'}}>
      <div style={{width:620,maxWidth:'calc(100vw - 32px)',background:'var(--surface)',borderRadius:16,boxShadow:'var(--shadow-modal)',overflow:'hidden',animation:'fadeInScale .3s cubic-bezier(.2,.9,.3,1.2)',border:'1px solid var(--border)'}}>
        <div style={{padding:'20px 24px 18px',background:'linear-gradient(180deg,var(--brand-softer),var(--surface))',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:'var(--brand)',color:'#fff',display:'grid',placeItems:'center'}}><IconSparkle size={16}/></div>
              <div><div style={{fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,color:'var(--ink-1)'}}>{t('modal_title')}</div><div style={{fontSize:12,color:'var(--ink-3)'}}>{t('modal_subtitle')}</div></div>
            </div>
            <button onClick={onSkip} className="btn-ghost" style={{padding:6,borderRadius:6,color:'var(--ink-3)'}}><IconClose size={18}/></button>
          </div>
          <div style={{marginTop:16,display:'flex',gap:4}}>
            {SMART_QUESTIONS_ACTIVE.map((q,i)=>(
              <div key={q.id} style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
                <div style={{height:3,borderRadius:2,background:i<=step?'var(--brand)':'var(--border)',transition:'background .3s'}}/>
                <div style={{fontSize:10.5,color:i===step?'var(--brand)':'var(--ink-3)',textAlign:'center',fontWeight:i===step?600:400}}>{t('question_label', { n: i+1 })}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'22px 24px'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',background:gapTone.bg,color:gapTone.fg,borderRadius:100,fontSize:11.5,fontWeight:500,marginBottom:12}}>{Q.badge}</div>
          <div style={{padding:'12px 14px',background:'var(--surface-2)',borderInlineStart:`3px solid ${gapTone.fg}`,borderRadius:6,fontSize:13,color:'var(--ink-2)',lineHeight:1.6,marginBottom:16}}>
            <div style={{fontSize:11,color:gapTone.fg,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{t('system_detected_label')}</div>
            {Q.context}
          </div>
          <div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,color:'var(--ink-1)',lineHeight:1.4,marginBottom:16,letterSpacing:'-0.005em'}}>{Q.question}</div>
          {isDecision&&(
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
              {Q.options.map(opt=>{
                const sel=currentChoice===opt.value;
                return (
                  <button key={opt.value} onClick={()=>setChoice(opt)} style={{textAlign:'start',padding:'12px 14px',border:`1px solid ${sel?gapTone.fg:'var(--border)'}`,background:sel?gapTone.bg+'88':'var(--surface)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'flex-start',gap:12,transition:'all .15s',width:'100%',cursor:'pointer'}}>
                    <div style={{width:16,height:16,borderRadius:'50%',marginTop:2,flexShrink:0,border:`1.5px solid ${sel?gapTone.fg:'var(--border-strong)'}`,background:sel?gapTone.fg:'transparent',display:'grid',placeItems:'center'}}>
                      {sel&&<span style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                    </div>
                    <div><div style={{fontSize:14,fontWeight:600,color:'var(--ink-1)'}}>{opt.label}</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{opt.detail}</div></div>
                  </button>
                );
              })}
            </div>
          )}
          <div style={{position:'relative'}}>
            <textarea className="textarea" value={currentNote} onChange={e=>setCurrentNote(e.target.value)} placeholder={Q.placeholder} style={{minHeight:isDecision?64:100,paddingInlineEnd:56}}/>
            <button onClick={()=>{ if(recording){setRecording(false);const t={q1:'הביצוע בכיתה משקף את היכולת האמיתית שלה. התכנון עוד יתפתח.',q2:'יש לה אחריות מעל ומעבר — נשארת אחרי הצלצול עם תלמידים שמתקשים, מגיעה בבוקר 15 דקות מוקדם. האווירה בכיתה נינוחה.',q3:'מקפידה מאוד — נכחה בשני ימי ההורים, הגישה ציונים בזמן ואף יזמה תיאום עם הורה מודאג.'};setCurrentNote((currentNote?currentNote+' ':'')+(t[Q.id]||''));}else{setRecording(true);setRecordTime(0);}}}
              style={{position:'absolute',insetInlineStart:10,top:10,width:40,height:40,borderRadius:'50%',background:recording?'#c0392b':'var(--brand)',color:'#fff',display:'grid',placeItems:'center',boxShadow:recording?'0 0 0 4px rgba(192,57,43,0.18)':'0 2px 8px rgba(30,58,95,.2)',transition:'all .2s',cursor:'pointer'}}>
              {recording?<IconWave size={16}/>:<IconMic size={16}/>}
              {recording&&<span style={{position:'absolute',inset:-4,borderRadius:'50%',border:'2px solid #c0392b',animation:'ripple 1.4s infinite ease-out',pointerEvents:'none'}}/>}
            </button>
          </div>
          {recording?(
            <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#c0392b'}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#c0392b',animation:'pulse 1s infinite'}}/>
              {t('recording_timer', { time: `${String(Math.floor(recordTime/60)).padStart(2,'0')}:${String(recordTime%60).padStart(2,'0')}` })}
              <span style={{flex:1}}/><span style={{color:'var(--ink-3)'}}>{t('mic_stop_hint')}</span>
            </div>
          ):(
            <div style={{marginTop:10,fontSize:12,color:'var(--ink-3)'}}>{t('mic_hint')}</div>
          )}
        </div>
        <div style={{padding:'14px 24px',background:'var(--surface-2)',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <button className="btn btn-ghost btn-sm" onClick={onSkip}>{t('btn_skip_all')}</button>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {step>0&&<button className="btn btn-ghost btn-sm" onClick={()=>setStep(step-1)}><IconArrowRight size={13}/> {t('btn_back')}</button>}
            {!isLast?<button className="btn btn-primary" onClick={()=>setStep(step+1)}>{t('btn_next_question')} <IconArrowLeft size={14}/></button>
              :<button className="btn btn-primary" onClick={()=>onComplete(answers)}>{t('btn_finish_draft')} <IconArrowLeft size={14}/></button>}
          </div>
        </div>
      </div>
    </div>
  );
}

const TRACK_TONE = {
  lesson_plan:{bg:'#e8eef5',fg:'#1e3a5f',activeBg:'#1e3a5f',Icon:IconDoc,label:'מערך שיעור'},
  observation:{bg:'#e3f0e8',fg:'#2f7a4e',activeBg:'#2f7a4e',Icon:IconEye,label:'צפייה בשיעור'},
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
    <div style={{flex:1,padding:'10px 12px',borderRadius:'var(--r-sm)',background:tone.bg+'66',border:`1px solid ${tone.bg}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,color:tone.fg}}>{tone.Icon&&<tone.Icon size={12}/>}<span>{trackLabel}</span></div>
        <span style={{fontSize:11,fontWeight:600,color:tone.fg,background:'#fff',padding:'1px 7px',borderRadius:100,border:`1px solid ${tone.bg}`}}>{lvl.label}</span>
      </div>
      <div style={{fontSize:12.5,color:'var(--ink-2)',marginTop:6,lineHeight:1.55}}>{dim.note}</div>
      {dim.ev&&<button onClick={(e)=>{e.stopPropagation();onEvidenceClick(dim.ev);}} className="tag" style={{marginTop:8,cursor:'pointer',background:activeEvidence===dim.ev?tone.activeBg:'#fff',color:activeEvidence===dim.ev?'#fff':tone.fg,border:`1px solid ${tone.bg}`}}>{EVIDENCES[dim.ev]?.label} ›</button>}
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

function CategoryCard({ cat, index, aiTone, instructorAnswers, activeEvidence, onEvidenceClick, editing, onEdit, onRefine, refining, isActive, onSelect }) {
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
  const score = summary?.score || '—';
  
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

function DraftHeader({ student, answersCount }) {
  const { t } = useLanguage();
  const legendItems = [
    {Ic:IconDoc, label:t('track_lesson_plan'), fg:'#1e3a5f', bg:'#e8eef5'},
    {Ic:IconEye, label:t('track_observation_label'), fg:'#2f7a4e', bg:'#e3f0e8'},
    {Ic:IconSparkle, label:t('gap_decided'), fg:'#b08552', bg:'#f4ecdf'},
  ];
  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:6,display:'flex',alignItems:'center',gap:8}}><IconSparkle size={12} stroke="var(--brand)"/>{t('rubric_info')}</div>
      <h1 style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600,margin:0,letterSpacing:'-0.01em'}}>{t('eval_draft_title_prefix')} {student.name}</h1>
      <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
        {legendItems.map(c=><span key={c.label} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:100,background:c.bg,color:c.fg,fontSize:11.5,fontWeight:500}}><c.Ic size={12}/>{c.label}</span>)}
        {answersCount>0&&<span style={{fontSize:12,color:'var(--ink-3)',alignSelf:'center',marginInlineStart:4}}>{t('instructor_insights_integrated', { n: answersCount })}</span>}
      </div>
    </div>
  );
}

function SplitEditor({ student, instructorAnswers, aiTone, onBack, onExport, evalCategories, evalSummary, evaluationId, onSave, evidenceFiles }) {
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
      await onSave({ categories: activeCategories, summary: currentSummary?.text, score: currentSummary?.score });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch { setSaveStatus('idle'); }
  };
  const handleUpdateCategoryText = (catId, newText) => {
    setActiveCategories(prev => prev.map(c => c.id === catId ? {...c, balance: newText} : c));
    setEditing(null);
  };
  const handleUpdateSummary = (newText) => {
    setCurrentSummary(prev => ({...prev, text: newText}));
  };
  const sendChat = (msg) => {
    if(!msg.trim())return;
    setChatMessages(prev=>[...prev,{role:'user',text:msg}]); setChatInput(''); setChatThinking(true);
    setTimeout(()=>{
      const responses={
        default:'על-בסיס הראיות שהועלו, נראה שמ. מגלה רגישות גבוהה לתלמידים מתקשים. בתיעוד ההתמודדות עם ל. היא בחרה בגישה חמלתית במקום עונשית.',
        משמעת:'בנושא משמעת — ב-3 מתוך 5 הרפלקציות מ. מציינת רגעי הפרת משמעת. הגישה שלה: שיחה אישית במקום ענישה כיתתית.',
        תלמידים:'מ. מפגינה רגישות גבוהה לתלמידים מתקשים. בתיעוד ההתמודדות עם ל. בחרה בגישה חמלתית.',
        תכנון:'התכנון מערכי השיעור הוא תחום צמיחה. ראיה 2 מציגה תכנון בסיסי בלבד. ראיה 1 מראה שהביצוע בפועל עולה על התכנון.',
        חיובי:'עדכנתי את הניסוחים שיהיו חיוביים ומעודדים יותר כבקשתך.',
        קצר:'קיצרתי את הטקסטים והשארתי רק את העיקר.'
      };
      
      let resp=responses.default; 
      let isRewrite = false;
      
      for(const k of Object.keys(responses)){
        if(msg.includes(k)){
          resp=responses[k];
          if(k === 'חיובי' || k === 'קצר') isRewrite = true;
          break;
        }
      }
      
      if (isRewrite) {
         // Mock update text
         setActiveCategories(prev => prev.map(c => ({...c, balance: c.balance + (msg.includes('חיובי') ? ' ניכר כי קיימת התקדמות יפה.' : '')})));
         setCurrentSummary(prev => ({...prev, text: prev.text + (msg.includes('חיובי') ? ' הסטודנטית מגלה מוטיבציה גבוהה ללמידה.' : '')}));
      }

      setChatMessages(prev=>[...prev,{role:'ai',text:resp}]); setChatThinking(false);
    },1100);
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
          <button className="btn btn-primary btn-sm" onClick={onExport} style={{borderRadius:100,padding:'6px 16px',background:'var(--brand)'}}>{t('editor_export')} <IconArrowLeft size={14}/></button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'36% 64%',flex:1,minHeight:0}}>
        <div style={{borderInlineStart:'1px solid var(--border)',background:'var(--surface-2)',display:'flex',flexDirection:'column',minHeight:0}}>
          <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',background:'var(--surface)',padding:'0 8px',flexShrink:0,minHeight:44,alignItems:'center'}}>
            {Object.values(liveEvidences).length === 0
              ? <span style={{padding:'0 14px',fontSize:12,color:'var(--ink-4)'}}>{t('no_documents')}</span>
              : Object.values(liveEvidences).map(ev=>{
                  const tc=ev.track==='lesson_plan'?'#1e3a5f':ev.track==='observation'?'#2f7a4e':'var(--brand)';
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
            <DraftHeader student={student} answersCount={instructorAnswers?Object.keys(instructorAnswers).length:0}/>
            {activeCategories.map((cat,idx)=>(
              <CategoryCard key={cat.id} cat={cat} index={idx} aiTone={aiTone} instructorAnswers={instructorAnswers} activeEvidence={activeEvidence} onEvidenceClick={setActiveEvidence} editing={editing===cat.id} onEdit={()=>setEditing(editing===cat.id?null:cat.id)} onEditSave={(newText)=>handleUpdateCategoryText(cat.id, newText)} onRefine={()=>handleRefine(cat.id)} refining={refining===cat.id} isActive={activeCat===cat.id} onSelect={()=>setActiveCat(cat.id)}/>
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