/**
 * tests/benchmark.js
 * ==================
 * Performance Benchmarking Suite for Dallal Land Partitioning
 * Measures calculation times, SVG render times, DOM Updates, Memory, and Typing Simulation.
 */

(function (global) {
  "use strict";

  // Helper function: runs warmups, then 10 iterations, drops fastest and slowest, returns average
  function measureAverageTime(fn, runs = 10, warmups = 2) {
    // Warm-up runs (unmeasured)
    for (let w = 0; w < warmups; w++) {
      fn();
    }
    // Measurement runs
    const times = [];
    for (let r = 0; r < runs; r++) {
      const tStart = performance.now();
      fn();
      const tEnd = performance.now();
      times.push(tEnd - tStart);
    }
    // Sort ascending
    times.sort((a, b) => a - b);
    // Slice out the first (min) and last (max) elements
    const middle = times.slice(1, -1);
    const sum = middle.reduce((a, b) => a + b, 0);
    return sum / middle.length;
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

      // Helper to configure optimizations dynamically inside the iframe
      function setOptimizations(opts) {
        win.DALLAL_PERF = {
          domCache: !!opts.domCache,
          documentFragment: !!opts.documentFragment,
          dirtyFlag: !!opts.dirtyFlag,
          debounce: !!opts.debounce
        };
        // Reset cache signatures to prevent interference
        win.lastCroquisSignature = "";
      }

      const scalingResults = [];
      const incrementalResults = {};

      try {
        // --- Part 1: Sizing Scaling Benchmarks (All Optimizations ON) ---
        setOptimizations({ domCache: true, documentFragment: true, dirtyFlag: true, debounce: true });
        
        const partnerCounts = [10, 50, 100, 200];
        for (let i = 0; i < partnerCounts.length; i++) {
          const count = partnerCounts[i];
          if (onProgress) {
            onProgress(`قياس زمن التوسع الحجمي مع ${count} شريك (جميع التحسينات نشطة)...`);
          }

          // Measure memory start if supported
          const memStart = win.performance && win.performance.memory ? win.performance.memory.usedJSHeapSize : null;

          // Reset page state
          win.clearPartners(false);
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

          win.divideEqually();
          win.calculateGeneral();

          // Measure calculations time (10 runs, 2 warm-ups)
          const calcTime = measureAverageTime(() => {
            win.runPartition();
          });

          // Measure render time (10 runs, 2 warm-ups)
          const renderTime = measureAverageTime(() => {
            win.renderCroquis();
          });

          // Measure total update loop time (10 runs, 2 warm-ups)
          const totalTime = measureAverageTime(() => {
            win.calculateGeneral();
            win.runPartition();
          });

          const memEnd = win.performance && win.performance.memory ? win.performance.memory.usedJSHeapSize : null;

          scalingResults.push({
            partnersCount: count,
            calcTimeMs: parseFloat(calcTime.toFixed(2)),
            renderTimeMs: parseFloat(renderTime.toFixed(2)),
            totalTimeMs: parseFloat(totalTime.toFixed(2)),
            memBeforeBytes: memStart,
            memAfterBytes: memEnd
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

          setOptimizations(stage.opts);

          // Measure memory start for the stage
          const memStart = win.performance && win.performance.memory ? win.performance.memory.usedJSHeapSize : null;

          // Measure table creation / row generation speed
          win.clearPartners(false);
          doc.getElementById("length1").value = 100;
          doc.getElementById("length2").value = 100;
          doc.getElementById("width1").value = 100;
          doc.getElementById("width2").value = 100;

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

          win.divideEqually();
          win.calculateGeneral();

          // Capture outputs at the baseline stage to check for regressions
          if (stage.key === "baseline") {
            baselineCalculatedPieces = normalizeCalculatedPieces(win.calculatedPieces);
            baselineTotalArea = doc.getElementById("calc-area-m2")?.innerText || "";
            baselineDomState = Array.from(doc.querySelectorAll("#partners-list .partner-row")).map(row => {
              return `${row.querySelector(".partner-name")?.value}_${row.querySelector(".partner-shares")?.value}_${row.querySelector(".partner-carats")?.value}_${row.querySelector(".partner-width-bottom")?.value}`;
            }).join("|");
          }

          // Measure calc time (10 runs, 2 warm-ups)
          const calcTimeMs = measureAverageTime(() => {
            win.runPartition();
          });

          // Measure render time (10 runs, 2 warm-ups)
          const renderTimeMs = measureAverageTime(() => {
            win.renderCroquis();
          });

          // Measure re-render time (Dirty Flag check: call renderCroquis twice without changes)
          win.renderCroquis(); // First call
          const reRenderTimeMs = measureAverageTime(() => {
            win.renderCroquis(); // Second call: should be 0ms if dirty flag is enabled
          });

          // Measure total loop time
          const totalTimeMs = measureAverageTime(() => {
            win.calculateGeneral();
            win.runPartition();
          });

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

          // --- Real User Typing Scenario: typing '5' -> '50' -> '500' -> '50' -> '5' -> '52' ---
          win.clearPartners(false);
          win.addNewPartnerRow("شريك 1", "", "", "", "");
          win.divideEqually();
          win.calculateGeneral();

          const keystrokes = ["5", "0", "0", "", "", "2"]; // Backspace represented by empty string
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

          const memEnd = win.performance && win.performance.memory ? win.performance.memory.usedJSHeapSize : null;

          incrementalResults[stage.key] = {
            calcTimeMs: parseFloat(calcTimeMs.toFixed(2)),
            renderTimeMs: parseFloat(renderTimeMs.toFixed(2)),
            reRenderTimeMs: parseFloat(reRenderTimeMs.toFixed(2)),
            totalTimeMs: parseFloat(totalTimeMs.toFixed(2)),
            tableUpdateTimeMs: parseFloat(tableUpdateTimeMs.toFixed(2)),
            debounceCalls: immediateCalls,
            correctnessPassed: regressionFree,
            memBeforeBytes: memStart,
            memAfterBytes: memEnd,
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
