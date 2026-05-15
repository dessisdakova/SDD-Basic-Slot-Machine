# Basic Slot Machine

This project is a sophisticated slot machine game built to demonstrate **Specs-Driven Development (SDD)** and **AI-assisted engineering**.

### Origins & Evolution
The core logic was initially inspired by a [YouTube tutorial](https://www.youtube.com/watch?v=th4OBktqK1I) by Tim Ruscica ([Tech With Tim](https://www.youtube.com/c/TechWithTim)). Since the original implementation, this project has been significantly evolved and improved using **VS Code** and the **Gemini Code Assist** plugin to transition from a CLI script to a modular web application.

### Tech Stack
*   **Language:** Python
*   **AI Assistant:** VS Code with Gemini Code Assist, Cursor
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


	
