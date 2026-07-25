/**
 * @file shared/report-template.js
 * @description قالب تقرير الدَّلاَّل الموحد المتوافق 100% مع مخرجات وتسليمات تطبيق Flutter (1:1)
 * @version 3.2.0
 */

(function (global) {
  "use strict";

  const DallalReportTemplate = {
    /**
     * تطبيع وتوحيد شكل البيانات الواردة من المحولات المختلفة إلى بنية قياسية موحدة
     * @param {Object} rawData 
     * @returns {Object} Normalized Data Schema
     */
    normalizeReportData(rawData) {
      rawData = rawData || {};

      const normalized = {
        reportTitle: rawData.reportTitle || "بيان المساحات",
        reportSubtitle: rawData.reportSubtitle || "جملة الغيط",
        dateStr: rawData.dateStr || new Date().toLocaleDateString("ar-EG"),
        timeStr: rawData.timeStr || new Date().toLocaleTimeString("ar-EG"),
        dimensions: [],
        partners: [],
        partnerCardsHTML: rawData.partnerCardsHTML || "",
        gridStyle: rawData.gridStyle || "",
        totals: [],
        notes: []
      };

      // 1. تطبيع الأبعاد
      if (Array.isArray(rawData.dimensions)) {
        normalized.dimensions = rawData.dimensions;
      }

      // 2. تطبيع الشركاء
      if (Array.isArray(rawData.partners)) {
        normalized.partners = rawData.partners;
      }

      // 3. تطبيع الإجماليات (تحويل الكائن أو المصفوفة إلى نمط قياسي موحد)
      if (Array.isArray(rawData.totals)) {
        normalized.totals = rawData.totals;
      } else if (rawData.totals && typeof rawData.totals === "object") {
        const t = rawData.totals;
        normalized.totals = [
          { label: "إجمالي المساحة", value: (t.totalArea ? `${t.totalArea} م²` : "—"), isHighlight: true },
          { label: "إجمالي الفدادين", value: (t.totalFeddans !== undefined ? t.totalFeddans.toString() : "—") },
          { label: "إجمالي القراريط", value: (t.totalCarats !== undefined ? t.totalCarats.toString() : "—") },
          { label: "إجمالي الأسهم", value: (t.totalShares !== undefined ? t.totalShares.toString() : "—") },
          { label: "مساحة القيراط (2p)", value: (t.caratArea ? `${t.caratArea}` : "168") }
        ];
      }

      // 4. تطبيع الملاحظات
      if (Array.isArray(rawData.notes)) {
        normalized.notes = rawData.notes;
      } else if (typeof rawData.notes === "string") {
        normalized.notes = [rawData.notes];
      } else {
        normalized.notes = [
          "جميع الأطوال بالمتر.",
          "تم تقسيم الغيط إلى 6 أجزاء تفصيلية بالطريقة الطولية.",
          "اتجاه التقسيم للتنفيذ الميداني: من اليمين إلى اليسار."
        ];
      }

      return normalized;
    },

    /**
     * توليد كود HTML القياسي للتقرير بمطابقة تامة لتصميم Flutter
     * @param {Object} rawData كائن بيانات التقرير الخريطة
     * @returns {string} كود HTML كامل ومستقل
     */
    renderHTML(rawData) {
      const data = this.normalizeReportData(rawData);

      // 1. جدول أبعاد الأرض والمساحة الكلية
      let dimensionsRowsHTML = "";
      if (data.dimensions.length > 0) {
        dimensionsRowsHTML = data.dimensions.map(d => {
          const isHighlight = d.isHighlight ? "color: #b71c1c; font-weight: 800; font-size: 10pt;" : "color: #1e293b;";
          return `
            <tr>
              <td style="text-align: right; font-weight: 600; padding: 5px 10px;">${d.label}</td>
              <td style="text-align: left; direction: ltr; padding: 5px 10px; ${isHighlight}">${d.value}</td>
            </tr>`;
        }).join("");
      }

      // 2. بطاقات الشركاء (استخدام partnerCardsHTML أو توليدها من مصفوفة الشركاء)
      let partnerCardsHTML = data.partnerCardsHTML;
      const totalPartners = data.partners.length || (partnerCardsHTML ? 3 : 0);

      let gridStyle = data.gridStyle;
      if (!gridStyle) {
        if (totalPartners === 1) gridStyle = "grid-template-columns: 1fr;";
        else if (totalPartners === 2) gridStyle = "grid-template-columns: repeat(2, 1fr);";
        else gridStyle = "grid-template-columns: repeat(3, 1fr);";
      }

      if (!partnerCardsHTML && data.partners.length > 0) {
        partnerCardsHTML = data.partners.map((p, idx) => {
          let pDimsHTML = "";
          if (p.dimensions && p.dimensions.length > 0) {
            pDimsHTML = p.dimensions.map(pd => `
              <tr>
                <td style="text-align: right; padding: 3px 6px;">${pd.label}</td>
                <td style="text-align: left; direction: ltr; padding: 3px 6px;">${pd.value}</td>
              </tr>
            `).join("");
          }

          const fcsText = p.fcsText ? `<span class="partner-card-fcs-val">(${p.fcsText})</span>` : "";

          return `
            <div class="partner-print-card">
              <div class="partner-card-header">${p.name || ("شريك " + (idx + 1))}</div>
              <table class="partner-card-table">
                <thead>
                  <tr>
                    <th style="text-align: right; padding: 3px 6px; width: 60%;">البيان</th>
                    <th style="text-align: left; padding: 3px 6px; width: 40%;">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  ${pDimsHTML}
                </tbody>
              </table>
              <div class="partner-card-area-box">
                <span class="partner-card-area-lbl">جملة المساحة بالمتر المربع</span>
                <span class="partner-card-area-val">${p.areaSqMeters || "0.00"} م²</span>
                ${fcsText}
              </div>
            </div>`;
        }).join("");
      }

      // 3. ملخص التقسيم الموحد
      let totalsRowsHTML = "";
      if (data.totals.length > 0) {
        totalsRowsHTML = data.totals.map(t => `
          <tr>
            <td style="text-align: right; font-weight: 600; padding: 4px 8px;">${t.label}</td>
            <td style="text-align: left; direction: ltr; padding: 4px 8px; font-weight: 700; color: ${t.isHighlight ? '#b71c1c' : '#1e293b'};">${t.value}</td>
          </tr>
        `).join("");
      }

      // 4. الملاحظات
      const notesHTML = data.notes.map(n => `<li style="margin-bottom: 4px;">• ${n}</li>`).join("");

      return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>بيان المساحات - الدلال</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
      letter-spacing: normal !important;
      word-spacing: normal !important;
    }
    @page { 
      size: A4 portrait; 
      margin: 8mm 10mm 8mm 10mm; 
    }
    body { 
      font-family: 'Cairo', system-ui, -apple-system, sans-serif; 
      background: #ffffff; 
      color: #1e293b; 
      font-size: 9.5pt; 
      direction: rtl; 
      padding: 12px;
      line-height: 1.35;
      letter-spacing: normal !important;
      word-spacing: normal !important;
      font-feature-settings: "liga" 1, "calt" 1;
    }
    
    /* الهيدر العلوي النقي المطابق لـ Flutter */
    .report-header {
      text-align: center;
      margin-bottom: 12px;
      position: relative;
      padding-bottom: 8px;
    }
    .print-date-top {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
    }
    .report-title-main {
      font-size: 22pt;
      color: #0f172a;
      font-weight: 800;
      margin-bottom: 2px;
      letter-spacing: normal !important;
    }
    .report-subtitle-main {
      font-size: 13pt;
      color: #991b1b;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: normal !important;
    }
    .header-line {
      width: 140px;
      height: 2.5px;
      background: #0f172a;
      margin: 0 auto;
      border-radius: 2px;
    }
    
    /* الجداول الرئيسية المطابقة لـ Flutter */
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 9pt; 
      margin-bottom: 10px; 
      border: 1.5px solid #334155;
      border-radius: 6px;
      overflow: hidden;
    }
    th { 
      background: #ffffff; 
      color: #0f172a; 
      font-weight: 700; 
      border: 1.5px solid #334155; 
      padding: 6px; 
      text-align: center; 
    }
    td { 
      border: 1px solid #cbd5e1; 
      padding: 5px 8px; 
      vertical-align: middle; 
    }
    
    /* شبكة بطاقات الشركاء */
    .partners-grid {
      display: grid;
      ${gridStyle}
      gap: 10px;
      margin-bottom: 12px;
    }
    .partner-print-card {
      border: 1.5px solid #334155;
      border-radius: 8px;
      background: #ffffff;
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      page-break-inside: avoid;
    }
    .partner-card-header {
      background: #ffffff;
      color: #0f172a;
      font-weight: 700;
      font-size: 9.5pt;
      padding: 5px 6px;
      text-align: center;
      border-bottom: 1.5px solid #334155;
    }
    .partner-card-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin: 0;
      border: none;
    }
    .partner-card-table th {
      background: #ffffff;
      color: #475569;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      padding: 3px 6px;
    }
    .partner-card-table td {
      border: 1px solid #cbd5e1;
      padding: 3px 6px;
    }
    .partner-card-area-box {
      background: #f8fafc;
      border-top: 1.5px solid #334155;
      padding: 5px 6px;
      text-align: center;
    }
    .partner-card-area-lbl {
      font-size: 7.5pt;
      color: #64748b;
      display: block;
      margin-bottom: 2px;
    }
    .partner-card-area-val {
      font-size: 10.5pt;
      color: #991b1b;
      font-weight: 800;
      display: block;
    }
    .partner-card-fcs-val {
      font-size: 8pt;
      color: #15803d;
      font-weight: 700;
      display: block;
      margin-top: 2px;
    }
    
    /* ملخص التقسيم والملاحظات */
    .totals-and-notes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 8px;
      page-break-inside: avoid;
    }
    .totals-box {
      border: 1.5px solid #334155;
      border-radius: 8px;
      background: #ffffff;
      padding: 0;
      overflow: hidden;
    }
    .totals-box-header {
      background: #ffffff;
      color: #0f172a;
      font-weight: 700;
      font-size: 9.5pt;
      padding: 5px;
      text-align: center;
      border-bottom: 1.5px solid #334155;
    }
    .totals-box table {
      margin: 0;
      border: none;
    }
    .notes-box {
      border: 1.5px solid #334155;
      border-radius: 8px;
      background: #ffffff;
      padding: 8px 10px;
    }
    .notes-box h3 {
      font-size: 9.5pt;
      color: #0f172a;
      font-weight: 700;
      margin-bottom: 6px;
      text-align: center;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 4px;
    }
    .notes-box ul {
      list-style-type: none;
      padding-right: 0;
    }
    .notes-box li {
      font-size: 8.5pt;
      color: #334155;
      margin-bottom: 4px;
    }
    
    /* الفوتر */
    .report-footer { 
      text-align: center; 
      font-size: 9pt; 
      color: #475569; 
      font-weight: 600;
      border-top: 1.5px solid #334155; 
      padding-top: 8px; 
      margin-top: 16px;
    }
  </style>
