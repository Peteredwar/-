
'use strict';
const teacherName = "بيتر إدوار";
const teacherPhone = "201226566779"; 
const teacherWhatsapp = "201226566779"; 
const teacherFacebook = ""; 
const coursePDF1 = "";
const coursePDF2 = "";
document.addEventListener('DOMContentLoaded', () => {
 initLoader();
 initTheme();
 initNavbar();
 initMobileMenu();
 initScrollReveal();
 initCounters();
 initGalleryLightbox();
 initScrollTop();
 initActiveNav();
 initFooterYear();
 initTeacherPhoto();
 initContactLinks();
});
function initLoader() {
 const loader = document.getElementById('loader');
 if (!loader) return;
 document.body.classList.add('no-scroll');
 setTimeout(() => {
 loader.classList.add('hidden');
 document.body.classList.remove('no-scroll');
 }, 2000);
}
function initTheme() {
 const btn = document.getElementById('themeToggle');
 const icon = document.getElementById('themeIcon');
 applyTheme(localStorage.getItem('siteTheme') || 'light');
 btn && btn.addEventListener('click', () =>
 applyTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark')
 );
 function applyTheme(t) {
 document.body.classList.toggle('dark-mode', t === 'dark');
 document.body.classList.toggle('light-mode', t !== 'dark');
 if (icon) icon.className = t === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
 if (btn) btn.setAttribute('aria-label', t === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');
 localStorage.setItem('siteTheme', t);
 }
}
function initNavbar() {
 const nav = document.getElementById('navbar');
 if (!nav) return;
 const fn = () => nav.classList.toggle('scrolled', window.scrollY > 40);
 window.addEventListener('scroll', fn, { passive: true });
 fn();
}
function initMobileMenu() {
 const hbg = document.getElementById('hamburger');
 const menu = document.getElementById('mobileMenu');
 if (!hbg || !menu) return;
 hbg.addEventListener('click', () => {
 const open = menu.classList.toggle('open');
 hbg.classList.toggle('open', open);
 hbg.setAttribute('aria-expanded', String(open));
 document.body.classList.toggle('no-scroll', open);
 });
 document.addEventListener('click', (e) => {
 if (!hbg.contains(e.target) && !menu.contains(e.target)) _closeMenu();
 });
}
function closeMobileMenu() { _closeMenu(); }
function _closeMenu() {
 const hbg = document.getElementById('hamburger');
 const menu = document.getElementById('mobileMenu');
 if (!menu) return;
 menu.classList.remove('open');
 if (hbg) { hbg.classList.remove('open'); hbg.setAttribute('aria-expanded', 'false'); }
 document.body.classList.remove('no-scroll');
}
function initScrollReveal() {
 const els = document.querySelectorAll('.reveal-up, .reveal-right, .reveal-left');
 if (!els.length) return;
 const obs = new IntersectionObserver((entries) => {
 entries.forEach(e => {
 if (!e.isIntersecting) return;
 const delay = parseInt(e.target.dataset.delay || 0, 10);
 setTimeout(() => e.target.classList.add('visible'), delay);
 obs.unobserve(e.target);
 });
 }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
 els.forEach(el => obs.observe(el));
}
function initCounters() {
 const counters = document.querySelectorAll('.stat-num[data-target]');
 if (!counters.length) return;
 const obs = new IntersectionObserver((entries) => {
 entries.forEach(e => {
 if (!e.isIntersecting || e.target.dataset.done) return;
 e.target.dataset.done = '1';
 _countUp(e.target);
 obs.unobserve(e.target);
 });
 }, { threshold: 0.5 });
 counters.forEach(el => obs.observe(el));
}
function _countUp(el) {
 const target = parseInt(el.dataset.target, 10);
 const suffix = el.dataset.suffix || '+';
 const t0 = performance.now();
 const dur = 2000;
 const tick = (now) => {
 const p = Math.min((now - t0) / dur, 1);
 const v = Math.floor((1 - Math.pow(1 - p, 3)) * target);
 el.textContent = v.toLocaleString('ar-EG') + (p >= 1 ? suffix : '');
 if (p < 1) requestAnimationFrame(tick);
 };
 requestAnimationFrame(tick);
}
function initGalleryLightbox() {
 const items = document.querySelectorAll('.gallery-item');
 const lightbox = document.getElementById('lightbox');
 const img = document.getElementById('lightboxImg');
 const closeBtn = document.getElementById('lightboxClose');
 if (!lightbox || !img) return;
 const close = () => {
 lightbox.classList.remove('open');
 document.body.classList.remove('no-scroll');
 img.src = '';
 };
 items.forEach(item => {
 item.setAttribute('tabindex', '0');
 item.setAttribute('role', 'button');
 item.setAttribute('aria-label', 'عرض الصورة');
 const open = () => {
 const src = item.querySelector('img');
 if (!src) return;
 img.src = src.src;
 img.alt = src.alt;
 lightbox.classList.add('open');
 document.body.classList.add('no-scroll');
 closeBtn && closeBtn.focus();
 };
 item.addEventListener('click', open);
 item.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open()));
 });
 closeBtn && closeBtn.addEventListener('click', close);
 lightbox.addEventListener('click', e => e.target === lightbox && close());
 document.addEventListener('keydown', e => e.key === 'Escape' && lightbox.classList.contains('open') && close());
}
function initScrollTop() {
 const btn = document.getElementById('scrollTopBtn');
 if (!btn) return;
 window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500), { passive: true });
 btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
