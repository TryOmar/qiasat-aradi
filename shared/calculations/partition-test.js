/**
 * ============================================================================
 * Qiasat-Aradi — Partition Engine Golden Dataset & Snapshot Test Suite (Commit 12.4.3)
 * Verification of 100% Numerical Match & Golden Benchmark Pass (Difference = 0.000000)
 * ============================================================================
 */

(function () {
  'use strict';

  function runPartitionEngineGoldenTests() {
    console.log('🧪 Starting Commit 12.4 Partition Engine Golden Dataset & Snapshot Tests...');

    if (typeof window.Partition === 'undefined' && typeof require !== 'undefined') {
      window.Partition = require('./partition.js');
    }

    const Partition = window.Partition;
    if (!Partition) {
      console.error('❌ Error: Partition Engine (window.Partition) is not loaded!');
      return false;
    }

    // 1. Golden Dataset Test Configurations
    const goldenConfigs = [
      { name: 'Rectangle (30m × 50m = 1500 m²), 2 Partners, RTL', totalArea: 1500, topW: 50, botW: 50, leftL: 30, rightL: 30, count: 2, dir: 'rtl' },
      { name: 'Square (40m × 40m = 1600 m²), 3 Partners, RTL', totalArea: 1600, topW: 40, botW: 40, leftL: 40, rightL: 40, count: 3, dir: 'rtl' },
      { name: 'Trapezoid (40m × 60m × 30m × 30m = 1500 m²), 10 Partners, LTR', totalArea: 1500, topW: 60, botW: 40, leftL: 30, rightL: 30, count: 10, dir: 'ltr' },
      { name: 'Large Land (100m × 100m = 10000 m²), 50 Partners, RTL', totalArea: 10000, topW: 100, botW: 100, leftL: 100, rightL: 100, count: 50, dir: 'rtl' },
      { name: 'Huge Benchmark (500m × 500m = 250000 m²), 100 Partners, RTL', totalArea: 250000, topW: 500, botW: 500, leftL: 500, rightL: 500, count: 100, dir: 'rtl' }
    ];

    let allPassed = true;

    const testResults = goldenConfigs.map(cfg => {
      // Legacy Math Calculation
      const legacyShare = cfg.totalArea / cfg.count;
      const legacyTopW = cfg.topW / cfg.count;
      const legacyBotW = cfg.botW / cfg.count;

      // Partition Engine Math Calculation
      const newShare = Partition.calculateEqualShare(cfg.totalArea, cfg.count);
      const pieceW = Partition.calculatePieceWidths(cfg.topW, cfg.botW, newShare, cfg.totalArea);

      const shareDiff = Math.abs(legacyShare - newShare);
      const topWDiff = Math.abs(legacyTopW - pieceW.topW);
      const botWDiff = Math.abs(legacyBotW - pieceW.botW);

      const isMatch = shareDiff < 1e-12 && topWDiff < 1e-12 && botWDiff < 1e-12;
      if (!isMatch) allPassed = false;

      return {
        'اسم الاختبار الذهبي': cfg.name,
        'النصيب Legacy': legacyShare.toFixed(4) + ' م²',
        'النصيب Partition': newShare.toFixed(4) + ' م²',
        'الفارق (Difference)': shareDiff.toFixed(6) + ' m²',
        'النتيجة': isMatch ? '✅ PASS (مطابقة 100%)' : '❌ FAIL'
      };
    });

    console.table(testResults);

    // 2. Snapshot Test (Rebalance & Interpolation)
    const rebalanceInput = [
      { share: 500, isLocked: true },
      { share: 0, isLocked: false },
      { share: 0, isLocked: false }
    ];
    const rebalancedShares = Partition.rebalanceShares(rebalanceInput, 1500);
    const snapshotPassed = rebalancedShares[0] === 500 && rebalancedShares[1] === 500 && rebalancedShares[2] === 500;

    if (!snapshotPassed) allPassed = false;

    console.log('📸 Snapshot Test (Share Rebalancing 1500 m² with 1 Locked 500 m²):', snapshotPassed ? '✅ PASS' : '❌ FAIL');

    if (allPassed) {
      console.log('🎉 ALL Commit 12.4 Golden Dataset & Snapshot tests passed with 0.000000 difference!');
    } else {
      console.error('❌ Some Commit 12.4 tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runPartitionEngineGoldenTests = runPartitionEngineGoldenTests;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runPartitionEngineGoldenTests, 160);
    } else {
      document.addEventListener('DOMContentLoaded', runPartitionEngineGoldenTests);
    }
  }
})();
