# Writing test cases

Writing **functional** test cases from user stories in Markdown. The cases are written for **human QA** first; automation with **Python and Playwright** is done manually later. Use US English.

## Description

When the user asks to create or write test cases and provides a **user story** in context, scope **that story only**. Produce clear, atomic cases that map to acceptance criteria. **API and unit tests as automation deliverables are out of scope** (no separate API/unit test suites); for stories with **Backend (or API)** acceptance groups, the **written** expected results still describe **HTTP status and JSON fields**—the user story is the source of truth for those cases (Playwright can assert via `request` or UI that reflects the response).

Environment assumptions for this demo: **local machine**, **single-page UI**, **stateless** session (no persistence, teardown, or saved-state scenarios). Do not add sections for production URLs, parallel runs, locator strategy, BDD/Gherkin, or extra automation metadata unless the user asks.

## Steps and expected result format (required)

Use **checklist-style** steps with **inline verification**—not long prose instructions.

### Steps

- **Numbered list** only. Each number is **one action**: a short imperative sentence (for example “Click on the **info** control.”, “Set bet to the minimum.”).
- **One main action per step.** Keep each action line to about one sentence.
- **Indented sub-bullets** under a step when the reader must **check something immediately after** that action. Each sub-bullet starts with **Verify** or **Confirm** and states one observable fact (for example “Verify the modal is opened.”).
- Put **step-tied checks** in sub-bullets. Put **overall end-state** in **Expected result** (see below). Do not duplicate the same check in both places unless the story needs it for clarity.
- Assume the browser is already open on the local app and the player can play (deposit if needed). Do not open with “Open the game in the browser…” unless the case truly starts elsewhere.
- Number steps sequentially (1, 2, 3—no gaps).

**Example (UI):**

```markdown
## Steps

1. Click on the **info** control.
    - Verify the modal is opened.
2. Click once on the **outside** backdrop area.
3. Try a normal main-game control (for example change bet or spin).
```

### Expected result

- **Final outcome only**—what must be true when all steps are done.
- **Short declarative sentences**, **one per line** (blank line between groups is optional; do not use a single long paragraph).
- Bold **control names** or key values sparingly, same as in Steps.
- For **Backend/API** ACs: one line for HTTP status, then one line per JSON field or response rule (API is the source of truth).

**Example (UI):**

```markdown
## Expected result

The info layer is closed.
The **main game** is **fully visible and interactive** again, with **no** leftover overlay-only appearance.
```

Reference implementation for this style: `test_cases/game_information_modal/information_modal_closes_when_clicking_outside_panel.md`.

## Instructions

1. Read the user story from context (path under `user-stories/`).
2. Derive the **epic folder name** from the story path: `user-stories/<epic_folder>/<story_file>.md` → use the same `<epic_folder>` under `test_cases/`.
3. Create **one `.md` file per test case** under `test_cases/<epic_folder>/`. **Filename** = short case title in **snake_case** only (omit `[smoke]` / `[reg]` from the filename). Example: `spin_deducts_correct_bet_amount_from_players_balance.md`.
4. **Coverage:** Create at least **one test case per numbered acceptance criterion**, including **negative and edge** cases implied by that AC. **Exception:** When several ACs are verifiable with **one identical sequence** of steps (same order, same starting state), use **one** test case and state in **Maps to acceptance criteria** which numbers it covers.
5. **Classification:** Each case is **smoke** or **regression**. Put it in the Markdown **title** after the title text: `[smoke]` or `[reg]`.
6. **Voice:** Plain language for a non-technical reader. No selectors, waits, or assertion APIs—the QA owner decides those when automating.
7. **UI stories:** Describe what the player sees or can do, not DOM attributes.
8. **Backend/API acceptance items:** Expected result lines for status and JSON fields per the story.
9. **Initial state:** Default is browser open, local app, deposited and ready to play; use **Preconditions** only when something differs.
10. **Slot randomness:** Do not require exact symbols or jackpots; focus on validation, balance math, messages, and UI matching the server response for that spin.
11. Follow [template-test-case.md](./template-test-case.md) for structure and the **Steps / Expected result** format above.
12. **Update the user story file:** After creating or changing test case files, add or refresh **Test case references** on the story (paths relative to the repository root).

## Practices

- Reuse the epic’s snake_case folder; keep filenames stable.
- Prefer “Click **Spin**.” + “Verify the balance decreased by the total bet.” over one long step that mixes setup, action, and every assertion.
- Expected result: one fact per line; easy to scan as a pass/fail checklist at the end.
