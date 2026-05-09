import pytest
from fastapi.testclient import TestClient
from main import app
from slot_machine.constants import MAX_LINES
from tests.pages.game_api_client import GameAPI

client = TestClient(app)
game_api = GameAPI(client)

def test_get_configuration_matches_spec():
    """Verifies that the configuration endpoint returns expected structure."""
    response = game_api.get_configuration()
    assert response.status_code == 200
    data = game_api.get_spin_data(response)
    
    assert data["max_lines"] == MAX_LINES
    assert "symbols" in data
    assert isinstance(data["symbols"], list)

def test_post_spin_success():
    """Verifies a successful spin request returns all required fields."""
    response = game_api.spin(balance=1000, lines=3, bet=10)
    assert response.status_code == 200
    data = game_api.get_spin_data(response)
    
    expected_keys = {"spin_result", "winnings", "winning_lines", "total_bet", "new_balance"}
    assert expected_keys.issubset(data.keys())
    assert data["total_bet"] == 30

def test_post_spin_insufficient_funds():
    """Verifies that the API returns a 400 error when balance is too low."""
    response = game_api.spin(balance=5, lines=5, bet=10)
    assert response.status_code == 400
    assert game_api.get_spin_data(response)["detail"] == "Insufficient balance for this bet."