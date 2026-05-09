from playwright.sync_api import Page

class SlotMachinePage:
    """Page Object Model for the Slot Machine UI."""

    def __init__(self, page: Page):
        self.page = page
        self.url = "http://localhost:8000/"
        self.balance_display = page.locator("#balance-display")
        self.lines_input = page.locator("#lines-input")
        self.bet_input = page.locator("#bet-input")
        self.spin_button = page.locator("#spin-button")
        self.message_area = page.locator("#message-area")
        self.slot_cells = page.locator(".slot-cell")

    def navigate(self):
        self.page.goto(self.url)

    def play_round(self, lines: int, bet: int):
        """Sets inputs and clicks spin."""
        self.lines_input.fill(str(lines))
        self.bet_input.fill(str(bet))
        self.spin_button.click()

    def get_balance(self) -> int:
        text = self.balance_display.inner_text()
        return int(text.replace('$', ''))

    def get_message(self) -> str:
        return self.message_area.inner_text()

    def get_grid_symbols(self) -> list:
        """Returns all 9 symbols currently displayed in the grid."""
        return self.slot_cells.all_inner_texts()