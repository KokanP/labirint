// --- Core Game Logic & State Management ---

// --- ONE-TIME DOM ELEMENT SETUP ---
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const timeValue = document.getElementById('time-value');
const movesValue = document.getElementById('moves-value');
const backtracksValue = document.getElementById('backtracks-value');
const winMessage = document.getElementById('win-message');
const finalScore = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const selectionMenu = document.getElementById('selection-menu');
const gameContainer = document.getElementById('game-container');

// --- Global Game State Variables ---
let MAZE_WIDTH = 40, MAZE_HEIGHT = 40;
let CELL_SIZE; // Will be set by the version script
const MOVE_SPEED = 0.1; // Seconds per cell
let grid, playerPos, endPos;
let playerPath, visitedCells;
let move_count, backtrack_count, startTime, finalTime, final_score;
let isMoving, animStartTime, startPixelPos, targetPixelPos;
let gameWon, gameLoopId;

const keysPressed = {}; // Shared object for controls

const COLORS = { WALL: '#e0e0e0', PLAYER: '#00aaff', START: '#00e676', END: '#ff1744', TRAIL: '#ff5252' };

class Cell { constructor(x, y) { this.x = x; this.y = y; this.walls = { top: true, right: true, bottom: true, left: true }; } }

// --- ONE-TIME INITIALIZATION (called after all scripts are loaded) ---
function initGame() {
    restartButton.addEventListener('click', () => {
        winMessage.style.display = 'none';
        selectionMenu.style.display = 'flex';
        gameContainer.style.display = 'none';
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
    });
}

// --- GAME RESET & START FUNCTION (takes generator as argument) ---
function restartGame(mazeGenerator) {
    selectionMenu.style.display = 'none';
    gameContainer.style.display = 'flex';
    winMessage.style.display = 'none';
    
    // Reset game state
    playerPos = { x: 0, y: 0 };
    endPos = { x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 };
    playerPath = [playerPos];
    visitedCells = new Set([`${playerPos.x},${playerPos.y}`]);
    move_count = 0;
    backtrack_count = 0;
    startTime = performance.now();
    isMoving = false;
    gameWon = false;

    // Generate new maze using the provided generator function
    if (typeof mazeGenerator === 'function') {
        grid = mazeGenerator(MAZE_WIDTH, MAZE_HEIGHT);
    } else {
        console.error("A valid maze generator function was not provided to restartGame!");
        return;
    }

    // Stop any previous game loop and start a new one
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

// --- CORE GAME UPDATE LOGIC ---
function update() {
    if (gameWon || isMoving) return;

    let targetDirection = null;
    if (keysPressed.ArrowUp) targetDirection = { x: 0, y: -1, wall: 'top' };
    else if (keysPressed.ArrowDown) targetDirection = { x: 0, y: 1, wall: 'bottom' };
    else if (keysPressed.ArrowLeft) targetDirection = { x: -1, y: 0, wall: 'left' };
    else if (keysPressed.ArrowRight) targetDirection = { x: 1, y: 0, wall: 'right' };

    if (targetDirection) {
        const currentCell = grid[playerPos.y][playerPos.x];
        if (!currentCell.walls[targetDirection.wall]) {
            const nextPos = { x: playerPos.x + targetDirection.x, y: playerPos.y + targetDirection.y };
            
            // Start animation
            isMoving = true;
            animStartTime = performance.now();
            startPixelPos = { x: playerPos.x * CELL_SIZE + CELL_SIZE / 2, y: playerPos.y * CELL_SIZE + CELL_SIZE / 2 };
            targetPixelPos = { x: nextPos.x * CELL_SIZE + CELL_SIZE / 2, y: nextPos.y * CELL_SIZE + CELL_SIZE / 2 };

            // Update logical state
            playerPos = nextPos;
            move_count++;
            const posKey = `${playerPos.x},${playerPos.y}`;
            if (visitedCells.has(posKey)) backtrack_count++;
            visitedCells.add(posKey);
            playerPath.push(playerPos);
        }
    }

    // Check for win condition
    if (playerPos.x === endPos.x && playerPos.y === endPos.y) {
        gameWon = true;
        finalTime = (performance.now() - startTime) / 1000;
        let score = 10000 - Math.floor(finalTime * 10) - (move_count * 5) - (backtrack_count * 50);
        final_score = Math.max(0, score);
        finalScore.textContent = `Score: ${final_score}`;
        winMessage.style.display = 'flex';
    }
}

// --- UI UPDATE ---
function updateUI() {
    if (!gameWon) {
        const elapsed = (performance.now() - startTime) / 1000;
        timeValue.textContent = `${Math.floor(elapsed)}s`;
    }
    movesValue.textContent = move_count;
    backtracksValue.textContent = backtrack_count;
}

// --- MAIN GAME LOOP ---
function gameLoop() {
    update();
    if (typeof window.draw === 'function') {
        window.draw(); // Call the draw function from desktop/mobile script
    }
    updateUI();
    gameLoopId = requestAnimationFrame(gameLoop);
}

