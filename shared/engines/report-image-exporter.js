/**
 * @file shared/engines/report-image-exporter.js
 * @description محرك التصدير الموحد للتقارير كصور A4 متعددة ومستقلة بمطابقة 100% مع Flutter (1:1)
 * @version 3.0.0
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

      // 1. توليد كود الـ HTML الموحد من DallalReportTemplate (المطابق تماماً لـ Flutter)
      var htmlContent = "";
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

      // 2. إنشاء حاوية A4 بالـ DOM بأبعاد ثابتة (794px عرض A4 القياسي)
      var A4_WIDTH = 794;
      var A4_HEIGHT = 1123;

      var tempContainer = document.createElement("div");
      tempContainer.style.cssText = [
        "position: fixed",
        "left: -9999px",
        "top: 0",
        "width: " + A4_WIDTH + "px",
        "background: #ffffff",
        "color: #1e293b",
        "font-family: Cairo, Arial, sans-serif",
        "direction: rtl",
        "box-sizing: border-box",
        "z-index: -99999"
      ].join("; ");

      tempContainer.innerHTML = htmlContent;
      tempContainer.querySelectorAll("script, link, meta").forEach(function (el) { el.remove(); });
      document.body.appendChild(tempContainer);

      // دالة التصدير الرئيسية باستخدام html2canvas للـ Canvas المباشر (لضمان الجوال 100%)
      function renderAndExportWithHtml2Canvas() {
        if (typeof global.html2canvas !== "function") {
          renderAndExportWithSvgFallback();
          return;
        }

        global.html2canvas(tempContainer, {
          scale: scale,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false
        }).then(function (mainCanvas) {
          if (tempContainer.parentNode) {
            tempContainer.parentNode.removeChild(tempContainer);
          }

          var totalCanvasWidth = mainCanvas.width;
          var totalCanvasHeight = mainCanvas.height;

          var scaledA4Width = A4_WIDTH * scale;
          var scaledA4Height = A4_HEIGHT * scale;

          var totalPages = Math.max(1, Math.ceil(totalCanvasHeight / scaledA4Height));
          var pageBlobs = [];

          for (var p = 0; p < totalPages; p++) {
            var pageCanvas = document.createElement("canvas");
            pageCanvas.width = scaledA4Width;
            pageCanvas.height = scaledA4Height;

            var pCtx = pageCanvas.getContext("2d");
            pCtx.fillStyle = "#ffffff";
            pCtx.fillRect(0, 0, scaledA4Width, scaledA4Height);

            var srcY = p * scaledA4Height;
            var srcH = Math.min(scaledA4Height, totalCanvasHeight - srcY);

            pCtx.drawImage(
              mainCanvas,
              0, srcY, totalCanvasWidth, srcH,
              0, 0, scaledA4Width, srcH
            );

            // ترقيم الصفحات في الأسفل إذا كان التقرير أكثر من صفحة
            if (totalPages > 1) {
              pCtx.font = "bold " + (12 * scale) + "px Cairo, Arial, sans-serif";
              pCtx.fillStyle = "#64748b";
              pCtx.textAlign = "left";
              pCtx.fillText("صفحة " + (p + 1) + " من " + totalPages, 30 * scale, scaledA4Height - (15 * scale));
            }

            pageBlobs.push({
              pageIndex: p + 1,
              canvas: pageCanvas
            });
          }

          // تنظيف الـ mainCanvas
          mainCanvas.width = 0;
          mainCanvas.height = 0;

          // تنزيل صور الـ PNG بالتتابع على الهاتف/المتصفح
          function downloadNextPng(idx) {
            if (idx >= pageBlobs.length) {
              pageBlobs.length = 0;
              return;
            }

            var item = pageBlobs[idx];
            item.canvas.toBlob(function (pngBlob) {
              item.canvas.width = 0;
              item.canvas.height = 0;
              item.canvas = null;

              if (pngBlob) {
                var pageFilename = filename + "-" + item.pageIndex + ".png";
                var blobUrl = URL.createObjectURL(pngBlob);
                var a = document.createElement("a");
                a.style.display = "none";
                a.href = blobUrl;
                a.download = pageFilename;
                document.body.appendChild(a);
                a.click();

                setTimeout(function () {
                  if (a.parentNode) a.parentNode.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                }, 300);
              }

              setTimeout(function () {
                downloadNextPng(idx + 1);
              }, 400);

            }, "image/png");
          }

          downloadNextPng(0);

        }).catch(function (err) {
          console.error("[ReportImageExporter] html2canvas error:", err);
          renderAndExportWithSvgFallback();
        });
      }

      // طريقة الـ SVG الاحتياطية
      function renderAndExportWithSvgFallback() {
        var totalHeight = Math.max(A4_HEIGHT, tempContainer.scrollHeight || A4_HEIGHT);
        var totalPages = Math.max(1, Math.ceil(totalHeight / A4_HEIGHT));

        var svgNS = "http://www.w3.org/2000/svg";
        var pageImages = [];

        for (var pageIdx = 0; pageIdx < totalPages; pageIdx++) {
          var svgEl = document.createElementNS(svgNS, "svg");
          svgEl.setAttribute("xmlns", svgNS);
          svgEl.setAttribute("width", A4_WIDTH.toString());
          svgEl.setAttribute("height", A4_HEIGHT.toString());

          var foreignObj = document.createElementNS(svgNS, "foreignObject");
          foreignObj.setAttribute("width", "100%");
          foreignObj.setAttribute("height", "100%");

          var pageDiv = document.createElement("div");
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

          var innerWrapper = document.createElement("div");
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
            var pageNumBadge = document.createElement("div");
            pageNumBadge.style.cssText = [
              "position: absolute",
              "bottom: 8px",
              "left: 20px",
              "font-size: 10px",
              "font-weight: bold",
              "color: #64748b",
              "background: rgba(255,255,255,0.9)",
              "padding: 2px 8px",
              "border-radius: 4px",
              "border: 1px solid #cbd5e1"
            ].join("; ");
            pageNumBadge.textContent = "صفحة " + (pageIdx + 1) + " من " + totalPages;
            pageDiv.appendChild(pageNumBadge);
          }

          foreignObj.appendChild(pageDiv);
          svgEl.appendChild(foreignObj);

          var serializer = new XMLSerializer();
          var validXmlSvg = serializer.serializeToString(svgEl);
          var svgBlob = new Blob([validXmlSvg], { type: "image/svg+xml;charset=utf-8" });

          pageImages.push({
            pageIndex: pageIdx + 1,
            svgBlob: svgBlob
          });
        }

        if (tempContainer.parentNode) {
          tempContainer.parentNode.removeChild(tempContainer);
        }

        function processNextSvgPage(idx) {
          if (idx >= pageImages.length) {
            pageImages.length = 0;
            return;
          }

          var pInfo = pageImages[idx];
          var url = URL.createObjectURL(pInfo.svgBlob);
          var img = new Image();

          img.onload = function () {
            try {
              var canvas = document.createElement("canvas");
              canvas.width = A4_WIDTH * scale;
              canvas.height = A4_HEIGHT * scale;

              var ctx = canvas.getContext("2d");
              ctx.scale(scale, scale);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
              ctx.drawImage(img, 0, 0);

              canvas.toBlob(function (pngBlob) {
                URL.revokeObjectURL(url);
                img.onload = null;
                img.onerror = null;
                img = null;

                if (pngBlob) {
                  var pageFilename = filename + "-" + pInfo.pageIndex + ".png";
                  var blobUrl = URL.createObjectURL(pngBlob);
                  var a = document.createElement("a");
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

                canvas.width = 0;
                canvas.height = 0;
                canvas = null;

                setTimeout(function () {
                  processNextSvgPage(idx + 1);
                }, 350);

              }, "image/png");
            } catch (err) {
              console.error("[ReportImageExporter] Canvas SVG export error:", err);
              URL.revokeObjectURL(url);
              setTimeout(function () { processNextSvgPage(idx + 1); }, 350);
            }
          };

          img.onerror = function (err) {
            console.error("[ReportImageExporter] SVG load error:", err);
            URL.revokeObjectURL(url);
            setTimeout(function () { processNextSvgPage(idx + 1); }, 350);
          };

          img.src = url;
        }

        processNextSvgPage(0);
      }

      renderAndExportWithHtml2Canvas();
    }
  };

  global.ReportImageExporter = ReportImageExporter;

})(typeof window !== "undefined" ? window : global);
