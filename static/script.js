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

// ---------------------------------------------------------------------------
// Phase 9: Hold and Nudge state
// ---------------------------------------------------------------------------

/** Persistent UUID for server-authoritative hold support. */
const CLIENT_SESSION_ID = (() => {
    let id = localStorage.getItem('slot_session_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('slot_session_id', id);
    }
    return id;
})();

/** Feature flags loaded from /game/configuration. */
let holdFeatureEnabled = false;
// let nudgeFeatureEnabled = false;  // nudge feature hidden
let maxHoldColumns = 4;
// let maxNudgesPerPaidSpin = 3;     // nudge feature hidden

/** Currently toggled hold column indices (set of numbers). */
const heldColumns = new Set();

// let nudgeQueue = [];  // nudge feature hidden

/** Keeps the game card layout stable — apply whenever #win-display is cleared or reset */
const WIN_DISPLAY_SHELL =
    'text-center mb-4 min-h-[10rem] w-full flex flex-col justify-center items-center gap-2 px-2 shrink-0';

/** Reserved strip under controls so the main slot card height does not jump when messages appear/clear */
const MESSAGE_AREA_SHELL =
    'mt-6 flex min-h-[3.5rem] w-full shrink-0 items-center justify-center px-2 text-center font-medium break-words';

/**
 * @param {HTMLElement | null} messageArea
 * @param {string} content Empty string clears the area but keeps layout.
 * @param {'default'|'muted'|'error'} tone
 */
function setMessageArea(messageArea, content, tone = 'default') {
    if (!messageArea) return;
    if (content === undefined || content === null || content === '') {
        messageArea.className = MESSAGE_AREA_SHELL;
        messageArea.innerHTML = '';
        return;
    }
    const toneClass =
        tone === 'error' ? 'text-red-600' : tone === 'muted' ? 'text-gray-500' : 'text-gray-800';
    messageArea.className = `${MESSAGE_AREA_SHELL} ${toneClass}`;
    if (typeof content === 'string' && content.includes('<')) {
        messageArea.innerHTML = content;
    } else {
        messageArea.textContent = content;
    }
}

function htmlFreeSpinsAwarded(count) {
    const phrase = count === 1 ? 'Free spin awarded!' : 'Free spins awarded!';
    return `<span class="text-xl font-bold text-blue-600 animate-bounce">${count} ${phrase}</span>`;
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
        body.classList.toggle('bg-blue-500', inMode);
        body.classList.toggle('bg-gray-100', !inMode);
    }

    const banner = document.getElementById('free-spins-banner');
    if (banner) {
        if (inMode) {
            banner.textContent = `FREE SPINS REMAINING: ${freeSpinsRemaining}`;
        } else {
            banner.textContent = '';
        }
        banner.classList.toggle('bg-blue-500', inMode);
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
        panel.classList.toggle('ring-blue-400', inMode);
    }

    const cashoutBtn = document.getElementById('cashout-button');
    if (cashoutBtn) {
        cashoutBtn.disabled = inMode;
        cashoutBtn.classList.toggle('opacity-50', inMode);
        cashoutBtn.classList.toggle('cursor-not-allowed', inMode);
    }

    refreshBalanceDisplay();
    // Phase 9: hold/nudge visibility mirrors free-spin mode
    syncHoldNudgeUI();
}

// ---------------------------------------------------------------------------
// Phase 9: Hold and Nudge UI helpers
// ---------------------------------------------------------------------------

/**
 * Build the per-column Hold toggle buttons inside #hold-buttons.
 * Called once after config is loaded; buttons persist for the session.
 */
function setupHoldButtons(reels) {
    const container = document.getElementById('hold-buttons');
    if (!container) return;
    container.innerHTML = '';
    for (let c = 0; c < reels; c++) {
        const btn = document.createElement('button');
        btn.id = `hold-btn-${c}`;
        btn.className = 'hold-btn';
        btn.textContent = 'Hold';
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => toggleHoldColumn(c));
        container.appendChild(btn);
    }
}

// setupNudgeButtons — nudge feature hidden
// function setupNudgeButtons(reels) { ... }

/** Toggle a column's hold state. */
function toggleHoldColumn(colIdx) {
    if (heldColumns.has(colIdx)) {
        heldColumns.delete(colIdx);
    } else {
        if (heldColumns.size >= maxHoldColumns) return; // silently cap
        heldColumns.add(colIdx);
    }
    syncHoldNudgeUI();
}

// queueNudge / clearNudgeQueue — nudge feature hidden
// function queueNudge(colIdx) { ... }
// function clearNudgeQueue() { ... }

/** Clear the hold state (called on free spins and after cashout/new game). */
function clearHoldState() {
    heldColumns.clear();
    syncHoldNudgeUI();
}

/**
 * Synchronise the Hold and Nudge UI elements with current state.
 * Should be called whenever heldColumns, nudgeQueue, or feature toggles change.
 */
