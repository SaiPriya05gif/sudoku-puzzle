const boardElement = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const mistakesElement = document.getElementById('mistakes');
const diffButtons = document.querySelectorAll('.diff-btn');
const numButtons = document.querySelectorAll('.num-btn');
const eraseButton = document.getElementById('btn-erase');
const hintButton = document.getElementById('btn-hint');
const restartButton = document.getElementById('btn-restart');
const newGameButton = document.getElementById('btn-new-game');
const winModal = document.getElementById('win-modal');
const gameOverModal = document.getElementById('game-over-modal');
const winTimeElement = document.getElementById('win-time');
const modalNewGameBtn = document.getElementById('btn-modal-new-game');
const modalRetryBtn = document.getElementById('btn-modal-retry');

// Game State
let solutionBoard = [];
let initialBoard = [];
let currentBoard = [];
let selectedCell = null; // {row, col}
let difficulty = 'easy'; // easy, medium, hard
let mistakes = 0;
const MAX_MISTAKES = 3;
let timerInterval;
let secondsElapsed = 0;
let isGameOver = false;

// Difficulty settings (number of cells to remove)
const DIFF_LEVELS = {
    easy: 30,
    medium: 45,
    hard: 55
};

function init() {
    setupEventListeners();
    startNewGame();
}

function setupEventListeners() {
    // Difficulty Selection
    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            diffButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            difficulty = e.target.dataset.diff;
            startNewGame();
        });
    });

    // Numpad input
    numButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.val);
            handleInput(val);
        });
    });

    // Controls
    eraseButton.addEventListener('click', handleErase);
    hintButton.addEventListener('click', handleHint);
    restartButton.addEventListener('click', restartCurrentGame);
    newGameButton.addEventListener('click', startNewGame);
    
    // Modals
    modalNewGameBtn.addEventListener('click', () => {
        winModal.classList.add('hidden');
        startNewGame();
    });
    
    modalRetryBtn.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        restartCurrentGame();
    });

    // Keyboard Input
    document.addEventListener('keydown', (e) => {
        if (isGameOver) return;
        
        if (e.key >= '1' && e.key <= '9') {
            handleInput(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            handleErase();
        } else if (e.key.startsWith('Arrow')) {
            handleArrowNavigation(e.key);
        }
    });
}

function startNewGame() {
    isGameOver = false;
    mistakes = 0;
    updateMistakesDisplay();
    generateSudoku();
    renderBoard();
    resetTimer();
    startTimer();
    selectedCell = null;
    winModal.classList.add('hidden');
    gameOverModal.classList.add('hidden');
}

function restartCurrentGame() {
    isGameOver = false;
    mistakes = 0;
    updateMistakesDisplay();
    currentBoard = initialBoard.map(row => [...row]);
    renderBoard();
    resetTimer();
    startTimer();
    selectedCell = null;
    gameOverModal.classList.add('hidden');
}

// --- Sudoku Generation ---
function generateSudoku() {
    // 1. Create empty board
    solutionBoard = Array.from({length: 9}, () => Array(9).fill(0));
    
    // 2. Fill diagonal 3x3 boxes (independent)
    fillDiagonalBoxes(solutionBoard);
    
    // 3. Solve the rest using backtracking
    solveSudoku(solutionBoard);
    
    // 4. Create puzzle by removing numbers
    currentBoard = solutionBoard.map(row => [...row]);
    removeNumbers(currentBoard, DIFF_LEVELS[difficulty]);
    
    // 5. Store initial state
    initialBoard = currentBoard.map(row => [...row]);
}

function fillDiagonalBoxes(board) {
    for (let i = 0; i < 9; i += 3) {
        fillBox(board, i, i);
    }
}

function fillBox(board, rowStart, colStart) {
    let num;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do {
                num = Math.floor(Math.random() * 9) + 1;
            } while (!isSafeInBox(board, rowStart, colStart, num));
            board[rowStart + i][colStart + j] = num;
        }
    }
}

function isSafeInBox(board, rowStart, colStart, num) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[rowStart + i][colStart + j] === num) return false;
        }
    }
    return true;
}

function isSafe(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }
    // Check col
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }
    // Check box
    let startRow = row - row % 3;
    let startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }
    return true;
}

function solveSudoku(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isSafe(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) return true;
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function removeNumbers(board, count) {
    let removed = 0;
    while (removed < count) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);
        if (board[row][col] !== 0) {
            board[row][col] = 0;
            removed++;
        }
    }
}

