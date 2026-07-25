/**
 * @file shared/report-template.js
 * @description قالب تقرير الدَّلاَّل الموحد — مطابقة 1:1 مع مخرجات فلاتر (Data-Driven Logic Pagination)
 * @version 5.0.0
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
        partnerCardItems: rawData.partnerCardItems || [],
        gridStyle:        rawData.gridStyle        || "",
        totals:           [],
        notes:            []
      };

      if (Array.isArray(rawData.dimensions)) {
        normalized.dimensions = rawData.dimensions;
      }

      if (Array.isArray(rawData.partners)) {
        normalized.partners = rawData.partners;
      }

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
    // استخراج بطاقات الشركاء كـ قائمة مصفوفة من العناصر (Card List)
    // ─────────────────────────────────────────────────────────────
    extractCardItems(data) {
      if (Array.isArray(data.partnerCardItems) && data.partnerCardItems.length > 0) {
        return data.partnerCardItems;
      }

      if (data.partnerCardsHTML && typeof data.partnerCardsHTML === "string") {
        const matches = data.partnerCardsHTML.match(/<div class="pcard">[\s\S]*?<\/div>\s*(?=<div class="pcard">|$)/gi);
        if (matches && matches.length > 0) {
          return matches;
        }
      }

      if (Array.isArray(data.partners) && data.partners.length > 0) {
        return data.partners.map((p, idx) => {
          let dimsRows = "";
          if (p.dimensions && p.dimensions.length > 0) {
            dimsRows = p.dimensions.map(pd => `
              <tr>
                <td style="text-align:center;vertical-align:middle;padding:3px 6px;">${pd.label}</td>
                <td class="td-val" style="text-align:center;vertical-align:middle;padding:3px 6px;">${pd.value}</td>
              </tr>`).join("");
          }
          const fcsSpan = p.fcsText ? `<span class="pcard-foot-fcs">${p.fcsText}</span>` : "";
          return `
            <div class="pcard">
              <div class="pcard-hdr">${p.name || ("شريك " + (idx + 1))}</div>
              <table class="pcard-table">
                <thead>
                  <tr>
                    <th style="text-align:center;vertical-align:middle;width:55%;">البيان</th>
                    <th style="text-align:center;vertical-align:middle;">القيمة</th>
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
        });
      }

      return [];
    },

    // ─────────────────────────────────────────────────────────────
    // توليد مصفوفة صفحات HTML مقسمة منطقياً (Data Pagination: 6 cards/page)
    // ─────────────────────────────────────────────────────────────
    renderPagesHTML(rawData) {
      const data = this.normalizeReportData(rawData);
      const cards = this.extractCardItems(data);

      const CARDS_PER_PAGE = 6;
      const totalPages = cards.length > 0 ? Math.ceil(cards.length / CARDS_PER_PAGE) : 1;
      const pagesHTML = [];

      /* ── 1. صفوف جدول الأبعاد ─────────────────────────────── */
      let dimensionsRowsHTML = "";
      if (data.dimensions.length > 0) {
        dimensionsRowsHTML = data.dimensions.map(d => {
          const valClass = d.isHighlight ? "val-highlight" : "";
          return `
            <tr>
              <td style="text-align:center;vertical-align:middle;font-weight:600;">${d.label}</td>
              <td class="${valClass}" style="text-align:center;vertical-align:middle;direction:ltr;">${d.value}</td>
            </tr>`;
        }).join("");
      }

      /* ── 2. صفوف ملخص التقسيم ────────────────────────────── */
      let totalsRowsHTML = "";
      if (data.totals.length > 0) {
        totalsRowsHTML = data.totals.map(t => `
          <tr>
            <td class="td-lbl">${t.label}</td>
            <td class="td-val${t.isHighlight ? " red" : ""}">${t.value}</td>
          </tr>`).join("");
      }

      /* ── 3. الملاحظات ─────────────────────────────────────── */
      const notesHTML = data.notes.map(n => `<li>${n}</li>`).join("");

      // ── بناء كل صفحة من الصفحات ─────────────────────────────
      for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
        const startCard = (pageIdx - 1) * CARDS_PER_PAGE;
        const endCard   = Math.min(cards.length, pageIdx * CARDS_PER_PAGE);
        const pageCards = cards.slice(startCard, endCard);

        const cardCount = pageCards.length;
        let gridStyle = "grid-template-columns: repeat(3, 1fr);";
        if (cardCount === 1)      gridStyle = "grid-template-columns: 1fr; max-width: 320px; margin: 0 auto;";
        else if (cardCount === 2) gridStyle = "grid-template-columns: repeat(2, 1fr); max-width: 640px; margin: 0 auto;";

        const isFirstPage = (pageIdx === 1);

        const pageHTML = `<!DOCTYPE html>
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
      padding: 0;
      margin: 0;
    }

    .a4-page-container {
      width: 794px;
      height: 1123px;
      background: #ffffff;
      padding: 20px 24px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .page-content-top {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    th, td {
      text-align: center !important;
      vertical-align: middle !important;
    }

    /* ── الهيدر ─────────────────────────────────────────────── */
    .rh { text-align: center; margin-bottom: 6px; position: relative; padding-bottom: 6px; }
    .rh-date {
      position: absolute; top: 0; left: 0;
      font-size: 7.5pt; color: #64748b; font-weight: 600; text-align: left;
    }
    .rh-title { font-size: 22pt; color: #0f172a; font-weight: 800; margin-bottom: 2px; text-align: center; }
    .rh-sub   { font-size: 12pt; color: #0f172a; font-weight: 700; margin-bottom: 6px; text-align: center; }
    .rh-line  { width: 200px; height: 1.5px; background: #0f172a; margin: 0 auto; border-radius: 2px; }

    /* ── جدول الأبعاد الرئيسي ───────────────────────────────── */
    .main-table {
      width: 100%; border-collapse: collapse;
      font-size: 8.5pt; margin-bottom: 8px;
      border: 1.5px solid #334155;
    }
    .main-table th {
      background: #ffffff; color: #0f172a; font-weight: 700;
      border: 1.5px solid #334155; padding: 5px 8px; font-size: 9pt;
      text-align: center !important; vertical-align: middle !important;
    }
    .main-table td {
      border: 1px solid #cbd5e1; padding: 4px 8px;
      text-align: center !important; vertical-align: middle !important;
    }
    .main-table tr:nth-child(even) td { background: #f8fafc; }
    .val-highlight { color: #b91c1c; font-weight: 800; font-size: 10pt; text-align: center !important; }

    /* ── شبكة بطاقات الشركاء ────────────────────────────────── */
    .partners-grid { display: grid; ${gridStyle} gap: 8px; margin-bottom: 8px; }

    .pcard {
      border: 1.5px solid #334155; border-radius: 8px;
      background: #ffffff; overflow: hidden;
      display: flex; flex-direction: column;
      break-inside: avoid;
    }
    .pcard-hdr {
      background: #ffffff; color: #0f172a; font-weight: 700; font-size: 9pt;
      padding: 5px 6px; text-align: center; border-bottom: 1.5px solid #334155;
      display: flex; justify-content: center; align-items: center;
    }
    .pcard-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; flex: 1; }
    .pcard-table th {
      background: #ffffff; color: #475569; font-weight: 700;
      border: 1px solid #cbd5e1; padding: 2px 4px; font-size: 7.5pt;
      text-align: center !important; vertical-align: middle !important;
    }
    .pcard-table td {
      border: 1px solid #cbd5e1; padding: 2px 4px;
      text-align: center !important; vertical-align: middle !important;
    }
    .pcard-table .td-val {
      font-weight: 700; color: #1b5e20; direction: ltr;
      text-align: center !important; background: #f0fdf4;
    }

    .pcard-foot {
      background: #f8fafc; border-top: 1.5px solid #334155; padding: 5px 6px;
      text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .pcard-foot-lbl  { font-size: 7pt; color: #64748b; display: block; margin-bottom: 1px; text-align: center; }
    .pcard-foot-area { font-size: 10pt; color: #991b1b; font-weight: 800; display: block; text-align: center; }
    .pcard-foot-fcs  { font-size: 7.5pt; color: #15803d; font-weight: 700; display: block; margin-top: 1px; text-align: center; }

    /* ── القسم السفلي: ملخص + ملاحظات ─────────────────────── */
    .bottom-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 10px; margin-top: 6px;
    }
    .totals-box { border: 1.5px solid #334155; border-radius: 8px; overflow: hidden; }
    .totals-box-hdr {
      background: #ffffff; color: #0f172a; font-weight: 700; font-size: 9pt;
      padding: 5px; text-align: center; border-bottom: 1.5px solid #334155;
      display: flex; justify-content: center; align-items: center;
    }
    .totals-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    .totals-table td {
      border: 1px solid #e2e8f0; padding: 4px 8px;
      text-align: center !important; vertical-align: middle !important;
    }
    .totals-table .td-lbl { font-weight: 600; text-align: center !important; color: #334155; }
    .totals-table .td-val { font-weight: 700; text-align: center !important; direction: ltr; color: #0f172a; }
    .totals-table .td-val.red { color: #b91c1c; font-size: 10pt; text-align: center !important; }

    .notes-box { border: 1.5px solid #334155; border-radius: 8px; padding: 8px 10px; }
    .notes-box-hdr {
      font-size: 9pt; color: #0f172a; font-weight: 700;
      margin-bottom: 6px; text-align: center;
      border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;
      display: flex; justify-content: center; align-items: center;
    }
    .notes-list { list-style: none; padding: 0; text-align: right; }
    .notes-list li { font-size: 8pt; color: #334155; margin-bottom: 4px; line-height: 1.4; }
    .notes-list li:last-child { color: #1d4ed8; background: #eff6ff; padding: 2px 5px; border-radius: 4px; border-right: 3px solid #3b82f6; }

    /* ── الفوتر ─────────────────────────────────────────────── */
    .report-footer {
      text-align: center; font-size: 8.5pt; color: #475569; font-weight: 600;
      border-top: 1.5px solid #334155; padding-top: 6px; margin-top: 10px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-brand { margin: 0 auto; }
    .footer-page-num { font-size: 8pt; color: #64748b; font-weight: 700; position: absolute; left: 24px; }
  </style>
</head>
<body>

  <div class="a4-page-container">
    <div class="page-content-top">
      ${isFirstPage ? `
        <div class="rh">
          <div class="rh-date">تاريخ الطباعة: ${data.dateStr} - ${data.timeStr}</div>
          <div class="rh-title">${data.reportTitle}</div>
          <div class="rh-sub">${data.reportSubtitle}</div>
          <div class="rh-line"></div>
        </div>

        <table class="main-table">
          <thead>
            <tr>
              <th style="width:55%;text-align:center;">البيان</th>
              <th style="width:45%;text-align:center;">القيمة</th>
            </tr>
          </thead>
          <tbody>
            ${dimensionsRowsHTML}
          </tbody>
        </table>
      ` : ''}

      ${pageCards.length > 0 ? `<div class="partners-grid">${pageCards.join("")}</div>` : ""}

      ${isFirstPage ? `
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
      ` : ''}
    </div>

    <div class="report-footer">
      <span class="footer-brand">الدَّلاَّل - قياسات الأراضي &bull; متوفر على جوجل بلاي</span>
      ${totalPages > 1 ? `<span class="footer-page-num">صفحة ${pageIdx} من ${totalPages}</span>` : ''}
    </div>
  </div>

</body>
</html>`;

        pagesHTML.push(pageHTML);
      }

      return pagesHTML;
    },

    // ─────────────────────────────────────────────────────────────
    // توليد HTML كامل (الصفحة الأولى افتراضياً للتوافق)
    // ─────────────────────────────────────────────────────────────
    renderHTML(rawData) {
      const pages = this.renderPagesHTML(rawData);
      return pages.length > 0 ? pages[0] : "";
    },

    // ─────────────────────────────────────────────────────────────
    // فتح نافذة طباعة لجميع الصفحات
    // ─────────────────────────────────────────────────────────────
    print(data) {
      const pages = this.renderPagesHTML(data);
      const fullHtml = pages.join('<div style="page-break-after: always;"></div>');
      const w = window.open("", "_blank");
      if (!w) { window.print(); return; }
      w.document.write(fullHtml);
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
