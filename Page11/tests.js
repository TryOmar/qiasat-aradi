// tests.js - Unit & Integration Tests for Page11 Land Partition
function runAutomatedTests() {
  const report = [];
  let passed = true;

  function assert(condition, message, details = "") {
    if (!condition) passed = false;
    report.push({
      status: condition ? "PASS" : "FAIL",
      message: message,
      details: details
    });
  }

  // Backup current user state
  const backup = {
    length1: document.getElementById("length1").value,
    length2: document.getElementById("length2").value,
    width1: document.getElementById("width1").value,
    width2: document.getElementById("width2").value,
    caratArea: document.getElementById("input-carat-area").value,
    otherCaratArea: document.getElementById("other-carat-area").value,
    inputMethod: document.getElementById("share-input-method").value,
    partnersHTML: document.getElementById("partners-list").innerHTML,
    isManualPartition: window.isManualPartition,
    isPartitioned: window.isPartitioned
  };

  try {
    // -------------------------------------------------------------------------
    // TEST CASE 1: Rectangle, 2-stage partition, then remainder redistribution
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 100;
    document.getElementById("length2").value = 100;
    document.getElementById("width1").value = 100;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 168; // Carat area = 168
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";

    const list = document.getElementById("partners-list");
    list.innerHTML = "";
    addNewPartnerRow("شريك 1", 1, 0, 0, "");
    addNewPartnerRow("شريك 2", 1, 0, 0, "");

    window.runPartition();

    const totalArea1 = 10000;
    const expectedRemArea1 = 1936;
    
    assert(window.calculatedPieces.length === 3, "الحالة 1 (المرحلة 1): عدد القطع المحسوبة يجب أن يكون 3 (شريكين + متبقي).", `العدد الفعلي: ${window.calculatedPieces.length}`);
    
    const p1 = window.calculatedPieces[0];
    const p2 = window.calculatedPieces[1];
    const rem1 = window.calculatedPieces[2];

    assert(Math.abs(p1.area - 4032) < 0.01, "الحالة 1: مساحة الشريك 1 يجب أن تكون 4032 م².", `المساحة الفعلية: ${p1.area.toFixed(4)} م²`);
    assert(Math.abs(p2.area - 4032) < 0.01, "الحالة 1: مساحة الشريك 2 يجب أن تكون 4032 م².", `المساحة الفعلية: ${p2.area.toFixed(4)} م²`);
    assert(Math.abs(rem1.area - expectedRemArea1) < 0.01, "الحالة 1: مساحة المتبقي يجب أن تكون 1936 م².", `المساحة الفعلية: ${rem1.area.toFixed(4)} م²`);

    assert(Math.abs(rem1.topW - 19.36) < 0.01, "الحالة 1: العرض العلوي للمتبقي يجب أن يكون 19.36 م.", `الفعلي: ${rem1.topW.toFixed(4)} م`);
    assert(Math.abs(rem1.botW - 19.36) < 0.01, "الحالة 1: العرض السفلي للمتبقي يجب أن يكون 19.36 م.", `الفعلي: ${rem1.botW.toFixed(4)} م`);
    assert(Math.abs(rem1.leftLine - 100) < 0.01, "الحالة 1: الطول الأيمن للمتبقي يجب أن يكون 100 م.", `الفعلي: ${rem1.leftLine.toFixed(4)} م`);
    assert(Math.abs(rem1.divLine - 100) < 0.01, "الحالة 1: الطول الأيسر للمتبقي يجب أن يكون 100 م.", `الفعلي: ${rem1.divLine.toFixed(4)} م`);

    // Simulate redistribution (Longitudinal)
    const oldRemTopW = rem1.topW;
    const oldRemBotW = rem1.botW;
    const oldRemRightL = rem1.leftLine;
    const oldRemLeftL = rem1.divLine;

    document.getElementById("width1").value = oldRemTopW;
    document.getElementById("width2").value = oldRemBotW;
    document.getElementById("length1").value = oldRemRightL;
    document.getElementById("length2").value = oldRemLeftL;
    list.innerHTML = "";
    addNewPartnerRow("شريك 3", 0, 10, 0, ""); // 10 carats = 1680 sqm

    window.runPartition();

    const p3 = window.calculatedPieces[0];
    const rem2 = window.calculatedPieces[1];

    assert(window.calculatedPieces.length === 2, "الحالة 1 (المرحلة 2): عدد القطع المحسوبة يجب أن يكون 2 (شريك 3 + متبقي ثاني).");
    assert(Math.abs(p3.area - 1680) < 0.01, "الحالة 1: مساحة الشريك 3 يجب أن تكون 1680 م².", `الفعلي: ${p3.area.toFixed(4)} م²`);
    assert(Math.abs(rem2.area - 256) < 0.01, "الحالة 1: مساحة المتبقي الثاني يجب أن تكون 256 م².", `الفعلي: ${rem2.area.toFixed(4)} م²`);

    const totalSum = p1.area + p2.area + p3.area + rem2.area;
    assert(Math.abs(totalSum - totalArea1) < 0.00001, "الحالة 1: مجموع مساحات جميع القطع والمتبقي الأخير يطابق تماماً مساحة الأرض الأصلية (10000 م²).", `المجموع الفعلي: ${totalSum.toFixed(6)} م² | الفرق النهائي: ${(totalSum - totalArea1).toFixed(14)} م²`);


    // -------------------------------------------------------------------------
    // TEST CASE 2: Trapezoid, longitudinal partition, then transverse redistribution
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 100;
    document.getElementById("length2").value = 100;
    document.getElementById("width1").value = 130;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 168;
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";

    list.innerHTML = "";
    addNewPartnerRow("شريك 1", 1, 0, 0, ""); 
    addNewPartnerRow("شريك 2", 1, 0, 0, ""); 

    window.runPartition();

    const t_totalArea = 11500;
    const t_rem1 = window.calculatedPieces[2];
    assert(Math.abs(t_rem1.area - 3436) < 0.01, "الحالة 2: مساحة المتبقي الأول يجب أن تكون 3436 م².", `الفعلي: ${t_rem1.area.toFixed(4)} م²`);

    assert(t_rem1.botW > 0 && t_rem1.topW > 0, "الحالة 2: أبعاد المتبقي الهندسية (العروض) يجب أن تكون موجبة.", `عرض علوي: ${t_rem1.topW.toFixed(4)} م | عرض سفلي: ${t_rem1.botW.toFixed(4)} م`);

    // Rotate dimensions
    const transW1 = t_rem1.leftLine; // 100
    const transW2 = t_rem1.divLine;  // 100
    const transL1 = t_rem1.topW;     
    const transL2 = t_rem1.botW;     

    document.getElementById("width1").value = transW1;
    document.getElementById("width2").value = transW2;
    document.getElementById("length1").value = transL1;
    document.getElementById("length2").value = transL2;
    list.innerHTML = "";
    addNewPartnerRow("شريك 3", 0, 12, 0, ""); // 12 carats = 2016 sqm

    window.runPartition();

    const p3_case2 = window.calculatedPieces[0];
    const rem2_case2 = window.calculatedPieces[1];

    const case2_sum = 4032 + 4032 + p3_case2.area + rem2_case2.area;
    assert(Math.abs(case2_sum - t_totalArea) < 0.00001, "الحالة 2: مجموع مساحات جميع المراحل بعد التدوير العرضي يطابق مساحة الأرض الأصلية (11500 م²).", `المجموع الفعلي: ${case2_sum.toFixed(6)} م² | الفرق النهائي: ${(case2_sum - t_totalArea).toFixed(14)} م²`);


    // -------------------------------------------------------------------------
    // TEST CASE 3: Multi-stage partition (5 consecutive partitions with rounding check)
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 120;
    document.getElementById("length2").value = 90;
    document.getElementById("width1").value = 150;
    document.getElementById("width2").value = 110;
    const startArea = 13650;
    
    let currentL1 = 120;
    let currentL2 = 90;
    let currentW1 = 150;
    let currentW2 = 110;
    let accumulatedPartnerArea = 0;

    for (let stage = 1; stage <= 5; stage++) {
      document.getElementById("length1").value = currentL1;
      document.getElementById("length2").value = currentL2;
      document.getElementById("width1").value = currentW1;
      document.getElementById("width2").value = currentW2;

      list.innerHTML = "";
      const targetArea = 1500;
      const totalCarats = targetArea / 168;
      const f = Math.floor(totalCarats / 24);
      const c = Math.floor(totalCarats % 24);
      const s = (totalCarats - (f * 24 + c)) * 24;

      addNewPartnerRow(`شريك مرحلة ${stage}`, f, c, s, "");
      window.runPartition();

      const partnerPiece = window.calculatedPieces[0];
      const remainderPiece = window.calculatedPieces[1];

      accumulatedPartnerArea += partnerPiece.area;

      const stageTotal = partnerPiece.area + remainderPiece.area;
      const currentLandArea = ((currentL1 + currentL2)/2) * ((currentW1 + currentW2)/2);
      assert(Math.abs(stageTotal - currentLandArea) < 0.0001, `المرحلة ${stage}: مجموع الشريك والمتبقي يطابق مساحة الأرض الحالية.`, `مجموع: ${stageTotal.toFixed(6)} م² | مساحة الأرض: ${currentLandArea.toFixed(6)} م²`);

      currentW1 = remainderPiece.botW;
      currentW2 = remainderPiece.topW;
      currentL1 = remainderPiece.leftLine;
      currentL2 = remainderPiece.divLine;
    }

    const finalRemainderArea = window.calculatedPieces[1].area;
    const finalSum = accumulatedPartnerArea + finalRemainderArea;
    const finalDifference = startArea - finalSum;

    assert(Math.abs(finalDifference) < 0.000001, "الحالة 3: اختبار التراكم (5 مراحل متتالية) نجح والفرق النهائي صفر تقريباً.", `مجموع المساحات: ${finalSum.toFixed(8)} م² | الفرق النهائي: ${finalDifference.toFixed(14)} م²`);

    // -------------------------------------------------------------------------
    // TEST CASE 4: Reset state (clearAll) verification
    // -------------------------------------------------------------------------
    clearAll();
    
    assert(document.getElementById("length1").value === "", "الحالة 4: الطول الأول يجب أن يكون فارغاً بعد مسح الكل.", `الفعلي: "${document.getElementById("length1").value}"`);
    assert(document.getElementById("length2").value === "", "الحالة 4: الطول الثاني يجب أن يكون فارغاً بعد مسح الكل.", `الفعلي: "${document.getElementById("length2").value}"`);
    assert(document.getElementById("width1").value === "", "الحالة 4: العرض الأول يجب أن يكون فارغاً بعد مسح الكل.", `الفعلي: "${document.getElementById("width1").value}"`);
    assert(document.getElementById("width2").value === "", "الحالة 4: العرض الثاني يجب أن يكون فارغاً بعد مسح الكل.", `الفعلي: "${document.getElementById("width2").value}"`);
    assert(isPartitioned === false, "الحالة 4: متغير isPartitioned يجب أن يكون false بعد مسح الكل.");
    assert(window.calculatedPieces.length === 0, "الحالة 4: مصفوفة window.calculatedPieces يجب أن تكون فارغة بعد مسح الكل.", `الطول الفعلي: ${window.calculatedPieces.length}`);
    
    const remainderRow = document.getElementById("remainder-row-table");
    const isRemainderHidden = !remainderRow || remainderRow.style.display === "none";
    assert(isRemainderHidden, "الحالة 4: صف المتبقي في الجدول يجب أن يكون مخفياً تماماً بعد مسح الكل.");

    const statusText = document.getElementById("summary-status") ? document.getElementById("summary-status").innerText : "";
    assert(statusText.includes("يرجى إدخال أبعاد الأرض"), "الحالة 4: رسالة الحالة يجب أن تطلب إدخال الأبعاد بعد مسح الكل.", `النص الفعلي: "${statusText}"`);

  } catch (error) {
    assert(false, "حدث خطأ غير متوقع أثناء تنفيذ الاختبارات التلقائية.", error.message);
  } finally {
    // Restore user state
    document.getElementById("length1").value = backup.length1;
    document.getElementById("length2").value = backup.length2;
    document.getElementById("width1").value = backup.width1;
    document.getElementById("width2").value = backup.width2;
    document.getElementById("input-carat-area").value = backup.caratArea;
    document.getElementById("other-carat-area").value = backup.otherCaratArea;
    document.getElementById("share-input-method").value = backup.inputMethod;
    window.currentInputMethod = backup.inputMethod;
    document.getElementById("partners-list").innerHTML = backup.partnersHTML;
    window.isManualPartition = backup.isManualPartition;
    window.isPartitioned = backup.isPartitioned;

    window.runPartition();
  }

  showTestResultsReport(report, passed);
}

