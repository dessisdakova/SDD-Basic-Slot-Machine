# Web slot SPA

## Start a session with deposit and see my balance

As a player, I want to enter a starting amount before play and always see my current balance, so that I understand how much I am risking per spin.

## Acceptance criteria

### UI (or equivalent)

1. Before the first session begins, a deposit overlay blocks interaction with the main game until the player confirms a deposit.
2. The deposit flow enforces the Phase 1 rule that the amount must be between $50 and $5000 inclusive before the player can confirm (invalid amounts cannot proceed through the intended path, with clear inline feedback).
3. After a valid deposit, the overlay closes, the main game is usable, and the balance display shows the deposited amount as the current balance.
4. If the player enters a non-numeric or empty value, confirmation remains disabled or clearly invalid (no silent acceptance of bad input).

## Technical notes

- Balance is tracked only in the browser for Phase 1; each spin POST must send the up-to-date `balance` field.
- After deposit, related UI state (messages, win display, optional feature toggles) should reset so a new session does not leak prior spin state.

## References

- `specs/phase_1_web_interface.md`
- `static/index.html`
- `static/script.js`

## Missing requirements

### Gaps versus specification

- None if deposit confirmation strictly enforces $50–$5000 end-to-end (see implementation quality).

### Implementation quality

- The deposit button is gated by client-side validation on input, but the click handler currently treats any parsed integer `> 0` as success. A player who bypasses the disabled button could confirm an out-of-range deposit; enforcement should be aligned between validation and `handleDeposit`.

## Spec and code disagreement

- None beyond the deposit enforcement nuance above (spec requires $50–$5000; submit handler should match the same bounds).
