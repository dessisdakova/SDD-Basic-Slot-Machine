# Wild symbol engine

## Wild constant, reel weight, and pay table

As a game designer, I want a single wild token with controlled rarity and its own 3/4/5 tier payouts, so that wilds feel special and payline math has concrete multipliers to apply.

## Acceptance criteria

### Backend (or API, or equivalent)

1. The codebase defines exactly **one** wild token constant (`WILD_SYMBOL`) used everywhere the engine, constants, and API-derived symbol lists refer to the wild.
2. The wild participates in reel generation through the same weighted pool mechanism as other symbols, with a **total count in the pool that is strictly lower** than at least one high-frequency standard symbol (for example the common “club” tier), satisfying the product constraint that wilds are **rarer than standard symbols** on average.
3. The pay table structure includes **tiered multipliers for the wild itself** at match lengths **3**, **4**, and **5**, so pure-wild or wild-led runs that resolve to the wild payout key have defined amounts per line bet.

## Technical notes

- Counts live in `SYMBOLS_AND_COUNT`; multipliers live in `SYMBOLS_AND_MULTIPLIERS`. Changing either affects both generation frequency and evaluation.

## References

- `specs/phase_4_wild_symbols.md`
- `slot_machine/constants.py`
- `slot_machine/core.py`

## Missing requirements

### Gaps versus specification

- The Phase 4 document names only **♠ ♥ ♦ ♣** as substitutable “standard” symbols; the live symbol set includes additional standard-like entries in `SYMBOLS_AND_COUNT`. Wild substitution still applies to those symbols in code paths shared with payline evaluation.

### Implementation quality

- None identified for defining the constant and tables alone.

## Spec and code disagreement

- None for rarity and “single wild type” versus the Phase 4 constraints; numeric weights are implementation choices as long as rarity ordering holds.
