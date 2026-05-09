from slot_machine.constants import MAX_LINES, MIN_BET, MAX_BET


def get_deposit() -> int:
    """Prompt the user to enter deposit money.

    :return: A number for deposited money.
    """
    while True:
        amount = input("How much would you like to deposit?: ")
        try:
            amount = int(amount)
            if amount > 0:
                break
            else:
                print("You must deposit more than $0.")
        except ValueError:
            print("Please enter a number.")

    return amount

def get_number_of_lines() -> int:
    """Prompt the user to enter a number of playing lines.

    :return: A number for active lines.
    """
    while True:
        lines = input(f"How many lines would you like to bet on? (1 - {MAX_LINES}): ")
        try:
            lines = int(lines)
            if 1 <= lines <= MAX_LINES:
                break
            else:
                print(f"Please enter a number of lines from 1 to {MAX_LINES}.")
        except ValueError:
            print("Please enter a valid number of lines.")

    return lines

def get_bet() -> int:
    """Prompt user to enter a bet for each line.

    :return: A number for bet per line.
    """
    while True:
        bet = input(f"How much would you like to bet on each line? (${MIN_BET} - ${MAX_BET}): ")
        try:
            bet = int(bet)
            if MIN_BET <= bet <= MAX_BET:
                break
            else:
                print(f"Bet must be between ${MIN_BET} - ${MAX_BET}.")
        except ValueError:
            print("Please enter a number.")

    return bet

def print_spin(rows: list[list[str]]):
    """Print all rows in a list.

    :param rows: A list containing the converted spin.
    """
    for row in rows:
        print(" | ".join(row))

def compare_total_bet_and_balance(balance: int) -> tuple[int, int, int]:
    """Check if user has enough credit to keep playing.

    :param balance: Current balance of the player.
    :return: A tuple containing the bet per line, active lines and total bet.
    """
    lines = get_number_of_lines()
    while True:
        bet = get_bet()
        total_bet = lines * bet

        if total_bet > balance:
            print(f"You don't have enough to bet that amount. Your current credit is ${balance}.")
        else:
            break
    print(f"You are betting ${bet} on {lines} lines. Total bet is ${total_bet}.")

    return bet, lines, total_bet

def print_winnings(winnings: int, winning_lines:list[int]):
    """Print statistics for spin.

    :param winnings: Won amount.
    :param winning_lines: all wining lines.
    """
    print(f"You won ${winnings}.")
    if winnings:
        print(f"You won on lines: ", *winning_lines)