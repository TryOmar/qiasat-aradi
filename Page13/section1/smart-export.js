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
 * ما يفعله هذا الملف (Commit 3 Scope)
 * ════════════════════════════════════════════════════════════════
 *  1. SmartExport.exportImage()
 *     Wrapper فوق exportCroquisAsImage() يُضيف:
 *       • مؤشر تحميل (loading state) على الزر أثناء التصدير
 *       • منع الضغط المزدوج
 *       • watermark خفيف (اسم التطبيق + التاريخ) على الصورة
 *       • رسالة toast نجاح/فشل بعد اكتمال التصدير
 *
 *  2. SmartExport.printReport()
 *     Wrapper فوق printCroquis() يُضيف:
 *       • ضبط smartMarginHint للطباعة قبل الاستدعاء
 *       • تحديث LayoutBuffer قبل الطباعة
 *       • مؤشر تحميل على الزر
 *       • استعادة الحالة الصحيحة بعد الطباعة
 *
 *  3. SmartExport.showToast(message, type)
 *     دالة مساعدة لعرض رسائل toast مؤقتة
 *
 *  4. SmartExport.addWatermark(canvas)
 *     يُضيف watermark خفيف على نسخة مؤقتة من الكانفاس
 *     دون المساس بالكانفاس الأصلي
 *
 * ════════════════════════════════════════════════════════════════
 * API العام
 * ════════════════════════════════════════════════════════════════
 *  SmartExport.exportImage()  → استدعيها بدلاً من exportCroquisAsImage() من HTML
 *  SmartExport.printReport()  → استدعيها بدلاً من printCroquis() من HTML
 *  SmartExport.showToast(msg, type)  → 'success' | 'error' | 'info'
 *  SmartExport.version  → string
 * ════════════════════════════════════════════════════════════════
 */

