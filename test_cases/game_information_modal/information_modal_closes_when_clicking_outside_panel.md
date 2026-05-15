# Information modal closes when clicking outside panel [reg]

## User story

- `user-stories/game_information_modal/open_close_and_dismiss_information_modal.md`

## Maps to acceptance criteria

- UI — 4  
- UI — 5 (recovery after closing via backdrop)

## Steps

1. Click on the **info** control.
    - Verify the modal is opened.
2. Click once on the **outside** backdrop area (not on the panel body or **X**).
    - Verify the info layer is closed.
3. Try a normal main-game control (for example change bet or **Spin**).

## Expected result

The info layer is closed.
The **main game** is **fully visible and interactive** again, with **no** leftover overlay-only appearance.

## Notes

If outside-click does not close help on your build, log a gap against UI — 4.
