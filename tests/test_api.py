import pytest
from fastapi.testclient import TestClient
from main import app
from slot_machine.constants import MAX_LINES, MIN_BET, MAX_BET, ROWS, REELS, SYMBOLS_AND_COUNT, WINNING_LINES, SYMBOLS_AND_MULTIPLIERS
from tests.pages.game_api_client import GameAPI

client = TestClient(app)
game_api = GameAPI(client)

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
    # Convert WINNING_LINES to JSON-compatible format (string keys and list coordinates)
    expected_winning_lines = {str(k): [list(coord) for coord in v] for k, v in WINNING_LINES.items()}
    assert data["winning_lines_config"] == expected_winning_lines
    # Convert SYMBOLS_AND_MULTIPLIERS to a JSON-compatible format by casting the integer keys
    # (representing matching symbol counts) to strings, as JSON keys are always strings.
    expected_winning_multipliers = {k: {str(m_count): mult for m_count, mult in v.items()} for k, v in SYMBOLS_AND_MULTIPLIERS.items()}
    assert data["multipliers"] == expected_winning_multipliers

def test_spin_returns_all_required_fields():
    """Verifies a successful spin request returns all required fields."""
    response = game_api.spin(balance=1000, lines=3, bet=10)
    assert response.status_code == 200
    data = game_api.get_spin_data(response)
    
    expected_keys = {"spin_result", "winnings", "winning_lines", "total_bet", "new_balance"}
    assert expected_keys.issubset(data.keys())

def test_post_spin_insufficient_funds():
    """Verifies that the API returns a 400 error when balance is too low."""
    response = game_api.spin(balance=5, lines=5, bet=10)
    assert response.status_code == 400
    assert game_api.get_spin_data(response)["detail"] == "Insufficient balance for this bet."