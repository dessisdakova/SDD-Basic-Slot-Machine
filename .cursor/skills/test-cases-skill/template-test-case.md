# <Test case title> [smoke]

Put `[smoke]` or `[reg]` after the title (not in the filename).

## User story

Path relative to the repository root.

- `user-stories/<epic_folder>/<story_file>.md`

## Maps to acceptance criteria

Numbered item(s) from the story this case satisfies (for example `UI — 1` or `Backend (or API) — 2`). If one sequence covers several ACs, list each number and one short reason.

## Preconditions

Bullets only. Use only when something differs from the default: browser open, local demo app, player has deposited and can play. If there are none beyond that, omit this entire section.

## Steps

Numbered list. Each item is **one short action** (imperative: “Click …”, “Enter …”, “Send GET …”).

When something must be checked **right after** that action, add **indented sub-bullets** under that step. Start each sub-bullet with **Verify** or **Confirm** and state the observable check in one short line.

1. Click on the **info** control.
    - Verify the modal is opened.
2. Click once on the **outside** backdrop area.
    - Verify the info layer is closed.
3. ...

Do not write long narrative paragraphs in Steps. Do not repeat the full end-state here if it belongs in **Expected result**—use sub-bullets only for checks tied to the step just above.

## Expected result

Final outcome only—what must be true when the case is done. Use **short declarative sentences**, **one per line** (not a single paragraph). Bold key UI labels or values only when it helps readability.

The info layer is closed.
The **main game** is **fully visible and interactive** again.

For Backend/API criteria: one line per fact (for example status code, then one line per JSON field or rule).

## Notes

Optional. Use for slot-outcome caveats or implementation reminders for automation. Omit this section if not needed.
