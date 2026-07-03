/**
 * script.js - حساب مساحة الأراضي بالقصبة والقبضة
 * Page13 / section2
 */

// ثوابت التحويل
const QASBA_IN_METERS = 3.55;       // 1 قصبة = 3.55 متر
const QABDA_IN_METERS = 3.55 / 6;  // 1 قبضة = 3.55 ÷ 6 متر ≈ 0.5917 م
const CM_IN_METERS = 0.01;          // 1 سم = 0.01 م
const QASBA_SQ = QASBA_IN_METERS * QASBA_IN_METERS; // 1 قصبة² = 12.6025 م²

let currentShape = "rect"; // rect | trap | quad

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", function () {
  loadFromStorage();
  calculate();
});

// ==========================================
// تحديد شكل الأرض
// ==========================================
function setShape(shape) {
  currentShape = shape;
  
  // تحديث الأزرار
  ["rect", "trap", "quad"].forEach(s => {
    const btn = document.getElementById("btn-" + s);
    if (btn) btn.classList.toggle("active", s === shape);
  });
  
  // عرض/إخفاء حقل الطول الثاني
  const block_l2 = document.getElementById("block-l2");
  const dim_l2_box = document.getElementById("dim-l2-box");
  const dim_w2_box = document.getElementById("dim-w2-box");
  const block_w2 = document.getElementById("block-w2");
  const lbl_l1 = document.getElementById("lbl-l1");
  const lbl_res_l1 = document.getElementById("lbl-res-l1");
  
  if (shape === "rect") {
    // مستطيل: عرض واحد، طول واحد (العرض2 = العرض1)
    block_l2.style.display = "none";
    if (dim_l2_box) dim_l2_box.style.display = "none";
    if (block_w2) block_w2.style.display = "none";
    if (dim_w2_box) dim_w2_box.style.display = "none";
    if (lbl_l1) lbl_l1.innerText = "الطول";
    if (lbl_res_l1) lbl_res_l1.innerText = "الطول";
    document.getElementById("lbl-w1").innerText = "العرض";
  } else if (shape === "trap") {
    // شبه منحرف: عرضان وطول واحد
    block_l2.style.display = "none";
    if (dim_l2_box) dim_l2_box.style.display = "none";
    if (block_w2) block_w2.style.display = "";
    if (dim_w2_box) dim_w2_box.style.display = "";
    if (lbl_l1) lbl_l1.innerText = "الطول";
    if (lbl_res_l1) lbl_res_l1.innerText = "الطول";
    document.getElementById("lbl-w1").innerText = "العرض الأول";
  } else if (shape === "quad") {
    // رباعي: عرضان وطولان
    block_l2.style.display = "";
    if (dim_l2_box) dim_l2_box.style.display = "";
    if (block_w2) block_w2.style.display = "";
    if (dim_w2_box) dim_w2_box.style.display = "";
    if (lbl_l1) lbl_l1.innerText = "الطول الأيمن";
    if (lbl_res_l1) lbl_res_l1.innerText = "الطول الأيمن";
    document.getElementById("lbl-w1").innerText = "العرض الأول";
  }
  
  calculate();
}

// ==========================================
// تبديل وحدة الإدخال
// ==========================================
function updateInputUnit() {
  const unit = document.getElementById("input-unit").value;
  const isQasba = (unit === "qasba");
  
  ["w1", "w2", "l1", "l2"].forEach(id => {
    const qRow = document.getElementById("qasba-" + id);
    const mRow = document.getElementById("meter-" + id);
    if (qRow) qRow.style.display = isQasba ? "" : "none";
    if (mRow) mRow.style.display = isQasba ? "none" : "";
  });
}

// مراقبة تغيير وحدة الإدخال
document.getElementById("input-unit").addEventListener("change", function() {
  updateInputUnit();
  calculate();
});

// ==========================================
// تحويل القيم إلى متر
// ==========================================
function qasbaToMeter(qasba, qabda, cm) {
  qasba = parseFloat(qasba) || 0;
  qabda = parseFloat(qabda) || 0;
  cm = parseFloat(cm) || 0;
  return (qasba * QASBA_IN_METERS) + (qabda * QABDA_IN_METERS) + (cm * CM_IN_METERS);
}

function meterToQasba(meters) {
  if (meters <= 0) return { qasba: 0, qabda: 0, cm: 0 };
  const totalQasba = meters / QASBA_IN_METERS;
  const qasba = Math.floor(totalQasba);
  const remainingM = meters - (qasba * QASBA_IN_METERS);
  const qabda = Math.floor(remainingM / QABDA_IN_METERS);
  const remainingAfterQabda = remainingM - (qabda * QABDA_IN_METERS);
  const cm = Math.round(remainingAfterQabda / CM_IN_METERS);
  return { qasba, qabda, cm };
}

