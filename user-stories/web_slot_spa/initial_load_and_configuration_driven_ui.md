# Web slot SPA

## Load configuration and build the game shell

As a player opening the slot game in a browser, I want the page to load styling and scripts, fetch server configuration, and lay out the grid and controls using real limits, so that what I see matches what the API will accept.

## Acceptance criteria

### UI (or equivalent)

1. Visiting the app root serves the main HTML document that loads Tailwind (via CDN), page structure, and the client script responsible for talking to the API.
2. On load, the client requests `GET /game/configuration` and uses the response to set upper bounds for lines and bet (including visible labels such as maximum lines and maximum bet).
3. The visible slot grid is built with the configured number of rows and reels (cell count matches `rows × reels`), and line indicators are generated for each active line index from 1 through `max_lines`.
4. If configuration loading fails (network or non-OK HTTP), the failure is handled without leaving the UI in an inconsistent state (for example logging an error and avoiding partial updates where practical).

## Technical notes

- Static assets are mounted at `/static`; the index route returns `static/index.html`.
- `script.js` caches configuration-derived globals (`maxLines`, `maxBet`, `reelsCount`, `winningLinesMap`, symbol lists) before wiring dependent UI.

## References

- `specs/phase_1_web_interface.md`
- `main.py`
- `static/index.html`
- `static/script.js`

## Missing requirements

### Gaps versus specification

- The phase write-up references a 3×3 grid as an example; the implementation derives grid size from configuration (see spec versus code note below).

### Implementation quality

- None identified beyond ensuring configuration fetch completes before relying on limits for validation.

## Spec and code disagreement

- Phase 1 describes a “Slot Grid (3×3)” as an example; the live UI follows `rows` and `reels` from `GET /game/configuration` (not hard-coded 3×3).
