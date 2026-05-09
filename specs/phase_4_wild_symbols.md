# Specification: Phase 4 - Wild Symbols

## Goal & Scope
Introduce a special "Wild" symbol that can substitute for any other symbol in the game to form winning combinations.

## Mechanics
- **Substitution:** The Wild symbol (represented as "🌟") matches any other symbol (♠, ♥, ♦, ♣).
- **Determining the Line Symbol:** 
    - The "target symbol" for a payline is the first non-wild symbol encountered from left to right.
    - If a line consists entirely of Wild symbols, it will be treated as the highest-paying symbol (♠) for payout calculation.
- **Consecutive Matches:** Wilds count towards the consecutive match count (3, 4, or 5) starting from the first reel.

## Constraints
- Wild symbols will be rarer than standard symbols.
- Only one type of Wild symbol will be implemented in this phase.

## Implementation Plan
1.  **Constants:** Define `WILD_SYMBOL` in `constants.py` and add it to the symbol distribution.
2.  **Core Logic:** Update `check_winning_combinations` in `core.py` to handle substitution logic.
3.  **UI:** Ensure the "More Info" modal and the game grid correctly display the new symbol.

## Verification
- Unit tests must cover scenarios where Wilds complete a line of 3, 4, or 5 symbols.
- Unit tests must cover scenarios where multiple Wilds appear in a single line.