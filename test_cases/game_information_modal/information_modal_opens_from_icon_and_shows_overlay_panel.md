# Information modal opens from icon and shows overlay panel [smoke]

## User story

- `user-stories/game_information_modal/open_close_and_dismiss_information_modal.md`

## Maps to acceptance criteria

- UI — 1  
- UI — 2 (same open flow: control placement, overlay, panel title, and blocking the main game)

## Steps

1. On the main slot screen, click the **info** icon at the top right of the slot area.
    - Verify the information layer opens.
2. Look at the panel heading and the area around it.
    - Verify the panel title is for **rules and payouts** (or the same idea in your build).
    - Verify a dimmed layer sits above the main game.
3. Without closing help, try a main-game control (for example change **bet** or press **Spin**).
    - Verify the game does not behave as if help were closed (no accidental play through the overlay).

## Expected result

The information experience opens from the dedicated **top-right info** control.
The rules and payouts panel is readable on an overlay above the game.
The main game stays blocked from accidental use while help is open.
