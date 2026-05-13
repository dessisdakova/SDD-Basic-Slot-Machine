"""Reel action helpers for Hold and Nudge features (Phase 9).

Nudge semantics — Option A ("shift + fill"), NUDGE_DIRECTION = "down":
    A downward nudge shifts one column down by one position:
        new[0] = old[1]          (top cell takes the old middle symbol)
        new[1] = old[2]          (middle cell takes the old bottom symbol)
        new[2] = fresh symbol    (drawn from the legal per-reel pool for that column)

    The new bottom symbol obeys the same rules as generate_random_reels_in_spin:
        - BONUS_SYMBOL is forbidden on the first and last reel.
        - If the column already contains a SCATTER_SYMBOL or BONUS_SYMBOL, that
          symbol is excluded from the draw (once-per-reel constraint).

Hold semantics:
    Held columns are copied verbatim from the server-authoritative previous reel
    grid; every other column is freshly generated using the same per-reel rules
    as generate_random_reels_in_spin.
"""
from __future__ import annotations

import random as _random
from collections.abc import Callable

from slot_machine.constants import (
    BONUS_SYMBOL,
    REELS,
    ROWS,
    SCATTER_SYMBOL,
    SYMBOLS_AND_COUNT,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_symbol_pool() -> list[str]:
    """Return the full expanded symbol pool (one entry per count unit)."""
    pool: list[str] = []
    for symbol, count in SYMBOLS_AND_COUNT.items():
        pool.extend([symbol] * count)
    return pool


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def generate_single_reel_column(
    reel_idx: int,
    rows: int = ROWS,
    reels: int = REELS,
    random_fn: Callable[[list[str]], str] | None = None,
) -> list[str]:
    """Generate one reel column obeying per-reel symbol rules.

    Mirrors the inner loop of ``generate_random_reels_in_spin`` for a single
    reel, with an injectable *random_fn* for deterministic testing.

    :param reel_idx: Zero-based column index.
    :param rows: Number of symbols in the column.
    :param reels: Total number of reels (needed to detect first/last reel).
    :param random_fn: Optional ``(pool: list[str]) -> str`` callable.
                      Defaults to ``random.choice``.
    :return: List of ``rows`` symbols for this reel.
    """
    choice = random_fn if random_fn is not None else _random.choice
    current_symbols = _get_symbol_pool()
    column: list[str] = []

    for _ in range(rows):
        available = current_symbols[:]
        if reel_idx == 0 or reel_idx == reels - 1:
            available = [s for s in available if s != BONUS_SYMBOL]
        if not available:  # safety fallback — should not occur with balanced counts
            available = current_symbols[:]

        value = choice(available)
        column.append(value)

        # "Once per reel": remove *all* instances of the special symbol so it
        # cannot appear again in this column.
        if value in (SCATTER_SYMBOL, BONUS_SYMBOL):
            current_symbols = [s for s in current_symbols if s != value]
        else:
            current_symbols.remove(value)

    return column


def apply_hold_to_grid(
    previous_reels: list[list[str]],
    hold_columns: list[int],
    rows: int = ROWS,
    reels: int = REELS,
    random_fn: Callable[[list[str]], str] | None = None,
) -> list[list[str]]:
    """Build a new reel grid by merging held columns with freshly generated ones.

    Held columns (indices in *hold_columns*) are copied verbatim from
    *previous_reels*; every other column is regenerated via
    ``generate_single_reel_column``.

    :param previous_reels: Authoritative stored grid from the last spin
                           (columns-first: ``previous_reels[reel_idx][row_idx]``).
    :param hold_columns: Sorted list of zero-based column indices to freeze.
    :param rows: Number of rows per reel.
    :param reels: Total number of reels.
    :param random_fn: Forwarded to ``generate_single_reel_column`` for tests.
    :return: New reels list (columns-first), same shape as *previous_reels*.
    """
    new_reels: list[list[str]] = []
    for reel_idx in range(reels):
        if reel_idx in hold_columns:
            new_reels.append(list(previous_reels[reel_idx]))
        else:
            new_reels.append(
                generate_single_reel_column(reel_idx, rows, reels, random_fn)
            )
    return new_reels


def apply_nudge_to_column(
    column: list[str],
    reel_idx: int,
    rows: int = ROWS,
    reels: int = REELS,
    random_fn: Callable[[list[str]], str] | None = None,
) -> list[str]:
    """Apply one downward nudge to a single reel column.

    Shift semantics (NUDGE_DIRECTION = "down"):
        position 0 (top)    ← old position 1 (middle)
        position 1 (middle) ← old position 2 (bottom)
        position 2 (bottom) ← one new symbol drawn from the legal pool

    The new bottom symbol obeys per-reel constraints:
        - BONUS_SYMBOL excluded on the first and last reel.
        - If *column* already contains SCATTER_SYMBOL or BONUS_SYMBOL, that
          symbol is excluded from the draw (once-per-reel constraint applied to
          the existing visible symbols).

    :param column: Current symbols in this reel, top-to-bottom (length == rows).
    :param reel_idx: Zero-based column index.
    :param rows: Expected column length.
    :param reels: Total reels (to identify first/last).
    :param random_fn: Optional ``(pool: list[str]) -> str`` callable for tests.
    :return: New column after the downward nudge (length == rows).
    """
    choice = random_fn if random_fn is not None else _random.choice

    # Build draw pool for the new bottom symbol.
    pool = _get_symbol_pool()

    # Once-per-reel: exclude special symbols already visible in the column.
    for special in (SCATTER_SYMBOL, BONUS_SYMBOL):
        if special in column:
            pool = [s for s in pool if s != special]

    # First / last reel: bonus symbol forbidden.
    if reel_idx == 0 or reel_idx == reels - 1:
        pool = [s for s in pool if s != BONUS_SYMBOL]

    if not pool:  # safety fallback
        pool = _get_symbol_pool()

    new_symbol = choice(pool)

    # Downward shift: [old[1], old[2], ..., new_symbol]
    return list(column[1:rows]) + [new_symbol]
