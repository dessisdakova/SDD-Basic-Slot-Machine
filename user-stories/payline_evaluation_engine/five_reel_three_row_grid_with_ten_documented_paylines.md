# Payline evaluation engine

## Five-reel three-row grid with ten documented paylines

As a game operator, I want the reel layout and all published payline paths fixed to the Phase 2 definition, so that payouts and UI previews stay consistent across the API and the engine.

## Acceptance criteria

### Backend (or API, or equivalent)

1. The engine’s physical grid dimensions are **3 rows** and **5 reels** (width five, height three), matching the Phase 2 “5×3 grid” description.
2. The server defines **exactly ten** paylines keyed **1** through **10**, each as an ordered list of **five** `(row, column)` coordinates with columns **0–4** and rows **0–2**.
3. For each line id **1** through **10**, the coordinate sequence matches the Phase 2 specification: horizontal top/middle/bottom, V-shape, inverted V, hump, dip, zig-zag top, zig-zag bottom, and staircase, in that numbering order.
4. `GET /game/configuration` includes `winning_lines_config` whose contents match the same payline definitions the spin engine uses (so the SPA and any other client cannot drift from server geometry).

## Technical notes

- Canonical paths live in `WINNING_LINES` inside `slot_machine/constants.py` and are re-exported through `main.py` as `winning_lines_config`. Tuple versus JSON list representation is an encoding detail only; semantic coordinates must match.

## References

- `specs/phase_2_complex_winning_lines.md`
- `slot_machine/constants.py`
- `main.py`
- `slot_machine/core.py`

## Missing requirements

### Gaps versus specification

- None. The current `WINNING_LINES` entries align with the coordinate tables in the Phase 2 document.

### Implementation quality

- None identified for static payline definitions beyond routine maintenance when intentionally changing layouts.

## Spec and code disagreement

- None. `ROWS`, `REELS`, and the ten `WINNING_LINES` paths in code match the Phase 2 specification as written.
