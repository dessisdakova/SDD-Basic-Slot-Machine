# Specification: Phase 7 - Free Spins

## Goal & Scope

Introduce a **Free Spins** feature triggered by landing multiple Wild symbols. Free spins use the same reel logic as paid spins but **do not deduct** the line bet from the player balance. This phase includes server logic, API fields, and a dedicated **free-spin mode** in the web UI so players can clearly see when they are playing free games versus paid spins.

---

## Trigger Condition

- Free spins are triggered when **3 or more** `WILD_SYMBOL` (🌟) symbols appear **anywhere** on the grid in a single spin (not restricted to paylines).

---

## Award

- The number of free spins awarded is determined by **`FREE_SPINS_CONFIG`** in `slot_machine/constants.py`, keyed by the **count of Wild symbols** on the grid (minimum tier 3 wilds). Example tiers (adjust in config as needed):

    | Wild symbols (example) | Free spins (example) |
    | ---------------------- | -------------------- |
    | 3 | 5 |
    | 4 | 7 |
    | … | … |
    | 15 | 50 |

- **Authoritative mapping:** always read `FREE_SPINS_CONFIG` in code—the table above is illustrative only.

- Free spins behave like paid spins for **payout math** (lines, scatters, substitutions), but **`is_free_spin: true`** means **no deduction** of `lines × bet` from balance for that request.

- **Wild symbols** that trigger free spins **still substitute** on paylines and pay according to existing wild rules.

- **Bonus mini-game + free spins on the same spin:** run the **bonus game first**, then continue with free spins (existing product rule).

---

## Backend Changes (Python)

### 1. `slot_machine/constants.py`

- Maintain **`FREE_SPINS_CONFIG`**: maps wild **count** → **number of free spins awarded**.

### 2. `slot_machine/core.py`

- In **`check_winning_combinations`**:
    - Collect **all Wild symbol coordinates** on the grid (`wild_positions`: list of `[row, col]`).
    - Count wilds; if count ≥ 3, look up **`FREE_SPINS_CONFIG`** for the awarded spin count.
    - Return **`free_spins_awarded`** (or equivalent) and **`wild_positions`** as part of the result tuple (alongside existing payline, scatter, and bonus fields).

### 3. `slot_machine/game.py`

- **`execute_spin(balance, lines, bet, is_free_spin=False)`**:
    - If **`is_free_spin` is `True`**, do **not** subtract `total_bet` from balance; still add winnings.
    - Response dictionary includes at least:
        - **`free_spins_won`** — spins awarded **by this spin’s grid** (may be 0).
        - **`wild_positions`** — all 🌟 cells on this spin’s grid (for UI highlighting).
        - **`is_free_spin`** — echo of request flag.

### 4. `main.py` (FastAPI)

- **`POST /game/spin`** body includes **`is_free_spin`** (boolean).
- Response passes through fields from **`execute_spin`** (including **`wild_positions`**, **`free_spins_won`**, **`is_free_spin`**).

---

## Frontend / Web UI Requirements

### Session state (client)

- **`freeSpinsRemaining`** — queued free spins from the server (increment when **`free_spins_won`** > 0).
- **`freeSpinSessionWinnings`** — running sum of **slot winnings** during free-spin plays only (increment when **`is_free_spin`** is true using **`data.winnings`**). Bonus chest prizes during free-spin mode may be included in this session total for display consistency.
- **`lastSpinWildPositions`** — used when bonus ends before showing orange wild highlights.

### Manual spins (no autopilot)

- **Do not** auto-trigger the next spin after a delay.
- While **`freeSpinsRemaining > 0`**, the SPIN action sends **`is_free_spin: true`**; otherwise **`false`**.

### Highlighting Wild symbols that award free spins

- When **`free_spins_won` > 0**, highlight **every Wild** returned in **`wild_positions`** using a style **parallel to winning-line highlights** but with an **orange** palette (e.g. border/background/pulse), distinct from purple payline wins and green scatter wins.

- **Order when both payline (and/or scatter/bonus) wins and free spins trigger on the same result:**
    1. Show **payline / scatter / bonus** highlights first (existing dim + purple/green/bonus styling).
    2. After a short delay (~2s), clear those highlights and show **orange Wild** highlights for **`wild_positions`**.
    3. If **bonus** also triggers: run the **bonus overlay first**; after it closes, apply **orange Wild** highlights (free-spin chrome follows normal rules).

