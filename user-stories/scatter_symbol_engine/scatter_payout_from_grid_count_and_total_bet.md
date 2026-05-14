# Scatter symbol engine

## Scatter payout from grid count and total bet

As a player, I want scatter wins based on how many diamonds appear anywhere on the grid, paid as a multiple of my total stake, without replacing or stacking lower tiers, so that scatter behaves independently of paylines.

## Acceptance criteria

### Backend (or API, or equivalent)

1. After each resolved spin grid (full **rows × reels** layout), the engine counts every cell equal to **`SCATTER_SYMBOL`**, producing a non-negative **scatter count** and a list of **scatter positions** (`[row, column]` pairs) for that spin.
2. If the scatter count is **below 3**, **no** scatter dollar payout is awarded for that spin (scatter winnings amount is zero, and callers may still return positions for observability if desired, but payout remains zero).
3. If the scatter count is **3 or more**, scatter winnings equal **M × total bet**, where **total bet** is **`lines × bet per line`** for that spin request, and **M** is the multiplier from the **highest** tier whose threshold is still satisfied by the count (for example **4** scatters use the **4+** tier only, **not** the sum of the 3-scatter tier and the 4-scatter tier).
4. Scatter winnings are **independent of which paylines hit**; they are combined with payline winnings for the spin’s **total returned win dollars** used to update balance (same monetary path as other spin wins, excluding jackpot side effects defined elsewhere).
5. **Wild does not substitute for scatter:** a scatter symbol is never counted as a wild for scatter counting, and scatter symbols on a payline path do not act as wild stand-ins for standard payline targets (they are excluded when choosing the line target and they **break** a wild-led consecutive run unless the line target itself were the scatter, which it is not for standard play).

## Technical notes

- `check_winning_combinations` returns both an aggregate first-slot total that includes scatter for legacy balance math and explicit `scatter_winnings` / `scatter_count` / `scatter_positions` for the API; consumers should treat **`scatter_winnings`** as the canonical scatter dollar component when displaying breakdowns.

## References

- `specs/phase_5_scatter_symbols.md`
- `slot_machine/core.py`
- `slot_machine/constants.py`
- `slot_machine/game.py`

## Missing requirements

### Gaps versus specification

- Phase 5 states a **maximum of five** scatters per spin because of once-per-reel placement; the evaluation logic itself only counts what appears. Maximum-five is enforced by generation (and hold/reel merge paths should preserve the same class of constraint—see `slot_machine/reel_actions.py` when hold is active).

### Implementation quality

- The API field **`winnings`** currently carries **line + scatter** combined from the first tuple element of `check_winning_combinations`, while **`scatter_winnings`** repeats the scatter portion. UI that prints both a total “reels” win and a scatter line can read as **double counting** scatter dollars; clarify field semantics or adjust presentation so players see a single coherent total.

## Spec and code disagreement

- None for tier selection (“highest tier only”), total-bet basis, or independence from paylines versus `specs/phase_5_scatter_symbols.md`.
