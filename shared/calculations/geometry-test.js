/**
 * ============================================================================
 * Qiasat-Aradi — Geometry Engine Verification Test Suite (Commit 12.1)
 * Verification of 100% Numerical Match (Difference = 0.000000 m²)
 * ============================================================================
 */

(function () {
  'use strict';

  function runGeometryEngineTests() {
    console.log('🧪 Starting Commit 12.1 Geometry Engine Verification Tests...');

    if (typeof window.Geometry === 'undefined' && typeof require !== 'undefined') {
      window.Geometry = require('./geometry.js');
    }

    const Geometry = window.Geometry;
    if (!Geometry) {
      console.error('❌ Error: Geometry Engine (window.Geometry) is not loaded!');
      return false;
    }

    const testCases = [
      {
        name: 'Rectangle Area',
        legacyVal: 30 * 50,
        newVal: Geometry.calculateRectangleArea(30, 50)
      },
      {
        name: 'Square Area',
        legacyVal: 40 * 40,
        newVal: Geometry.calculateSquareArea(40)
      },
      {
        name: 'Trapezoid Area',
        legacyVal: ((40 + 60) / 2) * ((30 + 30) / 2),
        newVal: Geometry.calculateTrapezoidArea(40, 60, 30, 30)
      },
      {
        name: 'Heron Area (Triangle 30, 40, 50)',
        legacyVal: (function() {
          const a = 30, b = 40, c = 50;
          const s = (a + b + c) / 2;
          return Math.sqrt(s * (s - a) * (s - b) * (s - c));
        })(),
        newVal: Geometry.calculateHeronArea(30, 40, 50)
      },
      {
        name: 'Shoelace Area (Quadrilateral)',
        legacyVal: (function() {
          const pts = [{x:0, y:0}, {x:50, y:0}, {x:50, y:30}, {x:0, y:30}];
          let area = 0, j = pts.length - 1;
          for (let i = 0; i < pts.length; i++) {
            area += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
            j = i;
          }
          return Math.abs(area / 2);
        })(),
        newVal: Geometry.calculateShoelaceArea([{x:0, y:0}, {x:50, y:0}, {x:50, y:30}, {x:0, y:30}])
      },
      {
        name: 'Average Width',
        legacyVal: (45.5 + 55.5) / 2,
        newVal: Geometry.calculateAverageWidth(45.5, 55.5)
      },
      {
        name: 'Average Length',
        legacyVal: (32.25 + 28.75) / 2,
        newVal: Geometry.calculateAverageLength(32.25, 28.75)
      }
    ];

    let allPassed = true;
    console.table(testCases.map(tc => {
      const diff = Math.abs(tc.legacyVal - tc.newVal);
      const passed = diff < 1e-12;
      if (!passed) allPassed = false;
      return {
        'الاختبار': tc.name,
        'قبل النقل (Legacy)': tc.legacyVal.toFixed(6),
        'بعد النقل (Geometry Engine)': tc.newVal.toFixed(6),
        'الفارق (Difference)': diff.toFixed(6) + ' m²',
        'النتيجة': passed ? '✅ مطابقة 100%' : '❌ خطأ'
      };
    }));

    if (allPassed) {
      console.log('🎉 ALL Commit 12.1 Geometry Engine tests passed with 0.000000 m² difference!');
    } else {
      console.error('❌ Some Commit 12.1 tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runGeometryEngineTests = runGeometryEngineTests;
    // Auto-run if loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runGeometryEngineTests, 100);
    } else {
      document.addEventListener('DOMContentLoaded', runGeometryEngineTests);
    }
  }
})();
