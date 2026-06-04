require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'student-files';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function progressFor(cycles, trackType) {
  const subset = (cycles || []).filter(c => c.track_type === trackType);
  return { complete: subset.filter(c => c.status === 'complete').length, total: subset.length };
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const bcrypt = require('bcryptjs');

  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    await supabase.from('users').insert({
      id: 'u1',
      email: 'yearad@dyellin.ac.il',
      password_hash: bcrypt.hashSync('pilot2026', 10),
      name: 'ראש הקבוצה',
    });
    console.log('✓ Pilot user created: yearad@dyellin.ac.il / pilot2026');
  }

  const { data: rubrics } = await supabase.from('rubrics').select('id').limit(1);
  if (!rubrics || rubrics.length === 0) {
    await supabase.from('rubrics').insert({
      id: 'r1',
      name: 'מחוון כלי מדפים',
      description: 'מחוון להערכת סטודנטים מורים — הכנה לקראת הוראה, יישום ותצפית.',
      semester: 'שנתי',
      total_points: 100,
      criteria: [
        { name: 'שליטה בתחום הדעת',        weight: 15, desc: 'ידע נדרש מספק; למידה מתמדת של היסטוריה כהכנה להוראה' },
        { name: 'תפיסה מקצועית',            weight: 15, desc: 'הסבר מטרות ההוראה; קווים מנחים לניהול הכיתה' },
        { name: 'שליטה במיומנויות הוראה',  weight: 30, desc: 'בניית שיעור: שאלת מוקד, פעולת דריכה, מקורות, ביצועי הבנה, ניהול דיון; שיפור לאור משוב' },
        { name: 'עמידה בדרישות הקורס',     weight: 20, desc: 'לפחות 5 מערכי שיעור עם תיקונים; רפלקציה לאחר שיחת משוב' },
        { name: 'תקשורת עם תלמידים',        weight: 10, desc: 'יחס מכבד וקשוב; זיהוי צרכים שונים; מעורבות ואחריות (מתצפית בלבד)' },
        { name: 'משוב',                      weight: 10, desc: 'פתיחות למשוב; התבוננות עצמית כנה; הסקת מסקנות (מתצפית בלבד)' },
      ],
      instructor_id: 'u1',
    });
    console.log('✓ Rubric seeded: מחוון כלי מדפים');
  }

  const { data: existing } = await supabase.from('students').select('id').limit(1);
  if (existing && existing.length > 0) return;

  await supabase.from('students').insert([
    { id: 's1', name: 'מ. לוי',    school: 'בית ספר יסודי מאמן · מתמטי', grade: 'כיתה ד׳', subject_track: 'מתמטיקה',    status: 'pending',      initials: 'מל' },
    { id: 's2', name: 'נ. כהן',    school: 'בית ספר ניסויי · יסוד',      grade: 'כיתה ב׳', subject_track: 'אנגלית',       status: 'ready',        initials: 'נכ' },
    { id: 's3', name: 'ש. בן-דוד', school: 'בית ספר ממ"ד שדות',           grade: 'כיתה ה׳', subject_track: 'מדעים',        status: 'pending',      initials: 'שב' },
    { id: 's4', name: 'ת. אבני',   school: 'בית ספר דמוקרטי האלה',       grade: 'כיתה ג׳', subject_track: 'חינוך מיוחד', status: 'in_progress',  initials: 'תא' },
    { id: 's5', name: 'א. שמיר',   school: 'בית ספר מאמן · רב-תרבותי',   grade: 'כיתה ד׳', subject_track: 'רב-תחומי',    status: 'not_started',  initials: 'אש' },
    { id: 's6', name: 'ר. פרץ',    school: 'בית ספר יסודי הרצוג',        grade: 'כיתה ו׳', subject_track: 'לשון ומקרא',  status: 'pending',      initials: 'רפ' },
  ]);

  await supabase.from('cycles').insert([
    { id: 'lp1', student_id: 's1', track_type: 'lesson_plan', topic: 'חלוקה ארוכה — שיעור פתיחה', subject: 'מתמטיקה', date: null, status: 'complete',           position: 1 },
    { id: 'lp2', student_id: 's1', track_type: 'lesson_plan', topic: 'הרצל וחזון מדינת היהודים',   subject: 'מולדת',   date: null, status: 'complete',           position: 2 },
    { id: 'lp3', student_id: 's1', track_type: 'lesson_plan', topic: 'שירת מולדת — אנליזה',         subject: 'ספרות',   date: null, status: 'awaiting_revision', position: 3 },
    { id: 'lp4', student_id: 's1', track_type: 'lesson_plan', topic: 'מבנה הסיפור — היכרות',        subject: 'ספרות',   date: null, status: 'in_review',         position: 4 },
    { id: 'ob1', student_id: 's1', track_type: 'observation', topic: 'תצפית 1 — שיעור פתיחת שנה', subject: null, date: '12.10', status: 'complete', position: 1 },
    { id: 'ob2', student_id: 's1', track_type: 'observation', topic: 'תצפית 2 — מתמטיקה כיתה ד׳', subject: null, date: '04.11', status: 'complete', position: 2 },
    { id: 'ob3', student_id: 's1', track_type: 'observation', topic: 'תצפית 3 — שיעור הרצל',       subject: null, date: '04.12', status: 'complete', position: 3 },
  ]);

  await supabase.from('stages').insert([
    { id: 'st1',  cycle_id: 'lp1', stage_key: 'submission',      done: 1, date: '04.11', summary: null, days_waiting: null, position: 1 },
    { id: 'st2',  cycle_id: 'lp1', stage_key: 'instructorNotes', done: 1, date: '07.11', summary: 'להעמיק שלבי האלגוריתם, להוסיף דוגמה הפוכה', days_waiting: null, position: 2 },
    { id: 'st3',  cycle_id: 'lp1', stage_key: 'revision',        done: 1, date: '14.11', summary: null, days_waiting: null, position: 3 },
    { id: 'st4',  cycle_id: 'lp2', stage_key: 'submission',      done: 1, date: '20.11', summary: null, days_waiting: null, position: 1 },
    { id: 'st5',  cycle_id: 'lp2', stage_key: 'instructorNotes', done: 1, date: '23.11', summary: 'מצוין — להוסיף שאלת פתיחה אקטיבית', days_waiting: null, position: 2 },
    { id: 'st6',  cycle_id: 'lp2', stage_key: 'revision',        done: 1, date: '27.11', summary: null, days_waiting: null, position: 3 },
    { id: 'st7',  cycle_id: 'lp3', stage_key: 'submission',      done: 1, date: '10.12', summary: null, days_waiting: null, position: 1 },
    { id: 'st8',  cycle_id: 'lp3', stage_key: 'instructorNotes', done: 1, date: '14.12', summary: 'לחזק את הקישור לטקסט המקור', days_waiting: null, position: 2 },
    { id: 'st9',  cycle_id: 'lp3', stage_key: 'revision',        done: 0, date: null,    summary: null, days_waiting: 9,    position: 3 },
    { id: 'st10', cycle_id: 'lp4', stage_key: 'submission',      done: 1, date: '08.01', summary: null, days_waiting: null, position: 1 },
    { id: 'st11', cycle_id: 'lp4', stage_key: 'instructorNotes', done: 0, date: null,    summary: null, days_waiting: 3,    position: 2 },
    { id: 'st12', cycle_id: 'lp4', stage_key: 'revision',        done: 0, date: null,    summary: null, days_waiting: null, position: 3 },
    { id: 'st13', cycle_id: 'ob1', stage_key: 'observation', done: 1, date: '12.10', summary: 'התרשמות ראשונית: לומדת מהר, ראוי לעקוב אחר תכנון', days_waiting: null, position: 1 },
    { id: 'st14', cycle_id: 'ob1', stage_key: 'feedback',    done: 1, date: '14.10', summary: null, days_waiting: null, position: 2 },
    { id: 'st15', cycle_id: 'ob1', stage_key: 'reflection',  done: 1, date: '18.10', summary: null, days_waiting: null, position: 3 },
    { id: 'st16', cycle_id: 'ob2', stage_key: 'observation', done: 1, date: '04.11', summary: 'ניהול כיתה רגוע, יש לחזק העברה בין שלבים', days_waiting: null, position: 1 },
    { id: 'st17', cycle_id: 'ob2', stage_key: 'feedback',    done: 1, date: '07.11', summary: null, days_waiting: null, position: 2 },
    { id: 'st18', cycle_id: 'ob2', stage_key: 'reflection',  done: 1, date: '11.11', summary: null, days_waiting: null, position: 3 },
    { id: 'st19', cycle_id: 'ob3', stage_key: 'observation', done: 1, date: '04.12', summary: 'נוכחות כיתתית מצוינת. אלתור מרשים אחרי תקלת מקרן', days_waiting: null, position: 1 },
    { id: 'st20', cycle_id: 'ob3', stage_key: 'feedback',    done: 1, date: '06.12', summary: null, days_waiting: null, position: 2 },
    { id: 'st21', cycle_id: 'ob3', stage_key: 'reflection',  done: 1, date: '12.12', summary: null, days_waiting: null, position: 3 },
  ]);

  console.log('✓ Database seeded with anonymised students');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function initDB() {
  await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});
  await seed();
}

