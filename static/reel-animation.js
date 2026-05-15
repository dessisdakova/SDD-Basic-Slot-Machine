/**
 * Phase 10: vertical reel spin animation (Super Hot–style).
 * Exposes window.SlotReels — server spin_result is authoritative on land.
 */
(function () {
    const CELL_PX = 80;
    const SPIN_PX_PER_FRAME = 28;
    const STOP_STAGGER_MS = 120;
    const LAST_REEL_EXTRA_MS = 180;
    const MIN_SPIN_BEFORE_LAND_MS = 500;
    const EXTRA_LAND_CASCADE_MS = 500;
    const STRIP_REPEAT = 10;
    const LAND_SCROLL_MS = 1200;
    const LAND_MIN_TRAVEL_ROWS = 5;

    const state = {
        rows: 3,
        reels: 5,
        symbolPool: [],
        columns: [],
        spinning: false,
        spinStartedAt: 0,
        spinRaf: null,
    };

    function pickRandomSymbol() {
        const pool = state.symbolPool;
        if (!pool.length) return '?';
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function buildSpinStripSymbols() {
        const symbols = [];
        const total = state.rows * STRIP_REPEAT;
        for (let i = 0; i < total; i++) {
            symbols.push(pickRandomSymbol());
        }
        return symbols;
    }

    function appendStripCell(strip, symbol) {
        const cell = document.createElement('div');
        cell.className = 'slot-cell';
        cell.textContent = symbol;
        strip.appendChild(cell);
        return cell;
    }

    function fillStrip(strip, symbols) {
        strip.innerHTML = '';
        symbols.forEach((sym) => appendStripCell(strip, sym));
    }

    function maxScrollPx(strip) {
        return Math.max(0, strip.children.length * CELL_PX - state.rows * CELL_PX);
    }

    /** Negative Y + increasing offset: reliable strip scroll inside the viewport. */
    function applyStripScroll(strip, offsetPx) {
        strip.style.transform = offsetPx > 0 ? `translateY(-${offsetPx}px)` : '';
    }

    function setGridIdle(idle) {
        const grid = document.getElementById('slot-grid');
        if (!grid) return;
        grid.dataset.reelsIdle = idle ? 'true' : 'false';
    }

    function renderVisibleCells(colEl, symbols) {
        const strip = colEl.stripEl;
        strip.innerHTML = '';
        symbols.forEach((symbol, row) => {
            const cell = document.createElement('div');
            cell.className = 'slot-cell';
            cell.dataset.row = String(row);
            cell.dataset.symbol = symbol;
            cell.textContent = symbol;
            strip.appendChild(cell);
        });
        colEl.offset = 0;
        applyStripScroll(strip, 0);
        colEl.finalSymbols = symbols.slice();
    }

    function columnSymbolsFromGrid(gridMatrix, col) {
        const out = [];
        for (let r = 0; r < state.rows; r++) {
            out.push(gridMatrix[r][col]);
        }
        return out;
    }

    function createHighlightLayer(viewport) {
        const layer = document.createElement('div');
        layer.className = 'reel-highlight-layer';
        const slots = [];
        for (let r = 0; r < state.rows; r++) {
            const slot = document.createElement('div');
            slot.className = 'reel-highlight-slot';
            slot.dataset.row = String(r);
            slot.style.top = `${r * CELL_PX}px`;
            slot.style.height = `${CELL_PX}px`;
            layer.appendChild(slot);
            slots.push(slot);
        }
        viewport.appendChild(layer);
        return slots;
    }

    function createColumn(colIndex) {
        const wrap = document.createElement('div');
        wrap.className = 'reel-column flex flex-col items-center';
        wrap.id = `reel-col-${colIndex}`;
        wrap.dataset.col = String(colIndex);

        const viewport = document.createElement('div');
        viewport.className = 'reel-viewport';
        viewport.style.height = `${state.rows * CELL_PX}px`;
        viewport.style.width = `${CELL_PX}px`;

        const strip = document.createElement('div');
        strip.className = 'reel-strip flex flex-col';

        viewport.appendChild(strip);
        const highlightSlots = createHighlightLayer(viewport);
        wrap.appendChild(viewport);

        return {
            el: wrap,
            viewportEl: viewport,
            stripEl: strip,
            highlightSlots,
            colIndex,
            offset: 0,
            stopped: true,
            landing: false,
            held: false,
            finalSymbols: [],
        };
    }

    function mountGrid(gridEl, gridMatrix, symbolPool) {
        state.symbolPool = symbolPool || [];
        state.rows = gridMatrix.length;
        state.reels = gridMatrix[0]?.length || 0;
        state.columns = [];

        gridEl.innerHTML = '';
        gridEl.className = 'flex gap-2 justify-center items-stretch';
        setGridIdle(true);

        for (let c = 0; c < state.reels; c++) {
            const col = createColumn(c);
            renderVisibleCells(col, columnSymbolsFromGrid(gridMatrix, c));
            state.columns.push(col);
            gridEl.appendChild(col.el);
        }
    }

    function spinFrame() {
        if (!state.spinning) return;

        state.columns.forEach((col) => {
            if (col.stopped || col.held || col.landing) return;

            const strip = col.stripEl;
            if (strip.children.length <= state.rows) return;

            const maxOffset = maxScrollPx(strip);
            if (col.offset >= maxOffset - SPIN_PX_PER_FRAME) {
                for (let i = 0; i < state.rows * 2; i++) {
                    appendStripCell(strip, pickRandomSymbol());
                }
            }

            const nextMax = maxScrollPx(strip);
            col.offset = Math.min(col.offset + SPIN_PX_PER_FRAME, nextMax);
            applyStripScroll(strip, col.offset);
        });

        state.spinRaf = requestAnimationFrame(spinFrame);
    }

    function prepareColumnForSpin(col, held) {
        col.held = held;
        col.stopped = held;

        if (held) {
            col.el.classList.remove('reel-column--spinning');
            return;
        }

        col.stopped = false;
        const strip = col.stripEl;
        fillStrip(strip, buildSpinStripSymbols());
        col.offset = 0;
        applyStripScroll(strip, 0);
        col.el.classList.add('reel-column--spinning');
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function landColumnAnimated(col, finalSymbols) {
        return new Promise((resolve) => {
            col.landing = true;
            const strip = col.stripEl;
            const rows = state.rows;
            const minTravelPx = rows * CELL_PX * LAND_MIN_TRAVEL_ROWS;

            for (let i = 0; i < rows * 4; i++) {
                appendStripCell(strip, pickRandomSymbol());
            }
            finalSymbols.forEach((sym) => appendStripCell(strip, sym));

            const targetOffset = maxScrollPx(strip);
            let animStart = col.offset;
            if (targetOffset - animStart < minTravelPx) {
                animStart = Math.max(0, targetOffset - minTravelPx);
            }

            col.el.classList.remove('reel-column--spinning');
            const travel = targetOffset - animStart;
            const startTime = performance.now();

            function tick(now) {
                const t = Math.min(1, (now - startTime) / LAND_SCROLL_MS);
                const offset = animStart + travel * easeOutCubic(t);
                col.offset = offset;
                applyStripScroll(strip, offset);

                if (t < 1) {
                    requestAnimationFrame(tick);
                    return;
                }

                col.stopped = true;
                col.landing = false;
                col.finalSymbols = finalSymbols.slice();
                renderVisibleCells(col, finalSymbols);
                resolve();
            }

            requestAnimationFrame(tick);
        });
    }

    function snapColumn(col, finalSymbols) {
        col.stopped = true;
        col.finalSymbols = finalSymbols.slice();
        col.el.classList.remove('reel-column--spinning');
        renderVisibleCells(col, finalSymbols);
    }

    function startSpin(options = {}) {
        const heldSet = options.heldColumns || new Set();
        state.spinning = true;
        state.spinStartedAt = Date.now();
        setGridIdle(false);

        state.columns.forEach((col) => {
            prepareColumnForSpin(col, heldSet.has(col.colIndex));
        });

        if (state.spinRaf) cancelAnimationFrame(state.spinRaf);
        state.spinRaf = requestAnimationFrame(spinFrame);
    }

    function stopSpinLoop() {
        state.spinning = false;
        if (state.spinRaf) {
            cancelAnimationFrame(state.spinRaf);
            state.spinRaf = null;
        }
    }

    function landAndReveal(spinResult, options = {}) {
        const heldSet = options.heldColumns || new Set();
        const lastReelExtra = options.lastReelExtra !== false;

        return new Promise((resolve) => {
            const runStopCascade = async () => {
                const tasks = [];

                for (let c = 0; c < state.reels; c++) {
                    const col = state.columns[c];
                    const finals = columnSymbolsFromGrid(spinResult, c);
                    let delay = EXTRA_LAND_CASCADE_MS + c * STOP_STAGGER_MS;
                    if (c === state.reels - 1 && lastReelExtra) {
                        delay += LAST_REEL_EXTRA_MS;
                    }

                    if (heldSet.has(c)) {
                        snapColumn(col, finals);
                        continue;
                    }

                    tasks.push(
                        new Promise((done) => {
                            setTimeout(async () => {
                                await landColumnAnimated(col, finals);
                                done();
                            }, delay);
                        })
                    );
                }

                await Promise.all(tasks);
                stopSpinLoop();
                setGridIdle(true);
                resolve();
            };

            const elapsed = Date.now() - state.spinStartedAt;
            const waitForMinSpin = Math.max(0, MIN_SPIN_BEFORE_LAND_MS - elapsed);
            setTimeout(runStopCascade, waitForMinSpin);
        });
    }

    function cancelSpin() {
        stopSpinLoop();
        state.columns.forEach((col) => {
            if (!col.stopped) {
                col.el.classList.remove('reel-column--spinning');
                col.stopped = true;
                col.landing = false;
            }
        });
        setGridIdle(true);
    }

    function getCell(row, col) {
        return document.querySelector(
            `#reel-col-${col} .slot-cell[data-row="${row}"]`
        );
    }

    function getHighlightSlot(row, col) {
        const column = state.columns[col];
        if (!column?.highlightSlots) return getCell(row, col);
        return column.highlightSlots[row] || null;
    }

    window.SlotReels = {
        mountGrid,
        startSpin,
        landAndReveal,
        cancelSpin,
        getCell,
        getHighlightSlot,
        get rows() {
            return state.rows;
        },
        get reels() {
            return state.reels;
        },
    };
})();
