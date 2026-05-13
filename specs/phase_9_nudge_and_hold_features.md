# Specification: Phase 9 — Nudge and Hold Features

## Goal & Scope

Add **player-initiated reel adjustments** after the usual random draw so the game feels closer to classic pub / fruit machines: **Hold** (keep one or more reels for the next spin) and **Nudge** (bump a reel to change visible symbols without a full redraw of that column).

Today’s engine (`generate_random_reels_in_spin` → `convert_reels_to_rows` → `check_winning_combinations`) produces a **single final 5×3 grid per spin** with no underlying “physical strip” exposed to the client. Phase 9 must define **how** hold and nudge map onto that architecture without breaking **Phase 7** (free spins), **Phase 8** (jackpot: one contribution + one hit trial per **paid** spin), or existing payout rules.

**In scope (target delivery)**

- **Hold:** on a **paid** spin, the player may freeze **zero or more columns** (reels); the next **paid** spin keeps those columns **symbol-for-symbol** and **regenerates only the other columns**, still respecting per-reel rules (e.g. bonus symbol forbidden on first/last reel, scatter/bonus “once per reel” behavior when generating the unfrozen columns).
- **Nudge:** after the base grid is known for a spin, allow a **limited** number of **column-wise** adjustments before wins are evaluated, using a deterministic rule documented below (so tests do not depend on vague “feel”).
- **Configuration:** tunables in `slot_machine/constants.py` (limits, eligibility, copy for the info modal).
- **API:** extend `POST /game/spin` (and possibly `GET /game/configuration`) so the client can send hold/nudge intent and receive enough metadata to drive the UI (which columns were held, nudge history, errors).
- **Frontend:** controls on the main slot card (e.g. per-column Hold toggles, Nudge buttons when available), rules in the info modal, accessibility (keyboard / `aria-pressed` on toggles).

**Out of scope (initial delivery)**

- Physical reel strips with visible off-window symbols (may be a **later refinement** inside Phase 9 or a follow-up phase if you want true “step the strip” nudges).
- Multiplayer, anti-cheat beyond **server-authoritative** grids (see **Session & trust model**).
- Charging extra for nudges (each paid spin still charges **`lines × bet`** once unless explicitly changed later).

---

## Concepts

### Hold (reel freeze)

- Player selects **which columns (0 … REELS−1)** to carry into the **next paid spin**.
- Unheld columns are generated **fresh** for that spin using the same symbol pools and reel-index rules as today; held columns are **copied** from the **authoritative previous grid** stored on the server for that client session (not taken blindly from the request body alone — see **Session & trust model**).

### Nudge (column adjustment)

Because the current RNG does not model a wraparound strip, **v1 nudge** is defined as a **small deterministic transform on one column’s three symbols**:

- **Direction:** e.g. **downward** nudge (document in constants): top cell takes the old middle symbol, middle takes the old bottom symbol, **bottom cell receives one new symbol** drawn from the same **legal per-reel pool** as `generate_random_reels_in_spin` uses for that column (respecting bonus filtering and “once per reel” scatter/bonus rules for the **new** symbol only, or re-roll column mini-loop — exact rule to match existing reel generation semantics; must be implemented in one helper and unit-tested).

Alternative (if product prefers simplicity over “strip feel”): **nudge = re-roll entire column** once (still counts as one nudge). The **Decisions log** should record which variant ships.

- **When:** Nudges apply **within the same paid spin transaction** after the initial grid is drawn (or after hold-merge + fresh columns — order must be fixed and documented in code comments), **before** `check_winning_combinations` and **before** jackpot contribution/hit.

---

## Functional Requirements

1. **Single balance movement per paid spin**  
   Each `POST /game/spin` that is **not** `is_free_spin` still deducts **`total_bet` at most once** and runs **jackpot contribution + hit trial at most once** (Phase 8 unchanged).

2. **Free spins**  
   Default: **Hold and nudge are disabled** when `is_free_spin: true` (keeps Phase 7 mental model: free games are “given” spins). If you later want holds on free spins, add a constant and update this spec explicitly.

