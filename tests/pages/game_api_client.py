from fastapi.testclient import TestClient

class GameAPI:
    """API Object Model for the Slot Machine Game."""
    
    def __init__(self, client: TestClient):
        self.client = client

    def get_configuration(self):
        """Fetches game configuration constants."""
        return self.client.get("/game/configuration")

    def spin(self, balance: int, lines: int, bet: int):
        """Executes a spin with the provided parameters."""
        payload = {
            "balance": balance,
            "lines": lines,
            "bet": bet
        }
        return self.client.post("/game/spin", json=payload)

    def get_spin_data(self, response):
        """Helper to extract JSON data from a response."""
        return response.json()