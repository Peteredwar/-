'use strict';
/* ================================================================
   STUDENT EXAM — JavaScript
   ⚠️  SECURITY NOTE: This is a front-end-only project.
   Correct answers are stored obfuscated in sessionStorage, but a
   determined user can still inspect them via DevTools.
   Complete answer protection requires a backend server.
   The Google Sheets URL is also front-end-only — use a backend
   proxy in production for real security.
   ================================================================ */

// ════════════════════════════════════════
// ⚙️  Settings are now managed from the admin panel
// (⚙️ الإعدادات page) and read from localStorage at runtime —
// no need to edit this file directly anymore.
// ════════════════════════════════════════
function _getSettings() {
  try { return JSON.parse(localStorage.getItem('admin_settings') || '{}'); } catch { return {}; }
}

// ════════════════════════════════════════
// State
// ════════════════════════════════════════
let _exam       = null;
let _answers    = {};
let _timeLeft   = 0;
let _timerID    = null;
let _startedAt  = null;
let _studentCode = '';
let _studentName = '';
let _studentGroup = '';
let _submitted  = false;
let _isPreview  = false;

// ════════════════════════════════════════
// Boot
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  _isPreview = new URLSearchParams(location.search).get('preview') === '1';
  _studentCode = sessionStorage.getItem('ep_preview_code') ||
                 sessionStorage.getItem('courseAccessCode') || '—';

  const examId = _isPreview
    ? sessionStorage.getItem('ep_preview_id')
    : sessionStorage.getItem('ep_active_exam_id');

  if (!examId) { show('examBlocked'); hide('examLoading'); return; }

  // Block permanently (across browser sessions/devices reuse of the
  // same student code) if this student already has a recorded attempt
  // for this exam — whether they finished it or left it early.
  if (!_isPreview) {
    const prior = getAttempt(_studentCode, examId);
    if (prior) {
      showBlockedFor(prior);
      hide('examLoading');
      return;
    }
  }

  try {
    const all = JSON.parse(localStorage.getItem('admin_exams') || '[]');
    _exam = all.find(e => e.id === examId) || null;
  } catch { _exam = null; }

  if (!_exam || !_exam.questions || !_exam.questions.length) {
    show('examBlocked'); hide('examLoading'); return;
  }

  // Capacity limit check (defense in depth — course.html already hides
  // the button once full, but a direct link could still bypass that)
  if (!_isPreview && _exam.capacity) {
    const attempts = loadAttempts();
    const count = Object.values(attempts).filter(a => a.examId === _exam.id && a.status === 'completed').length;
    if (count >= _exam.capacity) {
      show('examBlocked'); hide('examLoading');
      const title = document.getElementById('examBlockedTitle');
      const msg1  = document.getElementById('examBlockedMsg1');
      const msg2  = document.getElementById('examBlockedMsg2');
      if (title) title.textContent = 'اكتمل العدد المسموح لهذا الامتحان';
      if (msg1)  msg1.textContent  = 'وصل عدد الطلاب اللي دخلوا الامتحان ده للحد الأقصى المسموح.';
      if (msg2)  msg2.textContent  = 'كلم المستر لو فيه استفسار.';
      return;
    }
  }

  setTimeout(() => {
    hide('examLoading');
    if (_isPreview) { startExam(); return; }
    show('examInfoGate');
  }, 1200);
  installSecurityHooks();
});

/* ── Student info gate (name + group required before starting) ── */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('examInfoForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl  = document.getElementById('fStudentName');
    const groupEl = document.getElementById('fStudentGroup');
    const name  = (nameEl.value || '').trim();
    const group = (groupEl.value || '').trim();
    if (!name || !group) {
      document.getElementById('infoGateError').classList.add('show');
      return;
    }
    document.getElementById('infoGateError').classList.remove('show');
    _studentName  = name;
    _studentGroup = group;
    hide('examInfoGate');
    startExam();
  });
});

