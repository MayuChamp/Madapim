import { useState, useEffect } from 'react';
import { IconPlus, IconChevron, IconPencil, IconClose, IconCheck, IconDownload, IconDoc, IconSearch } from './icons';
import * as API from './api';

const ARCHIVED = [
  {id:'a1',name:'מ. לוי',school:'יסודי מאמן',semester:'סמסטר א׳',date:'15.02.26',score:84,level:'בינונית-גבוהה',rubric:'הערכה מעצבת',evaluator:'ענת ב.',tags:['רפלקציה חזקה','תכנון לעיבוי']},
  {id:'a2',name:'נ. כהן',school:'ניסויי יסוד',semester:'סמסטר א׳',date:'12.02.26',score:91,level:'גבוהה',rubric:'הערכה מעצבת',evaluator:'ענת ב.',tags:['מצוינות','הובלה']},
  {id:'a3',name:'ת. אבני',school:'דמוקרטי האלה',semester:'סמסטר א׳',date:'09.02.26',score:78,level:'בינונית',rubric:'הערכה מעצבת',evaluator:'ענת ב.',tags:['שיתוף פעולה']},
  {id:'a4',name:'מ. לוי',school:'יסודי מאמן',semester:'שנה א׳ — סוף',date:'28.06.25',score:81,level:'בינונית-גבוהה',rubric:'הערכת סוף שנה',evaluator:'ענת ב.',tags:['התפתחות חיובית']},
  {id:'a5',name:'נ. כהן',school:'ניסויי יסוד',semester:'שנה א׳ — סוף',date:'26.06.25',score:88,level:'בינונית-גבוהה',rubric:'הערכת סוף שנה',evaluator:'ענת ב.',tags:['ידע תוכני']},
  {id:'a6',name:'ש. בן-דוד',school:'ממ"ד שדות',semester:'שנה א׳ — סוף',date:'22.06.25',score:73,level:'בינונית',rubric:'הערכת סוף שנה',evaluator:'ענת ב.',tags:['ניהול כיתה']},
  {id:'a7',name:'ר. פרץ',school:'יסודי הרצוג',semester:'שנה א׳ — סוף',date:'20.06.25',score:85,level:'בינונית-גבוהה',rubric:'הערכת סוף שנה',evaluator:'ענת ב.',tags:['רפלקציה']},
  {id:'a8',name:'ת. אבני',school:'דמוקרטי האלה',semester:'שנה א׳ — סוף',date:'18.06.25',score:76,level:'בינונית',rubric:'הערכת סוף שנה',evaluator:'ענת ב.',tags:['תכנון']},
];

