# Specification: Phase 5 - Scatter Symbols

## Goal & Scope
Introduce a "Scatter" symbol that provides payouts regardless of its position on the paylines. Scatter wins are calculated based on the total number of Scatter symbols visible on the grid after a spin.

## Mechanics
- **Scatter Symbol:** Represented by "💎" (Diamond).
- **Trigger:** A Scatter win is awarded if 3 or more "💎" symbols appear anywhere on the 5x3 grid.
- **Payout Calculation:** 
    - Unlike standard symbols which pay per line bet, Scatter payouts are a multiplier of the **Total Bet** (lines * bet per line).
    - Scatter wins are independent of paylines and are added to any payline winnings.
- **Tiered Payouts:**
    - 3 Scatters: 2x Total Bet
    - 4 Scatters: 10x Total Bet
    - 5 Scatters: 50x Total Bet

## Constraints
- Scatter symbols can appear at most once per reel, meaning a maximum of 5 Scatters can appear on the grid per spin.
- Scatter symbols are **not** substituted by Wild symbols ("🌟").
- Only the highest Scatter payout is awarded if multiple thresholds are met (e.g., 4 Scatters pays the 10x tier, not 2x + 10x).

## Implementation Plan
1.  **Constants:** Define `SCATTER_SYMBOL` and `SCATTER_MULTIPLIERS` in `constants.py`. Add "💎" to `SYMBOLS_AND_COUNT`.
2.  **Core Logic:** Update `check_winning_combinations` in `core.py` to evaluate the entire grid for Scatters.
3.  **UI:** Update the Info Modal to explain Scatter mechanics and ensure Scatter wins are clearly communicated in the UI message area.