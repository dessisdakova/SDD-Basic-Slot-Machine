"""Unit tests for slot_machine/reel_actions.py (Phase 9: Hold and Nudge)."""
import pytest

from slot_machine.constants import (
    BONUS_SYMBOL,
    REELS,
    ROWS,
    SCATTER_SYMBOL,
    SYMBOLS_AND_COUNT,
)
from slot_machine.reel_actions import (
    apply_hold_to_grid,
    apply_nudge_to_column,
    generate_single_reel_column,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ALL_SYMBOLS = set(SYMBOLS_AND_COUNT.keys())

def _cycle_choice(sequence):
    """Return a choice function that cycles through a fixed sequence."""
    iterator = iter(sequence)
    def _choice(pool):
        return next(iterator)
    return _choice


# ---------------------------------------------------------------------------
# generate_single_reel_column
# ---------------------------------------------------------------------------

class TestGenerateSingleReelColumn:
    def test_returns_correct_length(self):
        col = generate_single_reel_column(reel_idx=2)
        assert len(col) == ROWS

    def test_all_symbols_valid(self):
        for reel_idx in range(REELS):
            col = generate_single_reel_column(reel_idx=reel_idx)
            for sym in col:
                assert sym in ALL_SYMBOLS, f"Unknown symbol {sym!r} on reel {reel_idx}"

    def test_bonus_forbidden_on_first_reel(self):
        """Running many times should never produce BONUS on reel 0."""
        for _ in range(200):
            col = generate_single_reel_column(reel_idx=0)
            assert BONUS_SYMBOL not in col

    def test_bonus_forbidden_on_last_reel(self):
        for _ in range(200):
            col = generate_single_reel_column(reel_idx=REELS - 1)
            assert BONUS_SYMBOL not in col

    def test_bonus_allowed_on_middle_reel(self):
        """At least one run out of many should include BONUS on an inner reel."""
        middle = REELS // 2
        found = any(BONUS_SYMBOL in generate_single_reel_column(reel_idx=middle) for _ in range(500))
        assert found, "BONUS_SYMBOL should be reachable on inner reels"

    def test_scatter_appears_at_most_once(self):
        for reel_idx in range(REELS):
            col = generate_single_reel_column(reel_idx=reel_idx)
            assert col.count(SCATTER_SYMBOL) <= 1

    def test_bonus_appears_at_most_once(self):
        for reel_idx in range(1, REELS - 1):
            col = generate_single_reel_column(reel_idx=reel_idx)
            assert col.count(BONUS_SYMBOL) <= 1

    def test_injectable_random_fn_controls_output(self):
        symbols = list(SYMBOLS_AND_COUNT.keys())
        # Non-special symbols so pool shrinkage doesn't break the cycle
        chosen = ["♣", "♦", "♥"]
        col = generate_single_reel_column(
            reel_idx=2,
            random_fn=_cycle_choice(chosen),
        )
        assert col == chosen

    def test_custom_rows_param(self):
        col = generate_single_reel_column(reel_idx=2, rows=2)
        assert len(col) == 2


# ---------------------------------------------------------------------------
# apply_hold_to_grid
# ---------------------------------------------------------------------------

class TestApplyHoldToGrid:
    def _make_previous(self):
        """Create a simple deterministic previous reel grid (columns-first)."""
        return [
            ["♠", "♠", "♠"],   # reel 0
            ["♥", "♥", "♥"],   # reel 1
            ["♦", "♦", "♦"],   # reel 2
            ["♣", "♣", "♣"],   # reel 3
            ["♦", "♣", "♥"],   # reel 4
        ]

    def test_held_columns_are_copied_verbatim(self):
        previous = self._make_previous()
        result = apply_hold_to_grid(previous, hold_columns=[0, 2, 4])
        assert result[0] == ["♠", "♠", "♠"]
        assert result[2] == ["♦", "♦", "♦"]
        assert result[4] == ["♦", "♣", "♥"]

    def test_unheld_columns_are_regenerated(self):
        """Unheld columns must differ from previous (statistically certain over many runs)."""
        previous = self._make_previous()
        # Hold columns 0, 2, 4 — columns 1 and 3 must regenerate
        mismatch_count = 0
        for _ in range(30):
            result = apply_hold_to_grid(previous, hold_columns=[0, 2, 4])
            if result[1] != ["♥", "♥", "♥"] or result[3] != ["♣", "♣", "♣"]:
                mismatch_count += 1
        assert mismatch_count > 0, "Unheld columns should sometimes differ from previous"

    def test_result_has_correct_shape(self):
        previous = self._make_previous()
        result = apply_hold_to_grid(previous, hold_columns=[1])
        assert len(result) == REELS
        for col in result:
            assert len(col) == ROWS

    def test_hold_all_but_one(self):
        """MAX_HOLD_COLUMNS = 4 means holding columns 0–3 is valid."""
        previous = self._make_previous()
        result = apply_hold_to_grid(previous, hold_columns=[0, 1, 2, 3])
        for i in range(4):
            assert result[i] == previous[i]
        assert len(result[4]) == ROWS  # last column freshly generated

    def test_hold_empty_list_regenerates_all(self):
        """Passing an empty hold list should regenerate all columns."""
        previous = self._make_previous()
        result = apply_hold_to_grid(previous, hold_columns=[])
        assert len(result) == REELS
        for col in result:
            assert len(col) == ROWS

    def test_held_column_is_a_copy_not_same_reference(self):
        previous = self._make_previous()
        result = apply_hold_to_grid(previous, hold_columns=[0])
        result[0][0] = "MUTATED"
        assert previous[0][0] != "MUTATED", "Hold should return a copy, not a reference"

    def test_injectable_rng_controls_fresh_columns(self):
        previous = self._make_previous()
        # Supply a deterministic RNG that always returns "♣"
        result = apply_hold_to_grid(
            previous, hold_columns=[0], random_fn=lambda pool: "♣"
        )
        # Column 0 held, columns 1–4 freshly generated as all "♣"
        assert result[0] == previous[0]
        for c in range(1, REELS):
            assert all(s == "♣" for s in result[c])


# ---------------------------------------------------------------------------
# apply_nudge_to_column
# ---------------------------------------------------------------------------

class TestApplyNudgeToColumn:
    def test_downward_shift_of_symbols(self):
        """Top ← middle, middle ← bottom; bottom is new."""
        column = ["♠", "♥", "♦"]
        result = apply_nudge_to_column(column, reel_idx=2, random_fn=lambda pool: "♣")
        assert result[0] == "♥"   # old middle
        assert result[1] == "♦"   # old bottom
        assert result[2] == "♣"   # new symbol

    def test_returns_correct_length(self):
        col = ["♠", "♥", "♦"]
        result = apply_nudge_to_column(col, reel_idx=2)
        assert len(result) == ROWS

    def test_original_column_not_mutated(self):
        col = ["♠", "♥", "♦"]
        original = list(col)
        apply_nudge_to_column(col, reel_idx=2)
        assert col == original

    def test_bonus_excluded_on_first_reel(self):
        col = ["♠", "♥", "♦"]
        for _ in range(200):
            result = apply_nudge_to_column(col, reel_idx=0)
            assert result[2] != BONUS_SYMBOL

    def test_bonus_excluded_on_last_reel(self):
        col = ["♠", "♥", "♦"]
        for _ in range(200):
            result = apply_nudge_to_column(col, reel_idx=REELS - 1)
            assert result[2] != BONUS_SYMBOL

    def test_scatter_excluded_when_already_present_in_column(self):
        """If scatter is already visible, the new symbol must not be scatter."""
        col = [SCATTER_SYMBOL, "♥", "♦"]
        for _ in range(200):
            result = apply_nudge_to_column(col, reel_idx=2)
            assert result[2] != SCATTER_SYMBOL

    def test_bonus_excluded_when_already_present_in_column(self):
        """If bonus is already visible on an inner reel, the new symbol must not be bonus."""
        col = [BONUS_SYMBOL, "♥", "♦"]
        for _ in range(200):
            result = apply_nudge_to_column(col, reel_idx=2)
            assert result[2] != BONUS_SYMBOL

    def test_new_symbol_is_valid(self):
        col = ["♠", "♥", "♦"]
        for _ in range(50):
            result = apply_nudge_to_column(col, reel_idx=2)
            assert result[2] in ALL_SYMBOLS

    def test_multiple_nudges_chain_correctly(self):
        """Applying three nudges in sequence should shift the column three times."""
        col = ["♠", "♥", "♦"]
        fixed_new = "♣"
        # After nudge 1: ["♥", "♦", "♣"]
        col = apply_nudge_to_column(col, reel_idx=2, random_fn=lambda p: fixed_new)
        assert col[0] == "♥"
        assert col[1] == "♦"
        assert col[2] == fixed_new
        # After nudge 2: ["♦", "♣", "♣"]
        col = apply_nudge_to_column(col, reel_idx=2, random_fn=lambda p: fixed_new)
        assert col[0] == "♦"
        assert col[1] == fixed_new
        assert col[2] == fixed_new
