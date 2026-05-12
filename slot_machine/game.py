from collections.abc import Callable

from slot_machine.constants import ROWS, REELS
from slot_machine.core import generate_random_reels_in_spin, convert_reels_to_rows, check_winning_combinations
from slot_machine.jackpot import process_jackpot_for_spin
from slot_machine.utils import compare_total_bet_and_balance, print_spin, print_winnings, get_deposit


def execute_spin(
    balance: int,
    lines: int,
    bet: int,
    is_free_spin: bool = False,
    jackpot_random_fn: Callable[[], float] | None = None,
) -> dict:
    """Logic-only execution of a spin, returning results as a dictionary.
    
    This allows the same logic to be used by both CLI and Web API.
    """
    total_bet = lines * bet
    if not is_free_spin and total_bet > balance:
        raise ValueError("Insufficient balance for this bet.")

    spin_reels = generate_random_reels_in_spin(ROWS, REELS)
    transposed_spin = convert_reels_to_rows(spin_reels)
    # check_winning_combinations returns payline/scatter/bonus/free-spin fields + wild cell positions
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