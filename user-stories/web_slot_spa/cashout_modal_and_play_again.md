# Web slot SPA

## Cash out and optionally start a new session

As a player, I want to end my session, see how much I cashed out, and start over if I choose, so that I can leave the game cleanly or play again with a fresh deposit.

## Acceptance criteria

### UI (or equivalent)

1. From the main game, the player can open cashout while not blocked by modal-only states that the product defines as incompatible (for example active free-spin sequences, if applicable).
2. Confirming cashout sets the session balance to zero for client-side tracking, shows a cashout modal with the amount just cashed out, and hides or de-emphasizes the main game panel as designed.
3. From the cashout modal, choosing “Play Again” closes that modal, returns the player to the deposit flow, restores access to the main game shell, and clears transient UI state (messages, win display, and any per-session controls that should not carry into a new deposit).
4. After cashout, the balance display reads zero (or equivalent) until a new valid deposit is entered.

## Technical notes

- Cashout is entirely client-side in Phase 1; no separate API call is required by the phase specification.
- “Play Again” should re-show the deposit overlay and reset any client-only session identifiers only if product rules require it; hold/free-spin state should not leak into the new session.

## References

- `specs/phase_1_web_interface.md`
- `static/index.html`
- `static/script.js`

## Missing requirements

### Gaps versus specification

- None for the described modals and flow.

### Implementation quality

- None identified for this story in isolation.

## Spec and code disagreement

- None.