function syncHoldNudgeUI() {
    const inFreeSpins = freeSpinsRemaining > 0 || freeSpinSessionEndPending;

    // Show/hide the entire hold control strip
    const holdControls = document.getElementById('hold-controls');
    if (holdControls) {
        const showHold = holdFeatureEnabled && !inFreeSpins;
        holdControls.classList.toggle('hidden', !showHold);
        holdControls.classList.toggle('flex', showHold);
    }

    // Nudge control strip hidden — nudge feature disabled
    // const nudgeControls = document.getElementById('nudge-controls');
    // if (nudgeControls) { ... }

    // Update each hold button
    for (let c = 0; c < reelsCount; c++) {
        const btn = document.getElementById(`hold-btn-${c}`);
        if (!btn) continue;
        const isHeld = heldColumns.has(c);
        btn.classList.toggle('held', isHeld);
        btn.setAttribute('aria-pressed', String(isHeld));
        btn.textContent = isHeld ? '🔒 Held' : 'Hold';
        // Disable: free spins, or at cap and this column isn't already held
        const atCap = heldColumns.size >= maxHoldColumns && !isHeld;
        btn.disabled = inFreeSpins || atCap;
    }

    // Nudge button/badge updates hidden — nudge feature disabled
    // const badge = document.getElementById('nudge-remaining-badge'); ...
    // nudge-btn-{c} updates ...
    // nudge-queue-display update ...

    // Apply held-column ring overlay on the slot grid cells
    const grid = document.getElementById('slot-grid');
    if (grid && grid.children.length > 0) {
        const rows = grid.children.length / reelsCount;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < reelsCount; c++) {
                const cell = grid.children[r * reelsCount + c];
                if (cell) cell.classList.toggle('held-cell', heldColumns.has(c));
            }
        }
    }
}

/**
 * Apply held-column ring styling after the grid is rebuilt (called from updateUI).
 */
