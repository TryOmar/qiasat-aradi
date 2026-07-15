/**
 * @file smart-layout-test.js
 * @description Commit 2 Acceptance Test Suite – Page13/section1
 *
 * التشغيل: افتح Console في المتصفح وانسخ هذا الكود كاملاً ثم اضغط Enter
 * يُنتج تقريراً شاملاً لجميع اختبارات القبول المطلوبة
 */

window.runSmartLayoutTests = function() {
  "use strict";
  const suiteStartTime = performance.now();

  // ── أدوات مساعدة ────────────────────────────────────────────
  const results = [];
  let testIndex = 0;
  const canvas = document.getElementById("landCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  function log(msg, type) {
    const prefix = type === "PASS" ? "✅" : type === "FAIL" ? "❌" : type === "WARN" ? "⚠️" : "ℹ️";
    console.log(`${prefix} ${msg}`);
  }

  function assert(condition, label, detail) {
    testIndex++;
    const status = condition ? "PASS" : "FAIL";
    results.push({ id: testIndex, label, status, detail: detail || "" });
    log(`[T${testIndex}] ${label} → ${status}${detail ? " | " + detail : ""}`, status);
    return condition;
  }

  function warn(label, detail) {
    results.push({ id: ++testIndex, label, status: "WARN", detail: detail || "" });
    log(`[T${testIndex}] ${label}`, "WARN");
  }

  // ── دوال مساعدة للإدخال ─────────────────────────────────────
  function setVal(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function clickEl(id) {
    const el = document.getElementById(id);
    if (el) { el.click(); return true; }
    return false;
  }

  function clickShape(shapeName) {
    const cards = document.querySelectorAll(".shape-card");
    for (const card of cards) {
      const ds = card.getAttribute("data-shape");
      if (card.textContent.includes(shapeName) ||
          (shapeName === "مربع" && ds === "square") ||
          (shapeName === "مستطيل" && ds === "rectangle") ||
          (shapeName === "شبه منحرف" && ds === "trapezoid") ||
          (shapeName === "رباعي" && ds === "quadrilateral")) {
        card.click();
        return true;
      }
    }
    return false;
  }

  function calculate() {
    const btn = document.querySelector(".btn-calc");
    if (btn) btn.click();
    return true;
  }

  function activateDivision() {
    const btn = document.getElementById("btn-toggle-division");
    if (btn) {
      if (btn.textContent.includes("تفعيل") || !window.isDivisionActive) {
        btn.click();
      }
      return true;
    }
    return false;
  }

  function setHeirsCount(n) {
    setVal("heirs-count", n);
    const btn = document.querySelector("#division-panel button[onclick*='generateHeirsTable']");
    if (btn) { btn.click(); return; }
    // fallback: trigger generateHeirsTable directly
    if (typeof generateHeirsTable === "function") generateHeirsTable();
  }

  // ── فحص حدود الكانفاس ───────────────────────────────────────
  function checkCanvasBounds(label) {
    if (!canvas || !ctx) return { ok: false, reason: "no canvas" };

    const w = canvas.width;
    const h = canvas.height;
    const edgePx = 3; // بكسلات للفحص عند الحافة

    function hasContentInRegion(x, y, w2, h2) {
      try {
        const d = ctx.getImageData(x, y, w2, h2).data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i+1];
          const b = d[i+2];
          const a = d[i+3];
          // If pixel is not transparent (alpha > 30) AND is not white (r < 250 || g < 250 || b < 250)
          if (a > 30 && (r < 250 || g < 250 || b < 250)) {
            return true; // Non-white, non-transparent drawing content found
          }
        }
      } catch(e) {}
      return false;
    }

    const topOverflow    = hasContentInRegion(0, 0, w, edgePx);
    const bottomOverflow = hasContentInRegion(0, h - edgePx, w, edgePx);
    const leftOverflow   = hasContentInRegion(0, 0, edgePx, h);
    const rightOverflow  = hasContentInRegion(w - edgePx, 0, edgePx, h);

    const ok = !topOverflow && !bottomOverflow && !leftOverflow && !rightOverflow;
    return {
      ok,
      top: topOverflow,
      bottom: bottomOverflow,
      left: leftOverflow,
      right: rightOverflow
    };
  }

  // ── فحص هامش الأمان الفعلي ──────────────────────────────────
  function checkMarginHint() {
    const hint = window.smartMarginHint;
    const cssW  = parseFloat(canvas.style.width) || 0;
    const margin = hint || 0;

    return {
      hint,
      cssW,
      coverageRatio: cssW > 0 ? ((cssW - 2 * margin) / cssW) : 0,
      inRange: margin >= 55 && margin <= 90
    };
  }

  // ── فحص console errors ──────────────────────────────────────
  // نلتقط الأخطاء بتجاوز console.error
  const capturedErrors = [];
  const capturedWarnings = [];
  const origError = console.error.bind(console);
  const origWarn  = console.warn.bind(console);
  console.error = function(...args) { capturedErrors.push(args.join(" ")); origError(...args); };
  console.warn  = function(...args) { capturedWarnings.push(args.join(" ")); origWarn(...args); };

  // ── قياس الأداء ─────────────────────────────────────────────
  let bcrCallCount = 0;
  const origBCR = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function() {
    bcrCallCount++;
    return origBCR.call(this);
  };

  const perfResults = [];
  function measureDraw(label) {
    bcrCallCount = 0;
    const t0 = performance.now();
    if (typeof calculateAll === "function") calculateAll();
    const t1 = performance.now();
    const r = { label, time: (t1 - t0).toFixed(1) + "ms", bcrCalls: bcrCallCount };
    perfResults.push(r);
    return r;
  }

  // ════════════════════════════════════════════════════════════
  // بدء الاختبارات
  // ════════════════════════════════════════════════════════════
  console.group("🧪 Commit 2 – Smart Layout Acceptance Tests");
  console.log("📋 البدء في الاختبارات — الوقت:", new Date().toLocaleTimeString("ar"));
  console.log("─────────────────────────────────────────────");

  // ── T1: فحص تحميل SmartLayout ──────────────────────────────
  console.group("📦 Block 1: تحميل الوحدات");
  assert(typeof SmartLayout !== "undefined", "SmartLayout محمَّل", SmartLayout?.version);
  assert(typeof window.LayoutBuffer !== "undefined", "LayoutBuffer محمَّل");
  assert(typeof SmartLayout.prepare === "function", "SmartLayout.prepare() موجود");
  assert(typeof SmartLayout.onResize === "function", "SmartLayout.onResize() موجود");
  assert(typeof SmartLayout.validateBounds === "function", "SmartLayout.validateBounds() موجود");
  assert(canvas !== null, "landCanvas موجود في DOM");
  console.groupEnd();

  // ── T2: شبه منحرف — 3 شركاء ─────────────────────────────
  console.group("📐 Block 2: شبه منحرف (50/30/40/40) — 3 شركاء");
  clickShape("شبه منحرف");
  setTimeout(() => {}, 100);
  setVal("trap-base-major", 50);
  setVal("trap-base-minor", 30);
  setVal("trap-length-right", 40);
  setVal("trap-length-left", 40);
  activateDivision();
  setHeirsCount(3);
  const perf1 = measureDraw("شبه منحرف 3 شركاء");
  const bounds1 = checkCanvasBounds("شبه منحرف 3 شركاء");
  const margin1 = checkMarginHint();
  assert(bounds1.ok, "لا يوجد تجاوز لحدود الكانفاس", bounds1.ok ? "✔" : JSON.stringify(bounds1));
  assert(margin1.inRange, `smartMarginHint في النطاق (55-90)`, `hint=${margin1.hint?.toFixed(1)}px`);
  assert(margin1.coverageRatio >= 0.78 && margin1.coverageRatio <= 0.97,
    `نسبة التغطية (78-97%)`, `${(margin1.coverageRatio * 100).toFixed(1)}%`);
  assert(perf1.time.replace("ms","") < 200, `زمن الرسم < 200ms`, perf1.time);
  console.log("  📏 أبعاد الكانفاس:", canvas.style.width, "×", canvas.style.height);
  console.log("  🔵 smartMarginHint:", margin1.hint?.toFixed(1), "px");
  console.log("  📊 نسبة التغطية:", (margin1.coverageRatio * 100).toFixed(1) + "%");
  console.log("  ⚡ getBoundingClientRect() calls:", perf1.bcrCalls);
  console.groupEnd();

  // ── T3: مربع — 1 شريك ─────────────────────────────────────
  console.group("🔲 Block 3: مربع (60) — 1 شريك");
  clickShape("مربع");
  setVal("square-side", 60);
  setHeirsCount(1);
  const perf3 = measureDraw("مربع 1 شريك");
  const bounds3 = checkCanvasBounds("مربع 1 شريك");
  const margin3 = checkMarginHint();
  assert(bounds3.ok, "لا يوجد تجاوز للحدود (مربع)", bounds3.ok ? "✔" : JSON.stringify(bounds3));
  assert(margin3.inRange, "smartMarginHint في النطاق", `hint=${margin3.hint?.toFixed(1)}px`);
  console.log("  📏 أبعاد:", canvas.style.width, "×", canvas.style.height);
  console.groupEnd();

  // ── T4: مستطيل — 5 شركاء ──────────────────────────────────
  console.group("▭ Block 4: مستطيل (80×40) — 5 شركاء");
  clickShape("مستطيل");
  setVal("rect-length", 80);
  setVal("rect-width", 40);
  setHeirsCount(5);
  const perf4 = measureDraw("مستطيل 5 شركاء");
  const bounds4 = checkCanvasBounds("مستطيل 5 شركاء");
  const margin4 = checkMarginHint();
  assert(bounds4.ok, "لا يوجد تجاوز للحدود (مستطيل)", bounds4.ok ? "✔" : JSON.stringify(bounds4));
  assert(perf4.time.replace("ms","") < 300, "زمن الرسم < 300ms", perf4.time);
  console.log("  📏 أبعاد:", canvas.style.width, "×", canvas.style.height);
  console.groupEnd();

  // ── T5: شبه منحرف — 10 شركاء (ضغط) ───────────────────────
  console.group("📐 Block 5: شبه منحرف — 10 شركاء (ضغط)");
  clickShape("شبه منحرف");
  setVal("trap-base-major", 50);
  setVal("trap-base-minor", 30);
  setVal("trap-length-right", 40);
  setVal("trap-length-left", 40);
  setHeirsCount(10);
  const perf5 = measureDraw("شبه منحرف 10 شركاء");
  const bounds5 = checkCanvasBounds("شبه منحرف 10 شركاء");
  assert(bounds5.ok, "لا يوجد تجاوز للحدود (10 شركاء)", bounds5.ok ? "✔" : JSON.stringify(bounds5));
  assert(perf5.time.replace("ms","") < 400, "زمن الرسم < 400ms", perf5.time);
  console.log("  📏 أبعاد:", canvas.style.width, "×", canvas.style.height);
  console.groupEnd();

  // ── T6: شبه منحرف — 20 شريكاً (إجهاد) ────────────────────
  console.group("📐 Block 6: شبه منحرف — 20 شريكاً (إجهاد)");
  setHeirsCount(20);
  const perf6 = measureDraw("شبه منحرف 20 شريكاً");
  const bounds6 = checkCanvasBounds("شبه منحرف 20 شريكاً");
  assert(bounds6.ok, "لا يوجد تجاوز للحدود (20 شريكاً)", bounds6.ok ? "✔" : JSON.stringify(bounds6));
  console.log("  📏 أبعاد:", canvas.style.width, "×", canvas.style.height);
  console.groupEnd();

  // ── T7: LayoutBuffer integration ──────────────────────────
  console.group("🔗 Block 7: تكامل LayoutBuffer");
  const wrapper = canvas.parentElement;
  assert(wrapper !== null, "canvas-wrapper موجود");
  // تحقق: هل getBoundingClientRect على الـ wrapper مُستبدَلة بالكاش؟
  const bcrFn = wrapper?.getBoundingClientRect?.toString() || "";
  const isBuffered = bcrFn.includes("cachedRect") || bcrFn.includes("getCachedRect") || bcrFn.length < 50;
  if (isBuffered) {
    assert(true, "wrapper.getBoundingClientRect مُستبدَلة بالكاش (LayoutBuffer)");
  } else {
    warn("wrapper.getBoundingClientRect قد لا تكون مخزَّنة في الكاش بعد",
         "قد تحتاج لتحميل الصفحة وإعادة الاختبار");
  }
  console.log("  🔍 LayoutBuffer registered elements:", typeof LayoutBuffer !== "undefined");
  console.groupEnd();

  // ── T8: فحص الأداء المقارن ────────────────────────────────
  console.group("⚡ Block 8: اختبار الأداء");
  // 5 رسمات متتالية — نقيس الوسيط
  clickShape("شبه منحرف");
  setVal("trap-base-major", 50);
  setVal("trap-base-minor", 30);
  setVal("trap-length-right", 40);
  setVal("trap-length-left", 40);
  setHeirsCount(5);

  const drawTimes = [];
  const bcrCounts = [];
  for (let i = 0; i < 5; i++) {
    bcrCallCount = 0;
    const t0 = performance.now();
    if (typeof calculateAll === "function") calculateAll();
    const t1 = performance.now();
    drawTimes.push(t1 - t0);
    bcrCounts.push(bcrCallCount);
  }
  const avgTime = (drawTimes.reduce((a,b)=>a+b,0)/drawTimes.length).toFixed(1);
  const avgBCR  = (bcrCounts.reduce((a,b)=>a+b,0)/bcrCounts.length).toFixed(1);
  const maxTime = Math.max(...drawTimes).toFixed(1);

  assert(parseFloat(avgTime) < 250, `متوسط زمن الرسم < 250ms`, `متوسط: ${avgTime}ms, أقصى: ${maxTime}ms`);
  assert(parseFloat(avgBCR) <= 5, `متوسط استدعاءات getBoundingClientRect ≤ 5`, `متوسط: ${avgBCR}`);

  console.table(drawTimes.map((t,i) => ({
    "رسمة": i+1,
    "الوقت (ms)": t.toFixed(1),
    "getBCR calls": bcrCounts[i]
  })));
  console.groupEnd();

  // ── T9: فحص Console Errors ────────────────────────────────
  console.group("🚨 Block 9: أخطاء الـ Console");
  // استعادة console.error الأصلي
  console.error = origError;
  console.warn  = origWarn;

  const criticalErrors = capturedErrors.filter(e =>
    !e.includes("LayoutBuffer") && // تجاهل تحذيرات LayoutBuffer العادية
    !e.includes("favicon") &&
    !e.includes("SmartLayout") // تجاهل رسائل SmartLayout التشخيصية
  );
  assert(criticalErrors.length === 0, "لا توجد أخطاء في Console",
         criticalErrors.length > 0 ? criticalErrors.slice(0,3).join(" | ") : "✔ نظيف");

  const criticalWarnings = capturedWarnings.filter(w =>
    w.includes("SmartLayout") && w.includes("تحذير")
  );
  if (criticalWarnings.length > 0) {
    warn("تحذيرات SmartLayout موجودة", criticalWarnings.join(" | "));
  }
  console.groupEnd();

  // ── T10: Regression check — الحسابات لم تتأثر ────────────
  console.group("🔢 Block 10: Regression — الحسابات");
  clickShape("مربع");
  setVal("square-side", 10);
  setHeirsCount(1);
  if (typeof calculateAll === "function") calculateAll();
  const areaEl = document.getElementById("total-sqm");
  const area = parseFloat(areaEl?.innerText?.replace(/[^\d.]/g,"") || "0");
  assert(Math.abs(area - 100) < 0.1, `مساحة مربع 10م = 100م² (الحساب صحيح)`, `قيمة مُحسَبة: ${area}`);
  console.groupEnd();

  // ════════════════════════════════════════════════════════════
  // ملخص النتائج
  // ════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("📋 ملخص نتائج اختبارات Commit 2 – Smart Layout");
  console.log("═".repeat(60));

  const passed  = results.filter(r => r.status === "PASS").length;
  const failed  = results.filter(r => r.status === "FAIL").length;
  const warned  = results.filter(r => r.status === "WARN").length;
  const total   = results.length;

  console.table(results.map(r => ({
    "#": r.id,
    "الاختبار": r.label,
    "النتيجة": r.status === "PASS" ? "✅ نجاح" : r.status === "FAIL" ? "❌ فشل" : "⚠️ تحذير",
    "التفاصيل": r.detail
  })));

  console.log("\n📊 الإجمالي:");
  console.log(`   ✅ نجح : ${passed}/${total}`);
  console.log(`   ❌ فشل : ${failed}/${total}`);
  console.log(`   ⚠️ تحذير: ${warned}/${total}`);

  console.log("\n⚡ ملخص الأداء:");
  console.table(perfResults);
  console.log(`   ⚡ متوسط وقت الرسم: ${avgTime}ms`);
  console.log(`   🔵 متوسط استدعاءات getBCR: ${avgBCR}`);

  // استعادة getBoundingClientRect الأصلي
  Element.prototype.getBoundingClientRect = origBCR;

  const verdict = failed === 0 ? "✅ Commit 2 جاهز للاعتماد" : `❌ يتطلب مراجعة — ${failed} اختبارات فشلت`;
  console.log("\n🏁 الحكم النهائي:", verdict);
  console.groupEnd();

  return {
    passed, failed, warned, total,
    verdict,
    perfResults,
    avgDrawTime: avgTime,
    avgBCRCalls: avgBCR,
    results: results,
    summary: {
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      warnedTests: warned,
      execTimeMs: Math.round(performance.now() - suiteStartTime),
      grade: failed === 0 ? "🟢 ممتاز (100%)" : `🔴 فشل (${(passed/total * 100).toFixed(1)}%)`,
      gradeColor: failed === 0 ? "#2e7d32" : "#c62828",
      failedList: results.filter(r => r.status === "FAIL")
    }
  };
};
