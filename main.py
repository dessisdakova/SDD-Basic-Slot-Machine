from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator, model_validator

from slot_machine.constants import (
    BONUS_MINI_GAME_PRIZES,
    BONUS_SYMBOL,
    HOLD_AND_NUDGE_RULES_SUMMARY,
    HOLD_FEATURE_ENABLED,
    JACKPOT_CONTRIBUTION_PERCENT_OF_TOTAL_BET,
    JACKPOT_RULES_SUMMARY,
    JACKPOT_SEED,
    MAX_BET,
    MAX_HOLD_COLUMNS,
    MAX_LINES,
    # MAX_NUDGES_PER_PAID_SPIN,  # nudge feature hidden
    MIN_BET,
    # NUDGE_FEATURE_ENABLED,     # nudge feature hidden
    REELS,
    ROWS,
    SCATTER_MULTIPLIERS,
    SCATTER_SYMBOL,
    SYMBOLS_AND_COUNT,
    SYMBOLS_AND_MULTIPLIERS,
    WINNING_LINES,
)
from slot_machine.game import execute_spin
from slot_machine.jackpot import get_jackpot_pool

app = FastAPI(title="Slot Machine API")

# Serve static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def read_index():
    return FileResponse("static/index.html")


class SpinRequest(BaseModel):
    balance: int = Field(..., gt=0, description="The current player balance")
    lines: int = Field(..., ge=1, le=MAX_LINES, description="Number of lines to bet on")
    bet: int = Field(..., ge=MIN_BET, le=MAX_BET, description="Bet amount per line")
    is_free_spin: bool = Field(default=False, description="Whether this is a free spin")
    # Phase 9: Hold and Nudge
    client_session_id: Optional[str] = Field(
        default=None,
        description="Opaque client-generated UUID for session-aware hold support",
    )
    hold_columns: Optional[list[int]] = Field(
        default=None,
        description="Zero-based column indices to freeze from the previous spin",
    )
    # nudge_sequence: Optional[list[int]] = Field(  # nudge feature hidden
    #     default=None,
    #     description="Ordered column indices; each entry applies one downward nudge",
    # )

    @field_validator("hold_columns")
    @classmethod
    def validate_hold_columns(cls, v: Optional[list[int]]) -> Optional[list[int]]:
        if v is None:
            return v
        for idx in v:
            if idx < 0 or idx >= REELS:
                raise ValueError(
                    f"hold_columns: column index {idx} is out of range (0–{REELS - 1})"
                )
        if len(v) != len(set(v)):
            raise ValueError("hold_columns: duplicate column indices are not allowed")
        return v

    # @field_validator("nudge_sequence")          # nudge feature hidden
    # @classmethod
    # def validate_nudge_sequence(cls, v):
    #     ...

    @model_validator(mode="after")
    def hold_require_paid_spin(self) -> "SpinRequest":
        if self.is_free_spin and self.hold_columns:
            raise ValueError("hold_columns is not allowed on free spins")
        return self


@app.get("/game/configuration")
async def get_configuration():
    """Returns the current game settings and constants."""
    return {
        "max_lines": MAX_LINES,
        "min_bet": MIN_BET,
        "max_bet": MAX_BET,
        "rows": ROWS,
        "reels": REELS,
        "symbols": list(SYMBOLS_AND_COUNT.keys()),
        "winning_lines_config": WINNING_LINES,
        "multipliers": SYMBOLS_AND_MULTIPLIERS,
        "scatter_symbol": SCATTER_SYMBOL,
        "scatter_multipliers": {str(k): v for k, v in SCATTER_MULTIPLIERS.items()},
        "bonus_symbol": BONUS_SYMBOL,
        "bonus_mini_game_prizes": BONUS_MINI_GAME_PRIZES,
        "jackpot_pool": get_jackpot_pool(),
        "jackpot_seed": JACKPOT_SEED,
        "jackpot_contribution_percent_of_total_bet": JACKPOT_CONTRIBUTION_PERCENT_OF_TOTAL_BET,
        "jackpot_rules_summary": JACKPOT_RULES_SUMMARY,
        # Phase 9: feature flags and config for UI gating
        "features": {
            "hold": HOLD_FEATURE_ENABLED,
            "nudge": False,  # nudge feature hidden
        },
        "max_hold_columns": MAX_HOLD_COLUMNS,
        # "max_nudges_per_paid_spin": ...,  # nudge feature hidden
        "hold_and_nudge_rules_summary": HOLD_AND_NUDGE_RULES_SUMMARY,
    }


@app.post("/game/spin")
async def post_spin(request: SpinRequest):
    """Executes a spin and returns the results."""
    try:
        result = execute_spin(
            balance=request.balance,
            lines=request.lines,
            bet=request.bet,
            is_free_spin=request.is_free_spin,
            client_session_id=request.client_session_id,
            hold_columns=request.hold_columns,
            # nudge_sequence=request.nudge_sequence,  # nudge feature hidden
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))