function formatQasba(qasba, qabda, cm) {
  let parts = [];
  if (qasba > 0) parts.push(qasba + " ق");
  if (qabda > 0) parts.push(qabda + " قب");
  if (cm > 0) parts.push(cm + " سم");
  return parts.length > 0 ? parts.join(" ") : "0 ق";
}

// ==========================================
// قراءة قيمة بُعد معين بالمتر
// ==========================================
function getDimInMeters(prefix) {
  const unit = document.getElementById("input-unit").value;
  if (unit === "qasba") {
    const q = document.getElementById(prefix + "-qasba") ? document.getElementById(prefix + "-qasba").value : 0;
    const qb = document.getElementById(prefix + "-qabda") ? document.getElementById(prefix + "-qabda").value : 0;
    const cm = document.getElementById(prefix + "-cm") ? document.getElementById(prefix + "-cm").value : 0;
    return qasbaToMeter(q, qb, cm);
  } else {
    const m = document.getElementById(prefix + "-meter");
    return m ? (parseFloat(m.value) || 0) : 0;
  }
}

// ==========================================
// حساب المساحة الرئيسي
// ==========================================
function calculate() {
  const unit = document.getElementById("input-unit").value;
  
  // قراءة الأبعاد
  const w1_m = getDimInMeters("w1");
  const w2_m = (currentShape !== "rect") ? getDimInMeters("w2") : w1_m;
  const l1_m = getDimInMeters("l1");
  const l2_m = (currentShape === "quad") ? getDimInMeters("l2") : l1_m;
  
  // تحديث عرض التحويل
  updateEquivDisplay("w1", w1_m);
  if (currentShape !== "rect") updateEquivDisplay("w2", w2_m);
  updateEquivDisplay("l1", l1_m);
  if (currentShape === "quad") updateEquivDisplay("l2", l2_m);
  
  // حساب المساحة بالمتر المربع
  let areaM2 = 0;
  let formulaText = "";
  
  if (currentShape === "rect") {
    areaM2 = w1_m * l1_m;
    const w1q = meterToQasba(w1_m);
    const l1q = meterToQasba(l1_m);
    formulaText = `مستطيل: المساحة = العرض × الطول = ${w1_m.toFixed(2)} × ${l1_m.toFixed(2)} = ${areaM2.toFixed(4)} م²`;
  } else if (currentShape === "trap") {
    // شبه منحرف: مساحة = (المجموع / 2) × الطول
    const avgW = (w1_m + w2_m) / 2;
    areaM2 = avgW * l1_m;
    formulaText = `شبه منحرف: المساحة = ((${w1_m.toFixed(2)} + ${w2_m.toFixed(2)}) ÷ 2) × ${l1_m.toFixed(2)} = ${avgW.toFixed(2)} × ${l1_m.toFixed(2)} = ${areaM2.toFixed(4)} م²`;
  } else if (currentShape === "quad") {
    // رباعي مختلف الأطوال: مساحة = ((الطول1 + الطول2) / 2) × ((العرض1 + العرض2) / 2)
    const avgL = (l1_m + l2_m) / 2;
    const avgW = (w1_m + w2_m) / 2;
    areaM2 = avgL * avgW;
    formulaText = `رباعي مختلف الأطوال: المساحة = ((${l1_m.toFixed(2)} + ${l2_m.toFixed(2)}) ÷ 2) × ((${w1_m.toFixed(2)} + ${w2_m.toFixed(2)}) ÷ 2) = ${avgL.toFixed(2)} × ${avgW.toFixed(2)} = ${areaM2.toFixed(4)} م²`;
  }
  
  // مساحة القيراط
  let caratArea = parseFloat(document.getElementById("carat-area-select").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 175.035;
  }
  
  // تحويل إلى قيراط/سهم/فدان
  const totalCarats = caratArea > 0 ? areaM2 / caratArea : 0;
  const acres = Math.floor(totalCarats / 24);
  const carats = Math.floor(totalCarats % 24);
  const shares = ((totalCarats - (acres * 24 + carats)) * 24);
  
  // تحويل إلى قصبة مربعة
  const qasba_sq = areaM2 / QASBA_SQ;
  
  // تحديث عرض النتائج
  updateResultDisplay(w1_m, w2_m, l1_m, l2_m, areaM2, acres, carats, shares, qasba_sq, formulaText);
  
  // حفظ البيانات
  saveToStorage();
}

// ==========================================
// تحديث عرض التحويل
// ==========================================
function updateEquivDisplay(prefix, meters) {
  const el = document.getElementById("equiv-" + prefix);
  if (!el) return;
  const qv = meterToQasba(meters);
  el.innerText = `= ${meters.toFixed(4)} م (${formatQasba(qv.qasba, qv.qabda, qv.cm)})`;
}

