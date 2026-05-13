import pytest

from slot_machine.constants import REELS, ROWS
from slot_machine.game import execute_spin, spin, main
from slot_machine.session_grid import clear_sessions_for_testing


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_sessions():
    """Ensure a clean session store for every test that uses execute_spin."""
    clear_sessions_for_testing()
    yield
    clear_sessions_for_testing()


# ---------------------------------------------------------------------------
# Legacy CLI tests (unchanged)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# execute_spin — Phase 9 baseline regression
# ---------------------------------------------------------------------------

class TestExecuteSpinBaseline:
    """Verify Phase 9 additions do not break the existing spin contract."""

    def test_result_contains_phase9_observability_fields(self):
        result = execute_spin(balance=1000, lines=3, bet=5)
        assert "hold_columns_applied" in result
        assert "nudges_applied" in result
        assert "hold_rejected_reason" in result

    def test_no_hold_no_nudge_produces_valid_grid(self):
        result = execute_spin(balance=1000, lines=3, bet=5)
        grid = result["spin_result"]
        assert len(grid) == ROWS
        assert all(len(row) == REELS for row in grid)

    def test_no_hold_applied_when_no_session_id(self):
        result = execute_spin(balance=1000, lines=3, bet=5, hold_columns=[0, 1])
        assert result["hold_columns_applied"] == []
        assert result["hold_rejected_reason"] == "no_session_id"

    def test_no_hold_on_first_spin_with_session_id(self):
        """Without a prior grid, hold must be silently ignored."""
        result = execute_spin(
            balance=1000, lines=3, bet=5,
            client_session_id="new-session",
            hold_columns=[0, 2],
        )
        assert result["hold_columns_applied"] == []
        assert result["hold_rejected_reason"] == "no_previous_spin"

    def test_hold_applied_on_second_spin(self):
        """After a first spin stores a grid, hold_columns=[0] must freeze column 0."""
        session = "test-hold-session"
        # First spin — stores the grid
        first = execute_spin(balance=1000, lines=3, bet=5, client_session_id=session)
        held_col_symbols = [row[0] for row in first["spin_result"]]  # column 0 in row-major

        # Second spin — hold column 0
        second = execute_spin(
            balance=1000, lines=3, bet=5,
            client_session_id=session,
            hold_columns=[0],
        )
        assert second["hold_columns_applied"] == [0]
        assert second["hold_rejected_reason"] is None
        # Column 0 in the second spin must match the first spin's column 0
        second_col_0 = [row[0] for row in second["spin_result"]]
        assert second_col_0 == held_col_symbols

    def test_hold_rejected_on_free_spin(self):
        session = "fs-session"
        # Store a prior grid
        execute_spin(balance=1000, lines=3, bet=5, client_session_id=session)
        result = execute_spin(
            balance=1000, lines=3, bet=5,
            is_free_spin=True,
            client_session_id=session,
            hold_columns=[0],
        )
        assert result["hold_columns_applied"] == []
        assert result["hold_rejected_reason"] == "free_spin"

    def test_nudge_shifts_column_correctly(self, mocker):
        """Patch nudge RNG to a known symbol and verify the shift semantics."""
        session = "nudge-session"
        # First spin with a known grid
        fixed_reels = [
            ["♠", "♥", "♦"],  # reel 0
            ["♣", "♠", "♥"],  # reel 1
            ["♦", "♣", "♠"],  # reel 2
            ["♥", "♦", "♣"],  # reel 3
            ["♣", "♥", "♦"],  # reel 4
        ]
        mocker.patch(
            "slot_machine.game.generate_random_reels_in_spin",
            return_value=[list(r) for r in fixed_reels],
        )
        mocker.patch(
            "slot_machine.reel_actions._random.choice",
            return_value="♠",
        )
        result = execute_spin(
            balance=1000, lines=3, bet=5,
            client_session_id=session,
            nudge_sequence=[0],
        )
        assert result["nudges_applied"] == [0]
        # Column 0 after downward nudge: [old[1], old[2], new] = ["♥", "♦", "♠"]
        nudged_col_0 = [result["spin_result"][r][0] for r in range(ROWS)]
        assert nudged_col_0 == ["♥", "♦", "♠"]

    def test_nudges_not_applied_on_free_spin(self, mocker):
        """Nudge sequence on a free spin should be ignored (validated upstream)."""
        # This tests that execute_spin ignores nudge_sequence when is_free_spin=True
        result = execute_spin(
            balance=1000, lines=3, bet=5,
            is_free_spin=True,
            nudge_sequence=[0],
        )
        assert result["nudges_applied"] == []

    def test_multiple_nudges_in_sequence(self, mocker):
        """nudge_sequence=[1, 1] applies two nudges to column 1 in order."""
        fixed_reels = [
            ["♠", "♥", "♦"],
            ["♣", "♠", "♥"],
            ["♦", "♣", "♠"],
            ["♥", "♦", "♣"],
            ["♣", "♥", "♦"],
        ]
        mocker.patch(
            "slot_machine.game.generate_random_reels_in_spin",
            return_value=[list(r) for r in fixed_reels],
        )
        mocker.patch("slot_machine.reel_actions._random.choice", return_value="♦")
        result = execute_spin(
            balance=1000, lines=3, bet=5,
            nudge_sequence=[1, 1],
        )
        assert result["nudges_applied"] == [1, 1]
        # Col 1 before: ["♣", "♠", "♥"]
        # After nudge 1: ["♠", "♥", "♦"]
        # After nudge 2: ["♥", "♦", "♦"]
        col_1 = [result["spin_result"][r][1] for r in range(ROWS)]
        assert col_1 == ["♥", "♦", "♦"]

    def test_hold_then_nudge_interaction(self, mocker):
        """Hold a column, then nudge it — the nudge should act on the held symbols."""
        session = "hold-then-nudge"
        stored_reels = [
            ["♠", "♥", "♦"],
            ["♣", "♠", "♥"],
            ["♦", "♣", "♠"],
            ["♥", "♦", "♣"],
            ["♣", "♥", "♦"],
        ]
        # Store those reels as the prior grid
        from slot_machine.session_grid import set_last_reels
        set_last_reels(session, stored_reels)

        mocker.patch("slot_machine.reel_actions._random.choice", return_value="♣")

        result = execute_spin(
            balance=1000, lines=3, bet=5,
            client_session_id=session,
            hold_columns=[0],
            nudge_sequence=[0],
        )
        assert result["hold_columns_applied"] == [0]
        assert result["nudges_applied"] == [0]
        # Col 0 held: ["♠", "♥", "♦"], then nudged down: ["♥", "♦", "♣"]
        col_0 = [result["spin_result"][r][0] for r in range(ROWS)]
        assert col_0 == ["♥", "♦", "♣"]

    def test_insufficient_balance_still_raises(self):
        with pytest.raises(ValueError, match="Insufficient balance"):
            execute_spin(balance=5, lines=5, bet=10)
