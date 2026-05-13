from collections.abc import Callable

from slot_machine.constants import (
    HOLD_FEATURE_ENABLED,
    MAX_HOLD_COLUMNS,
    # MAX_NUDGES_PER_PAID_SPIN,  # nudge feature hidden
    # NUDGE_FEATURE_ENABLED,     # nudge feature hidden
    REELS,
    ROWS,
)
from slot_machine.core import (
    check_winning_combinations,
    convert_reels_to_rows,
    generate_random_reels_in_spin,
)
from slot_machine.jackpot import process_jackpot_for_spin
from slot_machine.reel_actions import apply_hold_to_grid  # apply_nudge_to_column hidden
from slot_machine.session_grid import get_last_reels, set_last_reels
from slot_machine.utils import compare_total_bet_and_balance, get_deposit, print_spin, print_winnings


def execute_spin(
    balance: int,
    lines: int,
    bet: int,
    is_free_spin: bool = False,
    jackpot_random_fn: Callable[[], float] | None = None,
    client_session_id: str | None = None,
    hold_columns: list[int] | None = None,
    # nudge_sequence: list[int] | None = None,  # nudge feature hidden
) -> dict:
    """Logic-only execution of a spin, returning results as a dictionary.

    Interaction order (Phase 9):
    (a) Balance check (paid spins only).
    (b) Build reel grid:
        - If HOLD_FEATURE_ENABLED, not a free spin, hold_columns is valid, and a
          prior grid exists for client_session_id: merge held columns from the
          stored grid with freshly generated columns.
        - Otherwise: full random grid (Phase 1–8 behaviour unchanged).
    (c) [Nudge hidden — re-enable when two-step API flow is implemented]
    (d) Transpose reels → rows.
    (e) check_winning_combinations → jackpot → balance update (Phase 8 unchanged).
    (f) Persist the new reel grid to the session store (if session ID provided).

    :param client_session_id: Opaque string used to look up / store the last reel
        grid for hold support.  ``None`` means hold is silently skipped.
    :param hold_columns: Zero-based column indices to copy from the previous grid.
        Ignored (with a reason code) when the feature is disabled, this is a
        free spin, there is no prior grid, or the list is invalid.
    """
    total_bet = lines * bet
    if not is_free_spin and total_bet > balance:
        raise ValueError("Insufficient balance for this bet.")

    hold_columns_applied: list[int] = []
    hold_rejected_reason: str | None = None

    # ------------------------------------------------------------------
    # (b) Build reel grid — hold path or full-random fallback
    # ------------------------------------------------------------------
    hold_requested = bool(hold_columns)
    if hold_requested:
        if not HOLD_FEATURE_ENABLED:
            hold_rejected_reason = "feature_disabled"
        elif is_free_spin:
            hold_rejected_reason = "free_spin"
        elif len(hold_columns) > MAX_HOLD_COLUMNS:
            hold_rejected_reason = "too_many_columns"
        elif len(hold_columns) >= REELS:
            hold_rejected_reason = "all_columns_held"
        elif client_session_id is None:
            hold_rejected_reason = "no_session_id"
        else:
            previous_reels = get_last_reels(client_session_id)
            if previous_reels is None:
                hold_rejected_reason = "no_previous_spin"
            else:
                spin_reels = apply_hold_to_grid(previous_reels, hold_columns)
                hold_columns_applied = list(hold_columns)
    if not hold_columns_applied:
        spin_reels = generate_random_reels_in_spin(ROWS, REELS)

    # ------------------------------------------------------------------
    # (c) Nudge hidden — re-enable when two-step API flow is implemented
    # ------------------------------------------------------------------
    # nudges_applied: list[int] = []
    # if nudge_sequence and NUDGE_FEATURE_ENABLED and not is_free_spin:
    #     for col_idx in nudge_sequence:
    #         spin_reels[col_idx] = apply_nudge_to_column(spin_reels[col_idx], col_idx)
    #         nudges_applied.append(col_idx)

    # ------------------------------------------------------------------
    # (d) Transpose → (e) evaluate
    # ------------------------------------------------------------------
    transposed_spin = convert_reels_to_rows(spin_reels)

    # check_winning_combinations returns payline/scatter/bonus/free-spin + wild positions
    winnings, winning_lines, scatter_winnings, scatter_count, scatter_positions, \
    bonus_triggered, bonus_positions, free_spins_won, wild_positions = \
        check_winning_combinations(transposed_spin, lines, bet)

    # Progressive jackpot (Phase 8): after grid + line/scatter/bonus/free-spin resolution,
    # paid spins contribute to the pool then one Bernoulli hit trial (see jackpot module).
    jackpot_pool, jackpot_won, jackpot_win_amount = process_jackpot_for_spin(
        total_bet, is_free_spin, random_fn=jackpot_random_fn
    )

    line_scatter_winnings = winnings
    if is_free_spin:
        new_balance = balance + line_scatter_winnings + jackpot_win_amount
    else:
        new_balance = balance - total_bet + line_scatter_winnings + jackpot_win_amount

    # ------------------------------------------------------------------
    # (f) Persist reel grid for next spin's hold
    # ------------------------------------------------------------------
    if client_session_id is not None:
        set_last_reels(client_session_id, spin_reels)

    return {
        "spin_result": transposed_spin,
        "winnings": line_scatter_winnings,
        "winning_lines": winning_lines,
        "scatter_winnings": scatter_winnings,
        "scatter_count": scatter_count,
        "scatter_positions": scatter_positions,
        "total_bet": total_bet,
        "new_balance": new_balance,
        "bonus_triggered": bonus_triggered,
        "bonus_positions": bonus_positions,
        "free_spins_won": free_spins_won,
        "wild_positions": wild_positions,
        "is_free_spin": is_free_spin,
        "jackpot_pool": jackpot_pool,
        "jackpot_won": jackpot_won,
        "jackpot_win_amount": jackpot_win_amount,
        # Phase 9 observability fields
        "hold_columns_applied": hold_columns_applied,
        "nudges_applied": [],  # nudge feature hidden
        "hold_rejected_reason": hold_rejected_reason,
    }

def spin(balance: int) -> int:
    """CLI wrapper for performing a spin, handling input and output."""
    bet, lines, total_bet = compare_total_bet_and_balance(balance)
    result = execute_spin(balance, lines, bet)

    print_spin(result["spin_result"])
    print_winnings(result["winnings"], result["winning_lines"])
    if result.get("jackpot_won"):
        print(f"PROGRESSIVE JACKPOT! You won ${result['jackpot_win_amount']}!")
    print(f"Jackpot pool is now ${result['jackpot_pool']}.")

    return result["new_balance"] - balance

def main():
    """Runs the main game loop of the slot machine.

    This function manages the overall game flow, including:
        1.  Getting the initial deposit from the player.
        2.  Looping until the player's balance is zero, or they choose to cash out.
        3.  Displaying the current balance.
        4.  Prompting the player to spin or cash out.
        5.  Performing a spin and updating the balance.
        6.  Displaying a cash-out message when the player cashes out.
        7.  Displaying a game over message when the balance reaches zero.
    """
    balance = get_deposit()
    while balance > 0:
        print(f"Current balance is ${balance}.")
        answer = input("Press \"enter\" to spin or \"x\" to cash out: ")
        if answer == "x":
            print(f"You have cashed out ${balance}.")
            break
        balance += spin(balance)
    if balance == 0:
        print("Your current credit is $0. You can not play anymore!")


if __name__ == '__main__':
    main()