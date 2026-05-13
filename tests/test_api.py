import pytest
from fastapi.testclient import TestClient
from main import app
from slot_machine.constants import (
    HOLD_FEATURE_ENABLED,
    MAX_LINES,
    MAX_NUDGES_PER_PAID_SPIN,
    MIN_BET,
    MAX_BET,
    NUDGE_FEATURE_ENABLED,
    REELS,
    ROWS,
    SYMBOLS_AND_COUNT,
    WINNING_LINES,
    SYMBOLS_AND_MULTIPLIERS,
)
from slot_machine.session_grid import clear_sessions_for_testing
from tests.pages.game_api_client import GameAPI

client = TestClient(app)
game_api = GameAPI(client)


@pytest.fixture(autouse=True)
def reset_sessions():
    clear_sessions_for_testing()
    yield
    clear_sessions_for_testing()


# ---------------------------------------------------------------------------
# Configuration endpoint
# ---------------------------------------------------------------------------

def test_configuration_returns_correct_structure_and_values():
    """Verifies that the configuration endpoint returns expected structure."""
    response = game_api.get_configuration()

    assert response.status_code == 200
    data = game_api.get_spin_data(response)
    assert data["max_lines"] == MAX_LINES
    assert data["min_bet"] == MIN_BET
    assert data["max_bet"] == MAX_BET
    assert data["rows"] == ROWS
    assert data["reels"] == REELS
    assert isinstance(data["symbols"], list)
    assert set(data["symbols"]) == set(SYMBOLS_AND_COUNT.keys())
    expected_winning_lines = {str(k): [list(coord) for coord in v] for k, v in WINNING_LINES.items()}
    assert data["winning_lines_config"] == expected_winning_lines
    expected_winning_multipliers = {k: {str(m_count): mult for m_count, mult in v.items()} for k, v in SYMBOLS_AND_MULTIPLIERS.items()}
    assert data["multipliers"] == expected_winning_multipliers


def test_configuration_includes_phase9_feature_flags():
    """Phase 9: configuration must expose hold/nudge feature flags."""
    data = game_api.get_configuration().json()
    assert "features" in data
    assert data["features"]["hold"] == HOLD_FEATURE_ENABLED
    assert data["features"]["nudge"] == NUDGE_FEATURE_ENABLED
    assert "max_hold_columns" in data
    assert "max_nudges_per_paid_spin" in data
    assert "hold_and_nudge_rules_summary" in data


# ---------------------------------------------------------------------------
# Spin endpoint — baseline
# ---------------------------------------------------------------------------

def test_spin_returns_all_required_fields():
    """Verifies a successful spin request returns all required fields."""
    response = game_api.spin(balance=1000, lines=3, bet=10)
    assert response.status_code == 200
    data = game_api.get_spin_data(response)
    expected_keys = {"spin_result", "winnings", "winning_lines", "total_bet", "new_balance"}
    assert expected_keys.issubset(data.keys())


def test_spin_returns_phase9_observability_fields():
    """Phase 9 response must include hold/nudge metadata fields."""
    data = game_api.spin(balance=1000, lines=3, bet=10).json()
    assert "hold_columns_applied" in data
    assert "nudges_applied" in data
    assert "hold_rejected_reason" in data


def test_post_spin_insufficient_funds():
    """Verifies that the API returns a 400 error when balance is too low."""
    response = game_api.spin(balance=5, lines=5, bet=10)
    assert response.status_code == 400
    assert game_api.get_spin_data(response)["detail"] == "Insufficient balance for this bet."


# ---------------------------------------------------------------------------
# Hold — request validation (400s)
# ---------------------------------------------------------------------------

def test_hold_invalid_column_index_returns_400():
    response = game_api.spin(balance=1000, lines=3, bet=5, hold_columns=[REELS])
    assert response.status_code == 422  # Pydantic validation error


def test_hold_negative_column_index_returns_422():
    response = game_api.spin(balance=1000, lines=3, bet=5, hold_columns=[-1])
    assert response.status_code == 422


