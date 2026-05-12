from slot_machine.game import spin, main


def test_spin_returns_correct_value(mocker):
    balance = 100
    mocker.patch("slot_machine.game.compare_total_bet_and_balance", return_value=(10, 3, 30))
    mocker.patch("slot_machine.game.generate_random_reels_in_spin",
                 return_value=[['♠', '♥', '♦'], ['♣', '♠', '♦'], ['♥', '♣', '♠']])
    mocker.patch("slot_machine.game.convert_reels_to_rows",
                 return_value=[['♠', '♣', '♥'], ['♥', '♠', '♣'], ['♦', '♦', '♦']])
    mocker.patch(
        "slot_machine.game.check_winning_combinations",
        return_value=(100, {}, 0, 0, [], False, [], 0, []),
    )
    mocker.patch("slot_machine.game.print_spin")
    mocker.patch("slot_machine.game.print_winnings")

    result = spin(balance)
    expected_win = 100
    expected_total_bet = 30
    expected_result = expected_win - expected_total_bet

    assert result == expected_result


def test_main_quits_when_user_cashes_out(mocker, capsys):
    deposit = 70
    mocker.patch("slot_machine.game.get_deposit", return_value=deposit)
    mocker.patch("builtins.input", return_value="x")
    expected = f"Current balance is ${deposit}.\nYou have cashed out ${deposit}.\n"

    main()
    captured = capsys.readouterr()

    assert captured.out == expected


def test_main_quits_when_balance_is_zero(mocker, capsys):
    deposit = 50
    mocker.patch("slot_machine.game.get_deposit", return_value=deposit)
    mocker.patch("builtins.input", return_value="")
    mocker.patch("slot_machine.game.spin", return_value=-deposit)

    main()
    captured = capsys.readouterr()
    expected = f"Current balance is ${deposit}.\nYour current credit is $0. You can not play anymore!\n"

    assert captured.out == expected
