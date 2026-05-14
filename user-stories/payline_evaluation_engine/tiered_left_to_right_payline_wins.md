# Payline evaluation engine

## Tiered left-to-right payline wins

As a player, I want each active payline evaluated left to right with 3-, 4-, or 5-of-a-kind payouts, so that longer runs pay more according to the published multiplier table.

## Acceptance criteria

### Backend (or API, or equivalent)

1. For each active line index from **1** through the number of lines the player bet (`lines`), the engine reads symbols along that line’s path in **column order from reel 0 toward reel 4** (left to right along the path).
2. The engine determines a **paying target symbol** from the first reel positions that participate in a run: the first symbol on the path that is not a wild, scatter, or bonus symbol becomes the target; if every position on the path is wild (or only non-paying specials appear before a wild-led run), the target resolves to the **wild** symbol for payout purposes.
3. Starting from the first reel, the engine counts **consecutive** symbols from the path that **match the target or are wild**; when a non-matching, non-wild symbol is encountered, the run stops at that break.
4. If the run length is **at least 3**, the engine adds **multiplier × bet per line** to line winnings, where the multiplier is taken from the tiered table for that target symbol at run lengths **3**, **4**, or **5**; run lengths beyond 5 still use the **5** tier if defined.
5. If the run length is **below 3**, that payline contributes **no** line win for that spin.
6. Payline evaluation respects the player’s line count: lines with index **greater than** `lines` are not evaluated for wins.

## Technical notes

- Implementation is concentrated in `check_winning_combinations` in `slot_machine/core.py`, using `SYMBOLS_AND_MULTIPLIERS` for `{3, 4, 5}` tiers. Scatter, bonus, and free-spin side effects are evaluated separately on the full grid and are outside the narrow “complex paylines” math, but they coexist in the same function return tuple.

## References

- `specs/phase_2_complex_winning_lines.md`
- `slot_machine/core.py`
- `slot_machine/constants.py`
- `slot_machine/game.py`

## Missing requirements

### Gaps versus specification

- The Phase 2 text does not spell out **wild substitution** or exclusion of **scatter/bonus** from the “first symbol” choice; the running rules follow the implementation above. If the product intent is different, the spec should be updated.

### Implementation quality

- None identified beyond keeping `SYMBOLS_AND_MULTIPLIERS` aligned with design whenever symbols change.

## Spec and code disagreement

- Phase 2 describes only generic “matching symbols” and tiered multipliers; the code additionally treats wild as a substitute, excludes scatter and bonus from becoming the line target, and awards scatter/bonus/free-spin outcomes from the same function. Those behaviors come from later-phase product rules but affect the same spin evaluation path.
