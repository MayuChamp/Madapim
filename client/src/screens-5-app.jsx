import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from './i18n';
import * as Icons from './icons';
import { Icon, IconHome, IconUsers, IconArchive, IconSettings, IconFolder, IconFile, IconUpload, IconPlus, IconArrowLeft, IconArrowRight, IconChevron, IconPencil, IconMagic, IconMic, IconSearch, IconClose, IconCheck, IconDownload, IconSave, IconSend, IconSparkle, IconBookmark, IconDoc, IconWave, IconGrid, IconList, IconClock, IconArchiveBox, IconAlert, IconGraduationCap } from './icons';
import { EVAL_CATEGORIES } from './data';



function ChecklistItem({ ok, label }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',fontSize:13,color:'var(--ink-2)'}}>
      <div style={{width:16,height:16,borderRadius:'50%',background:'var(--ok-soft)',color:'var(--ok)',display:'grid',placeItems:'center',flexShrink:0}}><IconCheck size={11} strokeWidth={2.5}/></div>
      {label}
    </div>
  );
}

function FormatOption({ value, current, onSelect, label, desc }) {
  const active = value===current;
  return (
    <button onClick={()=>onSelect(value)} style={{textAlign:'start',padding:'12px 14px',border:`1px solid ${active?'var(--brand)':'var(--border)'}`,background:active?'var(--surface-2)':'var(--surface)',borderRadius:12,display:'flex',alignItems:'center',gap:12,transition:'all .15s',width:'100%',cursor:'pointer',boxShadow:active?'0 0 0 1px var(--brand)':'none'}}>
      <div style={{width:16,height:16,borderRadius:'50%',border:`1.5px solid ${active?'var(--brand)':'var(--border-strong)'}`,flexShrink:0,display:'grid',placeItems:'center'}}>{active&&<span style={{width:8,height:8,borderRadius:'50%',background:'var(--brand)'}}/>}</div>
      <div><div style={{fontSize:14,color:'var(--ink-1)',fontWeight:600}}>{label}</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{desc}</div></div>
    </button>
  );
}

