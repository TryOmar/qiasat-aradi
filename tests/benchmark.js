/**
 * tests/benchmark.js
 * ==================
 * Performance Benchmarking Suite for Dallal Land Partitioning
 * Measures calculation times, SVG render times, DOM Updates, Memory, and Typing Simulation.
 */

(function (global) {
  "use strict";

  // Calculates the median of an array of numbers
  function calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    }
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // Measures both Average and Median execution times, with optional memory tracking
  function measureMetrics(fn, runs = 10, warmups = 2, trackPeakMemoryFn = null) {
    // Warm-up runs (unmeasured)
    for (let w = 0; w < warmups; w++) {
      fn();
      if (trackPeakMemoryFn) trackPeakMemoryFn();
    }
    // Measurement runs
    const times = [];
    for (let r = 0; r < runs; r++) {
      const tStart = performance.now();
      fn();
      const tEnd = performance.now();
      times.push(tEnd - tStart);
      if (trackPeakMemoryFn) trackPeakMemoryFn();
    }
    // Sort to calculate average (excluding fastest & slowest) and median
    const sortedTimes = [...times].sort((a, b) => a - b);
    const middle = sortedTimes.slice(1, -1);
    const sum = middle.reduce((a, b) => a + b, 0);
    const average = sum / middle.length;

    const median = calculateMedian(times);

    return { average, median };
  }

  global.runPerformanceBenchmark = function(onProgress, onComplete) {
    function normalizeCalculatedPieces(pieces) {
      if (!pieces || !Array.isArray(pieces)) return "";
      const round = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : parseFloat(num.toFixed(6));
      };
      return JSON.stringify(pieces.map((p, idx) => ({
        index: idx,
        name: p.name || "",
        area: round(p.calculatedGeoArea),
        wBot: round(p.botWidth),
        wTop: round(p.topWidth),
        lRight: round(p.rightLength),
        lLeft: round(p.leftLength)
      })));
    }

    // Setup PerformanceObserver for Long Tasks
    let longTaskCount = 0;
    let longTaskTotalDuration = 0;
    let observer;
    
    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            longTaskCount++;
            longTaskTotalDuration += entry.duration;
          });
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch (e) {
        console.warn("[Benchmark] PerformanceObserver not supported for longtasks:", e.message);
      }
    }

    // Create hidden iframe loading Page 11 index
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = "../../Page11/index.html";
    document.body.appendChild(iframe);

    iframe.onload = async function() {
      const win = iframe.contentWindow;
      const doc = win.document;

      // RULE 1: Run benchmarks in production mode to avoid debug log / assertion overhead
      win.DALLAL_DEBUG = false;

      // Helper to retrieve memory usage
      function getMemoryUsage() {
        if (win.performance && win.performance.memory) {
          return win.performance.memory.usedJSHeapSize;
        }
        return null;
      }

      // Helper to reset performance and page state (Recommendation 1: stability)
      function resetPerformanceState() {
        if (win.resetDallalCaches) {
          win.resetDallalCaches();
        }
        win.DALLAL_PERF = {
          domCache: false,
          documentFragment: false,
          dirtyFlag: false,
          debounce: false
        };
        win.clearPartners(false);
      }

      // Helper to configure optimizations dynamically inside the iframe
      function setOptimizations(opts) {
        win.DALLAL_PERF = {
          domCache: !!opts.domCache,
          documentFragment: !!opts.documentFragment,
          dirtyFlag: !!opts.dirtyFlag,
          debounce: !!opts.debounce
        };
      }

      const scalingResults = [];
      const incrementalResults = {};

      try {
        // --- Part 1: Sizing Scaling Benchmarks (All Optimizations ON) ---
        const partnerCounts = [10, 50, 100, 200];
        for (let i = 0; i < partnerCounts.length; i++) {
          const count = partnerCounts[i];
          if (onProgress) {
            onProgress(`قياس زمن التوسع الحجمي مع ${count} شريك (جميع التحسينات نشطة)...`);
          }

          resetPerformanceState();
          setOptimizations({ domCache: true, documentFragment: true, dirtyFlag: true, debounce: true });

          const memStart = getMemoryUsage();
          let peakMem = memStart || 0;
          const trackPeak = () => {
            const current = getMemoryUsage();
            if (current !== null && current > peakMem) {
              peakMem = current;
            }
          };

          // Configure standard layout dimensions
          doc.getElementById("length1").value = 100;
          doc.getElementById("length2").value = 100;
          doc.getElementById("width1").value = 100;
          doc.getElementById("width2").value = 100;
          doc.getElementById("share-input-method").value = "shares";
          win.currentInputMethod = "shares";
          win.handleInputMethodChange();

          // Add partners (using documentFragment as it is enabled)
          const frag = doc.createDocumentFragment();
          for (let p = 0; p < count; p++) {
            win.addNewPartnerRow(`شريك ${p + 1}`, "", "", "", "", "-", "-", false, frag);
          }
          doc.getElementById("partners-list").appendChild(frag);
          trackPeak();

          win.divideEqually();
          win.calculateGeneral();
          trackPeak();

          // Measure calculations metrics
          const calcMetrics = measureMetrics(() => {
            win.runPartition();
          }, 10, 2, trackPeak);

          // Measure render metrics
          const renderMetrics = measureMetrics(() => {
            win.renderCroquis();
          }, 10, 2, trackPeak);

          // Measure total update loop metrics
          const totalMetrics = measureMetrics(() => {
            win.calculateGeneral();
            win.runPartition();
          }, 10, 2, trackPeak);

          const memEnd = getMemoryUsage();
          trackPeak();

          scalingResults.push({
            partnersCount: count,
            calcTimeMs: parseFloat(calcMetrics.average.toFixed(2)),
            calcMedianMs: parseFloat(calcMetrics.median.toFixed(2)),
            renderTimeMs: parseFloat(renderMetrics.average.toFixed(2)),
            renderMedianMs: parseFloat(renderMetrics.median.toFixed(2)),
            totalTimeMs: parseFloat(totalMetrics.average.toFixed(2)),
            totalMedianMs: parseFloat(totalMetrics.median.toFixed(2)),
            memBeforeBytes: memStart,
            memAfterBytes: memEnd,
            memPeakBytes: peakMem
          });

          // Brief delay to breathe thread
          await new Promise(r => setTimeout(r, 50));
        }

        // --- Part 2: Incremental Optimizations Benchmark (100 Partners) ---
        const Workload = 100;
        const stages = [
          {
            key: "baseline",
            label: "خط الأساس (بدون أي تحسينات)",
            opts: { domCache: false, documentFragment: false, dirtyFlag: false, debounce: false }
          },
          {
            key: "domCache",
            label: "تطبيق DOM Cache",
            opts: { domCache: true, documentFragment: false, dirtyFlag: false, debounce: false }
          },
          {
            key: "documentFragment",
            label: "تطبيق DocumentFragment",
            opts: { domCache: true, documentFragment: true, dirtyFlag: false, debounce: false }
          },
          {
            key: "dirtyFlag",
            label: "تطبيق State Signature (Dirty Flag)",
            opts: { domCache: true, documentFragment: true, dirtyFlag: true, debounce: false }
          },
          {
            key: "debounce",
            label: "تطبيق Debounce المطور",
            opts: { domCache: true, documentFragment: true, dirtyFlag: true, debounce: true }
          }
        ];

        // We capture baseline output definitions to perform correctness checks at each stage
        let baselineCalculatedPieces = "";
        let baselineTotalArea = "";
        let baselineDomState = "";

        for (let s = 0; s < stages.length; s++) {
          const stage = stages[s];
          if (onProgress) {
            onProgress(`قياس خطوة التحسين التراكمية: ${stage.label}...`);
          }

          resetPerformanceState();
          setOptimizations(stage.opts);

          const memStart = getMemoryUsage();
          let peakMem = memStart || 0;
          const trackPeak = () => {
            const current = getMemoryUsage();
            if (current !== null && current > peakMem) {
              peakMem = current;
            }
          };

          // Setup standard layout inputs
          doc.getElementById("length1").value = 100;
          doc.getElementById("length2").value = 100;
          doc.getElementById("width1").value = 100;
          doc.getElementById("width2").value = 100;
          trackPeak();

          // Measure table creation / row generation speed
          const tTableStart = performance.now();
          const target = stage.opts.documentFragment ? doc.createDocumentFragment() : doc.getElementById("partners-list");
          for (let p = 0; p < Workload; p++) {
            win.addNewPartnerRow(`شريك ${p + 1}`, "", "", "", "", "-", "-", false, target);
          }
          if (stage.opts.documentFragment) {
            doc.getElementById("partners-list").appendChild(target);
          }
          const tTableEnd = performance.now();
          const tableUpdateTimeMs = tTableEnd - tTableStart;
          trackPeak();

          win.divideEqually();
          win.calculateGeneral();
          trackPeak();

          // Capture outputs at the baseline stage to check for regressions
          if (stage.key === "baseline") {
            baselineCalculatedPieces = normalizeCalculatedPieces(win.calculatedPieces);
            baselineTotalArea = doc.getElementById("calc-area-m2")?.innerText || "";
            baselineDomState = Array.from(doc.querySelectorAll("#partners-list .partner-row")).map(row => {
              return `${row.querySelector(".partner-name")?.value}_${row.querySelector(".partner-shares")?.value}_${row.querySelector(".partner-carats")?.value}_${row.querySelector(".partner-width-bottom")?.value}`;
            }).join("|");
          }

          // Measure calc metrics (10 runs, 2 warm-ups)
          const calcMetrics = measureMetrics(() => {
            win.runPartition();
          }, 10, 2, trackPeak);

          // Measure render metrics (10 runs, 2 warm-ups)
          const renderMetrics = measureMetrics(() => {
            win.renderCroquis();
          }, 10, 2, trackPeak);

          // Measure re-render metrics (Dirty Flag check: call renderCroquis twice without changes)
          win.renderCroquis(); // First call
          const reRenderMetrics = measureMetrics(() => {
            win.renderCroquis(); // Second call: should be ~0ms if dirty flag is enabled
          }, 10, 2, trackPeak);

          // Measure total loop
          const totalMetrics = measureMetrics(() => {
            win.calculateGeneral();
            win.runPartition();
          }, 10, 2, trackPeak);

          // Correctness Check: verify results are identical to baseline
          const currentCalculatedPieces = normalizeCalculatedPieces(win.calculatedPieces);
          const currentTotalArea = doc.getElementById("calc-area-m2")?.innerText || "";
          const currentDomState = Array.from(doc.querySelectorAll("#partners-list .partner-row")).map(row => {
            return `${row.querySelector(".partner-name")?.value}_${row.querySelector(".partner-shares")?.value}_${row.querySelector(".partner-carats")?.value}_${row.querySelector(".partner-width-bottom")?.value}`;
          }).join("|");

          const regressionFree = (
            currentCalculatedPieces === baselineCalculatedPieces &&
            currentTotalArea === baselineTotalArea &&
            currentDomState === baselineDomState
          );

          // Measure debounce: simulate 5 rapid keyboard keypresses
          let immediateCalls = 0;
          const origImmediate = win.saveAndCalcImmediate;
          win.saveAndCalcImmediate = function() {
            immediateCalls++;
            return origImmediate.apply(this, arguments);
          };

          // Simulate typing 5 characters
          for (let k = 0; k < 5; k++) {
            doc.getElementById("length1").value = 100 + k;
            win.saveAndCalc();
          }

          // Wait 150ms to allow debounce timer (120ms) to fire if active
          await new Promise(r => setTimeout(r, 150));

          // Restore original function
          win.saveAndCalcImmediate = origImmediate;
          trackPeak();

          // --- Part 3: Real User Typing Scenario: typing 5 -> 50 -> 500 -> 50 -> 5 -> empty -> 5 -> 52 ---
          win.clearPartners(false);
          win.addNewPartnerRow("شريك 1", "", "", "", "");
          win.divideEqually();
          win.calculateGeneral();
          trackPeak();

          // Keystroke array: "5", "0", "0", "" (backspace), "" (backspace), "" (backspace), "5", "2"
          const keystrokes = ["5", "0", "0", "", "", "", "5", "2"];
          const inputEl = doc.querySelector(".partner-shares") || doc.getElementById("length1");
          inputEl.value = "";

          let typingRenderCalls = 0;
          const origRender = win.renderCroquis;
          win.renderCroquis = function() {
            typingRenderCalls++;
            return origRender.apply(this, arguments);
          };

          const tTypingStart = performance.now();
          for (let k = 0; k < keystrokes.length; k++) {
            const char = keystrokes[k];
            if (char === "") {
              inputEl.value = inputEl.value.slice(0, -1);
            } else {
              inputEl.value += char;
            }
            win.saveAndCalc();
            await new Promise(r => setTimeout(r, 30)); // 30ms rapid typing key gap
          }
          // Wait 150ms for final debounce to resolve
          await new Promise(r => setTimeout(r, 150));
          const tTypingEnd = performance.now();

          win.renderCroquis = origRender;
          const typingTimeMs = tTypingEnd - tTypingStart;
          trackPeak();

          const memEnd = getMemoryUsage();

          incrementalResults[stage.key] = {
            calcTimeMs: parseFloat(calcMetrics.average.toFixed(2)),
            calcMedianMs: parseFloat(calcMetrics.median.toFixed(2)),
            renderTimeMs: parseFloat(renderMetrics.average.toFixed(2)),
            renderMedianMs: parseFloat(renderMetrics.median.toFixed(2)),
            reRenderTimeMs: parseFloat(reRenderMetrics.average.toFixed(2)),
            reRenderMedianMs: parseFloat(reRenderMetrics.median.toFixed(2)),
            totalTimeMs: parseFloat(totalMetrics.average.toFixed(2)),
            totalMedianMs: parseFloat(totalMetrics.median.toFixed(2)),
            tableUpdateTimeMs: parseFloat(tableUpdateTimeMs.toFixed(2)),
            debounceCalls: immediateCalls,
            correctnessPassed: regressionFree,
            memBeforeBytes: memStart,
            memAfterBytes: memEnd,
            memPeakBytes: peakMem,
            typingTimeMs: parseFloat(typingTimeMs.toFixed(2)),
            typingRenderCalls: typingRenderCalls
          };

          await new Promise(r => setTimeout(r, 50));
        }

      } catch (err) {
        console.error("[Benchmark Runner Error]", err);
      } finally {
        if (observer) {
          try { observer.disconnect(); } catch (e) {}
        }
        document.body.removeChild(iframe);
      }

      if (onComplete) {
        onComplete({
          timestamp: new Date().toISOString(),
          environment: {
            cpuCores: win.navigator.hardwareConcurrency || "Unknown",
            deviceMemory: win.navigator.deviceMemory ? (win.navigator.deviceMemory + " GB") : "Not Supported",
            userAgent: win.navigator.userAgent
          },
          longTasks: {
            count: longTaskCount,
            totalDurationMs: parseFloat(longTaskTotalDuration.toFixed(2))
          },
          scaling: scalingResults,
          incremental: incrementalResults
        });
      }
    };
  };

})(typeof window !== "undefined" ? window : global);
