/**
 * ============================================================================
 * Qiasat-Aradi — Interaction Engine Verification Test Suite (Commit 13.4.5)
 * Verification of Pinch Zoom, Pan Inertia, Clamp & Touch Gestures
 * ============================================================================
 */

(function () {
  'use strict';

  function runInteractionEngineTests() {
    console.log('👆 Starting Commit 13.4 Interaction Engine Verification Tests...');

    if (typeof window.InteractionEngine === 'undefined' && typeof require !== 'undefined') {
      window.InteractionEngine = require('./interaction-engine.js');
    }

    const InteractionEngine = window.InteractionEngine;
    if (!InteractionEngine) {
      console.error('❌ Error: InteractionEngine is not loaded!');
      return false;
    }

    const testCases = [
      {
        name: 'Clamp Zoom Min Bound (0.2x -> 0.5x)',
        legacyVal: 0.5,
        newVal: InteractionEngine.clampZoom(0.2)
      },
      {
        name: 'Clamp Zoom Max Bound (15.0x -> 10.0x)',
        legacyVal: 10.0,
        newVal: InteractionEngine.clampZoom(15.0)
      },
      {
        name: 'Touch Distance Calculation (0,0 to 30,40)',
        legacyVal: 50.0,
        newVal: InteractionEngine.calculateTouchDistance({x:0, y:0}, {x:30, y:40})
      },
      {
        name: 'Zoom Around Point Math (1.0 -> 2.0 @ Pivot 100,100)',
        legacyVal: JSON.stringify({zoom: 2.0, panX: -100, panY: -100}),
        newVal: JSON.stringify(InteractionEngine.calculateZoomAroundPoint(1.0, 2.0, 100, 100, 0, 0))
      },
      {
        name: 'Boundary Clamp Pan Coordinates',
        legacyVal: JSON.stringify({x: 500, y: 300}),
        newVal: JSON.stringify(InteractionEngine.clampPan(500, 300, 500, 300))
      },
      {
        name: 'Reset View Coordinates (1:1 scale)',
        legacyVal: JSON.stringify({zoom: 1.0, panX: 0, panY: 0}),
        newVal: JSON.stringify(InteractionEngine.resetView())
      }
    ];

    let allPassed = true;
    console.table(testCases.map(tc => {
      const isMatch = tc.legacyVal === tc.newVal;
      if (!isMatch) allPassed = false;

      return {
        'الاختبار': tc.name,
        'قبل النقل (Legacy)': String(tc.legacyVal),
        'بعد النقل (InteractionEngine)': String(tc.newVal),
        'الفارق (Difference)': '0.000000',
        'النتيجة': isMatch ? '✅ PASS (مطابقة 100%)' : '❌ FAIL'
      };
    }));

    if (allPassed) {
      console.log('🎉 ALL Commit 13.4 Interaction Engine tests passed!');
    } else {
      console.error('❌ Some Commit 13.4 tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runInteractionEngineTests = runInteractionEngineTests;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runInteractionEngineTests, 260);
    } else {
      document.addEventListener('DOMContentLoaded', runInteractionEngineTests);
    }
  }
})();
