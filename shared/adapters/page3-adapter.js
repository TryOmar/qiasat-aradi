/**
 * shared/adapters/page3-adapter.js — Adapter for Page3 Farmers Boundary Separation
 * ====================================================================================
 * يحول بيانات الصفحة 3 (فصل الحد بين المزارعين، فروق العروض، الحصص الشرعية، والتحويلات القصبية)
 * إلى الكائن الموحد الذي يتوقعه محرك طباعة التقرير (DallalReportTemplate).
 */
(function (global) {
  "use strict";

  const Page3Adapter = {
    buildReportData() {
      const now = new Date();
      const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('ar-EG');

      // 1. قراءة بيانات المساحة والعرض الإجمالي للموقع
      const acreVal = document.getElementById("acre-input")?.value || "0";
      const caratVal = document.getElementById("carat-input")?.value || "0";
      const shareVal = document.getElementById("share-input")?.value || "0";
      const cmVal = document.getElementById("cm")?.value || "0.00";

      const dimensions = [
        { label: "إجمالي الفدادين", value: acreVal },
        { label: "إجمالي القراريط", value: caratVal },
        { label: "إجمالي الأسهم", value: shareVal },
        { label: "إجمالي عرض المساحة", value: `${cmVal} م`, isHighlight: true }
      ];

      // 2. استخراج وقراءة بيانات جدول المزارعين وفروق الحدود
      const farmerRows = document.querySelectorAll(".table-input:not(#total)");
      const farmerItems = [];

      farmerRows.forEach((row, idx) => {
        const inputs = row.querySelectorAll("input");
        const sahm = inputs[0]?.value || "";
        const carat = inputs[1]?.value || "";
        const currWidth = inputs[2]?.value || "";
        const prevWidth = inputs[3]?.value || "";
        const diffVal = inputs[4]?.value || "";

        // يتجاهل الصفوف الفارغة بالكامل
        if (!sahm && !carat && !prevWidth && !currWidth) return;

        const diffNum = parseFloat(diffVal) || 0;
        let diffType = "neutral";
        let diffFormatted = diffVal ? `${diffVal} م` : "0.000 م";

        if (diffNum > 0) {
          diffType = "increase";
          diffFormatted = `+${diffVal} م (زيادة في الحد)`;
        } else if (diffNum < 0) {
          diffType = "decrease";
          diffFormatted = `${diffVal} م (نقص في الحد)`;
        } else if (diffVal) {
          diffFormatted = `0.000 م (متطابق)`;
        }

        farmerItems.push({
          id: idx + 1,
          name: `المزارع ${idx + 1}`,
          sahm: sahm || "0",
          carat: carat || "0",
          currWidth: currWidth ? `${currWidth} م` : "—",
          prevWidth: prevWidth ? `${prevWidth} م` : "—",
          diffVal: diffFormatted,
          diffType
        });
      });

      // بناء بطاقات المزارعين بالتنسيق القياسي الأحادي
      const partnerCardsHTML = farmerItems.map((f) => {
        let diffColor = "#1b5e20";
        if (f.diffType === "decrease") diffColor = "#c62828";
        else if (f.diffType === "neutral") diffColor = "#555";

        return `
          <div class="partner-print-card">
            <div class="partner-card-header">${f.name}</div>
            <table class="partner-card-table">
              <thead>
                <tr>
                  <th style="width: 50%;">البيان</th>
                  <th>القيمة</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="text-align: right; padding-right: 8px;">حصة القيراط والسهم</td><td style="font-weight:bold;color:#1b5e20;">${f.carat} ق و ${f.sahm} س</td></tr>
                <tr><td style="text-align: right; padding-right: 8px;">العرض السابق</td><td style="font-weight:bold;color:#555;">${f.prevWidth}</td></tr>
                <tr><td style="text-align: right; padding-right: 8px;">العرض الحالي المستحق</td><td style="font-weight:bold;color:#1b5e20;">${f.currWidth}</td></tr>
                <tr style="background:#e8f5e9;"><td style="text-align: right; padding-right: 8px;">الفرق في الحد</td><td style="font-weight:bold;color:${diffColor};">${f.diffVal}</td></tr>
              </tbody>
            </table>
            <div class="partner-card-area-box">
              <span class="partner-card-area-lbl">العرض الحالي</span>
              <span class="partner-card-area-val">${f.currWidth}</span>
              <span class="partner-card-fcs-val">الفرق: ${f.diffVal}</span>
            </div>
          </div>
        `;
      }).join("");

      const numCards = farmerItems.length;
      let gridStyle = "grid-template-columns: repeat(3, 1fr);";
      if (numCards === 1) {
        gridStyle = "grid-template-columns: 1fr; max-width: 320px; margin: 0 auto;";
      } else if (numCards === 2) {
        gridStyle = "grid-template-columns: repeat(2, 1fr); max-width: 640px; margin: 0 auto;";
      }

      // 3. قراءة الإجماليات والمتبقي والتحويل للقصبة
      const resAcre = document.querySelector(".result-acre")?.innerText || "0";
      const resCarat = document.querySelector(".result-carat")?.innerText || "0";
      const resShares = document.querySelector(".result-shares")?.innerText || "0";
      const eachCaratMeters = document.querySelector(".each-carat")?.innerText || "0";

      const oldWidthInputs = document.querySelectorAll(".width-old-input");
      const eachOldInputs = document.querySelectorAll(".each-old-input");

      const widthQasaba = oldWidthInputs[2]?.value || "0";
      const widthQabda = oldWidthInputs[1]?.value || "0";
      const widthLess = oldWidthInputs[0]?.value || "0";

      const eachQasaba = eachOldInputs[2]?.value || "0";
      const eachQabda = eachOldInputs[1]?.value || "0";
      const eachLess = eachOldInputs[0]?.value || "0";

      const totals = {
        totalArea: `${cmVal} م`,
        totalFeddans: `${resAcre} فداين (المتبقي/الناقص)`,
        totalCarats: `${resCarat} قراريط`,
        totalShares: `${resShares} أسهم`,
        caratArea: `${eachCaratMeters} م (عرض القيراط الواحد)`
      };

      const notes = [
        "1 - تم حساب فروق العرض بين العرض الحالي والعرض السابق لكل مزارع.",
        "2 - الإشارة السالبة (-) تعني نقصاً في العرض، والموجبة (+) تعني زيادة في العرض.",
        `3 - إجمالي عرض الموقع بالقصبة: ${widthQasaba} قصبة، ${widthQabda} قبضة، ${widthLess} أقل من القبضة.`,
        `4 - عرض القيراط الواحد بالقصبة: ${eachQasaba} قصبة، ${eachQabda} قبضة، ${eachLess} أقل من القبضة.`
      ];

      return {
        reportTitle: "تقرير فصل الحد بين المزارعين",
        reportSubtitle: "حساب فروق الحدود والعروض بين المزارعين",
        dateStr,
        timeStr,
        dimensions,
        partnerCardsHTML,
        gridStyle,
        totals,
        notes
      };
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Page3Adapter;
  } else {
    global.Page3Adapter = Page3Adapter;
  }
})(typeof window !== "undefined" ? window : global);