function applyHoldCellHighlights(grid) {
    const rows = grid.children.length / reelsCount;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < reelsCount; c++) {
            const cell = grid.children[r * reelsCount + c];
            if (cell) cell.classList.toggle('held-cell', heldColumns.has(c));
        }
    }
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

        // Phase 9: feature flags
        holdFeatureEnabled = config.features?.hold ?? false;
        // nudgeFeatureEnabled = config.features?.nudge ?? false;  // nudge feature hidden
        maxHoldColumns = config.max_hold_columns ?? 4;
        // maxNudgesPerPaidSpin = config.max_nudges_per_paid_spin ?? 3;  // nudge feature hidden

        // Build hold button row (once per session load)
        setupHoldButtons(config.reels);
        // setupNudgeButtons(config.reels);  // nudge feature hidden

        // nudge-clear-btn wiring hidden
        // const clearBtn = document.getElementById('nudge-clear-btn');
        // if (clearBtn) clearBtn.addEventListener('click', clearNudgeQueue);

        const jackpotEl = document.getElementById('jackpot-pool-display');
        if (jackpotEl && typeof config.jackpot_pool === 'number') {
            jackpotEl.textContent = `$${config.jackpot_pool}`;
        }
        
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
        syncHoldNudgeUI();
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
    const jackpotSeed = config.jackpot_seed != null ? config.jackpot_seed : '—';
    const jackpotPct =
        config.jackpot_contribution_percent_of_total_bet != null
            ? config.jackpot_contribution_percent_of_total_bet
            : '—';
    const jackpotRules =
        config.jackpot_rules_summary ||
        'Paid spins grow the progressive pool; free spins do not contribute or win the jackpot.';
    generalRulesContent.innerHTML = `
        <div class="space-y-2">
            <p>🌟 <strong>Wild Symbol:</strong> Substitutes for any standard symbol. A line of pure Wilds pays the highest multiplier.</p>
            <p>💎 <strong>Scatter Symbol:</strong> 3+ symbols anywhere on the grid award a multiplier of your <strong>Total Bet</strong> (indicated by * in the table).</p>
            <p>🎁 <strong>Bonus Symbol:</strong> 3 symbols on reels 2, 3, and 4 trigger an interactive "Pick-a-Prize" mini-game with mystery multipliers - x10, x25, and x200!</p>
            <p>🔄 <strong>Free Spins:</strong> Land 3+ 🌟 Wild symbols anywhere on the grid to trigger free spins!</p>
            <p>ℹ️ Wins are calculated from left to right on active paylines.</p>
            <div class="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-amber-950">
                <p class="font-bold text-amber-900">Progressive jackpot</p>
                <p class="mt-1">${jackpotRules}</p>
                <p class="mt-2 text-xs text-amber-800/90">Pool resets to <strong>$${jackpotSeed}</strong> after each jackpot win. Each paid spin adds about <strong>${jackpotPct}%</strong> of your total bet to the pool (integer dollars). The hit is a separate random chance on each paid spin.</p>
            </div>
        </div>
    `;

    // Default preview to Line 1 (using string key)
    updatePaylinePreview("1");

    // Phase 9: Hold section in info modal (nudge line hidden)
    const holdNudgeSection = document.getElementById('hold-nudge-modal-section');
    const holdNudgeContent = document.getElementById('hold-nudge-modal-content');
    if (holdNudgeSection && holdNudgeContent && config.features?.hold) {
        holdNudgeSection.classList.remove('hidden');
        const rules = config.hold_and_nudge_rules_summary || '';
        holdNudgeContent.innerHTML = `
            <div class="space-y-2">
                <p class="text-sm text-gray-600">${rules}</p>
                <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>🔒 <strong>Hold:</strong> Up to <strong>${config.max_hold_columns}</strong> reels can be frozen per spin.</li>
                    <!-- nudge rule hidden: <li>🔄 Nudge: ...</li> -->
                    <li>⚠️ Hold is unavailable during free spins.</li>
                    <li>ℹ️ Hold history is kept in memory and <strong>resets on server restart</strong>.</li>
                </ul>
            </div>
        `;
    }
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

    const jackpotPoolEl = document.getElementById('jackpot-pool-display');
    if (jackpotPoolEl && typeof data.jackpot_pool === 'number') {
        jackpotPoolEl.textContent = `$${data.jackpot_pool}`;
    }

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

    // Phase 9: apply held-column ring after grid is rebuilt
    applyHoldCellHighlights(grid);
    // nudgeQueue = [];  // nudge feature hidden
    syncHoldNudgeUI();

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

    if (data.winnings > 0 || data.free_spins_won > 0 || data.jackpot_won) {
        const lines = [];
        if (data.jackpot_won && data.jackpot_win_amount > 0) {
            lines.push(
                `<span class="text-2xl font-black text-pink-500 drop-shadow-sm animate-bounce">🎰 JACKPOT! You won $${data.jackpot_win_amount}! 🎰</span>`
            );
        }
        if (data.bonus_triggered) {
            lines.push(
                `<span class="text-lg font-bold text-purple-700">🎁 BONUS TRIGGERED!</span>`
            );
        }
        if (data.winnings > 0) {
            lines.push(
                `<span class="text-xl font-bold text-green-600 animate-bounce">🎉 You won $${data.winnings} on the reels!</span>`
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
        setMessageArea(messageArea, '', 'default');
    } else {
        winDisplay.innerHTML = `<span class="text-lg font-medium text-gray-500">Better luck next time!</span>`;
        winDisplay.className = WIN_DISPLAY_SHELL;
        setMessageArea(messageArea, '', 'default');
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
        setMessageArea(document.getElementById('message-area'), 'Ready to play!', 'default');
        const wd = document.getElementById('win-display');
        wd.innerHTML = "";
        wd.className = WIN_DISPLAY_SHELL;
        freeSpinsRemaining = 0;
        freeSpinSessionWinnings = 0;
        clearFreeSpinSessionEndSchedule();
        // Phase 9: reset hold state on new game
        heldColumns.clear();
        // nudgeQueue = [];  // nudge feature hidden
        syncFreeSpinModeUI();
        syncHoldNudgeUI();
    }
}

function handleCashout() {
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
    setMessageArea(document.getElementById('message-area'), '', 'default');
    const wdPlay = document.getElementById('win-display');
    wdPlay.innerHTML = "";
    wdPlay.className = WIN_DISPLAY_SHELL;
    freeSpinsRemaining = 0;
    freeSpinSessionWinnings = 0;
    clearFreeSpinSessionEndSchedule();
    // Phase 9: reset hold state
    heldColumns.clear();
    // nudgeQueue = [];  // nudge feature hidden
    syncFreeSpinModeUI();
    syncHoldNudgeUI();
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
    setMessageArea(messageArea, 'Spinning...', 'muted');
    winDisplay.innerHTML = "";
    winDisplay.className = WIN_DISPLAY_SHELL;

    const indicators = document.querySelectorAll('.line-indicator');
    indicators.forEach(ind => ind.classList.remove('active'));

    // Phase 9: build hold/nudge payload (only on paid spins)
    const spinPayload = { balance: currentBalance, lines, bet, is_free_spin: isFree };
    spinPayload.client_session_id = CLIENT_SESSION_ID;
    if (!isFree) {
        if (holdFeatureEnabled && heldColumns.size > 0) {
            spinPayload.hold_columns = Array.from(heldColumns).sort((a, b) => a - b);
        }
        // nudge_sequence hidden — nudge feature disabled
        // if (nudgeFeatureEnabled && nudgeQueue.length > 0) {
        //     spinPayload.nudge_sequence = [...nudgeQueue];
        // }
    }

    try {
        const response = await fetch('/game/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(spinPayload)
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
            setMessageArea(messageArea, errorMessage, 'error');
        }
    } catch (error) {
        setMessageArea(messageArea, '❌ Connection Error', 'error');
    } finally {
        syncFreeSpinModeUI();
        syncHoldNudgeUI();
        setTimeout(() => {
            validateInGameInput();
            syncFreeSpinModeUI();
            syncHoldNudgeUI();
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