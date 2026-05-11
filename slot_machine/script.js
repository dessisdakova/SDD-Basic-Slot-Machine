let currentBalance = 0;
let winningLinesMap = {};
let reelsCount = 3; // Fallback value
let maxLines = 10;
let maxBet = 10;
let multipliersConfig = {};
let scatterSymbol = '';

async function initGame() {
    try {
        const response = await fetch('/game/configuration');
        const config = await response.json();
        
        // SET GLOBALS IMMEDIATELY to avoid race conditions
        winningLinesMap = config.winning_lines_config;
        reelsCount = config.reels;
        scatterSymbol = config.scatter_symbol;
        maxLines = config.max_lines;
        maxBet = config.max_bet;
        multipliersConfig = config.multipliers;
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
        
        // Generate initial symbols reel by reel to enforce "once per reel" rule
        let initialRows = [[], [], []];
        for (let c = 0; c < config.reels; c++) {
            let pool = [...config.symbols]; // Use unique symbol list
            for (let r = 0; r < config.rows; r++) {
                let idx = Math.floor(Math.random() * pool.length);
                let symbol = pool.splice(idx, 1)[0];
                initialRows[r][c] = symbol;
            }
        }

        initialRows.flat().forEach(symbol => {
            const cell = document.createElement('div');
            cell.className = 'slot-cell';
            cell.textContent = symbol;
            grid.appendChild(cell);
        });

        // Populate info modal content
        populateInfoModal(config);
    } catch (error) {
        console.error('Failed to load configuration', error);
    }
}

function populateInfoModal(config) {
    const payoutTable = document.getElementById('payout-table');
    const paylinesList = document.getElementById('paylines-list');
    const previewGrid = document.getElementById('payline-preview');
    
    // Setup Preview Grid dots
    previewGrid.innerHTML = '';
    for (let i = 0; i < config.rows * config.reels; i++) {
        const dot = document.createElement('div');
        dot.className = "w-4 h-4 rounded-sm bg-gray-200 transition-all duration-300";
        previewGrid.appendChild(dot);
    }
    
    // Payouts
    Object.entries(config.multipliers).forEach(([symbol, values]) => {
        const row = [symbol, `${values[3]}x`, `${values[4]}x`, `${values[5]}x` ];
        row.forEach(text => {
            const div = document.createElement('div');
            div.className = "p-2 border-b border-gray-100";
            div.textContent = text;
            payoutTable.appendChild(div);
        });
    });

    // Payline Names (Simplified mapping for display)
    const names = [
        "Top Horizontal", "Middle Horizontal", "Bottom Horizontal",
        "V-Shape", "Inverted V", "Hump", "Dip", "Zig-Zag Top", "Zig-Zag Bottom", "Staircase"
    ];

    for (let i = 1; i <= config.max_lines; i++) {
        const div = document.createElement('div');
        div.className = "payline-item flex justify-between border-b border-gray-50 py-2 px-3 cursor-pointer hover:bg-purple-50 rounded transition-all";
        div.innerHTML = `<span class="font-bold text-purple-500">Line ${i}</span> <span>${names[i-1] || 'Complex Pattern'}</span>`;
        div.onclick = () => updatePaylinePreview(i.toString()); // API uses string keys
        paylinesList.appendChild(div);
    }

    // Add Scatter Symbols Section
    const scatterSection = document.createElement('section');
    scatterSection.className = "mt-6 pt-4 border-t border-gray-100";
    scatterSection.innerHTML = `
        <h3 class="text-lg font-semibold text-purple-700 mb-2">💎 Scatter Symbols</h3>
        <p class="text-sm text-gray-600 mb-2">Scatter wins trigger from 3+ symbols anywhere and multiply the <strong>Total Bet</strong>.</p>
        <div class="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div class="bg-purple-50 p-2 rounded">3x: ${config.scatter_multipliers['3']}x</div>
            <div class="bg-purple-50 p-2 rounded">4x: ${config.scatter_multipliers['4']}x</div>
            <div class="bg-purple-50 p-2 rounded">5x: ${config.scatter_multipliers['5']}x</div>
        </div>
    `;
    document.querySelector('#info-modal .space-y-6').appendChild(scatterSection);

    // Add Special Symbols Section
    const specialSection = document.createElement('section');
    specialSection.className = "mt-6 pt-4 border-t border-gray-100";
    specialSection.innerHTML = `
        <h3 class="text-lg font-semibold text-purple-700 mb-2">Special Symbols</h3>
        <p class="text-sm text-gray-600">🌟 <strong>Wild Symbol:</strong> Substitutes for any symbol to form the highest possible winning combination on a payline.</p>
    `;
    document.querySelector('#info-modal .space-y-6').appendChild(specialSection);

    // Default preview to Line 1 (using string key)
    updatePaylinePreview("1");
}

