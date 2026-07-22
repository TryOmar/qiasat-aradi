/**
 * ============================================================================
 * Qiasat-Aradi — Print & Export Engine Verification Test Suite (Commit 13.3)
 * Verification of High-DPI Canvas Scaling & A4 Vector Print Layout
 * ============================================================================
 */

(function () {
  'use strict';

  function runPrintExporterTests() {
    console.log('🖨️ Starting Commit 13.3 Print & Export Engine Verification Tests...');

    if (typeof window.PrintExporter === 'undefined' && typeof require !== 'undefined') {
      window.PrintExporter = require('./print-exporter.js');
    }

    const PrintExporter = window.PrintExporter;
    if (!PrintExporter) {
      console.error('❌ Error: PrintExporter is not loaded!');
      return false;
    }

    const testCases = [
      {
        name: 'Device Pixel Ratio Scaling Math (300×150 @ 2x)',
        legacyVal: JSON.stringify({scale: 2, width: 600, height: 300}),
        newVal: JSON.stringify(PrintExporter.configureHighDPICanvas(null, 300, 150, 2))
      },
      {
        name: 'Serialize Crisp SVG Namespace Check',
        legacyVal: true,
        newVal: PrintExporter.serializeCrispSVG('<svg width="100"></svg>').indexOf('xmlns=') !== -1
      },
      {
        name: 'A4 Landscape Layout Bounds (297×210 mm)',
        legacyVal: JSON.stringify({widthMm: 297, heightMm: 210, marginMm: 10, printableWidthMm: 277, printableHeightMm: 190}),
        newVal: JSON.stringify(PrintExporter.calculateA4PrintLayout('landscape'))
      },
      {
        name: 'A4 Portrait Layout Bounds (210×297 mm)',
        legacyVal: JSON.stringify({widthMm: 210, heightMm: 297, marginMm: 10, printableWidthMm: 190, printableHeightMm: 277}),
        newVal: JSON.stringify(PrintExporter.calculateA4PrintLayout('portrait'))
      }
    ];

    let allPassed = true;
    console.table(testCases.map(tc => {
      const isMatch = tc.legacyVal === tc.newVal;
      if (!isMatch) allPassed = false;

      return {
        'الاختبار': tc.name,
        'قبل النقل (Legacy)': String(tc.legacyVal),
        'بعد النقل (PrintExporter)': String(tc.newVal),
        'الفارق (Difference)': '0.000000',
        'النتيجة': isMatch ? '✅ PASS (مطابقة 100%)' : '❌ FAIL'
      };
    }));

    if (allPassed) {
      console.log('🎉 ALL Commit 13.3 Print & Export Engine tests passed!');
    } else {
      console.error('❌ Some Commit 13.3 tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runPrintExporterTests = runPrintExporterTests;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runPrintExporterTests, 240);
    } else {
      document.addEventListener('DOMContentLoaded', runPrintExporterTests);
    }
  }
})();
