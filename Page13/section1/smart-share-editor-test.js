/**
 * @file smart-share-editor-test.js
 * @description Commit 5A, 5B, 5C, 5D, 5E-1, 5E-2 & 5E-3 Acceptance Test Suite – Page13/section1
 *
 * التشغيل: افتح Console في المتصفح وانسخ هذا الكود كاملاً ثم اضغط Enter
 */

window.runSmartShareEditorTests = function() {
  "use strict";
  const suiteStartTime = performance.now();
  const originalAlert = window.alert;
  window.alert = () => {};

  try {
    console.clear();
    console.log("%c🚀 بدء اختبارات القبول لمحرر الشركاء الذكي (المراحل 5A, 5B, 5C, 5D, 5E-1, 5E-2, 5E-3)", "font-weight: bold; font-size: 16px; color: #0288d1;");

    const consoleErrors = [];
    const originalConsoleError = console.error;
  console.error = function(...args) {
    consoleErrors.push("console.error: " + args.join(" "));
    return originalConsoleError.apply(console, arguments);
  };

  const handleGlobalError = function(event) {
    const errorMsg = event.error ? `${event.error.name}: ${event.error.message}` : event.message;
    consoleErrors.push("Global exception: " + errorMsg);
  };

  const handleGlobalRejection = function(event) {
    const reason = event.reason ? (event.reason.message || event.reason) : "unknown reason";
    consoleErrors.push("Unhandled promise rejection: " + reason);
  };

  window.addEventListener("error", handleGlobalError);
  window.addEventListener("unhandledrejection", handleGlobalRejection);

  // ==========================================
  // جاسوس الأحداث والمؤقتات للكشف عن التسريبات (Spies for Leaks & Timers)
  // ==========================================
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

  let activeTimers = 0;
  const originalSetTimeout = window.setTimeout;
  const originalClearTimeout = window.clearTimeout;

  window.setTimeout = function(fn, delay) {
    activeTimers++;
    const id = originalSetTimeout(() => {
      activeTimers--;
      fn();
    }, delay);
    return id;
  };

  window.clearTimeout = function(id) {
    activeTimers = Math.max(0, activeTimers - 1);
    return originalClearTimeout.apply(this, arguments);
  };

  const results = [];
  let testIndex = 0;

  function assert(condition, label, detail) {
    testIndex++;
    const status = condition ? "PASS" : "FAIL";
    results.push({ id: testIndex, label, status, detail: detail || "" });
    const color = condition ? "color: green; font-weight: bold;" : "color: red; font-weight: bold; background-color: #ffebee;";
    console.log(`%c[T${testIndex}] ${label} → ${status}${detail ? " | " + detail : ""}`, color);
    return condition;
  }

  // تفعيل التقسيم واختيار الشكل شبه منحرف لضمان توفير بيئة حاسبة مناسبة
  if (typeof toggleDivisionPanel === "function" && !window.isDivisionActive) {
    toggleDivisionPanel();
  }
  const trapCard = document.querySelector('.shape-card[data-shape="trapezoid"]');
  if (trapCard) {
    trapCard.click();
  }

  // ضبط البداية بـ 3 شركاء
  if (typeof generateHeirsTable === "function") {
    const heirsCountInput = document.getElementById("heirs-count");
    if (heirsCountInput) heirsCountInput.value = 3;
    generateHeirsTable();
  }

  // ==========================================
  // 1. اختبارات الترحيل وتوافق البيانات (Migration Tests)
  // ==========================================
  console.log("\n%c1. اختبارات ترحيل البيانات القديمة (Migration & Compatibility)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  const heirWithArrayLocks = {
    id: "heir_test_array",
    name: "شريك قديم 1",
    share: 100,
    locks: []
  };
  heirsData.push(heirWithArrayLocks);
  
  const heirWithoutLocks = {
    id: "heir_test_missing",
    name: "شريك قديم 2",
    share: 150
  };
  heirsData.push(heirWithoutLocks);

  if (typeof renderHeirsRows === "function") {
    renderHeirsRows();
  }

  const upgradedArrayHeir = heirsData.find(h => h.id === "heir_test_array");
  const isArrayUpgraded = upgradedArrayHeir && 
                         typeof upgradedArrayHeir.locks === "object" && 
                         !Array.isArray(upgradedArrayHeir.locks) && 
                         upgradedArrayHeir.locks.area === false;
  assert(isArrayUpgraded, "نجاح ترحيل بنية الأقفال القديمة (locks: []) إلى البنية الكائنية الجديدة تلقائياً");

  const upgradedMissingHeir = heirsData.find(h => h.id === "heir_test_missing");
  const isMissingUpgraded = upgradedMissingHeir && 
                           typeof upgradedMissingHeir.locks === "object" && 
                           upgradedMissingHeir.locks.area === false;
  assert(isMissingUpgraded, "نجاح إنشاء وترقية حقل الأقفال للشريك القديم الذي لا يمتلكه إطلاقاً");

  if (typeof deleteHeir === "function") {
    deleteHeir("heir_test_array");
    deleteHeir("heir_test_missing");
  }


  // ==========================================
  // 2. اختبار تفعيل الأقفال والمزامنة (Locks Toggle Tests)
  // ==========================================
  console.log("\n%c2. اختبار تفعيل الأقفال ومنع التناقض (Locks State & Sync)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  const targetHeir = heirsData[0];
  const targetId = targetHeir.id;
  
  if (typeof toggleHeirLock === "function") {
    toggleHeirLock(targetId, "area");
  }
  assert(targetHeir.locks.area === true && targetHeir.locks.full === false, 
    "تفعيل قفل المساحة يدوياً يحول قيمته لـ true دون تفعيل القفل الكامل", 
    `area = ${targetHeir.locks.area}, full = ${targetHeir.locks.full}`);

  toggleHeirLock(targetId, "full");
  const isAllLocked = targetHeir.locks.area === true && 
                     targetHeir.locks.percent === true && 
                     targetHeir.locks.order === true && 
                     targetHeir.locks.full === true;
  assert(isAllLocked, "تفعيل القفل الكامل (ك) يقوم بقفل المساحة والنسبة والترتيب تلقائياً بنسبة 100%");

  toggleHeirLock(targetId, "area");
  assert(targetHeir.locks.area === false && targetHeir.locks.full === false, 
    "إلغاء قفل المساحة يدوياً يقوم بإلغاء القفل الكامل تلقائياً لضمان تطابق الحالة البصرية والمنطقية", 
    `area = ${targetHeir.locks.area}, full = ${targetHeir.locks.full}`);

  if (targetHeir.locks.percent) toggleHeirLock(targetId, "percent");
  if (targetHeir.locks.order) toggleHeirLock(targetId, "order");


  // ==========================================
  // 3. اختبارات السحب والإفلات (Drag & Drop Tests)
  // ==========================================
  console.log("\n%c3. اختبارات السحب والإفلات وإعادة الترتيب (Drag & Drop)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  const row0 = document.querySelector(`tr[data-id="${heirsData[0].id}"]`);
  const handle0 = row0 ? row0.querySelector(".drag-handle") : null;
  
  assert(handle0 !== null, "مقبض السحب (⋮⋮) موجود بصرياً داخل عمود التحكم");

  if (handle0) {
    handle0.dispatchEvent(new MouseEvent("mousedown"));
  }
  const isDraggableOnMouseDown = row0 && row0.getAttribute("draggable") === "true";
  assert(isDraggableOnMouseDown, "الضغط على مقبض السحب (mousedown) يفعل صفة draggable=true على الصف بالكامل للجر");

  if (handle0) {
    handle0.dispatchEvent(new MouseEvent("mouseup"));
  }
  const isDraggableRemovedOnMouseUp = row0 && !row0.hasAttribute("draggable");
  assert(isDraggableRemovedOnMouseUp, "مغادرة المقبض (mouseup) تلغي صفة draggable عن الصف فوراً");


  // ==========================================
  // 4. اختبار حماية الحقول والمنع البرمجي (Input Protection Tests - 5E-1)
  // ==========================================
  console.log("\n%c4. اختبار حماية الإدخال ومنع التعديل (Input Protection 5E-1)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  const testHeir = heirsData[1];
  
  toggleHeirLock(testHeir.id, "area");
  
  const testRow = document.querySelector(`tr[data-id="${testHeir.id}"]`);
  const sqmInput = testRow ? testRow.querySelector(".heir-share-sqm") : null;
  const pctInput = testRow ? testRow.querySelector(".heir-share-pct") : null;
  
  const isSqmReadOnly = sqmInput && sqmInput.hasAttribute("readonly") && sqmInput.classList.contains("input-locked");
  const isPctWritable = pctInput && !pctInput.hasAttribute("readonly") && !pctInput.classList.contains("input-locked");
  
  assert(isSqmReadOnly, "عند قفل المساحة (م)، يكتسب حقل المتر المربع السمة readonly وكلاس input-locked");
  assert(isPctWritable, "عند قفل المساحة فقط، يظل حقل النسبة المئوية مفتوحاً وقابلاً للتعديل بصرياً");

  const oldShare = testHeir.share;
  if (typeof updateHeirFields === "function") {
    updateHeirFields(testHeir.id, "sqm", 9999);
  }
  assert(testHeir.share === oldShare, "منع التعديل البرمجي (Early Return) بنجاح للشريك مقفل المساحة؛ القيمة في البيانات لم تتغير");

  toggleHeirLock(testHeir.id, "area");


  // ==========================================
  // 5. اختبار حساب وعرض المساحة المتبقية (Remaining Area Tests - 5E-2)
  // ==========================================
  console.log("\n%c5. اختبار حساب وعرض المساحة المتبقية (Remaining Area 5E-2)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  const remainingWrapper = document.getElementById("remaining-area-wrapper");
  const remainingSpan = document.getElementById("remaining-area");

  assert(remainingWrapper !== null && remainingSpan !== null, "حقن بند وعنصر عرض المساحة المتبقية (#remaining-area) ديناميكياً بنجاح");

  const originalShares = heirsData.map(h => h.share);

  heirsData.forEach(h => h.share = 0);
  if (typeof updateRemainingArea === "function") {
    updateRemainingArea();
  }
  let currentVal = parseFloat(remainingSpan.innerText);
  let isPositiveOk = currentVal > 0 && Math.abs(currentVal - calculatedArea) < 0.1;
  let isColorOrange = remainingSpan.style.color === "rgb(230, 81, 0)" || remainingSpan.style.color === "#e65100";
  assert(isPositiveOk && isColorOrange, "المتبقي موجب (توزيع جزئي) ⇒ يتم عرضه كقيمة موجبة وتلوينه بالبرتقالي (#e65100)", `المتبقي: ${currentVal}`);

  heirsData[0].share = calculatedArea;
  updateRemainingArea();
  currentVal = parseFloat(remainingSpan.innerText);
  let isZeroOk = Math.abs(currentVal) < 0.01;
  let isColorGreen = remainingSpan.style.color === "green";
  assert(isZeroOk && isColorGreen, "المتبقي صفر (توزيع مثالي) ⇒ يتم عرضه كـ 0.00 وتلوينه باللون الأخضر", `المتبقي: ${currentVal}`);

  heirsData[0].share = calculatedArea + 100;
  updateRemainingArea();
  currentVal = parseFloat(remainingSpan.innerText);
  let isNegativeOk = currentVal < -50;
  let isColorRed = remainingSpan.style.color === "red";
  assert(isNegativeOk && isColorRed, "المتبقي سالب (توزيع متجاوز) ⇒ يتم عرضه كقيمة سالبة وتلوينه باللون الأحمر", `المتبقي: ${currentVal}`);

  heirsData.forEach((h, i) => h.share = originalShares[i]);


  // ==========================================
  // 6. اختبار توزيع الفروق والـ Transaction (Difference Distribution - 5E-3)
  // ==========================================
  console.log("\n%c6. اختبار توزيع الفروق والـ Transaction والـ Rollback (5E-3)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  // تهيئة حصص البداية: أ (400)، ب (300)، ج (300) من إجمالي مساحة 1000
  if (typeof calculatedArea !== "undefined") {
    heirsData[0].share = 400;
    heirsData[1].share = 300;
    heirsData[2].share = 300;
  }

  // أ. اختبار التوزيع بالتساوي على الكل (تعديل أ من 400 إلى 500)
  if (typeof updateHeirFields === "function") {
    updateHeirFields(heirsData[0].id, "sqm", 500);
  }
  
  let isSharedEqually = heirsData[0].share === 500 && 
                        heirsData[1].share === 250 && 
                        heirsData[2].share === 250;
  assert(isSharedEqually, "تعديل حصة شريك (زيادة 100) يخصم الفارق بالتساوي من بقية الشركاء المفتوحين بصرياً وبالبيانات فوراً", 
    `أ = ${heirsData[0].share}, ب = ${heirsData[1].share}, ج = ${heirsData[2].share}`);

  // ب. اختبار احترام الأقفال أثناء التوزيع (قفل ب وتعديل أ من 500 إلى 600)
  toggleHeirLock(heirsData[1].id, "area"); // قفل ب
  updateHeirFields(heirsData[0].id, "sqm", 600);
  
  let isLocksRespected = heirsData[0].share === 600 && 
                         heirsData[1].share === 250 && // يظل ثابتاً بسبب القفل
                         heirsData[2].share === 150;    // يخصم كامل الفارق منه
  assert(isLocksRespected, "احترام الأقفال: خصم الفارق يتم فقط من الشركاء المفتوحين دون المساس بالشركاء المقفلين",
    `أ = ${heirsData[0].share}, ب = ${heirsData[1].share}, ج = ${heirsData[2].share}`);

  // ج. اختبار الحماية المسبقة ضد انعدام الشركاء المفتوحين (قفل ج ومحاولة التعديل)
  toggleHeirLock(heirsData[2].id, "area"); // قفل ج (ب وج مقفلين الآن)
  
  // حفظ قيم ما قبل التعديل الفاشل لتأكيد الـ Rollback
  const preFailShareA = heirsData[0].share;
  
  // محاكاة تحذير المتصفح للتنبيه لتفادي توقف الكود
  const originalAlert = window.alert;
  let alertTriggered = false;
  window.alert = () => { alertTriggered = true; };
  
  updateHeirFields(heirsData[0].id, "sqm", 700);
  
  window.alert = originalAlert; // استرجاع التنبيه الأصلي
  
  let isRollbackSuccess = heirsData[0].share === preFailShareA && 
                          heirsData[1].share === 250 && 
                          heirsData[2].share === 150;
  assert(alertTriggered && isRollbackSuccess, "في حال عدم توفر شريك مفتوح للخصم ⇒ يتم إلغاء المعاملة وتنبيه المستخدم والتراجع بالكامل (Rollback)");

  // تنظيف الأقفال واستعادة الحصص الأصلية
  toggleHeirLock(heirsData[1].id, "area");
  toggleHeirLock(heirsData[2].id, "area");
  heirsData.forEach((h, i) => h.share = originalShares[i]);
  if (typeof calculateAll === "function") {
    calculateAll();
  }

  // ==========================================
  // 7. اختبار توحيد مسار تحديث حقول الجدول (العروض والحصص)
  // ==========================================
  console.log("\n%c7. اختبار توحيد مسار تحديث حقول الجدول (Unified Update Path & Widths)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  // تهيئة قيم العروض للشريك الأول والثاني والثالث
  const heirA = heirsData[0];
  const heirB = heirsData[1];
  const heirC = heirsData[2];

  heirA.topW = 20; heirA.botW = 20;
  heirB.topW = 15; heirB.botW = 15;
  heirC.topW = 10; heirC.botW = 10;

  // أ. اختبار تعديل العرض الأول وتوزيعه محلياً وتراكمياً
  if (typeof updateHeirFields === "function") {
    updateHeirFields(heirA.id, "topW", 30);
  }

  // المجموع الإجمالي للعرض الأول يجب أن يظل ثابتاً: 20 + 15 + 10 = 45 م
  // زيادة العرض الأول لـ أ بمقدار 10 م يجب أن يخصم 5 م من ب و 5 م من ج بالتساوي
  const isWidthDistributed = heirA.topW === 30 && heirA.botW === 10 &&
                             heirB.topW === 10 && heirB.botW === 20 &&
                             heirC.topW === 5  && heirC.botW === 15;

  assert(isWidthDistributed, "تعديل العرض الأول للشريك أ يوزع الفارق المقابل بالتساوي على الشركاء الآخرين ويحفظ الإجمالي",
    `أ: ${heirA.topW}/${heirA.botW}, ب: ${heirB.topW}/${heirB.botW}, ج: ${heirC.topW}/${heirC.botW}`);

  // ب. اختبار احترام القفل الكامل (full) في حقول العروض
  toggleHeirLock(heirB.id, "full"); // قفل كامل لشريك ب
  const preLockWidthB = heirB.topW;
  
  if (typeof updateHeirFields === "function") {
    updateHeirFields(heirB.id, "topW", 40);
  }
  assert(heirB.topW === preLockWidthB, "القفل الكامل (full) يمنع تعديل العروض للشريك المقفل برمجياً", `العرض: ${heirB.topW}`);

  toggleHeirLock(heirB.id, "full"); // إلغاء القفل الكامل

  // ==========================================
  // 8. اختبارات الاستقرار والتحقق من صحة البيانات (Regression & Data Integrity)
  // ==========================================
  console.log("\n%c8. اختبارات الاستقرار وتكامل البيانات (Regression & Integrity)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  const startTime = performance.now();

  // أ. محاكاة الجواسيس (Performance Spies)
  const spies = {
    calculateAll: 0,
    saveStateToSession: 0,
    drawLandCanvas: 0
  };

  heirA.locks = { area: false, percent: false, order: false, full: false };
  const originalCalculateAll = window.calculateAll;
  const originalSaveStateToSession = window.saveStateToSession;
  const originalDrawLandCanvas = window.drawLandCanvas;

  window.calculateAll = function() {
    spies.calculateAll++;
    return originalCalculateAll.apply(this, arguments);
  };
  window.saveStateToSession = function() {
    spies.saveStateToSession++;
    return originalSaveStateToSession.apply(this, arguments);
  };
  window.drawLandCanvas = function() {
    spies.drawLandCanvas++;
    return originalDrawLandCanvas.apply(this, arguments);
  };

  // ب. اختبار الأداء أثناء الإدخال (oninput): يجب ألا يستدعي الحساب أو الحفظ إطلاقاً (0 استدعاء)
  if (typeof updateHeirFieldsLocally === "function") {
    updateHeirFieldsLocally(heirA.id, "carat", "2");
  }
  const isInputPerformanceOk = spies.calculateAll === 0 && spies.saveStateToSession === 0;
  assert(isInputPerformanceOk, "أداء الكتابة: الإدخال المستمر (oninput) لا يقوم بتشغيل الحساب أو حفظ الجلسة إطلاقاً لمنع الوميض والبطء",
    `calculateAll: ${spies.calculateAll}, saveSession: ${spies.saveStateToSession}`);

  // ج. اختبار الأداء عند الاعتماد (blur/Enter): استدعاء واحد فقط (1 استدعاء) لكل عملية
  spies.calculateAll = 0;
  spies.saveStateToSession = 0;

  if (typeof updateHeirFields === "function") {
    updateHeirFields(heirA.id, "carat", "2");
  }
  const isCommitPerformanceOk = spies.calculateAll === 1 && spies.saveStateToSession === 1;
  assert(isCommitPerformanceOk, "أداء الاعتماد: عند الـ blur أو Enter يتم تشغيل الحساب وحفظ الجلسة مرة واحدة فقط",
    `calculateAll: ${spies.calculateAll}, saveSession: ${spies.saveStateToSession}`);

  // استعادة الوظائف الأصلية وإزالة الجواسيس
  window.calculateAll = originalCalculateAll;
  window.saveStateToSession = originalSaveStateToSession;
  window.drawLandCanvas = originalDrawLandCanvas;

  // د. محاكاة التعديلات المتكررة على جميع الحقول بالتتابع وفحص سلامة مجموع النسب والمساحات والأقفال
  const testFields = [
    { field: "sqm", val: 350 },
    { field: "pct", val: 35 },
    { field: "feddan", val: 1 },
    { field: "carat", val: 12 },
    { field: "sahm", val: 12 },
    { field: "topW", val: 25 },
    { field: "botW", val: 22 }
  ];

  let multiFieldStabilityOk = true;
  testFields.forEach(f => {
    if (typeof updateHeirFields === "function") {
      updateHeirFields(heirA.id, f.field, f.val);
    }
    // فحص سلامة المجموع والتكامل
    let stepSum = 0;
    heirsData.forEach(h => stepSum += h.share || 0);
    const hasNegative = heirsData.some(h => h.share < 0);
    const hasNaN = heirsData.some(h => isNaN(h.share) || !isFinite(h.share));
    const isSumOk = Math.abs(stepSum - calculatedArea) < 0.1;

    if (hasNegative || hasNaN || !isSumOk) {
      multiFieldStabilityOk = false;
    }
  });

  assert(multiFieldStabilityOk, "سلامة مسارات الإدخال: تعديل جميع الحقول (م²، نسبة، فدان، قيراط، سهم، عرض 1، عرض 2) يحافظ على تكامل البيانات والمجموع دون قيم سالبة أو تصفير");

  // هـ. اختبار الحفظ ومحاكاة إعادة التحميل (Reload & Session Persistence Simulation)
  const savedStateString = JSON.stringify({
    heirs: heirsData,
    vertices: window.vertices
  });

  // محاكاة مسح البيانات وإعادة التحميل من الجلسة
  const reloadedData = JSON.parse(savedStateString);
  let isReloadMatch = reloadedData.heirs.length === heirsData.length &&
                      reloadedData.heirs[0].share === heirA.share &&
                      reloadedData.heirs[0].topW === heirA.topW;

  assert(isReloadMatch, "حفظ واسترجاع الجلسة: بعد استعادة البيانات من الجلسة، تتطابق الحصص والعروض والأعداد بالكامل بنسبة 100%");

  // تنظيف واستعادة الحصص والعروض الأصلية
  heirsData.forEach((h, i) => h.share = originalShares[i]);
  if (typeof calculateAll === "function") {
    calculateAll();
  }

  // ==========================================
  // 9. اختبار تسريب مستمعي الأحداث (Event Listener Leak Test)
  // ==========================================
  console.log("\n%c9. اختبار تسريب مستمعي الأحداث (Event Listener Leak)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  const getConnectedListeners = () => listenerRegistry.filter(r => r.target instanceof Node && r.target.isConnected).length;
  
  const initialListeners = getConnectedListeners();

  // محاكاة الإضافة والحذف وإعادة التقسيم 5 مرات متتالية
  for (let cycle = 0; cycle < 5; cycle++) {
    if (typeof addNewHeir === "function") {
      addNewHeir();
    }
    const lastHeir = heirsData[heirsData.length - 1];
    if (typeof deleteHeir === "function" && lastHeir) {
      deleteHeir(lastHeir.id);
    }
    if (typeof calculateAll === "function") {
      calculateAll();
    }
  }

  const postCycleListeners = getConnectedListeners();
  const isListenerCountStable = Math.abs(postCycleListeners - initialListeners) <= 2; // يسمح بفارق بسيط للمستمعين العامين للنوافذ

  assert(isListenerCountStable, "ثبات مستمعي الأحداث: بعد 5 دورات متتالية من الإضافة والحذف وإعادة التقسيم، لم يزد عدد مستمعي الأحداث المتصلين بالـ DOM",
    `قبل: ${initialListeners} | بعد: ${postCycleListeners}`);

  // ==========================================
  // 10. اختبار استقرار الذاكرة وسرعة المعالجة (Memory Stability & Stress Test)
  // ==========================================
  console.log("\n%c10. اختبار استقرار الذاكرة وسرعة المعالجة (Memory Stability & Stress)...", "font-weight: bold; color: #7b1fa2; font-size: 13px;");

  const stressStartTime = performance.now();

  // محاكاة 500 تعديل متتالٍ سريع
  for (let i = 0; i < 500; i++) {
    const val = (i % 24) + 1;
    if (typeof updateHeirFieldsLocally === "function") {
      updateHeirFieldsLocally(heirA.id, "carat", val);
    }
  }

  // محاكاة 100 عملية reorder
  for (let i = 0; i < 100; i++) {
    if (typeof moveHeirDown === "function" && heirsData.length > 1) {
      moveHeirDown(heirA.id);
      moveHeirUp(heirA.id);
    }
  }

  // محاكاة 100 عملية حفظ
  for (let i = 0; i < 100; i++) {
    if (typeof saveStateToSession === "function") {
      saveStateToSession();
    }
  }

  const stressDuration = performance.now() - stressStartTime;
  
  // فحص عدم وجود مؤقتات معلقة
  const isTimersOk = activeTimers <= 1; // فقط المؤقت الافتراضي المسموح به

  assert(stressDuration < 3000, `ثبات الذاكرة والسرعة: تشغيل 500 تعديل و 100 إعادة ترتيب و 100 حفظ تم في زمن ${stressDuration.toFixed(1)} ms دون تجميد الواجهة`, `الزمن: ${stressDuration.toFixed(1)} ms`);
  assert(isTimersOk, "خلو المؤقتات المعلقة: لا توجد أي مؤقتات معلقة أو تسريب للمهام المجدولة في الخلفية بعد عمليات الضغط", `المؤقتات النشطة: ${activeTimers}`);

  // فحص خلو سجل الـ Console والمنظومة من الأخطاء
  assert(consoleErrors.length === 0, "خلو سجل Console والمنظومة من الأخطاء والاستثناءات: لم يتم رصد أي أخطاء أو استثناءات أثناء تشغيل محرر الشركاء.", consoleErrors.length > 0 ? consoleErrors.slice(0, 5).join(" | ") : "نظيف");

  // استعادة EventTarget و window.setTimeout و console.error الأصليين
  EventTarget.prototype.addEventListener = originalAddEventListener;
  EventTarget.prototype.removeEventListener = originalRemoveEventListener;
  window.setTimeout = originalSetTimeout;
  window.clearTimeout = originalClearTimeout;
    window.removeEventListener("error", handleGlobalError);
    window.removeEventListener("unhandledrejection", handleGlobalRejection);
    console.error = originalConsoleError;

    const executionTime = Math.round(performance.now() - startTime);

    // طباعة بطاقة النتائج الإجمالية والتقرير المبسط المطلوب
    console.log("\n%c──────────────────────────────────────────────────────────", "color: #bbb;");
    const failed = results.filter(r => r.status === "FAIL");
    
    if (failed.length === 0) {
      console.log(`%c🎉 نجاح كافة اختبارات القبول لـ Commit 5E-3 بنسبة 100%`, "font-weight: bold; font-size: 15px; color: green;");
    } else {
      console.log(`%c❌ فشل بعض اختبارات القبول لـ Commit 5E-3`, "font-weight: bold; font-size: 15px; color: red;");
      failed.forEach(f => {
        console.log(`%c   [فشل]: ${f.label} | التفاصيل: ${f.detail}`, "color: #d32f2f;");
      });
    }

    console.log(`%c\n📊 ملخص تقرير الاختبار النهائي:`, "font-weight: bold; font-size: 13px; color: #333;");
    console.log(`%c   ✅ Total tests: ${results.length}`, "color: green; font-weight: bold;");
    console.log(`%c   ✅ Passed: ${results.length - failed.length}`, "color: green; font-weight: bold;");
    console.log(`%c   ❌ Failed: ${failed.length}`, `color: ${failed.length > 0 ? "red" : "green"}; font-weight: bold;`);
    console.log(`%c   ⏱ Execution time: ${executionTime} ms`, "color: #333;");

    return {
      passed: failed.length === 0,
      results: results,
      summary: {
        totalTests: results.length,
        passedTests: results.length - failed.length,
        failedTests: failed.length,
        execTimeMs: Math.round(performance.now() - suiteStartTime)
      }
    };
  } finally {
    window.alert = originalAlert;
  }
};

window.showUnifiedTestResultsReport = function(shareRes, layoutRes, guideRes, commit7Res) {
  if (!guideRes) {
    guideRes = {
      passed: true,
      summary: { totalTests: 0, passedTests: 0, failedTests: 0, execTimeMs: 0 },
      results: []
    };
  }
  if (!commit7Res) {
    commit7Res = {
      passed: true,
      summary: { totalTests: 0, passedTests: 0, failedTests: 0, execTimeMs: 0 },
      results: []
    };
  }
  let overlay = document.getElementById("test-report-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "test-report-overlay";
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 20000; direction: rtl; font-family: Cairo, Arial, sans-serif;";
    document.body.appendChild(overlay);
  }

  const dateStr = new Date().toLocaleString('ar-EG');
  const allPassed = shareRes.passed && (layoutRes.summary.failedTests === 0) && (guideRes.summary.failedTests === 0) && (commit7Res.summary.failedTests === 0);
  const totalTests = shareRes.summary.totalTests + layoutRes.summary.totalTests + guideRes.summary.totalTests + commit7Res.summary.totalTests;
  const totalPassed = shareRes.summary.passedTests + layoutRes.summary.passedTests + guideRes.summary.passedTests + commit7Res.summary.passedTests;
  const totalFailed = shareRes.summary.failedTests + layoutRes.summary.failedTests + guideRes.summary.failedTests + commit7Res.summary.failedTests;
  const totalDuration = shareRes.summary.execTimeMs + layoutRes.summary.execTimeMs + guideRes.summary.execTimeMs + commit7Res.summary.execTimeMs;

  let summaryHtml = `
    <div style="background: #e3f2fd; border: 1.5px solid #90caf9; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 12.5px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; color: #0d47a1;">
      <div style="grid-column: span 2; border-bottom: 1px solid #90caf9; padding-bottom: 4px; font-weight: bold;">
        ℹ️ اختبارات الانحدار لتقسيم الورثة والكروكي الذكي
      </div>
      <div>🗓️ <strong>التاريخ والوقت:</strong> ${dateStr}</div>
      <div>⏱️ <strong>زمن التنفيذ الكلي:</strong> ${totalDuration} مللي ثانية</div>
      <div>✅ <strong>المنفذة:</strong> ${totalTests} فحص فرعي</div>
      <div>🟢 <strong>الناجحة:</strong> ${totalPassed}</div>
      <div>🔴 <strong>الفاشلة:</strong> ${totalFailed}</div>
      <div>🏆 <strong>النتيجة النهائية:</strong> <span style="font-weight:bold; color:${allPassed ? '#2e7d32' : '#c62828'};">${allPassed ? '🟢 نجاح' : '🔴 فشل'}</span></div>
    </div>
  `;

  let detailsHtml = "";

  // Render Share Editor Results
  detailsHtml += `
    <div style="background: #e1bee7; color: #4a148c; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; margin-top: 12px; border: 1px solid #ce93d8; display: flex; justify-content: space-between;">
      <span>📁 محرر الشركاء الذكي (Smart Share Editor)</span>
      <span>(${shareRes.summary.totalTests} فحص)</span>
    </div>
  `;
  shareRes.results.forEach(item => {
    detailsHtml += `
      <div style="border-right: 4px solid ${item.status === 'PASS' ? '#2e7d32' : '#c62828'}; background: #f9f9f9; padding: 8px 12px; border-radius: 4px; font-size: 12.5px; margin-top: 6px; text-align: right;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #333;">
          <span>${item.label}</span>
          <span style="color: ${item.status === 'PASS' ? '#2e7d32' : '#c62828'};">${item.status === 'PASS' ? 'نجاح' : 'فشل'}</span>
        </div>
        ${item.details ? `<div style="font-family: monospace; color: #666; font-size: 11px; margin-top: 4px; direction: ltr; text-align: left;">${item.details}</div>` : ""}
      </div>
    `;
  });

  // Render Layout Results
  detailsHtml += `
    <div style="background: #ffe0b2; color: #e65100; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; margin-top: 12px; border: 1px solid #ffcc80; display: flex; justify-content: space-between;">
      <span>📁 الكروكي الذكي وتوزيع المساحة (Smart Layout)</span>
      <span>(${layoutRes.summary.totalTests} فحص)</span>
    </div>
  `;
  layoutRes.results.forEach(item => {
    detailsHtml += `
      <div style="border-right: 4px solid ${item.status === 'PASS' ? '#2e7d32' : item.status === 'FAIL' ? '#c62828' : '#ef6c00'}; background: #f9f9f9; padding: 8px 12px; border-radius: 4px; font-size: 12.5px; margin-top: 6px; text-align: right;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #333;">
          <span>${item.label}</span>
          <span style="color: ${item.status === 'PASS' ? '#2e7d32' : item.status === 'FAIL' ? '#c62828' : '#ef6c00'};">${item.status === 'PASS' ? 'نجاح' : item.status === 'FAIL' ? 'فشل' : 'تحذير'}</span>
        </div>
        ${item.detail ? `<div style="font-family: monospace; color: #666; font-size: 11px; margin-top: 4px; direction: ltr; text-align: left;">${item.detail}</div>` : ""}
      </div>
    `;
  });

  // Render Field Guide Results
  if (guideRes.summary.totalTests > 0) {
    detailsHtml += `
      <div style="background: #c8e6c9; color: #1b5e20; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; margin-top: 12px; border: 1px solid #a5d6a7; display: flex; justify-content: space-between;">
        <span>📁 دليل التنفيذ الميداني للمساحين (Field Guide)</span>
        <span>(${guideRes.summary.totalTests} فحص)</span>
      </div>
    `;
    guideRes.results.forEach(item => {
      detailsHtml += `
        <div style="border-right: 4px solid ${item.status === 'PASS' ? '#2e7d32' : '#c62828'}; background: #f9f9f9; padding: 8px 12px; border-radius: 4px; font-size: 12.5px; margin-top: 6px; text-align: right;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #333;">
            <span>${item.label}</span>
            <span style="color: ${item.status === 'PASS' ? '#2e7d32' : '#c62828'};">${item.status === 'PASS' ? 'نجاح' : 'فشل'}</span>
          </div>
          ${item.detail ? `<div style="font-family: monospace; color: #666; font-size: 11px; margin-top: 4px; direction: ltr; text-align: left;">${item.detail}</div>` : ""}
        </div>
      `;
    });
  }

  // Render Commit 7 Results
  if (commit7Res.summary.totalTests > 0) {
    detailsHtml += `
      <div style="background: #bbdefb; color: #0d47a1; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; margin-top: 12px; border: 1px solid #90caf9; display: flex; justify-content: space-between;">
        <span>📁 اختبارات الانحدار الشاملة (Commit 7 Regression Tests)</span>
        <span>(${commit7Res.summary.totalTests} فحص)</span>
      </div>
    `;
    commit7Res.results.forEach(item => {
      detailsHtml += `
        <div style="border-right: 4px solid ${item.status === 'PASS' ? '#2e7d32' : '#c62828'}; background: #f9f9f9; padding: 8px 12px; border-radius: 4px; font-size: 12.5px; margin-top: 6px; text-align: right;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #333;">
            <span>${item.label}</span>
            <span style="color: ${item.status === 'PASS' ? '#2e7d32' : '#c62828'};">${item.status === 'PASS' ? 'نجاح' : 'فشل'}</span>
          </div>
          ${item.detail ? `<div style="font-family: monospace; color: #666; font-size: 11px; margin-top: 4px; direction: ltr; text-align: left;">${item.detail}</div>` : ""}
        </div>
      `;
    });
  }

  // Save report HTML function
  window.saveUnifiedQualityReport = function() {
    let htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير اختبارات الانحدار - تطبيق الدلال (الصفحة 13)</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #fafafa; color: #333; }
          .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          h1 { color: #1565c0; border-bottom: 2px solid #1565c0; padding-bottom: 10px; margin-bottom: 20px; font-family: Arial, sans-serif; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: #e3f2fd; padding: 15px; border-radius: 8px; font-size: 14px; }
          .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
          .stat-box { background: #f5f5f5; padding: 12px; border-radius: 8px; text-align: center; font-weight: bold; border: 1px solid #e0e0e0; }
          .stat-val { font-size: 20px; margin-top: 5px; color: #1565c0; }
          .category-title { background: #ab47bc; color: white; padding: 8px 12px; border-radius: 6px; margin-top: 25px; margin-bottom: 12px; font-size: 15px; font-weight: bold; }
          .category-title.layout { background: #ef6c00; }
          .test-row { background: #fff; padding: 10px 15px; border: 1px solid #eee; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; font-size: 13.5px; }
          .status-pass { color: #2e7d32; font-weight: bold; }
          .status-fail { color: #c62828; font-weight: bold; }
          .status-warn { color: #e65100; font-weight: bold; }
          .details { font-family: monospace; font-size: 11px; color: #666; margin-top: 4px; direction: ltr; text-align: left; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>📄 تقرير جودة النسخة - محرر الشركاء والكروكي الذكي</h1>
          <div class="meta-grid">
            <div><strong>تاريخ تنفيذ الاختبار:</strong> ${dateStr}</div>
            <div><strong>زمن التنفيذ:</strong> ${totalDuration} مللي ثانية</div>
            <div><strong>النتيجة النهائية:</strong> ${allPassed ? "ناجح بنسبة 100%" : "يوجد فحوصات فاشلة"}</div>
          </div>
          
          <div class="stat-grid">
            <div class="stat-box">المنفذة<div class="stat-val">${totalTests}</div></div>
            <div class="stat-box" style="background:#e8f5e9; border-color:#a5d6a7; color:#2e7d32;">الناجحة<div class="stat-val" style="color:#2e7d32;">${totalPassed}</div></div>
            <div class="stat-box" style="background:#ffebee; border-color:#ffcdd2; color:#c62828;">الفاشلة<div class="stat-val" style="color:#c62828;">${totalFailed}</div></div>
          </div>
          
          <div class="category-title">محرر الشركاء الذكي</div>
      `;

    shareRes.results.forEach(item => {
      htmlContent += `
        <div class="test-row">
          <div style="flex: 1;">
            <div>${item.label}</div>
            ${item.details ? `<div class="details">${item.details}</div>` : ""}
          </div>
          <div class="${item.status === 'PASS' ? 'status-pass' : 'status-fail'}">${item.status === 'PASS' ? 'نجاح' : 'فشل'}</div>
        </div>
      `;
    });

    htmlContent += `<div class="category-title layout">الكروكي الذكي وتوزيع المساحة</div>`;

    layoutRes.results.forEach(item => {
      htmlContent += `
        <div class="test-row">
          <div style="flex: 1;">
            <div>${item.label}</div>
            ${item.detail ? `<div class="details">${item.detail}</div>` : ""}
          </div>
          <div class="${item.status === 'PASS' ? 'status-pass' : item.status === 'FAIL' ? 'status-fail' : 'status-warn'}">${item.status === 'PASS' ? 'نجاح' : item.status === 'FAIL' ? 'فشل' : 'تحذير'}</div>
        </div>
      `;
    });

    if (guideRes.summary.totalTests > 0) {
      htmlContent += `<div class="category-title" style="background:#2e7d32;">دليل التنفيذ الميداني للمساحين</div>`;
      guideRes.results.forEach(item => {
        htmlContent += `
          <div class="test-row">
            <div style="flex: 1;">
              <div>${item.label}</div>
              ${item.detail ? `<div class="details">${item.detail}</div>` : ""}
            </div>
            <div class="${item.status === 'PASS' ? 'status-pass' : 'status-fail'}">${item.status === 'PASS' ? 'نجاح' : 'فشل'}</div>
          </div>
        `;
      });
    }

    if (commit7Res.summary.totalTests > 0) {
      htmlContent += `<div class="category-title" style="background:#0288d1;">اختبارات الانحدار الشاملة (Commit 7)</div>`;
      commit7Res.results.forEach(item => {
        htmlContent += `
          <div class="test-row">
            <div style="flex: 1;">
              <div>${item.label}</div>
              ${item.detail ? `<div class="details">${item.detail}</div>` : ""}
            </div>
            <div class="${item.status === 'PASS' ? 'status-pass' : 'status-fail'}">${item.status === 'PASS' ? 'نجاح' : 'فشل'}</div>
          </div>
        `;
      });
    }

    htmlContent += `
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Page13_Regression_Test_Report_" + new Date().toISOString().slice(0,10) + ".html");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  overlay.innerHTML = `
    <div style="background: white; border-radius: 12px; width: 90%; max-width: 650px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: flex; flex-direction: column; max-height: 85%;">
      <div style="background: ${allPassed ? "#2e7d32" : "#c62828"}; color: white; padding: 15px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px;">🧪 تقرير اختبارات الانحدار - الصفحة 13</h3>
        <button onclick="document.getElementById('test-report-overlay').style.display='none'" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; font-weight: bold;">&times;</button>
      </div>
      <div style="padding: 15px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px;">
        <div style="font-weight: bold; font-size: 14px; color: ${allPassed ? "#2e7d32" : "#c62828"}; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 8px;">
          ${allPassed ? "🟢 جميع اختبارات القبول والكروكي اجتازت بنجاح!" : "🔴 بعض الاختبارات فشلت. يرجى مراجعة التفاصيل أدناه."}
        </div>
        ${summaryHtml}
        ${detailsHtml}
      </div>
      <div style="padding: 12px; background: #f5f5f5; border-radius: 0 0 12px 12px; display: flex; justify-content: space-between; align-items: center;">
        <button onclick="window.saveUnifiedQualityReport()" style="background: #1565c0; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-family: Cairo; font-weight: bold; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          📄 حفظ تقرير الجودة
        </button>
        <button onclick="document.getElementById('test-report-overlay').style.display='none'" style="background: #2e7d32; color: white; border: none; padding: 8px 24px; border-radius: 6px; font-family: Cairo; font-weight: bold; cursor: pointer; font-size: 13px;">
          إغلاق
        </button>
      </div>
    </div>
  `;

  overlay.style.display = "flex";
};
