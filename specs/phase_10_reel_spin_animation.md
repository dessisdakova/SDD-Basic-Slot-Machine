# Specification: Phase 10 — Reel Spin Animation

## Goal & Scope

Replace the current **instant grid swap** after `POST /game/spin` with a **short, snappy, cabinet-style reel spin** where each reel scrolls vertically, symbols blur/stream while spinning, reels **stop left → right**, and the final visible grid **always matches** the server’s `spin_result`.

**In scope**

- Vertical per-reel scrolling animation on the main game grid (desktop browser).
- Symbol **blur / stream** while a reel is in motion.
- **Sequential stop** order: reel 1 → reel 2 → … → reel N (left to right).
- **Short total duration** (~1–2 seconds typical); **same timing** for paid spins, free spins, and post–mini-game spins.
- **Held columns (Phase 9):** reels the player held **do not spin**; they remain static showing the held symbols until the spin completes.
- **Spin button disabled** for the full animation; **no skip** control.
- **Immediate start:** animation begins on **Spin** press; when the API response arrives, reels **land** on the authoritative `spin_result` (outcome is already decided server-side).
- **Win feedback:** after landing, only the **message area** and **balance** update for wins (no reel flash/pulse celebration in this phase).
- **Full v1 polish (no sound yet):**
  - **Winning payline highlight** drawn or emphasized after reels stop (existing payline styling may be extended, not replaced by particles).
  - **Near-miss / tease** behavior where product rules allow (e.g. slow last reel or brief tension)—**without** misleading the player about outcomes; final symbols still match the server.
- **No audio** in this phase (deferred to **Phase 13: Sound Effects**).

**Out of scope (initial delivery)**

- Mobile / responsive reel layouts.
- “Reduce motion” accessibility toggle.
- Skip / fast-forward spin.
- Sound effects and music.
- Screen shake, strobe/flashing lights, 3D perspective, cartoon particle effects.
- Changing RNG, API contracts, or balance math (animation is **presentational only**).

---

## Player experience (target feel)

| Aspect | Requirement |
|--------|-------------|
| Reel motion | Each **column** scrolls **vertically** |
| During spin | **Stream** of symbols (blur or rapid swap), not an empty grid |
| Stop order | **Left → right**, one reel after another |
| Stop feel | **Hard stop**—no bounce, wobble, or overshoot |
| Duration | **Short and snappy**; free spins = same as paid |
| Held reels | **Frozen**—no vertical scroll on held columns |
| Wins | **Message + balance** only after stop; payline highlight OK |
| Input | **Spin** disabled until animation completes |

---

## Trust model & API timing

1. Player presses **Spin** → UI disables spin and **starts** reel motion immediately (placeholder/stream symbols).
2. Client sends `POST /game/spin` (unchanged payload).
3. Server returns `spin_result` (and rest of spin payload) as today.
4. When the response is ready, the client **schedules reel stops** so each column lands on the correct symbols from `spin_result`.
5. **Final grid must equal `spin_result`** row-major layout already used by the app. No client-side re-roll.

If the request **fails**, animation **ends** with an error message; grid returns to a consistent state (last valid result or safe idle—implementation detail documented in frontend).

---

## Frontend design

### Layout model

- Refactor or extend the main grid so each **reel** is a **vertical strip** (one column × `rows` visible window), not only static cells that swap innerHTML.
- Visible window shows **`rows`** symbols per reel (currently 3 rows × 5 reels).
- Symbols use the same **glyphs / emoji** as today (from server strings).

### Animation states (per reel)

| State | Behavior |
|-------|----------|
| `idle` | Shows current symbols; no motion |
| `spinning` | Vertical motion + symbol stream / blur |
| `stopping` | Decelerate (if used) then snap to target symbols for that column |
| `stopped` | Displays final symbols from `spin_result` |

### Stop cascade

- Reel index `0` stops first, then `1`, …, `N-1`.
- Inter-reel delay is **tuned for ~1–2 s total** on a 5-reel game (constants in frontend config).
- **Held** reel indices skip `spinning` and remain on pre-spin symbols until global settle; on stop they must still match `spin_result` for held positions (server applies hold before returning grid).

### Near-miss / tease (v1)

- Allowed: slightly **longer spin** on the **last** reel or subtle slowdown—**only** when it does not change final symbols.
- Not allowed: showing a “jackpot” symbol that is **not** in `spin_result`, fake wins, or flash/strobe emphasis.

### Winning lines

- After all reels stopped, highlight winning cells/lines per existing payline logic (`winning_lines` from response).
- Highlight is **outline / background / payline list** style—no particles, no screen shake.

### Integration points

- `handleSpin` / `updateUI` in `static/script.js`: orchestrate **animate → then** apply messages, balance, bonus/free-spin flows.
- **Bonus mini-game** and **free-spin banner** behavior unchanged in timing except they wait for reel settle before chained UI (bonus overlay rules from Phase 6/7 still apply).
- **Hold buttons:** disabled during spin; held columns visually static.

---

## Backend design

- **No API changes required** for Phase 10 if `spin_result` shape is unchanged.
- Hold behavior remains server-authoritative; animation must respect `hold_columns` sent on paid spins.

---

## Constraints & non-goals

**Do not implement**

- Screen shake  
- Flashing / strobing lights  
- 3D perspective or faux depth  
- Cartoon particle bursts  

**Platform**

- **Desktop** browsers only for v1 (minimum width assumption documented in frontend).

---

## Implementation plan

1. **DOM structure:** per-reel containers in `static/index.html` (or generated in `script.js`) with overflow hidden and vertical symbol stacks.
2. **Animation module:** `static/reel-animation.js` (or equivalent) with configurable durations and stagger; pure CSS and/or `requestAnimationFrame`—no new backend dependencies.
3. **Spin orchestration:** refactor `handleSpin` to `startSpinAnimation()` → `await fetch` → `landReels(spin_result)` → `finishSpinUI(data)`.
4. **Hold:** map `heldColumns` to non-animated reel indices.
5. **Payline highlight:** trigger after `landReels` completes.
6. **Tests:** extend Playwright E2E to wait for animation end before assertions; optional `data-testid="reels-idle"` when settled.

---

## Verification

### Manual

- Paid spin: reels spin immediately, stop L→R, final grid matches network `spin_result`.
- Free spin: same animation duration and behavior.
- Hold 1–2 reels: held columns static; others spin and land correctly.
- Win: message and balance update; payline highlight visible; reels do not pulse/flashing.
- Slow network: spinning continues until response, then lands (no double-spin).

### Automated (follow-up in Phase 19)

- E2E: spin → wait for idle marker → assert grid text matches API.
- No regression on API tests (`tests/test_api.py`).

---

## References

- `specs/roadmap.md` — Part II, Phase 10: Reel Spin Animation.
- `specs/phase_1_web_interface.md` — grid and spin flow.
- `specs/phase_9_nudge_and_hold_features.md` — hold columns and session grid.
- `static/script.js`, `static/index.html` — current instant update path.
