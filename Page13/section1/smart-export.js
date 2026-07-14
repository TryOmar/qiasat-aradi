/**
 * @file smart-export.js
 * @description Commit 3 – Smart Export Layer for Page13/section1
 *
 * ════════════════════════════════════════════════════════════════
 * DESIGN RULES (لا تخرق هذه القواعد أبداً)
 * ════════════════════════════════════════════════════════════════
 *  • هذا الملف طبقة مستقلة تماماً (Independent Wrapper Layer).
 *  • لا يُعدِّل exportCroquisAsImage() ولا printCroquis() ولا أي دالة حسابية.
 *  • لا يُعدِّل calculateAll() ولا drawLandCanvas().
 *  • يعمل كـ Wrapper يُضيف تجربة أفضل فوق الدوال الموجودة.
 *
 * ════════════════════════════════════════════════════════════════
 * ما يفعله هذا الملف (Commit 3 Scope — ميزة واحدة فقط)
 * ════════════════════════════════════════════════════════════════
 *  1. SmartExport.exportImage()
 *     Wrapper فوق exportCroquisAsImage() يُضيف:
 *       • مؤشر تحميل (loading state) على الزر أثناء التصدير
 *       • منع الضغط المزدوج
 *       • رسالة toast نجاح/فشل بعد اكتمال التصدير
 *       • ضبط smartMarginHint لجودة تصدير أعلى
 *
 *  2. SmartExport.printReport()
 *     Wrapper فوق printCroquis() يُضيف:
 *       • ضبط smartMarginHint للطباعة (110px) قبل الاستدعاء
 *         → يضمن تغطية 90–95% من الصفحة وعدم قص القياسات
 *       • تحديث LayoutBuffer قبل الطباعة
 *       • مؤشر تحميل على الزر أثناء الانتظار
 *       • استعادة الهامش الطبيعي للشاشة بعد الطباعة
 *
 *  3. SmartExport.showToast(message, type)
 *     دالة مساعدة لعرض رسائل toast مؤقتة باللغة العربية
 *
 * ════════════════════════════════════════════════════════════════
 * ما لا يفعله هذا الملف (خارج نطاق Commit 3)
 * ════════════════════════════════════════════════════════════════
 *  • Watermark — ميزة مستقلة ستُضاف في Commit منفصل إذا طُلب
 *
 * ════════════════════════════════════════════════════════════════
 * API العام
 * ════════════════════════════════════════════════════════════════
 *  SmartExport.exportImage()         → بدلاً من exportCroquisAsImage()
 *  SmartExport.printReport()         → بدلاً من printCroquis()
 *  SmartExport.showToast(msg, type)  → 'success' | 'error' | 'info'
 *  SmartExport.version               → string
 * ════════════════════════════════════════════════════════════════
 */

