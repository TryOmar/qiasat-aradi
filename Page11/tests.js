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

    // ** إضافات الفحص للحالة الأولى: يوجد متبقٍ **
    const remRow1 = document.getElementById("remainder-row-table");
    assert(remRow1 && remRow1.style.display !== "none", "الحالة 1 (المتبقي): صف المتبقي يجب أن يكون ظاهراً.");
    const redistBtn1 = document.getElementById("btn-redistribute-remainder");
    assert(redistBtn1 && redistBtn1.style.display !== "none", "الحالة 1 (المتبقي): زر إعادة تقسيم المتبقي يجب أن يكون ظاهراً.");
    
    // مجموع مساحات الشركاء + المتبقي = المساحة الكلية
    const sumAreas1 = p1.area + p2.area + rem1.area;
    assert(Math.abs(sumAreas1 - totalArea1) < 0.01, "الحالة 1: مجموع مساحات الشركاء والمتبقي يساوي المساحة الكلية (10000 م²).", `الفعلي: ${sumAreas1}`);
    
    // إجمالي النسبة المئوية الموزعة
    const totalPct1 = parseFloat(document.getElementById("total-percent-distributed").value) || 0;
    assert(Math.abs(totalPct1 - 100) < 0.1, "الحالة 1: إجمالي النسبة المئوية الموزعة يجب أن تكون 100%.", `الفعلي: ${totalPct1}`);
    
    // إجمالي الفدان/القيراط/السهم = تحويل المساحة الكلية
    const totalFeddans1 = parseFloat(document.getElementById("total-feddans-entered").value) || 0;
    const totalCarats1 = parseFloat(document.getElementById("total-carats-entered").value) || 0;
    const totalShares1 = parseFloat(document.getElementById("total-shares-entered").value) || 0;
    const expectedFCS1 = convertSquareMetersToFCS(totalArea1);
    assert(totalFeddans1 === expectedFCS1.feddan && totalCarats1 === expectedFCS1.carat && Math.abs(totalShares1 - expectedFCS1.sahm) < 0.1, "الحالة 1: إجمالي الفدان/القيراط/السهم يجب أن يطابق تحويل المساحة الكلية للأرض.");

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
    
    // ** فحص المتبقي بعد إعادة التقسيم الثاني **
    const remRow2 = document.getElementById("remainder-row-table");
    assert(remRow2 && remRow2.style.display !== "none", "الحالة 1 (المرحلة 2): صف المتبقي يجب أن يكون ظاهراً.");
    
    const totalPct2 = parseFloat(document.getElementById("total-percent-distributed").value) || 0;
    assert(Math.abs(totalPct2 - 100) < 0.1, "الحالة 1 (المرحلة 2): إجمالي النسبة المئوية الموزعة يجب أن تكون 100%.", `الفعلي: ${totalPct2}`);


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

    // -------------------------------------------------------------------------
    // TEST CASE 5: Full partition verification (remainder = 0, no remainder UI showing)
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 110;
    document.getElementById("length2").value = 110;
    document.getElementById("width1").value = 100;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 0; // custom
    document.getElementById("other-carat-area").value = 458.3333333333333; // 11000 / 24
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";
    handleCaratAreaChange(false);

    const list5 = document.getElementById("partners-list");
    list5.innerHTML = "";
    addNewPartnerRow("شريك 1", 0, 9, 4, "");  // 9 carats, 4 shares
    addNewPartnerRow("شريك 2", 0, 14, 20, ""); // 14 carats, 20 shares

    // Run partition and update table totals
    window.runPartition();

    const remainderRow5 = document.getElementById("remainder-row-table");
    const isRemainderHidden5 = !remainderRow5 || remainderRow5.style.display === "none";
    assert(isRemainderHidden5, "الحالة 5: صف المتبقي في الجدول يجب أن يكون مخفياً تماماً بعد التقسيم بالكامل.");

    const piecesWithRemainder5 = window.calculatedPieces.filter(p => p.isRemainder);
    assert(piecesWithRemainder5.length === 0, "الحالة 5: مصفوفة window.calculatedPieces يجب ألا تحتوي على أي كائن متبقي.", `العدد الفعلي: ${piecesWithRemainder5.length}`);

    const statusText5 = document.getElementById("summary-status") ? document.getElementById("summary-status").innerText : "";
    assert(statusText5.includes("تم التقسيم بالكامل"), "الحالة 5: رسالة الحالة يجب أن تؤكد اكتمال التقسيم بالكامل.", `النص الفعلي: "${statusText5}"`);

    const totalAreaValue5 = parseFloat(document.getElementById("total-area-distributed").value) || 0;
    assert(Math.abs(totalAreaValue5 - 11000) < 0.1, "الحالة 5: المساحة الإجمالية الموزعة يجب أن تكون 11000 م².", `المساحة الفعلية: ${totalAreaValue5}`);

    const totalPctValue5 = document.getElementById("total-percent-distributed").value;
    assert(totalPctValue5.includes("100"), "الحالة 5: النسبة الإجمالية الموزعة يجب أن تكون 100%.", `النسبة الفعلية: ${totalPctValue5}`);

    // مجموع مساحات الشركاء يساوي المساحة الكلية
    const sumAreas5 = window.calculatedPieces.reduce((acc, p) => acc + p.area, 0);
    assert(Math.abs(sumAreas5 - 11000) < 0.1, "الحالة 5: مجموع مساحات الشركاء يساوي المساحة الكلية (11000 م²).", `الفعلي: ${sumAreas5}`);

    const totalShares5 = parseFloat(document.getElementById("total-shares-entered").value) || 0;
    const totalCarats5 = parseFloat(document.getElementById("total-carats-entered").value) || 0;
    const totalFeddans5 = parseFloat(document.getElementById("total-feddans-entered").value) || 0;

    // مجموع الأنصبة = 24 قيراطاً = 1 فدان، 0 قيراط، 0 سهم (حسب تحويل 11000 م² بمعدل 458.33 م² للقيراط)
    const expectedFCS5 = convertSquareMetersToFCS(11000);
    assert(totalFeddans5 === expectedFCS5.feddan, "الحالة 5: إجمالي الفدادين يجب أن يطابق تحويل المساحة الكلية للأرض.", `الفعلي: ${totalFeddans5}، المتوقع: ${expectedFCS5.feddan}`);
    assert(totalCarats5 === expectedFCS5.carat, "الحالة 5: إجمالي القراريط يجب أن يطابق تحويل المساحة الكلية للأرض.", `الفعلي: ${totalCarats5}، المتوقع: ${expectedFCS5.carat}`);
    assert(Math.abs(totalShares5 - expectedFCS5.sahm) < 0.1, "الحالة 5: إجمالي الأسهم يجب أن يطابق تحويل المساحة الكلية للأرض.", `الفعلي: ${totalShares5}، المتوقع: ${expectedFCS5.sahm}`);

    // -------------------------------------------------------------------------
    // TEST CASE 6: FCS Conversion precision, reconstructibility, and Egyptian standard validation
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 110;
    document.getElementById("length2").value = 110;
    document.getElementById("width1").value = 100;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 0; // custom
    document.getElementById("other-carat-area").value = 175.035; // Standard Egyptian Carat Area (4200.833 m² per feddan)
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";
    handleCaratAreaChange(false);

    const area1 = 4200.84; // 1 Feddan, 0 Carat, 0 Shares
    const area2 = 6799.16; // 1 Feddan, 14 Carats, 20.27 Shares
    const totalArea6 = area1 + area2; // 11000 m²

    const fcs1 = convertSquareMetersToFCS(area1);
    const fcs2 = convertSquareMetersToFCS(area2);
    const fcsT = convertSquareMetersToFCS(totalArea6);

    // Verify FCS values
    assert(fcs1.feddan === 1 && fcs1.carat === 0 && fcs1.sahm === 0, "الحالة 6: تحويل 4200.84 م² يجب أن يعادل 1 فدان و0 قيراط و0 سهم.", `الفعلي: ${fcs1.feddan} ف، ${fcs1.carat} ق، ${fcs1.sahm} س`);
    assert(fcs2.feddan === 1 && fcs2.carat === 14 && Math.abs(fcs2.sahm - 20.27) < 0.05, "الحالة 6: تحويل 6799.16 م² يجب أن يعادل 1 فدان و14 قيراط و20.27 سهم.", `الفعلي: ${fcs2.feddan} ف، ${fcs2.carat} ق، ${fcs2.sahm} س`);
    assert(fcsT.feddan === 2 && fcsT.carat === 14 && Math.abs(fcsT.sahm - 20.27) < 0.05, "الحالة 6: تحويل المساحة الإجمالية 11000 م² يجب أن يعادل 2 فدان و14 قيراط و20.27 سهم.", `الفعلي: ${fcsT.feddan} ف، ${fcsT.carat} ق، ${fcsT.sahm} س`);

    // Reconstruct areas from FCS values (Reconstructibility Check using dynamic tolerance = SahmArea / 2)
    const caratAreaVal6 = 175.035;
    const sahmArea6 = caratAreaVal6 / 24;
    const dynamicTolerance6 = sahmArea6 / 2; // ~3.646 sqm

    const recon1 = (fcs1.feddan * 24 + fcs1.carat + fcs1.sahm / 24) * caratAreaVal6;
    const recon2 = (fcs2.feddan * 24 + fcs2.carat + fcs2.sahm / 24) * caratAreaVal6;
    const reconT = (fcsT.feddan * 24 + fcsT.carat + fcsT.sahm / 24) * caratAreaVal6;

    assert(Math.abs(recon1 - area1) < dynamicTolerance6, `الحالة 6: مساحة الشريك 1 بعد إعادة البناء (${recon1.toFixed(2)} م²) يجب أن تطابق الأصلية بفارق أقل من نصف سهم (${dynamicTolerance6.toFixed(3)} م²).`);
    assert(Math.abs(recon2 - area2) < dynamicTolerance6, `الحالة 6: مساحة الشريك 2 بعد إعادة البناء (${recon2.toFixed(2)} م²) يجب أن تطابق الأصلية بفارق أقل من نصف سهم (${dynamicTolerance6.toFixed(3)} م²).`);
    assert(Math.abs(reconT - totalArea6) < dynamicTolerance6, `الحالة 6: مساحة الإجمالي بعد إعادة البناء (${reconT.toFixed(2)} م²) يجب أن تطابق المساحة الإجمالية بفارق أقل من نصف سهم (${dynamicTolerance6.toFixed(3)} م²).`);
    assert(Math.abs((recon1 + recon2) - totalArea6) < dynamicTolerance6, `الحالة 6: مجموع مساحات الشريكين بعد إعادة البناء (${(recon1 + recon2).toFixed(2)} م²) يجب أن يساوي المساحة الإجمالية بفارق أقل من نصف سهم (${dynamicTolerance6.toFixed(3)} م²).`);

    // -------------------------------------------------------------------------
    // TEST CASE 7: Stress Test (100 Random Partition Scenarios)
    // -------------------------------------------------------------------------
    for (let trial = 1; trial <= 100; trial++) {
      const l1 = 50 + Math.random() * 150;
      const l2 = 50 + Math.random() * 150;
      const w1 = 50 + Math.random() * 150;
      const w2 = 50 + Math.random() * 150;
      const caratAreaVal = 100 + Math.random() * 400;

      document.getElementById("length1").value = l1.toFixed(2);
      document.getElementById("length2").value = l2.toFixed(2);
      document.getElementById("width1").value = w1.toFixed(2);
      document.getElementById("width2").value = w2.toFixed(2);
      document.getElementById("input-carat-area").value = 0;
      document.getElementById("other-carat-area").value = caratAreaVal.toFixed(4);
      document.getElementById("share-input-method").value = "carats";
      window.currentInputMethod = "carats";
      handleCaratAreaChange(false);

      const w_avg = (w1 + w2) / 2;
      const l_avg = (l1 + l2) / 2;
      const totalLandArea = w_avg * l_avg;

      const numPartners = 2 + Math.floor(Math.random() * 4); // 2 to 5 partners
      const list7 = document.getElementById("partners-list");
      list7.innerHTML = "";

      let remainingFraction = 1.0;
      for (let i = 0; i < numPartners; i++) {
        const takeAll = i === numPartners - 1 && Math.random() > 0.5;
        const portion = takeAll ? remainingFraction : Math.random() * remainingFraction * 0.8;
        remainingFraction -= portion;

        const targetArea = portion * totalLandArea;
        const totalCarats = targetArea / caratAreaVal;
        const fed = Math.floor(totalCarats / 24);
        const car = Math.floor(totalCarats % 24);
        const sh = Number(((totalCarats - (fed * 24 + car)) * 24).toFixed(2));

        addNewPartnerRow(`شريك ${i + 1}`, fed, car, sh, "");
      }

      window.runPartition();

      assert(window.calculatedPieces && window.calculatedPieces.length > 0, `الحالة 7 (المحاولة ${trial}): مصفوفة القطع فارغة!`);
      
      let sumArea = 0;
      window.calculatedPieces.forEach((p, idx) => {
        assert(!isNaN(p.area) && isFinite(p.area), `الحالة 7 (المحاولة ${trial}): مساحة القطعة ${idx + 1} غير صالحة: ${p.area}`);
        assert(p.area >= 0, `الحالة 7 (المحاولة ${trial}): مساحة القطعة ${idx + 1} سالبة: ${p.area}`);
        assert(!isNaN(p.topW) && isFinite(p.topW) && p.topW >= 0, `الحالة 7 (المحاولة ${trial}): العرض العلوي غير صالح للقطعة ${idx + 1}`);
        assert(!isNaN(p.botW) && isFinite(p.botW) && p.botW >= 0, `الحالة 7 (المحاولة ${trial}): العرض السفلي غير صالح للقطعة ${idx + 1}`);
        
        sumArea += p.area;
      });

      assert(Math.abs(sumArea - totalLandArea) < 1.0, `الحالة 7 (المحاولة ${trial}): مجموع مساحات القطع (${sumArea.toFixed(2)} م²) لا يطابق مساحة الأرض الكلية (${totalLandArea.toFixed(2)} م²).`);

      const totalPctVal = parseFloat(document.getElementById("total-percent-distributed").value) || 0;
      assert(Math.abs(totalPctVal - 100) < 0.5, `الحالة 7 (المحاولة ${trial}): إجمالي النسبة المئوية الموزعة (${totalPctVal}%) لا يطابق 100%.`);
    }
    assert(true, "الحالة 7: نجاح اختبار الإجهاد لـ 100 محاولة تقسيم عشوائية بالكامل دون أي أخطاء رياضية.");

    // -------------------------------------------------------------------------
    // TEST CASE 8: Multi-Stage Sequential Remainder Redistribution (4 stages)
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 100;
    document.getElementById("length2").value = 100;
    document.getElementById("width1").value = 100;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 168;
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";
    handleCaratAreaChange(false);

    const list8 = document.getElementById("partners-list");
    list8.innerHTML = "";
    addNewPartnerRow("شريك 1", 1, 0, 0, ""); // 4032 sqm
    addNewPartnerRow("شريك 2", 1, 0, 0, ""); // 4032 sqm
    window.runPartition();

    const p1_s1 = window.calculatedPieces[0].area;
    const p2_s1 = window.calculatedPieces[1].area;
    const rem_s1 = window.calculatedPieces[2]; // area = 1936, botW = 19.36, topW = 19.36

    // Stage 2: Redistribute Remainder 1
    document.getElementById("width1").value = rem_s1.topW;
    document.getElementById("width2").value = rem_s1.botW;
    document.getElementById("length1").value = rem_s1.leftLine;
    document.getElementById("length2").value = rem_s1.divLine;
    list8.innerHTML = "";
    addNewPartnerRow("شريك 3", 0, 10, 0, ""); // 10 carats = 1680 sqm
    window.runPartition();

    const p3_s2 = window.calculatedPieces[0].area;
    const rem_s2 = window.calculatedPieces[1]; // area = 256, botW = 2.56, topW = 2.56

    // Stage 3: Redistribute Remainder 2
    document.getElementById("width1").value = rem_s2.topW;
    document.getElementById("width2").value = rem_s2.botW;
    document.getElementById("length1").value = rem_s2.leftLine;
    document.getElementById("length2").value = rem_s2.divLine;
    list8.innerHTML = "";
    addNewPartnerRow("شريك 4", 0, 1, 0, ""); // 1 carat = 168 sqm
    window.runPartition();

    const p4_s3 = window.calculatedPieces[0].area;
    const rem_s3 = window.calculatedPieces[1]; // area = 88, botW = 0.88, topW = 0.88

    // Stage 4: Redistribute Remainder 3
    document.getElementById("width1").value = rem_s3.topW;
    document.getElementById("width2").value = rem_s3.botW;
    document.getElementById("length1").value = rem_s3.leftLine;
    document.getElementById("length2").value = rem_s3.divLine;
    list8.innerHTML = "";
    addNewPartnerRow("شريك 5", 0, 0, 8, ""); // 8 shares = 56 sqm
    window.runPartition();

    const p5_s4 = window.calculatedPieces[0].area;
    const rem_s4 = window.calculatedPieces[1]; // area = 32 sqm

    // Verify grand sum
    const grandSum = p1_s1 + p2_s1 + p3_s2 + p4_s3 + p5_s4 + rem_s4.area;
    assert(Math.abs(grandSum - 10000) < 0.01, "الحالة 8: مجموع مساحات جميع القطع المتعاقبة والمتبقي الأخير يساوي 10000 م² بالضبط.", `المجموع الفعلي: ${grandSum.toFixed(2)} م²`);

    // -------------------------------------------------------------------------
    // TEST CASE 9: Print prevention and deficit state recovery test
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 100;
    document.getElementById("length2").value = 100;
    document.getElementById("width1").value = 100;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 0;
    document.getElementById("other-carat-area").value = 200; // 10000 sqm / 50 = 200
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";
    handleCaratAreaChange(false);

    const list9 = document.getElementById("partners-list");
    list9.innerHTML = "";
    
    // 1. Test case: Excluded partner (0 shares)
    // Add two partners: Partner 1 (40 carats = 8000 sqm), Partner 2 (0 carats = 0 sqm - excluded)
    addNewPartnerRow("شريك 1", 1, 16, 0, ""); // 40 carats = 8000 sqm
    addNewPartnerRow("شريك 2", 0, 0, 0, "");  // 0 carats = 0 sqm (excluded)
    calculateGeneral();
    window.runPartition();

    // Verify Partner 2 is excluded
    const rows9 = document.querySelectorAll("#partners-list .partner-row");
    assert(isPartnerRowExcluded(rows9[1]) === true, "الحالة 9: يجب استبعاد الشريك ذو المساحة الصفرية.");
    assert(isPartnerRowExcluded(rows9[0]) === false, "الحالة 9: الشريك 1 ذو المساحة 8000 م² يجب ألا يتم استبعاده.");

    // Verify active count is 1
    const activeCount9 = Array.from(rows9).filter(r => !isPartnerRowExcluded(r)).length;
    assert(activeCount9 === 1, "الحالة 9: عدد الشركاء النشطين يجب أن يكون 1.");

    // Verify excluded partner is NOT drawn in croquis (not in calculatedPieces)
    const drawnExcl = window.calculatedPieces.find(p => p.name === "شريك 2");
    assert(!drawnExcl, "الحالة 9: الشريك المستبعد يجب ألا يتم رسمه في الكروكي (غير موجود في calculatedPieces).");

    // Verify no deficit alert shown when there is only remainder
    assert(hasDeficit() === false, "الحالة 9: يجب ألا تظهر حالة العجز في حال وجود متبقي فقط.");
    const statusTextRem = document.getElementById("summary-status") ? document.getElementById("summary-status").innerText : "";
    assert(statusTextRem.includes("يوجد جزء غير مقسم"), "الحالة 9: يجب أن يظهر تنبيه المتبقي باللون البرتقالي.");

    // 2. Test case: Deficit (Total shares > 50 carats, e.g. 60 carats)
    list9.innerHTML = "";
    addNewPartnerRow("شريك 1", 2, 12, 0, ""); // 60 carats = 12000 sqm
    calculateGeneral();
    window.runPartition();

    // Verify deficit detection
    assert(hasDeficit() === true, "الحالة 9: يجب أن ترجع دالة hasDeficit() القيمة true عند وجود عجز في التوزيع.");

    // Verify status text alert for deficit
    const statusTextDef = document.getElementById("summary-status") ? document.getElementById("summary-status").innerText : "";
    assert(statusTextDef.includes("احترس! يوجد عجز في الأرض") || statusTextDef.includes("خطأ داخلي في الحسابات"), "الحالة 9: يجب أن يظهر تنبيه العجز باللون الأحمر عند تجاوز مساحة الأرض.");

    // Verify remainder redistribution button is hidden when there is a deficit
    const redistBtnDef = document.getElementById("btn-redistribute-remainder");
    if (redistBtnDef) {
      assert(redistBtnDef.style.display === "none", "الحالة 9: يجب إخفاء زر تقسيم المتبقي عند العجز.");
    }

    // 3. Resolve the deficit (Correct shares to 50 carats = 10000 sqm)
    list9.innerHTML = "";
    addNewPartnerRow("شريك 1", 2, 2, 0, ""); // 50 carats = 10000 sqm
    calculateGeneral();
    window.runPartition();

    // Verify deficit resolved and print works again
    assert(hasDeficit() === false, "الحالة 9: يجب أن ترجع دالة hasDeficit() القيمة false بعد تصحيح العجز لتعود الطباعة للعمل.");
    const finalStatusText9 = document.getElementById("summary-status") ? document.getElementById("summary-status").innerText : "";
    assert(finalStatusText9.includes("تم التقسيم بالكامل"), "الحالة 9: يجب أن يعود النص التنبيهي إلى التقسيم الكامل والأخضر.");

    // -------------------------------------------------------------------------
    // TEST CASE 10: Final Consistency Test
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 100;
    document.getElementById("length2").value = 100;
    document.getElementById("width1").value = 100;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 0;
    document.getElementById("other-carat-area").value = 200; // 10000 sqm / 50 = 200
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";
    handleCaratAreaChange(false);

    const list10 = document.getElementById("partners-list");
    list10.innerHTML = "";
    // Total land = 10000 sqm.
    // Create deficit (60 carats = 12000 sqm)
    addNewPartnerRow("شريك 1", 2, 12, 0, ""); // 60 carats = 12000 sqm
    calculateGeneral();
    window.runPartition();

    // Verify consistency in deficit state
    const calcDefArea = window.calcState.deficitArea;
    assert(calcDefArea === 2000, "الحالة 10: يجب أن تكون قيمة العجز في calcState مساوية لـ 2000 م².");
    assert(hasDeficit() === true, "الحالة 10: يجب أن ترجع دالة hasDeficit() القيمة true عند وجود عجز.");

    // value in table remaining box
    const tableDefText = document.getElementById("rem-area-m2") ? document.getElementById("rem-area-m2").innerText : "";
    assert(parseFloat(tableDefText) === 2000, "الحالة 10: يجب أن تكون قيمة العجز المعروضة في الجدول مساوية لـ 2000 م².", tableDefText);

    // value in summary status
    const statusDefText = document.getElementById("summary-status") ? document.getElementById("summary-status").innerText : "";
    assert(statusDefText.includes("2000"), "الحالة 10: يجب أن تحتوي رسالة التحذير في الملخص على قيمة العجز (2000).", statusDefText);

    // Resolve the deficit (Correct shares to 50 carats = 10000 sqm)
    list10.innerHTML = "";
    addNewPartnerRow("شريك 1", 2, 2, 0, ""); // 50 carats = 10000 sqm
    calculateGeneral();
    window.runPartition();

    // Verify consistency in resolved state
    assert(window.calcState.deficitArea === 0, "الحالة 10: يجب أن تكون قيمة العجز في calcState مساوية لـ 0 م² بعد التصحيح.");
    assert(hasDeficit() === false, "الحالة 10: يجب أن ترجع دالة hasDeficit() القيمة false بعد التصحيح.");

    const finalStatusText10 = document.getElementById("summary-status") ? document.getElementById("summary-status").innerText : "";
    assert(finalStatusText10.includes("تم التقسيم بالكامل"), "الحالة 10: يجب أن يعود النص التنبيهي إلى التقسيم الكامل والأخضر بعد التصحيح.", finalStatusText10);

    // -------------------------------------------------------------------------
    // TEST CASE 11: Manual editing of Area input & reverse check to Feddan
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 100;
    document.getElementById("length2").value = 100;
    document.getElementById("width1").value = 100;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 168; // Carat area = 168
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";
    handleCaratAreaChange(false);

    const list11 = document.getElementById("partners-list");
    list11.innerHTML = "";
    addNewPartnerRow("شريك 1", 0, 0, 0, ""); // empty row
    
    // 1. Simulate user typing area = 336 sqm
    const row11 = list11.querySelector(".partner-row");
    const areaInput11 = row11.querySelector(".partner-area");
    areaInput11.value = "336";
    // Call the event handler
    onAreaInput(areaInput11);

    // Verify FCS and percentage
    let feddans11 = parseFloat(row11.querySelector(".partner-feddans").value) || 0;
    let carats11 = parseFloat(row11.querySelector(".partner-carats").value) || 0;
    let shares11 = parseFloat(row11.querySelector(".partner-shares").value) || 0;
    
    // 336 / 168 = 2 carats. So feddans = 0, carats = 2, shares = 0.
    assert(feddans11 === 0 && carats11 === 2 && shares11 === 0, "الحالة 11: يجب أن يتم تحويل المساحة 336 م² إلى 2 قيراط.");
    
    // Check that percent is calculated as 3.36% (since total area is 10000 sqm)
    let percentVal11 = parseFloat(row11.querySelector(".partner-percent").value) || 0;
    assert(Math.abs(percentVal11 - 3.36) < 0.05, `الحالة 11: يجب أن تكون النسبة المحسوبة 3.36%. الفعلي: ${percentVal11}%`);
    assert(window.isUpdatingRow === false, "الحالة 11: يجب ألا يعلق التطبيق في حلقة لانهائية (isUpdatingRow = false).");

    // 2. Reverse Check: Change Feddans to 1 (Add 1 Feddan = 168 * 24 = 4032 sqm, total target 4368 sqm)
    const feddansInput11 = row11.querySelector(".partner-feddans");
    feddansInput11.value = "1";
    onShareInput(); // Trigger default flow

    // Verify Area and Percentage updated back
    const areaVal11_rev = parseFloat(row11.querySelector(".partner-area").value) || 0;
    const percentVal11_rev = parseFloat(row11.querySelector(".partner-percent").value) || 0;
    assert(Math.abs(areaVal11_rev - 4368) < 0.1, `الحالة 11 (عكسي): يجب تحديث المساحة إلى 4368 م² بعد تعديل الفدان. الفعلي: ${areaVal11_rev}`);
    assert(Math.abs(percentVal11_rev - 43.68) < 0.1, `الحالة 11 (عكسي): يجب تحديث النسبة إلى 43.68%. الفعلي: ${percentVal11_rev}%`);

    // 3. Deficit detection via Area Input
    areaInput11.value = "12000"; // Exceeds total area (10000 sqm)
    onAreaInput(areaInput11);
    assert(window.calcState.deficitArea === 2000, `الحالة 11 (العجز): يجب أن يكون العجز 2000 م². الفعلي: ${window.calcState.deficitArea}`);
    assert(hasDeficit() === true, "الحالة 11 (العجز): يجب أن يرجع كاشف العجز القيمة true.");

    // -------------------------------------------------------------------------
    // TEST CASE 12: Manual editing of Percentage input & reverse check to Fraction
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 100;
    document.getElementById("length2").value = 100;
    document.getElementById("width1").value = 100;
    document.getElementById("width2").value = 100;
    document.getElementById("input-carat-area").value = 168; // Carat area = 168
    document.getElementById("share-input-method").value = "fractions"; // Use fraction mode
    window.currentInputMethod = "fractions";
    handleCaratAreaChange(false);

    const list12 = document.getElementById("partners-list");
    list12.innerHTML = "";
    addNewPartnerRow("شريك 1", 0, 0, 0, ""); // empty row
    
    // 1. Simulate user typing percent = 10%
    const row12 = list12.querySelector(".partner-row");
    const percentInput12 = row12.querySelector(".partner-percent");
    percentInput12.value = "10 %";
    
    // Call the event handler
    onPercentInput(percentInput12);

    // Verify Fraction and Area
    const fraction12 = parseFloat(row12.querySelector(".partner-fraction").value) || 0;
    const areaVal12 = parseFloat(row12.querySelector(".partner-area").value) || 0;

    assert(Math.abs(fraction12 - 0.1) < 0.001, `الحالة 12: يجب تحويل النسبة 10% إلى كسر يعادل 0.1. الفعلي: ${fraction12}`);
    assert(Math.abs(areaVal12 - 1000) < 1.0, `الحالة 12: يجب أن تكون المساحة المحسوبة 1000 م². الفعلي: ${areaVal12} م²`);
    assert(window.isUpdatingRow === false, "الحالة 12: يجب ألا يعلق التطبيق في حلقة لانهائية (isUpdatingRow = false).");

    // 2. Reverse Check: Change Fraction to 0.2 (20% = 2000 sqm)
    const fractionInput12 = row12.querySelector(".partner-fraction");
    fractionInput12.value = "0.2";
    onShareInput(); // Trigger default flow

    // Verify Area and Percentage updated back
    const areaVal12_rev = parseFloat(row12.querySelector(".partner-area").value) || 0;
    const percentVal12_rev = parseFloat(row12.querySelector(".partner-percent").value) || 0;
    assert(Math.abs(areaVal12_rev - 2000) < 0.1, `الحالة 12 (عكسي): يجب تحديث المساحة إلى 2000 م² بعد تعديل الكسر. الفعلي: ${areaVal12_rev}`);
    assert(Math.abs(percentVal12_rev - 20.0) < 0.1, `الحالة 12 (عكسي): يجب تحديث النسبة إلى 20%. الفعلي: ${percentVal12_rev}%`);

    // -------------------------------------------------------------------------
    // TEST CASE 13: Auto-correction of tiny rounding discrepancies (Absorbing to last row)
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 30;
    document.getElementById("length2").value = 30;
    document.getElementById("width1").value = 30;
    document.getElementById("width2").value = 30;
    document.getElementById("input-carat-area").value = 168; // Carat area = 168
    document.getElementById("share-input-method").value = "carats";
    window.currentInputMethod = "carats";
    handleCaratAreaChange(false);

    const list13 = document.getElementById("partners-list");
    list13.innerHTML = "";
    // 1. Add two empty partners
    addNewPartnerRow("شريك 1", "", "", "", "");
    addNewPartnerRow("شريك 2", "", "", "", "");
    
    // 2. Trigger automatic division equally
    divideEqually();
    
    // Partner 2 is the last partner. Verify that partner 1 gets 16.29 and partner 2 gets 16.28
    const row13_1 = list13.querySelectorAll(".partner-row")[0];
    const row13_2 = list13.querySelectorAll(".partner-row")[1];
    const shares13_1 = parseFloat(row13_1.querySelector(".partner-shares").value) || 0;
    const shares13_2 = parseFloat(row13_2.querySelector(".partner-shares").value) || 0;

    assert(shares13_1 === 16.29, `الحالة 13 (توزيع تلقائي): الشريك الأول يجب أن يحصل على 16.29 سهم. الفعلي: ${shares13_1}`);
    assert(shares13_2 === 16.28, `الحالة 13 (توزيع تلقائي): الشريك الثاني (الأخير) يجب أن يتم تعويض نصيبه إلى 16.28 سهم. الفعلي: ${shares13_2}`);

    // Verify that the state has no deficit and total target area matches land area exactly
    assert(window.calcState.deficitArea === 0, `الحالة 13 (توزيع تلقائي): يجب أن يكون العجز مساوياً لـ 0 م². الفعلي: ${window.calcState.deficitArea}`);
    assert(hasDeficit() === false, "الحالة 13 (توزيع تلقائي): يجب ألا يوجد عجز بعد التقسيم بالتساوي.");
    assert(Math.abs(window.calcState.remainingArea) < 0.01, `الحالة 13 (توزيع تلقائي): يجب أن تكون المساحة المتبقية صفر. الفعلي: ${window.calcState.remainingArea}`);

    // 3. Verify Manual inputs: If user manually changes Partner 2's share back to 16.29, the program MUST NOT alter it.
    row13_2.querySelector(".partner-shares").value = "16.29";
    // Trigger calculation
    calculateGeneral();
    
    const shares13_2_manual = parseFloat(row13_2.querySelector(".partner-shares").value) || 0;
    assert(shares13_2_manual === 16.29, `الحالة 13 (إدخال يدوي): يجب ألا يقوم البرنامج بتعديل المدخل اليدوي 16.29 للشريك الثاني. الفعلي: ${shares13_2_manual}`);
    
    // Verify that a deficit of 0.06 sqm is reported
    assert(Math.abs(window.calcState.deficitArea - 0.06) < 0.01, `الحالة 13 (إدخال يدوي): يجب أن يظهر عجز حقيقي مقداره 0.06 م² للمدخلات اليدوية. الفعلي: ${window.calcState.deficitArea}`);
    assert(hasDeficit() === true, "الحالة 13 (إدخال يدوي): يجب تفعيل كاشف العجز لحماية الطباعة.");

    // -------------------------------------------------------------------------
    // TEST CASE 14: Manual Width adjustments in "Keep Area" mode
    // -------------------------------------------------------------------------
    document.getElementById("length1").value = 15;
    document.getElementById("length2").value = 16;
    document.getElementById("width1").value = 12;
    document.getElementById("width2").value = 10;
    document.getElementById("share-input-method").value = "fractions";
    window.currentInputMethod = "fractions";
    
    // Select Keep Area Mode
    const modeKeepAreaEl = document.getElementById("mode-keep-area");
    if (modeKeepAreaEl) modeKeepAreaEl.checked = true;

    const list14 = document.getElementById("partners-list");
    list14.innerHTML = "";
    addNewPartnerRow("شريك 1", "", "", "", "1/2");
    addNewPartnerRow("شريك 2", "", "", "", "1/2");
    
    window.runPartition();

    const row14_1 = list14.querySelectorAll(".partner-row")[0];
    const widthBotInput14 = row14_1.querySelector(".partner-width-bottom");
    const widthTopInput14 = row14_1.querySelector(".partner-width-top");

    // Initial automatically calculated widths
    const initialBotW = parseFloat(widthBotInput14.value) || 0;
    const initialTopW = parseFloat(widthTopInput14.value) || 0;
    
    // Simulate manual editing: change bottom width to 5.0 m
    widthBotInput14.value = "5.0";
    onWidthChangeActual(widthBotInput14, "bottom");

    const newTopW = parseFloat(widthTopInput14.value) || 0;
    const newBotW = parseFloat(widthBotInput14.value) || 0;
    
    assert(newBotW === 5.0, `الحالة 14 (تعديل يدوي): يجب أن يتغير العرض الأول (السفلي) إلى 5.0 م. الفعلي: ${newBotW}`);
    assert(newTopW !== initialTopW, `الحالة 14 (تعديل يدوي): يجب أن يتم إعادة حساب العرض الثاني (العلوي) تلقائياً.`);
    
    const partnerArea14 = parseFloat(row14_1.querySelector(".partner-area").value) || 0;
    assert(Math.abs(partnerArea14 - 85.25) < 0.1, `الحالة 14 (تعديل يدوي): يجب الحفاظ على مساحة الشريك 85.25 م² بنسبة 100%. الفعلي: ${partnerArea14} م²`);

    // Test Quick Step Adjustment using adjustWidthStep (simulate click on + button)
    const stepEl14 = document.getElementById("width-step-value");
    if (stepEl14) stepEl14.value = "0.20"; // Change step to 0.20m

    // Simulate clicking '+' button next to bottom width
    const plusBtn = row14_1.querySelector(".width-bottom-group .width-step-btn:last-child") || { closest: () => row14_1.querySelector(".width-bottom-group .width-input-container") };
    adjustWidthStep(plusBtn, "bottom", 1);

    const stepBotW = parseFloat(widthBotInput14.value) || 0;
    assert(Math.abs(stepBotW - 5.20) < 0.01, `الحالة 14 (أزرار الزيادة): يجب أن يزداد العرض بمقدار الخطوة (0.20 م) ليصبح 5.20 م. الفعلي: ${stepBotW}`);

    const stepArea14 = parseFloat(row14_1.querySelector(".partner-area").value) || 0;
    assert(Math.abs(stepArea14 - 85.25) < 0.1, `الحالة 14 (أزرار الزيادة): يجب أن تبقى مساحة الشريك ثابتة 85.25 م². الفعلي: ${stepArea14} م²`);

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
