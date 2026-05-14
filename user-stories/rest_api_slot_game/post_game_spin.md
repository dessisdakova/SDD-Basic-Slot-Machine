# REST API for slot game

## Execute a spin with client-supplied balance (stateless)

As a client application, I want to send my current balance, line count, and per-line bet to the server and receive an authoritative spin outcome and new balance, so that I can play without server-side wallet persistence (Phase 1 statelessness).

## Acceptance criteria

### Backend (or API, or equivalent)

1. A client can call `POST /game/spin` with a JSON body containing `balance` (positive integer), `lines` (integer from 1 through `max_lines` inclusive), and `bet` (integer from `min_bet` through `max_bet` inclusive) and receive `200` with a body that includes at minimum: `spin_result` (row-major symbol grid), `winnings`, `winning_lines`, `total_bet`, and `new_balance` consistent with deducting the total bet on paid spins and applying returned winnings (and any other server-side adjustments encoded in the engine).
2. If the total cost of the spin exceeds the supplied `balance` on a paid spin, the API responds with `400` and a `detail` message that explains insufficient funds (plain string or validation structure per FastAPI).
3. If `lines` or `bet` are outside allowed ranges, or `balance` is not a positive integer, the API responds with an error status (typically `422` for schema validation or `400` for engine rules) and does not return a successful spin payload.
4. Malformed JSON or missing required fields results in an error response rather than a silent success.

## Technical notes

- Request validation uses Pydantic on `SpinRequest` in `main.py`; business rules (for example insufficient balance) raise `ValueError` and are mapped to HTTP 400.
- The engine entry point is `execute_spin` in `slot_machine.game`; optional fields on the request (free spin, session id, hold columns) exist for later phases but are not required for the Phase 1 happy path.

## References

- `specs/phase_1_web_interface.md`
- `main.py`
- `slot_machine/game.py`
- `slot_machine/constants.py`

## Missing requirements

### Gaps versus specification

- None for the Phase 1 fields named in the phase document (`spin_result`, `winnings`, `winning_lines`, `total_bet`, `new_balance`). Extra response fields are additive.

### Implementation quality

- None required for this story beyond keeping validation and error mapping consistent when constants change.

## Spec and code disagreement

- The phase document shows a minimal spin response. The implementation returns additional fields produced by later features (for example scatter breakdown, bonus flags, free spins, jackpot pool and win flags, hold metadata). Clients should treat unknown keys as optional.
- The phase diagram implies a 3×3 grid; the actual `spin_result` dimensions follow `rows` and `reels` from configuration (currently five columns).
