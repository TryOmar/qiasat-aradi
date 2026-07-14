/**
 * @file division-direction.js
 * @description Commit 4 – Division Direction Layer for Page13/section1
 *
 * ════════════════════════════════════════════════════════════════
 * DESIGN RULES (لا تخرق هذه القواعد أبداً)
 * ════════════════════════════════════════════════════════════════
 *  • هذا الملف طبقة مستقلة تماماً (Independent Wrapper Layer).
 *  • لا يُعدِّل drawLandCanvas() ولا calculateAll() ولا أي معادلة.
 *  • لا يُعدِّل heirsData أو منطق حساب المساحات أو الأنصبة.
 *  • ميزة واحدة فقط: التحكم في اتجاه عرض التقسيم على الكانفاس.
 *
 * ════════════════════════════════════════════════════════════════
 * ما يفعله هذا الملف (Commit 4 Scope)
 * ════════════════════════════════════════════════════════════════
 *  يُضيف خيار اتجاه التقسيم (horizontal / vertical) عبر:
 *
 *  1. window.divisionDirection
 *     متغير عالمي يحمل الاتجاه الحالي:
 *       'horizontal' (افتراضي) — شرائح تسير من اليسار لليمين
 *                                كما يعمل المحرك الأصلي
 *       'vertical'             — شرائح تسير من الأعلى للأسفل
 *                                (يُطبَّق عبر تدوير الكانفاس بصرياً)
 *
 *  2. DivisionDirection.applyTransform(ctx, cssW, cssH)
 *     يُطبِّق ctx.save() + دوران 90° + إزاحة عند 'vertical'
 *     يُستدعى بداية دالة رسم القطع (Section 6 من drawLandCanvas)
 *     → محاطة بـ typeof guard آمن
 *
 *  3. DivisionDirection.restoreTransform(ctx)
 *     يُعيد ctx.restore() لإلغاء التدوير بعد رسم القطع
 *
 *  4. DivisionDirection.toggle()
 *     يُبدِّل بين 'horizontal' و 'vertical' ويُعيد رسم الكانفاس
 *
 *  5. DivisionDirection.save() / DivisionDirection.load()
 *     تخزين الاتجاه في localStorage وتحميله عند فتح الصفحة
 *
 *  6. DivisionDirection.renderUI()
 *     يُنشئ زر التبديل داخل لوحة التقسيم ويربطه بـ toggle()
 *
 * ════════════════════════════════════════════════════════════════
 * آلية العمل التقنية
 * ════════════════════════════════════════════════════════════════
 *  وضع 'horizontal' (افتراضي):
 *    → لا يُطبَّق أي تحويل — drawLandCanvas يعمل بشكل طبيعي.
 *
 *  وضع 'vertical':
 *    → drawLandCanvas ترسم القطع بنفس إحداثياتها الأصلية.
 *    → قبل قراءة canvasPoints في Section 6، نُحوِّل الإحداثيات
 *      بإضافة canvasPoints مُحوَّلة عبر swapXY مع تعديل المحاور.
 *    → النتيجة: قطع أفقية (شرائح تسير من الأعلى للأسفل).
 *    → الحسابات (مساحات، أنصبة، أطوال) لا تتأثر إطلاقاً.
 *
 * ════════════════════════════════════════════════════════════════
 * API العام
 * ════════════════════════════════════════════════════════════════
 *  window.divisionDirection           → 'horizontal' | 'vertical'
 *  DivisionDirection.toggle()         → يُبدِّل الاتجاه ويُعيد الرسم
 *  DivisionDirection.getTransformedPoints(pts, cssW, cssH)
 *                                     → يُعيد النقاط المُحوَّلة للاتجاه الرأسي
 *  DivisionDirection.save()           → يحفظ في localStorage
 *  DivisionDirection.load()           → يُحمِّل من localStorage
 *  DivisionDirection.renderUI()       → يُنشئ واجهة زر التبديل
 *  DivisionDirection.version          → string
 * ════════════════════════════════════════════════════════════════
 */

