"""Process-local progressive jackpot pool (Phase 8).

Pool resets to JACKPOT_SEED on process start and after each jackpot win.
Restarting the server resets the pool to the seed.
"""
from __future__ import annotations

import random
from collections.abc import Callable

from slot_machine.constants import (
    JACKPOT_CONTRIBUTION_PERCENT_OF_TOTAL_BET,
    JACKPOT_HIT_PROBABILITY,
    JACKPOT_SEED,
)

_jackpot_pool: int = JACKPOT_SEED


def get_jackpot_pool() -> int:
    return _jackpot_pool


def contribution_amount(total_bet: int, is_free_spin: bool) -> int:
    """Integer dollars added to the pool for this spin (0 if not a paid spin)."""
    if is_free_spin or total_bet <= 0:
        return 0
    raw = (total_bet * JACKPOT_CONTRIBUTION_PERCENT_OF_TOTAL_BET) // 100
    # Percentage uses integer floor; ensure a token contribution on small total bets.
    if raw == 0:
        return 1
    return raw


def process_jackpot_for_spin(
    total_bet: int,
    is_free_spin: bool,
    random_fn: Callable[[], float] | None = None,
) -> tuple[int, bool, int]:
    """Apply contribution and resolve at most one jackpot win for this spin.

    Order (must stay aligned with specs/phase_8_progressive_jackpots.md):
    1. Line/scatter/bonus/free-spin resolution happens in ``check_winning_combinations`` (caller).
    2. Here: on paid spins only, add contribution from ``total_bet`` to the pool.
    3. Then: on paid spins only, one independent Bernoulli trial (``JACKPOT_HIT_PROBABILITY``).
    4. On hit: payout equals the pool *after* contribution; pool resets to ``JACKPOT_SEED``.

    Free spins do not contribute and do not participate in the hit trial.

    :param random_fn: Optional ``() -> float in [0, 1)`` for tests; defaults to ``random.random``.
    :return: ``(jackpot_pool_after_spin, jackpot_won, jackpot_win_amount)``.
    """
    global _jackpot_pool
    rng = random_fn or random.random

    if is_free_spin:
        return _jackpot_pool, False, 0

    contrib = contribution_amount(total_bet, False)
    _jackpot_pool += contrib

    if rng() < JACKPOT_HIT_PROBABILITY:
        win_amount = _jackpot_pool
        _jackpot_pool = JACKPOT_SEED
        return _jackpot_pool, True, win_amount

    return _jackpot_pool, False, 0


def set_jackpot_pool_for_testing(value: int) -> None:
    """Reset pool to a known value (used by tests only)."""
    global _jackpot_pool
    _jackpot_pool = value
