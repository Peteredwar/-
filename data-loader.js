/* ================================================================
   DATA LOADER — يشتغل قبل أي سكريبت تاني في الصفحة
   بيقرأ ملف data/site-data.json (اللي بتصدّره من صفحة "⚙️ الإعدادات"
   في أداة المحرر) وبيحطه في localStorage، عشان باقي كود الموقع
   (اللي بيقرأ من localStorage زي ما هو) يشتغل من غير ما يتغيّر فيه حاجة.

   ده طلب synchronous (مش async) عمدًا، عشان يخلص قبل ما أي سكريبت
   تاني (script.js / course.js / access.js / exam-student.js) يبدأ
   يقرأ من localStorage.
   ================================================================ */
(function () {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', './data/site-data.json', false); // false = synchronous
    xhr.send(null);
    if (xhr.status !== 200 && xhr.status !== 0) return; // 0 = local file:// access
    var data = JSON.parse(xhr.responseText);

    if (data.courses)       localStorage.setItem('admin_courses', JSON.stringify(data.courses));
    if (data.exams)         localStorage.setItem('admin_exams', JSON.stringify(data.exams));
    if (data.videos)        localStorage.setItem('admin_videos', JSON.stringify(data.videos));
    if (data.books)         localStorage.setItem('admin_books', JSON.stringify(data.books));
    if (data.announcements) localStorage.setItem('admin_announcements', JSON.stringify(data.announcements));
    if (data.settings)      localStorage.setItem('admin_settings', JSON.stringify(data.settings));
  } catch (_) {
    // لو الملف مش موجود أو فيه مشكلة، الموقع هيكمل عادي باللي موجود
    // بالفعل في localStorage (لو موجود من قبل)
  }
})();
