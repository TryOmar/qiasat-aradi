/**
 * @file smart-layout.js
 * @description Commit 2 – Smart Layout Layer for Page13/section1
 *
 * ════════════════════════════════════════════════════════════════
 * DESIGN RULES (لا تخرق هذه القواعد أبداً)
 * ════════════════════════════════════════════════════════════════
 *  • هذا الملف طبقة مستقلة تماماً (Independent Wrapper Layer).
 *  • لا يُعدِّل drawLandCanvas() ولا calculateAll() ولا أي معادلة.
 *  • لا يحذف، لا يعيد كتابة، لا يعيد تسمية أي دالة موجودة.
 *
 * ════════════════════════════════════════════════════════════════
 * ما يفعله هذا الملف تحديداً (Commit 2 Scope)
 * ════════════════════════════════════════════════════════════════
 *  1. يُسجِّل canvas-wrapper مع LayoutBuffer قبل كل رسمة
 *     حتى تقرأ drawLandCanvas() القيمة المخزنة من الكاش
 *     بدلاً من استدعاء getBoundingClientRect() المباشر
 *     (يمنع Layout Thrashing ويضمن قيمة صحيحة ومستقرة).
 *
 *  2. يُحدِّث كاش LayoutBuffer قبل الرسمة لضمان دقة العرض
 *     المتاح (wrapper.getBoundingClientRect().width).
 *
 *  3. يُضبط متغير window.smartMarginHint بالهامش المثلى
 *     الذي تحسبه Smart Layout بناءً على عرض الكانفاس:
 *       • هامش أمان = 10% من عرض الكانفاس (مع حد أدنى 55px وأقصى 90px)
 *       • يضمن أن القياسات والنصوص لا تخرج عن حدود الكانفاس
 *     يُستخدم هذا المتغير بواسطة drawLandCanvas إذا أُضيفت
 *     دعم له (اختياري – يعمل drawLandCanvas بشكل طبيعي بدونه).
 *
 *  4. يُوفِّر SmartLayout.validateBounds(canvas) لاكتشاف
 *     الأشكال التي خرجت من حدود الكانفاس في وضع التطوير.
 *
 * ════════════════════════════════════════════════════════════════
 * API العام
 * ════════════════════════════════════════════════════════════════
 *  SmartLayout.prepare(canvas, vertices)
 *    → تُستدعى مرة واحدة قبل drawLandCanvas(vertices)
 *    → تُعيد { availableWidth, margin } للمعلومات
 *
 *  SmartLayout.onResize()
 *    → معالج تغيير الحجم، تُستدعى من window resize handler الموجود
 *
 *  SmartLayout.validateBounds(canvas)
 *    → تتحقق بصرياً من عدم خروج الرسمة عن الكانفاس (وضع debug)
 *
 *  SmartLayout.debug(true/false)
 *    → تفعيل/إلغاء تفعيل رسائل التشخيص في الـ console
 * ════════════════════════════════════════════════════════════════
 */

