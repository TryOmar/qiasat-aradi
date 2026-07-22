/**
 * ============================================================================
 * Qiasat-Aradi — Render Performance Benchmark & Certification (Commit 13.2.5)
 * Verification of Rendering Speed Targets (10, 50, 100 Partners) & 60 FPS
 * ============================================================================
 */

(function () {
  'use strict';

  function runRenderBenchmarkTests() {
    console.log('⚡ Starting Commit 13.2.5 Render Performance Benchmark Tests...');

    if (typeof window.CroquisCore === 'undefined' && typeof require !== 'undefined') {
      window.CroquisCore = require('./croquis-core.js');
    }
    if (typeof window.RenderScheduler === 'undefined' && typeof require !== 'undefined') {
      window.RenderScheduler = require('./render-scheduler.js');
    }

    const CroquisCore = window.CroquisCore;
    const RenderScheduler = window.RenderScheduler;

    if (!CroquisCore || !RenderScheduler) {
      console.error('❌ Error: Croquis Core or Render Scheduler is not loaded!');
      return false;
    }

    const benchmarkConfigs = [
      { name: '10 Partners Rendering Speed', count: 10, targetMs: 10 },
      { name: '50 Partners Rendering Speed', count: 50, targetMs: 30 },
      { name: '100 Partners Benchmark Rendering Speed', count: 100, targetMs: 50 }
    ];

    let allPassed = true;

    const results = benchmarkConfigs.map(cfg => {
      const topW = 500, botW = 500, leftL = 500, rightL = 500;
      const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      // Benchmark simulation of generating polygon vertices and centroids for N partners
      for (let i = 0; i < cfg.count; i++) {
        const cumTop = (1 / cfg.count) * i;
        const cumBot = (1 / cfg.count) * i;
        const pts = CroquisCore.calculatePiecePolygon(topW, botW, leftL, rightL, cumTop, cumBot);
        CroquisCore.calculateTextCentroid(pts);
        CroquisCore.calculatePolygonBounds(pts);
      }

      const end = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const durationMs = end - start;
      const passed = durationMs <= cfg.targetMs;

      if (!passed) allPassed = false;

      return {
        'اختبار الأداء (Benchmark)': cfg.name,
        'عدد الشركاء': cfg.count,
        'الوقت المستغرق (Duration)': durationMs.toFixed(2) + ' ms',
        'الهدف المقبول (Target)': '< ' + cfg.targetMs + ' ms',
        'مستوى الأداء': passed ? '⚡ 60 FPS (سريع جداً)' : '⚠️ بطيء',
        'النتيجة': passed ? '✅ PASS' : '❌ FAIL'
      };
    });

    console.table(results);

    // Test Scheduler Call Throttling & Deduplication
    RenderScheduler.resetSignature();
    let renderCallCount = 0;
    const dummyRender = () => { renderCallCount++; };

    // Simulate 4 rapid input events with same signature
    RenderScheduler.requestRender(dummyRender, 'sig-1');
    RenderScheduler.requestRender(dummyRender, 'sig-1');
    RenderScheduler.requestRender(dummyRender, 'sig-1');
    RenderScheduler.requestRender(dummyRender, 'sig-1');

    const metrics = RenderScheduler.getMetrics();
    const throttlingPassed = metrics.totalCallsBlocked >= 3;

    console.log(`🛡️ RenderScheduler Redundant Calls Blocked: ${metrics.totalCallsBlocked} calls blocked (${throttlingPassed ? '✅ PASS' : '❌ FAIL'})`);

    if (!throttlingPassed) allPassed = false;

    if (allPassed) {
      console.log('🎉 ALL Commit 13.2.5 Render Performance Benchmark tests passed!');
    } else {
      console.error('❌ Some Commit 13.2.5 performance tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runRenderBenchmarkTests = runRenderBenchmarkTests;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runRenderBenchmarkTests, 220);
    } else {
      document.addEventListener('DOMContentLoaded', runRenderBenchmarkTests);
    }
  }
})();
