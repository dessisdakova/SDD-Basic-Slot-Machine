let currentBalance = 0;
let winningLinesMap = {};
let reelsCount = 3; // Fallback value
let maxLines = 10;
let maxBet = 10;
let multipliersConfig = {};
let bonusSymbol = '';
let scatterSymbol = '';
let bonusMiniGamePrizes = {};
let freeSpinsRemaining = 0;
let freeSpinSessionWinnings = 0;
/** True briefly after the last free-spin result until paid-spin chrome is applied */
let freeSpinSessionEndPending = false;
let freeSpinSessionEndTimer = null;
const FREE_SPIN_SESSION_END_DELAY_MS = 1200;
let highlightSequenceTimeouts = [];
let lastSpinWildPositions = [];
const PAYLINE_HIGHLIGHT_BEFORE_FREE_SPIN_MS = 1200;

/** Keeps the game card layout stable — apply whenever #win-display is cleared or reset */
const WIN_DISPLAY_SHELL =
    'text-center mb-4 min-h-[10rem] w-full flex flex-col justify-center items-center gap-2 px-2 shrink-0';

function htmlFreeSpinsAwarded(count) {
    const phrase = count === 1 ? 'Free spin awarded!' : 'Free spins awarded!';
    return `<span class="text-xl font-bold text-orange-600 animate-bounce">${count} ${phrase}</span>`;
}

function refreshBalanceDisplay() {
    const el = document.getElementById('balance-display');
    if (!el) return;
    const frozen = freeSpinsRemaining > 0 || freeSpinSessionEndPending;
    const shown = frozen
        ? Math.max(0, currentBalance - freeSpinSessionWinnings)
        : currentBalance;
    el.textContent = `$${shown}`;
}

function clearFreeSpinSessionEndSchedule() {
    if (freeSpinSessionEndTimer !== null) {
        clearTimeout(freeSpinSessionEndTimer);
        freeSpinSessionEndTimer = null;
    }
    freeSpinSessionEndPending = false;
}

/** After the final free spin, keep free-spin chrome until the timer (orange bg, panel, etc.). */
function scheduleFreeSpinSessionEndChrome() {
    if (freeSpinSessionEndTimer !== null) {
        clearTimeout(freeSpinSessionEndTimer);
        freeSpinSessionEndTimer = null;
    }
    freeSpinSessionEndPending = true;
    freeSpinSessionEndTimer = setTimeout(() => {
        freeSpinSessionEndTimer = null;
        freeSpinSessionEndPending = false;
        freeSpinSessionWinnings = 0;
        syncFreeSpinModeUI();
    }, FREE_SPIN_SESSION_END_DELAY_MS);
    syncFreeSpinModeUI();
}

function syncFreeSpinModeUI() {
    const inMode = freeSpinsRemaining > 0 || freeSpinSessionEndPending;
    const body = document.getElementById('game-body');
    if (body) {
        body.classList.toggle('bg-orange-500', inMode);
        body.classList.toggle('bg-gray-100', !inMode);
    }

    const banner = document.getElementById('free-spins-banner');
    if (banner) {
        if (inMode) {
            banner.textContent = `FREE SPINS REMAINING: ${freeSpinsRemaining}`;
        } else {
            banner.textContent = '';
        }
        banner.classList.toggle('bg-orange-500', inMode);
        banner.classList.toggle('text-white', inMode);
        banner.classList.toggle('animate-pulse', inMode);
        banner.classList.toggle('font-black', inMode);
        banner.classList.toggle('uppercase', inMode);
        banner.classList.toggle('tracking-widest', inMode);
    }

    const balanceRow = document.getElementById('balance-row');
    const balanceLabel = document.getElementById('balance-label');
    if (balanceRow) {
        balanceRow.classList.toggle('opacity-40', inMode);
        balanceRow.classList.toggle('grayscale', inMode);
    }
    if (balanceLabel) {
        balanceLabel.classList.toggle('text-gray-500', inMode);
    }

    const fsTotal = document.getElementById('free-spin-winnings-total');
    const panel = document.getElementById('free-spin-winnings-panel');
    if (fsTotal) {
        fsTotal.textContent = `$${freeSpinSessionWinnings}`;
    }
    if (panel) {
        panel.classList.toggle('hidden', !inMode);
        panel.classList.toggle('ring-2', inMode);
        panel.classList.toggle('ring-orange-400', inMode);
    }

    const cashoutBtn = document.getElementById('cashout-button');
    if (cashoutBtn) {
        cashoutBtn.disabled = inMode;
        cashoutBtn.classList.toggle('opacity-50', inMode);
        cashoutBtn.classList.toggle('cursor-not-allowed', inMode);
    }

    refreshBalanceDisplay();
}

