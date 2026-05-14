# Game information modal

## General rules panel and feature sections

As a player, I want plain-language rules beyond raw payout numbers (including how specials and progressive rules work when enabled), so that I understand gameplay that is not obvious from the grid alone.

## Acceptance criteria

### UI (or equivalent)

1. The information modal includes a **General Rules** content area that is filled after configuration is successfully loaded (not left permanently empty in the normal path).
2. The general rules explain, in accessible language, how standard paylines work (including directionality) and summarize special symbol behavior that the shipped product supports (for example wild substitution intent, scatter “anywhere” wins, bonus trigger concept, free-spin trigger concept) as reflected in the current client copy.
3. When the configuration includes progressive-jackpot descriptive fields (for example a human-readable rules summary and seed or contribution hints), the general rules area surfaces that information in a dedicated subsection so players see how the pool behaves at a high level **without** exposing internal RNG parameters.
4. When the configuration indicates that **hold** (or related) features are enabled for this deployment, an additional modal section can appear with short rules and limits sourced from configuration-backed summaries (for example max hold columns and combined hold/nudge copy), and that section stays hidden when the feature flag is off.

### Backend (or API, or equivalent)

1. `GET /game/configuration` exposes any fields the UI needs for rules copy that must stay aligned with server tuning (for example `jackpot_rules_summary`, `jackpot_seed`, `jackpot_contribution_percent_of_total_bet`, `features`, `max_hold_columns`, `hold_and_nudge_rules_summary` as applicable), so marketing text in the modal does not contradict constants.

## Technical notes

- Much of the wild/scatter/bonus/free-spin wording is currently embedded in client-side HTML templates inside `populateInfoModal`; jackpot-related sentences already interpolate API values. Refactors should keep server numbers authoritative.

## References

- `specs/roadmap.md`
- `static/script.js`
- `static/index.html`
- `main.py`
- `slot_machine/constants.py`

## Missing requirements

### Gaps versus specification

- The roadmap Phase 3 bullet only names “game rules” at a high level; it does not enumerate progressive jackpots, hold, or free spins. Those behaviors are documented in later phase specs (`specs/phase_5_scatter_symbols.md`, `specs/phase_6_bonus_symbols_mini_games.md`, `specs/phase_7_free_spins.md`, `specs/phase_8_progressive_jackpots.md`, `specs/phase_9_nudge_and_hold_features.md`) but surface inside the same modal.

### Implementation quality

- Duplication risk: rules prose lives partly in the client and partly in API summaries; drift between `slot_machine.constants` and displayed copy should be caught during spec or copy reviews.

## Spec and code disagreement

- **Roadmap Phase 3** promises rules, payouts, and payline patterns only. The **live modal** also advertises jackpot mechanics and optional hold rules driven by later-phase configuration. That is broader than the roadmap sentence but matches the current product; treat this story as describing the implemented “help center” behavior unless the team splits modal content strictly by phase.
