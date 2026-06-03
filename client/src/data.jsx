import React, { useState, useEffect, useCallback, useRef } from 'react';

const STUDENTS = [
  { id:'s1',name:'מ. לוי',fullName:'מ. לוי',school:'בית ספר יסודי מאמן · מתמטי',grade:'כיתה ד׳',docs:15,status:'pending',lastUpdate:'לפני 2 ימים',initials:'מל',subjectTrack:'מתמטיקה',lessonProgress:{complete:2,total:4},observationProgress:{complete:3,total:3}},
  { id:'s2',name:'נ. כהן',fullName:'נ. כהן',school:'בית ספר ניסויי · יסוד',grade:'כיתה ב׳',docs:22,status:'ready',lastUpdate:'אתמול',initials:'נכ',subjectTrack:'אנגלית',lessonProgress:{complete:4,total:4},observationProgress:{complete:3,total:3}},
  { id:'s3',name:'ש. בן-דוד',fullName:'ש. בן-דוד',school:'בית ספר ממ"ד שדות',grade:'כיתה ה׳',docs:9,status:'pending',lastUpdate:'לפני 5 ימים',initials:'שב',subjectTrack:'מדעים',lessonProgress:{complete:1,total:4},observationProgress:{complete:2,total:3}},
  { id:'s4',name:'ת. אבני',fullName:'ת. אבני',school:'בית ספר דמוקרטי האלה',grade:'כיתה ג׳',docs:18,status:'in_progress',lastUpdate:'היום',initials:'תא',subjectTrack:'חינוך מיוחד',lessonProgress:{complete:3,total:4},observationProgress:{complete:3,total:3}},
  { id:'s5',name:'א. שמיר',fullName:'א. שמיר',school:'בית ספר מאמן · רב-תרבותי',grade:'כיתה ד׳',docs:0,status:'not_started',lastUpdate:'—',initials:'אש',subjectTrack:'רב-תחומי',lessonProgress:{complete:0,total:4},observationProgress:{complete:0,total:3}},
  { id:'s6',name:'ר. פרץ',fullName:'ר. פרץ',school:'בית ספר יסודי הרצוג',grade:'כיתה ו׳',docs:12,status:'pending',lastUpdate:'לפני 3 ימים',initials:'רפ',subjectTrack:'לשון ומקרא',lessonProgress:{complete:2,total:4},observationProgress:{complete:2,total:3}},
];
const STATUS_META = {
  pending:{label:'ממתין להתייחסותך',cls:'badge-warn'},
  ready:{label:'מוכן לייצוא',cls:'badge-ok'},
  in_progress:{label:'בעבודה',cls:'badge-info'},
  not_started:{label:'טרם הותחל',cls:'badge-neutral'},
};
const LESSON_PLAN_CYCLES = [
  {id:'lp1',topic:'חלוקה ארוכה — שיעור פתיחה',subject:'מתמטיקה',status:'complete',stages:{submission:{date:'04.11',done:true,file:'מערך_חלוקה_v1.docx'},instructorNotes:{date:'07.11',done:true,file:'הערות_חלוקה.docx',summary:'להעמיק שלבי האלגוריתם, להוסיף דוגמה הפוכה'},revision:{date:'14.11',done:true,file:'מערך_חלוקה_v2.docx'}}},
  {id:'lp2',topic:'הרצל וחזון מדינת היהודים',subject:'מולדת',status:'complete',stages:{submission:{date:'20.11',done:true,file:'מערך_הרצל_v1.docx'},instructorNotes:{date:'23.11',done:true,file:'הערות_הרצל.docx',summary:'מצוין — להוסיף שאלת פתיחה אקטיבית'},revision:{date:'27.11',done:true,file:'מערך_הרצל_v2.docx'}}},
  {id:'lp3',topic:'שירת מולדת — אנליזה',subject:'ספרות',status:'awaiting_revision',stages:{submission:{date:'10.12',done:true,file:'מערך_שירת_מולדת_v1.docx'},instructorNotes:{date:'14.12',done:true,file:'הערות_שירה.docx',summary:'לחזק את הקישור לטקסט המקור'},revision:{date:null,done:false,daysWaiting:9}}},
  {id:'lp4',topic:'מבנה הסיפור — היכרות',subject:'ספרות',status:'in_review',stages:{submission:{date:'08.01',done:true,file:'מערך_מבנה_סיפור_v1.docx'},instructorNotes:{date:null,done:false,daysWaiting:3},revision:{date:null,done:false}}},
];
const OBSERVATION_CYCLES = [
  {id:'ob1',topic:'תצפית 1 — שיעור פתיחת שנה',date:'12.10',status:'complete',stages:{observation:{date:'12.10',done:true,file:'תצפית_1_שדה.pdf',summary:'התרשמות ראשונית: לומדת מהר, ראוי לעקוב אחר תכנון'},feedback:{date:'14.10',done:true,file:'משוב_תצפית_1.docx'},reflection:{date:'18.10',done:true,file:'רפלקציה_תצפית_1.docx'}}},
  {id:'ob2',topic:'תצפית 2 — מתמטיקה כיתה ד׳',date:'04.11',status:'complete',stages:{observation:{date:'04.11',done:true,file:'תצפית_2_שדה.pdf',summary:'ניהול כיתה רגוע, יש לחזק העברה בין שלבים'},feedback:{date:'07.11',done:true,file:'משוב_תצפית_2.docx'},reflection:{date:'11.11',done:true,file:'רפלקציה_תצפית_2.docx'}}},
  {id:'ob3',topic:'תצפית 3 — שיעור הרצל',date:'04.12',status:'complete',stages:{observation:{date:'04.12',done:true,file:'תצפית_3_שדה.pdf',summary:'נוכחות כיתתית מצוינת. אלתור מרשים אחרי תקלת מקרן'},feedback:{date:'06.12',done:true,file:'משוב_תצפית_3.docx'},reflection:{date:'12.12',done:true,file:'רפלקציה_תצפית_3.docx'}}},
];
const STAGE_LABELS = {
  submission:{short:'הגשה',full:'הגשה ראשונה',who:'סטודנט',icon:'↑'},
  instructorNotes:{short:'הערות',full:'הערות מד״פ',who:'מד״פ',icon:'✎'},
  revision:{short:'תיקון',full:'גרסה מתוקנת',who:'סטודנט',icon:'↻'},
  observation:{short:'תצפית',full:'צפייה בשיעור',who:'מד״פ',icon:'◉'},
  feedback:{short:'משוב',full:'שיחת משוב + כתב',who:'מד״פ',icon:'✎'},
  reflection:{short:'רפלקציה',full:'רפלקציה של הסטודנט',who:'סטודנט',icon:'✦'},
};
const CYCLE_STATUS = {
  complete:{label:'הושלם',cls:'badge-ok'},
  in_review:{label:'ממתין למד״פ',cls:'badge-warn'},
  awaiting_revision:{label:'ממתין לסטודנט',cls:'badge-info'},
  not_started:{label:'טרם הוגש',cls:'badge-neutral'},
};
const SMART_QUESTIONS = [
  {id:'q1',icon:'⚖',gap:'lessonPlan',badge:'📘 מול 🎯 · שליטה במיומנויות הוראה',context:'במערכי השיעור הבניה בסיסית (שאלת מוקד ופעולת דריכה חלשות), אך בתצפית נצפה ביצוע מרשים ואלתור בשיעור. פער של שתי רמות בין התכנון לביצוע.',question:'כיצד לשקלל את שליטת המיומנויות — לפי איכות התכנון הכתוב, או לפי ההוראה החיה בכיתה?',type:'decision',options:[{value:'observation',label:'להעדיף את ההוראה בפועל',detail:'הביצוע משקף את היכולת האמיתית'},{value:'balanced',label:'איזון בין השניים',detail:'לשקלל את שני הערוצים שווה בשווה'},{value:'lesson',label:'להעדיף את התכנון',detail:'התכנון מעיד על שיטתיות'}],placeholder:'נימוק ההחלטה (אופציונלי)...'},
  {id:'q2',icon:'◉',gap:'observation',badge:'🎯 תקשורת עם תלמידים',context:'מהתצפית עולה יחס קשוב, אך לא תועד תיעוד מפורט של מענה לצרכים שונים.',question:'כיצד היית מתאר את איכות התקשורת עם התלמידים ומענה לצרכיהם השונים?',type:'text',placeholder:'תיאור האינטראקציה עם התלמידים...'},
  {id:'q3',icon:'✦',gap:'general',badge:'⚠ חסר תיעוד · עמידה בדרישות הקורס',context:'נדרש לוודא עמידה בדרישות: לפחות 5 מערכי שיעור עם תיקונים ורפלקציה לאחר שיחת משוב.',question:'האם הסטודנטית עמדה בדרישות הקורס — הגישה 5+ מערכים עם תיקונים וביצעה רפלקציה לאחר שיחת משוב?',type:'text',placeholder:'תיאור עמידה בדרישות הקורס...'},
];
const RUBRICS = [
  {id:'r1',name:'מחוון כלי מדפים',desc:'מחוון להערכת סטודנטים מורים, 6 קריטריונים'},
];
const LEVELS = {
  high:{label:'רמה גבוהה',cls:'badge-ok'},
  mid_high:{label:'בינונית-גבוהה',cls:'badge-info'},
  mid:{label:'בינונית',cls:'badge-neutral'},
  low_mid:{label:'בינונית-נמוכה',cls:'badge-warn'},
};
const EVAL_CATEGORIES = [
  {id:'c1',name:'שליטה בתחום הדעת',weight:15,overallLevel:'mid_high',lessonPlan:{level:'mid_high',note:'ניכרת היכרות עם התחום; המערכים מבוססים על ידע מעמיק.',ev:'e2'},observation:null,gap:null,balance:''},
  {id:'c2',name:'תפיסה מקצועית',weight:15,overallLevel:'mid_high',lessonPlan:{level:'mid_high',note:'ניכר גיבוש תפיסה פדגוגית; הסברת מטרות ועקרונות.',ev:'e2'},observation:null,gap:null,balance:''},
  {id:'c3',name:'שליטה במיומנויות הוראה',weight:30,overallLevel:'mid_high',lessonPlan:{level:'mid',note:'מבנה שיעור בסיסי; יש להעמיק שאלת מוקד ופעולת דריכה.',ev:'e2'},observation:{level:'high',note:'ביצוע בכיתה מרשים — אלתור ושמירה על רצף.',ev:'e1'},gap:{summary:'הביצוע בכיתה גבוה מהתכנון הכתוב.',decisionKey:null,resolution:''},balance:''},
  {id:'c4',name:'עמידה בדרישות הקורס',weight:20,overallLevel:null,lessonPlan:null,observation:null,gap:{summary:'נדרש קלט ישיר ממך — האם הוגשו 5+ מערכים ובוצעה רפלקציה?',decisionKey:'q3',resolution:null},usesInstructorInput:'q3',balance:'',emptyHint:'תחום זה דורש את הערכתך הישירה.'},
  {id:'c5',name:'תקשורת עם תלמידים',weight:10,overallLevel:'mid_high',lessonPlan:null,observation:{level:'mid_high',note:'יחס מכבד וקשוב; תגובה רגישה לצרכי תלמידים.',ev:'e3'},gap:null,balance:''},
  {id:'c6',name:'משוב',weight:10,overallLevel:'high',lessonPlan:null,observation:{level:'high',note:'פתיחות למשוב; התבוננות עצמית כנה וביקורתית.',ev:'e1'},gap:null,balance:''},
];
const LEVEL_SCORE = {high:92,mid_high:80,mid:68,low_mid:55};
const EVIDENCES = {
  e1:{id:'e1',label:'ראיה 1',track:'observation',cycle:'תצפית 3',fileName:'רפלקציה — תקלת מקרן בספרייה',doc:[{text:'רפלקציה — שיעור 7',heading:true},{text:'תאריך: 12.11 · כיתה ד׳1 · נושא: הרצל וחזון מדינת היהודים'},{text:''},{text:'התכננתי לפתוח את השיעור בקטע ארכיוני קצר שנמצא אצלי על דיסק. תכננתי להראות תמונות מהקונגרס הציוני הראשון ולחבר אותן לשאלה: "אם הייתם צריכים לשכנע מישהו לעזוב את ביתו ולעלות למקום חדש — מה הייתם אומרים?"'},{text:''},{text:'אבל המקרן בכיתה לא עבד. ניגשתי לספרייה לבדוק האם המקרן עובד, ואחרי 7 דקות הבנתי שאני צריכה לאלתר.',highlight:true},{text:''},{text:'מה שעשיתי: ביקשתי מהילדים לעצום עיניים, ובמקום להציג את התמונות תיארתי בקול את האולם בבזל. שאלתי אותם איך נראה אדם שעומד מול 200 אנשים זרים ומציע להם רעיון מטורף. שני ילדים שאלו שאלות. ניצן (שם בדוי) אמר "אולי הוא היה לחוץ". זו הייתה ההזדמנות הכי טובה שיכולתי לקבל.'},{text:''},{text:'מה למדתי: לא להישען על טכנולוגיה. ועוד יותר חשוב — שיש כוח עצום בלהוריד את הקצב ולתת לתלמידים לדמיין.'}]},
  e2:{id:'e2',label:'ראיה 2',track:'lesson_plan',cycle:'מערך 1 · v1',fileName:'מערך שיעור — חלוקה ארוכה',doc:[{text:'מערך שיעור: חלוקה ארוכה — שיעור פתיחה',heading:true},{text:'מקצוע: מתמטיקה · משך: 45 דקות · כיתה ד׳2'},{text:''},{text:'מטרות:'},{text:'· היכרות עם אלגוריתם החלוקה הארוכה'},{text:'· יישום בתרגילים פשוטים (מספרים דו-ספרתיים)'},{text:''},{text:'מהלך השיעור:',highlight:true},{text:'5 דקות — פתיחה: שאלה מסקרנת על הכיתה'},{text:'20 דקות — הצגה ותרגול משותף על הלוח'},{text:'15 דקות — עבודה עצמית בזוגות'},{text:'5 דקות — סיכום'},{text:''},{text:'הערה: מערך זה התקבל כסביר אך ביקש להעמיק בהסבר השלבי של האלגוריתם ולהוסיף שלב של הצגת דוגמה הפוכה (טעות נפוצה).'}]},
  e3:{id:'e3',label:'ראיה 3',track:'observation',cycle:'תצפית 3',fileName:'היבטים להערכת שיעור — תצפית 3',doc:[{text:'טופס הערכת שיעור — תצפית מס׳ 3',heading:true},{text:'תאריך: 04.12 · מתבונן: המדריך הפדגוגי'},{text:''},{text:'נוכחות כיתתית:'},{text:'לסטודנטית נוכחות כיתתית מצוינת. עומדת בנינוחות, מבט פתוח, יודעת לסגור רעש מבלי להעלות את הטון.',highlight:true},{text:''},{text:'ידע תוכני:'},{text:'נושא השיעור: הרצל. ניכרת היכרות מעמיקה עם החומר. מצליחה לקשר בין דמות היסטורית לבין שאלות אקטואליות בשפה שמתאימה לבני 10.'},{text:''},{text:'נקודות לחיזוק:'},{text:'· מעבר מהצגת חומר לבניית הבנה — לתת לתלמידים יותר לדבר.'},{text:'· מעברים בין שלבי השיעור — לסמן אותם בצורה ברורה יותר.'}]},
  e4:{id:'e4',label:'ראיה 4',track:'observation',cycle:'אירוע · תצפית 2',fileName:'תיעוד התמודדות עם תלמיד מאתגר',doc:[{text:'תיעוד אירוע — תלמיד מאתגר',heading:true},{text:'תאריך: 18.11 · שם תלמיד: ל. (שם בדוי)'},{text:''},{text:'תיאור:'},{text:'ל. נכנס לשיעור באיחור, השליך את התיק והניח את הראש על השולחן. בעבר התעלמתי מסיטואציות כאלה — הפעם החלטתי לגשת אליו.',highlight:true},{text:''},{text:'מה עשיתי:'},{text:'התכופפתי לידו, דיברתי בשקט. שאלתי האם הוא רוצה לצאת רגע ולחזור. הוא הנהן. חזר אחרי 4 דקות, התיישב, השתתף בשליש האחרון של השיעור.'},{text:''},{text:'התלבטות:'},{text:'האם לאפשר יציאה זו הכרה בקושי או ויתור? התייעצתי עם המורה המאמנת — היא חשבה שזה היה נכון.'}]},
  e5:{id:'e5',label:'ראיה 5',track:'observation',cycle:'דו״ח מאמנת',fileName:'דו"ח מורה מאמנת — אמצע סמסטר',doc:[{text:'דו״ח מורה מאמנת — אמצע סמסטר',heading:true},{text:'מאמנת: ר.כ. · בית ספר מאמן יסודי'},{text:''},{text:'השתלבות בצוות:'},{text:'מ. השתלבה היטב בצוות. נוכחת בישיבות, מקבלת משוב באופן בוגר ולא מתגוננת.',highlight:true},{text:''},{text:'דייקנות:'},{text:'עומדת בלוחות זמנים, מגיעה מוכנה.'},{text:''},{text:'להמשך:'},{text:'הייתי שמחה לראות יותר יוזמה — להציע פעילות, להוביל פינה.'}]},
};
const QA_SUGGESTIONS = ['איך היא מתמודדת עם בעיות משמעת?','מה היחס שלה לתלמידים מתקשים?','איך נראה השיתוף פעולה עם המורה המאמנת?','מה רמת התכנון של מערכי השיעור?'];

