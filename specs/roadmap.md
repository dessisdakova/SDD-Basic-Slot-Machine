# Project Roadmap

This roadmap outlines the evolution of the Slot Machine project in line with the [mission](mission.md): **Specs-Driven Development (SDD)**, **AI-assisted engineering**, and **human-in-the-loop** review. Each phase is a distinct milestone in product behavior, documentation, testing, or process maturity.

Phases **1–13** deliver and harden the application. **Parts III–V** treat mature areas as if you had just joined the project—so documentation and QA are deliberately **reset and rebuilt** with clear outcomes and **repeatable AI skills** (Cursor or similar) to support ongoing work.

---

## Part I: Implementation — Interface & Core Mechanics

*   **Phase 1: Web-Based Interface (API & Frontend) [Completed]**  
    Transition the interface from console-based to a web application using a Python backend (FastAPI) and a modern frontend.

*   **Phase 2: Complex Winning Lines [Completed]**  
    Expand to a 5-reel system (5×3 grid), implement 10 complex paylines, and add tiered payouts for 3, 4, or 5 matching symbols.

*   **Phase 3: Information Modal [Completed]**  
    Add a UI component to display game rules, symbol payouts, and winning line patterns.

*   **Phase 4: Wild Symbols [Completed]**  
    Introduce symbols that can substitute for others to complete winning combinations.

*   **Phase 5: Scatter Symbols [Completed]**  
    Implement mechanics where symbols trigger payouts or events regardless of their position on paylines.

*   **Phase 6: Bonus Symbols & Mini-Games [Completed]**  
    Add special symbols that transition the game state into unique bonus rounds or mini-games.

*   **Phase 7: Free Spins Feature [Completed]**  
    Develop the logic for awarding and executing free spins, including specialized multipliers.

*   **Phase 8: Progressive Jackpots [Completed]**  
    Implement a shared pool mechanism that accumulates value and defines specific hit conditions.

*   **Phase 9: Nudge and Hold Features [Completed-Partially]**  
    Add player-initiated reel adjustments to increase interaction and strategic depth.

---

## Part II: Implementation — Persistence & User Experience

*   **Phase 10: User Profiles & Persistence**  
    Implement data storage for player balances, authentication, and session history.

*   **Phase 11: Global Leaderboards**  
    Create a system to track and display top-performing players across sessions.

*   **Phase 12: Sound Effects & Animations**  
    Specify and integrate audio-visual feedback for spins, wins, and bonus triggers.

*   **Phase 13: External Configuration & Balancing**  
    Move symbol weights, probabilities, and payouts to external configuration files for easy balancing.

---

## Part III: Documentation

**Mindset:** Treat the repo as if you had **just joined** as owner of documentation—no assumption that existing markdown is complete, current, or discoverable. Goal: a **coherent documentation layer** (requirements, user stories, specs alignment, onboarding) that matches how the product actually behaves, with **AI skills** that encode repeatable workflows (e.g. “update spec after code change,” “derive user stories from `specs/phase_*.md`,” “refresh README from API surface”).

*   **Phase 14: Documentation Discovery & Inventory**  
    Map what exists under `specs/`, `README`, and code; identify gaps, contradictions, and stale sections; define a minimal doc set (constitution, architecture sketch, API contract summary).

*   **Phase 15: Requirements, User Stories & Acceptance Criteria**  
    Backfill and maintain traceability from features to stories and AC; align with SDD so implementation and docs stay coupled; use AI skills to draft and diff-check against code.

*   **Phase 16: Technical & Contributor Documentation**  
    Onboarding for new humans (and AI agents): how to run, test, deploy; conventions for specs and PRs; optional ADRs for major decisions.

---

## Part IV: Testing & Quality Assurance

**Mindset:** Treat the repo as if you had **just joined as QA**—assume no single “done” test strategy; build confidence with **explicit strategy**, **layered automation**, and **AI-assisted** design, execution, and triage. Goal: repeatable **AI skills** for QA (e.g. “propose edge cases for this module,” “expand pytest from this spec,” “summarize regression scope after a diff”).

*   **Phase 17: Test Strategy & Coverage Assessment**  
    Define risk-based priorities; inventory current tests (`tests/`, E2E); set targets per layer (unit, API, UI); document what AI is allowed to change vs. what requires human sign-off.

*   **Phase 18: Automated Test Expansion**  
    Grow unit, integration, and end-to-end coverage where gaps hurt most; cross-module flows; keep tests aligned with specs.

*   **Phase 19: AI-Assisted QA & Advanced Techniques**  
    AI-driven negative and edge-case generation; property-based or fuzz-style checks where valuable; performance and security sanity checks as the stack matures.

---

## Part V: Process Maturity

*   **Phase 20: Formal Specification Language Adoption**  
    Transition to Gherkin/Cucumber style “Given/When/Then” specifications to tighten the link between specs, tests, and AI-assisted verification.

---

## References

*   [Mission](mission.md) — purpose, AI-assisted workflow, engineering principles, long-term goals.
*   [Tech stack](tech-stack.md) — runtime and tooling context for roadmap phases.