function CheckRow({ label, defaultChecked }) {
  const [checked, setChecked] = useState(!!defaultChecked);
  return (
    <label style={{display:'flex',alignItems:'center',gap:10,padding:'5px 0',fontSize:13,color:'var(--ink-2)',cursor:'pointer'}}>
      <span onClick={(e)=>{e.preventDefault();setChecked(!checked);}} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${checked?'var(--brand)':'var(--border-strong)'}`,background:checked?'var(--brand)':'transparent',display:'grid',placeItems:'center',flexShrink:0}}>
        {checked&&<IconCheck size={10} stroke="#fff" strokeWidth={3}/>}
      </span>
      {label}
    </label>
  );
}

function DocField({ label, value }) {
  return <div><span style={{color:'#7a8295',fontSize:11}}>{label}: </span><span style={{color:'#1a1f2c',fontWeight:500}}>{value}</span></div>;
}

function A4Doc({ student, instructorAnswers, evaluationDraft }) {
  const { t, lang } = useLanguage();
  const answers = instructorAnswers||{};
  // Use real AI draft categories if available
  const cats = evaluationDraft?.categories || null;
  const resolveText = (cat) => {
    let txt=cat.balance||''; let instr='';
    if(cat.usesInstructorInput){const a=answers[cat.usesInstructorInput];instr=typeof a==='string'?a:(a&&a.note)||'';}
    let dec='';
    if(cat.gap&&cat.gap.decisionKey){const a=answers[cat.gap.decisionKey];dec=a&&a.label?`לאחר התייעצות החלטת ${a.label}${a.note?` — ${a.note}`:''}. `:(cat.gap.resolution||'');}
    else if(cat.gap&&cat.gap.resolution){dec=cat.gap.resolution;}
    return txt.replace(/\{\{e(\d+)\}\}/g,(_,n)=>`[${t('doc_evidence_ref')} ${n}]`).replace('{{instructor_input}}',instr||`[${t('doc_instructor_awaiting')}]`).replace('{{decision}}',dec||'');
  };
  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'he-IL');
  const lvlLabel = (l) => ({
    high: t('level_high'),
    mid_high: t('level_mid_high'),
    mid: t('level_mid'),
    low_mid: t('level_low_mid'),
  }[l] || l || '—');
  return (
    <div style={{width:794,minHeight:1123,margin:'0 auto',background:'#fff',color:'#1a1f2c',padding:'64px 72px',boxShadow:'0 4px 32px rgba(0,0,0,0.12)',fontFamily:'var(--font-sans)',direction:'rtl'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',paddingBottom:18,borderBottom:'2px solid #1e3a5f'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:42,height:42,background:'#1e3a5f',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:22,fontWeight:700,borderRadius:4}}>ה</div>
          <div><div style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:600,lineHeight:1.1,color:'#1a1f2c'}}>{t('doc_institution')}</div><div style={{fontSize:11.5,color:'#7a8295',marginTop:2,letterSpacing:'0.02em'}}>{t('doc_institution_sub')}</div></div>
        </div>
        <div style={{textAlign:'start',fontSize:11,color:'#7a8295',lineHeight:1.6}}>{t('doc_date_label')}: {today}<br/>{t('doc_ref_no')}: HE-2026-1142<br/>{t('doc_form_no')}: 14-ב/הת"מ</div>
      </div>
      <div style={{marginTop:28}}>
        <div style={{fontSize:11.5,color:'#7a8295',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{t('doc_eval_type')}</div>
        <h1 style={{fontFamily:'var(--font-serif)',fontSize:26,fontWeight:600,margin:0,letterSpacing:'-0.01em',color:'#1a1f2c'}}>{t('doc_eval_student')}: {student.name}</h1>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:12,fontSize:12.5,padding:'12px 14px',background:'#fbfaf7',borderRadius:4}}>
          <DocField label={t('doc_field_school')} value={student.school}/><DocField label={t('doc_field_grade')} value={student.grade}/>
          <DocField label={t('doc_field_supervisor')} value="ד״ר ר. כהן"/><DocField label={t('doc_field_cooperating')} value="גב׳ א. ש."/>
          <DocField label={t('doc_field_rubric')} value={t('doc_rubric_value')}/><DocField label={t('doc_field_eval_date')} value={today}/>
        </div>
      </div>
      <div style={{marginTop:28}}>
        {(cats || EVAL_CATEGORIES).map((cat,idx)=>{
          // Support both AI draft format and mock EVAL_CATEGORIES format
          const isAiCat = !!cats;
          const text = isAiCat ? (cat.balance||'') : resolveText(cat);
          const overallKey = cat.overallLevel || 'mid_high';
          const lpLevel = isAiCat ? cat.lessonPlanLevel : cat.lessonPlan?.level;
          const obLevel = isAiCat ? cat.observationLevel : cat.observation?.level;
          return (
            <div key={cat.id||idx} style={{marginBottom:22}}>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                  <span style={{fontFamily:'var(--font-serif)',fontSize:13,color:'#7a8295'}}>{idx+1}.</span>
                  <h3 style={{fontFamily:'var(--font-serif)',fontSize:15,fontWeight:600,margin:0}}>{cat.name}</h3>
                </div>
                <div style={{fontSize:11.5,color:'#1e3a5f',fontWeight:500}}>{lvlLabel(overallKey)} · {cat.weight}%</div>
              </div>
              {(lpLevel||obLevel)&&<div style={{display:'flex',gap:16,marginBottom:6,fontSize:11,color:'#7a8295'}}>{lpLevel&&<span>📘 מערך: {lvlLabel(lpLevel)}</span>}{obLevel&&<span>🎯 צפייה: {lvlLabel(obLevel)}</span>}</div>}
              <p style={{fontSize:12.5,lineHeight:1.75,margin:0,color:'#1a1f2c',textAlign:'justify'}}>{text}</p>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:14,padding:'16px 18px',background:'#f3f6fa',borderInlineStart:'3px solid #1e3a5f',borderRadius:4}}>
        <h3 style={{fontFamily:'var(--font-serif)',fontSize:15,fontWeight:600,margin:'0 0 8px'}}>{t('doc_summary_title')}</h3>
        <p style={{fontSize:12.5,lineHeight:1.75,margin:0,color:'#1a1f2c',textAlign:'justify'}}>{evaluationDraft?.summary || `${student.name} נמצאת בנקודה טובה בשלב ההכשרה.`}</p>
        <div style={{marginTop:14,display:'flex',alignItems:'center',gap:18}}>
          <div><div style={{fontSize:10.5,color:'#7a8295',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('doc_total_score')}</div><div style={{fontFamily:'var(--font-serif)',fontSize:32,fontWeight:600,color:'#1e3a5f',lineHeight:1,marginTop:2}}>{evaluationDraft?.score||'—'} <span style={{fontSize:14,color:'#7a8295',fontWeight:400}}>/ 100</span></div></div>
          <div style={{width:1,height:40,background:'#cfc7b3'}}/>
          <div><div style={{fontSize:10.5,color:'#7a8295',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t('doc_overall_assessment')}</div><div style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:600,color:'#1a1f2c',marginTop:4}}>{lvlLabel(evaluationDraft?.overallLevel) || t('level_mid_high')}</div></div>
        </div>
      </div>
      <div style={{marginTop:40,paddingTop:18,borderTop:'1px solid #e3ddd0',display:'grid',gridTemplateColumns:'1fr 1fr',gap:28,fontSize:11.5,color:'#1a1f2c'}}>
        <div><div style={{borderBottom:'1px solid #1a1f2c',height:30}}/><div style={{marginTop:6,color:'#7a8295'}}>{t('doc_supervisor_sig')}</div></div>
        <div><div style={{borderBottom:'1px solid #1a1f2c',height:30}}/><div style={{marginTop:6,color:'#7a8295'}}>{t('doc_dept_head_sig')}</div></div>
      </div>
      <div style={{marginTop:32,paddingTop:14,borderTop:'1px solid #ebe8e0',fontSize:10,color:'#9aa0ad',textAlign:'center',letterSpacing:'0.02em'}}>{t('doc_footer')}</div>
    </div>
  );
}

function ExportScreen({ student, onBack, onFinish, instructorAnswers, evaluationDraft }) {
  const { t } = useLanguage();
  const [format, setFormat] = useState('pdf');
  return (
    <div className="fade-in" style={{display:'flex',height:'100vh',minHeight:0}}>
      <aside style={{width:340,flexShrink:0,background:'var(--surface)',borderInlineEnd:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'32px 28px',overflowY:'auto'}}>
        <button onClick={onBack} className="btn-ghost" style={{display:'flex',alignItems:'center',gap:6,color:'var(--ink-3)',fontSize:14,marginBottom:28,alignSelf:'flex-start'}}><IconArrowRight size={14}/> {t('back_to_edit')}</button>
        <h2 style={{fontFamily:'var(--font-serif)',fontSize:24,fontWeight:600,margin:'0 0 6px',letterSpacing:'-0.01em'}}>{t('export_screen_title')}</h2>
        <p style={{fontSize:14,color:'var(--ink-3)',margin:'0 0 32px'}}>{student.name} · {t('eval_end_year_subtitle')}</p>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10,fontWeight:600}}>{t('final_check')}</div>
          <ChecklistItem ok label={t('check_1')}/>
          <ChecklistItem ok label={t('check_2')}/>
          <ChecklistItem ok label={t('check_3')}/>
          <ChecklistItem ok label={t('check_4')}/>
        </div>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10,fontWeight:600}}>{t('export_format')}</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <FormatOption value="pdf" current={format} onSelect={setFormat} label="PDF" desc={t('format_pdf_desc')}/>
            <FormatOption value="docx" current={format} onSelect={setFormat} label="Word" desc={t('format_word_desc')}/>
            <FormatOption value="link" current={format} onSelect={setFormat} label={t('format_link_label')} desc={t('format_link_desc')}/>
          </div>
        </div>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10,fontWeight:600}}>{t('export_options_label')}</div>
          <CheckRow defaultChecked label={t('opt_digital_sig')}/>
          <CheckRow defaultChecked label={t('opt_evidence_refs')}/>
          <CheckRow label={t('opt_numerical_score')}/>
          <CheckRow label={t('opt_cover_page')}/>
        </div>
        <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:10,paddingTop:24}}>
          <button className="btn btn-primary btn-lg" onClick={() => onFinish(format)} style={{borderRadius:100}}><IconDownload size={15}/> {format === 'pdf' ? t('btn_export_pdf') : format === 'docx' ? t('btn_export_word') : t('btn_export_link')}</button>
          <button className="btn btn-secondary btn-lg" style={{borderRadius:100}}><IconSave size={14}/> {t('btn_save_finish')}</button>
        </div>
      </aside>
      <div className="scroll" style={{flex:1,overflowY:'auto',background:'#e7e3da',padding:'32px 0'}}>
        <A4Doc student={student} instructorAnswers={instructorAnswers} evaluationDraft={evaluationDraft}/>
      </div>
    </div>
  );
}

function AnalyzingScreen() {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const STEPS = [
    { from:  0, label: t('step_reading') },
    { from: 20, label: t('step_patterns') },
    { from: 42, label: t('step_mapping') },
    { from: 62, label: t('step_insights') },
    { from: 80, label: t('step_draft') },
  ];
  // Phase 1: fast burst to ~30% (3s), then slow steady 1%/s so it's always visibly moving
  useEffect(() => {
    const i = setInterval(() => {
      setProgress(p => p < 30 ? p + 1 : Math.min(p + 0.1, 89));
    }, 100);
    return () => clearInterval(i);
  }, []);
  const label = [...STEPS].reverse().find(s => progress >= s.from)?.label ?? STEPS[0].label;
  const pct = Math.round(progress);
  return (
    <div className="fade-in" style={{position:'fixed',inset:0,zIndex:50,background:'var(--bg)',display:'grid',placeItems:'center'}}>
      <div style={{width:420,maxWidth:'calc(100vw - 32px)',textAlign:'center'}}>
        <div style={{width:64,height:64,margin:'0 auto 20px',borderRadius:16,background:'var(--brand)',color:'#fff',display:'grid',placeItems:'center',boxShadow:'0 8px 32px rgba(30,58,95,.3)'}}><IconSparkle size={28} style={{animation:'pulse 1.5s infinite'}}/></div>
        <h2 style={{fontFamily:'var(--font-serif)',fontSize:22,fontWeight:600,margin:'0 0 8px'}}>{t('analyzing_title')}</h2>
        <p style={{fontSize:14,color:'var(--ink-2)',margin:'0 0 24px'}}>{label}</p>
        <div style={{height:4,background:'var(--surface-3)',borderRadius:100,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,var(--brand),var(--brand-3))',transition:'width .4s ease-out',borderRadius:100}}/></div>
        <div style={{marginTop:8,fontSize:12,color:'var(--ink-3)'}}>{pct}%</div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,4000); return()=>clearTimeout(t); },[onClose]);
  return (
    <div style={{position:'fixed',bottom:24,insetInlineEnd:24,zIndex:200,background:'var(--ink-1)',color:'#fff',padding:'12px 18px',borderRadius:'var(--r-md)',display:'flex',alignItems:'center',gap:10,fontSize:13.5,boxShadow:'var(--shadow-3)',animation:'fadeIn .3s',maxWidth:360}}>
      <IconCheck size={16} stroke="var(--ok)" strokeWidth={2.5}/><span>{message}</span>
      <button onClick={onClose} className="btn-ghost" style={{color:'rgba(255,255,255,.5)',padding:4}}><IconClose size={14}/></button>
    </div>
  );
}

export {  ExportScreen, AnalyzingScreen, Toast  };