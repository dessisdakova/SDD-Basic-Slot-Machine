# Specification: Phase 10 — User Profiles & Persistence

## Goal & Scope

Replace the current **stateless, client-trusted** architecture with a **persistent, server-authoritative** one: player identities, balances, and spin history survive server restarts and are scoped to authenticated accounts rather than browser sessions.

Today the client sends its own `balance` on every `POST /game/spin`, meaning any player can forge an arbitrary balance. The jackpot pool and hold-session grids (Phase 8 & 9) live in process memory and are lost on restart. Phase 10 fixes all three by introducing a **lightweight database layer** and **token-based authentication**.

**In scope (target delivery)**

- **User accounts:** register (username + password), login, logout.
- **Server-owned balance:** balance is stored in the DB and never sent by the client; `POST /game/spin` no longer accepts a `balance` field.
- **Spin history:** each completed spin is recorded (timestamp, bet, lines, winnings, new balance).
- **Persistent jackpot pool:** the progressive jackpot pool survives server restarts.
- **Persistent hold sessions:** the Phase 9 session-grid store is migrated from in-memory LRU to DB rows (keyed by user ID, replacing the `client_session_id` approach).
- **Authentication middleware:** all game endpoints require a valid token.
- **Profile endpoint:** `GET /user/profile` returns username, current balance, and spin count.

**Out of scope (initial delivery)**

- Password reset / email verification.
- Multi-device / concurrent-session conflict resolution.
- Full audit log with replay (may follow in Phase 15–16).
- Role-based access control (admin vs. player).

---

## Concepts

### Server-authoritative balance

The client no longer sends `balance`. On `POST /game/spin` the server looks up the authenticated user's balance, validates it, runs the spin, and writes the updated balance back — all in a single DB transaction. The response still returns `new_balance` so the frontend can display it, but the canonical value lives in the DB.

### Authentication flow

- **Register:** `POST /auth/register` — creates a user record, returns an access token.
- **Login:** `POST /auth/login` — validates credentials, returns an access token.
- **Token:** a short-lived **JWT** (or a signed opaque token stored server-side) sent as a `Bearer` header on every subsequent request.
- **Logout:** client discards the token (stateless JWT) or `POST /auth/logout` invalidates it (stateful).

### Spin history

Each spin appended to a `spins` table:  
`(id, user_id, timestamp, lines, bet, total_bet, winnings, new_balance, jackpot_won, is_free_spin)`.  
No full grid storage required at this phase (full replay is Phase 15+).

---

## Functional Requirements

1. **Registration & login**  
   `POST /auth/register` and `POST /auth/login` accept `username` + `password`; return `{ access_token, token_type }`. Passwords are stored as bcrypt hashes (never plaintext).

2. **Balance ownership**  
   On register, a configurable `INITIAL_BALANCE` is credited. The `balance` field is **removed** from `SpinRequest`; the server reads it from the DB. If the authenticated user has insufficient balance the server returns `400 Insufficient balance`.

3. **Deposit endpoint**  
   `POST /user/deposit` accepts `{ amount: int }` (between `MIN_DEPOSIT` and `MAX_DEPOSIT` from constants) and adds to the user's balance. Replaces the client-side deposit overlay logic.

4. **Spin atomicity**  
   The entire spin pipeline (balance debit + grid evaluation + jackpot + balance credit + spin record insert) executes inside a single DB transaction; partial failures must roll back completely.

5. **Persistent jackpot pool**  
   The `_jackpot_pool` global in `jackpot.py` is replaced by a single-row DB table. Reads and writes happen within the same transaction as the spin (point 4). A migration seeds the table with `JACKPOT_SEED` if no row exists.

6. **Persistent hold sessions**  
   `session_grid.py`'s in-memory `OrderedDict` is replaced by a `hold_sessions` DB table `(user_id PK, reels_json TEXT, updated_at TIMESTAMP)`. The `client_session_id` field on `SpinRequest` is removed; the server derives the key from the authenticated user's ID.

7. **Spin history**  
   After each successful spin the server inserts a row into the `spins` table (non-blocking best-effort is acceptable; a write failure must not roll back the spin itself — log and continue).

8. **Profile endpoint**  
   `GET /user/profile` (auth required) returns `{ username, balance, spin_count, member_since }`.

9. **Backward-compatible spin response**  
   All existing response fields (`spin_result`, `winnings`, `winning_lines`, etc.) are preserved. New additions: `balance` (renamed from `new_balance` for clarity — or both kept for a transitional period).

---

## Database Design

### Recommended stack

**SQLite** (via **SQLAlchemy** Core or ORM) for zero-dependency local development; can be swapped for PostgreSQL by changing the connection string. A lightweight migration tool (**Alembic**) manages schema changes.

### Tables (proposed)

| Table | Key columns |
| ----- | ----------- |
| `users` | `id PK`, `username UNIQUE`, `password_hash`, `balance INT`, `member_since TIMESTAMP` |
| `jackpot` | `id PK` (always row 1), `pool INT` |
| `hold_sessions` | `user_id PK FK→users`, `reels_json TEXT`, `updated_at TIMESTAMP` |
| `spins` | `id PK`, `user_id FK→users`, `timestamp`, `lines`, `bet`, `total_bet`, `winnings`, `new_balance`, `jackpot_won BOOL`, `is_free_spin BOOL` |