function initActiveNav() {
 const sections = document.querySelectorAll('section[id]');
 const links = document.querySelectorAll('.nav-links a');
 if (!sections.length || !links.length) return;
 const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '76', 10);
 const obs = new IntersectionObserver((entries) => {
 entries.forEach(e => {
 if (!e.isIntersecting) return;
 links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`));
 });
 }, { threshold: 0.35, rootMargin: `-${navH}px 0px 0px 0px` });
 sections.forEach(s => obs.observe(s));
}
function initFooterYear() {
 const el = document.getElementById('footerYear');
 if (el) el.textContent = new Date().getFullYear();
}
function initTeacherPhoto() {
 const photo = document.getElementById('teacherPhoto');
 const ph = document.getElementById('teacherPlaceholder');
 if (!photo || !ph) return;
 const src = photo.getAttribute('src');
 if (src && src.trim() && src !== window.location.href) {
 photo.style.display = 'block';
 ph.style.display = 'none';
 photo.addEventListener('error', () => { photo.style.display = 'none'; ph.style.display = 'flex'; });
 }
}
function initContactLinks() {
 const waURL = teacherWhatsapp ? ('https://wa.me/' + teacherWhatsapp) : '#';
 const phoneURL = teacherPhone ? ('tel:+' + teacherPhone) : '#';
 const waIDs = [
 'contactWhatsapp', 'teacherWhatsappLink',
 'teacherSocialWhatsapp', 'footerSocialWhatsapp',
 'footerWhatsapp', 'accessWhatsapp', 'paymentWhatsapp'
 ];
 const phoneIDs = [
 'contactPhone', 'teacherPhoneLink',
 'teacherSocialPhone', 'footerSocialPhone',
 'footerPhone', 'accessPhone'
 ];
 waIDs.forEach(id => { const el = document.getElementById(id); if (el) el.href = waURL; });
 phoneIDs.forEach(id => { const el = document.getElementById(id); if (el) el.href = phoneURL; });
}
document.addEventListener('click', (e) => {
 const a = e.target.closest('a[href^="#"]');
 if (!a) return;
 const href = a.getAttribute('href');
 if (href === '#') return;
 const target = document.querySelector(href);
 if (!target) return;
 e.preventDefault();
 const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '76', 10);
 window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
});
if (!window.matchMedia('(pointer:coarse)').matches) {
 document.querySelectorAll('.feature-card, .course-card, .contact-card').forEach(card => {
 card.addEventListener('mousemove', e => {
 const r = card.getBoundingClientRect();
 const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
 const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
 card.style.cssText += `transform:translateY(-8px) rotateX(${dy*4}deg) rotateY(${-dx*4}deg);transition:transform .1s`;
 });
 card.addEventListener('mouseleave', () => {
 card.style.transform = '';
 card.style.transition = 'transform .4s cubic-bezier(.23,1,.32,1)';
 });
 });
}
if (!window.matchMedia('(pointer:coarse)').matches) {
 const hero = document.querySelector('.section-hero');
 if (hero) {
 hero.addEventListener('mousemove', e => {
 const mx = (e.clientX / window.innerWidth - .5) * 20;
 const my = (e.clientY / window.innerHeight - .5) * 20;
 hero.querySelectorAll('.blob').forEach((b, i) => {
 b.style.transform = `translate(${mx*(i+1)*.4}px,${my*(i+1)*.4}px)`;
 });
 hero.querySelectorAll('.fl').forEach((f, i) => {
 f.style.transform = `translate(${mx*(i+1)*.25}px,${my*(i+1)*.25}px)`;
 });
 });
 hero.addEventListener('mouseleave', () => {
 hero.querySelectorAll('.blob,.fl').forEach(el => el.style.transform = '');
 });
 }
}
document.querySelectorAll('img[loading="lazy"]').forEach(img => {
 img.style.cssText += 'opacity:0;transition:opacity .5s ease';
 if (img.complete) {
 img.style.opacity = '1';
 } else {
 img.addEventListener('load', () => img.style.opacity = '1');
 img.addEventListener('error', () => img.style.opacity = '.3');
 }
});
(function () {
 const bar = document.createElement('div');
 bar.style.cssText = 'position:fixed;top:0;right:0;width:0%;height:3px;background:linear-gradient(90deg,#2563EB,#F97316);z-index:9999;transition:width .1s linear;pointer-events:none;';
 document.body.prepend(bar);
 window.addEventListener('scroll', () => {
 const dh = document.documentElement.scrollHeight - window.innerHeight;
 bar.style.width = (dh > 0 ? (window.scrollY / dh * 100) : 0).toFixed(1) + '%';
 }, { passive: true });
})();

/* ══ COURSES — loaded from localStorage on index.html ═════════ */
(function loadCourses() {
  const grid  = document.getElementById('coursesGrid');
  const empty = document.getElementById('coursesEmpty');
  if (!grid) return; // not on index.html

  let courses = [];
  try { courses = JSON.parse(localStorage.getItem('admin_courses') || '[]'); } catch {}

  if (!courses.length) { if (empty) empty.style.display = 'block'; return; }

  const esc = s => String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  grid.innerHTML = courses.map(c => `
    <article class="course-card reveal-up visible">
      <div class="course-img-wrap">
        ${c.imgUrl
          ? `<img src="${esc(c.imgUrl)}" alt="${esc(c.name)}" loading="lazy" onerror="this.style.display='none'"/>`
          : `<div style="height:260px;background:var(--bg-alt);display:flex;align-items:center;justify-content:center;color:var(--text-light);font-size:2.4rem"><i class="fas fa-graduation-cap"></i></div>`}
      </div>
      <div class="course-body">
        <h3 class="course-title">${esc(c.name)}</h3>
        <p class="course-desc">${esc(c.desc || '')}</p>
        <div class="course-footer">
          ${c.price ? `<span class="course-price">${esc(c.price)}</span>` : '<span></span>'}
          <a href="./course-access.html?course=${encodeURIComponent(c.id)}" class="btn btn-enroll">اعرف المزيد</a>
        </div>
      </div>
    </article>`).join('');
})();

/* ══ ANNOUNCEMENTS — loaded from localStorage on index.html ═══ */
(function loadAnnouncements() {
  const list  = document.getElementById('annList');
  const empty = document.getElementById('annEmpty');
  if (!list) return; // not on index.html

  let anns = [];
  try { anns = JSON.parse(localStorage.getItem('admin_announcements') || '[]'); } catch {}

  if (!anns.length) { if(empty) empty.style.display = 'block'; return; }

  const typeLabels = { info:'💙 معلومة', warning:'🟡 تحذير', success:'💚 خبر سار', danger:'🔴 عاجل' };
  const typeIcons  = { info:'fa-info-circle', warning:'fa-exclamation-triangle', success:'fa-check-circle', danger:'fa-exclamation-circle' };

  list.innerHTML = anns.map(a => `
    <div class="ann-card">
      <div class="ann-card-badge ann-${a.type||'info'}">
        <i class="fas ${typeIcons[a.type]||'fa-info-circle'}"></i>
        ${typeLabels[a.type]||'معلومة'}
      </div>
      <div class="ann-card-title">${String(a.title||'').replace(/</g,'&lt;')}</div>
      <div class="ann-card-body">${String(a.body||'').replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>
      ${a.date ? `<div class="ann-card-date"><i class="fas fa-calendar-alt"></i> ${a.date}</div>` : ''}
    </div>`).join('');
})();
