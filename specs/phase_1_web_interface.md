# Specification: Phase 1 - Web API (FastAPI)

## Goal
Transition the slot machine logic from a Command Line Interface (CLI) to a RESTful API. This allows a frontend (Web/Mobile) to interact with the game engine.

## Constraints
- **Statelessness:** Since we haven't implemented Phase 9 (Persistence), the API will be stateless. The client must track and send the current `balance` in the request.
- **Validation:** All inputs (lines, bet, balance) must be validated against existing constants (`MAX_LINES`, `MIN_BET`, etc.).

## API Endpoints

### 1. GET `/game/configuration`
Returns the current game settings so the frontend knows the limits.

**Response Body:**
```json
{
  "max_lines": 5,
  "min_bet": 1,
  "max_bet": 100,
  "rows": 3,
  "reels": 3,
  "symbols": ["A", "B", "C", "D"]
}
```

### 2. POST `/game/spin`
Executes a single spin based on player input.

**Request Body:**
```json
{
  "balance": 100,
  "lines": 3,
  "bet": 10
}
```

**Response Body (Success):**
```json
{
  "spin_result": [
    ["A", "D", "G"],
    ["B", "E", "H"],
    ["C", "F", "I"]
  ],
  "winnings": 50,
  "winning_lines": [1, 2],
  "total_bet": 30,
  "new_balance": 120
}
```

**Response Body (Error - e.g., Insufficient Funds):**
*Status Code: 400 Bad Request*
```json
{
  "detail": "Insufficient balance for this bet."
}
```