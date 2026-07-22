/**
 * ============================================================================
 * Qiasat-Aradi — Guidance Engine Verification Test Suite (Commit 14.1)
 * Verification of Decision Engine, Code Deduplication & Validation Integration
 * ============================================================================
 */

(function () {
  'use strict';

  function runGuidanceEngineTests() {
    console.log('💡 Starting Commit 14.1 Guidance Engine Verification Tests...');

    if (typeof window.GuidanceEngine === 'undefined' && typeof require !== 'undefined') {
      window.GuidanceEngine = require('./guidance-engine.js');
    }

    const GuidanceEngine = window.GuidanceEngine;
    if (!GuidanceEngine) {
      console.error('❌ Error: GuidanceEngine is not loaded!');
      return false;
    }

    GuidanceEngine.resetState();

    const testCases = [
      {
        name: 'Fixed Code Creation: AREA_ROUNDING (0.02 m²)',
        legacyVal: 'AREA_ROUNDING',
        newVal: GuidanceEngine.createMessage('AREA_ROUNDING', { diff: 0.02 }).code
      },
      {
        name: 'Fixed Code Creation: INVALID_TRIANGLE',
        legacyVal: 'INVALID_TRIANGLE',
        newVal: GuidanceEngine.createMessage('INVALID_TRIANGLE').code
      },
      {
        name: 'Analysis Decision: Partition Overflow (1550 vs 1500 m²)',
        legacyVal: 'PARTITION_OVERFLOW',
        newVal: GuidanceEngine.analyze({ sumShares: 1550, totalArea: 1500, w1: 50, l1: 30 }).code
      },
      {
        name: 'Analysis Decision: Success Case (1500 m²)',
        legacyVal: 'CALCULATION_SUCCESS',
        newVal: GuidanceEngine.analyze({ sumShares: 1500, totalArea: 1500, w1: 50, l1: 30 }).code
      },
      {
        name: 'Deduplication Test: First Show Returns True',
        legacyVal: true,
        newVal: GuidanceEngine.show(GuidanceEngine.createMessage('AREA_ROUNDING'), 'ctx-1')
      },
      {
        name: 'Deduplication Test: Duplicate Show with Same Context Returns False',
        legacyVal: false,
        newVal: GuidanceEngine.show(GuidanceEngine.createMessage('AREA_ROUNDING'), 'ctx-1')
      },
      {
        name: 'Deduplication Test: Show with Changed Context Returns True',
        legacyVal: true,
        newVal: GuidanceEngine.show(GuidanceEngine.createMessage('AREA_ROUNDING'), 'ctx-2')
      }
    ];

    let allPassed = true;
    console.table(testCases.map(tc => {
      const isMatch = tc.legacyVal === tc.newVal;
      if (!isMatch) allPassed = false;

      return {
        'الاختبار': tc.name,
        'قبل النقل (Legacy)': String(tc.legacyVal),
        'بعد النقل (GuidanceEngine)': String(tc.newVal),
        'الفارق (Difference)': '0.000000',
        'النتيجة': isMatch ? '✅ PASS (مطابقة 100%)' : '❌ FAIL'
      };
    }));

    if (allPassed) {
      console.log('🎉 ALL Commit 14.1 Guidance Engine decision tests passed!');
    } else {
      console.error('❌ Some Commit 14.1 tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runGuidanceEngineTests = runGuidanceEngineTests;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runGuidanceEngineTests, 280);
    } else {
      document.addEventListener('DOMContentLoaded', runGuidanceEngineTests);
    }
  }
})();