(function (global) {
  "use strict";

  // ── ثوابت ────────────────────────────────────────────────────
  var TOAST_DURATION    = 3000; // مدة ظهور رسالة toast (ms)
  var PRINT_MARGIN_HINT = 110;  // هامش الطباعة الآمن (px) — يضمن 90–95% تغطية

  // ── حالة داخلية ─────────────────────────────────────────────
  var _isExporting = false;
  var _isPrinting  = false;
  var _toastTimer  = null;

  // ══════════════════════════════════════════════════════════════
  // دالة: showToast — رسالة toast مؤقتة (RTL)
  // ══════════════════════════════════════════════════════════════
  function showToast(message, type) {
    type = type || "info"; // 'success' | 'error' | 'info'

    // إزالة أي toast سابق
    var existing = document.getElementById("smart-export-toast");
    if (existing) existing.remove();
    if (_toastTimer) clearTimeout(_toastTimer);

    var colors = {
      success: { bg: "#2e7d32", icon: "✅" },
      error:   { bg: "#c62828", icon: "❌" },
      info:    { bg: "#1565c0", icon: "ℹ️" }
    };
    var c = colors[type] || colors.info;

    var toast = document.createElement("div");
    toast.id = "smart-export-toast";
    toast.style.cssText = [
      "position: fixed",
      "bottom: 24px",
      "left: 50%",
      "transform: translateX(-50%)",
      "background: " + c.bg,
      "color: white",
      "padding: 12px 24px",
      "border-radius: 12px",
      "font-family: Cairo, Arial, sans-serif",
      "font-size: 14px",
      "font-weight: bold",
      "z-index: 99999",
      "box-shadow: 0 4px 20px rgba(0,0,0,0.3)",
      "direction: rtl",
      "display: flex",
      "align-items: center",
      "gap: 8px",
      "min-width: 200px",
      "max-width: 380px",
      "text-align: center",
      "animation: smartExportFadeIn 0.3s ease"
    ].join(";");

    toast.innerHTML = c.icon + " " + message;
    document.body.appendChild(toast);

    _toastTimer = setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.4s ease";
      setTimeout(function () {
        if (toast.parentElement) toast.remove();
      }, 400);
    }, TOAST_DURATION);
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: setButtonLoading — يُضيف/يُزيل حالة التحميل على زر
  // ══════════════════════════════════════════════════════════════
  function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn._smartExportOrigHTML = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = "0.65";
      btn.style.cursor  = "not-allowed";
      btn.innerHTML = "⏳ جارٍ التنفيذ...";
    } else {
      btn.disabled = false;
      btn.style.opacity = "";
      btn.style.cursor  = "";
      btn.innerHTML = btn._smartExportOrigHTML || btn.innerHTML;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: exportImage — Wrapper فوق exportCroquisAsImage()
  //
  // ما تُضيفه هذه الدالة فوق الأصل:
  //  • منع الضغط المزدوج على الزر
  //  • مؤشر تحميل أثناء عملية التصدير
  //  • ضبط smartMarginHint = PRINT_MARGIN_HINT قبل التصدير
  //    لضمان جودة عالية وعدم قص أي قياس
  //  • إعادة smartMarginHint = null بعد التصدير (استعادة الشاشة)
  //  • toast نجاح أو فشل
  // ══════════════════════════════════════════════════════════════
  function exportImage() {
    // منع الضغط المزدوج
    if (_isExporting) {
      showToast("جارٍ التصدير بالفعل، يرجى الانتظار...", "info");
      return;
    }

    var canvas = document.getElementById("landCanvas");
    if (!canvas) {
      showToast("لم يتم العثور على الكروكي. يرجى حساب الأرض أولاً.", "error");
      return;
    }

    var exportBtn = document.querySelector(
      "[onclick*='SmartExport.exportImage'], [onclick*='exportCroquisAsImage']"
    );
    setButtonLoading(exportBtn, true);
    _isExporting = true;

    // ضبط هامش عالي الجودة قبل التصدير
    global.smartMarginHint = PRINT_MARGIN_HINT;

    // استدعاء دالة التصدير الأصلية
    requestAnimationFrame(function () {
      try {
        if (typeof exportCroquisAsImage === "function") {
          exportCroquisAsImage();
          showToast("تم تحميل الصورة بنجاح!", "success");
        } else {
          showToast("دالة التصدير غير متاحة.", "error");
        }
      } catch (err) {
        console.error("[SmartExport] exportImage error:", err);
        showToast("حدث خطأ أثناء التصدير: " + err.message, "error");
      } finally {
        // استعادة الهامش الطبيعي للشاشة
        global.smartMarginHint = null;
        setButtonLoading(exportBtn, false);
        _isExporting = false;
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: printReport — Wrapper فوق printCroquis()
  //
  // ما تُضيفه هذه الدالة فوق الأصل:
  //  • ضبط smartMarginHint = 110px قبل الطباعة
  //    → يضمن أن الكروكي يغطي 90–95% من الصفحة
  //    → يمنع قص القياسات والنصوص عند الحواف
  //  • تحديث LayoutBuffer قبل الطباعة
  //  • مؤشر تحميل على الزر
  //  • إعادة smartMarginHint = null بعد الطباعة
  // ══════════════════════════════════════════════════════════════
  function printReport() {
    if (_isPrinting) {
      showToast("جارٍ الطباعة بالفعل...", "info");
      return;
    }

    var printBtn = document.querySelector(
      "[onclick*='SmartExport.printReport'], [onclick*='printCroquis']"
    );
    setButtonLoading(printBtn, true);
    _isPrinting = true;

    // ضبط smartMarginHint للطباعة (110px — هامش طباعة آمن)
    global.smartMarginHint = PRINT_MARGIN_HINT;

    // تحديث كاش LayoutBuffer لضمان قيمة صحيحة لأبعاد الحاوية
    if (global.LayoutBuffer && global.LayoutBuffer.updateAll) {
      global.LayoutBuffer.updateAll();
    }

    // استدعاء دالة الطباعة الأصلية بعد إعداد الهامش
    setTimeout(function () {
      try {
        if (typeof printCroquis === "function") {
          printCroquis();
          showToast("جارٍ فتح نافذة الطباعة...", "info");
        } else {
          showToast("دالة الطباعة غير متاحة.", "error");
        }
      } catch (err) {
        console.error("[SmartExport] printReport error:", err);
        showToast("حدث خطأ أثناء الطباعة: " + err.message, "error");
      } finally {
        // استعادة الهامش الطبيعي للشاشة بعد انتهاء الطباعة
        global.smartMarginHint = null;
        setButtonLoading(printBtn, false);
        _isPrinting = false;
      }
    }, 80);
  }

  // ══════════════════════════════════════════════════════════════
  // دالة مساعدة: _getDateStamp — ختم التاريخ لاسم الملف
  // ══════════════════════════════════════════════════════════════
  function _getDateStamp() {
    var now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  }

  // ══════════════════════════════════════════════════════════════
  // إضافة CSS للـ toast animation عند التحميل
  // ══════════════════════════════════════════════════════════════
  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("smart-export-css")) {
      var style = document.createElement("style");
      style.id = "smart-export-css";
      style.textContent = [
        "@keyframes smartExportFadeIn {",
        "  from { opacity: 0; transform: translateX(-50%) translateY(12px); }",
        "  to   { opacity: 1; transform: translateX(-50%) translateY(0); }",
        "}"
      ].join("\n");
      document.head.appendChild(style);
    }
  });

  // ── API العام ────────────────────────────────────────────────
  global.SmartExport = {
    exportImage: exportImage,
    printReport: printReport,
    showToast:   showToast,

    version: "3.1.0 – Commit 3 (Smart Export — no watermark)"
  };

})(window);
