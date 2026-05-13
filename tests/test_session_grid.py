"""Unit tests for slot_machine/session_grid.py (Phase 9: session store)."""
import pytest

from slot_machine.session_grid import (
    SESSION_MAX_ENTRIES,
    clear_sessions_for_testing,
    get_last_reels,
    session_count,
    set_last_reels,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_sessions():
    """Clear the session store before and after every test."""
    clear_sessions_for_testing()
    yield
    clear_sessions_for_testing()


# ---------------------------------------------------------------------------
# Basic get/set behaviour
# ---------------------------------------------------------------------------

class TestGetSetLastReels:
    def test_get_returns_none_for_unknown_session(self):
        assert get_last_reels("unknown-session") is None

    def test_set_then_get_returns_same_grid(self):
        reels = [["♠", "♥"], ["♦", "♣"], ["♥", "♦"], ["♣", "♠"], ["♦", "♥"]]
        set_last_reels("session-1", reels)
        result = get_last_reels("session-1")
        assert result == reels

    def test_overwrite_session_reflects_new_grid(self):
        old = [["♠"] * 3] * 5
        new = [["♥"] * 3] * 5
        set_last_reels("sess", old)
        set_last_reels("sess", new)
        assert get_last_reels("sess") == new

    def test_multiple_sessions_are_independent(self):
        grid_a = [["♠", "♠", "♠"]] * 5
        grid_b = [["♥", "♥", "♥"]] * 5
        set_last_reels("A", grid_a)
        set_last_reels("B", grid_b)
        assert get_last_reels("A") == grid_a
        assert get_last_reels("B") == grid_b

    def test_get_returns_deep_copy(self):
        reels = [["♠", "♥", "♦"]] * 5
        set_last_reels("sess", reels)
        copy = get_last_reels("sess")
        copy[0][0] = "MUTATED"
        # Mutating the returned copy must not affect the stored grid
        assert get_last_reels("sess")[0][0] != "MUTATED"

    def test_set_stores_deep_copy(self):
        reels = [["♠", "♥", "♦"]] * 5
        set_last_reels("sess", reels)
        reels[0][0] = "MUTATED"  # mutate the original after storing
        assert get_last_reels("sess")[0][0] != "MUTATED"


# ---------------------------------------------------------------------------
# LRU eviction
# ---------------------------------------------------------------------------

class TestLRUEviction:
    def test_evicts_oldest_when_at_capacity(self):
        # Fill store to the cap using distinct session IDs
        for i in range(SESSION_MAX_ENTRIES):
            set_last_reels(f"s{i}", [["♠"] * 3] * 5)
        assert session_count() == SESSION_MAX_ENTRIES

        # Adding one more entry should evict the *first* one inserted ("s0")
        set_last_reels("s_extra", [["♥"] * 3] * 5)
        assert get_last_reels("s0") is None
        assert get_last_reels("s_extra") is not None

    def test_accessing_session_refreshes_lru_order(self):
        """The session accessed most recently should survive eviction."""
        for i in range(SESSION_MAX_ENTRIES):
            set_last_reels(f"s{i}", [["♠"] * 3] * 5)

        # Access "s0" so it becomes most recently used
        get_last_reels("s0")

        # Adding a new entry must evict "s1" (the new LRU), not "s0"
        set_last_reels("s_new", [["♥"] * 3] * 5)
        assert get_last_reels("s0") is not None, "s0 was recently accessed and should survive"
        assert get_last_reels("s1") is None, "s1 should be evicted as the new LRU"

    def test_session_count_never_exceeds_max(self):
        for i in range(SESSION_MAX_ENTRIES + 50):
            set_last_reels(f"s{i}", [["♠"] * 3] * 5)
        assert session_count() <= SESSION_MAX_ENTRIES


# ---------------------------------------------------------------------------
# clear_sessions_for_testing
# ---------------------------------------------------------------------------

class TestClearSessions:
    def test_clear_removes_all_sessions(self):
        set_last_reels("a", [["♠"] * 3] * 5)
        set_last_reels("b", [["♥"] * 3] * 5)
        clear_sessions_for_testing()
        assert session_count() == 0
        assert get_last_reels("a") is None
