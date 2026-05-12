# Specification: Phase 6 - Bonus Symbols & Mini-Games

## Goal & Scope
Introduce a "Bonus" symbol that triggers an interactive mini-game, providing players with a chance to win significant mystery prizes outside of standard reel play.

## Mechanics
- **Bonus Symbol:** Represented by "🎁" (Gift).
- **Trigger:** Awarded when 3 "🎁" symbols appear on 2nd, 3rd and 4th reel.
- **Interaction Flow:** 
    - Upon triggering, standard payline and scatter winnings are processed first.
    - A "Bonus Game" overlay automatically appears.
    - The player is presented with three interactive "Mystery Chests".
    - The player clicks one chest to reveal a hidden prize.
- **Prize Pool:**
    - The revealed prize is a multiplier applied to the **Total Bet** of the triggering spin.
    - Available multipliers: 10x, 25x, 200x.

## Constraints
- **Frequency:** Bonus symbols can appear at most once per 2nd, 3rd and 4th reel (max 3 per spin).
- **Substitution:** Bonus symbols cannot be substituted by Wild symbols ("🌟").
- **Payouts:** Bonus symbols do not have a direct payout on the grid; they only trigger the feature.

## Implementation Plan
1.  **Constants:** Add `BONUS_SYMBOL` and `BONUS_MINI_GAME_PRIZES` to `constants.py`.
2.  **Core Logic:** Update `check_winning_combinations` in `core.py` to detect if the mini-game is triggered.
3.  **API:** Update the `/game/spin` response to include a `bonus_triggered` flag.
4.  **UI:** 
    - Create a new "Bonus Modal" in `index.html`.
    - Implement the "Pick-a-Prize" logic in `script.js`.
    - Add visual feedback for opening the chests.
    - Ensure the prize is added to the balance before returning to the main game.