---

## Constants & Configuration (`slot_machine/constants.py`)

| Constant (proposed) | Purpose |
| ------------------- | ------- |
| `INITIAL_BALANCE` | Credits awarded on registration (e.g. 500). |
| `MIN_DEPOSIT` | Minimum deposit amount (e.g. 50). |
| `MAX_DEPOSIT` | Maximum deposit amount (e.g. 5000). |
| `JWT_SECRET_KEY` | Signing key — loaded from environment variable `JWT_SECRET`, **never** hard-coded. |
| `JWT_EXPIRE_MINUTES` | Token lifetime (e.g. 60). |
| `DATABASE_URL` | Connection string — loaded from environment variable `DATABASE_URL`, defaults to `sqlite:///./slot_machine.db`. |

---

## Backend Design

### 1. New files

- **`slot_machine/database.py`** — SQLAlchemy engine, `SessionLocal` factory, `Base` declarative, `get_db` dependency for FastAPI.
- **`slot_machine/models.py`** — ORM models: `User`, `Jackpot`, `HoldSession`, `Spin`.
- **`slot_machine/auth.py`** — password hashing (`bcrypt`), JWT encode/decode, `get_current_user` FastAPI dependency.
- **`alembic/`** — migration environment; initial migration creates all four tables and seeds the jackpot row.

### 2. Modified files

- **`slot_machine/jackpot.py`** — `get_jackpot_pool()` and `process_jackpot_for_spin()` accept an optional `db` session; fall back to the in-memory global when no session is provided (keeps CLI path working).
- **`slot_machine/session_grid.py`** — `get_last_reels()` / `set_last_reels()` accept an optional `db` session and `user_id`; fall back to the in-memory store when no DB is provided (keeps existing tests green).
- **`slot_machine/game.py`** — `execute_spin` gains an optional `db` parameter; balance read/write moves here (replacing the `balance` parameter for the web path).
- **`main.py`** — `SpinRequest` drops `balance` and `client_session_id`; new routers `auth_router` and `user_router` registered; all game endpoints protected by `get_current_user`.

### 3. `main.py` / API changes

New endpoints:

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `POST` | `/auth/register` | No | Create account, return token |
| `POST` | `/auth/login` | No | Validate credentials, return token |
| `GET` | `/user/profile` | Yes | Return username, balance, spin count |
| `POST` | `/user/deposit` | Yes | Add funds to balance |

Modified endpoints:

| Method | Path | Change |
| ------ | ---- | ------ |
| `POST` | `/game/spin` | `balance` field removed from request; auth required; balance read/written server-side |
| `GET` | `/game/configuration` | No structural change; may add `initial_balance` |

---

## Frontend (`static/`)

1. **Auth screens** — replace deposit overlay with a tabbed **Login / Register** form; store JWT in `localStorage`.
2. **Authenticated requests** — all `fetch` calls add `Authorization: Bearer <token>` header.
3. **Deposit flow** — `POST /user/deposit` replaces client-side balance mutation; balance display updated from server response.
4. **Profile display** — small widget (username + spin count) near the balance panel.
5. **Logout** — button that clears the token and shows the auth screen.

---

## Testing

| Layer | Requirement |
| ----- | ----------- |
| **Unit** | Password hashing round-trip; JWT encode/decode; balance-insufficient guard in `execute_spin`. |
| **Unit** | `jackpot.py` and `session_grid.py` dual-path: in-memory fallback (existing tests unchanged) + DB path with an in-memory SQLite fixture. |
| **Integration** | `execute_spin` with a real DB session; spin atomicity (mock a DB write failure mid-spin; verify balance not changed). |
| **API** | Register → login → spin full happy path; 401 on unauthenticated spin; 400 on insufficient balance. |
| **Regression** | Phases 1–9 unit tests still pass (CLI path uses no DB; web tests use a test DB fixture). |

---

## Migration strategy

1. Add **Alembic** to `requirements.txt`.
2. Initial migration: create all tables, seed `jackpot` row with `JACKPOT_SEED`.
3. The old `client_session_id` field on `SpinRequest` is removed; hold sessions are keyed by authenticated `user_id`.
4. The in-memory LRU store in `session_grid.py` and the global `_jackpot_pool` in `jackpot.py` are kept as a **CLI-only fallback** (guarded by `if db is None`).

---

## Decisions log (fill in during implementation)

_Record final choices that this spec leaves open._

| Topic | Options | Decision (TBD at implementation) |
| ----- | -------- | ---------------------------------- |
| Token strategy | Stateless JWT vs. server-side token table | |
| ORM vs. Core | SQLAlchemy ORM models vs. Core table objects | |
| Migration tool | Alembic vs. manual `CREATE TABLE` on startup | |
| Spin history failure | Roll back spin on history write failure vs. log-and-continue | |
| Password rules | Min length only vs. complexity requirements | |

---

## References

- `specs/roadmap.md` — Part II, Phase 10: User Profiles & Persistence.
- `specs/phase_9_nudge_and_hold_features.md` — session store and `client_session_id` to be replaced.
- Spin pipeline: `slot_machine/game.py`, `slot_machine/jackpot.py`, `slot_machine/session_grid.py`, `main.py`.
- Prior trust-model note: Phase 9 spec §"Session & trust model", paragraph "Future (Phase 10+)".