function clearHighlightSequenceTimeouts() {
    highlightSequenceTimeouts.forEach((id) => clearTimeout(id));
    highlightSequenceTimeouts = [];
}

function scheduleHighlight(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    highlightSequenceTimeouts.push(id);
}

function applyPhaseOneWinHighlights(grid, data) {
    const winningLineNumbers = Object.keys(data.winning_lines);
    const hasPaylineWins = winningLineNumbers.length > 0;
    const hasScatterWins = data.scatter_winnings > 0;

    if (!hasPaylineWins && !hasScatterWins && !data.bonus_triggered) {
        return;
    }

    Array.from(grid.children).forEach((cell) => cell.classList.add('dimmed-cell'));

    if (hasPaylineWins) {
        Object.entries(data.winning_lines).forEach(([lineNum, count]) => {
            const indicator = document.getElementById(`line-ind-${lineNum}`);
            if (indicator) indicator.classList.add('active');

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

    if (hasScatterWins) {
        data.scatter_positions.forEach(([row, col]) => {
            const gridIndex = row * reelsCount + col;
            const cell = grid.children[gridIndex];
            if (cell) {
                cell.classList.remove('dimmed-cell');
                cell.classList.add('scatter-win');
            }
        });
    }

    if (data.bonus_triggered) {
        data.bonus_positions.forEach(([row, col]) => {
            const gridIndex = row * reelsCount + col;
            const cell = grid.children[gridIndex];
            if (cell) {
                cell.classList.remove('dimmed-cell');
                cell.classList.add('bonus-win', 'animate-pulse');
            }
        });
    }
}

function clearGridHighlightClasses(grid, indicators) {
    indicators.forEach((ind) => ind.classList.remove('active'));
    Array.from(grid.children).forEach((cell) => {
        cell.classList.remove(
            'dimmed-cell',
            'winning-cell',
            'scatter-win',
            'bonus-win',
            'free-spin-trigger',
            'animate-pulse'
        );
    });
}

function applyFreeSpinWildHighlights(grid, wildPositions) {
    Array.from(grid.children).forEach((cell) => cell.classList.add('dimmed-cell'));
    wildPositions.forEach(([row, col]) => {
        const gridIndex = row * reelsCount + col;
        const cell = grid.children[gridIndex];
        if (cell) {
            cell.classList.remove('dimmed-cell');
            cell.classList.add('free-spin-trigger');
        }
    });
}

async function initGame() {
    try {
        const response = await fetch('/game/configuration');
        const config = await response.json();
        
        // SET GLOBALS IMMEDIATELY to avoid race conditions
        winningLinesMap = config.winning_lines_config;
        reelsCount = config.reels;
        scatterSymbol = config.scatter_symbol;
        bonusSymbol = config.bonus_symbol;
        maxLines = config.max_lines;
        maxBet = config.max_bet;
        multipliersConfig = config.multipliers;
        bonusMiniGamePrizes = config.bonus_mini_game_prizes || {};
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
        
        // Generate initial symbols reel by reel to enforce "once per reel" rule
        let initialGrid = Array.from({ length: config.rows }, () => []);
        for (let c = 0; c < config.reels; c++) {
            let pool = [...config.symbols];
            for (let r = 0; r < config.rows; r++) {
                let availablePool = [...pool];
                // Enforce reels 2, 3, 4 rule for Bonus symbols
                if (c === 0 || c === config.reels - 1) {
                    availablePool = availablePool.filter(s => s !== bonusSymbol);
                }
                let idx = Math.floor(Math.random() * availablePool.length); // Choose from filtered pool
                let symbol = availablePool[idx]; 
                initialGrid[r][c] = symbol;
                
                // Remove special symbols entirely from the pool for this reel
                if (symbol === scatterSymbol || symbol === bonusSymbol) { // If chosen symbol is special
                    pool = pool.filter(s => s !== symbol);
                } else {
                    pool.splice(pool.indexOf(symbol), 1); // For regular symbols, remove only one instance
                }
            }
        }

        initialGrid.flat().forEach(symbol => {
            const cell = document.createElement('div');
            cell.className = 'slot-cell';
            cell.textContent = symbol;
            cell.setAttribute('data-symbol', symbol); // Set data-symbol for reliable comparison
            grid.appendChild(cell);
        });

        // Populate info modal content
        populateInfoModal(config);
        validateInGameInput();
        syncFreeSpinModeUI();
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
    
    // Add Scatter row to the payout table manually
    const scatterRow = [
        config.scatter_symbol, 
        `${config.scatter_multipliers['3']}x*`, 
        `${config.scatter_multipliers['4']}x*`, 
        `${config.scatter_multipliers['5']}x*`
    ];
    scatterRow.forEach(text => {
        const div = document.createElement('div');
        div.className = "p-2 border-b border-purple-50 font-bold text-purple-700 bg-purple-50/50";
        div.textContent = text;
        payoutTable.appendChild(div);
    });

    // Populate General Rules Section
    const generalRulesContent = document.getElementById('general-rules-content');
    generalRulesContent.innerHTML = `
        <div class="space-y-2">
            <p>🌟 <strong>Wild Symbol:</strong> Substitutes for any standard symbol. A line of pure Wilds pays the highest multiplier.</p>
            <p>💎 <strong>Scatter Symbol:</strong> 3+ symbols anywhere on the grid award a multiplier of your <strong>Total Bet</strong> (indicated by * in the table).</p>
            <p>🎁 <strong>Bonus Symbol:</strong> 3 symbols on reels 2, 3, and 4 trigger an interactive "Pick-a-Prize" mini-game with mystery multipliers - x10, x25, and x200!</p>
            <p>🔄 <strong>Free Spins:</strong> Land 3+ 🌟 Wild symbols anywhere on the grid to trigger free spins!</p>
            <p>ℹ️ Wins are calculated from left to right on active paylines.</p>
        </div>
    `;

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
    clearHighlightSequenceTimeouts();
    const grid = document.getElementById('slot-grid');
    const messageArea = document.getElementById('message-area');
    const winDisplay = document.getElementById('win-display');
    const indicators = document.querySelectorAll('.line-indicator');

    // Keep full cumulative balance from server for the next spin request body
    currentBalance = data.new_balance;

    // Consume one free spin only after the server confirms (avoids switching UI on button press)
    if (data.is_free_spin && freeSpinsRemaining > 0) {
        freeSpinsRemaining--;
    }
    if (data.is_free_spin) {
        freeSpinSessionWinnings += data.winnings;
    }
    if (data.free_spins_won > 0) {
        freeSpinsRemaining += data.free_spins_won;
    }

    const deferPaidChrome = data.is_free_spin && freeSpinsRemaining === 0;

    if (freeSpinsRemaining > 0) {
        clearFreeSpinSessionEndSchedule();
    }

    if (!deferPaidChrome && freeSpinsRemaining === 0) {
        freeSpinSessionWinnings = 0;
        clearFreeSpinSessionEndSchedule();
    }

    indicators.forEach((ind) => ind.classList.remove('active'));

    grid.innerHTML = '';
    data.spin_result.forEach((row) => {
        row.forEach((symbol) => {
            const cell = document.createElement('div');
            cell.className = 'slot-cell';
            cell.textContent = symbol;
            grid.appendChild(cell);
        });
    });

    const winningLineNumbers = Object.keys(data.winning_lines);
    const hasPaylineWins = winningLineNumbers.length > 0;
    const hasScatterWins = data.scatter_winnings > 0;
    const wonFreeSpins = data.free_spins_won > 0;
    const wildPositions = data.wild_positions || [];
    lastSpinWildPositions = wonFreeSpins ? wildPositions : [];

    const phaseOneContent = hasPaylineWins || hasScatterWins || data.bonus_triggered;

    if (phaseOneContent && wonFreeSpins) {
        applyPhaseOneWinHighlights(grid, data);
        // Bonus mini-game must run before free spins (spec); orange wild highlight runs after bonus closes.
        if (!data.bonus_triggered) {
            scheduleHighlight(() => {
                clearGridHighlightClasses(grid, indicators);
                applyFreeSpinWildHighlights(grid, wildPositions);
            }, PAYLINE_HIGHLIGHT_BEFORE_FREE_SPIN_MS);
        }
    } else if (phaseOneContent) {
        applyPhaseOneWinHighlights(grid, data);
    } else if (wonFreeSpins) {
        applyFreeSpinWildHighlights(grid, wildPositions);
    }

    if (data.winnings > 0 || data.free_spins_won > 0) {
        const lines = [];
        if (data.bonus_triggered) {
            lines.push(
                `<span class="text-lg font-bold text-purple-700">🎁 BONUS TRIGGERED!</span>`
            );
        }
        if (data.winnings > 0) {
            lines.push(
                `<span class="text-xl font-bold text-green-600 animate-bounce">🎉 You won $${data.winnings}!</span>`
            );
        }
        if (data.scatter_winnings > 0) {
            lines.push(
                `<span class="text-sm text-purple-600 font-bold">💎 Scatter Win: ${data.scatter_count} Diamonds won $${data.scatter_winnings}!</span>`
            );
        }
        if (data.free_spins_won > 0) {
            lines.push(htmlFreeSpinsAwarded(data.free_spins_won));
        }
        const winMsg = lines.join('<br>');
        winDisplay.innerHTML = winMsg;
        winDisplay.className = WIN_DISPLAY_SHELL;
        messageArea.innerHTML = '';
    } else {
        winDisplay.innerHTML = `<span class="text-lg font-medium text-gray-500">Better luck next time!</span>`;
        winDisplay.className = WIN_DISPLAY_SHELL;
        messageArea.innerHTML = '';
    }

    if (data.bonus_triggered) {
        setTimeout(() => {
            startBonusMiniGame(data.total_bet);
        }, 1500);
    }

    if (deferPaidChrome) {
        scheduleFreeSpinSessionEndChrome();
    } else {
        syncFreeSpinModeUI();
    }
}

function startBonusMiniGame(totalBet) {
    // Create overlay dynamically since we can't edit index.html
    const overlay = document.createElement('div');
    overlay.id = 'bonus-game-overlay';
    overlay.className = 'fixed inset-0 bg-purple-900/90 flex flex-col items-center justify-center z-50 p-4';
    
    overlay.innerHTML = `
        <h2 class="text-4xl font-black text-white mb-2 animate-bounce">🎁 BONUS ROUND 🎁</h2>
        <p class="text-purple-200 mb-8 text-lg text-center">Pick a Mystery Chest to reveal your multiplier!</p>
        <div class="flex gap-6">
            ${[1, 2, 3].map(i => `
                <div class="bonus-chest w-32 h-32 bg-yellow-500 rounded-xl border-4 border-yellow-300 flex items-center justify-center text-6xl cursor-pointer hover:scale-110 transition-transform shadow-2xl" onclick="resolveBonus(this, ${totalBet})">
                    🎁
                </div>
            `).join('')}
        </div>
    `;
    document.body.appendChild(overlay);
}

function resolveBonus(element, totalBet) {
    // Prevent multiple clicks
    const chests = document.querySelectorAll('.bonus-chest');
    chests.forEach(c => c.onclick = null);

    // Logic to pick a prize from the pool
    let prizes = Object.values(bonusMiniGamePrizes || {});
    
    // Safety fallback if configuration is missing or empty
    if (prizes.length === 0) {
        prizes = [10, 25, 200];
    }

    const multiplier = prizes[Math.floor(Math.random() * prizes.length)];
    const winAmount = multiplier * totalBet;

    element.innerHTML = `<span class="text-2xl font-bold text-white">${multiplier}x</span>`;
    element.classList.add('bg-green-500', 'border-green-300');

    const winAnnouncement = document.createElement('div');
    winAnnouncement.className = 'mt-12 text-3xl font-bold text-yellow-400 animate-pulse text-center';
    winAnnouncement.innerHTML = `AMAZING!<br>You found a $${winAmount} Prize!`;
    document.getElementById('bonus-game-overlay').appendChild(winAnnouncement);

    currentBalance += winAmount;
    if (freeSpinsRemaining > 0) {
        freeSpinSessionWinnings += winAmount;
    }

    syncFreeSpinModeUI();

    // Close after delay
    setTimeout(() => {
        const overlay = document.getElementById('bonus-game-overlay');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.remove(), 500);
        document.getElementById('win-display').innerHTML += `<br><span class="text-purple-700 font-bold">🎁 Bonus Game won $${winAmount}!</span>`;
        const grid = document.getElementById('slot-grid');
        const indicators = document.querySelectorAll('.line-indicator');
        if (freeSpinsRemaining > 0 && lastSpinWildPositions.length > 0) {
            clearGridHighlightClasses(grid, indicators);
            applyFreeSpinWildHighlights(grid, lastSpinWildPositions);
        }
        syncFreeSpinModeUI();
    }, 2500);
}

function handleDeposit() {
    const depositInput = document.getElementById('deposit-input');
    const amount = parseInt(depositInput.value);
    
    if (amount > 0) {
        currentBalance = amount;
        document.getElementById('deposit-overlay').classList.add('hidden');
        document.getElementById('deposit-overlay').classList.remove('flex');
        document.getElementById('message-area').textContent = "Ready to play!";
        const wd = document.getElementById('win-display');
        wd.innerHTML = "";
        wd.className = WIN_DISPLAY_SHELL;
        freeSpinsRemaining = 0;
        freeSpinSessionWinnings = 0;
        clearFreeSpinSessionEndSchedule();
        syncFreeSpinModeUI();
    }
}

function handleCashout() {
    const messageArea = document.getElementById('message-area');
    const cashoutAmount = currentBalance;
    currentBalance = 0;
    
    // Show cashout modal
    document.getElementById('cashout-amount-display').textContent = `$${cashoutAmount}`;
    document.getElementById('cashout-overlay').classList.remove('hidden');
    document.getElementById('cashout-overlay').classList.add('flex');
    // Optionally hide the main game content while modal is open
    document.querySelector('.bg-white.p-8').classList.add('hidden');
    refreshBalanceDisplay();
}

function handlePlayAgain() {
    document.getElementById('cashout-overlay').classList.add('hidden');
    document.getElementById('cashout-overlay').classList.remove('flex');
    document.getElementById('deposit-overlay').classList.remove('hidden');
    document.getElementById('deposit-overlay').classList.add('flex');
    document.querySelector('.bg-white.p-8').classList.remove('hidden'); // Show game content again
    document.getElementById('message-area').textContent = ""; // Clear previous messages
    const wdPlay = document.getElementById('win-display');
    wdPlay.innerHTML = "";
    wdPlay.className = WIN_DISPLAY_SHELL;
    freeSpinsRemaining = 0;
    freeSpinSessionWinnings = 0;
    clearFreeSpinSessionEndSchedule();
    syncFreeSpinModeUI();
}

async function handleSpin(isFree = false) {
    clearHighlightSequenceTimeouts();
    if (!isFree) {
        clearFreeSpinSessionEndSchedule();
        freeSpinSessionWinnings = 0;
        const ft = document.getElementById('free-spin-winnings-total');
        if (ft) ft.textContent = '$0';
        syncFreeSpinModeUI();
    }
    const lines = parseInt(document.getElementById('lines-input').value);
    const bet = parseInt(document.getElementById('bet-input').value);
    const messageArea = document.getElementById('message-area');
    const spinBtn = document.getElementById('spin-button');
    const winDisplay = document.getElementById('win-display');

    // Free-spin queue is decremented in updateUI after a successful response

    // Immediate UI reset and button disable to prevent double-clicks
    spinBtn.disabled = true;
    spinBtn.style.opacity = "0.5";
    messageArea.innerHTML = "Spinning...";
    messageArea.className = "mt-6 text-center font-medium text-gray-500";
    winDisplay.innerHTML = "";
    winDisplay.className = WIN_DISPLAY_SHELL;

    const indicators = document.querySelectorAll('.line-indicator');
    indicators.forEach(ind => ind.classList.remove('active'));

    try {
        const response = await fetch('/game/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: currentBalance, lines, bet, is_free_spin: isFree })
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
    } finally {
        syncFreeSpinModeUI();
        setTimeout(() => {
            validateInGameInput();
            syncFreeSpinModeUI();
        }, 1200);
    }
}

// document.getElementById('spin-button').addEventListener('click', handleSpin);
document.getElementById('spin-button').addEventListener('click', () =>
    handleSpin(freeSpinsRemaining > 0)
);
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

function validateInGameInput() {
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
    
    // Update Total Bet Display
    const totalBetDisplay = document.getElementById('total-bet-display');
    if (linesValid && betValid) {
        totalBetDisplay.textContent = linesVal * betVal;
    } else {
        totalBetDisplay.textContent = "--";
    }

    // Spin Button state
    const allValid = linesValid && betValid;
    spinBtn.disabled = !allValid;
    spinBtn.style.opacity = allValid ? "1" : "0.5";
}

document.getElementById('lines-input').addEventListener('input', validateInGameInput);
document.getElementById('bet-input').addEventListener('input', validateInGameInput);

initGame();