/**
 * ============================================================================
 * Qiasat-Aradi — Master Release Candidate (v3.0-RC1) Audit Test Suite
 * Executed across all Shared Engines (Calculations, Croquis, UI, Projects, Field)
 * ============================================================================
 */

(function () {
  'use strict';

  function runMasterRCAudit() {
    console.log('🛡️ Starting Full Master Release Candidate (v3.0-RC1) Audit...');

    var results = [];
    var totalPassed = 0;
    var totalSuites = 0;

    function recordSuite(name, fn) {
      totalSuites++;
      var passed = false;
      try {
        passed = !!fn();
      } catch (e) {
        console.error('❌ Error in suite [' + name + ']:', e);
        passed = false;
      }
      if (passed) totalPassed++;
      results.push({
        'حزمة الاختبار المعمارية (Suite)': name,
        'الحالة (Status)': passed ? '✅ PASS' : '❌ FAIL',
        'مستوى الاستقرار': passed ? 'v3.0-RC1 Certified' : 'Unstable'
      });
    }

    if (typeof window.runGeometryTests === 'function') recordSuite('1. Geometry Engine (calculations/geometry)', window.runGeometryTests);
    if (typeof window.runUnitsTests === 'function') recordSuite('2. Units Engine (calculations/units)', window.runUnitsTests);
    if (typeof window.runValidationTests === 'function') recordSuite('3. Validation Engine (calculations/validation)', window.runValidationTests);
    if (typeof window.runPartitionTests === 'function') recordSuite('4. Partition Engine (calculations/partition)', window.runPartitionTests);
    if (typeof window.runCroquisCoreTests === 'function') recordSuite('5. Croquis Core (croquis/croquis-core)', window.runCroquisCoreTests);
    if (typeof window.runVisualRegressionTests === 'function') recordSuite('6. Visual Regression Bridge (croquis/visual-regression)', window.runVisualRegressionTests);
    if (typeof window.runRenderBenchmarkTests === 'function') recordSuite('7. Render Scheduler Benchmark (croquis/render-benchmark)', window.runRenderBenchmarkTests);
    if (typeof window.runPrintExporterTests === 'function') recordSuite('8. Print & Export Engine (croquis/print-exporter)', window.runPrintExporterTests);
    if (typeof window.runInteractionEngineTests === 'function') recordSuite('9. Interaction Engine (croquis/interaction-engine)', window.runInteractionEngineTests);
    if (typeof window.runGuidanceEngineTests === 'function') recordSuite('10. Smart Guidance Engine (ui/guidance-engine)', window.runGuidanceEngineTests);
    if (typeof window.runFocusManagerTests === 'function') recordSuite('11. Focus & Keyboard Manager (ui/focus-manager)', window.runFocusManagerTests);
    if (typeof window.runModalInspectorTests === 'function') recordSuite('12. Modal & Inspector (ui/modal-inspector)', window.runModalInspectorTests);
    if (typeof window.runCommit15Tests === 'function') recordSuite('13. Multi-Project & Field Tools (projects & field)', window.runCommit15Tests);

    console.table(results);

    var isAllRcPassed = totalPassed === totalSuites && totalSuites > 0;
    console.log('====================================================================');
    console.log('📊 Overall v3.0-RC1 Audit Summary: ' + totalPassed + ' / ' + totalSuites + ' Suites Passed (' + (isAllRcPassed ? '100% SUCCESS' : 'ATTENTION REQUIRED') + ')');
    console.log('====================================================================');

    return isAllRcPassed;
  }

  if (typeof window !== 'undefined') {
    window.runMasterRCAudit = runMasterRCAudit;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runMasterRCAudit, 400);
    } else {
      document.addEventListener('DOMContentLoaded', runMasterRCAudit);
    }
  }
})();
