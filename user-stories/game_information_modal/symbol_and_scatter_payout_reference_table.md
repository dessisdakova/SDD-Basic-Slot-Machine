# Game information modal

## Symbol and scatter payout reference table

As a player, I want to see how much each symbol pays for 3, 4, or 5 on a line (and how scatter pays relate to total bet), so that I can understand payouts before I choose lines and stakes.

## Acceptance criteria

### UI (or equivalent)

1. Inside the information modal, a **Symbol Multipliers** (or equivalent) section shows a table with column headers for symbol identity and **3x**, **4x**, and **5x** pay tiers.
2. After game configuration is loaded from the server, one table row is rendered per paying symbol entry in the configuration’s multiplier map, with numeric multipliers for three-, four-, and five-of-a-kind where the server provides them.
3. The table includes a **scatter** payout row (or clearly labeled scatter block) built from the configuration’s scatter symbol and scatter multiplier tiers, and copy clarifies that scatter multipliers apply to **total bet** where the product uses that rule.
4. If configuration is missing an expected multiplier entry for a symbol tier, the UI does not crash (graceful omission or placeholder is acceptable; ideally matches how the engine treats missing tiers).

### Backend (or API, or equivalent)

1. `GET /game/configuration` exposes `multipliers` (per-symbol tier map), `scatter_symbol`, and `scatter_multipliers` (or equivalent keys the client already consumes) so the payout table can be generated without hard-coding symbol sets.

## Technical notes

- Client logic iterates `config.multipliers` and appends a scatter row using `scatter_multipliers` string keys in the template literal; keep key shapes aligned with JSON serialization (string versus number keys).

## References

- `specs/roadmap.md`
- `static/script.js`
- `static/index.html`
- `main.py`
- `slot_machine/constants.py`

## Missing requirements

### Gaps versus specification

- The roadmap Phase 3 line does not spell out scatter rows; the live UI includes them because scatter is part of the shipped payout story. If strict Phase-3-only scope is desired, confirm whether scatter belongs in this table or only in a later phase spec.

### Implementation quality

- None identified beyond keeping the table in sync when new symbols or tiers appear in configuration.

## Spec and code disagreement

- Phase 3 in the roadmap mentions “symbol payouts” generically; the implementation documents scatter alongside line multipliers. That is consistent with player expectations but broader than the one-line roadmap description.
