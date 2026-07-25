/**
 * @file shared/engines/report-image-exporter.js
 * @description محرك التصدير الموحد للتقارير كصور A4 متعددة ومستقلة بمطابقة 100% مع Flutter (1:1)
 * @version 2.0.0
 * 
 * Separation of Concerns:
 * - PageAdapter          : بناء كائن بيانات التقرير
 * - DallalReportTemplate : توليد الـ HTML القياسي للتقرير
 * - ReportImageExporter  : تقسيم صفحات A4، تحويلها لـ Canvas، وتنزيل الصور
 * - Page (Page11/13/...) : استدعاء المحرك فقط دون كود تصدير محلي
 * 
 * Stable Public API:
 * ReportImageExporter.export({
 *   reportData: Object,
 *   filename: String,
 *   scale: Number // Default 2 (1588x2246 High-DPI)
 * })
 */

(function (global) {
  "use strict";

  var ReportImageExporter = {
    /**
     * تصدير التقرير كصور صفحات A4 عالية الدقة ومستقلة
     * @param {Object} options
     * @param {string} [legacyFilename]
     */
    export: function (options, legacyFilename) {
      // 1. دعم الواجهة البرمجية المستقرة (Object Signature & Legacy Fallback)
      var reportData = null;
      var filename = "تقرير-الدَّلاَّل";
      var scale = 2;

      if (options && typeof options === "object" && options.reportData) {
        reportData = options.reportData;
        filename = options.filename || filename;
        scale = options.scale || scale;
      } else if (options && typeof options === "object") {
        reportData = options;
        filename = legacyFilename || filename;
      }

      if (!reportData) {
        if (global.DallalToast) DallalToast.error("🔴 تعذر إعداد بيانات التقرير للتصدير.");
        else alert("🔴 تعذر إعداد بيانات التقرير للتصدير.");
        return;
      }

      // 2. توليد التقرير من المرجع الأحادي DallalReportTemplate
      let htmlContent = "";
      if (global.DallalReportTemplate && typeof global.DallalReportTemplate.renderHTML === "function") {
        htmlContent = global.DallalReportTemplate.renderHTML(reportData);
      } else if (global.ReportEngine && typeof global.ReportEngine.generateHTML === "function") {
        htmlContent = global.ReportEngine.generateHTML(reportData);
      }

      if (!htmlContent) {
        if (global.DallalToast) DallalToast.error("🔴 فشل توليد التقرير الهيكلي.");
        else alert("🔴 فشل توليد التقرير الهيكلي.");
        return;
      }

      // 3. أبعاد A4 القياسية وإعداد حاوية الـ DOM
      const A4_WIDTH = 794;   // 96 DPI Width
      const A4_HEIGHT = 1123; // 96 DPI Height

      const tempContainer = document.createElement("div");
      tempContainer.style.cssText = [
        "position: fixed",
        "left: -9999px",
        "top: 0",
        "width: " + A4_WIDTH + "px",
        "background: #ffffff",
        "color: #222222",
        "font-family: Cairo, Arial, sans-serif",
        "direction: rtl",
        "box-sizing: border-box",
        "z-index: -99999"
      ].join("; ");

      tempContainer.innerHTML = htmlContent;
      tempContainer.querySelectorAll("script, link, meta").forEach(function (el) { el.remove(); });
      document.body.appendChild(tempContainer);

      const totalHeight = Math.max(A4_HEIGHT, tempContainer.scrollHeight || A4_HEIGHT);
      const totalPages = Math.max(1, Math.ceil(totalHeight / A4_HEIGHT));

      // 4. تسلسل XML الفعلي لكل صفحة A4 باستخدام DOM APIs
      const svgNS = "http://www.w3.org/2000/svg";
      const pageImages = [];

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const svgEl = document.createElementNS(svgNS, "svg");
        svgEl.setAttribute("xmlns", svgNS);
        svgEl.setAttribute("width", A4_WIDTH.toString());
        svgEl.setAttribute("height", A4_HEIGHT.toString());

        const foreignObj = document.createElementNS(svgNS, "foreignObject");
        foreignObj.setAttribute("width", "100%");
        foreignObj.setAttribute("height", "100%");

        const pageDiv = document.createElement("div");
        pageDiv.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        pageDiv.style.cssText = [
          "background: #ffffff",
          "width: " + A4_WIDTH + "px",
          "height: " + A4_HEIGHT + "px",
          "overflow: hidden",
          "position: relative",
          "padding: 15px 20px",
          "box-sizing: border-box",
          "font-family: Cairo, Arial, sans-serif",
          "direction: rtl"
        ].join("; ");

        const innerWrapper = document.createElement("div");
        innerWrapper.style.cssText = [
          "position: absolute",
          "top: " + (-pageIdx * A4_HEIGHT) + "px",
          "left: 0",
          "width: 100%",
          "background: #ffffff"
        ].join("; ");

        innerWrapper.innerHTML = tempContainer.innerHTML;
        pageDiv.appendChild(innerWrapper);

        if (totalPages > 1) {
          const pageNumBadge = document.createElement("div");
          pageNumBadge.style.cssText = [
            "position: absolute",
            "bottom: 8px",
            "left: 20px",
            "font-size: 10px",
            "font-weight: bold",
            "color: #666666",
            "background: rgba(255,255,255,0.9)",
            "padding: 2px 8px",
            "border-radius: 4px",
            "border: 1px solid #e0e0e0"
          ].join("; ");
          pageNumBadge.textContent = "صفحة " + (pageIdx + 1) + " من " + totalPages;
          pageDiv.appendChild(pageNumBadge);
        }

        foreignObj.appendChild(pageDiv);
        svgEl.appendChild(foreignObj);

        const serializer = new XMLSerializer();
        const validXmlSvg = serializer.serializeToString(svgEl);
        const svgBlob = new Blob([validXmlSvg], { type: "image/svg+xml;charset=utf-8" });

        pageImages.push({
          pageIndex: pageIdx + 1,
          svgBlob: svgBlob
        });
      }

      // إدارة الذاكرة: إزالة حاوية الـ DOM فور انتهاء معالجة الهيكل
      if (tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }

      // 5. التنزيل التتابعي للصفحات مع تنظيف كامل الذاكرة (Memory Cleanup)
      function processNextPage(idx) {
        if (idx >= pageImages.length) {
          pageImages.length = 0; // تحرير المصفوفة
          return;
        }

        const pInfo = pageImages[idx];
        const url = URL.createObjectURL(pInfo.svgBlob);
        let img = new Image();

        img.onload = function () {
          try {
            let canvas = document.createElement("canvas");
            canvas.width = A4_WIDTH * scale;
            canvas.height = A4_HEIGHT * scale;

            let ctx = canvas.getContext("2d");
            ctx.scale(scale, scale);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(async function (pngBlob) {
              URL.revokeObjectURL(url);
              img.onload = null;
              img.onerror = null;
              img = null;

              if (!pngBlob) {
                downloadFallback(pInfo.svgBlob, pInfo.pageIndex, "svg");
              } else {
                const pageFilename = filename + "-" + pInfo.pageIndex + ".png";
                const blobUrl = URL.createObjectURL(pngBlob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = blobUrl;
                a.download = pageFilename;
                document.body.appendChild(a);
                a.click();

                setTimeout(function () {
                  if (a.parentNode) a.parentNode.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                }, 250);
              }

              // تنظيف الـ Canvas للذاكرة
              canvas.width = 0;
              canvas.height = 0;
              canvas = null;
              ctx = null;

              setTimeout(function () {
                processNextPage(idx + 1);
              }, 350);

            }, "image/png");
          } catch (err) {
            console.error("[ReportImageExporter] Canvas export error:", err);
            URL.revokeObjectURL(url);
            downloadFallback(pInfo.svgBlob, pInfo.pageIndex, "svg");
            setTimeout(function () { processNextPage(idx + 1); }, 350);
          }
        };

        img.onerror = function (err) {
          console.error("[ReportImageExporter] SVG load error:", err);
          URL.revokeObjectURL(url);
          downloadFallback(pInfo.svgBlob, pInfo.pageIndex, "svg");
          setTimeout(function () { processNextPage(idx + 1); }, 350);
        };

        img.src = url;
      }

      function downloadFallback(blobObj, pageNum, ext) {
        const blobUrl = URL.createObjectURL(blobObj);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = blobUrl;
        a.download = filename + "-" + pageNum + "." + ext;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          if (a.parentNode) a.parentNode.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 250);
      }

      processNextPage(0);
    }
  };

  global.ReportImageExporter = ReportImageExporter;

})(typeof window !== "undefined" ? window : global);