// ─── Query helpers (all async) ────────────────────────────────────────────────

const q = {
  allStudents: async () => {
    const { data: students, error } = await supabase
      .from('students').select('*').order('created_at');
    if (error) throw error;
    if (!students || students.length === 0) return [];

    const ids = students.map(s => s.id);
    const [{ data: cycles }, { data: files }] = await Promise.all([
      supabase.from('cycles').select('id, student_id, track_type, status').in('student_id', ids),
      supabase.from('files').select('id, student_id, cycle_id').in('student_id', ids).not('cycle_id', 'is', null),
    ]);

    return students.map(s => ({
      ...s,
      lessonProgress:      progressFor((cycles || []).filter(c => c.student_id === s.id), 'lesson_plan'),
      observationProgress: progressFor((cycles || []).filter(c => c.student_id === s.id), 'observation'),
      docs: (files || []).filter(f => f.student_id === s.id).length,
    }));
  },

  student: async (id) => {
    const { data } = await supabase.from('students').select('*').eq('id', id).single();
    return data || null;
  },

  studentWithCycles: async (id) => {
    const { data: student } = await supabase.from('students').select('*').eq('id', id).single();
    if (!student) return null;

    let { data: cycles } = await supabase
      .from('cycles').select('*').eq('student_id', id).order('position');

    if (!cycles || cycles.length === 0) {
      await q.seedDefaultCyclesForStudent(id, student.subject_track);
      ({ data: cycles } = await supabase
        .from('cycles').select('*').eq('student_id', id).order('position'));
    }

    const cycleIds = (cycles || []).map(c => c.id);
    const [{ data: stages }, { data: cycleFiles }, { data: extraFiles }] = await Promise.all([
      supabase.from('stages').select('*').in('cycle_id', cycleIds).order('position'),
      supabase.from('files')
        .select('id, original_name, stage_key, file_type, description, uploaded_at, cycle_id')
        .eq('student_id', id).not('cycle_id', 'is', null),
      supabase.from('files')
        .select('id, original_name, file_type, description, uploaded_at')
        .eq('student_id', id).is('cycle_id', null),
    ]);

    const stagesByC = {};
    const filesByC  = {};
    for (const s of (stages || []))     { if (!stagesByC[s.cycle_id]) stagesByC[s.cycle_id] = []; stagesByC[s.cycle_id].push(s); }
    for (const f of (cycleFiles || [])) { if (!filesByC[f.cycle_id])  filesByC[f.cycle_id]  = []; filesByC[f.cycle_id].push(f); }

    for (const c of (cycles || [])) {
      c.stages = stagesByC[c.id] || [];
      c.files  = filesByC[c.id]  || [];
    }

    student.cycles              = cycles || [];
    student.lessonProgress      = progressFor(cycles, 'lesson_plan');
    student.observationProgress = progressFor(cycles, 'observation');
    student.extraFiles          = extraFiles || [];
    return student;
  },

  evaluation: async (studentId) => {
    const { data } = await supabase
      .from('evaluations').select('*').eq('student_id', studentId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    return data || null;
  },

  getEvaluation: async (id) => {
    const { data } = await supabase.from('evaluations').select('*').eq('id', id).single();
    return data || null;
  },

  createEvaluation: async (studentId) => {
    const id = 'ev_' + Date.now();
    const { data, error } = await supabase
      .from('evaluations').insert({ id, student_id: studentId }).select().single();
    if (error) throw error;
    return data;
  },

  updateEvaluation: async (id, fields) => {
    const { error } = await supabase
      .from('evaluations').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  upsertEvaluation: async (studentId, draftJson, score) => {
    let ev = await q.evaluation(studentId);
    if (!ev) ev = await q.createEvaluation(studentId);
    await q.updateEvaluation(ev.id, { draft_json: draftJson, score, status: 'draft' });
    return q.getEvaluation(ev.id);
  },

  saveFile: async (file) => {
    const { error } = await supabase.from('files').insert(file);
    if (error) throw error;
  },

  deleteFile: async (id) => {
    const { data: file } = await supabase.from('files').select('stored_path').eq('id', id).single();
    if (file?.stored_path) {
      await supabase.storage.from(BUCKET).remove([file.stored_path]);
    }
    await supabase.from('files').delete().eq('id', id);
  },

  studentFiles: async (studentId) => {
    const { data } = await supabase.from('files').select('*').eq('student_id', studentId);
    return data || [];
  },

  updateStudentStatus: async (id, status) => {
    await supabase.from('students').update({ status }).eq('id', id);
  },

  updateCycleTopic: async (cycleId, topic) => {
    await supabase.from('cycles').update({ topic }).eq('id', cycleId);
  },

  updateStageFile: async (cycleId, stageKey) => {
    const date = new Date().toLocaleDateString('he-IL').replace(/\//g, '.');
    await supabase.from('stages').update({ done: 1, date }).eq('cycle_id', cycleId).eq('stage_key', stageKey);
  },

  userByEmail: async (email) => {
    const { data } = await supabase.from('users').select('*').eq('email', email).single();
    return data || null;
  },

  allRubrics: async () => {
    const { data } = await supabase.from('rubrics').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  rubric: async (id) => {
    const { data } = await supabase.from('rubrics').select('*').eq('id', id).single();
    return data || null;
  },

  createRubric: async ({ name, description, semester, total_points, criteria, instructor_id }) => {
    const id = 'r_' + Date.now();
    const { data, error } = await supabase.from('rubrics')
      .insert({ id, name, description: description || '', semester: semester || '', total_points: total_points ?? null, criteria: criteria || [], instructor_id: instructor_id || null })
      .select().single();
    if (error) throw error;
    return data;
  },

  updateRubric: async (id, { name, description, semester, total_points, criteria }) => {
    const updates = {};
    if (name !== undefined)         updates.name         = name;
    if (description !== undefined)  updates.description  = description;
    if (semester !== undefined)     updates.semester     = semester;
    if (total_points !== undefined) updates.total_points = total_points;
    if (criteria !== undefined)     updates.criteria     = criteria;
    if (Object.keys(updates).length === 0) return;
    await supabase.from('rubrics').update(updates).eq('id', id);
  },

  deleteRubric: async (id) => {
    await supabase.from('rubrics').delete().eq('id', id);
  },

  seedDefaultCyclesForStudent: async (studentId, subjectTrack) => {
    const cycles = [];
    const stages = [];

    for (let i = 1; i <= 5; i++) {
      const cId = `lp_${studentId}_${i}`;
      cycles.push({ id: cId, student_id: studentId, track_type: 'lesson_plan', topic: `מערך שיעור ${i}`, subject: subjectTrack || '', date: null, status: 'not_started', position: i });
      stages.push({ id: `st_${cId}_1`, cycle_id: cId, stage_key: 'submission',      done: 0, position: 1 });
      stages.push({ id: `st_${cId}_2`, cycle_id: cId, stage_key: 'instructorNotes', done: 0, position: 2 });
      stages.push({ id: `st_${cId}_3`, cycle_id: cId, stage_key: 'revision',        done: 0, position: 3 });
    }

    for (let i = 1; i <= 3; i++) {
      const cId = `ob_${studentId}_${i}`;
      cycles.push({ id: cId, student_id: studentId, track_type: 'observation', topic: `תצפית ${i}`, subject: '', date: null, status: 'not_started', position: i });
      stages.push({ id: `st_${cId}_1`, cycle_id: cId, stage_key: 'observation', done: 0, position: 1 });
      stages.push({ id: `st_${cId}_2`, cycle_id: cId, stage_key: 'feedback',    done: 0, position: 2 });
      stages.push({ id: `st_${cId}_3`, cycle_id: cId, stage_key: 'reflection',  done: 0, position: 3 });
    }

    await supabase.from('cycles').insert(cycles);
    await supabase.from('stages').insert(stages);
  },

  bulkInsertStudents: async (students) => {
    await supabase.from('students').insert(students);
    for (const s of students) {
      await q.seedDefaultCyclesForStudent(s.id, s.subject_track);
    }
  },
};

module.exports = { supabase, q, initDB, BUCKET };
