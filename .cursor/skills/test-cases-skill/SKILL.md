# Writing test cases

Writing **functional** test cases from user stories in Markdown. The cases are written for **human QA** first; automation with **Python and Playwright** is done manually later. Use US English.

## Description

When the user asks to create or write test cases and provides a **user story** in context, scope **that story only**. Produce clear, atomic cases that map to acceptance criteria. **API and unit tests as automation deliverables are out of scope** (no separate API/unit test suites); for stories with **Backend (or API)** acceptance groups, the **written** expected results still describe **HTTP status and JSON fields**—the API is the source of truth for those cases (Playwright can assert via `request` or UI that reflects the response).

Environment assumptions for this demo: **local machine**, **single-page UI**, **stateless** session (no persistence, teardown, or saved-state scenarios). Do not add sections for production URLs, parallel runs, locator strategy, BDD/Gherkin, or extra automation metadata unless the user asks.

## Instructions

1. Read the user story from context (path under `user-stories/`).
2. Derive the **epic folder name** from the story path: `user-stories/<epic_folder>/<story_file>.md` → use the same `<epic_folder>` under `test_cases/`.
3. Create **one `.md` file per test case** under `test_cases/<epic_folder>/`. **Filename** = short case title in **snake_case** only (omit `[smoke]` / `[reg]` from the filename). Example: `spin_deducts_correct_bet_amount_from_players_balance.md`.
4. **Coverage:** Create at least **one test case per numbered acceptance criterion**, including **negative and edge** cases implied by that AC. **Exception:** When several ACs are verifiable with **one identical sequence** of steps (same order, same starting state), use **one** test case and state in **Maps to acceptance criteria** which numbers it covers (example: presence of control, clickability, and visible message after an action).
5. **Classification:** Each case is **smoke** or **regression**. Put it in the Markdown **title** after the title text: `[smoke]` or `[reg]` (example: `# Spin deducts correct bet amount from player's balance [smoke]`). Use judgment: smoke = critical path or highest-risk checks; regression = broader or deeper checks.
6. **Voice:** **Steps** and **Expected result** must be understandable to a **non-technical** reader. Do not require implementation details (selectors, waits, exact assertion APIs). The QA owner will decide precise assertions and timing when automating.
7. **UI stories:** Expected results describe **what the player sees or can do** (labels, messages, disabled controls, updated balance, grid content at a high level). Prefer “you cannot spin until …” over “the button has attribute disabled.”
8. **Backend/API acceptance items:** In **Expected result**, state **HTTP status** (or status class if exact code is story-dependent) and **which JSON fields** must be present or what they must mean for the scenario (per the story or phase spec). The API response is the authority for those cases.
9. **Initial state:** Assume the reader opens the browser to the app, **deposits** if needed, and can play. Preconditions only add what **differs** from that default; if nothing differs, omit **Preconditions** per the template.
10. **Slot randomness:** Do **not** require predicting exact symbols or jackpots. Write cases around **limits, validation, balance math, spin-in-flight behavior, messages, and grid/balance updates matching what the server returned** for that spin. If a future case truly needs a fixed outcome, note in **Notes** that automation may need a **controlled response** (for example route interception)—do not block the case on that for the Markdown deliverable.
11. Follow [template-test-case.md](./template-test-case.md) for structure.
12. **Update the user story file:** After creating or changing test case files, edit the story’s **Test case references** section (see [template-user-story.md](../user-story-skill/template-user-story.md)): list every case with a bullet, path **relative to the repository root** (for example `test_cases/web_slot_spa/spin_deducts_correct_bet_amount_from_players_balance.md`). Add the section if missing; keep paths in sync when cases are renamed or removed.

## Practices

- Reuse the epic’s snake_case folder; keep filenames stable and readable.
- Steps: numbered list, **one action per step** where possible; no jargon.
- Prefer outcomes a person can verify (“balance goes down by the amount you bet”) over implementation.