</head>
<body>

  <div class="report-header">
    <div class="print-date-top">تاريخ الطباعة: ${data.dateStr} - ${data.timeStr}</div>
    <div class="report-title-main">${data.reportTitle}</div>
    <div class="report-subtitle-main">${data.reportSubtitle}</div>
    <div class="header-line"></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%; text-align: right;">البيان</th>
        <th style="width: 50%; text-align: left;">القيمة</th>
      </tr>
    </thead>
    <tbody>
      ${dimensionsRowsHTML}
    </tbody>
  </table>

  ${partnerCardsHTML ? `<div class="partners-grid">${partnerCardsHTML}</div>` : ''}

  <div class="totals-and-notes">
    <div class="totals-box">
      <div class="totals-box-header">ملخص التقسيم</div>
      <table>
        <tbody>
          ${totalsRowsHTML}
        </tbody>
      </table>
    </div>

    <div class="notes-box">
      <h3>ملاحظات</h3>
      <ul>
        ${notesHTML}
      </ul>
    </div>
  </div>

  <div class="report-footer">
    الدَّلاَّل - قياسات الأراضي • متوفر على جوجل بلاي
  </div>

</body>
</html>`;
    },

    print(data) {
      const html = this.renderHTML(data);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        window.print();
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 800);
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = DallalReportTemplate;
  } else {
    global.DallalReportTemplate = DallalReportTemplate;
  }
})(typeof window !== "undefined" ? window : global);
