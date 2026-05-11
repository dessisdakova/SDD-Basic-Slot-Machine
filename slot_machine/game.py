from slot_machine.constants import ROWS, REELS
from slot_machine.core import generate_random_reels_in_spin, convert_reels_to_rows, check_winning_combinations
from slot_machine.utils import compare_total_bet_and_balance, print_spin, print_winnings, get_deposit


def execute_spin(balance: int, lines: int, bet: int) -> dict:
    """Logic-only execution of a spin, returning results as a dictionary.
    
    This allows the same logic to be used by both CLI and Web API.
    """
    total_bet = lines * bet
    if total_bet > balance:
        raise ValueError("Insufficient balance for this bet.")

    spin_reels = generate_random_reels_in_spin(ROWS, REELS)
    transposed_spin = convert_reels_to_rows(spin_reels)
    winnings, winning_lines, scatter_winnings, scatter_count, scatter_positions = check_winning_combinations(transposed_spin, lines, bet)

    return {
        "spin_result": transposed_spin,
        "winnings": winnings,
        "winning_lines": winning_lines,
        "scatter_winnings": scatter_winnings,
        "scatter_count": scatter_count,
        "scatter_positions": scatter_positions,
        "total_bet": total_bet,
        "new_balance": balance - total_bet + winnings
    }

def spin(balance: int) -> int:
    """CLI wrapper for performing a spin, handling input and output."""
    bet, lines, total_bet = compare_total_bet_and_balance(balance)
    result = execute_spin(balance, lines, bet)

    print_spin(result["spin_result"])
    print_winnings(result["winnings"], result["winning_lines"])

    return result["winnings"] - result["total_bet"]

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