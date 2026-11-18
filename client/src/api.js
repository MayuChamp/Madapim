// HTTP client — replaces Supabase. Token stored in localStorage.

const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function getToken() {
  return localStorage.getItem('auth_token');
}

function setToken(token) {
  if (token) localStorage.setItem('auth_token', token);
  else localStorage.removeItem('auth_token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// Fired when the server rejects the session (expired, or the account was
// deleted) so the app can return to the login screen.
export const SESSION_EXPIRED_EVENT = 'madapim:session-expired';

async function apiFetch(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: authHeaders(opts.headers || {}),
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && getToken() && !path.startsWith('/auth/login')) {
      setToken(null);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

// ─── Set-password links (invitation / reset) ──────────────────────────────────
export function setPasswordUrl(token) {
  return `${window.location.origin}/set-password#${token}`;
}

export function readSetPasswordToken() {
  if (window.location.pathname !== '/set-password') return null;
  return decodeURIComponent(window.location.hash.slice(1)) || '';
}

export async function checkSetPasswordLink(token) {
  return apiFetch('/auth/check-link', { method: 'POST', body: JSON.stringify({ token }) });
}

export async function setPasswordWithLink(token, password) {
  const data = await apiFetch('/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function updateProfile(name, email) {
  const data = await apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, email }),
  });
  if (data.token) setToken(data.token);
  return data.user;
}

export async function changePassword(currentPassword, newPassword) {
  return apiFetch('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteCycle(studentId, cycleId) {
  return apiFetch(`/students/${studentId}/cycles/${cycleId}`, { method: 'DELETE' });
}

export async function addCycle(studentId, trackType) {
  return apiFetch(`/students/${studentId}/cycles`, {
    method: 'POST',
    body: JSON.stringify({ trackType }),
  });
}

export async function getProgramSettings() {
  return apiFetch('/auth/program-settings');
}

export async function updateProgramSettings({ maxLessonPlans, maxObservations, planVsExecution }) {
  return apiFetch('/auth/program-settings', {
    method: 'PUT',
    body: JSON.stringify({ maxLessonPlans, maxObservations, planVsExecution }),
  });
}

export function logout() {
  setToken(null);
}

export function hasToken() {
  return !!getToken();
}

// ─── Students ─────────────────────────────────────────────────────────────────
export async function getStudents() {
  return apiFetch('/students');
}

export async function getStudent(id) {
  return apiFetch(`/students/${id}`);
}

export async function deleteStudent(id) {
  return apiFetch(`/students/${id}`, { method: 'DELETE' });
}

// The questions and the evaluation are phrased by the student's gender.
export async function updateStudentGender(studentId, gender) {
  return apiFetch(`/students/${studentId}/gender`, {
    method: 'PUT',
    body: JSON.stringify({ gender }),
  });
}

export async function createStudent({ name, school, grade, subjectTrack, gender, academicYear }) {
  return apiFetch('/students', {
    method: 'POST',
    body: JSON.stringify({ name, school, grade, subject_track: subjectTrack, gender, academic_year: academicYear }),
  });
}

// academicYear: Hebrew year number, e.g. 5787 for תשפ״ז
export async function updateStudentAcademicYear(studentId, academicYear) {
  return apiFetch(`/students/${studentId}/academic-year`, {
    method: 'PUT',
    body: JSON.stringify({ academic_year: academicYear }),
  });
}

export async function importStudentsCSV(csvText) {
  return apiFetch('/students/import', {
    method: 'POST',
    body: JSON.stringify({ csv: csvText }),
  });
}

export async function updateCycleTopic(cycleId, topic) {
  return apiFetch(`/students/cycles/${cycleId}/topic`, {
    method: 'PUT',
    body: JSON.stringify({ topic }),
  });
}

// ─── Files ────────────────────────────────────────────────────────────────────
export async function uploadFile(studentId, file, cycleId, stageKey, description, materialDate) {
  const token = getToken();
  const form = new FormData();
  if (file) form.append('file', file);
  form.append('student_id', studentId);
  if (cycleId)      form.append('cycle_id', cycleId);
  if (stageKey)     form.append('stage_key', stageKey);
  if (description)  form.append('description', description);
  if (materialDate) form.append('material_date', materialDate);

  const res = await fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteFile(fileId) {
  return apiFetch(`/files/${fileId}`, { method: 'DELETE' });
}

export async function getFiles(studentId) {
  return apiFetch(`/files/${studentId}`);
}

// ─── Evaluations ──────────────────────────────────────────────────────────────
// Quick scan before the analysis → the "השלמת מידע" questions for this portfolio.
export async function prescan(studentId, rubricId, evalDateRange) {
  return apiFetch('/evaluations/prescan', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, rubric_id: rubricId, date_range: evalDateRange }),
  });
}

export async function analyze(studentId, instructorAnswers, rubricId, evalDateRange) {
  return apiFetch('/evaluations/analyze', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, instructor_answers: instructorAnswers, rubric_id: rubricId, date_range: evalDateRange }),
  });
}

export async function chatEvaluation(studentId, message, history, draft) {
  return apiFetch(`/evaluations/${studentId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history, draft }),
  });
}

export async function getEvaluation(studentId) {
  return apiFetch(`/evaluations/${studentId}`).catch(() => null);
}

export async function saveEvaluation(evalId, updates) {
  return apiFetch(`/evaluations/${evalId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function exportPdf(evalId, format = 'pdf') {
  const token = getToken();
  const res = await fetch(`${BASE}/evaluations/${evalId}/export?format=${format}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  if (format === 'docx') {
    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-${evalId}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // PDF: load HTML into a hidden iframe via blob URL, then trigger print dialog
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:0;opacity:0';
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 2000);
  };
  iframe.src = url;
}

export async function getEvaluations() {
  return apiFetch('/evaluations');
}

export async function deleteEvaluation(id) {
  return apiFetch(`/evaluations/${id}`, { method: 'DELETE' });
}

// ─── Users (admin) ────────────────────────────────────────────────────────────
export async function getUsers() {
  return apiFetch('/users');
}

// Returns { user, link: { token, expiresInHours } }.
export async function createUser({ name, email, role }) {
  return apiFetch('/users', { method: 'POST', body: JSON.stringify({ name, email, role }) });
}

// Returns { token, expiresInHours, pending }.
export async function createUserLink(id) {
  return apiFetch(`/users/${id}/link`, { method: 'POST' });
}

export async function deleteUser(id) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

// ─── Rubrics ──────────────────────────────────────────────────────────────────
export async function getRubrics() {
  return apiFetch('/rubrics');
}

export async function getRubric(id) {
  return apiFetch(`/rubrics/${id}`);
}

export async function createRubric(data) {
  return apiFetch('/rubrics', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateRubric(id, data) {
  return apiFetch(`/rubrics/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteRubric(id) {
  return apiFetch(`/rubrics/${id}`, { method: 'DELETE' });
}

export async function duplicateRubric(id) {
  return apiFetch(`/rubrics/${id}/duplicate`, { method: 'POST' });
}