function updatePaylinePreview(lineNum) {
    const dots = document.getElementById('payline-preview').children;
    const coords = winningLinesMap[lineNum];
    
    // Reset all dots
    Array.from(dots).forEach(dot => {
        dot.classList.remove('bg-purple-500', 'scale-110', 'shadow-sm');
        dot.classList.add('bg-gray-200');
    });

    // Highlight winning path on preview grid
    coords.forEach(([row, col]) => {
        const idx = row * reelsCount + col;
        if (dots[idx]) {
            dots[idx].classList.remove('bg-gray-200');
            dots[idx].classList.add('bg-purple-500', 'scale-110', 'shadow-sm');
        }
    });

    // Update active state in the text list
    document.querySelectorAll('.payline-item').forEach((item, idx) => {
        if (idx === lineNum - 1) {
            item.classList.add('bg-purple-100', 'border-purple-200', 'shadow-sm');
        } else {
            item.classList.remove('bg-purple-100', 'border-purple-200', 'shadow-sm');
        }
    });
}

function toggleInfoModal(show) {
    const modal = document.getElementById('info-modal');
    modal.classList.toggle('hidden', !show);
    modal.classList.toggle('flex', show);
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
    const hasPaylineWins = winningLineNumbers.length > 0; // Check if there are any payline wins
    const hasScatterWins = data.scatter_winnings > 0;
    
    if (hasPaylineWins || hasScatterWins) {
        // If there are any wins (payline or scatter), dim everything first for visual contrast
        Array.from(grid.children).forEach(cell => cell.classList.add('dimmed-cell'));

        // Highlight winning symbols and indicators for paylines
        if (hasPaylineWins) {
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

        // Highlight scatter symbols using the same logic as winning lines
        if (hasScatterWins) {
            Array.from(grid.children).forEach((cell, index) => {
                if (cell.textContent === scatterSymbol) {
                    cell.classList.remove('dimmed-cell');
                    cell.classList.add('scatter-win'); // Apply the distinct scatter animation
                }
            });
        }
    }

    // Show Result Message
    if (data.winnings > 0) {
        let winMsg = `🎉 You won $${data.winnings}!`;
        if (data.scatter_winnings > 0) {
            winMsg += `<br><span class="text-sm text-purple-600 font-bold">💎 Scatter Win: ${data.scatter_count} Diamonds won $${data.scatter_winnings}!</span>`;
        }
        messageArea.innerHTML = winMsg;
        messageArea.className = 'mt-6 text-center font-bold text-green-600 animate-bounce';
    } else {
        messageArea.innerHTML = 'Better luck next time!';
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
        document.getElementById('deposit-overlay').classList.remove('flex');
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
    document.getElementById('cashout-overlay').classList.add('flex');
    // Optionally hide the main game content while modal is open
    document.querySelector('.bg-white.p-8').classList.add('hidden');
}

function handlePlayAgain() {
    document.getElementById('cashout-overlay').classList.add('hidden');
    document.getElementById('cashout-overlay').classList.remove('flex');
    document.getElementById('deposit-overlay').classList.remove('hidden');
    document.getElementById('deposit-overlay').classList.add('flex');
    document.querySelector('.bg-white.p-8').classList.remove('hidden'); // Show game content again
    document.getElementById('message-area').textContent = ""; // Clear previous messages
}

async function handleSpin() {
    const lines = parseInt(document.getElementById('lines-input').value);
    const bet = parseInt(document.getElementById('bet-input').value);
    const messageArea = document.getElementById('message-area');

    // Reset UI state for new spin
    messageArea.innerHTML = "Spinning...";
    messageArea.className = "mt-6 text-center font-medium text-gray-500";
    Array.from(document.getElementById('slot-grid').children).forEach(cell => { // Clear all win-related classes
        cell.classList.remove('dimmed-cell', 'winning-cell', 'scatter-win');
    });

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
            let errorMessage = "";
            if (Array.isArray(data.detail)) {
                errorMessage = "❌ Validation Errors:<br>";
                data.detail.forEach(error => {
                    errorMessage += `- ${error.msg} (Field: ${error.loc.join('.')})<br>`;
                });
            } else {
                errorMessage = `❌ ${data.detail}`;
            }
            messageArea.innerHTML = errorMessage;
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
document.getElementById('open-info').addEventListener('click', () => toggleInfoModal(true));
document.getElementById('close-info').addEventListener('click', () => toggleInfoModal(false));

// Close modal on overlay click
document.getElementById('info-modal').addEventListener('click', (e) => {
    if (e.target.id === 'info-modal') toggleInfoModal(false);
});


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