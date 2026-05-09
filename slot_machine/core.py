import random

from slot_machine.constants import SYMBOLS_AND_COUNT, WINNING_LINES, SYMBOLS_AND_MULTIPLIERS


def _get_all_available_symbols() -> list[str]:
    """Create a list containing all available symbols.

    :return: A list with symbols, represented as strings.
    """
    symbols_per_spin = []
    for symbol, symbol_count in SYMBOLS_AND_COUNT.items():
        for _ in range(symbol_count):
            symbols_per_spin.append(symbol)

    return symbols_per_spin

def generate_random_reels_in_spin(rows: int, reels: int) -> list[list[str]]:
    """Randomly pick symbols for each reel in a spin.

    :param rows: Number of rows in a spin.
    :param reels: Number of reels in a spin.
    :return: A list of lists, where each inner list represents a reel (column) of symbols.
    """
    all_symbols = _get_all_available_symbols()
    all_reels = []
    for _ in range(reels):
        reel = []
        current_symbols = all_symbols[:]
        for _ in range(rows):
            value = random.choice(current_symbols)
            current_symbols.remove(value)
            reel.append(value)
        all_reels.append(reel)

    return all_reels

def convert_reels_to_rows(reels: list) -> list[list[str]]:
    """
    Convert a list of reels (columns) into a list of rows.

    In the slot machine, symbols are initially generated reel by reel.
    However, for checking winning combinations, it's more convenient to work with rows.

    :param reels: A list of lists, where each inner list represents a reel (column) of symbols.
    :return: A list of lists, where each inner list represents a row of symbols.

    Example:
        >>> reels = [['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H', 'I']]
        >>> convert_reels_to_rows(reels)
        [['A', 'D', 'G'], ['B', 'E', 'H'], ['C', 'F', 'I']]
    """
    rows = []
    # Loop through the rows of each reel (columns) and transpose them to rows
    for row_idx in range(len(reels[0])):  # Assuming all reels have the same number of rows
        row = [reels[reel_idx][row_idx] for reel_idx in range(len(reels))]
        rows.append(row)

    return rows

def check_winning_combinations(transposed_spin: list, lines: int, bet: int) -> tuple[int, dict[int, int]]:
    """Check for winning combinations in the transposed spin and calculates winnings.

    :param transposed_spin: A list of lists representing the rows of the slot machine.
    :param lines: The number of lines the player has bet on.
    :param bet: The amount the player has bet on each line.
    :return: A tuple containing:
            - The total winnings (int).
            - A dictionary of winning lines {line_number: match_count}.
    """
    total_winnings = 0
    winning_lines = {}

    for line_num in range(1, lines + 1):
        positions = WINNING_LINES[line_num]
        first_symbol = transposed_spin[positions[0][0]][positions[0][1]]
        
        consecutive_matches = 0
        for (row, col) in positions:
            if transposed_spin[row][col] == first_symbol:
                consecutive_matches += 1
            else:
                break

        if consecutive_matches >= 3:
            multiplier = SYMBOLS_AND_MULTIPLIERS[first_symbol].get(consecutive_matches, 0)
            total_winnings += multiplier * bet
            winning_lines[line_num] = consecutive_matches

    return total_winnings, winning_lines
