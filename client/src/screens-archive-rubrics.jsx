import { useState, useEffect } from 'react';
import { IconDownload, IconDoc, IconSearch, IconPlus, IconChevron } from './icons';
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
  const scoreColor = (s) => s >= 85 ? 'var(--ok)' : s >= 75 ? 'var(--brand)' : 'var(--warn)';

  return (
    <div className="main-inner fade-in">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'var(--gap-5)'}}>
        <button className="btn btn-secondary btn-lg"><IconDownload size={14}/> ייצוא רשימה</button>
        <div style={{textAlign:'end'}}>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,letterSpacing:'0.02em'}}>ארכיון · {ARCHIVED.length} הערכות שהושלמו</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em',lineHeight:1.1}}>ארכיון הערכות</h1>
          <p style={{fontSize:15,color:'var(--ink-2)',margin:'10px 0 0',maxWidth:540,lineHeight:1.6}}>כל ההערכות שהושלמו ונחתמו, מסודרות לפי סמסטר וסטודנט.</p>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:'var(--gap-4)'}}>
        <div style={{display:'flex',background:'var(--surface)',padding:6,borderRadius:100,boxShadow:'var(--shadow-1)'}}>
          {semesters.map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{padding:'8px 24px',borderRadius:100,fontSize:14,border:filter===s?'1px solid var(--ink-1)':'1px solid transparent',background:filter===s?'var(--surface)':'transparent',color:filter===s?'var(--ink-1)':'var(--ink-3)',fontWeight:filter===s?600:400,cursor:'pointer'}}>
              {s==='all'?'כל הסמסטרים':s}
            </button>
          ))}
        </div>
        <div style={{width:300,position:'relative'}}>
          <IconSearch size={14} stroke="var(--ink-3)" style={{position:'absolute',insetInlineEnd:16,top:'50%',transform:'translateY(-50%)'}}/>
          <input className="input" placeholder="חיפוש לפי שם או בית ספר..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingInlineEnd:40,borderRadius:100,background:'transparent',padding:'12px 16px 12px 40px', borderColor:'var(--border-strong)'}}/>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1.5fr',gap:'var(--gap-4)',marginBottom:'var(--gap-5)'}}>
        <div className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div><div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>הערכה אחרונה</div><div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600,marginTop:4}}>לפני 6 ימים</div></div>
          <div style={{textAlign:'end'}}><div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>רמה גבוהה</div><div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600,color:'var(--brand)'}}>38%</div></div>
        </div>
        <div className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>הערכות סמסטר זה</div>
          <div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600}}>3</div>
        </div>
        <div className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div/>
          <div style={{textAlign:'end'}}><div style={{fontSize:12,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>ממוצע ציונים</div><div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600,color:'var(--brand)'}}>82<span style={{fontSize:16,fontWeight:400,color:'var(--ink-3)'}}>/100</span></div></div>
        </div>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1.2fr 1fr 1fr 0.7fr 1.5fr 80px',padding:'16px 24px',fontSize:12.5,color:'var(--ink-3)',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
          <span>סטודנט</span><span>בית ספר</span><span>מחוון</span><span>סמסטר · תאריך</span><span>ציון</span><span>תיוגים</span><span/>
        </div>
        {filtered.length===0&&<div style={{padding:'40px 20px',textAlign:'center',color:'var(--ink-3)',fontSize:14}}>לא נמצאו הערכות מתאימות</div>}
        {filtered.map((a,i)=>(
          <div key={a.id} style={{display:'grid',gridTemplateColumns:'1.2fr 1.2fr 1fr 1fr 0.7fr 1.5fr 80px',padding:'16px 24px',alignItems:'center',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',fontSize:14,cursor:'pointer',transition:'background .12s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--brand-soft)',color:'var(--brand)',display:'grid',placeItems:'center',fontFamily:'var(--font-serif)',fontSize:13,fontWeight:600}}>{a.name.replace(/\.\s/g,'').slice(0,2)}</div>
              <span style={{color:'var(--ink-1)',fontWeight:600}}>{a.name}</span>
            </div>
            <div style={{color:'var(--ink-2)'}}>{a.school}</div>
            <div style={{color:'var(--ink-2)'}}>{a.rubric}</div>
            <div style={{color:'var(--ink-3)',lineHeight:1.4}}><div>{a.semester}</div><div style={{fontSize:12}}>{a.date}</div></div>
            <div><span style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:600,color:scoreColor(a.score)}}>{a.score}</span><span style={{fontSize:12,color:'var(--ink-3)'}}>/100</span></div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{a.tags.map(t=><span key={t} style={{fontSize:12,padding:'4px 10px',background:'var(--surface-3)',color:'var(--ink-2)',borderRadius:100}}>{t}</span>)}</div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn-ghost" style={{padding:8,borderRadius:'50%',background:'var(--surface-2)',color:'var(--ink-3)'}} title="הורד PDF"><IconDownload size={14}/></button>
              <button className="btn-ghost" style={{padding:8,borderRadius:'50%',background:'var(--surface-2)',color:'var(--ink-3)'}} title="צפה"><IconDoc size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rubrics ──────────────────────────────────────────────────────────────────

export function RubricsScreen() {
  const [rubric, setRubric] = useState(null);
  const [rubricsList, setRubricsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getRubrics()
      .then(data => { 
        if (data?.length) {
          setRubricsList(data);
          setRubric(data[0]); 
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="main-inner fade-in">טוען מחוון...</div>;
  if (!rubric) return <div className="main-inner fade-in" style={{paddingTop:40,textAlign:'center',color:'var(--ink-3)'}}>לא נמצא מחוון</div>;

  return (
    <div className="main-inner fade-in">
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'var(--gap-5)'}}>
        <div style={{textAlign:'end', width:'100%'}}>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:6,letterSpacing:'0.02em'}}>ספריית מחוונים · {rubricsList.length} תבניות פעילות</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,margin:0,color:'var(--ink-1)',letterSpacing:'-0.01em',lineHeight:1.1}}>מחוונים</h1>
          <p style={{fontSize:15,color:'var(--ink-2)',margin:'10px 0 0 0',lineHeight:1.6,float:'left',maxWidth:540,textAlign:'right'}}>תבניות הערכה זמינות בשלב יצירת הטיוטה. ניתן לערוך משקלים, להוסיף קריטריונים או לשכפל מחוון קיים.</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:32,alignItems:'flex-start'}}>
        
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'24px 32px',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
            <span className="badge" style={{marginBottom:12,background:'var(--brand-soft)',color:'var(--brand)', fontSize:13, padding:'4px 12px'}}>{rubric.semester || 'שנתי'}</span>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <h2 style={{fontFamily:'var(--font-serif)',fontSize:26,fontWeight:600,margin:'0 0 8px',letterSpacing:'-0.01em', color:'var(--ink-1)'}}>{rubric.name}</h2>
                <p style={{fontSize:14,color:'var(--ink-2)',margin:0,lineHeight:1.6,maxWidth:540}}>המחוון המרכזי. כל קריטריון מאזן בין איכות מערך השיעור (כחול) לבין ההוראה בפועל בצפייה (אדום). פערים מוכרעים בעזרת המדריך.</p>
              </div>
            </div>
            
            <div style={{display:'flex',gap:32,marginTop:24,fontSize:13.5, borderTop:'1px solid var(--border)', paddingTop:16}}>
              {[
                {label:'סה"כ נקודות', value: rubric.total_points ? `${rubric.total_points} נק׳` : 'משוב מעצב'},
                {label:'בשימוש', value: `24 הערכות`},
                {label:'בעלים', value: `חוג להוראה`},
                {label:'עודכן', value: `לפני שבוע`},
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
              <h3 style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:600,margin:0, color:'var(--ink-1)'}}>קריטריונים</h3>
              <span style={{fontSize:13,color:'var(--ink-3)'}}>סה"כ משקל: {rubric.criteria.reduce((a,b)=>a+(b.weight||0),0)}%</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {rubric.criteria.map((c,i)=>(
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

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <button className="btn btn-secondary btn-lg" style={{width:'100%'}}><IconPlus size={16}/> מחוון חדש</button>
          
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {rubricsList.map((r, i) => (
              <div key={r.id || i} onClick={() => setRubric(r)} className="card card-hover" style={{padding:'20px', border: rubric.id === r.id ? '1px solid var(--ink-1)' : '1px solid transparent', background: rubric.id === r.id ? 'var(--surface-2)' : 'var(--surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div>
                  <div style={{fontFamily:'var(--font-serif)',fontSize:16,fontWeight:600,color:'var(--ink-1)',marginBottom:4}}>{r.name}</div>
                  <div style={{fontSize:13,color:'var(--ink-3)'}}>{r.criteria?.length || 0} קריטריונים · {r.semester || 'שנתי'}</div>
                  <div style={{fontSize:11.5,color:'var(--ink-4)',marginTop:8}}>בשימוש: <span style={{color:'var(--ink-2)',fontWeight:500}}>18</span> &nbsp;&middot;&nbsp; עודכן לפני שבוע</div>
                </div>
                {rubric.id === r.id && <IconChevron size={16} stroke="var(--ink-1)" style={{transform:'rotate(90deg)'}}/>}
              </div>
            ))}
            
            {/* Fallback extra mock rubrics if DB is empty */}
            {rubricsList.length === 1 && (
              <>
                <div className="card card-hover" style={{padding:'20px', border:'1px solid transparent'}}>
                  <div style={{fontFamily:'var(--font-serif)',fontSize:16,fontWeight:600,color:'var(--ink-1)',marginBottom:4}}>הערכה מעצבת – סמסטר א׳</div>
                  <div style={{fontSize:13,color:'var(--ink-3)'}}>4 קריטריונים · אמצע סמסטר א׳</div>
                  <div style={{fontSize:11.5,color:'var(--ink-4)',marginTop:8}}>בשימוש: <span style={{color:'var(--ink-2)',fontWeight:500}}>18</span> &nbsp;&middot;&nbsp; עודכן לפני 6 שבועות</div>
                </div>
                <div className="card card-hover" style={{padding:'20px', border:'1px solid transparent'}}>
                  <div style={{fontFamily:'var(--font-serif)',fontSize:16,fontWeight:600,color:'var(--ink-1)',marginBottom:4}}>מחוון הסדנה – התנסות מעשית</div>
                  <div style={{fontSize:13,color:'var(--ink-3)'}}>5 קריטריונים · שוטף</div>
                  <div style={{fontSize:11.5,color:'var(--ink-4)',marginTop:8}}>בשימוש: <span style={{color:'var(--ink-2)',fontWeight:500}}>32</span> &nbsp;&middot;&nbsp; עודכן אתמול</div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