// ==========================================
// تحديث عرض النتائج
// ==========================================
function updateResultDisplay(w1_m, w2_m, l1_m, l2_m, areaM2, acres, carats, shares, qasba_sq, formulaText) {
  // الأبعاد
  const setDimResult = (id_m, id_q, meters) => {
    const el_m = document.getElementById(id_m);
    const el_q = document.getElementById(id_q);
    if (el_m) el_m.innerText = meters.toFixed(4) + " م";
    if (el_q) {
      const qv = meterToQasba(meters);
      el_q.innerText = formatQasba(qv.qasba, qv.qabda, qv.cm);
    }
  };
  
  setDimResult("res-w1-m", "res-w1-q", w1_m);
  setDimResult("res-w2-m", "res-w2-q", w2_m);
  setDimResult("res-l1-m", "res-l1-q", l1_m);
  setDimResult("res-l2-m", "res-l2-q", l2_m);
  
  // المساحة الإجمالية
  const areaEl = document.getElementById("res-area-m2");
  if (areaEl) areaEl.innerText = areaM2.toFixed(4);
  
  // الوحدات
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setVal("res-acres", acres);
  setVal("res-carats", carats);
  setVal("res-shares", shares.toFixed(2));
  setVal("res-qasba-sq", qasba_sq.toFixed(2));
  
  // الصيغة
  const formulaEl = document.getElementById("formula-text");
  if (formulaEl) formulaEl.innerText = areaM2 > 0 ? formulaText : "أدخل الأبعاد لعرض طريقة الحساب";
}

// ==========================================
// تغيير مساحة القيراط
// ==========================================
function handleCaratChange() {
  const sel = document.getElementById("carat-area-select");
  const other = document.getElementById("other-carat-area");
  if (sel.value === "0") {
    other.style.display = "inline-block";
  } else {
    other.style.display = "none";
  }
  calculate();
}

// ==========================================
// محول سريع: قصبة/قبضة ↔ متر
// ==========================================
function convertToMeter() {
  const q = parseFloat(document.getElementById("conv-q-qasba").value) || 0;
  const qb = parseFloat(document.getElementById("conv-q-qabda").value) || 0;
  const cm = parseFloat(document.getElementById("conv-q-cm").value) || 0;
  const meters = qasbaToMeter(q, qb, cm);
  const el = document.getElementById("conv-result-meter");
  if (el) el.innerText = meters.toFixed(4);
}

function convertToQasba() {
  const meters = parseFloat(document.getElementById("conv-m-meter").value) || 0;
  const qv = meterToQasba(meters);
  const el = document.getElementById("conv-result-qasba");
  if (el) {
    el.innerText = `${qv.qasba} قصبة, ${qv.qabda} قبضة, ${qv.cm} سم`;
  }
}

// ==========================================
// حفظ واسترجاع البيانات
// ==========================================
function saveToStorage() {
  try {
    const unit = document.getElementById("input-unit").value;
    const data = {
      shape: currentShape,
      unit: unit,
      caratArea: document.getElementById("carat-area-select").value,
      otherCarat: document.getElementById("other-carat-area").value,
      w1: { qasba: val("w1-qasba"), qabda: val("w1-qabda"), cm: val("w1-cm"), meter: val("w1-meter") },
      w2: { qasba: val("w2-qasba"), qabda: val("w2-qabda"), cm: val("w2-cm"), meter: val("w2-meter") },
      l1: { qasba: val("l1-qasba"), qabda: val("l1-qabda"), cm: val("l1-cm"), meter: val("l1-meter") },
      l2: { qasba: val("l2-qasba"), qabda: val("l2-qabda"), cm: val("l2-cm"), meter: val("l2-meter") }
    };
    localStorage.setItem("p13-s2-data", JSON.stringify(data));
  } catch(e) {}
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setVal2(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v || "";
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem("p13-s2-data");
    if (!saved) return;
    const data = JSON.parse(saved);
    
    if (data.shape) setShape(data.shape);
    if (data.unit) {
      document.getElementById("input-unit").value = data.unit;
      updateInputUnit();
    }
    if (data.caratArea) document.getElementById("carat-area-select").value = data.caratArea;
    if (data.otherCarat) document.getElementById("other-carat-area").value = data.otherCarat;
    
    if (data.w1) { setVal2("w1-qasba", data.w1.qasba); setVal2("w1-qabda", data.w1.qabda); setVal2("w1-cm", data.w1.cm); setVal2("w1-meter", data.w1.meter); }
    if (data.w2) { setVal2("w2-qasba", data.w2.qasba); setVal2("w2-qabda", data.w2.qabda); setVal2("w2-cm", data.w2.cm); setVal2("w2-meter", data.w2.meter); }
    if (data.l1) { setVal2("l1-qasba", data.l1.qasba); setVal2("l1-qabda", data.l1.qabda); setVal2("l1-cm", data.l1.cm); setVal2("l1-meter", data.l1.meter); }
    if (data.l2) { setVal2("l2-qasba", data.l2.qasba); setVal2("l2-qabda", data.l2.qabda); setVal2("l2-cm", data.l2.cm); setVal2("l2-meter", data.l2.meter); }
    
    handleCaratChange();
  } catch(e) {}
}
