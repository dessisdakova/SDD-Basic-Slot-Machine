# Information modal closes with panel close control [smoke]

## User story

- `user-stories/game_information_modal/open_close_and_dismiss_information_modal.md`

## Maps to acceptance criteria

- UI — 3  
- UI — 5 (recovery after closing with **X**)

## Steps

1. Click on the **info** control.
    - Verify the modal is opened.
2. Click the **X** close control on the panel.
    - Verify the info layer is closed.
3. Try a normal main-game control (for example change bet or **Spin**).

## Expected result

The info layer is closed.
The **main game** is **fully visible and interactive** again.
There is **no** leftover dimmed overlay or modal-only styling on the layout.
