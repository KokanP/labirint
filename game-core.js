// This file contains the shared logic for both desktop and mobile versions.
// It sets up the game state and core functions but does not handle input or rendering.

// --- DOM Elements ---
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const timeValue = document.getElementById('time-value');
const movesValue = document.getElementById('moves-value');
const backtracksValue = document.getElementById('backtracks-value');
const winMessage = document.getElementById('win-message');
const finalScoreEl = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// --- Game Constants ---
const MAZE_WIDTH = 40;
const MAZE_HEIGHT = 40;
const COLORS = {
    WALL: '#f0f0f0',
    START: '#00ff00',
    END: '#ff0000',
    PLAYER: '#0099ff',
    TRAIL: 'rgba(200, 50, 50, 0.8)'
};
const MOVE_SPEED = 0.1; // seconds per cell

// --- Game State Variables ---
let grid, playerPos, endPos, playerPath, visitedCells;
let moveCount, backtrackCount, startTime, finalTime;
let isMoving, gameWon, animStartTime, startPixelPos, targetPixelPos;
let CELL_SIZE; // Will be set by the version-specific script

const keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// --- Cell Class ---
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = { top: true, right: true, bottom: true, left: true };
        this.visited = false;
    }
}

// --- Maze Generation (Depth-First Search) ---
function generateMaze() {
    const stack = [];
    let current = grid[0][0];
    current.visited = true;

    while (true) {
        const neighbors = [];
        const { x, y } = current;

        if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
        if (x < MAZE_WIDTH - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
        if (y < MAZE_HEIGHT - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
        if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            const dx = current.x - next.x;
            const dy = current.y - next.y;
            if (dx === 1) { current.walls.left = false; next.walls.right = false; }
            else if (dx === -1) { current.walls.right = false; next.walls.left = false; }
            if (dy === 1) { current.walls.top = false; next.walls.bottom = false; }
            else if (dy === -1) { current.walls.bottom = false; next.walls.top = false; }
            stack.push(current);
            current = next;
            current.visited = true;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            break;
        }
    }
}

// --- Core Game Logic ---
function update() {
    // Handle Movement
    if (!isMoving && !gameWon) {
        const currentCell = grid[playerPos.y][playerPos.x];
        let nextPos = { ...playerPos };
        let moved = false;

        if (keysPressed.ArrowUp && !currentCell.walls.top) { nextPos.y--; moved = true; }
        else if (keysPressed.ArrowDown && !currentCell.walls.bottom) { nextPos.y++; moved = true; }
        else if (keysPressed.ArrowLeft && !currentCell.walls.left) { nextPos.x--; moved = true; }
        else if (keysPressed.ArrowRight && !currentCell.walls.right) { nextPos.x++; moved = true; }

        if (moved) {
            moveCount++;
            if (visitedCells.has(`${nextPos.x},${nextPos.y}`)) {
                backtrackCount++;
            }
            visitedCells.add(`${nextPos.x},${nextPos.y}`);
            playerPath.push({ ...nextPos });

            isMoving = true;
            animStartTime = performance.now();
            startPixelPos = {
                x: playerPos.x * CELL_SIZE + CELL_SIZE / 2,
                y: playerPos.y * CELL_SIZE + CELL_SIZE / 2
            };
            targetPixelPos = {
                x: nextPos.x * CELL_SIZE + CELL_SIZE / 2,
                y: nextPos.y * CELL_SIZE + CELL_SIZE / 2
            };
            playerPos = nextPos;
        }
    }

    // Check Win Condition
    if (playerPos.x === endPos.x && playerPos.y === endPos.y && !gameWon) {
        gameWon = true;
        finalTime = (performance.now() - startTime) / 1000;
        let score = 10000 - Math.floor(finalTime) * 10 - moveCount * 5 - backtrackCount * 50;
        const finalScore = Math.max(0, Math.floor(score));
        finalScoreEl.textContent = `Score: ${finalScore}`;
        winMessage.style.display = 'flex';
    }
}

function updateUI() {
    const elapsedTime = gameWon ? finalTime : (performance.now() - startTime) / 1000;
    timeValue.textContent = `${Math.floor(elapsedTime)}s`;
    movesValue.textContent = moveCount;
    backtracksValue.textContent = backtrackCount;
}

// --- Main Game Loop (started by version-specific script) ---
function gameLoop() {
    // The version-specific `draw` function will be created globally before this is called
    update();
    draw(); 
    updateUI();
    requestAnimationFrame(gameLoop);
}

// --- Initialization ---
function init() {
    grid = Array.from({ length: MAZE_HEIGHT }, (_, y) =>
        Array.from({ length: MAZE_WIDTH }, (_, x) => new Cell(x, y))
    );

    playerPos = { x: 0, y: 0 };
    endPos = { x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 };
    playerPath = [playerPos];
    visitedCells = new Set([`${playerPos.x},${playerPos.y}`]);
    moveCount = 0;
    backtrackCount = 0;
    isMoving = false;
    gameWon = false;
    winMessage.style.display = 'none';

    generateMaze();

    startTime = performance.now();
}

restartButton.addEventListener('click', () => {
    init();
});
