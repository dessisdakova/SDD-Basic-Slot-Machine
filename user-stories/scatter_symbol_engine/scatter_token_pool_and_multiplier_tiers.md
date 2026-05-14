# Scatter symbol engine

## Scatter token, pool weight, and multiplier tiers

As a game designer, I want a single scatter identity with defined rarity and published total-bet multipliers, so that scatter payouts stay tunable from constants and match the Phase 5 payout table.

## Acceptance criteria

### Backend (or API, or equivalent)

1. The codebase defines exactly **one** scatter token constant (`SCATTER_SYMBOL`) matching the product diamond glyph used everywhere symbols are referenced.
2. The scatter participates in the reel-generation symbol pool with a **finite per-reel draw** model such that **at most one** scatter can be produced on a single reel during generation (supporting the “at most once per reel” constraint from the phase spec).
3. Tiered scatter multipliers are stored in a single map keyed by **minimum scatter count** thresholds **3**, **4**, and **5**, with multiplier values **2**, **10**, and **50** respectively for those tiers (multipliers apply against **total bet**, evaluated in the separate payout story).
4. `GET /game/configuration` exposes `scatter_symbol` and `scatter_multipliers` (or equivalent) so clients can render help and tables without hard-coding the diamond or tier numbers.

## Technical notes

- `SCATTER_MULTIPLIERS` in `slot_machine/constants.py` is serialized in `main.py` with string keys for JSON consumers; keep engine keys and API serialization aligned.

## References

- `specs/phase_5_scatter_symbols.md`
- `slot_machine/constants.py`
- `slot_machine/core.py`
- `main.py`

## Missing requirements

### Gaps versus specification

- None for symbol identity, tier values **2 / 10 / 50 × total bet**, and “single scatter type” versus the Phase 5 document.

### Implementation quality

- None identified for constants and configuration exposure alone.

## Spec and code disagreement

- None for the numeric tier table versus `specs/phase_5_scatter_symbols.md`.
