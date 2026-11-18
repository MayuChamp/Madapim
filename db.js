require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'student-files';
const { MAIN_RUBRIC, MAIN_RUBRIC_ID, decorateRubric } = require('./rubrics/mainRubric');
const { academicYearOf } = require('./services/academicYear');

// students.academic_year comes from migration 20261118_add_student_academic_year.sql.
// Until it has been run, the year is derived from created_at and never written.
let academicYearColumn = false;
async function hasAcademicYearColumn() {
  if (!academicYearColumn) {
    const { error } = await supabase.from('students').select('academic_year').limit(1);
    academicYearColumn = !error;
  }
  return academicYearColumn;
}
const withAcademicYear = s => (s ? { ...s, academic_year: s.academic_year ?? academicYearOf(s.created_at) } : s);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function progressFor(cycles, trackType, files) {
  const subset = (cycles || []).filter(c => c.track_type === trackType);
  return {
    complete: subset.filter(c => {
      if (c.status === 'complete') return true;
      if (c.stages && c.stages.some(s => s.done)) return true;
      if (files && files.some(f => f.cycle_id === c.id)) return true;
      return false;
    }).length,
    total: subset.length,
  };
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
}

// The main rubric (מחוון הערכה מסכם להתנסות מעשית בהוראה) must always exist.
// Inserted only when missing, so edits made through the UI are kept.
async function ensureMainRubric() {
  const { data: existing, error } = await supabase.from('rubrics').select('id').eq('id', MAIN_RUBRIC_ID).maybeSingle();
  if (error) { console.error('Main rubric check failed:', error.message); return; }
  if (existing) return;
  const { error: insErr } = await supabase.from('rubrics').insert({ ...MAIN_RUBRIC, instructor_id: 'u1' });
  if (insErr) console.error('Main rubric seed failed:', insErr.message);
  else console.log(`✓ Main rubric seeded: ${MAIN_RUBRIC.name}`);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function initDB() {
  await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});
  await seed();
  await ensureMainRubric();
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

    return students.map(s => {
      const sCycles = (cycles || []).filter(c => c.student_id === s.id);
      const sFiles  = (files  || []).filter(f => f.student_id === s.id);
      return {
        ...withAcademicYear(s),
        lessonProgress:      progressFor(sCycles, 'lesson_plan',  sFiles),
        observationProgress: progressFor(sCycles, 'observation',  sFiles),
        docs: sFiles.length,
      };
    });
  },

  student: async (id, instructorId) => {
    let query = supabase.from('students').select('*').eq('id', id);
    if (instructorId) query = query.eq('instructor_id', instructorId);
    const { data } = await query.single();
    return withAcademicYear(data) || null;
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
    return withAcademicYear(student);
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

  upsertEvaluation: async (studentId, draftJson, score, rubricId, instructorAnswers) => {
    let ev = await q.evaluation(studentId);
    if (!ev) ev = await q.createEvaluation(studentId);
    const fields = { draft_json: draftJson, score, status: 'draft', rubric_id: rubricId || null };
    if (instructorAnswers !== undefined) fields.instructor_answers = instructorAnswers;
    await q.updateEvaluation(ev.id, fields);
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

  // Files carry no track of their own; it comes from the cycle they were uploaded to.
  studentFiles: async (studentId) => {
    const [{ data: files }, { data: cycles }] = await Promise.all([
      supabase.from('files').select('*').eq('student_id', studentId),
      supabase.from('cycles').select('id, track_type, topic').eq('student_id', studentId),
    ]);
    const byId = new Map((cycles || []).map(c => [c.id, c]));
    return (files || []).map(f => {
      const cycle = f.cycle_id ? byId.get(f.cycle_id) : null;
      return { ...f, track_type: cycle?.track_type || null, cycle_topic: cycle?.topic || null };
    });
  },

  hasAcademicYearColumn,

  updateStudentAcademicYear: async (id, year) => {
    if (!(await hasAcademicYearColumn())) {
      throw Object.assign(new Error('שדה שנת הלימודים טרם נוצר במסד הנתונים. יש להריץ ב-Supabase את ה-migration 20261118_add_student_academic_year.sql.'), { status: 503 });
    }
    const { error } = await supabase.from('students').update({ academic_year: year }).eq('id', id);
    if (error) throw error;
  },

  updateStudentGender: async (id, gender) => {
    const { error } = await supabase.from('students').update({ gender }).eq('id', id);
    if (error) throw error;
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

  // Like userById, but a failed query throws instead of looking like "no such user".
  userByIdOrThrow: async (id) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
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

  updateUserQuota: async (id, maxLessonPlans, maxObservations) => {
    await supabase.from('users').update({ max_lesson_plans: maxLessonPlans, max_observations: maxObservations }).eq('id', id);
  },

  // Fails until migration 20261116_add_plan_vs_execution.sql has been run.
  updatePlanVsExecution: async (id, value) => {
    const { error } = await supabase.from('users').update({ plan_vs_execution: value }).eq('id', id);
    if (error) throw error;
  },

  // `pending` = invited but has not set a password yet. The hash never leaves here.
  allUsers: async () => {
    const { data } = await supabase
      .from('users').select('id, email, name, role, created_at, password_hash').order('created_at');
    return (data || []).map(({ password_hash, ...u }) => ({
      ...u,
      pending: !password_hash || password_hash.startsWith('pending:'),
    }));
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

  // Main rubric first (it is the default in every rubric picker), then newest first.
  allRubrics: async () => {
    const { data } = await supabase.from('rubrics').select('*').order('created_at', { ascending: false });
    const list = data || [];
    const main = list.filter(r => r.id === MAIN_RUBRIC_ID);
    const rest = list.filter(r => r.id !== MAIN_RUBRIC_ID);
    return [...main, ...rest].map(decorateRubric);
  },

  rubric: async (id) => {
    const { data } = await supabase.from('rubrics').select('*').eq('id', id).single();
    return decorateRubric(data) || null;
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

  duplicateRubric: async (id) => {
    const source = await q.rubric(id);
    if (!source) return null;
    const newId = 'r_' + Date.now();
    const { data, error } = await supabase.from('rubrics')
      .insert({
        id: newId,
        name: `${source.name} (עותק)`,
        description: source.description || '',
        semester: source.semester || '',
        total_points: source.total_points ?? null,
        criteria: source.criteria || [],
        instructor_id: source.instructor_id || null,
      })
      .select().single();
    if (error) throw error;
    return data;
  },

  addCycleToStudent: async (studentId, trackType) => {
    const { data: existing } = await supabase
      .from('cycles').select('id, position').eq('student_id', studentId).eq('track_type', trackType).order('position', { ascending: false }).limit(1);
    const nextPos = ((existing?.[0]?.position) || 0) + 1;
    const prefix = trackType === 'lesson_plan' ? 'lp' : 'ob';
    const label  = trackType === 'lesson_plan' ? 'מערך שיעור' : 'תצפית';
    const cId    = `${prefix}_${studentId}_${Date.now()}`;
    const { error: ce } = await supabase.from('cycles').insert({
      id: cId, student_id: studentId, track_type: trackType,
      topic: `${label} ${nextPos}`, subject: '', date: null, status: 'not_started', position: nextPos,
    });
    if (ce) throw ce;
    const stageKeys = trackType === 'lesson_plan'
      ? [['submission', 1], ['instructorNotes', 2], ['revision', 3]]
      : [['observation', 1], ['feedback', 2], ['reflection', 3]];
    const { error: se } = await supabase.from('stages').insert(
      stageKeys.map(([key, pos]) => ({ id: `st_${cId}_${pos}`, cycle_id: cId, stage_key: key, done: 0, position: pos }))
    );
    if (se) throw se;
    return cId;
  },

  // cycles.track_type is constrained to 'lesson_plan' | 'observation' in the DB.
  seedDefaultCyclesForStudent: async (studentId, subjectTrack, { maxLessonPlans = 5, maxObservations = 3 } = {}) => {
    const cycles = [];
    const stages = [];

    for (let i = 1; i <= maxLessonPlans; i++) {
      const cId = `lp_${studentId}_${i}`;
      cycles.push({ id: cId, student_id: studentId, track_type: 'lesson_plan', topic: `מערך שיעור ${i}`, subject: subjectTrack || '', date: null, status: 'not_started', position: i });
      stages.push({ id: `st_${cId}_1`, cycle_id: cId, stage_key: 'submission',      done: 0, position: 1 });
      stages.push({ id: `st_${cId}_2`, cycle_id: cId, stage_key: 'instructorNotes', done: 0, position: 2 });
      stages.push({ id: `st_${cId}_3`, cycle_id: cId, stage_key: 'revision',        done: 0, position: 3 });
    }

    for (let i = 1; i <= maxObservations; i++) {
      const cId = `ob_${studentId}_${i}`;
      cycles.push({ id: cId, student_id: studentId, track_type: 'observation', topic: `תצפית ${i}`, subject: '', date: null, status: 'not_started', position: i });
      stages.push({ id: `st_${cId}_1`, cycle_id: cId, stage_key: 'observation', done: 0, position: 1 });
      stages.push({ id: `st_${cId}_2`, cycle_id: cId, stage_key: 'feedback',    done: 0, position: 2 });
      stages.push({ id: `st_${cId}_3`, cycle_id: cId, stage_key: 'reflection',  done: 0, position: 3 });
    }

    const { error: cyclesError } = await supabase.from('cycles').insert(cycles);
    if (cyclesError) throw cyclesError;
    const { error: stagesError } = await supabase.from('stages').insert(stages);
    if (stagesError) throw stagesError;
  },

  deleteCycle: async (cycleId) => {
    await supabase.from('stages').delete().eq('cycle_id', cycleId);
    await supabase.from('files').update({ cycle_id: null, stage_key: null }).eq('cycle_id', cycleId);
    await supabase.from('cycles').delete().eq('id', cycleId);
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
    const keepYear = await hasAcademicYearColumn();
    const rows = students.map(({ academic_year, ...s }) => ({
      ...s, ...(keepYear ? { academic_year } : {}), instructor_id: instructorId || null,
    }));
    await supabase.from('students').insert(rows);
    for (const s of rows) {
      await q.seedDefaultCyclesForStudent(s.id, s.subject_track);
    }
  },
};

module.exports = { supabase, q, initDB, BUCKET };
