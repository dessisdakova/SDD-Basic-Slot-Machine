MAX_LINES = 10
MIN_BET = 1
MAX_BET = 10

ROWS = 3
REELS = 5

WILD_SYMBOL = "🌟"

# pass this dictionary to get_slot_machine_spin() func
SYMBOLS_AND_COUNT = {
    "♠": 2,
    "♥": 5,
    "♦": 12,
    "♣": 20,
    WILD_SYMBOL: 1
}

WINNING_LINES = {
    1: [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4)],
    2: [(1, 0), (1, 1), (1, 2), (1, 3), (1, 4)],
    3: [(2, 0), (2, 1), (2, 2), (2, 3), (2, 4)],
    4: [(0, 0), (1, 1), (2, 2), (1, 3), (0, 4)],
    5: [(2, 0), (1, 1), (0, 2), (1, 3), (2, 4)],
    6: [(1, 0), (0, 1), (0, 2), (0, 3), (1, 4)],
    7: [(1, 0), (2, 1), (2, 2), (2, 3), (1, 4)],
    8: [(0, 0), (1, 1), (0, 2), (1, 3), (0, 4)],
    9: [(2, 0), (1, 1), (2, 2), (1, 3), (2, 4)],
    10: [(0, 0), (1, 1), (2, 2), (2, 3), (2, 4)],
}

# pass this dictionary to check_all_winnings func
SYMBOLS_AND_MULTIPLIERS = {
    "♠": {3: 10, 4: 25, 5: 50},
    "♥": {3: 7, 4: 15, 5: 30},
    "♦": {3: 4, 4: 8, 5: 15},
    "♣": {3: 2, 4: 4, 5: 8},
    WILD_SYMBOL: {3: 10, 4: 25, 5: 50} # Matches highest symbol if pure Wild line
}