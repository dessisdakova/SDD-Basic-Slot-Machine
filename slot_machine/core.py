import random

from slot_machine.constants import SYMBOLS_AND_COUNT, WINNING_LINES, SYMBOLS_AND_MULTIPLIERS, WILD_SYMBOL, SCATTER_SYMBOL, SCATTER_MULTIPLIERS, BONUS_SYMBOL


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

    :param rows: Number of rows in a spin (height of each reel).
    :param reels: Number of reels in a spin (width of the grid).
    :return: A list of lists, where each inner list represents a reel (column) of symbols.
    """
    all_symbols = _get_all_available_symbols()
    all_reels = []
    for reel_idx in range(reels): # Correctly define reel_idx here
        reel = []
        current_symbols = all_symbols[:]
        for _ in range(rows):
            # Filter symbols based on reel index for BONUS_SYMBOL
            available_for_this_reel = current_symbols[:]
            if reel_idx == 0 or reel_idx == reels - 1: # First or last reel (index 0 or 4)
                available_for_this_reel = [s for s in available_for_this_reel if s != BONUS_SYMBOL]
            
            # If no symbols are available after filtering, fall back to all symbols (shouldn't happen with balanced counts)
            value = random.choice(available_for_this_reel if available_for_this_reel else current_symbols)
            reel.append(value)
            # Enforce "once per reel" for SCATTER_SYMBOL and BONUS_SYMBOL
            if value == SCATTER_SYMBOL or value == BONUS_SYMBOL:
                current_symbols = [s for s in current_symbols if s != value]
            else:
                current_symbols.remove(value)
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

def check_winning_combinations(transposed_spin: list, lines: int, bet: int) -> tuple[int, dict[int, int], int, int, list[list[int]], bool, int]:
    """Check for winning combinations in the transposed spin and calculates winnings.

    :param transposed_spin: A list of lists representing the rows of the slot machine.
    :param lines: The number of lines the player has bet on.
    :param bet: The amount the player has bet on each line.
    :return: A tuple containing:
            - The total winnings (int).
            - A dictionary of winning lines {line_number: match_count}.
            - Total scatter winnings (int).
            - Total scatter symbols found (int).
            - Coordinates of found scatter symbols [[row, col], ...].
            - Flag indicating if bonus game is triggered (bool).
            - Total bonus symbols found (int).
    """
    total_winnings = 0
    winning_lines = {}
    scatter_positions = [] # Initialize scatter_positions here

    for line_num in range(1, lines + 1):
        positions = WINNING_LINES[line_num]
        
        # Determine the target symbol for this line (first non-wild, non-scatter)
        line_symbols = [transposed_spin[r][c] for r, c in positions]
        target_symbol = None
        for s in line_symbols:
            if s != WILD_SYMBOL and s != SCATTER_SYMBOL and s != BONUS_SYMBOL: # Exclude Bonus Symbol from target determination
                target_symbol = s
                break
        
        if target_symbol is None: # Entire line is Wilds (Scatters on line don't trigger lines)
            target_symbol = WILD_SYMBOL

        consecutive_matches = 0
        for s in line_symbols:
            if s == target_symbol or s == WILD_SYMBOL:
                consecutive_matches += 1
            else:
                break

        if consecutive_matches >= 3:
            multiplier = SYMBOLS_AND_MULTIPLIERS[target_symbol].get(consecutive_matches, 0)
            total_winnings += multiplier * bet
            winning_lines[line_num] = consecutive_matches

    # Scatter Logic: Find all SCATTER_SYMBOL coordinates on the grid
    for r, row in enumerate(transposed_spin):
        for c, symbol in enumerate(row):
            if symbol == SCATTER_SYMBOL:
                scatter_positions.append([r, c])
    
    scatter_count = len(scatter_positions)
    scatter_winnings = 0

    if scatter_count >= 3:
        # Determine highest reached tier
        possible_tiers = [t for t in SCATTER_MULTIPLIERS if t <= scatter_count]
        if possible_tiers:
            multiplier = SCATTER_MULTIPLIERS[max(possible_tiers)]
            scatter_winnings = multiplier * (lines * bet)

    # Bonus Logic: Check for BONUS_SYMBOL anywhere on the grid
    bonus_symbols_found = 0
    for r, row in enumerate(transposed_spin):
        for c, symbol in enumerate(row):
            if symbol == BONUS_SYMBOL:
                bonus_symbols_found += 1
    
    bonus_triggered = bonus_symbols_found >= 3

    return total_winnings + scatter_winnings, winning_lines, scatter_winnings, scatter_count, scatter_positions, bonus_triggered, bonus_symbols_found
