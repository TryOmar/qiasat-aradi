/**
 * shared/report-template.js — Dallal Unified Print Report Engine
 * ================================================================
 * المصدر المرجعي الأحادي لتصميم تقارير الطباعة في تطبيق الدلال.
 * مستخرج حرفياً 100% من تصميم وتخفيضات تقرير Page11.
 *
 * ملاحظة معمارية (Commit 9.3):
 * يعتمد هذا الملف على CSS مضمّن inline داخل renderHTML()، وليس على
 * shared/report-print.css. هذا هو المسار المعتمد في Page11 وجميع
 * الصفحات المستخدِمة لهذا المحرك، لأن الطباعة تفتح نافذة جديدة
 * منعزلة تحتاج أن تحمل تنسيقاتها معها دون اعتماد على ملفات خارجية.
 * shared/report-print.css متاح للصفحات التي تطبع نفسها مباشرةً
 * (window.print() على الصفحة الحالية) وليس عبر نافذة منبثقة.
 */
(function (global) {
  "use strict";

  const DallalReportTemplate = {
    renderHTML(data) {
      const {
        reportTitle = "بيان المساحات",
        reportSubtitle = "جملة الغيط",
        dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        timeStr = new Date().toLocaleTimeString('ar-EG'),
        dimensions = [],
        partnerCardsHTML = "",
        gridStyle = "grid-template-columns: repeat(3, 1fr);",
        totals = {},
        notes = []
      } = data;

      // 1. بناء جدول المساحات والأبعاد
      let dimensionsRowsHTML = "";
      if (Array.isArray(dimensions)) {
        dimensionsRowsHTML = dimensions.map(d => {
          const rowStyle = d.isHighlight ? `style="background:#e8f5e9;"` : "";
          const valStyle = d.isHighlight ? `style="font-weight:bold;color:#c62828;font-size:11pt;"` : `style="font-weight:bold;color:#1b5e20;"`;
          return `<tr ${rowStyle}><td style="text-align:right;padding-right:15px;font-weight:bold;">${d.label}</td><td ${valStyle}>${d.value}</td></tr>`;
        }).join("");
      }

      // 2. بناء جدول الإجماليات
      let totalsRowsHTML = "";
      if (totals) {
        if (totals.totalArea !== undefined) totalsRowsHTML += `<tr><td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">إجمالي المساحة</td><td style="border: 1px solid #a5d6a7; font-weight: bold; color: #c62828;">${totals.totalArea} م²</td></tr>`;
        if (totals.totalFeddans !== undefined) totalsRowsHTML += `<tr><td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">إجمالي الفدادين</td><td style="border: 1px solid #a5d6a7; font-weight: bold; color: #1b5e20;">${totals.totalFeddans}</td></tr>`;
        if (totals.totalCarats !== undefined) totalsRowsHTML += `<tr><td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">إجمالي القراريط</td><td style="border: 1px solid #a5d6a7; font-weight: bold; color: #1b5e20;">${totals.totalCarats}</td></tr>`;
        if (totals.totalShares !== undefined) totalsRowsHTML += `<tr><td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">إجمالي الأسهم</td><td style="border: 1px solid #a5d6a7; font-weight: bold; color: #1b5e20;">${totals.totalShares}</td></tr>`;
        if (totals.caratArea !== undefined) totalsRowsHTML += `<tr><td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">مساحة القيراط بالمتر المربع</td><td style="border: 1px solid #a5d6a7; font-weight: bold; color: #1b5e20;">${totals.caratArea} م²</td></tr>`;
      }

      // 3. بناء قائمة الملاحظات
      let notesHTML = "";
      if (Array.isArray(notes)) {
        notesHTML = notes.map((n) => `<li>${n}</li>`).join("");
      }

      return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير تقسيم الأراضي - الدلال</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { 
      size: A4 portrait; 
      margin: 6mm 8mm 6mm 8mm; 
    }
    body { 
      font-family: 'Cairo', sans-serif; 
      background: #fff; 
      color: #222; 
      font-size: 9pt; 
      direction: rtl; 
      padding-bottom: 25px; 
      position: relative; 
      line-height: 1.3;
    }
    .watermark-container { 
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%) rotate(-25deg); 
      font-size: 20pt; 
      font-weight: 800; 
      color: #000000; 
      opacity: 0.04; 
      white-space: nowrap; 
      pointer-events: none; 
      z-index: -1000; 
      text-align: center; 
      width: 100%; 
    }
    .report-title-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 6px;
      padding-bottom: 4px;
    }
    .header-divider {
      width: 100%;
      height: 2px;
      background: #000000;
      margin-bottom: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .report-title-container h1 {
      font-size: 18pt;
      color: #1b5e20;
      font-weight: 800;
      margin: 0;
      line-height: 1.1;
    }
    .report-title-container p {
      font-size: 11pt;
      color: #c62828;
      font-weight: 700;
      margin: 2px 0 0;
    }
    
    .section {
      margin-bottom: 8px;
    }
    .section-title { 
      background: #000000; 
      color: white; 
      font-weight: 700; 
      font-size: 9.5pt; 
      padding: 4px 10px; 
      margin-bottom: 5px; 
      border-radius: 4px; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 8.5pt; 
      margin-bottom: 6px; 
      border: 1px solid #000000;
    }
    th { 
      background: #000000; 
      color: #ffffff; 
      font-weight: 700; 
      border: 1px solid #000000; 
      padding: 4px; 
      text-align: center; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
    }
    td { 
      border: 1px solid #000000; 
      padding: 3.5px 6px; 
      text-align: center; 
      vertical-align: middle; 
    }
    
    .partners-grid {
      display: grid;
      ${gridStyle}
      gap: 8px;
      margin-bottom: 6px;
    }
    .partner-print-card {
      border: 1.5px solid #000000;
      border-radius: 6px;
      background: #ffffff;
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .partner-card-header {
      background: #000000;
      color: white;
      font-weight: 700;
      font-size: 8.5pt;
      padding: 3px 4px;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .partner-card-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin: 0;
      border: none;
    }
    .partner-card-table th {
      background: #f2f2f2;
      color: #000000;
      font-weight: 700;
      border: 1px solid #ccc;
      padding: 2px 4px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .partner-card-table td {
      border: 1px solid #ccc;
      padding: 2px 4px;
    }
    .partner-card-area-box {
      background: #fafafa;
      border-top: 1px solid #000000;
      padding: 3px 4px;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .partner-card-area-lbl {
      font-size: 7pt;
      color: #666;
      display: block;
      line-height: 1.1;
    }
    .partner-card-area-val {
      font-size: 9.5pt;
      color: #c62828;
      font-weight: 700;
      display: block;
      line-height: 1.2;
    }
    .partner-card-fcs-val {
      font-size: 7.5pt;
      color: #1b5e20;
      font-weight: bold;
      display: block;
      line-height: 1.1;
    }
    
    .totals-and-notes {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 8px;
      margin-top: 6px;
      page-break-inside: avoid;
    }
    .totals-box {
      border: 1.5px solid #000000;
      border-radius: 6px;
      background: #ffffff;
      padding: 0;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .totals-box table {
      margin: 0;
      border: none;
    }
    .totals-box th {
      background: #000000;
      color: #ffffff;
      border: 1px solid #000000;
      padding: 3px 4px;
      font-size: 8pt;
      font-weight: bold;
    }
    .totals-box td {
      border: 1px solid #ccc;
      padding: 2px 5px;
      font-size: 7.5pt;
    }
    .notes-box {
      border: 1.5px solid #ccc;
      border-radius: 6px;
      background: #ffffff;
      padding: 6px 8px;
    }
    .notes-box h3 {
      font-size: 8.5pt;
      color: #000;
      font-weight: bold;
      margin-bottom: 4px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 2px;
    }
    .notes-box ul {
      list-style-type: none;
      padding-right: 0;
    }
    .notes-box li {
      font-size: 7.5pt;
      color: #333;
      margin-bottom: 2px;
    }
    
    .report-footer { 
      position: fixed; 
      bottom: 0; 
      left: 0; 
      width: 100%; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      text-align: center; 
      font-size: 8pt; 
      color: #444; 
      border-top: 1.5px solid #000000; 
      padding: 4px 10px; 
      background: white; 
    }
    .footer-main-text { 
      font-size: 8.5pt; 
      font-weight: bold; 
      color: #444; 
    }
    
    .page-break-inside-avoid {
      page-break-inside: avoid;
    }
    
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .header-divider { background: #000 !important; }
      .section-title { background: #000 !important; color: #fff !important; }
      th { background: #000 !important; color: #fff !important; border-color: #000 !important; }
      td { border-color: #000 !important; }
      .partner-print-card { border-color: #000 !important; }
      .partner-card-header { background: #000 !important; color: #fff !important; }
      .partner-card-table th { background: #f2f2f2 !important; color: #000 !important; border-color: #ccc !important; }
      .partner-card-table td { border-color: #ccc !important; }
      .partner-card-area-box { background: #fafafa !important; border-color: #000 !important; }
      .totals-box { border-color: #000 !important; background: #fff !important; }
      .totals-box th { background: #000 !important; color: #fff !important; }
      .totals-box td { border-color: #ccc !important; }
      .notes-box { border-color: #ccc !important; }
      .report-footer { border-top-color: #000 !important; }
    }
  </style>
</head>
<body>

  <div class="watermark-container">الدَّلاَّل – قياسات الأراضي • متوفر على جوجل بلاي</div>

  <div class="report-title-container">
    <div>
      <h1>${reportTitle}</h1>
      <p>${reportSubtitle}</p>
    </div>
    <div style="font-size: 8.5pt; color: #555; font-weight: bold;">
      تاريخ الطباعة: ${dateStr} - ${timeStr}
    </div>
  </div>
  <div class="header-divider"></div>

  <div class="section page-break-inside-avoid">
    <div class="section-title">أولاً: جدول بيان المساحات</div>
    <table>
      <thead>
        <tr>
          <th style="width: 50%;">البيان</th>
          <th>القيمة</th>
        </tr>
      </thead>
      <tbody>
        ${dimensionsRowsHTML}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">ثانياً: بطاقات الشركاء وتفاصيل تقسيم الأنصبة</div>
    <div class="partners-grid">
      ${partnerCardsHTML}
    </div>
  </div>

  <div class="totals-and-notes">
    <div class="totals-box">
      <table style="width: 100%; border: none;">
        <thead>
          <tr style="background: #000000;">
            <th style="border: 1px solid #000000; padding: 4px; font-weight: bold; color: #ffffff; font-size: 8.5pt;">البيان</th>
            <th style="border: 1px solid #000000; padding: 4px; font-weight: bold; color: #ffffff; font-size: 8.5pt;">القيمة</th>
          </tr>
        </thead>
        <tbody>
          ${totalsRowsHTML}
        </tbody>
      </table>
    </div>

    <div class="notes-box">
      <h3>ملاحظات:</h3>
      <ul>
        ${notesHTML}
      </ul>
    </div>
  </div>

  <div class="report-footer">
    <div class="footer-main-text">الدَّلاَّل – قياسات الأراضي • متوفر على جوجل بلاي</div>
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