### Messaging & layout stability

- Use a **single** prominent message for awards, e.g. **`N Free spin awarded!`** / **`N Free spins awarded!`** (orange styling). Avoid duplicate “FREE SPINS AWARDED” lines.
- Do **not** show a separate “Press SPIN when ready” instruction (removed as redundant).
- Reserve **fixed vertical space** for the win message area and main card **`min-height`** so the modal does **not** jump when message content changes.

### Free-spin mode vs paid-spin mode (visual system)

Implement a **`syncFreeSpinModeUI()`** (or equivalent) driven by **`freeSpinsRemaining`** and related flags:

1. **Banner slot (fixed height)**  
   - Outer **`#free-spins-banner-slot`** keeps **constant height** while paid or free.  
   - Inner banner shows **“FREE SPINS REMAINING: N”** only when **`freeSpinsRemaining > 0`**; otherwise **empty** (no orange bar) so the card size stays stable.

2. **Page background**  
   - **`body`** (or `#game-body`): **`bg-orange-500`** (or match banner orange) while in free-spin mode; **`bg-gray-100`** (or default) when not.

3. **Balance row**  
   - While **`freeSpinsRemaining > 0`**, **dim** the balance row (e.g. opacity + grayscale) to signal that the **line bet is not charged** on free spins.

4. **Free spin winnings panel**  
   - **`#free-spin-winnings-slot`**: fixed **`min-height`** so layout is stable.  
   - Inner **“Free spin winnings”** panel is **visible only** during **`freeSpinsRemaining > 0`**; when paid-only, the slot stays **empty** but reserved.

5. **Cashout**  
   - **Disable** the cashout button while **`freeSpinsRemaining > 0`** (and optional disabled styling).

### Balance display vs free-spin pool (UX contract)

- The client keeps **`currentBalance`** aligned with **`new_balance`** from every successful spin (server is source of truth for the next request).

- **During free-spin mode**, the **main balance figure** should **not** appear to grow every spin; instead show a **“frozen” effective bankroll** by displaying **`currentBalance - freeSpinSessionWinnings`** (or equivalent) while spins remain queued.

- **Free spin winnings** accrue in the **“Free spin winnings”** field as described above.

- When the session ends and the UI returns to paid mode, the **full balance** is shown (server total already includes free-spin wins). **Reset** the session winnings display when exiting free-spin chrome (see timing below).

### Last free spin — avoid premature “paid” chrome

- **Do not** decrement **`freeSpinsRemaining`** on button press **before** the server responds. Decrement **only in `updateUI`** after a successful response when **`data.is_free_spin`** is true (consume one queued spin, then apply **`free_spins_won`** awards).

- When **`data.is_free_spin`** is true and **`freeSpinsRemaining`** becomes **0** after processing (no new wild awards), **delay** switching from free-spin chrome to paid-spin chrome by **`FREE_SPIN_SESSION_END_DELAY_MS`** (~2.8s). During this interval:
    - Use **`freeSpinSessionEndPending`** (or similar) so orange background, panel visibility, dimmed balance, and cashout disabled state **linger** briefly after the last result.
    - Then clear session winnings, reset panels, and call **`syncFreeSpinModeUI()`** once.

- If the player starts a **paid** spin before the delay ends, **cancel** the pending exit timer and reset chrome appropriately.

### Information modal

- **General rules** text should state that **3+ Wilds anywhere** trigger free spins (aligned with `FREE_SPINS_CONFIG`).

---

## Testing Notes

- Unit tests: **`check_winning_combinations`** returns **`wild_positions`**; mocks for **`execute_spin`** / **`check_winning_combinations`** use the full tuple shape expected by **`game.py`**.

- Manual QA: trigger free spins with **payline wins + wilds**, **bonus + wilds**, and **last spin with no re-trigger** to verify highlight order, bonus-first rule, delayed chrome exit, and balance/session fields.

---

## Out of Scope / Follow-ups (optional)

- Sound, celebration animations, or server-side persistence of free-spin history.
