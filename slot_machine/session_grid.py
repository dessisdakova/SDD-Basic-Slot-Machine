"""Process-local session store for the last committed reel grid (Phase 9).

Maps ``client_session_id`` (str) → last reel grid (columns-first list of lists).
Uses LRU eviction (via ``collections.OrderedDict``) to bound memory usage.

Restarting the server clears all stored sessions — document this in the UI and
info modal so players know hold state is ephemeral.
"""
from __future__ import annotations

from collections import OrderedDict

# Maximum simultaneous sessions kept in memory before LRU eviction kicks in.
SESSION_MAX_ENTRIES = 1000

# Private store: { session_id: reels (list[list[str]]) }
_sessions: OrderedDict[str, list[list[str]]] = OrderedDict()


def get_last_reels(session_id: str) -> list[list[str]] | None:
    """Return a deep copy of the stored reel grid for *session_id*, or ``None``.

    Accessing a key marks it as most-recently-used (LRU refresh).
    """
    if session_id not in _sessions:
        return None
    _sessions.move_to_end(session_id)
    return [list(col) for col in _sessions[session_id]]


def set_last_reels(session_id: str, reels: list[list[str]]) -> None:
    """Store (or overwrite) the reel grid for *session_id*.

    If the store is at capacity, the least-recently-used entry is evicted first
    to prevent unbounded memory growth.
    """
    if session_id in _sessions:
        _sessions.move_to_end(session_id)
    _sessions[session_id] = [list(col) for col in reels]
    while len(_sessions) > SESSION_MAX_ENTRIES:
        _sessions.popitem(last=False)


def session_count() -> int:
    """Return the current number of stored sessions (useful for tests)."""
    return len(_sessions)


def clear_sessions_for_testing() -> None:
    """Remove all stored sessions — call only from test code."""
    _sessions.clear()
