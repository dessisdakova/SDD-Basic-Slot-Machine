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
    "♠": 3,
    "♥": 5,
    "♦": 12,
    "♣": 20,
    WILD_SYMBOL: 3,
    SCATTER_SYMBOL: 3,
    BONUS_SYMBOL: 3
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

FREE_SPINS_CONFIG = {
    3: 5, 4: 7, 5: 9, 6: 11, 7: 13, 8: 15, 9: 17, 10: 19,
    11: 21, 12: 23, 13: 25, 14: 30, 15: 50
 } 

#  Testing
# FREE_SPINS_CONFIG = {
#     3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8,
#     11: 9, 12: 10, 13: 11, 14: 12, 15: 13
# }

# --- Progressive jackpot (Phase 8) ---
# Contribution: integer dollars per paid spin = (total_bet * percent) // 100;
# if that rounds down to 0 but total_bet > 0, contribute $1 so small stakes still grow the pool.
JACKPOT_SEED = 100
JACKPOT_CONTRIBUTION_PERCENT_OF_TOTAL_BET = 5

# Option A (spec): independent random trial per paid spin after contribution.
JACKPOT_HIT_PROBABILITY = 0.0005

# Human-readable rules for API/UI (single source for info modal copy).
JACKPOT_RULES_SUMMARY = (
    "Paid spins add a share of your total bet to the progressive pool. "
    "Each paid spin also has a small random chance to win the entire pool; "
    "after a win the pool resets to its starting value. Free spins do not "
    "contribute and cannot win the jackpot."
)

# --- Hold and Nudge Features (Phase 9) ---

HOLD_FEATURE_ENABLED = True
NUDGE_FEATURE_ENABLED = True

# Maximum columns that may be held at once; at least one reel must spin freely.
MAX_HOLD_COLUMNS = 4

# Upper bound on nudge steps per paid spin (0 disables nudging without toggling the feature flag).
MAX_NUDGES_PER_PAID_SPIN = 3

# "down": top←middle, middle←bottom, bottom←new drawn symbol.
NUDGE_DIRECTION = "down"

# Human-readable rules for API/UI (no internal RNG details).
HOLD_AND_NUDGE_RULES_SUMMARY = (
    "Hold: On a paid spin, freeze up to 4 reels to carry their symbols into the next spin. "
    "At least one reel must spin freely. Hold is unavailable on free spins. "
    "Nudge: Apply up to 3 nudges per paid spin; each nudge shifts a chosen reel down one "
    "position and draws a fresh symbol at the bottom. Nudges apply before wins are evaluated. "
    "Hold history is stored in memory and resets on server restart."
)