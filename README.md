# Specs-Driven Slot Machine

This project is a sophisticated slot machine game built to demonstrate **Specs-Driven Development (SDD)** and **AI-assisted engineering**.

### Origins & Evolution
The core logic was initially inspired by a [YouTube tutorial](https://www.youtube.com/watch?v=th4OBktqK1I) by Tim Ruscica ([Tech With Tim](https://www.youtube.com/c/TechWithTim)). Since the original implementation, this project has been significantly evolved and improved using **VS Code** and the **Gemini Code Assist** plugin to transition from a CLI script to a production-grade modular web application.

### Key Features
- **Specs-Driven Methodology:** Every feature is defined in the `specs/` directory before implementation.
- **5-Reel Mechanics:** Expanded from a 3x3 to a 5x3 grid with tiered payouts for 3, 4, and 5 matching symbols.
- **10 Complex Paylines:** Includes horizontal, V-shapes, zig-zags, and staircase patterns.
- **Wild Symbols:** Integrated "🌟" symbols that substitute for any standard symbol.
- **Web Interface:** A responsive SPA built with FastAPI, Tailwind CSS, and Vanilla JavaScript.
- **Interactive Info Modal:** Dynamic UI for rules and pay tables, synced with backend constants.
- **Layered Testing:** Comprehensive test suite including Unit tests, API Integration tests (API Object Model), and Playwright E2E tests (Page Object Model).

### Tech Stack
*   **Language:** Python
*   **AI Assistant:** VS Code with Gemini Code Assist
*   **Web Framework:** FastAPI & Uvicorn
*   **Frontend:** HTML5, CSS3 (Tailwind CSS), JavaScript (Vanilla)
*   **Testing:** PyTest (Unit/API) & Playwright (E2E)

### Installation

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt # This will now install 'playwright' as well
   ```
3. **Install Playwright Browsers:**
   ```bash
   python -m playwright install
   ```

### How to Run

**Web Application:**
```bash
uvicorn main:app --reload
```
Once running, access the interactive Swagger documentation at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
Once running, access the Web UI at: http://127.0.0.1:8000/

**CLI Version:**
```bash
python -m slot_machine.game
```

### Running Tests

To verify the application's functionality across the stack, you can run the following test commands:

**End-to-End (E2E) UI Tests:**
To run the UI tests while visually observing the browser interactions, use the headed mode:
```bash
python -m pytest --headed tests/test_ui_e2e.py
```
*Note: Ensure the FastAPI server is running in a separate terminal before executing E2E tests.*


	
