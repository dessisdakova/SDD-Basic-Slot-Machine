# Game information modal

## Open, close, and dismiss information modal

As a player, I want a clear way to open and close the rules and payouts panel without leaving the page, so that I can read help when I need it and return to play quickly.

## Acceptance criteria

### UI (or equivalent)

1. From the main slot screen, the player can open the information experience with a dedicated control (for example the circular “info” control in the header).
2. When open, the information layer appears above the game (overlay), shows a readable panel titled for rules and payouts, and blocks accidental interaction with the main game until dismissed.
3. The player can close the layer using an explicit close control on the panel (for example the top-right dismiss control).
4. Clicking the dimmed backdrop **outside** the panel content closes the layer the same way as an explicit close, so the player is not trapped.
5. After closing, the main game is fully visible and interactive again with no leftover modal-only styling on the main layout.

## Technical notes

- Visibility is toggled with paired `hidden` / `flex` classes on `#info-modal`; keep open and close paths symmetric so rapid open/close does not desync state.

## References

- `specs/roadmap.md`
- `static/index.html`
- `static/script.js`

## Missing requirements

### Gaps versus specification

- There is no dedicated `specs/phase_3_*.md` file; Phase 3 is described only as a short milestone in `specs/roadmap.md`. Detailed accessibility (focus trap, `aria-modal`, initial focus) is not specified there.

### Implementation quality

- None identified for basic open, close, and backdrop-dismiss behavior.

## Spec and code disagreement

- None for the behaviors listed above; the roadmap does not prescribe exact control placement beyond “UI component,” which the header info button satisfies.
