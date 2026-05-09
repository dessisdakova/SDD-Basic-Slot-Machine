# Specification: Phase 1 - Web API (FastAPI)

## Goal & Scope
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
  "symbols": ["A", "B", "C", "D"],
  "winning_lines_config": { "1": [[0,0], [0,1], [0,2]], ... }
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

## Web User Interface (Frontend)
A basic Single Page Application (SPA) will be served to provide a visual representation of the slot machine and allow user interaction.

**Technology Stack:**
- **HTML5:** For structuring the web page.
- **CSS3 (Tailwind CSS via CDN):** For styling and responsive design.
- **JavaScript (Vanilla):** For client-side logic, interacting with the FastAPI backend via `fetch` API.

**Key UI Components:**
- **Deposit Modal:** Prompts for initial cash entry on page load or after cashout.
- **Balance Display:** Shows the player's current balance.
- **Slot Grid (3x3):** Displays the symbols after each spin.
- **Controls:** Input fields for "Lines to Bet" and "Bet per Line".
- **Spin Button:** Triggers a new game spin.
- **Cashout Button:** Ends the session and shows final results.
- **Cashout Modal:** Displays the total amount cashed out and offers a "Play Again" option.
- **Message Area:** Displays game messages, winnings, or error notifications.

**Interaction Flow:**
1.  On page load, `script.js` fetches game configuration from `/game/configuration` to set dynamic UI limits (e.g., `max_lines`).
2.  User is prompted by the **Deposit Modal** to enter a starting balance.
3.  User inputs `lines` and `bet` and clicks "SPIN".
3.  `script.js` sends a POST request to `/game/spin` with the current `balance`, selected `lines`, and `bet`.
4.  Upon receiving a successful response, the UI updates the `balance`, `slot-grid` with `spin_result`, and `message-area` with `winnings` or a "better luck next time" message.
5.  In case of an error (e.g., insufficient funds), the `message-area` displays the error detail from the API.
7.  User can click **CASHOUT** at any time to see the **Cashout Modal** and reset the game state.

## Testing
To ensure the correctness and robustness of Phase 1, the following testing strategies are employed:

### API Integration Tests
- **Framework:** Pytest with `fastapi.testclient.TestClient`.
- **Approach:** API Object Model (`tests/game_api_client.py`) is used to abstract API calls, making tests cleaner and more maintainable.
- **Coverage:** Verifies `/game/configuration` returns the expected structure and constants, and `/game/spin` handles successful spins and error conditions (e.g., insufficient funds) as per the API specification.

### End-to-End (E2E) UI Tests
- **Framework:** Playwright.
- **Approach:** Page Object Model (`tests/pages/game_page.py`) is used to represent UI elements and interactions, decoupling tests from direct DOM manipulation.
- **Coverage:** Verifies that UI interactions (e.g., clicking spin) correctly trigger API calls, update the displayed balance, and show appropriate messages for successful spins and error conditions.

This comprehensive approach ensures that both the backend API and the frontend UI adhere to the defined specifications and function correctly.
```