const ARCHIVED = [
  {id:'a1',name:'ג. רון',school:'יסודי הרצוג',semester:'סמסטר א׳',date:'14.01.26',score:88,level:'גבוהה',rubric:'הערכה מעצבת — סמסטר א׳',evaluator:'ענת ב.',tags:['תכנון','ניהול כיתה']},
  {id:'a2',name:'ד. כהן',school:'ממ"ד שדות',semester:'סמסטר א׳',date:'12.01.26',score:72,level:'בינונית',rubric:'הערכה מעצבת — סמסטר א׳',evaluator:'ד"ר ש. לוי',tags:['שונות']},
  {id:'a3',name:'ו. ברק',school:'דמוקרטי האלה',semester:'סמסטר א׳',date:'10.01.26',score:95,level:'גבוהה',rubric:'הערכה מעצבת — סמסטר א׳',evaluator:'ענת ב.',tags:['מצוינות','הוראה']},
  {id:'a4',name:'ז. אלון',school:'יסודי מאמן · מתמטי',semester:'סמסטר א׳',date:'08.01.26',score:65,level:'בינונית-נמוכה',rubric:'הערכה מעצבת — סמסטר א׳',evaluator:'ענת ב.',tags:['תכנון','ליווי']},
  {id:'a5',name:'ח. גל',school:'ניסויי · יסוד',semester:'שנה א׳ — סוף',date:'28.06.25',score:92,level:'גבוהה',rubric:'הערכת סוף שנה',evaluator:'ד"ר ש. לוי',tags:['רפלקציה']},
  {id:'a6',name:'י. שחר',school:'מאמן · רב-תרבותי',semester:'שנה א׳ — סוף',date:'25.06.25',score:81,level:'בינונית-גבוהה',rubric:'הערכת סוף שנה',evaluator:'ענת ב.',tags:['צוות']},
  {id:'a7',name:'ר. פרץ',school:'יסודי הרצוג',semester:'שנה א׳ — סוף',date:'20.06.25',score:85,level:'בינונית-גבוהה',rubric:'הערכת סוף שנה',evaluator:'ענת ב.',tags:['רפלקציה']},
  {id:'a8',name:'ת. אבני',school:'דמוקרטי האלה',semester:'שנה א׳ — סוף',date:'18.06.25',score:76,level:'בינונית',rubric:'הערכת סוף שנה',evaluator:'ענת ב.',tags:['תכנון']},
];

