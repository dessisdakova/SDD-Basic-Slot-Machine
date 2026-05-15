# Writing User Story

Writing detailed user stories from phase specifications and application code. Use US English.

## Description

When the user asks to create or write user stories for a phase, scope work to **that phase only**. Use `specs/phase_<n>_*.md` for the requested phase as the detailed source of truth. Files such as `specs/mission.md`, `specs/roadmap.md`, and `specs/tech-stack.md` are **overview** context; read them only if they help interpret the phase, not as a substitute for the phase file.

Create **one epic folder per major feature area** named in **snake_case** from the epic title (no maximum number of epics per phase). Inside each epic folder, write **one Markdown file per user story**.

**Out of scope** for dedicated sections or fields: non-functional requirements as a separate backlog discipline, priority, Definition of Ready / Done, and sizing. Mentioning those topics in passing inside narrative, AC, or Technical Notes is allowed when it helps clarity.

**Do not** use `tests/` or test files as sources for deriving stories; stories come first in your workflow, followed by functional Markdown test cases (see `.cursor/skills/test-cases-skill/`) and optional Playwright automation.

## Instructions

1. Read `specs/phase_<n>_*.md` for the phase number the user requests (for example phase 1 → `specs/phase_1_*.md`).
2. Analyze **application** implementation relevant to that phase. Start from `slot_machine/`, `static/`, and `main.py`, then follow imports and behavior in the rest of the repository **excluding** `tests/` and typical `*test*` / `*_test.py` sources.
3. Derive **epics** as one folder per major feature area (snake_case epic title). Path pattern: `user-stories/<epic_folder>/`.
4. If an epic folder already exists, add or update story files there. If a story file already exists with the same name, **overwrite** it.
5. For each user story, create one `.md` file. **Filename** = the story title in **snake_case** only (for example `endpoint_for_game_configuration.md`, `scatter_win_logic.md`). Use US English for titles and body copy.
6. Follow [template-user-story.md](./template-user-story.md) for structure.
7. **Acceptance criteria**: numbered bullets only. Include negative paths and edge cases where they matter. If one story spans UI and backend behavior, use **two AC groups** in the same file (see template) instead of splitting into separate BE/UI story files.
8. **Technical Notes**: implementation hints only—short overview for the developer, highlighting tricky or new areas. Not a second AC list.
9. **References**: list only **spec** and **application code** files that substantiate the story. **Do not** list test files or `tests/`. Use paths **relative to the repository root** (for example `specs/phase_1_web_interface.md`, `slot_machine/game.py`), not machine-absolute paths.
10. **Missing requirements**: use the template section with **both** subheadings—gaps versus the phase specification and implementation-quality gaps—when applicable.
11. **Spec and code disagreement**: when the phase spec and the implementation do not match, document it in the template section. Prefer stating **what the spec calls for** and **what the code does** in plain language so the reader can decide next steps.
12. **Test case references**: when functional test case Markdown files are added or updated for this story (typically under `test_cases/<epic_folder>/` by the test-cases skill), add or refresh the **Test case references** section in this story file with one bullet per case, path relative to the repository root. Remove bullets for deleted cases.

## Practices

- Persona, goal, benefit: use the form “As a …, I want …, so that …”.
- Keep stories small and focused; use simple, testable language in AC.