export function ArchiveScreen() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const semesters = ['all', ...new Set(ARCHIVED.map(a => a.semester))];
  const filtered = ARCHIVED.filter(a => {
    if (filter !== 'all' && a.semester !== filter) return false;
    if (search && !a.name.includes(search) && !a.school.includes(search)) return false;
    return true;
  });
  const scoreColor = (s) => s >= 85 ? 'var(--ok)' : s >= 75 ? 'var(--info)' : 'var(--warn)';

  return (
    <div className="main-inner fade-in">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'var(--gap-5)'}}>
        <div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,letterSpacing:'0.02em'}}>ארכיון · {ARCHIVED.length} הערכות שהושלמו</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em',lineHeight:1.1}}>ארכיון הערכות</h1>
          <p style={{fontSize:15,color:'var(--ink-2)',margin:'10px 0 0',maxWidth:540,lineHeight:1.6}}>כל ההערכות שהושלמו ונחתמו, מסודרות לפי סמסטר וסטודנט.</p>
        </div>
        <button className="btn btn-secondary"><IconDownload size={14}/> ייצוא רשימה</button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'var(--gap-4)',padding:'12px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-md)'}}>
        <div style={{flex:1,position:'relative'}}>
          <IconSearch size={14} stroke="var(--ink-3)" style={{position:'absolute',insetInlineStart:12,top:'50%',transform:'translateY(-50%)'}}/>
          <input className="input" placeholder="חיפוש לפי שם או בית ספר..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingInlineStart:34,border:'none',background:'transparent',padding:'6px 10px 6px 34px'}}/>
        </div>
        <div style={{width:1,height:22,background:'var(--border)'}}/>
        <div style={{display:'flex',gap:4}}>
          {semesters.map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{padding:'5px 12px',borderRadius:100,fontSize:12.5,border:`1px solid ${filter===s?'var(--brand)':'transparent'}`,background:filter===s?'var(--brand-softer)':'transparent',color:filter===s?'var(--brand)':'var(--ink-2)',fontWeight:filter===s?500:400,cursor:'pointer'}}>
              {s==='all'?'כל הסמסטרים':s}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'var(--gap-3)',marginBottom:'var(--gap-4)'}}>
        {[{label:'ממוצע ציונים',value:'82',unit:'/100'},{label:'הערכות סמסטר זה',value:ARCHIVED.filter(a=>a.semester==='סמסטר א׳').length},{label:'רמה גבוהה',value:`${Math.round(100*ARCHIVED.filter(a=>a.score>=85).length/ARCHIVED.length)}%`},{label:'הערכה אחרונה',value:'לפני 6 ימים',small:true}].map((t,i)=>(
          <div key={i} className="card" style={{padding:'12px 16px'}}>
            <div style={{fontSize:11.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{t.label}</div>
            <div style={{fontFamily:'var(--font-serif)',fontSize:t.small?16:24,fontWeight:600,color:'var(--ink-1)',lineHeight:1.1}}>{t.value}{t.unit&&<span style={{fontSize:13,color:'var(--ink-3)',fontWeight:400}}>{t.unit}</span>}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1.2fr 1fr 1fr 0.7fr 1fr 60px',padding:'12px 18px',fontSize:11.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
          <span>סטודנט</span><span>בית ספר</span><span>מחוון</span><span>סמסטר · תאריך</span><span>ציון</span><span>תיוגים</span><span/>
        </div>
        {filtered.length===0&&<div style={{padding:'40px 20px',textAlign:'center',color:'var(--ink-3)',fontSize:14}}>לא נמצאו הערכות מתאימות</div>}
        {filtered.map((a,i)=>(
          <div key={a.id} style={{display:'grid',gridTemplateColumns:'1.2fr 1.2fr 1fr 1fr 0.7fr 1fr 60px',padding:'14px 18px',alignItems:'center',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',fontSize:13.5,cursor:'pointer',transition:'background .12s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:28,height:28,borderRadius:6,background:'var(--brand-soft)',color:'var(--brand)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:12,fontWeight:600}}>{a.name.replace(/\.\s/g,'').slice(0,2)}</div>
              <span style={{color:'var(--ink-1)',fontWeight:500}}>{a.name}</span>
            </div>
            <div style={{color:'var(--ink-2)'}}>{a.school}</div>
            <div style={{color:'var(--ink-2)',fontSize:12.5}}>{a.rubric}</div>
            <div style={{color:'var(--ink-3)',fontSize:12.5,lineHeight:1.4}}><div>{a.semester}</div><div style={{fontSize:11.5}}>{a.date}</div></div>
            <div><span style={{fontFamily:'var(--font-serif)',fontSize:17,fontWeight:600,color:scoreColor(a.score)}}>{a.score}</span><span style={{fontSize:11,color:'var(--ink-3)'}}>/100</span></div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{a.tags.map(t=><span key={t} style={{fontSize:11,padding:'2px 7px',background:'var(--surface-2)',color:'var(--ink-2)',borderRadius:3}}>{t}</span>)}</div>
            <div style={{display:'flex',justifyContent:'flex-start',gap:4}}>
              <button className="btn-ghost" style={{padding:6,borderRadius:4,color:'var(--ink-3)'}} title="צפה"><IconDoc size={14}/></button>
              <button className="btn-ghost" style={{padding:6,borderRadius:4,color:'var(--ink-3)'}} title="הורד PDF"><IconDownload size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rubrics ──────────────────────────────────────────────────────────────────

const EMPTY_RUBRIC = { name: '', description: '', semester: '', total_points: 100, criteria: [] };

export function RubricsScreen() {
  const [rubrics, setRubrics] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(EMPTY_RUBRIC);
  const [criteriaText, setCriteriaText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchRubrics(); }, []);

  const fetchRubrics = async () => {
    setLoading(true);
    try {
      const data = await API.getRubrics();
      setRubrics(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (e) {
      console.error('rubrics fetch:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_RUBRIC);
    setCriteriaText('[{"name":"קריטריון 1","weight":50,"desc":"תיאור"},{"name":"קריטריון 2","weight":50,"desc":"תיאור"}]');
    setError('');
    setEditMode(false);
    setShowAddModal(true);
  };

  const openEdit = (r) => {
    setForm({ name: r.name, description: r.description || '', semester: r.semester || '', total_points: r.total_points ?? 100, criteria: r.criteria });
    setCriteriaText(JSON.stringify(r.criteria, null, 2));
    setError('');
    setEditMode(true);
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    let criteria;
    try { criteria = JSON.parse(criteriaText); }
    catch { setError('פורמט הקריטריונים (JSON) לא תקין'); return; }

    if (!Array.isArray(criteria)) { setError('הקריטריונים חייבים להיות מערך JSON'); return; }
    const weightSum = criteria.reduce((a, c) => a + (Number(c.weight) || 0), 0);
    if (criteria.length > 0 && weightSum !== 100) { setError(`סך המשקלים: ${weightSum}% — חייב להיות 100%`); return; }

    setSaving(true);
    try {
      if (editMode) {
        await API.updateRubric(selectedId, { ...form, criteria });
      } else {
        const created = await API.createRubric({ ...form, criteria });
        setSelectedId(created.id);
      }
      setShowAddModal(false);
      await fetchRubrics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק מחוון זה?')) return;
    await API.deleteRubric(id);
    setSelectedId(null);
    await fetchRubrics();
  };

  if (loading) return <div className="main-inner fade-in">טוען מחוונים...</div>;

  const r = rubrics.find(rb => rb.id === selectedId) || rubrics[0];

  return (
    <div className="main-inner fade-in">
      <div style={{marginBottom:'var(--gap-5)'}}>
        <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6}}>ספריית מחוונים · {rubrics.length} תבניות פעילות</div>
        <h1 style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em',lineHeight:1.1}}>מחוונים</h1>
        <p style={{fontSize:15,color:'var(--ink-2)',margin:'10px 0 0',maxWidth:540,lineHeight:1.6}}>תבניות הערכה זמינות ביצירת הטיוטה. ניתן לערוך, להוסיף קריטריונים, או ליצור מחוון מותאם חדש.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:'var(--gap-4)',alignItems:'flex-start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button className="btn btn-primary btn-sm" style={{alignSelf:'flex-start',marginBottom:4}} onClick={openCreate}>
            <IconPlus size={14}/> מחוון חדש
          </button>
          {rubrics.map(rr => (
            <button key={rr.id} onClick={() => setSelectedId(rr.id)} style={{textAlign:'start',padding:'14px 16px',border:`1px solid ${selectedId===rr.id?'var(--brand)':'var(--border)'}`,background:selectedId===rr.id?'var(--brand-softer)':'var(--surface)',borderRadius:'var(--r-md)',transition:'all .15s',boxShadow:selectedId===rr.id?'0 0 0 3px var(--brand-softer)':'var(--shadow-1)',cursor:'pointer'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'var(--font-serif)',fontSize:15,fontWeight:600,color:'var(--ink-1)',letterSpacing:'-0.005em'}}>{rr.name}</div>
                  <div style={{fontSize:12,color:'var(--ink-3)',marginTop:4}}>{rr.criteria.length} קריטריונים · {rr.semester || 'כללי'}</div>
                </div>
                {selectedId===rr.id&&<IconChevron size={14} stroke="var(--brand)" style={{flexShrink:0,transform:'scaleX(-1)'}}/>}
              </div>
              <div style={{display:'flex',gap:12,marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
                <span>עודכן {new Date(rr.created_at).toLocaleDateString('he-IL')}</span>
              </div>
            </button>
          ))}
        </div>

        {r ? (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'22px 26px 18px',borderBottom:'1px solid var(--border)',background:'var(--brand-softer)'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                <div>
                  <span className="badge" style={{marginBottom:8,background:'var(--brand-soft)',color:'var(--brand)'}}>{r.semester || 'כללי'}</span>
                  <h2 style={{fontFamily:'var(--font-serif)',fontSize:22,fontWeight:600,margin:'4px 0 6px',letterSpacing:'-0.01em'}}>{r.name}</h2>
                  <p style={{fontSize:13.5,color:'var(--ink-2)',margin:0,lineHeight:1.6,maxWidth:540}}>{r.description}</p>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><IconPencil size={13}/> ערוך</button>
                  <button className="btn btn-secondary btn-sm" style={{color:'var(--warn)'}} onClick={() => handleDelete(r.id)}>מחק</button>
                </div>
              </div>
              <div style={{display:'flex',gap:24,marginTop:18,fontSize:12.5}}>
                {[
                  {label:'סה"כ נקודות', value: r.total_points ? `${r.total_points} נק׳` : 'משוב מעצב'},
                  {label:'עודכן', value: new Date(r.created_at).toLocaleDateString('he-IL')},
                ].map(m=>(
                  <div key={m.label}><div style={{fontSize:10.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>{m.label}</div><div style={{fontSize:13,color:'var(--ink-1)',fontWeight:500}}>{m.value}</div></div>
                ))}
              </div>
            </div>
            <div style={{padding:'22px 26px'}}>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={{fontFamily:'var(--font-serif)',fontSize:16,fontWeight:600,margin:0}}>קריטריונים</h3>
                <span style={{fontSize:12,color:'var(--ink-3)'}}>סה"כ משקל: {r.criteria.reduce((a,b)=>a+(b.weight||0),0)}%</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {r.criteria.map((c,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'32px 1fr 56px',alignItems:'center',gap:14,padding:'12px 14px',background:'var(--surface-2)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>
                    <div style={{width:28,height:28,borderRadius:6,background:'var(--surface)',color:'var(--brand)',border:'1px solid var(--border)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:13,fontWeight:600}}>{i+1}</div>
                    <div><div style={{fontSize:14,fontWeight:500,color:'var(--ink-1)'}}>{c.name}</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{c.desc}</div></div>
                    <div style={{textAlign:'start'}}><span style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:600,color:'var(--brand)'}}>{c.weight}</span><span style={{fontSize:11,color:'var(--ink-3)'}}>%</span></div>
                  </div>
                ))}
              </div>
              {r.criteria.length > 0 && (
                <div style={{marginTop:22}}>
                  <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>התפלגות משקלים</div>
                  <div style={{display:'flex',height:12,borderRadius:100,overflow:'hidden',background:'var(--surface-2)'}}>
                    {r.criteria.map((c,i)=><div key={i} style={{width:`${c.weight}%`,background:['#1e3a5f','#2c5282','#3b6fa5','#5b8fc4','#8aaed4','#b8cce5'][i%6]}} title={`${c.name}: ${c.weight}%`}/>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{display:'grid',placeItems:'center',padding:40}}>אין מחוונים בספרייה. צור מחוון חדש.</div>
        )}
      </div>

      {showAddModal && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="card fade-in" style={{width:540,padding:24,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,margin:0}}>{editMode ? 'עריכת מחוון' : 'מחוון חדש'}</h2>
              <button className="btn-ghost" onClick={()=>setShowAddModal(false)}><IconClose size={16}/></button>
            </div>

            {error && <div style={{background:'var(--warn-soft)',color:'var(--warn)',padding:'10px 14px',borderRadius:'var(--r-sm)',fontSize:13,marginBottom:16}}>{error}</div>}

            <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">שם המחוון *</label>
                <input className="input" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="לדוגמה: הערכה סופית סמסטר ב׳"/>
              </div>
              <div>
                <label className="label">תיאור</label>
                <input className="input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="תיאור קצר למחוון"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label className="label">סמסטר / ייעוד</label>
                  <input className="input" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})} placeholder="לדוגמה: סוף שנה"/>
                </div>
                <div>
                  <label className="label">סך נקודות (ריק = משוב מעצב)</label>
                  <input className="input" type="number" value={form.total_points ?? ''} onChange={e=>setForm({...form,total_points:e.target.value?Number(e.target.value):null})} placeholder="100"/>
                </div>
              </div>
              <div>
                <label className="label">קריטריונים (JSON) — סך משקלים חייב להיות 100%</label>
                <textarea className="input" required value={criteriaText} onChange={e=>setCriteriaText(e.target.value)}
                  rows={8} dir="ltr" style={{fontFamily:'var(--font-mono)',fontSize:12}}/>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>מבנה: <code>[{`{"name":"שם","weight":20,"desc":"תיאור"}`}, ...]</code></div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowAddModal(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <IconCheck size={14}/> {saving ? 'שומר...' : 'שמור מחוון'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