(function (global) {
  "use strict";

  // ── ثوابت التنسيق ────────────────────────────────────────────
  // هامش الأمان = 10% من العرض، مقيَّد بين 55 و 90 بكسل
  var SAFETY_MARGIN_RATIO = 0.10;
  var MIN_SAFETY_MARGIN   = 55;
  var MAX_SAFETY_MARGIN   = 90;
  var PRINT_SAFETY_MARGIN = 110;

  // ── حالة داخلية ─────────────────────────────────────────────
  var _debugMode = false;
  var _wrapperRegistered = false;

  // ──────────────────────────────────────────────────────────────
  // دالة مساعدة: تسجيل العنصر مع LayoutBuffer
  // ──────────────────────────────────────────────────────────────
  function ensureBuffered(element) {
    if (!element) return;
    if (global.LayoutBuffer && global.LayoutBuffer.buffer) {
      global.LayoutBuffer.buffer(element);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // دالة مساعدة: تحديث الكاش وإعادة القيمة الصحيحة
  // ──────────────────────────────────────────────────────────────
  function getWrapperWidth(wrapper) {
    if (!wrapper) return 0;

    // أولاً: سجِّل الحاوية مع LayoutBuffer إن لم تُسجَّل بعد
    ensureBuffered(wrapper);

    // ثانياً: أجبر LayoutBuffer على تحديث الكاش الآن
    // (لضمان أن drawLandCanvas ستقرأ قيمة حديثة لا قديمة)
    if (global.LayoutBuffer && global.LayoutBuffer.updateAll) {
      global.LayoutBuffer.updateAll();
    }

    // الآن يمكن قراءة القيمة — ستأتي من الكاش المحدَّث
    var rect = wrapper.getBoundingClientRect();
    return rect.width > 0 ? rect.width : 0;
  }

  // ──────────────────────────────────────────────────────────────
  // دالة: حساب هامش الأمان المثلى
  // ──────────────────────────────────────────────────────────────
  function computeSafetyMargin(canvasWidth, printing) {
    if (printing) return PRINT_SAFETY_MARGIN;
    var margin = canvasWidth * SAFETY_MARGIN_RATIO;
    return Math.max(MIN_SAFETY_MARGIN, Math.min(MAX_SAFETY_MARGIN, margin));
  }

  // ──────────────────────────────────────────────────────────────
  // الدالة الرئيسية: prepare(canvas, vertices)
  // ──────────────────────────────────────────────────────────────
  function prepare(canvas, vertices) {
    if (!canvas) return null;

    var wrapper  = canvas.parentElement;
    var printing = !!(global.isPrinting || global.isExportingAsImage);

    // تأكد من تسجيل canvas و wrapper مع LayoutBuffer
    ensureBuffered(canvas);
    ensureBuffered(wrapper);

    // احصل على عرض الحاوية المحدَّث من LayoutBuffer
    var availableWidth = getWrapperWidth(wrapper);

    // احسب هامش الأمان المثلى بناءً على العرض المتاح
    // (drawLandCanvas ستستخدمه عبر window.smartMarginHint)
    var currentCanvasW = parseFloat(canvas.style.width) || canvas.width || availableWidth;
    var margin = computeSafetyMargin(currentCanvasW, printing);

    // أخبر drawLandCanvas بالهامش المثلى عبر متغير window
    // (drawLandCanvas تتجاهله إذا لم تدعمه — لا ضرر)
    global.smartMarginHint = margin;

    if (_debugMode) {
      console.log(
        "[SmartLayout] prepare() –",
        "wrapper width:", availableWidth,
        "| canvas:", currentCanvasW,
        "| margin hint:", margin,
        "| printing:", printing
      );
    }

    return {
      availableWidth: availableWidth,
      margin:         margin
    };
  }

  // ──────────────────────────────────────────────────────────────
  // معالج تغيير الحجم
  // ──────────────────────────────────────────────────────────────
  function onResize() {
    // تحديث كاش LayoutBuffer حتى تقرأ drawLandCanvas قيمة صحيحة
    if (global.LayoutBuffer && global.LayoutBuffer.updateAll) {
      global.LayoutBuffer.updateAll();
    }
    // إعادة ضبط hint إلى null حتى يُحسَب من جديد
    global.smartMarginHint = null;
  }

  // ──────────────────────────────────────────────────────────────
  // أداة التحقق من الحدود (debug فقط)
  // ──────────────────────────────────────────────────────────────
  function validateBounds(canvas) {
    if (!canvas) return;
    if (!_debugMode) return;

    // نقرأ بكسلات الحافة لنتحقق من وجود محتوى خارج الإطار
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var w = canvas.width;
    var h = canvas.height;

    // فحص بسيط: هل توجد بكسلات غير شفافة على الحواف؟
    var edgePixels = 4; // عدد بكسلات الحافة للفحص
    var topEdge    = ctx.getImageData(0, 0, w, edgePixels);
    var bottomEdge = ctx.getImageData(0, h - edgePixels, w, edgePixels);
    var leftEdge   = ctx.getImageData(0, 0, edgePixels, h);
    var rightEdge  = ctx.getImageData(w - edgePixels, 0, edgePixels, h);

    function hasContent(data) {
      for (var i = 3; i < data.data.length; i += 4) {
        if (data.data[i] > 20) return true; // alpha > 20 تعني رسمة
      }
      return false;
    }

    var overflow = {
      top:    hasContent(topEdge),
      bottom: hasContent(bottomEdge),
      left:   hasContent(leftEdge),
      right:  hasContent(rightEdge)
    };

    var hasOverflow = overflow.top || overflow.bottom || overflow.left || overflow.right;
    if (hasOverflow) {
      console.warn("[SmartLayout] validateBounds: تم اكتشاف محتوى عند حواف الكانفاس!", overflow);
    } else {
      console.log("[SmartLayout] validateBounds: ✅ لا يوجد تجاوز للحدود.");
    }
    return overflow;
  }

  // ── تسجيل تلقائي مع LayoutBuffer عند التحميل ────────────────
  document.addEventListener("DOMContentLoaded", function () {
    var p13Canvas = document.getElementById("landCanvas");
    if (p13Canvas) {
      ensureBuffered(p13Canvas);
      if (p13Canvas.parentElement) {
        ensureBuffered(p13Canvas.parentElement);
      }
      if (_debugMode) {
        console.log("[SmartLayout] DOMContentLoaded: تم تسجيل landCanvas مع LayoutBuffer.");
      }
    }
  });

  // ── API العام ────────────────────────────────────────────────
  global.SmartLayout = {
    prepare:       prepare,
    onResize:      onResize,
    validateBounds: validateBounds,

    debug: function (on) {
      _debugMode = !!on;
      console.log("[SmartLayout] debug mode:", _debugMode ? "مُفعَّل" : "مُعطَّل");
    },

    // معلومات إصدار الطبقة للمراجعة
    version: "2.0.0 – Commit 2 (Smart Layout)"
  };

})(window);