// --- UI Rendering ---
function renderBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const val = currentBoard[row][col];
            if (val !== 0) {
                cell.textContent = val;
                if (initialBoard[row][col] !== 0) {
                    cell.classList.add('given');
                } else {
                    cell.classList.add('input');
                }
            }
            
            cell.addEventListener('click', () => selectCell(row, col));
            boardElement.appendChild(cell);
        }
    }
    updateHighlights();
}

// --- Interaction & Game Logic ---
function selectCell(row, col) {
    if (isGameOver) return;
    selectedCell = { row, col };
    updateHighlights();
}

function updateHighlights() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('selected', 'highlight', 'same-number');
    });

    if (!selectedCell) return;

    const selectedVal = currentBoard[selectedCell.row][selectedCell.col];
    const boxStartRow = selectedCell.row - (selectedCell.row % 3);
    const boxStartCol = selectedCell.col - (selectedCell.col % 3);

    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const val = currentBoard[r][c];

        // Highlight row, column, and box
        if (r === selectedCell.row || c === selectedCell.col || 
            (r >= boxStartRow && r < boxStartRow + 3 && c >= boxStartCol && c < boxStartCol + 3)) {
            cell.classList.add('highlight');
        }

        // Highlight same numbers
        if (selectedVal !== 0 && val === selectedVal) {
            cell.classList.add('same-number');
        }

        // Highlight selected cell specifically
        if (r === selectedCell.row && c === selectedCell.col) {
            cell.classList.add('selected');
        }
    });
}

function handleInput(val) {
    if (!selectedCell || isGameOver) return;
    
    const r = selectedCell.row;
    const c = selectedCell.col;
    
    // Cannot edit given numbers
    if (initialBoard[r][c] !== 0) return;
    
    // If correct
    if (solutionBoard[r][c] === val) {
        currentBoard[r][c] = val;
        renderBoard(); // re-render to update classes and text
        checkWinCondition();
    } else {
        // Mistake
        mistakes++;
        updateMistakesDisplay();
        
        // Show error animation on cell
        const cellIdx = r * 9 + c;
        const cellEl = boardElement.children[cellIdx];
        cellEl.textContent = val;
        cellEl.classList.add('error');
        
        setTimeout(() => {
            if(cellEl) {
                cellEl.classList.remove('error');
                cellEl.textContent = currentBoard[r][c] === 0 ? '' : currentBoard[r][c];
            }
        }, 800);
        
        if (mistakes >= MAX_MISTAKES) {
            handleGameOver();
        }
    }
}

function handleErase() {
    if (!selectedCell || isGameOver) return;
    const r = selectedCell.row;
    const c = selectedCell.col;
    
    if (initialBoard[r][c] !== 0) return;
    
    currentBoard[r][c] = 0;
    renderBoard();
}

function handleHint() {
    if (!selectedCell || isGameOver) return;
    const r = selectedCell.row;
    const c = selectedCell.col;
    
    if (currentBoard[r][c] === 0) {
        handleInput(solutionBoard[r][c]);
    }
}

function handleArrowNavigation(key) {
    if (!selectedCell) {
        selectCell(0, 0);
        return;
    }
    let r = selectedCell.row;
    let c = selectedCell.col;
    
    if (key === 'ArrowUp') r = Math.max(0, r - 1);
    if (key === 'ArrowDown') r = Math.min(8, r + 1);
    if (key === 'ArrowLeft') c = Math.max(0, c - 1);
    if (key === 'ArrowRight') c = Math.min(8, c + 1);
    
    selectCell(r, c);
}

function updateMistakesDisplay() {
    mistakesElement.textContent = `${mistakes}/${MAX_MISTAKES}`;
}

function checkWinCondition() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (currentBoard[r][c] !== solutionBoard[r][c]) {
                return; // not won yet
            }
        }
    }
    handleWin();
}

function handleWin() {
    isGameOver = true;
    clearInterval(timerInterval);
    winTimeElement.textContent = formatTime(secondsElapsed);
    winModal.classList.remove('hidden');
}

function handleGameOver() {
    isGameOver = true;
    clearInterval(timerInterval);
    gameOverModal.classList.remove('hidden');
}

// --- Timer ---
function startTimer() {
    timerInterval = setInterval(() => {
        secondsElapsed++;
        timerElement.textContent = formatTime(secondsElapsed);
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    timerElement.textContent = "00:00";
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Start app
init();