(function (global) {
  "use strict";

  // ── ثوابت ────────────────────────────────────────────────────
  var APP_NAME    = "تطبيق الدلال";
  var TOAST_DURATION = 3000; // مدة ظهور رسالة toast (ms)
  var PRINT_MARGIN_HINT = 110; // هامش الطباعة الآمن (px)

  // ── حالة داخلية ─────────────────────────────────────────────
  var _isExporting  = false;
  var _isPrinting   = false;
  var _toastTimer   = null;

  // ══════════════════════════════════════════════════════════════
  // دالة: showToast — رسالة toast مؤقتة
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
  function setButtonLoading(btn, loading, originalText) {
    if (!btn) return;
    if (loading) {
      btn._smartExportOrigText = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = "0.65";
      btn.style.cursor  = "not-allowed";
      btn.innerHTML = "⏳ جارٍ التصدير...";
    } else {
      btn.disabled = false;
      btn.style.opacity = "";
      btn.style.cursor  = "";
      btn.innerHTML = btn._smartExportOrigText || originalText || btn.innerHTML;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: addWatermark — يُضيف watermark خفيف على نسخة مؤقتة
  // الكانفاس الأصلي لا يُلمَس
  // ══════════════════════════════════════════════════════════════
  function addWatermark(sourceCanvas) {
    if (!sourceCanvas) return sourceCanvas;

    // إنشاء canvas مؤقت بنفس أبعاد الأصل
    var tmpCanvas = document.createElement("canvas");
    tmpCanvas.width  = sourceCanvas.width;
    tmpCanvas.height = sourceCanvas.height;
    var tmpCtx = tmpCanvas.getContext("2d");

    // نسخ محتوى الكانفاس الأصلي
    tmpCtx.drawImage(sourceCanvas, 0, 0);

    // حساب حجم خط الـ watermark نسبةً للكانفاس
    var fontSize = Math.max(14, Math.min(22, tmpCanvas.width * 0.012));
    var dpr = global.devicePixelRatio || 1;
    fontSize = fontSize * dpr;

    // الـ watermark: أسفل يمين بشفافية 18%
    var now        = new Date();
    var dateStr    = now.toLocaleDateString("ar-EG", {
      year: "numeric", month: "long", day: "numeric"
    });
    var waterText  = APP_NAME + " – " + dateStr;
    var margin     = 16 * dpr;

    tmpCtx.save();
    tmpCtx.globalAlpha = 0.18;
    tmpCtx.fillStyle   = "#1b5e20";
    tmpCtx.font        = "bold " + fontSize + "px Cairo, Arial";
    tmpCtx.textAlign   = "right";
    tmpCtx.textBaseline = "bottom";
    tmpCtx.direction   = "rtl";
    tmpCtx.fillText(waterText, tmpCanvas.width - margin, tmpCanvas.height - margin);
    tmpCtx.restore();

    return tmpCanvas;
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: exportImage — Wrapper فوق exportCroquisAsImage()
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

    // إيجاد زر التصدير
    var exportBtn = document.querySelector("[onclick*='SmartExport.exportImage'], [onclick*='exportCroquisAsImage']");
    setButtonLoading(exportBtn, true);
    _isExporting = true;

    // ضبط smartMarginHint للتصدير (هامش أكبر للجودة العالية)
    global.smartMarginHint = PRINT_MARGIN_HINT;

    // تفعيل وضع التصدير
    global.isExportingAsImage = true;

    // إعادة الرسم بجودة عالية
    if (typeof drawLandCanvas === "function") {
      drawLandCanvas(global.vertices);
    }

    // انتظار اكتمال الرسم ثم التصدير
    requestAnimationFrame(function () {
      try {
        // إضافة watermark على نسخة مؤقتة
        var exportCanvas = addWatermark(canvas);

        var filename = "كروكي_الأرض_الدلال_" + _getDateStamp() + ".png";

        exportCanvas.toBlob(function (blob) {
          global.isExportingAsImage = false;

          // إعادة الرسم للشاشة بعد التصدير
          if (typeof drawLandCanvas === "function") {
            global.smartMarginHint = null; // تجاهل hint الطباعة
            drawLandCanvas(global.vertices);
          }

          setButtonLoading(exportBtn, false);
          _isExporting = false;

          if (!blob) {
            showToast("فشل التصدير. يرجى المحاولة مرة أخرى.", "error");
            return;
          }

          // محاولة Web Share API (أجهزة الجوال)
          var file = new File([blob], filename, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: "كروكي الأرض – " + APP_NAME,
              text:  "كروكي الأرض من " + APP_NAME
            }).then(function () {
              showToast("تمت مشاركة الصورة بنجاح!", "success");
            }).catch(function (err) {
              if (err.name !== "AbortError") {
                _downloadBlob(blob, filename);
              }
            });
          } else {
            _downloadBlob(blob, filename);
            showToast("تم تحميل الصورة بنجاح!", "success");
          }
        }, "image/png");
      } catch (err) {
        console.error("[SmartExport] exportImage error:", err);
        global.isExportingAsImage = false;
        global.smartMarginHint = null;
        setButtonLoading(exportBtn, false);
        _isExporting = false;
        showToast("حدث خطأ أثناء التصدير: " + err.message, "error");
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  // دالة: printReport — Wrapper فوق printCroquis()
  // ══════════════════════════════════════════════════════════════
  function printReport() {
    if (_isPrinting) {
      showToast("جارٍ الطباعة بالفعل...", "info");
      return;
    }

    var printBtn = document.querySelector("[onclick*='SmartExport.printReport'], [onclick*='printCroquis']");
    setButtonLoading(printBtn, true);
    _isPrinting = true;

    // ضبط smartMarginHint للطباعة (110px — هامش طباعة آمن)
    global.smartMarginHint = PRINT_MARGIN_HINT;

    // تحديث LayoutBuffer قبل الطباعة
    if (global.LayoutBuffer && global.LayoutBuffer.updateAll) {
      global.LayoutBuffer.updateAll();
    }

    // استدعاء دالة الطباعة الأصلية بعد الإعداد
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
        // استعادة الهامش العادي للشاشة
        global.smartMarginHint = null;
        setButtonLoading(printBtn, false);
        _isPrinting = false;
      }
    }, 80);
  }

  // ══════════════════════════════════════════════════════════════
  // دوال مساعدة خاصة
  // ══════════════════════════════════════════════════════════════
  function _downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a   = document.createElement("a");
    a.style.display = "none";
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }

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
    exportImage:  exportImage,
    printReport:  printReport,
    showToast:    showToast,
    addWatermark: addWatermark,

    version: "3.0.0 – Commit 3 (Smart Export)"
  };

})(window);
