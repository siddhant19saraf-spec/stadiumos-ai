# ADR-008: Digital Twin with Layered Architecture

**Status:** Accepted

**Date:** 2026-07-18

**Context:** The digital twin feature must visualize real-time stadium state, simulate "what-if" scenarios (crowd flow, energy consumption), predict maintenance needs, and provide post-event analytics. Embedding all capabilities in a single visualization layer would create tight coupling between rendering logic and simulation/analytics engines, making each hard to evolve independently.

**Decision:** Adopt a layered architecture for the digital twin. The Engine layer handles the core simulation and state management. The Visualization layer is a consumer of the Engine and can be swapped (e.g., Three.js for 3D, deck.gl for 2D heatmaps). The Prediction layer consumes Engine state for ML-driven forecasts. The Analytics layer runs post-event batch computations.

**Consequences:** Positive — each layer can be developed, tested, and deployed independently; the Engine can be used headlessly for server-side batch simulations; visualization can be replaced without touching simulation logic; new capabilities (e.g., AR overlays) can be added as new consumers. Negative — inter-layer communication requires well-defined contracts and versioning; simple features may require touching multiple layers; performance overhead from data serialization between layers (mitigated by shared in-memory state where possible).

**Alternatives Considered:** Monolithic twin (simpler initially but would require significant refactoring as capabilities grow); streaming event bus (flexible but adds latency and complexity for synchronous operations); micro-service per capability (premature distribution, network overhead for tightly coupled operations).
