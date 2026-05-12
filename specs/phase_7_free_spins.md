# Specification: Phase 7 - Free Spins

## Goal & Scope
Introduce a "Free Spins" feature triggered by landing multiple Wild symbols. This phase aims to enhance player engagement by providing bonus rounds without deducting from the player's balance.

## Trigger Condition
- The Free Spins feature is triggered when 3 or more `WILD_SYMBOL` (🌟) symbols appear anywhere on the grid in a single spin.

## Award
- The number of Free Spins awarded will depend on the number of `WILD_SYMBOL`s that triggered the feature:
    - 3 Wild Symbols: 5 Free Spins
    - 4 Wild Symbols: 7 Free Spins
    - 5 Wild Symbols: 9 Free Spins
    - 6 Wild Symbols: 11 Free Spins
    - 7 Wild Symbols: 13 Free Spins
    - 8 Wild Symbols: 15 Free Spins
    - 9 Wild Symbols: 17 Free Spins
    - 10 Wild Symbols: 19 Free Spins
    - 11 Wild Symbols: 21 Free Spins
    - 12 Wild Symbols: 23 Free Spins
    - 13 Wild Symbols: 25 Free Spins
    - 14 Wild Symbols: 30 Free Spins
    - 15 Wild Symbols: 50 Free Spins
- Free spins are the same as paid spins but they not take from the player's balance.
- If both free spins and bonus game are tiggered during the same spin, first initialize the bonus game, then the free spins.
- Wild symbols that trigger tfree spins also act as substitutes for other symbols and pay the respective lines.

## Backend Changes (Python)

### 1. `slot_machine/constants.py`
- Add a new dictionary `FREE_SPINS_CONFIG` to map the number of Wild symbols to the corresponding number of free spins.

### 2. `slot_machine/core.py`
- Modify the `check_winning_combinations` function to:
    - Count the number of `WILD_SYMBOL`s present on the grid.
    - Determine the number of free spins to award based on `FREE_SPINS_CONFIG`.
    - Return the `free_spins_awarded` as part of its result tuple.

### 3. `slot_machine/game.py`
- Update the `execute_spin` function to:
    - Accept an optional `is_free_spin` boolean parameter (defaulting to `False`).
    - If `is_free_spin` is `True`, the `total_bet` should NOT be deducted from the `balance`.
    - Include the `free_spins_awarded` in the API response.

### 4. `main.py` (FastAPI Endpoint)
- Modify the `/game/spin` endpoint to:
    - Accept the `is_free_spin` parameter in the request body.
    - Pass this parameter to `execute_spin`.
    - Return the `free_spins_awarded` from the `execute_spin` result in the API response.

## Frontend Changes (JavaScript)
- Introduce a global variable `freeSpinsRemaining` to track the number of free spins.
- When `free_spins_awarded` is received from the backend:
    - Increment `freeSpinsRemaining`.
    - Display a clear indicator in the UI showing the current number of free spins.
- If `freeSpinsRemaining > 0` after a spin (and no bonus game was triggered):
    - Automatically trigger the next spin after a short delay (e.g., 2 seconds).
    - The `handleSpin` function should be updated to send `is_free_spin: true` in the request body when performing a free spin.
- Update the informational modal (`#general-rules-content`) to include rules for triggering free spins.
```