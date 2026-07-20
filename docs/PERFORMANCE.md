# Performance Budget - Dallal Land Partition Application

This document outlines the target metrics, performance limits, and benchmarking guidelines for the **Dallal** land partitioning application. All optimization efforts during Phase 14 must target these goals without breaking computational correctness or layout styling.

---

## 1. Budget Targets

| Metric | Target | Description |
| :--- | :--- | :--- |
| **runPartition Execution Time** | `< 20ms` | Time spent computing partition layouts from user shares (Calculation). |
| **renderCroquis Execution Time** | `< 16ms` | Time spent drawing and updating SVG elements to achieve 60 FPS (Rendering). |
| **Total Input Update Cycle** | `< 50ms` | Combined calculation, layout, and render time (DOM & Layout). |
| **Typing Responsiveness (100 Partners)** | `0ms Lag` | Fluid typing experience in dimensions/partner share inputs. |
| **Real User Typing Simulation** | `< 250ms` | Total elapsed time for sequence `5 -> 50 -> 500 -> 50 -> 5 -> empty -> 5 -> 52` with debounce. |
| **Stress Scaling (200 Partners)** | `< 100ms` | Total execution cycle under high partner load. |
| **Peak Heap Memory Usage Delta** | `< 30MB` | Maximum additional heap size allocated during stress operations. |

---

## 2. Environment Context & Metadata

Performance benchmarks depend heavily on the testing hardware and environment. Budget evaluations must NOT rely on a single device configuration. All reports and exported JSON benchmark results must log the following environmental context:

| Context Field | Retrieval Method | Description |
| :--- | :--- | :--- |
| **Device CPU** | `navigator.hardwareConcurrency` | Logical CPU core count. |
| **Device RAM** | `navigator.deviceMemory` | Memory capacity (displays `Not Supported` if unavailable). |
| **Browser & Engine** | `navigator.userAgent` | Full browser UserAgent string. |
| **Overall Result** | Audit evaluation | `PASSED` / `FAILED` state badge. |

*Budgets must be verified on mid-range target devices (minimum 4-core CPU, modern Chromium-based browser).*

---

## 3. Benchmark Stability & Calculation Standards

### Benchmark Stability Protocol
To prevent earlier test runs from corrupting subsequent measurements:
1. **Reset Feature Flags**: Set `window.DALLAL_PERF = { domCache: false, documentFragment: false, dirtyFlag: false, debounce: false }` before every stage.
2. **Clear Caches**: Call `resetPerformanceState()` (`resetDallalCaches()` and clear internal hash signatures).
3. **Reset State**: Call `clearPartners(false)` to restore clean initial page state.

### Average & Median Metrics
To prevent Garbage Collection (GC) spikes or OS thread scheduling noise from distorting benchmark results:
- **Average**: Calculated after trimming fastest and slowest outliers from 10 sample iterations.
- **Median**: Middle value of the sorted sample set, reflecting true representative performance.

---

## 4. Benchmark JSON Export Standard

Benchmark results can be exported as structured JSON files (e.g. `tests/benchmark-results.json` or `benchmark-results-YYYY-MM-DD.json`) to track project performance evolution over time.

### JSON Structure
```json
{
  "timestamp": "2026-07-20T13:30:00.000Z",
  "environment": {
    "cpuCores": 8,
    "deviceMemory": "8 GB",
    "userAgent": "Mozilla/5.0..."
  },
  "longTasks": {
    "count": 0,
    "totalDurationMs": 0
  },
  "scaling": [
    {
      "partnersCount": 10,
      "calcTimeMs": 1.20,
      "calcMedianMs": 1.15,
      "renderTimeMs": 2.10,
      "renderMedianMs": 2.05,
      "totalTimeMs": 3.30,
      "totalMedianMs": 3.20,
      "memBeforeBytes": null,
      "memAfterBytes": null,
      "memPeakBytes": 0
    }
  ],
  "incremental": { ... }
}
```

---

## 5. Budget Failure Diagnostics

When a budget verification fails, the benchmark logs the specific category of the bottleneck under `Reason:`:

- **Calculation**: Triggered when partitioning algorithm time (`runPartition`) exceeds `20ms`.
- **Rendering**: Triggered when canvas drawing time (`renderCroquis`) or duplicate draw check exceeds `16ms` / `2ms`.
- **DOM**: Triggered when adding partner rows or DOM table manipulations exceeds `40ms`.
- **Layout**: Triggered when style calculation, layouts, or reflow cycles exceed budget limits.
- **Memory**: Triggered when peak heap memory allocation exceeds `30MB`.
- **Unknown**: Fallback reason for unexpected delays.

---

## 6. Key Optimization Vectors

### DOM Caching
Avoid repetitive DOM lookups using `document.getElementById` or `document.querySelector` within calculation loops or layout iterations. Store elements once on load in a global `DOM` map.

### Batch Updates
Utilize `DocumentFragment` to batch dynamically created rows when updates occur. Avoid appending individual rows one-by-one to live DOM trees.

### Redraw Prevention (Dirty Flag)
Do not rebuild or adjust viewboxes on the SVG canvas unless the underlying state has actually changed. Use a simple hash signature (`State Signature`) to verify state changes before drawing.

### Event Debouncing
Group closely timed keyboard input events using a `120ms` debounce threshold to prevent triggering redraw cycles on every individual keystroke.

