let currentBalance = 0;
let winningLinesMap = {};
let reelsCount = 3; // Fallback value

async function initGame() {
    try {
        const response = await fetch('/game/configuration');
        const config = await response.json();
        document.getElementById('max-lines-label').textContent = config.max_lines;
        document.getElementById('lines-input').max = config.max_lines;
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

    // Update Balance
    currentBalance = data.new_balance;
    balanceDisplay.textContent = `$${currentBalance}`;

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

    // Highlight winning lines
    data.winning_lines.forEach(lineNum => {
        const coordinates = winningLinesMap[lineNum];
        coordinates.forEach(([row, col]) => {
            const index = row * reelsCount + col;
            grid.children[index].classList.add('winning-cell');
        });
    });

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
initGame();