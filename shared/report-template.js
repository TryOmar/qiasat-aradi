/**
 * @file shared/report-template.js
 * @description قالب تقرير الدَّلاَّل الموحد — مطابقة 1:1 مع مخرجات Flutter
 * @version 4.0.0
 */

(function (global) {
  "use strict";

  const DallalReportTemplate = {

    // ─────────────────────────────────────────────────────────────
    // تطبيع البيانات الواردة إلى بنية قياسية موحدة
    // ─────────────────────────────────────────────────────────────
    normalizeReportData(rawData) {
      rawData = rawData || {};

      const normalized = {
        reportTitle:      rawData.reportTitle    || "بيان المساحات",
        reportSubtitle:   rawData.reportSubtitle || "جملة الغيط",
        dateStr:          rawData.dateStr        || new Date().toLocaleDateString("ar-EG"),
        timeStr:          rawData.timeStr        || new Date().toLocaleTimeString("ar-EG"),
        dimensions:       [],
        partners:         [],
        partnerCardsHTML: rawData.partnerCardsHTML || "",
        gridStyle:        rawData.gridStyle        || "",
        totals:           [],
        notes:            []
      };

      // 1. الأبعاد
      if (Array.isArray(rawData.dimensions)) {
        normalized.dimensions = rawData.dimensions;
      }

      // 2. الشركاء
      if (Array.isArray(rawData.partners)) {
        normalized.partners = rawData.partners;
      }

      // 3. الإجماليات
      if (Array.isArray(rawData.totals)) {
        normalized.totals = rawData.totals;
      } else if (rawData.totals && typeof rawData.totals === "object") {
        const t = rawData.totals;
        normalized.totals = [
          { label: "إجمالي المساحة",     value: t.totalArea   ? `${t.totalArea} م²`         : "—", isHighlight: true },
          { label: "إجمالي الفدادين",    value: t.totalFeddans !== undefined ? String(t.totalFeddans) : "—" },
          { label: "إجمالي القراريط",    value: t.totalCarats  !== undefined ? String(t.totalCarats)  : "—" },
          { label: "إجمالي الأسهم",      value: t.totalShares  !== undefined ? String(t.totalShares)  : "—" },
          { label: "مساحة القيراط (2p)", value: t.caratArea    ? String(t.caratArea) : "168" }
        ];
      }

      // 4. الملاحظات
      if (Array.isArray(rawData.notes)) {
        normalized.notes = rawData.notes;
      } else if (typeof rawData.notes === "string") {
        normalized.notes = [rawData.notes];
      } else {
        normalized.notes = [
          "جميع الأطوال بالمتر.",
          "تم تقسيم الغيط إلى أجزاء تفصيلية بالطريقة الطولية.",
          "اتجاه التقسيم للتنفيذ الميداني: من اليمين إلى اليسار."
        ];
      }

      return normalized;
    },

    // ─────────────────────────────────────────────────────────────
    // توليد HTML الكامل المطابق لتصميم Flutter
    // ─────────────────────────────────────────────────────────────
    renderHTML(rawData) {
      const data = this.normalizeReportData(rawData);

      /* ── 1. صفوف جدول الأبعاد ─────────────────────────────── */
      let dimensionsRowsHTML = "";
      if (data.dimensions.length > 0) {
        dimensionsRowsHTML = data.dimensions.map(d => {
          const valClass = d.isHighlight ? "val-highlight" : "";
          return `
            <tr>
              <td style="text-align:right;font-weight:600;">${d.label}</td>
              <td class="${valClass}" style="text-align:left;direction:ltr;">${d.value}</td>
            </tr>`;
        }).join("");
      }

      /* ── 2. بطاقات الشركاء ────────────────────────────────── */
      const totalPartners = data.partners.length || (data.partnerCardsHTML ? 3 : 0);
      let gridStyle = data.gridStyle;
      if (!gridStyle) {
        if      (totalPartners === 1) gridStyle = "grid-template-columns: 1fr;";
        else if (totalPartners === 2) gridStyle = "grid-template-columns: repeat(2, 1fr);";
        else                          gridStyle = "grid-template-columns: repeat(3, 1fr);";
      }

      let partnerCardsHTML = data.partnerCardsHTML;
      if (!partnerCardsHTML && data.partners.length > 0) {
        partnerCardsHTML = data.partners.map((p, idx) => {
          let dimsRows = "";
          if (p.dimensions && p.dimensions.length > 0) {
            dimsRows = p.dimensions.map(pd => `
              <tr>
                <td style="text-align:right;padding:3px 6px;">${pd.label}</td>
                <td class="td-val" style="padding:3px 6px;">${pd.value}</td>
              </tr>`).join("");
          }
          const fcsSpan = p.fcsText
            ? `<span class="pcard-foot-fcs">${p.fcsText}</span>` : "";
          return `
            <div class="pcard">
              <div class="pcard-hdr">${p.name || ("شريك " + (idx + 1))}</div>
              <table class="pcard-table">
                <thead>
                  <tr>
                    <th style="text-align:right;width:55%;">البيان</th>
                    <th style="text-align:left;">القيمة</th>
                  </tr>
                </thead>
                <tbody>${dimsRows}</tbody>
              </table>
              <div class="pcard-foot">
                <span class="pcard-foot-lbl">جملة المساحة بالمتر المربع</span>
                <span class="pcard-foot-area">${p.areaSqMeters || "0.00"} م²</span>
                ${fcsSpan}
              </div>
            </div>`;
        }).join("");
      }

      /* ── 3. صفوف ملخص التقسيم ────────────────────────────── */
      let totalsRowsHTML = "";
      if (data.totals.length > 0) {
        totalsRowsHTML = data.totals.map(t => `
          <tr>
            <td class="td-lbl">${t.label}</td>
            <td class="td-val${t.isHighlight ? " red" : ""}">${t.value}</td>
          </tr>`).join("");
      }

      /* ── 4. الملاحظات ─────────────────────────────────────── */
      const notesHTML = data.notes
        .map(n => `<li>${n}</li>`)
        .join("");

      /* ── HTML الكامل ─────────────────────────────────────── */
      return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بيان المساحات - الدلال</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Cairo', Arial, sans-serif;
      background: #ffffff;
      color: #1e293b;
      font-size: 9.5pt;
      direction: rtl;
      padding: 16px 20px;
      line-height: 1.4;
    }

    /* ── الهيدر ─────────────────────────────────────────────── */
    .rh { text-align: center; margin-bottom: 14px; position: relative; padding-bottom: 10px; }
    .rh-date {
      position: absolute; top: 0; left: 0;
      font-size: 7.5pt; color: #64748b; font-weight: 600; text-align: left;
    }
    .rh-title { font-size: 24pt; color: #0f172a; font-weight: 800; margin-bottom: 4px; }
    .rh-sub   { font-size: 13pt; color: #0f172a; font-weight: 700; margin-bottom: 8px; }
    .rh-line  { width: 200px; height: 1.5px; background: #0f172a; margin: 0 auto; border-radius: 2px; }

    /* ── جدول الأبعاد الرئيسي ───────────────────────────────── */
    .main-table {
      width: 100%; border-collapse: collapse;
      font-size: 9pt; margin-bottom: 12px;
      border: 1.5px solid #334155;
    }
    .main-table th {
      background: #ffffff; color: #0f172a; font-weight: 700;
      border: 1.5px solid #334155; padding: 7px 10px; font-size: 9.5pt;
    }
    .main-table td {
      border: 1px solid #cbd5e1; padding: 5px 10px; vertical-align: middle;
    }
    .main-table tr:nth-child(even) td { background: #f8fafc; }
    .val-highlight { color: #b91c1c; font-weight: 800; font-size: 10.5pt; }

    /* ── شبكة بطاقات الشركاء ────────────────────────────────── */
    .partners-grid { display: grid; ${gridStyle} gap: 10px; margin-bottom: 12px; }

    .pcard {
      border: 1.5px solid #334155; border-radius: 8px;
      background: #ffffff; overflow: hidden;
      display: flex; flex-direction: column;
      break-inside: avoid;
    }
    .pcard-hdr {
      background: #ffffff; color: #0f172a; font-weight: 700; font-size: 9.5pt;
      padding: 6px 8px; text-align: center; border-bottom: 1.5px solid #334155;
    }
    .pcard-table { width: 100%; border-collapse: collapse; font-size: 8pt; flex: 1; }
    .pcard-table th {
      background: #ffffff; color: #475569; font-weight: 700;
      border: 1px solid #cbd5e1; padding: 3px 6px; font-size: 8pt;
    }
    .pcard-table td { border: 1px solid #cbd5e1; padding: 3px 6px; }
    .pcard-table .td-val { font-weight: 700; color: #1b5e20; direction: ltr; text-align: left; background: #f0fdf4; }

    .pcard-foot { background: #f8fafc; border-top: 1.5px solid #334155; padding: 6px 8px; text-align: center; }
    .pcard-foot-lbl  { font-size: 7.5pt; color: #64748b; display: block; margin-bottom: 2px; }
    .pcard-foot-area { font-size: 11pt; color: #991b1b; font-weight: 800; display: block; }
    .pcard-foot-fcs  { font-size: 8pt; color: #15803d; font-weight: 700; display: block; margin-top: 2px; }

    /* ── القسم السفلي: ملخص + ملاحظات ─────────────────────── */
    .bottom-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 12px; margin-top: 10px;
    }
    .totals-box { border: 1.5px solid #334155; border-radius: 8px; overflow: hidden; }
    .totals-box-hdr {
      background: #ffffff; color: #0f172a; font-weight: 700; font-size: 9.5pt;
      padding: 6px; text-align: center; border-bottom: 1.5px solid #334155;
    }
    .totals-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .totals-table td { border: 1px solid #e2e8f0; padding: 5px 10px; }
    .totals-table .td-lbl { font-weight: 600; text-align: right; color: #334155; }
    .totals-table .td-val { font-weight: 700; text-align: left; direction: ltr; color: #0f172a; }
    .totals-table .td-val.red { color: #b91c1c; font-size: 10.5pt; }

    .notes-box { border: 1.5px solid #334155; border-radius: 8px; padding: 10px 12px; }
    .notes-box-hdr {
      font-size: 9.5pt; color: #0f172a; font-weight: 700;
      margin-bottom: 8px; text-align: center;
      border-bottom: 1.5px solid #cbd5e1; padding-bottom: 5px;
    }
    .notes-list { list-style: none; padding: 0; }
    .notes-list li { font-size: 8.5pt; color: #334155; margin-bottom: 5px; line-height: 1.5; }
    .notes-list li:last-child { color: #1d4ed8; background: #eff6ff; padding: 3px 6px; border-radius: 4px; border-right: 3px solid #3b82f6; }

    /* ── الفوتر ─────────────────────────────────────────────── */
    .report-footer {
      text-align: center; font-size: 9pt; color: #475569; font-weight: 600;
      border-top: 1.5px solid #334155; padding-top: 8px; margin-top: 18px;
    }
  </style>
</head>
<body>

  <div class="rh">
    <div class="rh-date">تاريخ الطباعة: ${data.dateStr} - ${data.timeStr}</div>
    <div class="rh-title">${data.reportTitle}</div>
    <div class="rh-sub">${data.reportSubtitle}</div>
    <div class="rh-line"></div>
  </div>

  <table class="main-table">
    <thead>
      <tr>
        <th style="width:55%;text-align:right;">البيان</th>
        <th style="width:45%;text-align:left;">القيمة</th>
      </tr>
    </thead>
    <tbody>
      ${dimensionsRowsHTML}
    </tbody>
  </table>

  ${partnerCardsHTML ? `<div class="partners-grid">${partnerCardsHTML}</div>` : ""}

  <div class="bottom-grid">
    <div class="totals-box">
      <div class="totals-box-hdr">ملخص التقسيم</div>
      <table class="totals-table">
        <tbody>
          ${totalsRowsHTML}
        </tbody>
      </table>
    </div>
    <div class="notes-box">
      <div class="notes-box-hdr">ملاحظات</div>
      <ul class="notes-list">
        ${notesHTML}
      </ul>
    </div>
  </div>

  <div class="report-footer">
    الدَّلاَّل - قياسات الأراضي &bull; متوفر على جوجل بلاي
  </div>

</body>
</html>`;
    },

    // ─────────────────────────────────────────────────────────────
    // فتح نافذة طباعة
    // ─────────────────────────────────────────────────────────────
    print(data) {
      const html = this.renderHTML(data);
      const w = window.open("", "_blank");
      if (!w) { window.print(); return; }
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); }, 900);
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = DallalReportTemplate;
  } else {
    global.DallalReportTemplate = DallalReportTemplate;
  }
})(typeof window !== "undefined" ? window : global);