def test_hold_duplicate_columns_returns_422():
    response = game_api.spin(balance=1000, lines=3, bet=5, hold_columns=[0, 0])
    assert response.status_code == 422


def test_hold_on_free_spin_returns_422():
    """hold_columns is not allowed on free spins — must be rejected at validation."""
    response = game_api.spin(
        balance=1000, lines=3, bet=5, is_free_spin=True, hold_columns=[0]
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Hold — business logic (soft reject in response)
# ---------------------------------------------------------------------------

def test_hold_without_session_id_is_soft_rejected():
    """No session ID → hold is silently skipped; reason appears in response."""
    data = game_api.spin(balance=1000, lines=3, bet=5, hold_columns=[0]).json()
    assert data["hold_columns_applied"] == []
    assert data["hold_rejected_reason"] == "no_session_id"


def test_hold_on_first_spin_is_soft_rejected():
    """No prior grid for new session → hold silently skipped."""
    data = game_api.spin(
        balance=1000, lines=3, bet=5,
        client_session_id="brand-new",
        hold_columns=[0],
    ).json()
    assert data["hold_columns_applied"] == []
    assert data["hold_rejected_reason"] == "no_previous_spin"


def test_hold_applied_on_second_spin():
    """After an initial spin the session has a grid; hold must freeze the column."""
    session = "api-hold-test"
    # First spin — seeds the session
    first = game_api.spin(balance=1000, lines=3, bet=5, client_session_id=session).json()
    held_col = [first["spin_result"][r][0] for r in range(ROWS)]

    # Second spin with hold on column 0
    second = game_api.spin(
        balance=first["new_balance"],
        lines=3, bet=5,
        client_session_id=session,
        hold_columns=[0],
    ).json()
    assert second["hold_columns_applied"] == [0]
    assert second["hold_rejected_reason"] is None
    second_col = [second["spin_result"][r][0] for r in range(ROWS)]
    assert second_col == held_col


# ---------------------------------------------------------------------------
# Nudge — request validation (422)
# ---------------------------------------------------------------------------

def test_nudge_invalid_column_index_returns_422():
    response = game_api.spin(balance=1000, lines=3, bet=5, nudge_sequence=[REELS])
    assert response.status_code == 422


def test_nudge_exceeds_max_returns_422():
    too_many = list(range(MAX_NUDGES_PER_PAID_SPIN + 1))
    response = game_api.spin(balance=1000, lines=3, bet=5, nudge_sequence=too_many)
    assert response.status_code == 422


def test_nudge_on_free_spin_returns_422():
    response = game_api.spin(
        balance=1000, lines=3, bet=5, is_free_spin=True, nudge_sequence=[0]
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Nudge — business logic
# ---------------------------------------------------------------------------

def test_nudge_applied_appears_in_response():
    data = game_api.spin(balance=1000, lines=3, bet=5, nudge_sequence=[0]).json()
    assert data["nudges_applied"] == [0]


def test_nudge_sequence_multiple_columns_appears_in_response():
    data = game_api.spin(
        balance=1000, lines=3, bet=5,
        nudge_sequence=[0, 2, 4],
    ).json()
    assert data["nudges_applied"] == [0, 2, 4]


def test_nudge_same_column_twice():
    """Same column nudged twice — both entries appear in nudges_applied."""
    data = game_api.spin(
        balance=1000, lines=3, bet=5,
        nudge_sequence=[1, 1],
    ).json()
    assert data["nudges_applied"] == [1, 1]


# ---------------------------------------------------------------------------
# Grid dimensions remain valid under hold/nudge
# ---------------------------------------------------------------------------

def test_grid_dimensions_valid_after_hold_and_nudge():
    session = "dim-check"
    game_api.spin(balance=1000, lines=3, bet=5, client_session_id=session)
    data = game_api.spin(
        balance=1000, lines=3, bet=5,
        client_session_id=session,
        hold_columns=[1, 3],
        nudge_sequence=[0, 2],
    ).json()
    grid = data["spin_result"]
    assert len(grid) == ROWS
    assert all(len(row) == REELS for row in grid)