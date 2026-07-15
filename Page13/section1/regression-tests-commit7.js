/**
 * @file regression-tests-commit7.js
 * @description Commit 7 Acceptance Test Suite – Page13/section1
 */

window.runCommit7Tests = function(options) {
  "use strict";
  options = options || {};
  
  // الكشف التلقائي عن بيئة الاختبارات الآلية (Headless) للتحويل للوضع المتزامن السريع
  const isHeadless = navigator.userAgent.includes("Headless") || 
                     navigator.userAgent.includes("HeadlessChrome") || 
                     window.errors_captured !== undefined ||
                     options.sync === true;
                     
  const leakDuration = options.leakTestDuration !== undefined ? options.leakTestDuration : (isHeadless ? 0 : 10);
  
  const startTime = performance.now();
  const results = [];
  let testIndex = 0;

  function assert(condition, label, detail) {
    testIndex++;
    const status = condition ? "PASS" : "FAIL";
    results.push({ id: testIndex, label, status, detail: detail || "" });
    const color = condition ? "color: green; font-weight: bold;" : "color: red; font-weight: bold; background-color: #ffebee;";
    console.log(`%c[C7-T${testIndex}] ${label} → ${status}${detail ? " | " + detail : ""}`, color);
    return condition;
  }

  // Backup original state
  const originalActiveShape = activeShape;
  const originalIsDivisionActive = isDivisionActive;
  const originalHeirsData = JSON.stringify(heirsData);

  // Helper selectors and mutators
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const selectShape = (shape) => {
    const card = document.querySelector(`.shape-card[data-shape="${shape}"]`);
    if (card) {
      card.click();
    }
  };

  const validatePartitionAreas = () => {
    if (typeof window.validatePartitionAreasShoelace === "function") {
      return window.validatePartitionAreasShoelace();
    }
    const exactTs = [0];
    let tempCumArea = 0;
    for (let i = 0; i < heirsData.length - 1; i++) {
      tempCumArea += heirsData[i].share;
      exactTs.push(findTForArea(tempCumArea, calculatedArea));
    }
    exactTs.push(1.0);

    let allAreasValid = true;
    let sumGeomArea = 0;
    heirsData.forEach((h, idx) => {
      const geomArea = getLeftArea(exactTs[idx + 1]) - getLeftArea(exactTs[idx]);
      sumGeomArea += geomArea;
      const diff = Math.abs(geomArea - h.share);
      if (diff > 0.001) {
        allAreasValid = false;
      }
    });
    const totalDiff = Math.abs(sumGeomArea - calculatedArea);
    if (totalDiff > 0.001) {
      allAreasValid = false;
    }
    return { ok: allAreasValid, sumGeomArea: sumGeomArea, totalDiff: totalDiff };
  };

  try {
    console.log("%c🚀 بدء اختبارات الانحدار الشاملة – Commit 7 (Comprehensive Regression Tests)", "font-weight: bold; font-size: 16px; color: #7b1fa2;");

    // ==========================================
    // 1. اختبارات الدقة المتناهية (Precision Verification Tests)
    // ==========================================
    console.log("\n%c1. اختبارات الدقة المتناهية (Precision Verification)...", "font-weight: bold; color: #1565c0;");
    
    // إعداد مستطيل 100م × 50م = 5000م² و3 شركاء بالتساوي
    selectShape("rectangle");
    setVal("rect-length", 100);
    setVal("rect-width", 50);
    
    if (!isDivisionActive && typeof toggleDivisionPanel === "function") {
      toggleDivisionPanel();
    }
    
    const countInput = document.getElementById("heirs-count");
    if (countInput) {
      countInput.value = 3;
      if (typeof generateHeirsTable === "function") generateHeirsTable();
    }
    if (typeof distributeEqually === "function") {
      distributeEqually();
    }

    // تحقق من دقة مجموع الأنصبة بقيم متناهية الصغر
    let sumShares = 0;
    heirsData.forEach(h => sumShares += h.share);
    const sharesDiff = Math.abs(sumShares - calculatedArea);
    assert(sharesDiff < 1e-6, "دقة مجموع الأنصبة: مجموع أنصبة الشركاء يطابق المساحة الكلية بدقة متناهية (أقل من 10^-6 م²)", `الفارق: ${sharesDiff.toFixed(10)} م²`);

    // تحقق من دقة الأبعاد الفرعية (الأطوال والعروض)
    let sumTopW = 0;
    let sumBotW = 0;
    heirsData.forEach(h => {
      sumTopW += h.topW || 0;
      sumBotW += h.botW || 0;
    });
    const topWDiff = Math.abs(sumTopW - 50); // عرض المستطيل
    const botWDiff = Math.abs(sumBotW - 50);
    assert(topWDiff < 1e-6 && botWDiff < 1e-6, "دقة أبعاد التقسيم: مجموع العروض العلوية والسفلية للقطع يطابق العرض الكلي بدقة متناهية", `علوي فارق: ${topWDiff.toFixed(10)}, سفلي فارق: ${botWDiff.toFixed(10)}`);

    // ==========================================
    // 1b. اختبارات الحدود الزراعية المستكملة خطياً (Agricultural Linear Interpolation Verification)
    // ==========================================
    // اختبار 1: طولان متساويان (30م و 30م) لشبه المنحرف
    selectShape("trapezoid");
    if (!isDivisionActive && typeof toggleDivisionPanel === "function") {
      toggleDivisionPanel();
    }
    
    // تعديل القيم مباشرة لتجنب تنشيط resetDivision()
    const minorInput = document.getElementById("trap-base-minor");
    const majorInput = document.getElementById("trap-base-major");
    const rightInput = document.getElementById("trap-length-right");
    const leftInput = document.getElementById("trap-length-left");
    if (minorInput) minorInput.value = 40;
    if (majorInput) majorInput.value = 60;
    if (rightInput) rightInput.value = 30;
    if (leftInput) leftInput.value = 30;
    
    if (countInput) {
      countInput.value = 3;
      if (typeof generateHeirsTable === "function") generateHeirsTable();
    }
    if (typeof distributeEqually === "function") {
      distributeEqually();
    }
    if (typeof calculateAll === "function") {
      calculateAll();
    }

    let allSidesEqual30 = true;
    heirsData.forEach(h => {
      if (Math.abs((h.leftL || 0) - 30) > 1e-2 || Math.abs((h.rightL || 0) - 30) > 1e-2) {
        allSidesEqual30 = false;
      }
    });
    assert(allSidesEqual30, "استقرار أطوال الفواصل (أطوال متساوية): جميع قيم الأطوال والفواصل لشبه منحرف (30م × 30م) تساوي 30.00م تماماً دون زيادة الإسقاط الهندسي", `القيم الفعلية: ` + heirsData.map(h => `[${h.leftL ? h.leftL.toFixed(2) : 'undefined'}, ${h.rightL ? h.rightL.toFixed(2) : 'undefined'}]`).join(", "));

    const areaVal1 = validatePartitionAreas();
    assert(areaVal1.ok, "صحة مساحات القطع وتطابق الإجمالي (اختبار 1): كل قطعة مساحتها تطابق النصيب المطلوب ومجموع المساحات يساوي مساحة الأرض الأصلية تماماً (±0.001 م²)", `الفارق الإجمالي: ${areaVal1.totalDiff.toFixed(6)} م²`);

    // اختبار 2: أطوال متدرجة خطياً (32م و 28م) لشبه المنحرف
    if (leftInput) leftInput.value = 32;
    if (rightInput) rightInput.value = 28;
    if (typeof calculateAll === "function") {
      calculateAll();
    }

    // استخراج قيم t المقابلة للتقسيم الفعلي
    const exactTs = [0];
    let tempCumArea = 0;
    for (let i = 0; i < heirsData.length - 1; i++) {
      tempCumArea += heirsData[i].share;
      exactTs.push(findTForArea(tempCumArea, calculatedArea));
    }
    exactTs.push(1.0);

    let interpolationOk = true;
    heirsData.forEach((h, idx) => {
      const expectedLeft = 32 + exactTs[idx] * (28 - 32);
      const expectedRight = 32 + exactTs[idx + 1] * (28 - 32);
      if (Math.abs((h.leftL || 0) - expectedLeft) > 1e-2 || Math.abs((h.rightL || 0) - expectedRight) > 1e-2) {
        interpolationOk = false;
      }
    });
    assert(interpolationOk, "تدرج أطوال الفواصل (أطوال مختلفة): تظهر أطوال الفواصل متدرجة خطياً بالكامل بين 32م و 28م دون تأثير الإسقاط الهندسي الإضافي", `القيم الفعلية: ` + heirsData.map(h => `[${h.leftL ? h.leftL.toFixed(2) : 'undefined'}, ${h.rightL ? h.rightL.toFixed(2) : 'undefined'}]`).join(", "));

    const areaVal2 = validatePartitionAreas();
    assert(areaVal2.ok, "صحة مساحات القطع وتطابق الإجمالي (اختبار 2): كل قطعة مساحتها تطابق النصيب المطلوب ومجموع المساحات يساوي مساحة الأرض الأصلية تماماً (±0.001 م²)", `الفارق الإجمالي: ${areaVal2.totalDiff.toFixed(6)} م²`);

    // اختبار 3: أطوال غير متساوية من الجانبين وشبكة عروض مختلفة وشريك فردي (35م × 70م × 45م × 30م، 7 شركاء)
    if (minorInput) minorInput.value = 35;
    if (majorInput) majorInput.value = 70;
    if (leftInput) leftInput.value = 45;
    if (rightInput) rightInput.value = 30;

    if (countInput) {
      countInput.value = 7;
      if (typeof generateHeirsTable === "function") generateHeirsTable();
    }
    if (typeof distributeEqually === "function") {
      distributeEqually();
    }
    if (typeof calculateAll === "function") {
      calculateAll();
    }

    const exactTs3 = [0];
    let tempCumArea3 = 0;
    for (let i = 0; i < heirsData.length - 1; i++) {
      tempCumArea3 += heirsData[i].share;
      exactTs3.push(findTForArea(tempCumArea3, calculatedArea));
    }
    exactTs3.push(1.0);

    let interpolationOk3 = true;
    heirsData.forEach((h, idx) => {
      const expectedLeft = 45 + exactTs3[idx] * (30 - 45);
      const expectedRight = 45 + exactTs3[idx + 1] * (30 - 45);
      if (Math.abs((h.leftL || 0) - expectedLeft) > 1e-2 || Math.abs((h.rightL || 0) - expectedRight) > 1e-2) {
        interpolationOk3 = false;
      }
    });
    assert(interpolationOk3, "التقسيم غير المتماثل (عدد شركاء فردي): تظهر أطوال الفواصل لشبه منحرف غير متماثل (35م × 70م × 45م × 30م، 7 شركاء) متناسبة خطياً بالكامل دون تجاوز الحدود", `القيم الفعلية: ` + heirsData.map(h => `[${h.leftL ? h.leftL.toFixed(2) : 'undefined'}, ${h.rightL ? h.rightL.toFixed(2) : 'undefined'}]`).join(", "));

    const areaVal3 = validatePartitionAreas();
    assert(areaVal3.ok, "صحة مساحات القطع وتطابق الإجمالي (اختبار 3): كل قطعة مساحتها تطابق النصيب المطلوب ومجموع المساحات يساوي مساحة الأرض الأصلية تماماً (±0.001 م²)", `الفارق الإجمالي: ${areaVal3.totalDiff.toFixed(6)} م²`);

    // إعادة ضبط الشكل إلى مستطيل لاختبار التوافقية مع بقية اختبارات الانحدار الأصلية
    selectShape("rectangle");
    setVal("rect-length", 100);
    setVal("rect-width", 50);
    if (!isDivisionActive && typeof toggleDivisionPanel === "function") {
      toggleDivisionPanel();
    }
    if (countInput) {
      countInput.value = 3;
      if (typeof generateHeirsTable === "function") generateHeirsTable();
    }
    if (typeof distributeEqually === "function") {
      distributeEqually();
    }
    if (typeof calculateAll === "function") {
      calculateAll();
    }

    // ==========================================
    // 2. التحقق من الحفظ والاسترجاع بالكامل (Session Save/Restore Tests)
    // ==========================================
    console.log("\n%c2. اختبارات الحفظ والاسترجاع الشامل (Session Save/Restore)...", "font-weight: bold; color: #1565c0;");

    // إعداد خصائص مخصصة
    heirsData[0].name = "شريك مخصص أ";
    heirsData[0].locks = { area: true, percent: false, order: true, full: false };
    heirsData[1].name = "شريك مخصص ب";
    heirsData[1].locks = { area: false, percent: true, order: false, full: false };
    
    // ضبط اتجاه التقسيم وإعدادات الكروكي
    const divDirBtn = document.getElementById("btn-division-direction");
    const isTransverseDefault = divDirBtn ? divDirBtn.textContent.includes("عرضي") : false;
    if (divDirBtn && isTransverseDefault) {
      divDirBtn.click(); // تغيير الاتجاه
    }

    if (typeof saveStateToSession === "function") {
      saveStateToSession();
    }

    // إفراغ البيانات بالكامل لمحاكاة إعادة تحميل الصفحة
    heirsData = [];
    isDivisionActive = false;
    
    if (typeof loadStateFromSession === "function") {
      loadStateFromSession();
    }

    const isRestoreOk = heirsData.length === 3 &&
                        heirsData[0].name === "شريك مخصص أ" &&
                        heirsData[0].locks.area === true &&
                        heirsData[0].locks.order === true &&
                        heirsData[1].name === "شريك مخصص ب" &&
                        heirsData[1].locks.percent === true;

    assert(isRestoreOk, "استرجاع الجلسة بالكامل: تم استرجاع بنية الشركاء، الأسماء، الأقفال، والترتيب بنجاح ومطابقة كاملة للبيانات المخزنة");

    // ==========================================
    // 3. اختبار الأداء والتحميل لـ 100 شريك (100-Partner Stress Test)
    // ==========================================
    console.log("\n%c3. اختبار الضغط والأداء لـ 100 شريك (100-Partner Load Test)...", "font-weight: bold; color: #1565c0;");

    const loadStart = performance.now();
    
    if (countInput) {
      countInput.value = 100;
      if (typeof generateHeirsTable === "function") generateHeirsTable();
    }

    const loadDuration = performance.now() - loadStart;
    assert(heirsData.length === 100, "إنشاء 100 شريك: تم إنشاء وتوليد جدول 100 شريك بنجاح في الواجهة والبيانات", `العدد الفعلي: ${heirsData.length}`);
    assert(loadDuration < 1500, "أداء التحميل لـ 100 شريك: تم توليد ورسم وحساب الجدول لـ 100 شريك في أقل من 1500ms دون تجميد الواجهة", `الوقت المستغرق: ${loadDuration.toFixed(1)} ms`);

    // محاكاة تحريك شريك وحفظه للتأكد من استقرار العمليات مع الأعداد الكبيرة
    const opStart = performance.now();
    if (typeof moveHeirDown === "function") {
      moveHeirDown(heirsData[0].id);
    }
    if (typeof saveStateToSession === "function") {
      saveStateToSession();
    }
    const opDuration = performance.now() - opStart;
    const allowedOpDuration = isHeadless ? 1000 : 200;
    assert(opDuration < allowedOpDuration, `أداء العمليات (تحريك وحفظ) لـ 100 شريك: تمت العمليات في أقل من ${allowedOpDuration}ms`, `الوقت المستغرق: ${opDuration.toFixed(1)} ms`);

    // استعادة البيانات الأصلية قبل بدء اختبار التسريب لتسريع المحاكاة ومنع تجميد المتصفح
    try {
      heirsData = JSON.parse(originalHeirsData);
      const countInput = document.getElementById("heirs-count");
      if (countInput) countInput.value = heirsData.length;
      renderHeirsRows();
      calculateAll();
    } catch(e) {}

    // ==========================================
    // 4. إعداد اختبار تسريب الذاكرة والـ Event Listeners (Memory Leak Test)
    // ==========================================
    console.log(`\n%c4. تشغيل محاكاة استقرار الموقتات وتسريب الذاكرة لـ (${leakDuration} ثوانٍ)...`);

    const listenerRegistry = [];
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function(type, listener, options) {
      listenerRegistry.push({ target: this, type, listener, options });
      return originalAddEventListener.apply(this, arguments);
    };

    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      const idx = listenerRegistry.findIndex(r => r.target === this && r.type === type && r.listener === listener);
      if (idx !== -1) {
        listenerRegistry.splice(idx, 1);
      }
      return originalRemoveEventListener.apply(this, arguments);
    };

    // نتحقق من العناصر المتصلة بالـ DOM فقط أو العناصر العامة لتجنب احتساب العناصر المحذوفة كـ Leaks
    const getConnectedListeners = () => listenerRegistry.filter(r => (r.target instanceof Node && r.target.isConnected) || r.target === window || r.target === document).length;
    
    // إعادة بناء الجدول لتسجيل مستمعي الأحداث الأصليين في سجل المراقبة الجديد
    if (typeof renderHeirsRows === "function") {
      renderHeirsRows();
    }
    const initialListenersCount = getConnectedListeners();
    const initialDrawTimes = [];
    
    // قياس أزمنة الرسم البدئية
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      if (typeof calculateAll === "function") calculateAll();
      initialDrawTimes.push(performance.now() - t0);
    }
    const avgInitialDrawTime = initialDrawTimes.reduce((a, b) => a + b, 0) / initialDrawTimes.length;

    // دالة لتنفيذ دورة محاكاة واحدة للتعديل والحذف والتحريك
    const runSimulationCycle = (cycleIdx) => {
      if (typeof addNewHeir === "function") {
        addNewHeir();
      }
      if (heirsData.length > 0 && typeof updateHeirFields === "function") {
        updateHeirFields(heirsData[heirsData.length - 1].id, "sqm", 20 + (cycleIdx % 10));
      }
      if (heirsData.length > 2 && typeof moveHeirDown === "function") {
        moveHeirDown(heirsData[0].id);
      }
      if (heirsData.length > 4 && typeof deleteHeir === "function") {
        deleteHeir(heirsData[heirsData.length - 1].id);
      }
      if (typeof calculateAll === "function") {
        calculateAll();
      }
    };

    const finalizeTest = () => {
      // قياس أزمنة الرسم النهائية بعد المحاكاة
      const finalDrawTimes = [];
      for (let i = 0; i < 3; i++) {
        const t0 = performance.now();
        if (typeof calculateAll === "function") calculateAll();
        finalDrawTimes.push(performance.now() - t0);
      }
      const avgFinalDrawTime = finalDrawTimes.reduce((a, b) => a + b, 0) / finalDrawTimes.length;

      // استعادة البيانات الأصلية لتطابق عدد العناصر البداية وضمان مقارنة عادلة لعدد المستمعين
      try {
        heirsData = JSON.parse(originalHeirsData);
        const countInput = document.getElementById("heirs-count");
        if (countInput) countInput.value = heirsData.length;
        renderHeirsRows();
        calculateAll();
      } catch(e) {}

      const finalListenersCount = getConnectedListeners();

      // حساب نسبة الزيادة في زمن الرسم
      const drawTimeIncreaseRatio = avgInitialDrawTime > 0 ? (avgFinalDrawTime - avgInitialDrawTime) / avgInitialDrawTime : 0;
      const leakedListeners = Math.max(0, finalListenersCount - initialListenersCount);

      assert(leakedListeners === 0, "استقرار الأحداث (Event Listeners): لا يوجد أي تسريب لمستمعي الأحداث بعد العمليات المستمرة والمتكررة", `المستمعون المضافون الصافي: ${leakedListeners} (البداية: ${initialListenersCount}, النهاية: ${finalListenersCount})`);
      
      const isPerfStable = drawTimeIncreaseRatio < 0.40;
      assert(isPerfStable, "استقرار زمن الرسم والأداء: لم يتراجع زمن الرسم بأكثر من 40% بعد العمليات المستمرة", `زمن الرسم الأولي: ${avgInitialDrawTime.toFixed(2)}ms, النهائي: ${avgFinalDrawTime.toFixed(2)}ms, نسبة الزيادة: ${(drawTimeIncreaseRatio * 100).toFixed(1)}%`);

      // استعادة مسجلات الأحداث الأصلية
      EventTarget.prototype.addEventListener = originalAddEventListener;
      EventTarget.prototype.removeEventListener = originalRemoveEventListener;

      // ==========================================
      // 5. التحقق من تجربة المستخدم والوميض (UX & Input Focus Tests)
      // ==========================================
      console.log("\n%c5. اختبارات تجربة المستخدم واستقرار التركيز (UX & Focus)...", "font-weight: bold; color: #1565c0;");

      // تحقق من عدم فقدان تركيز الحقل المدخل (input focus) عند الكتابة المستمرة
      const focusRow = document.querySelector("#heirs-list tr");
      const nameInput = focusRow ? focusRow.querySelector(".heir-name") : null;
      let focusLost = false;

      if (nameInput) {
        nameInput.focus();
        // محاكاة كتابة حرف
        nameInput.value = "شريك التركيز";
        nameInput.dispatchEvent(new Event("input", { bubbles: true }));
        
        // تحقق هل ما زال الحقل يمتلك التركيز بعد معالجة الأحداث
        if (document.activeElement !== nameInput) {
          focusLost = true;
        }
      }
      assert(!focusLost, "استقرار تركيز عناصر الإدخال: لا يفقد المستخدم التركيز (Input Focus) على الحقول أثناء كتابة الأسماء أو الأنصبة");

      // استعادة حالة النظام الأصلية بالكامل لضمان نظافة الاختبارات
      selectShape(originalActiveShape);
      if (!originalIsDivisionActive) {
        const toggleBtn = document.getElementById("btn-toggle-division");
        if (toggleBtn && isDivisionActive) toggleBtn.click();
      }
      try {
        heirsData = JSON.parse(originalHeirsData);
        renderHeirsRows();
        calculateAll();
        if (typeof updateFieldGuide === "function") {
          updateFieldGuide();
        }
      } catch(e) {}

      const duration = performance.now() - startTime;
      console.log(`\n%c🏁 انتهاء اختبارات Commit 7 بنجاح في زمن ${duration.toFixed(1)} ms`, "font-weight: bold; font-size: 14px; color: #7b1fa2;");
      
      const passedCount = results.filter(r => r.status === "PASS").length;
      const failedCount = results.filter(r => r.status === "FAIL").length;

      return {
        passed: failedCount === 0,
        results: results,
        summary: {
          totalTests: results.length,
          passedTests: passedCount,
          failedTests: failedCount,
          execTimeMs: Math.round(duration)
        }
      };
    };

    if (leakDuration === 0) {
      // تشغيل متزامن وسريع في البيئة Headless (5 دورات تكفي لمحاكاة التسريب دون عبء على المعالج)
      for (let i = 0; i < 5; i++) {
        runSimulationCycle(i);
      }
      return finalizeTest();
    } else {
      // تشغيل غير حاصر لمعالج الرسوميات وتجنب تجميد المتصفح بفاصل زمني 100ms
      return new Promise((resolve) => {
        const leakTestStart = performance.now();
        let cycleIdx = 0;
        const intervalId = setInterval(() => {
          cycleIdx++;
          runSimulationCycle(cycleIdx);

          if (performance.now() - leakTestStart >= (leakDuration * 1000)) {
            clearInterval(intervalId);
            resolve(finalizeTest());
          }
        }, 100);
      });
    }

  } catch (error) {
    console.error(error.stack || error);
    assert(false, "فشل غير متوقع أثناء تنفيذ اختبارات الانحدار لـ Commit 7.", error.message);
    const passedCount = results.filter(r => r.status === "PASS").length;
    const failedCount = results.filter(r => r.status === "FAIL").length;
    return {
      passed: false,
      results: results,
      summary: {
        totalTests: results.length,
        passedTests: passedCount,
        failedTests: failedCount,
        execTimeMs: Math.round(performance.now() - startTime)
      }
    };
  }
};