function showBlockedFor(prior) {
  show('examBlocked');
  const title = document.getElementById('examBlockedTitle');
  const msg1  = document.getElementById('examBlockedMsg1');
  const msg2  = document.getElementById('examBlockedMsg2');
  if (prior.status === 'completed') {
    if (title) title.textContent = 'تم تسليم هذا الامتحان من قبل';
    if (msg1)  msg1.textContent  = `درجتك: ${prior.score} من ${prior.total}`;
    if (msg2)  msg2.textContent  = 'لا يمكن دخول هذا الامتحان مرة أخرى.';
  } else {
    if (title) title.textContent = 'تم إلغاء هذا الامتحان';
    if (msg1)  msg1.textContent  = 'غادرت الامتحان قبل تسليمه، فتم إلغاؤه تلقائيًا.';
    if (msg2)  msg2.textContent  = 'لا يمكن إعادة الدخول لهذا الامتحان.';
  }
}

// ════════════════════════════════════════
// Start
// ════════════════════════════════════════
function startExam() {
  hide('examLoading');
  show('examActive');

  document.getElementById('examBarTitle').textContent = _exam.name || 'الامتحان';
  _timeLeft = (_exam.duration || 30) * 60;
  _startedAt = Date.now();
  _answers = {};

  renderStudentQuestions();
  updateProgress();
  startTimer();

  document.getElementById('btnSubmitExam').addEventListener('click', () => {
    const answered = Object.keys(_answers).length;
    const total    = _exam.questions.length;
    const msg = answered < total
      ? `لم تجب على ${total - answered} سؤال بعد. هل تريد التسليم الآن؟`
      : 'هل تريد تسليم الامتحان الآن؟';
    showSubmitConfirm(msg);
  });

  document.getElementById('submitConfirmOk').addEventListener('click', () => {
    hide('submitConfirm');
    submitExam(false);
  });
  document.getElementById('submitConfirmCancel').addEventListener('click', () => {
    hide('submitConfirm');
  });
}

// ════════════════════════════════════════
// Render questions
// ════════════════════════════════════════
function renderStudentQuestions() {
  const letters = ['A','B','C','D','E'];
  const container = document.getElementById('examQuestions');
  container.innerHTML = _exam.questions.map((q, qi) => `
    <div class="student-question" id="sq_${qi}">
      <div class="student-q-header">
        <span class="student-q-num">${qi + 1}</span>
        <div>
          <div class="student-q-text">${escHtml(q.text)}</div>
          <div class="student-q-marks">(${q.marks || 1} درجة)</div>
        </div>
      </div>
      <div class="student-choices">
        ${(q.choices || []).map((c, ci) => `
          <label class="student-choice" id="sc_${qi}_${ci}">
            <input type="radio" name="q_${qi}" value="${ci}" style="display:none"/>
            <span class="choice-letter">${letters[ci] || (ci+1)}</span>
            <span>${escHtml(c)}</span>
          </label>`).join('')}
      </div>
    </div>`).join('');

  // Bind selections
  container.querySelectorAll('.student-choice').forEach(label => {
    label.addEventListener('click', () => {
      const radio = label.querySelector('input[type="radio"]');
      if (!radio) return;
      const [, qi, ci] = label.id.split('_').map(Number);

      // Deselect siblings
      document.querySelectorAll(`input[name="q_${qi}"]`).forEach(r => {
        r.closest('.student-choice').classList.remove('selected');
      });

      radio.checked = true;
      label.classList.add('selected');
      _answers[qi] = ci;
      document.getElementById('sq_' + qi)?.classList.add('answered');
      updateProgress();
    });
  });
}

// ════════════════════════════════════════
// Timer
// ════════════════════════════════════════
function startTimer() {
  renderTimer();
  _timerID = setInterval(() => {
    _timeLeft--;
    renderTimer();
    if (_timeLeft <= 0) { clearInterval(_timerID); submitExam(true); }
  }, 1000);
}

