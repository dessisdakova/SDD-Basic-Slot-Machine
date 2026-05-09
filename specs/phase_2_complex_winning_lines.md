# Specification: Phase 2 - Complex Winning Lines

## Goal & Scope
Expand the slot machine from a 3x3 grid to a **5x3 grid** (5 reels, 3 rows). This phase introduces tiered payouts for matching 3, 4, or 5 symbols and defines 10 complex paylines.

## Constraints
- Winning combinations are calculated from **left to right**, requiring at least 3 consecutive matching symbols starting from the first reel.
- Multipliers are tiered based on whether 3, 4, or 5 symbols match.
- The frontend should be able to highlight these new winning lines based on the `winning_lines_config` provided by the API.

## Winning Line Patterns (10 Lines)
Each line consists of 5 coordinates `[row, col]`:

1.  **Horizontal Top:** `[[0,0], [0,1], [0,2], [0,3], [0,4]]`
2.  **Horizontal Middle:** `[[1,0], [1,1], [1,2], [1,3], [1,4]]`
3.  **Horizontal Bottom:** `[[2,0], [2,1], [2,2], [2,3], [2,4]]`
4.  **V-Shape:** `[[0,0], [1,1], [2,2], [1,3], [0,4]]`
5.  **Inverted V:** `[[2,0], [1,1], [0,2], [1,3], [2,4]]`
6.  **Hump:** `[[1,0], [0,1], [0,2], [0,3], [1,4]]`
7.  **Dip:** `[[1,0], [2,1], [2,2], [2,3], [1,4]]`
8.  **Zig-Zag Top:** `[[0,0], [1,1], [0,2], [1,3], [0,4]]`
9.  **Zig-Zag Bottom:** `[[2,0], [1,1], [2,2], [1,3], [2,4]]`
10. **Staircase:** `[[0,0], [1,1], [2,2], [2,3], [2,4]]`

## Implementation Notes
- The `WINNING_LINES` dictionary in `slot_machine/constants.py` will be updated to include these new line definitions.
- `SYMBOLS_AND_MULTIPLIERS` will be restructured to store a dictionary of payouts for 3, 4, and 5 matches.
