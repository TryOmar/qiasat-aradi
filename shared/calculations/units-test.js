/**
 * ============================================================================
 * Qiasat-Aradi — Unit Conversion Engine Verification Test Suite (Commit 12.2)
 * Verification of 100% Numerical Match (Difference = 0.000000)
 * ============================================================================
 */

(function () {
  'use strict';

  function runUnitsEngineTests() {
    console.log('🧪 Starting Commit 12.2 Unit Conversion Engine Verification Tests...');

    if (typeof window.Units === 'undefined' && typeof require !== 'undefined') {
      window.Units = require('./units.js');
    }

    const Units = window.Units;
    if (!Units) {
      console.error('❌ Error: Unit Conversion Engine (window.Units) is not loaded!');
      return false;
    }

    const caratSize = 175.035;

    const testCases = [
      {
        name: 'Sqm to Feddans/Carats/Shares (5251.05 m²)',
        legacyVal: (function() {
          const totalCarats = 5251.05 / caratSize;
          const f = Math.floor(totalCarats / 24);
          const c = Math.floor(totalCarats - (f * 24));
          const s = (totalCarats - (f * 24) - c) * 24;
          return `${f}ف ${c}ق ${s.toFixed(2)}س`;
        })(),
        newVal: (function() {
          const res = Units.convertSqmToFeddans(5251.05, caratSize);
          return `${res.feddans}ف ${res.carats}ق ${res.shares.toFixed(2)}س`;
        })()
      },
      {
        name: 'Feddans/Carats/Shares to Sqm (1ف 6ق 0س @ 175.035)',
        legacyVal: (1 * 24 + 6 + 0/24) * caratSize,
        newVal: Units.convertFeddansToSqm(1, 6, 0, caratSize)
      },
      {
        name: 'Parse Fraction "1/4"',
        legacyVal: 0.25,
        newVal: Units.parseFraction("1/4")
      },
      {
        name: 'Calculate Percentage (437.5875 m² of 1750.35 m²)',
        legacyVal: (437.5875 / 1750.35) * 100,
        newVal: Units.calculatePercentages(437.5875, 1750.35)
      },
      {
        name: 'Qasaba to Meters (10 قصبات)',
        legacyVal: 10 * 3.55,
        newVal: Units.convertQasabaToMeters(10)
      },
      {
        name: 'Meters to Qasaba (35.5 متر)',
        legacyVal: 35.5 / 3.55,
        newVal: Units.convertMetersToQasabas(35.5)
      },
      {
        name: 'Qabda to Meters (24 قبضة = 1 قصبة = 3.55م)',
        legacyVal: 3.55,
        newVal: Units.convertQabdaToMeters(24)
      }
    ];

    let allPassed = true;
    console.table(testCases.map(tc => {
      let isMatch = false;
      let diffStr = '0.000000';

      if (typeof tc.legacyVal === 'number' && typeof tc.newVal === 'number') {
        const diff = Math.abs(tc.legacyVal - tc.newVal);
        isMatch = diff < 1e-12;
        diffStr = diff.toFixed(6);
      } else {
        isMatch = String(tc.legacyVal).trim() === String(tc.newVal).trim();
        diffStr = isMatch ? '0.000000 (النص مطايق)' : 'تفاوت في النص';
      }

      if (!isMatch) allPassed = false;

      return {
        'الاختبار': tc.name,
        'قبل النقل (Legacy)': String(tc.legacyVal),
        'بعد النقل (Units Engine)': String(tc.newVal),
        'الفارق (Difference)': diffStr,
        'النتيجة': isMatch ? '✅ مطابقة 100%' : '❌ خطأ'
      };
    }));

    if (allPassed) {
      console.log('🎉 ALL Commit 12.2 Unit Conversion Engine tests passed with 0.000000 difference!');
    } else {
      console.error('❌ Some Commit 12.2 tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runUnitsEngineTests = runUnitsEngineTests;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runUnitsEngineTests, 120);
    } else {
      document.addEventListener('DOMContentLoaded', runUnitsEngineTests);
    }
  }
})();
