# Wild symbol presentation

## Wild symbol on main spin grid

As a player, I want wilds to appear on the main reels like any other outcome, so that I can see when wilds helped or triggered features without digging into the rules modal.

## Acceptance criteria

### UI (or equivalent)

1. After each successful spin, every cell in the main slot grid displays the **exact symbol character** returned by the server in `spin_result`, including the wild glyph when the engine placed a wild in that cell.
2. Wild cells use the **same base cell styling** as other symbols (size, border, typography class) so the grid remains readable; any extra emphasis (for example free-spin trigger styling) follows product rules **without** hiding the underlying wild glyph.
3. When the grid is rebuilt between spins, no stale wild characters remain from a prior spin (the grid content always mirrors the latest `spin_result`).

### Backend (or API, or equivalent)

1. `spin_result` rows contain the same wild string literal the server uses in constants, so the client does not need a separate mapping table for the wild face.

## Technical notes

- The wild emoji must remain consistent between `constants.py`, JSON responses, and font rendering in the browser.

## References

- `specs/phase_4_wild_symbols.md`
- `specs/phase_1_web_interface.md`
- `static/script.js`
- `static/index.html`
- `slot_machine/constants.py`
- `slot_machine/game.py`

## Missing requirements

### Gaps versus specification

- None for “grid correctly displays the new symbol” from the Phase 4 implementation checklist, beyond normal responsiveness and accessibility polish not specified in Phase 4.

### Implementation quality

- None identified for basic rendering.

## Spec and code disagreement

- None for showing the configured wild character on the grid.
