from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from slot_machine.constants import (
    MAX_LINES, MIN_BET, MAX_BET, ROWS, REELS, SYMBOLS_AND_COUNT, 
    WINNING_LINES, SYMBOLS_AND_MULTIPLIERS, SCATTER_SYMBOL, SCATTER_MULTIPLIERS,
    BONUS_SYMBOL, BONUS_MINI_GAME_PRIZES
)
from slot_machine.game import execute_spin

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
        "bonus_mini_game_prizes": BONUS_MINI_GAME_PRIZES
    }

@app.post("/game/spin")
async def post_spin(request: SpinRequest):
    """Executes a spin and returns the results."""
    try:
        # execute_spin handles the mathematical logic and validation
        result = execute_spin(
            balance=request.balance, 
            lines=request.lines, 
            bet=request.bet,
            is_free_spin=request.is_free_spin
        )
        return result
    except ValueError as e:
        # Catches issues like insufficient balance
        raise HTTPException(status_code=400, detail=str(e))