3. **Hold limits**  
   Configurable **`MAX_HOLD_COLUMNS`** (e.g. 4 — cannot hold all 5 or the spin would be degenerate; minimum **1 unheld** column must spin). Holding **0** columns = normal spin.

4. **Nudge limits**  
   Configurable **`MAX_NUDGES_PER_PAID_SPIN`** (e.g. 0–3). **`NUDGES_ENABLED`** boolean for easy A/B or staged rollout.

5. **Interaction order (recommended)**  
   Document in `game.py`:  
   (a) If hold mask valid: build working grid = held columns from server-stored previous grid + regenerate other columns.  
   (b) Else: full random grid as today.  
   (c) Apply nudges in order (each nudge names a column index).  
   (d) Run `check_winning_combinations` → jackpot → balance.

6. **Idempotency**  
   Each spin response remains one atomic outcome; the client does not “preview” a charged spin without an explicit future endpoint (out of scope unless added here).

7. **Observability**  
   Response includes machine-readable flags, e.g. `hold_columns_applied`, `nudges_applied` (list of column indices in order), and `hold_rejected_reason` / validation message when the client sent an invalid hold.

---

## Session & trust model (server-authoritative)

The API today is **stateless** except the process-local jackpot pool. Hold **requires** the server to remember the **last committed `spin_result`** per logical client session so the player cannot forge held symbols.

**Recommended approach for this codebase**

- **Client session id:** On first load, the frontend generates a **UUID** (e.g. stores in `localStorage`) and sends **`client_session_id`** on every `POST /game/spin` (and optionally registers it via `GET /game/configuration?client_session_id=…` for validation).
- **Server:** In-memory map `session_id → last_spin_result` (and optionally `last_total_bet` / `last_lines` / `last_bet` if needed for validation). After each successful spin, update the stored grid. When a spin request includes **`hold_columns`**, the server **only** copies held columns from this stored grid; if there is **no** prior grid (new session), **ignore hold** and return `hold_rejected_reason: "no_previous_spin"` (or similar).

**Limits:** Server restart clears sessions (same class of limitation as the jackpot pool). Document in the info modal.

**Future (Phase 10+):** Replace in-memory map with persisted sessions if multi-tab or long-lived play matters.

---

## Constants & Configuration (`slot_machine/constants.py`)

| Constant (proposed) | Purpose |
| ------------------- | ------- |
| `HOLD_FEATURE_ENABLED` | Master toggle. |
| `NUDGE_FEATURE_ENABLED` | Master toggle. |
| `MAX_HOLD_COLUMNS` | Maximum number of reels that may be held at once; enforce at least one reel not held. |
| `MAX_NUDGES_PER_PAID_SPIN` | Upper bound on nudge steps per paid spin. |
| `HOLD_AND_NUDGE_RULES_SUMMARY` | Short copy for API + info modal (no internal RNG details). |

Optional tuning knobs can be added during implementation (e.g. whether nudge is “shift+fill” vs “full column re-roll”).

---

## Backend Design

### 1. `slot_machine/core.py` (or a small `slot_machine/reel_actions.py`)

- Extract or duplicate-safe helpers:
  - **`generate_single_reel_column(reel_idx, rows)`** — returns one column (length `ROWS`) obeying existing bonus/scatter rules for that reel index.
  - **`apply_hold_to_grid(previous_grid, hold_columns)`** — merges stored columns with freshly generated columns.
  - **`apply_nudge_to_column(grid, reel_idx, …)`** — implements the chosen nudge semantics with injectable RNG for tests.

### 2. `slot_machine/game.py`

- Extend **`execute_spin`** (signature TBD) to accept optional:
  - `client_session_id: str | None`
  - `hold_columns: list[int] | None`
  - `nudge_sequence: list[int] | None` (column indices in order)
