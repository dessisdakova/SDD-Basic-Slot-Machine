# Winning payline highlights (SPA)

## Highlight winning payline segments in the SPA

As a player, I want the grid and line markers to show which parts of which paylines won, so that I can see why I was paid without reading raw numbers alone.

## Acceptance criteria

### UI (or equivalent)

1. After configuration load, the client keeps a map of **line id → list of `(row, column)`** cells matching `winning_lines_config` from `GET /game/configuration` (same geometry the server uses).
2. After a successful spin, when the response includes a non-empty `winning_lines` object, the client **dims** non-winning cells (or equivalent visual de-emphasis) and **highlights** payline wins: for each winning line id and associated **match count**, only the **first N cells** along that line’s path receive payline win styling, where **N** equals the match count returned for that line (so a 3-of-a-kind lights three cells, not the full five-cell path).
3. For each winning line id, the corresponding **line indicator** (sidebar marker) is shown in an active state for that spin’s result presentation.
4. When multiple lines win on the same spin, highlights and active indicators reflect **all** returned winning lines simultaneously (no silent dropping of secondary lines).
5. On the next spin or UI reset path, previous payline highlight classes and active indicators are cleared before applying new spin results, so stale highlights do not persist.

### Backend (or API, or equivalent)

1. Each entry in `winning_lines` on a successful `POST /game/spin` response uses **line ids** consistent with `winning_lines_config` keys and values that are **integer match counts** (3, 4, or 5 for standard line wins), so the client can implement the “first N cells” rule without guessing.

## Technical notes

- Row-major cell indexing in the DOM uses `gridIndex = row * reelsCount + col` with `reelsCount` from configuration. Changing `ROWS`/`REELS` requires this mapping to stay aligned with `spin_result` layout.
- The same highlight routine may run alongside scatter or bonus styling in richer outcomes; Phase 2 acceptance is satisfied when **payline** wins alone still behave as above.

## References

- `specs/phase_2_complex_winning_lines.md`
- `static/script.js`
- `static/index.html`
- `main.py`
- `slot_machine/core.py`
- `slot_machine/constants.py`

## Missing requirements

### Gaps versus specification

- None for the requirement that the frontend can highlight wins using `winning_lines_config` plus per-spin `winning_lines` counts.

### Implementation quality

- None identified for the payline-highlight path specifically.

## Spec and code disagreement

- None for the relationship between API `winning_lines_config`, spin `winning_lines`, and the highlight logic described above.
