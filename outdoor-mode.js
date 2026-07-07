/**
 * outdoor-mode.js
 * وضع الاستخدام تحت أشعة الشمس ☀️
 * يُضاف تلقائياً لجميع الصفحات
 * يحفظ الإعداد في localStorage ليستمر عند التنقل بين الصفحات
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'dalal_outdoor_mode';

  /* ---- تحديد المسار النسبي لجذر المشروع ---- */
  function getRootPath() {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      const m = s.src.match(/^(.*\/)outdoor-mode\.js$/);
      if (m) return m[1];
    }
    // fallback: ابحث عن style.css لاستنتاج المسار
    const links = document.querySelectorAll('link[href]');
    for (const l of links) {
      const m = l.href.match(/^(.*\/)style\.css$/);
      if (m) return m[1];
    }
    return './';
  }

  /* ---- حقن ملف CSS ---- */
  function injectCSS() {
    if (document.getElementById('outdoor-mode-css')) return;
    const root = getRootPath();
    const link = document.createElement('link');
    link.id = 'outdoor-mode-css';
    link.rel = 'stylesheet';
    link.href = root + 'outdoor-mode.css';
    document.head.appendChild(link);
  }

  /* ---- تطبيق / إزالة الوضع ---- */
  function applyMode(active) {
    if (active) {
      document.body.classList.add('outdoor-mode');
    } else {
      document.body.classList.remove('outdoor-mode');
    }
    updateButton(active);
  }

  /* ---- تحديث شكل الزر ---- */
  function updateButton(active) {
    const btn = document.getElementById('outdoor-toggle-btn');
    if (!btn) return;
    if (active) {
      btn.textContent = '☀️';
      btn.classList.add('active');
      btn.title = 'إلغاء وضع الشمس';
    } else {
      btn.textContent = '☀️';
      btn.classList.remove('active');
      btn.title = 'تفعيل وضع الشمس';
    }
  }

  /* ---- إنشاء الزر العائم ---- */
  function createButton() {
    if (document.getElementById('outdoor-toggle-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'outdoor-toggle-btn';
    btn.textContent = '☀️';
    btn.title = 'تفعيل وضع الشمس';
    btn.setAttribute('aria-label', 'تبديل وضع أشعة الشمس');

    btn.addEventListener('click', function () {
      const isActive = document.body.classList.contains('outdoor-mode');
      const newState = !isActive;
      localStorage.setItem(STORAGE_KEY, newState ? '1' : '0');
      applyMode(newState);
    });

    document.body.appendChild(btn);
  }

  /* ---- التهيئة عند تحميل الصفحة ---- */
  function init() {
    injectCSS();
    // تم إلغاء الزر العائم بناءً على طلب المستخدم لتجنب تغطية المحتوى
    // createButton(); 

    // تفعيل وضع الشمس والتباين العالي تلقائياً وبشكل دائم لجميع المستخدمين
    applyMode(true);
  }

  /* ---- تشغيل بعد تحميل DOM ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
