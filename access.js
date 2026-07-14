/* ================================================================
   ACCESS CODE PAGE — JAVASCRIPT
   ⚠️  SECURITY NOTICE:
   This is a front-end only project (no backend/server). Course data,
   including the access code, lives in localStorage and is technically
   readable by anyone who opens DevTools on this page. There is no way
   to fully hide it without a real backend. This code still blocks
   casual/accidental access, which is normally enough for a small
   class of students.
   ================================================================ */

'use strict';

let _course = null;

document.addEventListener('DOMContentLoaded', () => {

  const form      = document.getElementById('accessForm');
  const input     = document.getElementById('accessCodeInput');
  const errorBox  = document.getElementById('accessError');
  const errorText = document.getElementById('accessErrorText');
  const titleEl   = document.getElementById('accessCourseTitle');
  const subEl     = document.getElementById('accessCourseSub');
  if (!form || !input) return;

  /* ── Find which course this page is for ─────────────────────── */
  const courseId = new URLSearchParams(location.search).get('course');
  let courses = [];
  try { courses = JSON.parse(localStorage.getItem('admin_courses') || '[]'); } catch {}
  _course = courses.find(c => c.id === courseId) || null;

  if (!_course) {
    titleEl.textContent = 'الكورس غير موجود';
    subEl.textContent   = 'تأكد من الرابط، أو ارجع للصفحة الرئيسية واختر الكورس من هناك';
    form.style.display  = 'none';
    return;
  }

  titleEl.textContent = _course.name;
  subEl.textContent   = `أدخل كود الدخول للوصول إلى "${_course.name}"`;

  /* Live sanitisation: uppercase + alphanumeric only */
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    input.classList.remove('error', 'success');
    errorBox.classList.remove('show');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const code = input.value.trim().toUpperCase();

    if (!code) {
      _showErr('من فضلك أدخل كود الدخول');
      _shake();
      return;
    }

    const btn = form.querySelector('.access-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق…'; }

    const ok = code === (_course.code || '').toUpperCase() ||
               (_course.codes || []).some(c => c.toUpperCase() === code);

    if (!ok) {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-unlock"></i> دخول الكورس'; }
      _showErr('كود الدخول غير صحيح، حاول مرة أخرى');
      _shake();
      return;
    }

    /* Grant access to THIS course only */
    input.classList.add('success');
    errorBox.classList.remove('show');
    try {
      sessionStorage.setItem('courseAccess', '1');
      sessionStorage.setItem('activeCourseId', _course.id);
      sessionStorage.setItem('courseAccessCode', code);
    } catch(_) {}

    if (btn) btn.innerHTML = '<i class="fas fa-check"></i> تم التحقق…';
    setTimeout(() => { window.location.href = './course.html'; }, 600);
  });

  function _showErr(msg) {
    errorText.textContent = msg;
    errorBox.classList.add('show');
    input.classList.add('error');
  }

  function _shake() {
    input.classList.remove('error');
    void input.offsetWidth;
    input.classList.add('error');
  }

});
