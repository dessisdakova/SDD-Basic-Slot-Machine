from slot_machine.utils import get_deposit, get_number_of_lines, get_bet, print_spin, compare_total_bet_and_balance, \
    print_winnings


def test_get_deposit_valid_input(mocker):
    mocker.patch("builtins.input", return_value="100")

    assert get_deposit() == 100


def test_get_deposit_invalid_then_valid_input(mocker):
    inputs = ["invalid", "0", "50"]
    mocker.patch("builtins.input", side_effect=inputs)

    assert get_deposit() == 50


def test_get_deposit_negative_then_valid_input(mocker):
    inputs = ["-50", "200"]
    mocker.patch("builtins.input", side_effect=inputs)

    assert get_deposit() == 200


def test_get_number_of_lines_valid_input(mocker):
    mocker.patch("builtins.input", return_value="4")

    assert get_number_of_lines() == 4


def test_get_number_of_lines_invalid_then_valid_input(mocker):
    inputs = ["one", "0", "6", "1"]
    mocker.patch("builtins.input", side_effect=inputs)

    assert get_number_of_lines() == 1


def test_get_number_of_lines_negative_then_valid_input(mocker):
    inputs = ["-20", "5"]
    mocker.patch("builtins.input", side_effect=inputs)

    assert get_number_of_lines() == 5


def test_get_bet_valid_input(mocker):
    mocker.patch("builtins.input", return_value="100")

    assert get_bet() == 100


def test_get_bet_invalid_then_valid_input(mocker):
    inputs = ["money", "0", "", "150.00", "50"]
    mocker.patch("builtins.input", side_effect=inputs)

    assert get_bet() == 50


def test_get_bet_negative_then_valid_input(mocker):
    inputs = ["-700", "-10.50", "100"]
    mocker.patch("builtins.input", side_effect=inputs)

    assert get_bet() == 100


def test_print_spin_should_prints_correctly(capsys):
    rows = [
        ["♠", "♠", "♠"],
        ["♠", "♠", "♠"],
        ["♠", "♦", "♦"]
    ]

    print_spin(rows)
    captured = capsys.readouterr()
    expected_output = "♠ | ♠ | ♠\n♠ | ♠ | ♠\n♠ | ♦ | ♦\n"

    assert captured.out == expected_output


def test_compare_total_bet_and_balance_shows_message_and_returns_values(mocker, capsys):
    mocker.patch("slot_machine.utils.get_number_of_lines", return_value=5)
    mocker.patch("slot_machine.utils.get_bet", return_value=10)
    balance = 100

    bet, lines, total_bet = compare_total_bet_and_balance(balance)
    captured = capsys.readouterr()
    expected_output = f"You are betting ${bet} on {lines} lines. Total bet is ${total_bet}."

    assert expected_output in captured.out
    assert bet == 10
    assert lines == 5
    assert total_bet == 50


def test_compare_total_bet_and_balance_shows_message_when_balance_is_not_enough(mocker, capsys):
    mocker.patch("slot_machine.utils.get_number_of_lines", return_value=5)
    mocker.patch("slot_machine.utils.get_bet", side_effect=[5, 3])
    balance = 20
    expected_output = f"You don't have enough to bet that amount. Your current credit is ${balance}."

    bet, lines, total_bet = compare_total_bet_and_balance(balance)
    captured = capsys.readouterr()

    assert expected_output in captured.out
    assert bet == 3
    assert lines == 5
    assert total_bet == 15


def test_print_winnings_prints_as_expected(capsys):
    winnings = 150
    winning_lines = {1: 3, 2: 3, 3: 3}
    expected_output = f"You won ${winnings}.\nYou won on lines:  {' '.join(map(str, winning_lines))}\n"

    print_winnings(winnings, winning_lines)
    captured = capsys.readouterr()

    assert captured.out == expected_output
