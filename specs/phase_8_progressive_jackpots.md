# Specification: Phase 8 - Progressive Jackpots

## Goal & Scope

Introduce **progressive jackpot** gameplay: a **shared prize pool** that **grows** as the player stakes real (paid) spins and can be **won** under explicit, testable rules. Wins from the jackpot are added to player balance alongside normal spin outcomes.

**In scope**

- Jackpot pool state (growth, resets, observable values exposed to UI and tests).
- Clear **hit condition(s)** tied to reel outcomes and/or controlled randomness.
- API and configuration surface so behavior is data-driven where practical.
- Web UI: visible jackpot amount, win feedback, and rules in the info modal.

**Out of scope (initial delivery)**

- Cross-device or multi-user persistence (database, real-money accounting).
- Network-wide linked progressives or operator back-office.

These may be revisited in later roadmap phases (e.g. persistence, external configuration).

---

## Concepts

### Progressive pool

- A numeric **jackpot balance** (integer dollars or same currency unit as the rest of the game).
- **Seed value:** starting amount when the game server process starts (or when reset after a win).
- **Contribution:** on each **paid** spin only (`is_free_spin == false`), a portion of the **total bet** (`lines × bet`) is added to the pool (see **Constants**). Free spins and zero-cost actions do **not** contribute unless explicitly specified later.

### Win event

- When hit conditions are satisfied, the player receives the **current jackpot pool** (or a defined share—default **100%** of the pool for this phase).
- After a win, the pool **resets** to the **seed** (or a documented alternative, e.g. seed + carryover—default **reset to seed**).

---

## Functional Requirements

1. **Single logical pool** for this phase (one progressive meter). Named constants and module layout should allow adding tiers (e.g. Mini/Major) later without rewriting core spin flow.

2. **Contribution rule:** configurable **rate** (e.g. fixed amount per paid spin, or percentage of total bet—choose one model in implementation and document it here once fixed in `constants.py`).

3. **Eligibility:** jackpot evaluation runs on **every paid spin** after the grid is resolved (and after or alongside existing `check_winning_combinations` logic—order must be documented in code comments). Free spins may be excluded from both **contribution** and **win eligibility** unless product explicitly extends this.

4. **Hit condition (to be finalized in implementation):**  
   - **Option A (recommended for v1):** independent random trial per paid spin with probability derived from constants (e.g. `JACKPOT_HIT_PROBABILITY`), after contributions are applied.  
   - **Option B:** symbol-based trigger (e.g. specific rare combination on the grid).  
   The implemented option must be stated in `constants.py` and summarized in this spec’s **Decisions** subsection when implementation begins.

5. **Payout:** jackpot win amount is added to the same **`new_balance`** path as other spin winnings (or as a separate line item in the API response that the client adds to displayed balance—either is acceptable if documented). The spin response must include whether a jackpot was won and the amount.

6. **Idempotency / single win per spin:** at most one jackpot resolution per spin.

7. **Observability for tests:** pure functions or injectable RNG where needed so unit tests can force a hit or miss without flakiness.

---

## Constants & Configuration (`slot_machine/constants.py`)

Add (names indicative—align with actual code):

| Constant | Purpose |
| -------- | ------- |
| `JACKPOT_SEED` | Balance of the pool after reset (integer). |
| `JACKPOT_CONTRIBUTION_*` | Rule for adding to the pool on paid spins (e.g. rate or fixed increment). |
| `JACKPOT_HIT_PROBABILITY` or symbol rules | Drives hit condition for Option A or B. |

All tunables should live in **one place** for SDD review and future Phase 12 externalization.

---

## Backend Design

### State ownership

- **Process-local in-memory** store for the jackpot pool is sufficient for Phase 8 (matches current single-session demo app). Document that restarting the server resets the pool to seed.

### `slot_machine/core.py` (or dedicated module)

- Function(s) to:
  - Apply **contribution** after a paid spin’s `total_bet` is known.
  - Evaluate **hit condition** and return `(jackpot_won: bool, jackpot_amount: int)` (or amount 0 if miss).
  - **Reset** pool after a win.

### `slot_machine/game.py`

- `execute_spin` integrates:
  1. Existing reel generation and `check_winning_combinations`.
  2. Jackpot contribution **only if not** `is_free_spin`.
  3. Jackpot win evaluation **only if not** `is_free_spin` (unless spec changes).
  4. If jackpot won: include amount in returned total winnings / balance and reset pool.

### `main.py` / API contract

Extend **`POST /game/spin`** JSON response with fields such as:

- `jackpot_pool` — current pool value **after** this spin’s contribution and **after** any win reset (so the client always shows post-spin state).
- `jackpot_won` — boolean.
- `jackpot_win_amount` — integer; `0` if no win.

Extend **`GET /game/configuration`** (optional but recommended) with:

- `jackpot_seed` or display-only hints (e.g. contribution description for the info modal—avoid leaking internal probabilities if undesirable; at minimum expose **seed** and **rules text**).

---

## Frontend (`static/`)

1. Display **current jackpot** prominently (updates after each spin from `jackpot_pool`).
2. On `jackpot_won`: clear celebration message and distinguish from line/scatter wins.
3. Info modal: short **Progressive Jackpot** subsection (how the pool grows, that paid spins contribute, win is random or symbol-based per final design).
4. Free-spin mode: follow existing Phase 7 rules; jackpot display remains visible but **growth** reflects server state (typically only paid spins contributed during that session unless extended).

---

## Testing

| Layer | Requirement |
| ----- | ----------- |
| **Unit** | Contribution math; reset-after-win; hit/miss with mocked RNG / forced probability boundary. |
| **API** | Response shape includes jackpot fields; paid vs free spin contribution behavior. |
| **Regression** | Existing phases (wild, scatter, bonus, free spins) still pass; jackpot does not double-apply payouts. |

---

## Decisions log (fill in during implementation)

_Record chosen hit model (Option A vs B), exact contribution formula, and any deviations from this spec._

- [ ] Contribution model:
- [ ] Hit condition model:
- [ ] Jackpot added to balance as separate field vs bundled in `winnings`:

---

## References

- `specs/roadmap.md` — Part I, Phase 8: Progressive Jackpots.
- Existing spin pipeline: `slot_machine/game.py`, `slot_machine/core.py`, `main.py`.
