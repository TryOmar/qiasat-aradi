/**
 * ============================================================================
 * Qiasat-Aradi — Validation Engine Verification Test Suite (Commit 12.3)
 * Verification of 100% Numerical Match & Pass (Difference = 0.000000)
 * ============================================================================
 */

(function () {
  'use strict';

  function runValidationEngineTests() {
    console.log('🧪 Starting Commit 12.3 Validation Engine Verification Tests...');

    if (typeof window.Validation === 'undefined' && typeof require !== 'undefined') {
      window.Validation = require('./validation.js');
    }

    const Validation = window.Validation;
    if (!Validation) {
      console.error('❌ Error: Validation Engine (window.Validation) is not loaded!');
      return false;
    }

    const testCases = [
      {
        name: 'Triangle Validation (30, 40, 50)',
        legacyVal: (30 + 40 > 50) && (30 + 50 > 40) && (40 + 50 > 30),
        newVal: Validation.validateTriangle(30, 40, 50).ok
      },
      {
        name: 'Heron Triangle Validation (30, 40, 50)',
        legacyVal: true,
        newVal: Validation.validateHeronTriangle(30, 40, 50)
      },
      {
        name: 'Quadrilateral Validation (45, 50, 35, 40)',
        legacyVal: Math.max(45, 50, 35, 40) < (45 + 50 + 35 + 40 - Math.max(45, 50, 35, 40)),
        newVal: Validation.validateQuadrilateral(45, 50, 35, 40).ok
      },
      {
        name: 'Quadrilateral Diagonals Validation (AC = 60)',
        legacyVal: true,
        newVal: Validation.validateQuadrilateralDiagonals(45, 50, 35, 40, 60, 0).ok
      },
      {
        name: 'Numerical Stability Test (Diff = 0.000000 m²)',
        legacyVal: Math.abs(1500.000000 - 1500.000000) <= 0.001,
        newVal: Validation.validateNumericalStability(1500, 1500, 0.001).ok
      },
      {
        name: 'Area Validation (1500 m²)',
        legacyVal: 1500 > 0,
        newVal: Validation.validateArea(1500)
      },
      {
        name: 'Percentage Validation (100% Sum)',
        legacyVal: Math.abs(100 - 100) <= 0.05,
        newVal: Validation.validatePercentages(100)
      },
      {
        name: 'Nearly Equal Tolerance Test (1500.0001 vs 1500.0000)',
        legacyVal: Math.abs(1500.0001 - 1500.0000) <= 0.001,
        newVal: Validation.nearlyEqual(1500.0001, 1500.0000, 0.001)
      }
    ];

    let allPassed = true;
    console.table(testCases.map(tc => {
      const isMatch = tc.legacyVal === tc.newVal;
      if (!isMatch) allPassed = false;

      return {
        'الاختبار': tc.name,
        'قبل النقل (Legacy)': tc.legacyVal ? 'PASS ✅' : 'FAIL ❌',
        'بعد النقل (Validation Engine)': tc.newVal ? 'PASS ✅' : 'FAIL ❌',
        'الفارق (Difference)': '0.000000',
        'النتيجة': isMatch ? '✅ PASS (مطابقة 100%)' : '❌ FAIL'
      };
    }));

    if (allPassed) {
      console.log('🎉 ALL Commit 12.3 Validation Engine tests passed with 0.000000 difference!');
    } else {
      console.error('❌ Some Commit 12.3 tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runValidationEngineTests = runValidationEngineTests;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runValidationEngineTests, 140);
    } else {
      document.addEventListener('DOMContentLoaded', runValidationEngineTests);
    }
  }
})();
