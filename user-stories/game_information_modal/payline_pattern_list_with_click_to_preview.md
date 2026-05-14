# Game information modal

## Payline pattern list with click-to-preview

As a player, I want to browse each numbered payline and see its path on a small grid, so that I can learn how each line snakes across the reels.

## Acceptance criteria

### UI (or equivalent)

1. The information modal includes a **Winning Paylines** section that lists every active payline id from **1** through the configured `max_lines`, with a human-readable label per line (for example “Top Horizontal,” “V-Shape”).
2. A compact preview grid is shown with one cell per board position (`rows × reels`); cells start in a neutral state.
3. When the player selects a payline entry (for example by clicking a row in the list), the preview grid highlights exactly those cells whose coordinates appear in `winning_lines_config` for that line id, and the selected list row is visually distinguished from others.
4. On first population after configuration load, a sensible default line (for example line **1**) is selected so the preview is not empty.
5. Copy in the section states that wins on paylines are evaluated **left to right** (or equivalent plain language), matching the engine rule players rely on.

### Backend (or API, or equivalent)

1. `GET /game/configuration` includes `winning_lines_config` mapping each payline id to an ordered list of `(row, column)` pairs consistent with `slot_machine.constants.WINNING_LINES`, so the preview cannot drift from spin evaluation geometry.

## Technical notes

- Preview dot count must follow `config.rows * config.reels`; highlight index uses `row * reelsCount + col` with `reelsCount` from configuration, matching the main slot grid indexing convention.

## References

- `specs/roadmap.md`
- `specs/phase_2_complex_winning_lines.md`
- `static/script.js`
- `static/index.html`
- `main.py`
- `slot_machine/constants.py`

## Missing requirements

### Gaps versus specification

- None for the roadmap’s “winning line patterns” requirement when interpreted as list + visual path. Line **names** are client-side labels and are not specified in `specs/phase_2_complex_winning_lines.md`.

### Implementation quality

- None identified for the click-to-preview interaction itself.

## Spec and code disagreement

- Payline friendly names in the list are authored in the client and may not match marketing names elsewhere; only coordinates are authoritative via `winning_lines_config`.
