let currentBalance = 0;
let winningLinesMap = {};
let reelsCount = 3; // Fallback value
let maxLines = 10;
let maxBet = 10;

async function initGame() {
    try {
        const response = await fetch('/game/configuration');
        const config = await response.json();
        maxLines = config.max_lines;
        maxBet = config.max_bet;
        document.getElementById('max-lines-label').textContent = maxLines;
        document.getElementById('max-bet-label').textContent = maxBet;
        
        // Generate line indicators
        const left = document.getElementById('left-indicators');
        const right = document.getElementById('right-indicators');
        left.innerHTML = '';
        right.innerHTML = '';
        
        for (let i = 1; i <= config.max_lines; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'line-indicator';
            indicator.id = `line-ind-${i}`;
            indicator.textContent = i;
            if (i <= 5) left.appendChild(indicator);
            else right.appendChild(indicator);
        }

        // Populate initial random symbols
        const grid = document.getElementById('slot-grid');
        grid.innerHTML = '';
        const totalCells = config.rows * config.reels;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'slot-cell';
            const randomSymbol = config.symbols[Math.floor(Math.random() * config.symbols.length)];
            cell.textContent = randomSymbol;
            grid.appendChild(cell);
        }

        // Store winning line coordinates for highlighting
        winningLinesMap = config.winning_lines_config;
        // Initially hide the game UI until a deposit is made
        reelsCount = config.reels;
    } catch (error) {
        console.error('Failed to load configuration', error);
    }
}

function updateUI(data) {
    const grid = document.getElementById('slot-grid');
    const balanceDisplay = document.getElementById('balance-display');
    const messageArea = document.getElementById('message-area');
    const indicators = document.querySelectorAll('.line-indicator');

    // Update Balance
    currentBalance = data.new_balance;
    balanceDisplay.textContent = `$${currentBalance}`;

    // Reset indicators
    indicators.forEach(ind => ind.classList.remove('active'));

    // Update Grid
    grid.innerHTML = '';
    data.spin_result.forEach((row, rowIndex) => {
        row.forEach((symbol, colIndex) => {
            const cell = document.createElement('div');
            cell.className = 'slot-cell';
            cell.textContent = symbol;
            
            // Highlight winning lines if necessary (basic implementation)
            grid.appendChild(cell);
        });
    });

    const winningLineNumbers = Object.keys(data.winning_lines);
    
    if (winningLineNumbers.length > 0) {
        // If there are wins, dim everything first
        Array.from(grid.children).forEach(cell => cell.classList.add('dimmed-cell'));

        // Highlight winning symbols and indicators
        Object.entries(data.winning_lines).forEach(([lineNum, count]) => {
            // Highlight indicator
            const indicator = document.getElementById(`line-ind-${lineNum}`);
            if (indicator) indicator.classList.add('active');

            // Highlight specific symbols in the line
            const coordinates = winningLinesMap[lineNum];
            coordinates.forEach(([row, col], index) => {
                const gridIndex = row * reelsCount + col;
                if (index < count) {
                    grid.children[gridIndex].classList.remove('dimmed-cell');
                    grid.children[gridIndex].classList.add('winning-cell');
                }
            });
        });
    }

    // Show Result Message
    if (data.winnings > 0) {
        messageArea.textContent = `🎉 You won $${data.winnings}!`;
        messageArea.className = 'mt-6 text-center font-bold text-green-600 animate-bounce';
    } else {
        messageArea.textContent = 'Better luck next time!';
        messageArea.className = 'mt-6 text-center font-medium text-gray-500';
    }
}

function handleDeposit() {
    const depositInput = document.getElementById('deposit-input');
    const amount = parseInt(depositInput.value);
    
    if (amount > 0) {
        currentBalance = amount;
        document.getElementById('balance-display').textContent = `$${currentBalance}`;
        document.getElementById('deposit-overlay').classList.add('hidden');
        document.getElementById('message-area').textContent = "Ready to play!";
    }
}

function handleCashout() {
    const messageArea = document.getElementById('message-area');
    const cashoutAmount = currentBalance;
    currentBalance = 0;
    document.getElementById('balance-display').textContent = `$${currentBalance}`;
    
    // Show cashout modal
    document.getElementById('cashout-amount-display').textContent = `$${cashoutAmount}`;
    document.getElementById('cashout-overlay').classList.remove('hidden');
    // Optionally hide the main game content while modal is open
    document.querySelector('.bg-white.p-8').classList.add('hidden');
}

function handlePlayAgain() {
    document.getElementById('cashout-overlay').classList.add('hidden');
    document.getElementById('deposit-overlay').classList.remove('hidden');
    document.querySelector('.bg-white.p-8').classList.remove('hidden'); // Show game content again
    document.getElementById('message-area').textContent = ""; // Clear previous messages
}

async function handleSpin() {
    const lines = parseInt(document.getElementById('lines-input').value);
    const bet = parseInt(document.getElementById('bet-input').value);
    const messageArea = document.getElementById('message-area');

    try {
        const response = await fetch('/game/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: currentBalance, lines, bet })
        });

        const data = await response.json();

        if (response.ok) {
            updateUI(data);
        } else {
            messageArea.textContent = `❌ ${data.detail}`;
            messageArea.className = 'mt-6 text-center font-medium text-red-600';
        }
    } catch (error) {
        messageArea.textContent = '❌ Connection Error';
    }
}

document.getElementById('spin-button').addEventListener('click', handleSpin);
document.getElementById('deposit-button').addEventListener('click', handleDeposit);
document.getElementById('cashout-button').addEventListener('click', handleCashout); // Keep this for the button in the main UI
document.getElementById('play-again-button').addEventListener('click', handlePlayAgain);

// Validation Listeners
document.getElementById('deposit-input').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const btn = document.getElementById('deposit-button');
    const err = document.getElementById('deposit-error');
    const isValid = val >= 50 && val <= 5000;
    
    btn.disabled = !isValid;
    btn.style.opacity = isValid ? "1" : "0.5";
    err.classList.toggle('hidden', isValid);
});

const validateInGameInput = () => {
    const linesInput = document.getElementById('lines-input');
    const betInput = document.getElementById('bet-input');
    const spinBtn = document.getElementById('spin-button');
    
    const linesVal = parseInt(linesInput.value);
    const betVal = parseInt(betInput.value);
    
    const linesValid = linesVal >= 1 && linesVal <= maxLines;
    const betValid = betVal >= 1 && betVal <= maxBet;
    
    // Lines UI
    linesInput.classList.toggle('border-red-500', !linesValid);
    document.getElementById('lines-error').classList.toggle('hidden', linesValid);
    
    // Bet UI
    betInput.classList.toggle('border-red-500', !betValid);
    document.getElementById('bet-error').classList.toggle('hidden', betValid);
    
    // Spin Button state
    const allValid = linesValid && betValid;
    spinBtn.disabled = !allValid;
    spinBtn.style.opacity = allValid ? "1" : "0.5";
};

document.getElementById('lines-input').addEventListener('input', validateInGameInput);
document.getElementById('bet-input').addEventListener('input', validateInGameInput);

initGame();