function showTestResultsReport(report, passed) {
  let overlay = document.getElementById("test-report-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "test-report-overlay";
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 20000; direction: rtl; font-family: Cairo, Arial, sans-serif;";
    document.body.appendChild(overlay);
  }

  let html = `
    <div style="background: white; border-radius: 12px; width: 90%; max-width: 650px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: flex; flex-direction: column; max-height: 85%;">
      <div style="background: ${passed ? "#2e7d32" : "#c62828"}; color: white; padding: 15px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px;">🧪 تقرير الاختبارات التلقائية لدقة الحسابات الهندسية</h3>
        <button onclick="document.getElementById('test-report-overlay').style.display='none'" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; font-weight: bold;">&times;</button>
      </div>
      <div style="padding: 15px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px;">
        <div style="font-weight: bold; font-size: 14px; color: ${passed ? "#2e7d32" : "#c62828"}; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 8px;">
          ${passed ? "🟢 جميع الاختبارات اجتازت بنجاح! دقة الحساب متناهية والفرق النهائي = 0.000000 م²" : "🔴 بعض الاختبارات فشلت. يرجى مراجعة التفاصيل أدناه."}
        </div>
  `;

  report.forEach(item => {
    html += `
      <div style="border-right: 4px solid ${item.status === "PASS" ? "#2e7d32" : "#c62828"}; background: #f9f9f9; padding: 8px 12px; border-radius: 4px; font-size: 12.5px; text-align: right;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #333;">
          <span>${item.message}</span>
          <span style="color: ${item.status === "PASS" ? "#2e7d32" : "#c62828"};">${item.status === "PASS" ? "نجاح" : "فشل"}</span>
        </div>
        ${item.details ? `<div style="font-family: monospace; color: #666; font-size: 11px; margin-top: 4px; direction: ltr; text-align: left;">${item.details}</div>` : ""}
      </div>
    `;
  });

  html += `
      </div>
      <div style="padding: 12px; background: #f5f5f5; border-radius: 0 0 12px 12px; text-align: center;">
        <button onclick="document.getElementById('test-report-overlay').style.display='none'" style="background: #2e7d32; color: white; border: none; padding: 6px 18px; border-radius: 6px; font-family: Cairo; font-weight: bold; cursor: pointer;">إغلاق</button>
      </div>
    </div>
  `;

  overlay.innerHTML = html;
  overlay.style.display = "flex";
}
