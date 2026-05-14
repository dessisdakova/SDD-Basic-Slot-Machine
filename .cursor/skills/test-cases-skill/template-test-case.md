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

Numbered list only. Plain language; one main action per step where possible.

1. ...
2. ...

## Expected result

Plain language for QA. For UI criteria: describe what the player sees or can do. For Backend/API criteria in the story: include HTTP status and JSON fields or response rules; the API is the source of truth.

## Notes

Optional. Use for slot-outcome caveats or implementation reminders for automation. Omit this section if not needed.
