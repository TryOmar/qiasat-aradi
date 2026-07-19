# Performance Budget - Dallal Land Partition Application

This document outlines the target metrics and performance limits for the **Dallal** land partitioning application. All optimization efforts during Phase 14 must target these goals without breaking computational correctness or layout styling.

---

## 1. Budget Targets

| Metric | Target | Description |
| :--- | :--- | :--- |
| **runPartition Execution Time** | `< 20ms` | Time spent computing partition layouts from user shares. |
| **renderCroquis Execution Time** | `< 16ms` | Time spent drawing and updating the SVG elements to achieve 60 FPS. |
| **Total Input Update Cycle** | `< 50ms` | Combined calculation, layout, and render time. |
| **Typing Responsiveness (100 Partners)** | `0ms Lag` | Fluid typing experience in dimensions/partner share inputs. |
| **Stress Scaling (200 Partners)** | `< 100ms` | Total execution cycle under high partner load. |

---

## 2. Key Optimization Vectors

### DOM Caching
Avoid repetitive DOM lookups using `document.getElementById` or `document.querySelector` within calculation loops or layout iterations. Store elements once on load in a global `DOM` map.

### Batch Updates
Utilize `DocumentFragment` to batch dynamically created rows when updates occur. Avoid appending individual rows one-by-one to live DOM trees.

### Redraw Prevention (Dirty Flag)
Do not rebuild or adjust viewboxes on the SVG canvas unless the underlying state has actually changed. Use a simple hash signature (`State Signature`) to verify state changes before drawing.

### Event Debouncing
Group closely timed keyboard input events using a `120ms` debounce threshold to prevent triggering redraw cycles on every individual keystroke.
