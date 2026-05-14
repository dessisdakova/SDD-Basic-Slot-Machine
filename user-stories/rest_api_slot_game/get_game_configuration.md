# REST API for slot game

## Expose game configuration for clients

As a frontend or API consumer, I want to retrieve authoritative game limits, grid dimensions, symbols, and payline definitions in one request, so that I can build inputs and displays that stay aligned with the server.

## Acceptance criteria

### Backend (or API, or equivalent)

1. A client can call `GET /game/configuration` and receive JSON with at least: `max_lines`, `min_bet`, `max_bet`, `rows`, `reels`, `symbols` (ordered list of symbol identifiers), and `winning_lines_config` (payline id to list of `(row, column)` coordinates).
2. Values for `max_lines`, `min_bet`, and `max_bet` match the same constants the server uses to validate spins (no looser or tighter limits in this endpoint than in spin validation).
3. The response is valid JSON on success (no server error for a normal GET with default game constants).

## Technical notes

- The handler lives on the FastAPI app alongside static mounting; configuration is assembled from `slot_machine.constants` and related modules (for example jackpot pool for display).
- Later-phase fields may be present on the same payload; consumers that only need Phase 1 data should still read the core keys above.

## References

- `specs/phase_1_web_interface.md`
- `main.py`
- `slot_machine/constants.py`
- `slot_machine/jackpot.py`

## Missing requirements

### Gaps versus specification

- None for the core Phase 1 contract (limits, dimensions, symbols, winning lines). The phase document’s JSON example is illustrative only.

### Implementation quality

- None identified for this endpoint in isolation.

## Spec and code disagreement

- The phase example shows `reels: 3`, `max_lines: 5`, and `max_bet: 100` with letter symbols `A`–`D`. The running game uses whatever is defined in `slot_machine.constants` (currently a 5-reel grid, `MAX_LINES` of 10, `MAX_BET` of 10, and the symbol set defined there), and `GET /game/configuration` returns those real values plus additional keys (multipliers, scatter, bonus, jackpot, feature flags, hold limits) that are not listed in the Phase 1 snippet.
