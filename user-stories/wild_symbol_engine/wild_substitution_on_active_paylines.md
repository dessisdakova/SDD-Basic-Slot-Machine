# Wild symbol engine

## Wild substitution on active paylines

As a player, I want wilds to stand in for regular symbols when completing a left-to-right run on a line I bet, so that near-miss lines can still pay when a wild bridges the match.

## Acceptance criteria

### Backend (or API, or equivalent)

1. For each active payline (lines **1** through the player’s `lines` value), symbols are read in **path order from the first reel column toward the last**, consistent with Phase 2 geometry.
2. The engine chooses a **line target symbol** by scanning those positions **left to right** and selecting the **first** symbol that is **not** the wild, **not** the scatter, and **not** the bonus symbol; that symbol is the paying target for the run (when one exists).
3. Starting again from the **first reel** position on the path, the engine counts **consecutive** positions where the cell is either **exactly the target** or **the wild**, and **stops** the run at the first position that matches neither (so a mismatched standard symbol ends the run; scatter or bonus on the path typically breaks unless they match the chosen target, which they do not for standard targets).
4. If the run length is **at least 3**, line winnings include **multiplier × line bet** using the **target symbol’s** multiplier row at that run length; the result records the winning line id together with the run length for downstream consumers (for example UI highlights).
5. If every position on the path is wild, or only wild/scatter/bonus appear such that **no standard target** is found, the engine treats the line as a **pure wild** case: the payout key used for multiplier lookup is the **wild symbol’s own** multiplier row (not an unrelated symbol’s row).

## Technical notes

- Free-spin awarding from global wild counts is evaluated in the same function but is **Phase 7** scope; this story’s acceptance is about **payline substitution and run counting** only.

## References

- `specs/phase_4_wild_symbols.md`
- `specs/phase_2_complex_winning_lines.md`
- `slot_machine/core.py`
- `slot_machine/constants.py`
- `slot_machine/game.py`

## Missing requirements

### Gaps versus specification

- Phase 4 does not define how **scatter** or **bonus** symbols on a payline interact with wild-led runs; the implementation excludes them from becoming the **target** and they **break** consecutive matching unless they equal the target (they will not for normal standard targets). If product intent differs, extend Phase 4 or a cross-cutting spec.

### Implementation quality

- None identified beyond keeping the target-selection and consecutive loop aligned if new “special” symbol types are added.

## Spec and code disagreement

- Phase 4 states that a line of **only wilds** should pay as the **highest-paying standard symbol (♠)**. The implementation instead sets the payout key to **`WILD_SYMBOL`** and uses **`SYMBOLS_AND_MULTIPLIERS[WILD_SYMBOL]`**, which can differ numerically from the spades row. The in-app rules copy also speaks of “highest multiplier” for pure wild lines without naming ♠. Stakeholders should pick either **spades-equivalent pay** or **dedicated wild paytable** and align spec, engine, and UI copy.