- Flow: build grid → nudges → existing `check_winning_combinations` → existing jackpot → return dict **plus** session bookkeeping side effects.
- **Session store:** a small module (e.g. `slot_machine/session_grid.py`) with `get_last_grid(session_id)`, `set_last_grid(session_id, grid)`, LRU cap to avoid unbounded growth.

### 3. `main.py` / API

- Extend **`SpinRequest`** with optional fields above; validate types and ranges (column indices `0 … REELS-1`, no duplicates if desired).
- Response extensions (illustrative names):
  - `hold_columns_applied: list[int]`
  - `nudges_applied: list[int]`
  - `hold_rejected_reason: str | null`
  - `features: { "hold": bool, "nudge": bool }` mirroring config for UI gating.

### 4. Jackpot & free spins (compatibility)

- **Jackpot:** Still **`process_jackpot_for_spin(total_bet, is_free_spin, …)`** once per paid spin **after** final grid evaluation — hold/nudge must **not** cause a second contribution in the same request.
- **Free spins:** Wild/scatter/bonus logic unchanged; held columns must not break wild position reporting.

---

## Frontend (`static/`)

1. **Session id** — generate/persist **`client_session_id`**; attach to every spin request.
2. **Hold UI** — per-column toggle (only enabled on paid spin path when `HOLD_FEATURE_ENABLED` from config); show “Held” state on columns that will carry over; disable illegal patterns (e.g. all five held).
3. **Nudge UI** — if `nudge_sequence` is chosen client-side: either **step wizard** (one button press per nudge remaining) or pre-select sequence before spin — product choice; spec should pick one during implementation to keep UX testable.
4. **Info modal** — new subsection **Hold & Nudge**: plain-language rules, session reset on server restart, free-spin exclusion (if adopted).
5. **Visual feedback** — brief highlight on columns that were held or nudged after the result returns (reuse existing highlight timing patterns where possible).

---

## Testing

| Layer | Requirement |
| ----- | ----------- |
| **Unit** | Hold merge with partial columns; nudge transform on edge cases (bonus forbidden reels); “cannot hold all reels”; nudge count cap. |
| **Unit** | Session store: first spin no hold; second spin with hold reproduces frozen symbols from server memory, not client payload. |
| **Integration** | `execute_spin` with holds + nudges still produces valid `spin_result` dimensions and passes `check_winning_combinations` without regression on baseline spins (no hold, no nudge). |
| **API** | Request/response shapes; 400 on malformed column indices. |
| **Regression** | Phases 4–8 tests still pass; paid vs free spin behavior for jackpot unchanged when features off. |

---

## Decisions log

_Recorded during implementation._

| Topic | Options | Decision |
| ----- | -------- | -------- |
| Nudge semantics | A) Shift column + draw one new cell; B) Full column re-roll per nudge | **A — shift + fill.** Top ← old middle, middle ← old bottom, bottom ← new symbol drawn from the legal per-reel pool. Implemented in `apply_nudge_to_column` in `slot_machine/reel_actions.py`. |
| Free spins | Holds/nudges disabled vs enabled with stricter caps | **Disabled on free spins** (both hold and nudge). API returns 422 if hold/nudge fields are sent with `is_free_spin: true`. Keeps Phase 7 mental model intact. |
| Nudge UX | Per-step on server vs client sends full `nudge_sequence` in one POST | **Client sends full `nudge_sequence` in one POST.** Atomic / idempotent per the spec's "Idempotency" requirement. Players pre-queue up to `MAX_NUDGES_PER_PAID_SPIN` column nudges via the UI before clicking SPIN. |
| Session id | Required vs optional (optional = hold silently disabled) | **Optional.** If absent the hold request is silently ignored with `hold_rejected_reason: "no_session_id"`. No 4xx error so existing clients without session IDs keep working. |

---

## References

- `specs/roadmap.md` — Part I, Phase 9: Nudge and Hold Features.
- Spin pipeline: `slot_machine/game.py`, `slot_machine/core.py`, `slot_machine/jackpot.py`, `main.py`.
- Prior patterns: Phase 7 (free spin flags), Phase 8 (single jackpot resolution per paid spin).