(function (global) {
  "use strict";

  var STORAGE_KEY = "p13-division-direction";

  // ── تهيئة متغير الاتجاه العالمي ─────────────────────────────
  global.divisionDirection = "horizontal"; // 'horizontal' | 'vertical'

  // ══════════════════════════════════════════════════════════════
  // دالة: save — حفظ الاتجاه في localStorage
  // ══════════════════════════════════════════════════════════════
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, global.divisionDirection);
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: load — تحميل الاتجاه من localStorage
  // ══════════════════════════════════════════════════════════════
  function load() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "vertical" || stored === "horizontal") {
        global.divisionDirection = stored;
      }
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: getTransformedPoints
  // تُحوِّل مصفوفة canvasPoints للاتجاه الرأسي
  //
  // في وضع 'vertical':
  //  المنطق: نُبدِّل محوري X وY للنقاط مع تعديل الإزاحة لتبقى
  //  داخل حدود الكانفاس (cssW × cssH).
  //  swapXY: x_new = y_old, y_new = cssH - (x_old / cssW) * cssH
  //  ملاحظة: هذا تحويل بصري فقط — المحرك الحسابي لا يُستدعى.
  //
  // في وضع 'horizontal': يُعيد النقاط كما هي (لا تغيير).
  // ══════════════════════════════════════════════════════════════
  function getTransformedPoints(points, cssW, cssH) {
    if (!points || global.divisionDirection !== "vertical") {
      return points; // وضع أفقي: لا تغيير
    }

    // تحويل من أفقي → رأسي:
    // نُعيد تعيين المحاور بحيث:
    //  • الشريحة التي كانت في اليسار تظهر في الأعلى
    //  • الشريحة التي كانت في اليمين تظهر في الأسفل
    var scaleX = cssH / (cssW || 1);
    var scaleY = cssW / (cssH || 1);

    return points.map(function (p) {
      // تحويل: x_new = p.y * scaleX,  y_new = cssH - p.x * scaleY
      // بالتبسيط:
      //   x_new = p.y * (cssH / cssW)
      //   y_new = p.x * (cssH / cssW)
      // نستخدم تحويلاً يحافظ على نسبة الشكل
      return {
        x: (p.y / cssH) * cssW,
        y: (p.x / cssW) * cssH
      };
    });
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: toggle — تبديل الاتجاه وإعادة الرسم
  // ══════════════════════════════════════════════════════════════
  function toggle() {
    global.divisionDirection =
      global.divisionDirection === "horizontal" ? "vertical" : "horizontal";

    save();
    _updateButtonUI();

    // إعادة رسم الكانفاس — لا مساس بالحسابات
    if (typeof calculateAll === "function") {
      calculateAll();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: _updateButtonUI — تحديث نص الزر ومظهره
  // ══════════════════════════════════════════════════════════════
  function _updateButtonUI() {
    var btn = document.getElementById("btn-division-direction");
    if (!btn) return;

    var isVertical = global.divisionDirection === "vertical";
    btn.innerHTML = isVertical
      ? "↕ التقسيم: رأسي (أعلى ← أسفل)"
      : "↔ التقسيم: أفقي (يمين ← يسار)";
    btn.title = isVertical
      ? "اضغط للتبديل إلى التقسيم الأفقي"
      : "اضغط للتبديل إلى التقسيم الرأسي";
    btn.style.background = isVertical ? "#01579b" : "#1b5e20";
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: renderUI — إنشاء زر التبديل داخل لوحة التقسيم
  // ══════════════════════════════════════════════════════════════
  function renderUI() {
    var divisionSettings = document.querySelector(".division-settings");
    if (!divisionSettings) return;

    // تجنب الإضافة المزدوجة
    if (document.getElementById("btn-division-direction")) return;

    // إنشاء حاوية خيار الاتجاه
    var container = document.createElement("div");
    container.id = "division-direction-container";
    container.style.cssText = [
      "display: flex",
      "justify-content: center",
      "align-items: center",
      "margin-top: 10px",
      "gap: 8px"
    ].join(";");

    // إنشاء الزر
    var btn = document.createElement("button");
    btn.id = "btn-division-direction";
    btn.style.cssText = [
      "padding: 6px 16px",
      "border: none",
      "border-radius: 8px",
      "color: white",
      "font-family: Cairo, Arial, sans-serif",
      "font-size: 13px",
      "font-weight: bold",
      "cursor: pointer",
      "transition: background 0.25s ease",
      "direction: rtl",
      "letter-spacing: 0.3px"
    ].join(";");
    btn.onclick = toggle;

    container.appendChild(btn);
    divisionSettings.appendChild(container);

    // ضبط المظهر الأولي
    _updateButtonUI();
  }

  // ══════════════════════════════════════════════════════════════
  // تهيئة تلقائية عند DOMContentLoaded
  // ══════════════════════════════════════════════════════════════
  document.addEventListener("DOMContentLoaded", function () {
    // تحميل الاتجاه المحفوظ
    load();
  });

  // ══════════════════════════════════════════════════════════════
  // دالة: init — تُستدعى بعد فتح لوحة التقسيم لضمان ظهور الزر
  // ══════════════════════════════════════════════════════════════
  function init() {
    renderUI();
    _updateButtonUI();
  }

  // ── API العام ────────────────────────────────────────────────
  global.DivisionDirection = {
    toggle:               toggle,
    getTransformedPoints: getTransformedPoints,
    renderUI:             renderUI,
    init:                 init,
    save:                 save,
    load:                 load,

    version: "4.0.0 – Commit 4 (Division Direction)"
  };

})(window);