const RUBRIC_DETAILS = {
  r1:{name:'מחוון כלי מדפים',desc:'מחוון להערכת סטודנטים מורים — הכנה לקראת הוראה, יישום ותצפית.',semester:'שנתי',total:100,usage:0,lastEdit:'היום',owner:'חוג להוראה',criteria:[
    {name:'שליטה בתחום הדעת',        weight:15, desc:'ידע נדרש מספק; למידה מתמדת של היסטוריה כהכנה להוראה'},
    {name:'תפיסה מקצועית',            weight:15, desc:'הסבר מטרות ההוראה; קווים מנחים לניהול הכיתה'},
    {name:'שליטה במיומנויות הוראה',  weight:30, desc:'בניית שיעור: שאלת מוקד, פעולת דריכה, מקורות, ביצועי הבנה, ניהול דיון; שיפור לאור משוב'},
    {name:'עמידה בדרישות הקורס',     weight:20, desc:'לפחות 5 מערכי שיעור עם תיקונים; רפלקציה לאחר שיחת משוב'},
    {name:'תקשורת עם תלמידים',        weight:10, desc:'יחס מכבד וקשוב; זיהוי צרכים שונים; מעורבות ואחריות (מתצפית בלבד)'},
    {name:'משוב',                      weight:10, desc:'פתיחות למשוב; התבוננות עצמית כנה; הסקת מסקנות (מתצפית בלבד)'},
  ]},
};

export { ARCHIVED, RUBRIC_DETAILS };
export {  STUDENTS, STATUS_META, RUBRICS, LEVELS, EVAL_CATEGORIES, EVIDENCES, QA_SUGGESTIONS, LEVEL_SCORE, LESSON_PLAN_CYCLES, OBSERVATION_CYCLES, STAGE_LABELS, CYCLE_STATUS, SMART_QUESTIONS  };
