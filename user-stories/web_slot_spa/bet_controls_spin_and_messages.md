# Web slot SPA

## Set lines and bet, spin, and read outcomes

As a player, I want to choose how many lines and how much to bet per line, press spin, and see the reels, winnings, and any errors, so that I can play one turn at a time with clear feedback.

## Acceptance criteria

### UI (or equivalent)

1. The player can edit “lines to bet” and “bet per line” within the limits returned from configuration; out-of-range values are visibly flagged and the spin control stays disabled until both values are valid.
2. While a spin is in flight, the spin control is temporarily disabled to reduce double submissions, and the message area shows a neutral “spinning” (or equivalent) status.
3. On a successful `POST /game/spin` response, the grid updates to match `spin_result`, the balance display updates to `new_balance`, and the message area communicates whether the player won (including amount where applicable) or did not win on that spin.
4. On an error response (for example insufficient balance or validation failure), the message area shows the server’s `detail` (or formatted validation list) in an error style without corrupting balance until a successful spin applies `new_balance`.
5. On transport failure (no response), the message area shows a clear connection error and the player can recover without a full page reload.

### Backend (or API, or equivalent)

1. The same spin request the UI sends must satisfy the API validation rules documented for Phase 1 (`balance`, `lines`, `bet` within bounds).
2. Successful responses must carry enough data for the UI to implement acceptance items in the UI group (at minimum `spin_result`, `winnings`, `new_balance`, and `winning_lines` for highlighting or messaging as designed).

## Technical notes

- Paid versus free-spin behavior in the client is driven by internal counters in `script.js`; Phase 1 scope still includes the basic paid-spin path from deposit through `is_free_spin: false` unless the product intentionally awards free spins from the engine.
- Optional request fields (`client_session_id`, `hold_columns`, `is_free_spin`) are sent by the current client where applicable; the Phase 1 story still holds for the minimal `{ balance, lines, bet }` path.

## References

- `specs/phase_1_web_interface.md`
- `static/script.js`
- `static/index.html`
- `main.py`
- `slot_machine/game.py`

## Missing requirements

### Gaps versus specification

- None for the core loop (configure limits, POST spin, update grid and balance, show errors in the message area).

### Implementation quality

- None required for this story beyond keeping client-side limits in sync with configuration if constants change.

## Spec and code disagreement

- The phase document’s spin response example is minimal; the live API returns additional fields used for jackpots, bonus games, free spins, and hold metadata. The UI may consume a subset; behavior should remain correct if extra keys are ignored or used opportunistically.
