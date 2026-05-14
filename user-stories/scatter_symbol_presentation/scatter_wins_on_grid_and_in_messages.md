# Scatter symbol presentation

## Scatter wins on grid and in messages

As a player, I want scatter hits to stand out on the reels and to read a clear dollar breakdown after a spin, so that I understand why I was paid beyond payline wins.

## Acceptance criteria

### UI (or equivalent)

1. When a spin response indicates **scatter winnings greater than zero**, the main grid applies a **distinct visual treatment** to every cell whose coordinates appear in `scatter_positions`, so scatter hits are visible even when they do not lie on an active payline path.
2. The same spin response may also show payline highlights; scatter styling must remain **visually distinguishable** from payline-win styling (for example different border or background token classes).
3. The win / message area communicates scatter outcomes in **plain language**, including at least the **scatter count** and the **scatter win amount in currency** (or an equivalent unambiguous summary), when `scatter_winnings` is positive.
4. When there is **no** scatter payout for the spin, the UI does not claim a scatter prize (no false scatter win messaging).

### Backend (or API, or equivalent)

1. Successful `POST /game/spin` responses include **`scatter_winnings`**, **`scatter_count`**, and **`scatter_positions`** whenever the engine evaluated the grid, so the client can implement the UI acceptance items without inferring scatter from other fields alone.

## Technical notes

- Highlight helpers assume row-major indexing consistent with `spin_result` layout (`row * reelsCount + col`). Changing grid dimensions requires keeping `scatter_positions` and DOM indexing aligned.

## References

- `specs/phase_5_scatter_symbols.md`
- `static/script.js`
- `static/index.html`
- `slot_machine/game.py`
- `slot_machine/core.py`

## Missing requirements

### Gaps versus specification

- None for “Scatter wins clearly communicated” when interpreted as visible grid emphasis plus an explicit scatter summary line.

### Implementation quality

- If the client shows a **combined** `winnings` figure that already includes scatter **and** a separate scatter dollar line, tighten copy or field usage so totals are not confusing (see scatter engine story on `winnings` vs `scatter_winnings`).

## Spec and code disagreement

- None for using `scatter_positions` to drive highlights versus the Phase 5 UI bullet.
