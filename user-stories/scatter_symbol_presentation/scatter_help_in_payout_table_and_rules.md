# Scatter symbol presentation

## Scatter help in payout table and rules

As a player, I want the rules and payout reference to explain scatter (including that multipliers apply to total bet), so that I can interpret scatter payouts before I spin.

## Acceptance criteria

### UI (or equivalent)

1. After configuration load, the information modal’s **payout reference** includes the scatter symbol with its **3 / 4 / 5** threshold multipliers in a way that signals these tiers apply to **total bet** (for example footnote text or column labeling consistent with the rest of the table).
2. The **general rules** section explains that **three or more** scatter symbols **anywhere on the grid** can award a payout, reinforcing that scatter is **not** payline-position-dependent.
3. Copy stays consistent with the **`scatter_multipliers`** values returned by the server (if constants change, the modal should reflect the new numbers after reload without manual code edits to each number).

### Backend (or API, or equivalent)

1. `GET /game/configuration` continues to expose `scatter_symbol` and `scatter_multipliers` in the shape the client already consumes when building the scatter row and rules text.

## Technical notes

- Scatter help overlaps the Phase 3 “information modal” footprint; this story scopes **scatter-specific** education required by Phase 5 without re-documenting the entire modal shell.

## References

- `specs/phase_5_scatter_symbols.md`
- `static/script.js`
- `static/index.html`
- `main.py`
- `slot_machine/constants.py`

## Missing requirements

### Gaps versus specification

- None for the Phase 5 requirement to update the Info Modal for scatter mechanics, beyond optional accessibility improvements (emoji labels, screen reader text) not spelled out in the phase doc.

### Implementation quality

- Rules prose is partly **static HTML strings** in the client; consider driving more copy from API summaries if scatter rules ever diverge across skins or locales.

## Spec and code disagreement

- None between Phase 5 scatter mechanics and the configuration fields the UI uses for the scatter payout row.
