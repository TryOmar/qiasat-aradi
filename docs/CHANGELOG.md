# CHANGELOG.md

**Document Version:** 1.0  
**Status:** Approved ✅  
**Applies From:** Commit 13.0  
**Last Updated:** 2026-07-21  

---

# [2.3.0-RC1] - Release Candidate 🚀

## Completed Commits ✅

### Commit 13.1 — Steps Engine Migration

- **Created:** `shared/engines/steps-engine.js`
- **Migrated:** Page11 & Page13 calculation steps generation.
- **Validation:**
  - Calculation Parity: PASS ✅
  - Print Parity: PASS ✅
  - Fallback Safety: PASS ✅
  - Performance Validation: PASS ✅

### Commit 13.2 — Report Engine Migration

- **Created:** `shared/engines/report-engine.js`
- **Migrated:** 
  - Unified report generation logic.
  - Consolidated report data preparation.
  - Integrated Page11 / Page12 / Page13 report outputs.
- **Validation:**
  - Report Parity: PASS ✅
  - Print Data Compatibility: PASS ✅
  - Fallback Safety: PASS ✅
  - Regression Validation: PASS ✅

### Commit 13.3 — Croquis Engine Migration

- **Created:** `shared/engines/croquis-engine.js`
- **Migrated:** 
  - Unified SVG & Canvas croquis rendering layer.
  - Smart layout viewport margins calculation.
  - Independent remainder & deficit piece rendering.
- **Validation:**
  - SVG & Canvas Parity: PASS ✅
  - Remainder Piece Rendering: PASS ✅
  - Fallback Safety: PASS ✅
  - Zero Console Errors: PASS ✅

### Commit 13.4 — Calculation Engine Migration

- **Created:** `shared/engines/calculation-engine.js`
- **Migrated:** 
  - Land geometry calculations (rectangle, trapezoid, Heron's formula, Shoelace polygon, Bisection partition algorithm).
  - Unit conversions (Sqm to Feddan/Carat/Sahm with custom carat sizes).
  - Unified partners state, remaining area & deficit management.
- **Validation:**
  - Calculation & Geometry Parity: PASS ✅
  - Partition Algorithm Accuracy: PASS ✅
  - Unit Conversion Parity: PASS ✅
  - Fallback Safety: PASS ✅
  - Zero Console Errors: PASS ✅

### Commit 13.5 — Print Engine Migration

- **Created:** `shared/engines/print-engine.js`
- **Migrated:** 
  - Output layer unification (print report, PDF export, image export, smart print margin handling, toast feedbacks).
- **Validation:**
  - Print & Report Parity: PASS ✅
  - Croquis & Image Export Parity: PASS ✅
  - PDF Export & Margin Handling: PASS ✅
  - Fallback Safety: PASS ✅
  - Zero Console Errors: PASS ✅

---

### Fixed 🛠️

- **Page13 Full Reset Behavior**:
  - Improved `clearAllInputs()` in `Page13/section1/script.js` to perform complete project reset on clicking "أحذف".
  - Clears geometry inputs across all shape groups (rectangle, square, trapezoid, quadrilateral).
  - Resets carat price and resets carat area size to default 168 m².
  - Resets partners/heirs state to default 3 zero-share partners.
  - Clears `sessionStorage`, closes inspector tooltip, hides deficit/remainder overlays, and recalculates zero state.

---

### Added (System Architecture) ➕

- إنشاء البنية المعمارية الجديدة:
  - `shared/core/`
  - `shared/utils/`
  - `shared/engines/`
  - `shared/adapters/`

- إضافة طبقة مشتركة جديدة لتوحيد الخدمات والمحركات داخل المشروع.

---

### Changed 🔄

- بدء نقل المحركات تدريجياً إلى Shared Engines.
- اعتماد مبدأ **Single Source of Truth** كمصدر موحد للبيانات والحسابات.
- تحسين البنية المعمارية للمشروع وتقليل التكرار بين الصفحات.

---

### Performance ⚡

- إضافة نظام **Debounce** لتحسين معالجة الإدخالات المتكررة.
- إضافة نظام **Throttle** للتحكم في الأحداث السريعة.
- استخدام `requestAnimationFrame` لتحسين أداء الرسم والتحديثات البصرية.
- إضافة Cache Engine لتقليل العمليات الحسابية المتكررة.

---

### Documentation 📚

تم إنشاء وثائق المعمارية وإدارة التطوير:

- `ADR.md`
- `CODING_STANDARDS.md`
- `ROADMAP_COMMIT13.md`
- `RELEASE_PROCESS.md`
- `DOD.md`
- `CHANGELOG.md`

---

## Migration Plan 🚀

خطة نقل المكونات إلى المعمارية الجديدة:

| Commit | Component | Status |
|---|---|---|
| Commit 13.1 | Steps Engine (`steps-engine.js`) | Completed ✅ |
| Commit 13.2 | Report Engine (`report-engine.js`) | Completed ✅ |
| Commit 13.3 | Croquis Engine (`croquis-engine.js`) | Completed ✅ |
| Commit 13.4 | Calculation Engine (`calculation-engine.js`) | Completed ✅ |
| Commit 13.5 | Print Engine (`print-engine.js`) | Completed ✅ |

---

# [2.2.2] - Stable ✅

## الإصدار المرجعي الحالي (Commit 12.0)

### Fixed 🛠️

- إصلاح تحرير الشركاء وتحقيق Parity كاملة مع واجهة العرض.
- إصلاح عرض خطوات الحساب بالتفصيل.
- إصلاح نظام الأكورديون.
- إصلاح زر نسخ خطوات الحساب.
- إصلاح نظام الطباعة والتقرير الموحد.
- إصلاح الكروكي ورسم قطعة المتبقي.
- إصلاح بطاقة المتبقي والعجز.

---

### Improved ✨

- توحيد واجهة Page13 مع معيار Page11 بالكامل.
- تحسين استقرار الحسابات ومنع تقطيع الواجهات.
- تحسين تجربة المستخدم (UX).
- تحسين ثبات التركيز أثناء الإدخال والتعديل.

---

## Release Status 🏆

**Certified Stable Release ✅**

---

# Version Mapping

| Version | Commit | Status |
|---|---|---|
| 2.2.2 | Commit 12.0 | Stable ✅ |
| 2.3.0 | Commit 13.x | Development ⏳ |
| 2.4.0 | Future | Planned 📋 |
