/**
 * @file shared/engines/report-image-exporter.js
 * @description محرك تصدير تقارير الدَّلاَّل — مطابقة 100% لتقسيم فلاتر المنطقي (Data Pagination)
 *   DallalReportTemplate.renderPagesHTML() → Div A4 Container → html2canvas → PNG → Download
 * @version 7.0.0
 */

(function (global) {
  "use strict";

  /* ─── ثوابت A4 @96dpi ──────────────────────────────────────── */
  var A4_W = 794;
  var A4_H = 1123;

  /* ─── Logs & Utils ─────────────────────────────────────────── */
  function _log(step, msg, extra) {
    var s = "[RIE Step " + step + "] " + msg;
    if (extra !== undefined) { console.log(s, extra); }
    else                     { console.log(s); }
  }

  function _err(step, msg, e) {
    console.error("[RIE Step " + step + " FAILED]", msg, e !== undefined ? e : "");
  }

  function _toast(type, msg) {
    if (global.DallalToast && typeof global.DallalToast[type] === "function") {
      global.DallalToast[type](msg);
    }
  }

  function _removeEl(el) {
    try { if (el && el.parentNode) el.parentNode.removeChild(el); } catch(e) {}
  }

  /* ─── استخراج <style> و <body> من كود HTML الصفحة ───────────── */
  function _extractParts(htmlContent) {
    var css = "";
    var styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    var match;
    while ((match = styleRe.exec(htmlContent)) !== null) {
      css += match[1] + "\n";
    }

    var bodyContent = "";
    var bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
    } else {
      var headEnd = htmlContent.toLowerCase().indexOf("</head>");
      if (headEnd >= 0) {
        bodyContent = htmlContent.substring(headEnd + 7);
        bodyContent = bodyContent.replace(/<\/?html[^>]*>/gi, "")
                                 .replace(/<\/?body[^>]*>/gi, "");
      } else {
        bodyContent = htmlContent;
      }
    }

    return { css: css, body: bodyContent };
  }

  /* ─── تنزيل PNG Blob ───────────────────────────────────────── */
  function _downloadBlob(blob, name, pageIdx, total) {
    _log(6, "Blob ready — size: " + blob.size + " bytes — file: " + name);

    var url = URL.createObjectURL(blob);
    var a   = document.createElement("a");
    a.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;";
    a.href     = url;
    a.download = name;

    _log(7, "Download request sent ✓ page " + pageIdx + " of " + total);

    document.body.appendChild(a);
    a.click();

    setTimeout(function () {
      _removeEl(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /* ─── تصوير صفحة A4 واحدة رسمياً تحويلها لـ PNG ─────────────── */
  function _renderSinglePage(pageHtml, pageIndex, totalPages, filename, scale, callback) {
    _log(3, "Rendering page " + pageIndex + " of " + totalPages + "...");

    var parts = _extractParts(pageHtml);

    // 1. إدخال CSS في <head>
    var styleEl = document.createElement("style");
    styleEl.id  = "rpt-style-p" + pageIndex + "-" + Date.now();
    styleEl.textContent = parts.css;
    document.head.appendChild(styleEl);

    // 2. إنشاء حاوية A4 قياسية off-screen (794px × 1123px)
    var container = document.createElement("div");
    container.id  = "rpt-container-p" + pageIndex + "-" + Date.now();
    container.style.cssText = [
      "position: absolute",
      "left: -9999px",
      "top: 0",
      "width: " + A4_W + "px",
      "height: " + A4_H + "px",
      "overflow: hidden",
      "background: #ffffff",
      "direction: rtl",
      "font-family: Cairo, Arial, sans-serif",
      "color: #1e293b",
      "box-sizing: border-box",
      "z-index: 1"
    ].join("; ");

    container.innerHTML = parts.body;
    container.querySelectorAll("script, link").forEach(function (el) { el.remove(); });
    document.body.appendChild(container);

    var targetEl = container.querySelector(".a4-page-container") || container;

    // [RIE Diagnostic Stage 3]: Log tempContainer.innerHTML before html2canvas
    console.log("=== [RIE Diagnostic Stage 3: tempContainer.innerHTML] ===");
    console.log(container.innerHTML);

    setTimeout(function () {
      if (typeof global.html2canvas !== "function") {
        _err(4, "html2canvas NOT loaded");
        _removeEl(container);
        _removeEl(styleEl);
        if (callback) callback(new Error("html2canvas not loaded"));
        return;
      }

      global.html2canvas(targetEl, {
        scale:           scale,
        useCORS:         true,
        allowTaint:      true,
        backgroundColor: "#ffffff",
        logging:         false,
        width:           A4_W,
        height:          A4_H,
        windowWidth:     A4_W,
        windowHeight:    A4_H,
        scrollX:         0,
        scrollY:         0
      })
      .then(function (canvas) {
        // [RIE Diagnostic Stage 4]: Log after canvas creation
        console.log("=== [RIE Diagnostic Stage 4: Canvas created] ===");
        _log(4, "html2canvas SUCCESS page " + pageIndex + " ✓ size: " + canvas.width + "x" + canvas.height);

        _removeEl(container);
        _removeEl(styleEl);

        canvas.toBlob(function (blob) {
          canvas.width  = 0;
          canvas.height = 0;

          if (!blob) {
            _err(5, "toBlob returned null for page " + pageIndex);
            if (callback) callback(new Error("toBlob returned null"));
            return;
          }

          var pageName = filename + "-" + pageIndex + ".png";
          // [RIE Diagnostic Stage 5]: Log final image blob export
          console.log("=== [RIE Diagnostic Stage 5: Final Image Exported] ===", pageName, blob.size + " bytes");
          _downloadBlob(blob, pageName, pageIndex, totalPages);

          setTimeout(function () {
            if (callback) callback(null);
          }, 600);

        }, "image/png");

      })
      .catch(function (err) {
        _err(4, "html2canvas FAILED on page " + pageIndex, err);
        _removeEl(container);
        _removeEl(styleEl);
        if (callback) callback(err);
      });

    }, 250);
  }

  /* ─── الواجهة العامة ─────────────────────────────────────── */
  var ReportImageExporter = {
    export: function (options, legacyFilename) {
      _log(1, "ReportImageExporter.export() called [Data Pagination Engine v7.0]");

      var reportData = null;
      var filename   = "تقرير-الدلال";
      var scale      = 2;

      if (options && typeof options === "object" && options.reportData) {
        reportData = options.reportData;
        filename   = options.filename || filename;
        scale      = options.scale    || scale;
      } else if (options && typeof options === "object") {
        reportData = options;
        filename   = legacyFilename || filename;
      }

      if (!reportData) {
        _err(1, "reportData is null");
        _toast("error", "❌ بيانات التقرير فارغة");
        return;
      }

      // [RIE Diagnostic Stage 1]: Log reportData
      console.log("=== [RIE Diagnostic Stage 1: reportData] ===");
      console.log(reportData);

      _log(2, "Generating pages via DallalReportTemplate.renderPagesHTML...");

      var pagesHTML = [];
      if (global.DallalReportTemplate && typeof global.DallalReportTemplate.renderPagesHTML === "function") {
        pagesHTML = global.DallalReportTemplate.renderPagesHTML(reportData);
      } else if (global.DallalReportTemplate && typeof global.DallalReportTemplate.renderHTML === "function") {
        pagesHTML = [global.DallalReportTemplate.renderHTML(reportData)];
      }

      // [RIE Diagnostic Stage 2]: Log renderHTML/renderPagesHTML output
      console.log("=== [RIE Diagnostic Stage 2: renderHTML()] ===");
      console.log("Total pages generated:", pagesHTML ? pagesHTML.length : 0);
      if (pagesHTML && pagesHTML[0]) {
        console.log("Sample page 1 HTML snippet:", pagesHTML[0].substring(0, 400));
      }

      if (!pagesHTML || pagesHTML.length === 0 || !pagesHTML[0]) {
        _err(2, "renderPagesHTML returned no pages");
        _toast("error", "❌ فشل توليد صفحات التقرير");
        return;
      }

      var totalPages = pagesHTML.length;
      _log(2, "Total data-paginated A4 pages:", totalPages);

      // تصوير وتنزيل الصفحات بالتتابع
      var pIdx = 0;

      function processNextPage() {
        if (pIdx >= totalPages) {
          _log(7, "All " + totalPages + " pages processed successfully ✓");
          _toast("success", "✅ تم تنزيل " + totalPages + " صورة بنجاح!");
          return;
        }

        var currentPageIdx = pIdx + 1;
        var pageCode       = pagesHTML[pIdx];
        pIdx++;

        _renderSinglePage(pageCode, currentPageIdx, totalPages, filename, scale, function (err) {
          if (err) {
            console.error("[RIE] Error on page " + currentPageIdx + ":", err);
          }
          setTimeout(processNextPage, 400);
        });
      }

      processNextPage();
    }
  };

  global.ReportImageExporter = ReportImageExporter;

})(typeof window !== "undefined" ? window : global);
