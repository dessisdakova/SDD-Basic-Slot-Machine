# API Test Cases: Slot Machine

## 1. Configuration Endpoints

### TC-API-01: Configuration Returns Correct Structure and Values
**Title:** Verify that the configuration endpoint returns all necessary game constants.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a GET request to `/game/configuration`.
**Expected:** 
- Status Code: 200 OK.
- Response contains correct: `max_lines`, `min_bet`, `max_bet`, `rows`, `reels`, `symbols`, `winning_lines_config`, and `multipliers`.
- `symbols` is a list of strings.

## 2. Spin Execution (Success Scenarios)

### TC-API-02: Valid Spin Returns Required Fiels
**Title:** Execute a successful spin with valid balance, lines, and bet and validate it returns the required fields.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 1000, "lines": 5, "bet": 5}`.
**Expected:**
- Status Code: 200 OK.
- Response contains `spin_result` (3x5 grid), `winnings` (int >= 0), `winning_lines` (dict), `total_bet` (25), and `new_balance`.
- `new_balance` equals `1000 - 25 + winnings`.

### TC-API-03: Boundary Case - Minimum Valid Bet and Lines
**Title:** Execute a spin with the absolute minimum allowed parameters.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 100, "lines": 1, "bet": 1}`.
**Expected:**
- Status Code: 200 OK.
- `total_bet` is 1.

### TC-API-04: Boundary Case - Maximum Valid Bet and Lines
**Title:** Execute a spin with the absolute maximum allowed parameters.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 1000, "lines": 10, "bet": 10}`.
**Expected:**
- Status Code: 200 OK.
- `total_bet` is 100.

### TC-API-05: Exact Balance Spin
**Title:** Execute a spin where the total bet equals the current balance.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 50, "lines": 5, "bet": 10}`.
**Expected:**
- Status Code: 200 OK.
- `total_bet` is 50.
- If winnings are 0, `new_balance` is 0.

## 3. Negative and Edge Cases (Error Handling)

### TC-API-06: Insufficient Funds
**Title:** Attempt a spin when total bet exceeds balance.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 10, "lines": 5, "bet": 5}`.
**Expected:**
- Status Code: 400 Bad Request.
- Response body: `{"detail": "Insufficient balance for this bet."}`.

### TC-API-07: Invalid Input - Lines Below Range
**Title:** Attempt a spin with 0 lines.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 100, "lines": 0, "bet": 5}`.
**Expected:**
- Status Code: 422 Unprocessable Entity (FastAPI validation error).

### TC-API-08: Invalid Input - Lines Above Range
**Title:** Attempt a spin with more than MAX_LINES.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 100, "lines": 11, "bet": 5}`.
**Expected:**
- Status Code: 422 Unprocessable Entity.

### TC-API-09: Invalid Input - Bet Below Range
**Title:** Attempt a spin with 0 bet amount.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 100, "lines": 5, "bet": 0}`.
**Expected:**
- Status Code: 422 Unprocessable Entity.

### TC-API-10: Invalid Input - Negative Balance
**Title:** Attempt a spin with a negative balance.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": -100, "lines": 5, "bet": 5}`.
**Expected:**
- Status Code: 422 Unprocessable Entity.

### TC-API-11: Invalid Input - Data Type Mismatch
**Title:** Attempt a spin sending a string for an integer field.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": "rich", "lines": 5, "bet": 5}`.
**Expected:**
- Status Code: 422 Unprocessable Entity.

### TC-API-12: Missing Required Fields
**Title:** Attempt a spin with a missing field in the JSON body.
**Pre-conditions:** API server is running.
**Steps:**
1. Send a POST request to `/game/spin` with: `{"balance": 100, "lines": 5}` (missing bet).
**Expected:**
- Status Code: 422 Unprocessable Entity.