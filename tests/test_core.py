from slot_machine.constants import SYMBOLS_AND_COUNT, ROWS, REELS, WILD_SYMBOL, SCATTER_SYMBOL
from slot_machine.core import _get_all_available_symbols, generate_random_reels_in_spin, convert_reels_to_rows, \
    check_winning_combinations


def test__get_all_available_symbols_returns_correct_symbols():
    expected_symbol_count = sum(SYMBOLS_AND_COUNT.values())

    actual_symbols = _get_all_available_symbols()

    assert len(actual_symbols) == expected_symbol_count
    for symbol, count in SYMBOLS_AND_COUNT.items():
        assert actual_symbols.count(symbol) == count


def test_generate_random_spin_generates_correct_structure():
    spin = generate_random_reels_in_spin(ROWS, REELS)

    assert len(spin) == REELS
    for reel in spin:
        assert len(reel) == ROWS


def test_convert_reels_to_rows_correctly_transforms_spin():
    mock_reels = [
        ["♦", "♦", "♦"],
        ["♥", "♥", "♥"],
        ["♣", "♣", "♣"],
        ["♠", "♠", "♠"],
        ["🌟", "🌟", "🌟"]
    ]
    expected = [
        ["♦", "♥", "♣", "♠", "🌟"],
        ["♦", "♥", "♣", "♠", "🌟"],
        ["♦", "♥", "♣", "♠", "🌟"]
    ]

    result = convert_reels_to_rows(mock_reels)

    assert result == expected


def test_check_winning_combinations_1st_to_3rd_lines():
    mock_spin = [
        ["♦", "♦", "♦", "♦", "♦"],
        ["♥", "♥", "♥", "♥", "♥"],
        ["♠", "♠", "♠", "♠", "♠"]
    ]
    bet = 10
    lines = 5

    winnings, winning_lines, _, _, _ = check_winning_combinations(mock_spin, lines, bet)

    # ♦(5x)=15, ♥(5x)=30, ♠(5x)=50 -> (15+30+50)*10 = 950
    assert winnings == 950
    assert winning_lines == {1: 5, 2: 5, 3: 5}


def test_check_winning_combinations_4rd_5th_lines():
    # Line 4 (V) and 5 (Inv V) passing through center symbols
    mock_spin = [
        ["♣", "♥", "♥", "♥", "♣"],
        ["♥", "♣", "♥", "♣", "♥"],
        ["♣", "♥", "♣", "♥", "♣"]
    ]
    bet = 10
    lines = 5

    winnings, winning_lines, _, _, _ = check_winning_combinations(mock_spin, lines, bet)

    # ♣(5x)=8. Two lines win: 8*10 + 8*10 = 160
    assert winnings == 160
    assert winning_lines == {4: 5, 5: 5}

def test_check_winning_combinations_with_wilds_completing_lines():
    # Line 1: 🌟, ♠, 🌟, ♠, ♠ -> 5 matching ♠ (Substitution)
    # Line 2: 🌟, 🌟, 🌟, 🌟, 🌟 -> 5 matching ♠ (Pure Wild Line)
    # Line 3: 🌟, 🌟, ♦, ♣, ♣ -> 3 matching ♦ (Wilds start the line)
    mock_spin = [
        ["🌟", "♠", "🌟", "♠", "♠"],
        ["🌟", "🌟", "🌟", "🌟", "🌟"],
        ["🌟", "🌟", "♦", "♣", "♣"]
    ]
    bet = 10
    lines = 3

    winnings, winning_lines, _, _, _ = check_winning_combinations(mock_spin, lines, bet)

    # Line 1: ♠(5x)=50 * 10 = 500
    # Line 2: ♠(5x)=50 * 10 = 500 (Defaults to ♠ for pure Wilds)
    # Line 3: ♦(3x)=4 * 10 = 40
    assert winnings == 1040
    assert winning_lines == {1: 5, 2: 5, 3: 3}

def test_check_winning_combinations_wild_interruption():
    # Line 1: 🌟, 🌟, ♣, ♥, ♣ -> 3 matching ♣
    mock_spin = [
        ["🌟", "🌟", "♣", "♥", "♣"],
        ["♥", "♥", "♥", "♥", "♥"],
        ["♥", "♥", "♥", "♥", "♥"]
    ]
    bet = 1
    lines = 1

    winnings, winning_lines, _, _, _ = check_winning_combinations(mock_spin, lines, bet)

    # Target is ♣. Match count: 3.
    # ♣(3x)=2 * 1 = 2
    assert winnings == 2
    assert winning_lines == {1: 3}

def test_check_winning_combinations_with_scatters():
    # 3 Scatters found (💎)
    mock_spin = [
        ["💎", "♠", "♥", "♦", "♣"],
        ["♠", "💎", "♥", "♦", "♣"],
        ["♠", "♥", "💎", "♦", "♣"]
    ]
    bet = 10
    lines = 10
    # Total bet = 10 * 10 = 100. Scatter tier 3 = 2x Total Bet = 200.

    winnings, winning_lines, scatter_winnings, scatter_count, scatter_positions = check_winning_combinations(mock_spin, lines, bet)

    assert scatter_count == 3
    assert scatter_winnings == 200
