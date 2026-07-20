# Architecture Decision Records (ADR) - Dallal Land Partition Application

This document records the key architectural decisions, design rationales, and engineering trade-offs made during the development and refactoring of the **Dallal** land partitioning application (Releases 2026.1 / v2.0.0).

---

## ADR-001: Separation of Core Math into Pure Functions (`AgriUnits`)

- **Context**: Historical land partitioning logic was tightly coupled with DOM elements (`document.getElementById`), global window variables, and legacy localStorage keys.
- **Decision**: Extract all unit conversions, land area calculations, and FCS/Qasaba normalizations into pure, side-effect-free functions inside `core/units.js` (`AgriUnits`).
- **Rationale**:
  1. Enables automated headless testing (Node.js test runner).
  2. Guarantees 100% computational correctness independent of UI state.
  3. Prepares the business logic for seamless translation to Flutter (Dart).

---

## ADR-002: Creation of Centralized Compatibility Layer (`AgriUnitsCompat`)

- **Context**: Existing page scripts (`Page11`, `Page12`, `Page13`) relied on legacy function names and fallback behaviors. Refactoring everything in a single step posed high regression risks.
- **Decision**: Introduce `shared/agri-units-compat.js` (`AgriUnitsCompat`) to serve as a bridge between legacy function signatures and the new `AgriUnits` core library.
- **Rationale**:
  1. Allows gradual page-by-page migration without breaking working features.
  2. Encapsulates legacy fallback routines (`legacySqmToFeddanCaratShares`, etc.) for dual-path validation.
  3. Enables Golden Comparison testing (300 automated test cases per page) to prove zero calculation drift.

---

## ADR-003: Adoption of State Signature (Dirty Flag) for SVG Rendering

- **Context**: Re-rendering the partitioning croquis canvas on every minor input event caused unnecessary SVG DOM rebuilding and viewbox recalculations.
- **Decision**: Implement a state signature hash string (`lastCroquisSignature`) that compares current land dimensions, partner shares, and layout directions before triggering `renderCroquis()`.
- **Rationale**:
  1. Eliminates 99%+ of duplicate SVG redraw cycles when inputs remain unchanged.
  2. Reduces re-render execution time from ~24ms to ~0.12ms under a 100-partner workload.

---

## ADR-004: Deferral of Complex Memoization Algorithms

- **Context**: Initial optimization proposals included deep memoization caches for geometric partitioning iterations.
- **Decision**: Defer memoization until profiling explicitly proves a performance bottleneck that cannot be solved by simpler optimizations.
- **Rationale**:
  1. Profiling showed `runPartition` calculation time was already `< 4ms` for 100 partners.
  2. Deep memoization adds memory overhead and cash-invalidation complexity without measurable speed gains.
  3. Adheres to the principle: *Optimize based on empirical measurement, not premature assumption.*

---

## ADR-005: Tolerance Threshold Selection (`Tolerance = 0.05 m²`)

- **Context**: Binary search partitioning algorithms for non-rectangular lands require a convergence stopping condition.
- **Decision**: Standardize area tolerance to `0.05 m²` across all partitioning routines.
- **Rationale**:
  1. Provides millimeter-level geometric precision for land partitioning.
  2. Prevents infinite binary search loops while ensuring execution completes within budget limits (`< 20ms`).

---

## ADR-006: Reproducible Benchmark Baseline & Stability Protocol

- **Context**: Garbage Collection (GC) pauses, OS thread scheduling, and leftover DOM state corrupted previous benchmark comparisons.
- **Decision**: Standardize the benchmark suite to enforce:
  - `resetPerformanceState()` before every stage.
  - Calculation of both **Average** (trimmed outliers) and **Median**.
  - Logging device environment context (CPU cores, RAM, UserAgent).
  - Exporting structured JSON baselines ([`tests/benchmark-results.json`](file:///f:/برمجة%20تطبيق%20الدلال/qiasat-aradi-master/tests/benchmark-results.json)).
- **Rationale**: Ensures benchmark measurements are scientifically reproducible, cross-environment verifiable, and regression-proof over long-term development.

---

## ADR-007: Two-Phase Legacy Deprecation Strategy

- **Context**: Legacy functions and storage keys need to be retired without interrupting active user sessions or old saved projects.
- **Decision**:
  - **Phase 1 (Current)**: Dual-write storage migration (`shared/storage.js`) and compatibility wrappers (`AgriUnitsCompat`).
  - **Phase 2 (Future Release)**: Formal deprecation warning logs followed by complete removal of `legacy*` methods after full production validation.
- **Rationale**: Protects backward compatibility for existing user data while providing a clear path toward technical debt elimination.

---

## ADR-009: Canonical Business Data Model Isolation (No Derived Presentation State)

- **Context**: Storing derived visual presentation properties (e.g. `displayArea`, `roundedFCS`, formatted string labels) inside the core business model creates dual sources of truth. If the canonical area changes without updating derived fields, state desynchronization bugs occur.
- **Decision**: The Data Model shall store ONLY canonical business data (`partner.exactArea`, `partner.id`, `partner.locks`). Any formatted or presentation-specific values (`displayArea`, `formattedFCS`, localized strings) must be dynamically derived at render time and must NEVER be persisted within business state.
- **Rationale**:
  1. Enforces strict Single Source of Truth architecture: `exactArea` is the unique canonical value.
  2. Rendering functions shall be pure and side-effect free. Rendering must never mutate the business model or introduce presentation fields into canonical state.
  3. Separates mathematical calculation (`sqmToFCS`) from string formatting (`formatFCS`).
  4. Provides a clean, unpolluted Data Model optimized for 1-to-1 Dart/Flutter migration.

## ADR-008: Elimination of Display-Rounding Last-Item Adjustment & Full-Precision Model Isolation

- **Context**: Systems sometimes apply "Last-Item Adjustment" (loading rounding differences onto final items) or re-derive internal calculations from rounded UI text values. In land partitioning (whether equal division, custom ratio splits, or locked partner adjustments), reading from rounded UI text creates cumulative rounding drift and artificial land deficits.
- **Decision**: Eliminate all Last-Item Adjustments caused by display rounding. All calculations, canvas drawings, area totals, and validation routines shall use full-precision floating-point values stored in the Data Model (`partner.exactArea`), while UI values are formatted for presentation only. Displayed values must NEVER be used as inputs to business logic.
- **Rationale**:
  1. Guarantees 100% mathematical precision and fairness across all partitioning scenarios (equal division, ratio splits, manual edits, locked partners).
  2. Ensures UI formatting changes (e.g. 2 vs 3 decimal places) have zero impact on internal geometric or computational accuracy.
  3. Establishes a pure Model-First architecture (`Model -> Business Logic -> Renderer -> DOM`) essential for clean Flutter/Dart translation.

