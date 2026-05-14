# Wild symbol presentation

## Wild rules copy in information modal

As a player, I want the help panel to explain what the wild does, so that substitution and pure-wild behavior are understandable without reading source code.

## Acceptance criteria

### UI (or equivalent)

1. The information (“More Info”) experience includes prose that states the wild **substitutes for standard symbols** on paylines (left-to-right behavior may be referenced here or in the payline section, but at least one place in the modal set makes directionality clear).
2. The same help area addresses **pure wild lines** in plain language (for example that a full line of wilds pays using a defined multiplier ladder), so players are not surprised when an all-wild outcome pays.
3. If the product also advertises **free spins from wild counts** in the same modal, that text is clearly scoped as a **separate** mechanic from payline substitution (Phase 7 adds global wild count rules; Phase 4 verification only required wild visibility and explanation—keep wording honest if both appear).

## Technical notes

- Copy is currently assembled in `populateInfoModal` alongside scatter, bonus, jackpot, and free-spin paragraphs; edits should avoid contradicting `specs/phase_4_wild_symbols.md` once pure-wild payout semantics are decided.

## References

- `specs/phase_4_wild_symbols.md`
- `specs/phase_7_free_spins.md`
- `static/script.js`
- `static/index.html`

## Missing requirements

### Gaps versus specification

- Phase 4 asks that the modal “correctly display” the wild; it does not mandate exact marketing strings. Localization and accessibility (simplified text, screen-reader labels for emoji) are not specified.

### Implementation quality

- Help text can drift from engine rules; after resolving the **pure wild** spec versus code mismatch, update this copy in the same change set.

## Spec and code disagreement

- Modal copy currently claims a line of pure wilds pays the **“highest multiplier”** without naming ♠, while Phase 4 text says **♠** specifically and the engine uses the **wild** multiplier row. Align spec, payout code, and copy in one decision.
