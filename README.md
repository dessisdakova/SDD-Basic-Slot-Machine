# Slot Machine Game / Unit Testing

This project is a slot machine game created as a learning exercise, heavily inspired by a [YouTube tutorial](https://www.youtube.com/watch?v=th4OBktqK1I) by Tim Ruscica ([Tech With Tim](https://www.youtube.com/c/TechWithTim)). While the core logic and concept are based on his video, I've made modifications and enhancements to the code, including restructuring it into a package, adding extensive unit tests, and improving overall code quality.

### Tech Stack

*   **Language:** Python
*   **IDE:** Visual Studio Code (VSCode) with Gemini plugin
*   **Web Framework:** FastAPI & Uvicorn
*   **Testing Framework:** PyTest

### Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### How to Run

**Web API (FastAPI):**
```bash
uvicorn main:app --reload
```
Once running, access the interactive Swagger documentation at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**CLI Version:**
```bash
python -m slot_machine.game
```


	
