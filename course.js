/* ================================================================
   COURSE PAGE — JavaScript
   Loads videos, books, exams from localStorage
   Written instantly when admin adds content via editors
   ================================================================ */
'use strict';

let _activeCourseId = null;

document.addEventListener('DOMContentLoaded', () => {
  _activeCourseId = sessionStorage.getItem('activeCourseId');

  // Guard: no valid session → send back to pick a course
  if (!_activeCourseId || sessionStorage.getItem('courseAccess') !== '1') {
    window.location.href = './index.html';
    return;
  }

  loadCourseHeader();
  initTabs();
  loadVideos();
  loadBooks();
  loadExams();
  initVideoModal();
  initScrollTop();
});

/* ══ COURSE HEADER (name from the active course) ══════════════ */
function loadCourseHeader() {
  let courses = [];
  try { courses = JSON.parse(localStorage.getItem('admin_courses') || '[]'); } catch {}
  const course = courses.find(c => c.id === _activeCourseId);
  const name = course ? course.name : 'الكورس';
  const titleEl = document.getElementById('courseTopbarTitle');
  const pageTitleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = `${name} — مستر بيتر إدوار`;
  if (pageTitleEl) pageTitleEl.textContent = `${name} — مستر بيتر إدوار`;
}

/* ══ TABS ════════════════════════════════════════════ */
function initTabs() {
  document.querySelectorAll('.course-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.course-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab)?.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ══ VIDEOS ══════════════════════════════════════════ */
function loadVideos() {
  const videos = getData('admin_videos').filter(v => v.courseId === _activeCourseId);
  const wrap   = document.getElementById('videosWrap');
  const empty  = document.getElementById('videosEmpty');
  if (!videos.length) { empty.style.display = 'block'; return; }

  // Group by lesson
  const groups = {};
  videos.forEach(v => {
    const k = v.lesson || 'عام';
    if (!groups[k]) groups[k] = [];
    groups[k].push(v);
  });

  wrap.innerHTML = Object.entries(groups).map(([lesson, vids]) => `
    <div style="margin-bottom:36px">
      <h2 class="lessons-heading"><i class="fas fa-folder-open"></i> ${esc(lesson)}</h2>
      <div class="video-list">
        ${vids.map(v => { const embedUrl = toEmbedUrl(v.url||''); const thumb = v.thumb || driveThumb(v.url); return `
          <div class="video-item video-ready" data-src="${esc(embedUrl)}" style="cursor:${v.url?'pointer':'default'}">
            <div class="video-thumb">
              ${thumb ? `<img src="${esc(thumb)}" alt="${esc(v.title)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>` : ''}
              <div class="video-play-btn"><i class="fas fa-play"></i></div>
              ${!v.url ? '<span class="video-coming">قريبًا</span>' : ''}
            </div>
            <div class="video-info">
              <strong>${esc(v.title)}</strong>
              <span>${esc(lesson)}</span>
            </div>
          </div>`; }).join('')}
      </div>
    </div>`).join('');

  // Click to open modal
  wrap.querySelectorAll('.video-item[data-src]').forEach(item => {
    if (!item.dataset.src) return;
    item.addEventListener('click', () => openVideo(item.dataset.src));
  });
}

/* ══ BOOKS ═══════════════════════════════════════════ */
function loadBooks() {
  const books = getData('admin_books').filter(b => b.courseId === _activeCourseId);
  const grid  = document.getElementById('booksGrid');
  const empty = document.getElementById('booksEmpty');
  if (!books.length) { empty.style.display = 'block'; return; }

  grid.innerHTML = books.map(b => `
    <div class="book-card">
      <div class="book-card-img">
        ${b.imgUrl
          ? `<img src="${esc(b.imgUrl)}" alt="${esc(b.name)}" onerror="this.style.display='none'"/>`
          : '<i class="fas fa-book"></i>'}
      </div>
      <div class="book-card-body">
        <div class="book-card-name">${esc(b.name)}</div>
        ${b.desc ? `<div class="book-card-desc">${esc(b.desc)}</div>` : ''}
        ${b.pdfUrl
          ? `<button class="book-card-btn" onclick="window.open('${esc(b.pdfUrl)}','_blank')">
               <i class="fas fa-download"></i> تحميل PDF
             </button>`
          : `<button class="book-card-btn" disabled><i class="fas fa-clock"></i> قريبًا</button>`}
      </div>
    </div>`).join('');
}

/* ══ EXAMS ═══════════════════════════════════════════ */
function loadExams() {
  const exams = getData('admin_exams').filter(ex => ex.courseId === _activeCourseId);
  const grid  = document.getElementById('examsGrid');
  const empty = document.getElementById('examsEmpty');
  if (!exams.length) { empty.style.display = 'block'; return; }

  grid.innerHTML = exams.map(ex => {
    const full = examIsFull(ex);
    return `
    <div class="exam-launch-card">
      <div class="exam-launch-icon"><i class="fas fa-file-alt"></i></div>
      <div class="exam-launch-name">${esc(ex.name||'امتحان')}</div>
      <div class="exam-launch-meta">
        <span><i class="fas fa-question-circle"></i> ${ex.questions?.length||0} سؤال</span>
        <span><i class="fas fa-clock"></i> ${ex.duration||0} دقيقة</span>
        <span><i class="fas fa-star"></i> ${ex.totalMarks||0} درجة</span>
      </div>
      ${full
        ? `<button class="exam-launch-btn" disabled style="opacity:.55;cursor:not-allowed"><i class="fas fa-ban"></i> اكتمل العدد المسموح</button>`
        : `<button class="exam-launch-btn" data-id="${ex.id}"><i class="fas fa-play"></i> ابدأ الامتحان</button>`}
    </div>`;
  }).join('');

  grid.querySelectorAll('.exam-launch-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      sessionStorage.setItem('ep_active_exam_id', btn.dataset.id);
      sessionStorage.removeItem('ep_exam_done');
      window.location.href = './exam-student.html';
    });
  });
}

/* Counts completed attempts for an exam against its optional capacity limit */
function examIsFull(ex) {
  if (!ex.capacity) return false;
  let attempts = {};
  try { attempts = JSON.parse(localStorage.getItem('exam_attempts') || '{}'); } catch {}
  const count = Object.values(attempts).filter(a => a.examId === ex.id && a.status === 'completed').length;
  return count >= ex.capacity;
}

/* ══ VIDEO MODAL ═════════════════════════════════════ */
function initVideoModal() {
  const modal    = document.getElementById('videoModal');
  const frame    = document.getElementById('videoFrame');
  const closeBtn = document.getElementById('videoModalClose');
  if (!modal) return;

  const close = () => {
    modal.classList.remove('open');
    frame.src = '';
    document.body.classList.remove('no-scroll');
  };

  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', e => e.target === modal && close());
  document.addEventListener('keydown', e => e.key === 'Escape' && close());
  window._openVideo = src => {
    frame.src = src;
    modal.classList.add('open');
    document.body.classList.add('no-scroll');
  };
}

function openVideo(src) {
  if (!src) return;
  if (window._openVideo) window._openVideo(src);
}

/* ══ SCROLL TOP ══════════════════════════════════════ */
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 300), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ══ HELPERS ═════════════════════════════════════════ */
function getData(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Google Drive share-link support: paste the normal "share" link and
   it auto-converts to an embeddable preview + thumbnail. */
function driveFileId(url) {
  if (!url) return null;
  let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return null;
}
function toEmbedUrl(url) {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}
function driveThumb(url) {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w500` : null;
}
