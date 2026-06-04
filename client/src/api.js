// HTTP client — replaces Supabase. Token stored in localStorage.

const BASE = '/api';

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

async function apiFetch(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: authHeaders(opts.headers || {}),
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
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

export async function createStudent({ name, school, grade, subjectTrack }) {
  return apiFetch('/students', {
    method: 'POST',
    body: JSON.stringify({ name, school, grade, subject_track: subjectTrack }),
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
export async function uploadFile(studentId, file, cycleId, stageKey, description) {
  const token = getToken();
  const form = new FormData();
  if (file) form.append('file', file);
  form.append('student_id', studentId);
  if (cycleId)  form.append('cycle_id', cycleId);
  if (stageKey) form.append('stage_key', stageKey);
  if (description) form.append('description', description);

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
export async function analyze(studentId, instructorAnswers) {
  return apiFetch('/evaluations/analyze', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, instructor_answers: instructorAnswers }),
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
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `evaluation-${evalId}.${format === 'pdf' ? 'pdf' : 'doc'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
