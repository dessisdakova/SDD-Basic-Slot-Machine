from __future__ import annotations

from typing import Optional

from fastapi.testclient import TestClient


class GameAPI:
    """API Object Model for the Slot Machine Game."""

    def __init__(self, client: TestClient):
        self.client = client

    def get_configuration(self):
        """Fetches game configuration constants."""
        return self.client.get("/game/configuration")

    def spin(
        self,
        balance: int,
        lines: int,
        bet: int,
        is_free_spin: bool = False,
        client_session_id: Optional[str] = None,
        hold_columns: Optional[list[int]] = None,
        nudge_sequence: Optional[list[int]] = None,
    ):
        """Executes a spin with the provided parameters."""
        payload: dict = {"balance": balance, "lines": lines, "bet": bet}
        if is_free_spin:
            payload["is_free_spin"] = is_free_spin
        if client_session_id is not None:
            payload["client_session_id"] = client_session_id
        if hold_columns is not None:
            payload["hold_columns"] = hold_columns
        if nudge_sequence is not None:
            payload["nudge_sequence"] = nudge_sequence
        return self.client.post("/game/spin", json=payload)

    def get_spin_data(self, response):
        """Helper to extract JSON data from a response."""
        return response.json()