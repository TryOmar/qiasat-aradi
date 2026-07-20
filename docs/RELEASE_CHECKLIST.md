# Release Validation Checklist - Dallal Land Partition Application (v2.0.0-stable)

This document establishes the mandatory **Release Validation Checklist** for version **v2.0.0-stable**. All checklist items must be verified before proceeding to any new feature developments or major phase transitions.

---

## 1. Automated Unit & Integration Suite Verification
- [x] **AgriUnits Unit Tests**: Verify 29 core math unit tests (`tests/units.test.js`).
- [x] **DallalToast Unit Tests**: Verify toast rendering, auto-dismiss, and stack limits (`tests/toast.test.js`).
- [x] **DallalStorage Unit Tests**: Verify dual-write compatibility and data migration (`tests/storage.test.js`).
- [x] **Page 11 Golden Comparison**: 300 automated test cases matching `AgriUnitsCompat` to core math.
- [x] **Page 12 Golden Comparison**: 300 automated test cases verifying FCS and Sqm conversions.
- [x] **Page 13 Golden Comparison**: 300 automated test cases verifying trapezoid layout & Qasaba/Qabda conversions.

---

## 2. Performance & Benchmark Verification
- [x] **Benchmark Execution**: Run `runPerformanceBenchmark()` in production mode (`DALLAL_DEBUG = false`).
- [x] **Benchmark Stability**: Verify cache clearing (`resetPerformanceState()`) between runs.
- [x] **Average & Median Metrics**: Confirm execution metrics record both Average and Median.
- [x] **JSON Export**: Verify exported baseline file [`tests/benchmark-results.json`](file:///f:/برمجة%20تطبيق%20الدلال/qiasat-aradi-master/tests/benchmark-results.json).

---

## 3. Manual Functional & UI QA Verification
- [ ] **Page 11 Manual Pass**: Test partition layout calculations, partner row editing, and SVG croquis rendering.
- [ ] **Page 12 Manual Pass**: Test land dimension entry, shape calculation, and carat unit conversions.
- [ ] **Page 13/section1 Manual Pass**: Test trapezoid partitioning and share editor interactions.
- [ ] **Print & Export**: Test croquis printing, PDF export, and smart export styling.
- [ ] **Autosave & Recovery**: Test browser refresh data recovery via `DallalStorage`.

---

## 4. Cross-Browser & Environment Verification
- [ ] **Google Chrome**: Full feature test (canvas, memory profiling, storage).
- [ ] **Microsoft Edge**: Full feature test.
- [ ] **Mozilla Firefox**: Verify `performance.memory` fallback (`Not Supported` handling).
- [ ] **Console Cleanliness**: Ensure no unexpected errors or unhandled exceptions occur in Developer Tools.

---

## 5. Release Candidate 2 (`v2.0.0-rc2`) Resolution Items

Target: Resolve 7 specific edge-case and environment tests to achieve **83 / 83 (100%)** test suite pass rate.

### 🔴 Critical Priority
- [ ] **Transaction Snapshot Rollback**: Implement state snapshot (`takeStateSnapshot()` / `restoreStateSnapshot()`) on share deductions so invalid states revert completely without partial mutations.
- [ ] **Event Listener Leak Prevention**: Replace per-element SVG polygon & chip listeners (`mouseenter`, `mouseleave`, `click`) with **Event Delegation** on the parent container.
- [ ] **DOM Input Focus Preservation**: Maintain active element focus and cursor selection (`selectionStart`/`selectionEnd`) during live input updates instead of full row replacements.

### 🟠 Medium Priority
- [ ] **Timer Cleanup**: Audit all `setTimeout`/`setInterval` calls to guarantee explicit `clearTimeout` handles before setting new timers.
- [ ] **Execution Cycle Acceleration**: Target execution cycle `< 200ms` by eliminating event leaks and DOM rebuild overhead.

### 🟡 Low Priority (Mathematical Review)
- [ ] **Linear Gradient Formula Review**: Review trapezoidal area-proportional partitioning equations vs linear stepping assumptions.
- [ ] **Asymmetric Partitioning Verification**: Validate area conservation and polygon Shoelace verification for asymmetric shapes.

---

## 6. Phase 15 Roadmap Overview

### 1. Stress Testing (High Partner Load & Large Areas)
- Test with **200, 500, and 1000 partners** (Stress Boundary limits).
- Large land area stress testing (up to **5,000,000 m²**).
- Rapid keystroke input & continuous SVG pan/zoom stress test.

### 2. Accessibility & UX Enhancements
- Keyboard navigation (Tab index, Enter key flow).
- Mobile responsiveness & touch gestures optimization.

### 3. Flutter Migration Preparedness
- Maintain 100% computational logic inside `core/` and `shared/` pure JavaScript libraries.
- Keep Web UI decoupled to facilitate seamless Dart/Flutter translation.

