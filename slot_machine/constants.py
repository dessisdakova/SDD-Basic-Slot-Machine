MAX_LINES = 10
MIN_BET = 1
MAX_BET = 10

ROWS = 3
REELS = 5

WILD_SYMBOL = "🌟"
SCATTER_SYMBOL = "💎"
BONUS_SYMBOL = "🎁"

# pass this dictionary to get_slot_machine_spin() func
SYMBOLS_AND_COUNT = {
    "♠": 2,
    "♥": 5,
    "♦": 12,
    "♣": 20,
    WILD_SYMBOL: 10,
    SCATTER_SYMBOL: 2,
    BONUS_SYMBOL: 10
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
    WILD_SYMBOL: {3: 15, 4: 40, 5: 75} # Pays more than Spades for pure Wild lines
}

# Scatter payouts multiply the Total Bet (lines * bet)
SCATTER_MULTIPLIERS = {
    3: 2,
    4: 10,
    5: 50
}

# Bonus Mini-Game Prizes (multipliers of total bet)
BONUS_MINI_GAME_PRIZES = {
    "10x": 10,
    "25x": 25,
    "200x": 200
}

# FREE_SPINS_CONFIG = {
#    3: 5, 4: 7, 5: 9, 6: 11, 7: 13, 8: 15, 9: 17, 10: 19,
#    11: 21, 12: 23, 13: 25, 14: 30, 15: 50
# } 

# Testing
FREE_SPINS_CONFIG = {
    3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8,
    11: 9, 12: 10, 13: 11, 14: 12, 15: 13
}