const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'madapim.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    email        TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name         TEXT,
    role         TEXT DEFAULT 'instructor',
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rubrics (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT,
    semester     TEXT,
    total_points INTEGER,
    criteria     TEXT DEFAULT '[]',
    instructor_id TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    school        TEXT,
    grade         TEXT,
    subject_track TEXT,
    status        TEXT DEFAULT 'not_started',
    initials      TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cycles (
    id         TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    track_type TEXT NOT NULL CHECK(track_type IN ('lesson_plan','observation')),
    topic      TEXT,
    subject    TEXT,
    date       TEXT,
    status     TEXT DEFAULT 'not_started',
    position   INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS stages (
    id         TEXT PRIMARY KEY,
    cycle_id   TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    stage_key  TEXT NOT NULL,
    done       INTEGER DEFAULT 0,
    date       TEXT,
    summary    TEXT,
    days_waiting INTEGER
  );

  CREATE TABLE IF NOT EXISTS files (
    id            TEXT PRIMARY KEY,
    student_id    TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cycle_id      TEXT REFERENCES cycles(id),
    stage_key     TEXT,
    original_name TEXT,
    stored_path   TEXT,
    parsed_text   TEXT,
    file_type     TEXT,
    uploaded_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id                  TEXT PRIMARY KEY,
    student_id          TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rubric_id           TEXT DEFAULT 'r1',
    status              TEXT DEFAULT 'draft',
    instructor_answers  TEXT DEFAULT '{}',
    draft_json          TEXT DEFAULT '{}',
    score               INTEGER,
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Seed ─────────────────────────────────────────────────────────────────────

function seed() {
  // Seed default pilot user (password: pilot2026)
  const existingUser = db.prepare('SELECT COUNT(*) as n FROM users').get();
  if (existingUser.n === 0) {
    const bcrypt = require('bcryptjs');
    db.prepare(`INSERT INTO users (id, email, password_hash, name) VALUES (?,?,?,?)`)
      .run('u1', 'yearad@dyellin.ac.il', bcrypt.hashSync('pilot2026', 10), 'ראש הקבוצה');
    console.log('✓ Pilot user created: yearad@dyellin.ac.il / pilot2026');
  }

  // Seed default rubric — מחוון כלי מדפים
  const existingRubrics = db.prepare('SELECT COUNT(*) as n FROM rubrics').get();
  if (existingRubrics.n === 0) {
    db.prepare(`INSERT INTO rubrics (id,name,description,semester,total_points,criteria,instructor_id) VALUES (?,?,?,?,?,?,?)`)
      .run(
        'r1',
        'מחוון כלי מדפים',
        'מחוון להערכת סטודנטים מורים — הכנה לקראת הוראה, יישום ותצפית.',
        'שנתי',
        100,
        JSON.stringify([
          {name:'שליטה בתחום הדעת',        weight:15, desc:'ידע נדרש מספק; למידה מתמדת של היסטוריה כהכנה להוראה'},
          {name:'תפיסה מקצועית',            weight:15, desc:'הסבר מטרות ההוראה; קווים מנחים לניהול הכיתה'},
          {name:'שליטה במיומנויות הוראה',  weight:30, desc:'בניית שיעור: שאלת מוקד, פעולת דריכה, מקורות, ביצועי הבנה, ניהול דיון; שיפור לאור משוב'},
          {name:'עמידה בדרישות הקורס',     weight:20, desc:'לפחות 5 מערכי שיעור עם תיקונים; רפלקציה לאחר שיחת משוב'},
          {name:'תקשורת עם תלמידים',        weight:10, desc:'יחס מכבד וקשוב; זיהוי צרכים שונים; מעורבות ואחריות (מתצפית בלבד)'},
          {name:'משוב',                      weight:10, desc:'פתיחות למשוב; התבוננות עצמית כנה; הסקת מסקנות (מתצפית בלבד)'},
        ]),
        'u1'
      );
    console.log('✓ Rubric seeded: מחוון כלי מדפים');
  }

  const existing = db.prepare('SELECT COUNT(*) as n FROM students').get();
  if (existing.n > 0) return;

  const insertStudent = db.prepare(`
    INSERT INTO students (id, name, school, grade, subject_track, status, initials)
    VALUES (@id, @name, @school, @grade, @subject_track, @status, @initials)
  `);

  const insertCycle = db.prepare(`
    INSERT INTO cycles (id, student_id, track_type, topic, subject, date, status, position)
    VALUES (@id, @student_id, @track_type, @topic, @subject, @date, @status, @position)
  `);

  const insertStage = db.prepare(`
    INSERT INTO stages (id, cycle_id, stage_key, done, date, summary, days_waiting)
    VALUES (@id, @cycle_id, @stage_key, @done, @date, @summary, @days_waiting)
  `);

  const students = [
    { id: 's1', name: 'מ. לוי',    school: 'בית ספר יסודי מאמן · מתמטי', grade: 'כיתה ד׳', subject_track: 'מתמטיקה',    status: 'pending',      initials: 'מל' },
    { id: 's2', name: 'נ. כהן',    school: 'בית ספר ניסויי · יסוד',      grade: 'כיתה ב׳', subject_track: 'אנגלית',       status: 'ready',        initials: 'נכ' },
    { id: 's3', name: 'ש. בן-דוד', school: 'בית ספר ממ"ד שדות',           grade: 'כיתה ה׳', subject_track: 'מדעים',        status: 'pending',      initials: 'שב' },
    { id: 's4', name: 'ת. אבני',   school: 'בית ספר דמוקרטי האלה',       grade: 'כיתה ג׳', subject_track: 'חינוך מיוחד', status: 'in_progress',  initials: 'תא' },
    { id: 's5', name: 'א. שמיר',   school: 'בית ספר מאמן · רב-תרבותי',   grade: 'כיתה ד׳', subject_track: 'רב-תחומי',    status: 'not_started',  initials: 'אש' },
    { id: 's6', name: 'ר. פרץ',    school: 'בית ספר יסודי הרצוג',        grade: 'כיתה ו׳', subject_track: 'לשון ומקרא',  status: 'pending',      initials: 'רפ' },
  ];

  // Lesson plan cycles for s1
  const lpCycles = [
    { id:'lp1', student_id:'s1', track_type:'lesson_plan', topic:'חלוקה ארוכה — שיעור פתיחה', subject:'מתמטיקה', date:null, status:'complete', position:1 },
    { id:'lp2', student_id:'s1', track_type:'lesson_plan', topic:'הרצל וחזון מדינת היהודים', subject:'מולדת',    date:null, status:'complete', position:2 },
    { id:'lp3', student_id:'s1', track_type:'lesson_plan', topic:'שירת מולדת — אנליזה',        subject:'ספרות',   date:null, status:'awaiting_revision', position:3 },
    { id:'lp4', student_id:'s1', track_type:'lesson_plan', topic:'מבנה הסיפור — היכרות',       subject:'ספרות',   date:null, status:'in_review', position:4 },
  ];

  // Observation cycles for s1
  const obCycles = [
    { id:'ob1', student_id:'s1', track_type:'observation', topic:'תצפית 1 — שיעור פתיחת שנה', subject:null, date:'12.10', status:'complete', position:1 },
    { id:'ob2', student_id:'s1', track_type:'observation', topic:'תצפית 2 — מתמטיקה כיתה ד׳', subject:null, date:'04.11', status:'complete', position:2 },
    { id:'ob3', student_id:'s1', track_type:'observation', topic:'תצפית 3 — שיעור הרצל',       subject:null, date:'04.12', status:'complete', position:3 },
  ];

  const stages = [
    // lp1
    { id:'st1',  cycle_id:'lp1', stage_key:'submission',      done:1, date:'04.11', summary:null, days_waiting:null },
    { id:'st2',  cycle_id:'lp1', stage_key:'instructorNotes', done:1, date:'07.11', summary:'להעמיק שלבי האלגוריתם, להוסיף דוגמה הפוכה', days_waiting:null },
    { id:'st3',  cycle_id:'lp1', stage_key:'revision',        done:1, date:'14.11', summary:null, days_waiting:null },
    // lp2
    { id:'st4',  cycle_id:'lp2', stage_key:'submission',      done:1, date:'20.11', summary:null, days_waiting:null },
    { id:'st5',  cycle_id:'lp2', stage_key:'instructorNotes', done:1, date:'23.11', summary:'מצוין — להוסיף שאלת פתיחה אקטיבית', days_waiting:null },
    { id:'st6',  cycle_id:'lp2', stage_key:'revision',        done:1, date:'27.11', summary:null, days_waiting:null },
    // lp3
    { id:'st7',  cycle_id:'lp3', stage_key:'submission',      done:1, date:'10.12', summary:null, days_waiting:null },
    { id:'st8',  cycle_id:'lp3', stage_key:'instructorNotes', done:1, date:'14.12', summary:'לחזק את הקישור לטקסט המקור', days_waiting:null },
    { id:'st9',  cycle_id:'lp3', stage_key:'revision',        done:0, date:null,    summary:null, days_waiting:9 },
    // lp4
    { id:'st10', cycle_id:'lp4', stage_key:'submission',      done:1, date:'08.01', summary:null, days_waiting:null },
    { id:'st11', cycle_id:'lp4', stage_key:'instructorNotes', done:0, date:null,    summary:null, days_waiting:3 },
    { id:'st12', cycle_id:'lp4', stage_key:'revision',        done:0, date:null,    summary:null, days_waiting:null },
    // ob1
    { id:'st13', cycle_id:'ob1', stage_key:'observation', done:1, date:'12.10', summary:'התרשמות ראשונית: לומדת מהר, ראוי לעקוב אחר תכנון', days_waiting:null },
    { id:'st14', cycle_id:'ob1', stage_key:'feedback',    done:1, date:'14.10', summary:null, days_waiting:null },
    { id:'st15', cycle_id:'ob1', stage_key:'reflection',  done:1, date:'18.10', summary:null, days_waiting:null },
    // ob2
    { id:'st16', cycle_id:'ob2', stage_key:'observation', done:1, date:'04.11', summary:'ניהול כיתה רגוע, יש לחזק העברה בין שלבים', days_waiting:null },
    { id:'st17', cycle_id:'ob2', stage_key:'feedback',    done:1, date:'07.11', summary:null, days_waiting:null },
    { id:'st18', cycle_id:'ob2', stage_key:'reflection',  done:1, date:'11.11', summary:null, days_waiting:null },
    // ob3
    { id:'st19', cycle_id:'ob3', stage_key:'observation', done:1, date:'04.12', summary:'נוכחות כיתתית מצוינת. אלתור מרשים אחרי תקלת מקרן', days_waiting:null },
    { id:'st20', cycle_id:'ob3', stage_key:'feedback',    done:1, date:'06.12', summary:null, days_waiting:null },
    { id:'st21', cycle_id:'ob3', stage_key:'reflection',  done:1, date:'12.12', summary:null, days_waiting:null },
  ];

  const txn = db.transaction(() => {
    for (const s of students) insertStudent.run(s);
    for (const c of [...lpCycles, ...obCycles]) insertCycle.run(c);
    for (const st of stages) insertStage.run(st);
  });
  txn();

  console.log('✓ Database seeded with anonymised students');
}

seed();

// ─── Query helpers ─────────────────────────────────────────────────────────────

const q = {
  allStudents: () => db.prepare('SELECT * FROM students ORDER BY created_at').all(),

  student: (id) => db.prepare('SELECT * FROM students WHERE id = ?').get(id),

  studentWithCycles: (id) => {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) return null;
    const cycles = db.prepare('SELECT * FROM cycles WHERE student_id = ? ORDER BY position').all(id);
    for (const c of cycles) {
      c.stages = db.prepare('SELECT * FROM stages WHERE cycle_id = ? ORDER BY rowid').all(c.id);
      c.files  = db.prepare('SELECT id, original_name, file_type, uploaded_at FROM files WHERE cycle_id = ?').all(c.id);
    }
    student.cycles = cycles;
    student.lessonProgress = progressFor(cycles, 'lesson_plan');
    student.observationProgress = progressFor(cycles, 'observation');
    return student;
  },

  evaluation: (studentId) =>
    db.prepare('SELECT * FROM evaluations WHERE student_id = ? ORDER BY created_at DESC LIMIT 1').get(studentId),

  createEvaluation: (studentId) => {
    const id = 'ev_' + Date.now();
    db.prepare(`
      INSERT INTO evaluations (id, student_id) VALUES (?, ?)
    `).run(id, studentId);
    return db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id);
  },

  updateEvaluation: (id, fields) => {
    const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE evaluations SET ${sets}, updated_at = datetime('now') WHERE id = @id`)
      .run({ id, ...fields });
  },

  upsertEvaluation: (studentId, draftJson, score) => {
    let ev = db.prepare('SELECT * FROM evaluations WHERE student_id = ?').get(studentId);
    if (!ev) {
      ev = q.createEvaluation(studentId);
    }
    q.updateEvaluation(ev.id, { draft_json: JSON.stringify(draftJson), score, status: 'draft' });
    return db.prepare('SELECT * FROM evaluations WHERE id = ?').get(ev.id);
  },

  saveFile: (file) => {
    db.prepare(`
      INSERT INTO files (id, student_id, cycle_id, stage_key, original_name, stored_path, parsed_text, file_type)
      VALUES (@id, @student_id, @cycle_id, @stage_key, @original_name, @stored_path, @parsed_text, @file_type)
    `).run(file);
  },

  studentFiles: (studentId) =>
    db.prepare('SELECT * FROM files WHERE student_id = ?').all(studentId),

  updateStudentStatus: (id, status) =>
    db.prepare('UPDATE students SET status = ? WHERE id = ?').run(status, id),

  updateStageFile: (cycleId, stageKey, fileId, date, summary) =>
    db.prepare(`
      UPDATE stages SET done = 1, date = ?, summary = ? WHERE cycle_id = ? AND stage_key = ?
    `).run(date || new Date().toLocaleDateString('he-IL').replace(/\//g,'.'), summary || null, cycleId, stageKey),

  userByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),

  allRubrics: () => db.prepare('SELECT * FROM rubrics ORDER BY created_at DESC').all().map(r => ({
    ...r, criteria: JSON.parse(r.criteria || '[]')
  })),

  rubric: (id) => {
    const r = db.prepare('SELECT * FROM rubrics WHERE id = ?').get(id);
    if (!r) return null;
    return { ...r, criteria: JSON.parse(r.criteria || '[]') };
  },

  createRubric: ({ name, description, semester, total_points, criteria, instructor_id }) => {
    const id = 'r_' + Date.now();
    db.prepare(`INSERT INTO rubrics (id,name,description,semester,total_points,criteria,instructor_id) VALUES (?,?,?,?,?,?,?)`)
      .run(id, name, description || '', semester || '', total_points ?? null, JSON.stringify(criteria || []), instructor_id || null);
    return q.rubric(id);
  },

  updateRubric: (id, { name, description, semester, total_points, criteria }) => {
    const sets = [];
    const vals = [];
    if (name !== undefined)        { sets.push('name = ?');        vals.push(name); }
    if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
    if (semester !== undefined)    { sets.push('semester = ?');    vals.push(semester); }
    if (total_points !== undefined){ sets.push('total_points = ?');vals.push(total_points); }
    if (criteria !== undefined)    { sets.push('criteria = ?');    vals.push(JSON.stringify(criteria)); }
    if (sets.length === 0) return;
    db.prepare(`UPDATE rubrics SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id);
  },

  deleteRubric: (id) => db.prepare('DELETE FROM rubrics WHERE id = ?').run(id),

  bulkInsertStudents: (students) => {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO students (id, name, school, grade, subject_track, status, initials)
      VALUES (@id, @name, @school, @grade, @subject_track, @status, @initials)
    `);
    const txn = db.transaction((rows) => { for (const r of rows) insert.run(r); });
    txn(students);
  },
};

function progressFor(cycles, trackType) {
  const subset = cycles.filter(c => c.track_type === trackType);
  return { complete: subset.filter(c => c.status === 'complete').length, total: subset.length };
}

module.exports = { db, q };