function renderTimer() {
  const m = String(Math.floor(Math.max(0, _timeLeft) / 60)).padStart(2, '0');
  const s = String(Math.max(0, _timeLeft) % 60).padStart(2, '0');
  const el = document.getElementById('timerDisplay');
  const wrap = document.getElementById('examTimer');
  if (el) el.textContent = `${m}:${s}`;
  wrap.classList.toggle('warning', _timeLeft <= 300 && _timeLeft > 60);
  wrap.classList.toggle('danger',  _timeLeft <= 60);
}

// ════════════════════════════════════════
// Progress
// ════════════════════════════════════════
function updateProgress() {
  const answered = Object.keys(_answers).length;
  const total    = _exam.questions.length;
  const el = document.getElementById('examProgress');
  if (el) el.textContent = `${answered} / ${total}`;
}

// ════════════════════════════════════════
// Submit
// ════════════════════════════════════════
function submitExam(auto) {
  if (_submitted) return;
  _submitted = true;
  clearInterval(_timerID);

  if (!_isPreview) {
    sessionStorage.setItem('ep_exam_done', '1');
    sessionStorage.removeItem('ep_active_exam_id');
  }
  // Grade
  let score = 0;
  let total = 0;
  _exam.questions.forEach((q, qi) => {
    const marks = q.marks || 1;
    total += marks;
    if (_answers[qi] !== undefined && _answers[qi] === q.correctIndex) {
      score += marks;
    }
  });

  const pct      = total > 0 ? Math.round((score / total) * 100) : 0;
  const elapsed  = Math.floor((Date.now() - _startedAt) / 1000);
  const mm       = String(Math.floor(elapsed / 60)).padStart(2,'0');
  const ss       = String(elapsed % 60).padStart(2,'0');
  const timeSpent = `${mm}:${ss}`;
  const now      = new Date();

  // Persist a permanent "completed" record — blocks any future attempt
  // by this same student code on this exam, even after closing the browser.
  saveAttempt(_exam.id, 'completed', { score, total, pct, timeSpent, submittedAt: Date.now(), auto });

  // Silent send to Google Sheets
  _sendResults({
    name:      _studentName,
    group:     _studentGroup,
    code:      _studentCode,
    examName:  _exam.name || '—',
    score,
    total,
    pct,
    date:      now.toLocaleDateString('ar-EG'),
    time:      now.toLocaleTimeString('ar-EG'),
    timeSpent
  });

  // Open a pre-filled WhatsApp message to the teacher (one tap to send —
  // browsers don't allow fully silent WhatsApp sending)
  _sendWhatsapp({ name: _studentName, group: _studentGroup, examName: _exam.name || '—', score, total, pct, date: now.toLocaleDateString('ar-EG') });

  // Show result screen
  hide('examActive');
  showResult(score, total, pct, timeSpent);
}

// ════════════════════════════════════════
// Result screen
// ════════════════════════════════════════
function showResult(score, total, pct, timeSpent) {
  show('examResult');

  document.getElementById('resultScore').textContent = score;
  document.getElementById('resultTotal').textContent = total;
  document.getElementById('resultPct').textContent   = pct + '%';
  document.getElementById('resultTime').textContent  = timeSpent;

  const iconEl  = document.getElementById('resultIcon');
  const gradeEl = document.getElementById('resultGrade');

  let grade, gradeClass;
  if (pct >= 85)      { grade = 'ممتاز'; gradeClass = 'grade-a'; iconEl.className = 'result-icon pass'; }
  else if (pct >= 70) { grade = 'جيد جدًا'; gradeClass = 'grade-b'; iconEl.className = 'result-icon pass'; }
  else if (pct >= 55) { grade = 'جيد'; gradeClass = 'grade-c'; iconEl.className = 'result-icon pass'; }
  else                { grade = 'يحتاج مراجعة'; gradeClass = 'grade-d'; iconEl.innerHTML = '<i class="fas fa-redo"></i>'; iconEl.className = 'result-icon fail'; }

  gradeEl.textContent = grade;
  gradeEl.className   = 'result-grade ' + gradeClass;
}

