/**
 * @file shared/engines/report-image-exporter.js
 * @description محرك التصدير — مسار واحد فقط بدون Fallback
 *   DallalReportTemplate → div+style → html2canvas → A4 PNG → download
 * @version 6.0.0
 *
 * لماذا div+style وليس iframe؟
 *   html2canvas لها قيود موثقة مع الـ iframes (especially cross-document).
 *   الطريقة الموثوقة هي استخراج <style> + <body> وحقنهما في div
 *   داخل المستند الحالي — html2canvas تلتقطه بشكل كامل وموثوق.
 */

(function (global) {
  "use strict";

  /* ─── ثوابت A4 @96dpi ──────────────────────────────────────── */
  var A4_W = 794;
  var A4_H = 1123;

  /* ─── Logs ─────────────────────────────────────────────────── */
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

  /* ─── استخراج <style> و <body> من HTML كامل ───────────────── */
  function _extractParts(htmlContent) {
    // استخراج كل <style> tags
    var css = "";
    var styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    var match;
    while ((match = styleRe.exec(htmlContent)) !== null) {
      css += match[1] + "\n";
    }

    // استخراج محتوى <body>
    var bodyContent = "";
    var bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
    } else {
      // Fallback: كل شيء بعد </head>
      var headEnd = htmlContent.toLowerCase().indexOf("</head>");
      if (headEnd >= 0) {
        bodyContent = htmlContent.substring(headEnd + 7);
        bodyContent = bodyContent.replace(/<\/?html[^>]*>/gi, "")
                                 .replace(/<\/?body[^>]*>/gi, "");
      } else {
        bodyContent = htmlContent;
      }
    }

    _log(3, "Extracted CSS length:", css.length + " chars");
    _log(3, "Extracted body length:", bodyContent.length + " chars");

    return { css: css, body: bodyContent };
  }

  /* ─── Step 6: تنزيل blob ───────────────────────────────────── */
  function _downloadBlob(blob, name, pageIdx, total) {
    console.log("[RIE Step 6] Blob ready — size:", blob.size, "bytes — file:", name);

    var url = URL.createObjectURL(blob);
    var a   = document.createElement("a");
    a.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;";
    a.href     = url;
    a.download = name;

    console.log("[RIE Step 7] link.download =", a.download);
    console.log("[RIE Step 7] link.href =", url.substring(0, 80) + "...");

    document.body.appendChild(a);
    a.click();

    console.log("[RIE Step 7] Download request sent ✓ — page", pageIdx, "of", total);

    setTimeout(function () {
      _removeEl(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /* ─── Step 5: تقطيع mainCanvas إلى صفحات A4 ──────────────── */
  function _slicePages(mainCanvas, filename, scale, onDone) {
    var scaledW    = A4_W * scale;
    var scaledH    = A4_H * scale;
    var totalPages = Math.max(1, Math.ceil(mainCanvas.height / scaledH));

    console.log("[RIE Step 5] Canvas dimensions:", mainCanvas.width, "×", mainCanvas.height, "px");
    console.log("[RIE Step 5] Total A4 pages:", totalPages);

    if (mainCanvas.width === 0 || mainCanvas.height === 0) {
      _err(5, "Canvas is 0×0 — html2canvas captured nothing. Is the target element visible?");
      _toast("error", "❌ Canvas فارغ (0×0) — لم يلتقط html2canvas أي محتوى");
      return;
    }

    var idx = 0;

    function next() {
      if (idx >= totalPages) {
        mainCanvas.width  = 0;
        mainCanvas.height = 0;
        _log(5, "All pages downloaded ✓");
        if (typeof onDone === "function") onDone(totalPages);
        return;
      }

      var p    = idx++;
      var page = document.createElement("canvas");
      page.width  = scaledW;
      page.height = scaledH;

      var ctx = page.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, scaledW, scaledH);

      var srcY = p * scaledH;
      var srcH = Math.min(scaledH, mainCanvas.height - srcY);

      if (srcH > 0) {
        ctx.drawImage(mainCanvas, 0, srcY, mainCanvas.width, srcH,
                                 0, 0,    scaledW,           srcH);
      }

      if (totalPages > 1) {
        ctx.font      = "bold " + (12 * scale) + "px Cairo,Arial,sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "left";
        ctx.fillText("صفحة " + (p + 1) + " من " + totalPages,
                     20 * scale, scaledH - 12 * scale);
      }

      var pageNum  = p + 1;
      var pageName = filename + "-" + pageNum + ".png";

      _log(5, "toBlob for page", pageNum + " / " + totalPages);

      page.toBlob(function (blob) {
        page.width  = 0;
        page.height = 0;

        if (!blob) {
          _err(6, "toBlob returned null for page " + pageNum);
          setTimeout(next, 700);
          return;
        }

        _downloadBlob(blob, pageName, pageNum, totalPages);
        setTimeout(next, 700);   // تأخير بين الصفحات (Samsung/iOS)
      }, "image/png");
    }

    next();
  }

  /* ─── Step 4: html2canvas على container ──────────────────── */
  function _captureDiv(container, styleEl, filename, scale) {
    if (typeof global.html2canvas !== "function") {
      _err(4, "html2canvas NOT loaded. typeof =", typeof global.html2canvas);
      _toast("error", "❌ html2canvas غير موجود — تحقق من تحميل html2canvas.min.js");
      _removeEl(container);
      _removeEl(styleEl);
      return;
    }

    var h = container.scrollHeight || A4_H;
    _log(4, "Container scrollHeight:", h + " px");
    _log(4, "Calling html2canvas...");

    global.html2canvas(container, {
      scale:           scale,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: "#ffffff",
      logging:         true,
      width:           A4_W,
      height:          h,
      windowWidth:     A4_W,
      windowHeight:    h,
      scrollX:         -container.getBoundingClientRect().left,
      scrollY:         0
    })
    .then(function (mainCanvas) {
      _log(4, "html2canvas SUCCESS ✓ Canvas:", mainCanvas.width + " × " + mainCanvas.height);

      _removeEl(container);
      _removeEl(styleEl);

      _slicePages(mainCanvas, filename, scale, function (n) {
        _toast("success", "✅ تم تنزيل " + n + " صورة بنجاح!");
      });
    })
    .catch(function (err) {
      _err(4, "html2canvas FAILED:", err);
      _toast("error", "❌ html2canvas فشل: " + (err.message || err));
      _removeEl(container);
      _removeEl(styleEl);
    });
  }

  /* ─── Step 3: إنشاء div+style ─────────────────────────────── */
  function _buildAndCapture(htmlContent, filename, scale) {
    _log(3, "Parsing HTML — extracting <style> and <body>...");

    var parts = _extractParts(htmlContent);

    if (!parts.body || parts.body.trim().length < 20) {
      _err(3, "Body content is empty after parsing HTML");
      _toast("error", "❌ محتوى التقرير فارغ بعد المعالجة");
      return;
    }

    /* ── إدخال <style> في <head> ───────────────────────────── */
    var styleEl = document.createElement("style");
    styleEl.id  = "rpt-capture-style-" + Date.now();
    styleEl.textContent = parts.css;
    document.head.appendChild(styleEl);
    _log(3, "Style injected into <head> ✓");

    /* ── إنشاء حاوية off-screen ────────────────────────────── */
    var container = document.createElement("div");
    container.id  = "rpt-capture-container-" + Date.now();
    container.style.cssText = [
      "position: absolute",
      "left: -9999px",
      "top: 0",
      "width: " + A4_W + "px",
      "height: auto",
      "overflow: visible",
      "background: #ffffff",
      "direction: rtl",
      "font-family: Cairo, Arial, sans-serif",
      "color: #1e293b",
      "font-size: 9.5pt",
      "line-height: 1.4",
      "padding: 16px 20px",
      "box-sizing: border-box",
      "z-index: 1"    // لا نحتاج 9999 — الحاوية off-screen
    ].join("; ");

    container.innerHTML = parts.body;
    // إزالة أي scripts أو links إضافية
    container.querySelectorAll("script, link").forEach(function (el) { el.remove(); });

    document.body.appendChild(container);

    var h = container.scrollHeight;
    _log(3, "Container appended — scrollHeight:", h + " px  (width: " + A4_W + "px)");

    if (h === 0) {
      _err(3, "Container scrollHeight is 0 — body content may be empty or invisible");
    }

    /* ── انتظر قليلاً للتخطيط ──────────────────────────────── */
    setTimeout(function () {
      _captureDiv(container, styleEl, filename, scale);
    }, 300);
  }

  /* ─── الواجهة العامة ─────────────────────────────────────── */
  var ReportImageExporter = {
    export: function (options, legacyFilename) {

      // ── Step 1 ────────────────────────────────────────────
      _log(1, "ReportImageExporter.export() called");
      console.log("[RIE Step 1] typeof html2canvas       =", typeof global.html2canvas);
      console.log("[RIE Step 1] typeof ReportImageExporter=", typeof global.ReportImageExporter);
      console.log("[RIE Step 1] typeof DallalReportTemplate=", typeof global.DallalReportTemplate);
      console.log("[RIE Step 1] typeof Page13Adapter      =", typeof global.Page13Adapter);

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

      _log(1, "reportData =", reportData ? "object ✓" : "NULL ✗");
      _log(1, "filename   =", filename);
      _log(1, "scale      =", scale);

      if (!reportData) {
        _err(1, "reportData is null");
        _toast("error", "❌ بيانات التقرير فارغة");
        return;
      }

      // ── Step 2 ────────────────────────────────────────────
      _log(2, "Checking DallalReportTemplate.renderHTML...");

      if (!global.DallalReportTemplate ||
          typeof global.DallalReportTemplate.renderHTML !== "function") {
        _err(2, "DallalReportTemplate not loaded");
        _toast("error", "❌ DallalReportTemplate غير محمّل");
        return;
      }

      var htmlContent;
      try {
        htmlContent = global.DallalReportTemplate.renderHTML(reportData);
        _log(2, "renderHTML returned:", htmlContent ? htmlContent.length + " chars ✓" : "EMPTY ✗");
        console.log("[RIE Step 2] First 200 chars:", htmlContent ? htmlContent.substring(0, 200) : "EMPTY");
      } catch (e) {
        _err(2, "renderHTML threw:", e);
        _toast("error", "❌ renderHTML خطأ: " + e.message);
        return;
      }

      if (!htmlContent || htmlContent.trim().length < 100) {
        _err(2, "HTML is empty or too short. length =", htmlContent && htmlContent.length);
        _toast("error", "❌ HTML التقرير فارغ");
        return;
      }

      // ── Steps 3–7: بناء div وتصويره ─────────────────────
      _log(3, "Starting div+style render pipeline...");
      _buildAndCapture(htmlContent, filename, scale);
    }
  };

  global.ReportImageExporter = ReportImageExporter;

})(typeof window !== "undefined" ? window : global);
