import pytest
from playwright.sync_api import Page, expect
from tests.pages.game_page import SlotMachinePage

def test_ui_spin_updates_balance(page: Page):
    """Verified that a spin correctly updates the balance in the UI."""
    game_page = SlotMachinePage(page)
    game_page.navigate()
    
    # Handle the initial deposit modal
    game_page.deposit_money(100)
    
    initial_balance = game_page.get_balance()
    
    # Perform a spin: 1 line * 10 bet = 10 cost
    game_page.play_round(lines=1, bet=10)
    
    # The new balance should not be the same as initial
    # (It would be initial - 10 + winnings)
    final_balance = game_page.get_balance()
    assert final_balance != initial_balance

def test_insufficient_funds_error_message(page: Page):
    game_page = SlotMachinePage(page)
    game_page.navigate()
    
    # Handle the initial deposit modal
    game_page.deposit_money(50)
    
    # Try to bet more than the $50 starting balance (10 lines * $10 = $100)
    game_page.play_round(lines=10, bet=10)
    
    expect(game_page.message_area).to_contain_text("Insufficient balance")