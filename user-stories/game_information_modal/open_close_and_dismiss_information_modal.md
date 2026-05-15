# Game information modal

## Open, close, and dismiss information modal

As a player, I want a clear way to open and close the rules and payouts panel without leaving the page, so that I can read help when I need it and return to play quickly.

## Acceptance criteria

### UI (or equivalent)

1. From the main slot screen, the player can open the information experience with a dedicated control: an info icon on the top right of the slot modal.
2. When open, the information layer appears above the game (overlay), shows a readable panel titled for rules and payouts, and blocks accidental interaction with the main game until dismissed.
3. The player can close the layer using an explicit close control on the panel - an X icon.
4. Clicking the dimmed backdrop **outside** the panel content closes the layer the same way as an explicit close, so the player is not trapped.
5. After closing, the main game is fully visible and interactive again with no leftover modal-only styling on the main layout.

## Technical notes

- Visibility is toggled with paired `hidden` / `flex` classes on `#info-modal`; keep open and close paths symmetric so rapid open/close does not desync state.

## References

- `specs/roadmap.md`
- `static/index.html`
- `static/script.js`

## Test case references

- `test_cases/game_information_modal/information_modal_opens_from_icon_and_shows_overlay_panel.md`
- `test_cases/game_information_modal/information_modal_closes_with_panel_close_control.md`
- `test_cases/game_information_modal/information_modal_closes_when_clicking_outside_panel.md`
