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
      role: 'admin',
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

}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function initDB() {
  await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});
  await seed();
  // Ensure the pilot user is an admin (handles existing DBs seeded before the role was set)
  await supabase.from('users').update({ role: 'admin' }).eq('id', 'u1').neq('role', 'admin');
}

// ─── Query helpers (all async) ────────────────────────────────────────────────

const q = {
  allStudents: async (instructorId) => {
    let query = supabase.from('students').select('*').order('created_at');
    if (instructorId) query = query.eq('instructor_id', instructorId);
    const { data: students, error } = await query;
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

  student: async (id, instructorId) => {
    let query = supabase.from('students').select('*').eq('id', id);
    if (instructorId) query = query.eq('instructor_id', instructorId);
    const { data } = await query.single();
    return data || null;
  },

  studentWithCycles: async (id, instructorId) => {
    let query = supabase.from('students').select('*').eq('id', id);
    if (instructorId) query = query.eq('instructor_id', instructorId);
    const { data: student } = await query.single();
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

  userById: async (id) => {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    return data || null;
  },

  updateUserProfile: async (id, { name, email }) => {
    await supabase.from('users').update({ name, email }).eq('id', id);
  },

  updateUserPassword: async (id, passwordHash) => {
    await supabase.from('users').update({ password_hash: passwordHash }).eq('id', id);
  },

  allUsers: async () => {
    const { data } = await supabase
      .from('users').select('id, email, name, role, created_at').order('created_at');
    return data || [];
  },

  createUser: async ({ id, email, passwordHash, name, role }) => {
    const { data, error } = await supabase.from('users')
      .insert({ id, email, password_hash: passwordHash, name, role: role || 'instructor' })
      .select('id, email, name, role, created_at').single();
    if (error) throw error;
    return data;
  },

  deleteUser: async (id) => {
    await supabase.from('users').delete().eq('id', id);
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

  deleteStudent: async (id) => {
    const { data: cycles } = await supabase.from('cycles').select('id').eq('student_id', id);
    const cycleIds = (cycles || []).map(c => c.id);
    if (cycleIds.length > 0) {
      await supabase.from('stages').delete().in('cycle_id', cycleIds);
    }
    const { data: files } = await supabase.from('files').select('stored_path').eq('student_id', id);
    const paths = (files || []).filter(f => f.stored_path).map(f => f.stored_path);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
    await supabase.from('files').delete().eq('student_id', id);
    await supabase.from('cycles').delete().eq('student_id', id);
    await supabase.from('evaluations').delete().eq('student_id', id);
    await supabase.from('students').delete().eq('id', id);
  },

  allEvaluations: async (instructorId) => {
    let studentIds = null;
    if (instructorId) {
      const { data: myStudents } = await supabase
        .from('students').select('id').eq('instructor_id', instructorId);
      studentIds = (myStudents || []).map(s => s.id);
      if (studentIds.length === 0) return [];
    }

    let query = supabase
      .from('evaluations')
      .select('id, student_id, score, status, draft_json, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (studentIds) query = query.in('student_id', studentIds);

    const { data: evals } = await query;
    if (!evals || evals.length === 0) return [];
    const ids = [...new Set(evals.map(e => e.student_id))];
    const { data: students } = await supabase
      .from('students').select('id, name, school, grade, subject_track').in('id', ids);
    const studentMap = {};
    for (const s of (students || [])) studentMap[s.id] = s;
    return evals.map(e => ({ ...e, student: studentMap[e.student_id] || null }));
  },

  deleteEvaluation: async (id) => {
    await supabase.from('evaluations').delete().eq('id', id);
  },

  bulkInsertStudents: async (students, instructorId) => {
    const rows = students.map(s => ({ ...s, instructor_id: instructorId || null }));
    await supabase.from('students').insert(rows);
    for (const s of rows) {
      await q.seedDefaultCyclesForStudent(s.id, s.subject_track);
    }
  },
};

module.exports = { supabase, q, initDB, BUCKET };