// ════════════════════════════════════════
// Persistent attempt tracking
// Key: studentCode__examId → { status:'completed'|'left', score, total, ... }
// Stored in localStorage so it survives closing the browser/tab —
// unlike sessionStorage, which only blocks retakes within the same tab.
// ════════════════════════════════════════
function attemptsKey(code, examId) { return code + '__' + examId; }

function loadAttempts() {
  try { return JSON.parse(localStorage.getItem('exam_attempts') || '{}'); } catch { return {}; }
}

function getAttempt(code, examId) {
  return loadAttempts()[attemptsKey(code, examId)] || null;
}

function saveAttempt(examId, status, extra) {
  if (_isPreview) return;
  const attempts = loadAttempts();
  attempts[attemptsKey(_studentCode, examId)] = Object.assign({
    studentCode: _studentCode,
    studentName: _studentName,
    studentGroup: _studentGroup,
    examId,
    courseId: _exam ? _exam.courseId : null,
    examName: _exam ? (_exam.name || '') : '',
    status,
    recordedAt: Date.now()
  }, extra || {});
  localStorage.setItem('exam_attempts', JSON.stringify(attempts));
}

// ════════════════════════════════════════
// Silent Google Sheets send
// ════════════════════════════════════════
function _sendResults(data) {
  const url = _getSettings().sheetUrl;
  if (!url) return; // not configured yet from the ⚙️ settings page
  try {
    const payload = {
      method: 'POST',
      mode:   'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
    fetch(url, payload).catch(() => {});
  } catch (_) {}
}

// ════════════════════════════════════════
// WhatsApp result message (opens a pre-filled chat — the teacher's
// number comes from ⚙️ الإعدادات. One tap ("send") is still required
// on the student's phone, since browsers can't send WhatsApp messages
// with zero interaction.)
// ════════════════════════════════════════
function _sendWhatsapp({ name, group, examName, score, total, pct, date }) {
  const phone = _getSettings().whatsapp;
  if (!phone) return; // not configured yet
  const lines = [
    `📝 نتيجة امتحان جديدة`,
    `الاسم: ${name}`,
    `المجموعة: ${group}`,
    `الامتحان: ${examName}`,
    `الدرجة: ${score} من ${total} (${pct}%)`,
    `التاريخ: ${date}`
  ];
  const text = encodeURIComponent(lines.join('\n'));
  try { window.open(`https://wa.me/${phone}?text=${text}`, '_blank'); } catch (_) {}
}

// ════════════════════════════════════════
// Security hooks
// ════════════════════════════════════════
function installSecurityHooks() {
  // Right-click
  document.addEventListener('contextmenu', e => e.preventDefault());
  // Copy / paste / cut
  document.addEventListener('copy',  e => e.preventDefault());
  document.addEventListener('paste', e => e.preventDefault());
  document.addEventListener('cut',   e => e.preventDefault());
  // Common keyboard shortcuts
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && ['c','v','x','a','s','p','u'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
    if (e.key === 'F12') e.preventDefault();
  });

  // Leave / close / refresh → cancel exam
  if (!_isPreview) {
    window.addEventListener('beforeunload', cancelExam);
    window.addEventListener('pagehide',     cancelExam);

    // Visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !_submitted) cancelExam();
    });
  }
}

function cancelExam() {
  if (_submitted || _isPreview) return;
  sessionStorage.setItem('ep_exam_done', '1');
  sessionStorage.removeItem('ep_active_exam_id');
  if (_exam) saveAttempt(_exam.id, 'left', { leftAt: Date.now() });
}

// ════════════════════════════════════════
// UI Helpers
// ════════════════════════════════════════
function show(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none';  }

function showSubmitConfirm(msg) {
  document.getElementById('submitConfirmMsg').textContent = msg;
  document.getElementById('submitConfirm').style.display = 'flex';
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
