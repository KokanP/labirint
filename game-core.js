// --- DOM Elements ---
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const timeValue = document.getElementById('time-value');
const movesValue = document.getElementById('moves-value');
const backtracksValue = document.getElementById('backtracks-value');
const winMessage = document.getElementById('win-message');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const selectionMenu = document.getElementById('selection-menu');
const gameContainer = document.getElementById('game-container');

// --- Game Constants ---
const MAZE_WIDTH = 40;
const MAZE_HEIGHT = 40;
const MOVE_SPEED = 0.1; // Seconds per cell
const COLORS = {
    WALL: '#d0d0d0',
    PLAYER: '#00aaff',
    START: 'rgba(0, 255, 128, 0.7)',
    END: 'rgba(255, 0, 128, 0.7)',
    TRAIL: 'rgba(255, 50, 50, 0.8)',
};

// --- Mutable Game Settings ---
let CELL_SIZE; // Will be set by desktop- or mobile-version.js

// --- Game State Variables ---
let grid = [];
let playerPos = { x: 0, y: 0 };
let startPos = { x: 0, y: 0 };
let endPos = { x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 };

let playerPath = [];
let visitedCells = new Set();
let moveCount = 0;
let backtrackCount = 0;
let startTime = 0;
let gameWon = false;

let keysPressed = {};

// --- Animation State ---
let isMoving = false;
let animStartTime = 0;
let startPixelPos = { x: 0, y: 0 };
let targetPixelPos = { x: 0, y: 0 };

// --- Cell Class (used by all generators) ---
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = { top: true, right: true, bottom: true, left: true };
        this.visited = false; // Used by some generators
    }
}

// --- UI & Scoring ---
function updateUI() {
    const elapsed = gameWon ? (winMessage.dataset.finalTime || 0) : (performance.now() - startTime) / 1000;
    timeValue.textContent = `${Math.floor(elapsed)}s`;
    movesValue.textContent = moveCount;
    backtracksValue.textContent = backtrackCount;
}

function calculateScore(time, moves, backtracks) {
    let score = Math.max(0, 10000 - (time * 10) - (moves * 5) - (backtracks * 50));
    return Math.floor(score);
}

// --- Game Logic ---
function init() {
    gameWon = false;
    isMoving = false;
    winMessage.style.display = 'none';

    moveCount = 0;
    backtrackCount = 0;
    
    playerPos = { x: startPos.x, y: startPos.y };
    playerPath = [playerPos];
    visitedCells.clear();
    visitedCells.add(`${playerPos.x},${playerPos.y}`);

    // Generate maze using the globally assigned generator function
    if (window.mazeGenerator) {
        grid = window.mazeGenerator(MAZE_WIDTH, MAZE_HEIGHT);
    } else {
        console.error("No maze generator has been selected!");
        return;
    }
    
    startTime = performance.now();
}

function update() {
    if (gameWon) return;

    updateUI();

    if (!isMoving) {
        const currentCell = grid[playerPos.y][playerPos.x];
        let moved = false;
        let newPos = { ...playerPos };

        if (keysPressed.ArrowUp && !currentCell.walls.top) { newPos.y--; moved = true; }
        else if (keysPressed.ArrowDown && !currentCell.walls.bottom) { newPos.y++; moved = true; }
        else if (keysPressed.ArrowLeft && !currentCell.walls.left) { newPos.x--; moved = true; }
        else if (keysPressed.ArrowRight && !currentCell.walls.right) { newPos.x++; moved = true; }

        if (moved) {
            moveCount++;
            if (visitedCells.has(`${newPos.x},${newPos.y}`)) {
                backtrackCount++;
            }
            visitedCells.add(`${newPos.x},${newPos.y}`);
            
            isMoving = true;
            animStartTime = performance.now();
            startPixelPos = {
                x: playerPos.x * CELL_SIZE + CELL_SIZE / 2,
                y: playerPos.y * CELL_SIZE + CELL_SIZE / 2
            };
            targetPixelPos = {
                x: newPos.x * CELL_SIZE + CELL_SIZE / 2,
                y: newPos.y * CELL_SIZE + CELL_SIZE / 2
            };
            playerPos = newPos;
            playerPath.push(playerPos);

            if (playerPos.x === endPos.x && playerPos.y === endPos.y) {
                gameWon = true;
                const finalTime = (performance.now() - startTime) / 1000;
                winMessage.dataset.finalTime = finalTime;
                const score = calculateScore(finalTime, moveCount, backtrackCount);
                finalScoreDisplay.textContent = `Score: ${score}`;
                winMessage.style.display = 'flex';
            }
        }
    }
}

function gameLoop() {
    update();
    if (window.draw) {
        window.draw(); // draw() is defined in desktop- or mobile-version.js
    }
    requestAnimationFrame(gameLoop);
}

// --- Game Starter ---
function startGame() {
    // Hide menu, show game
    selectionMenu.style.display = 'none';
    gameContainer.style.display = 'flex';

    // Load the correct version (desktop/mobile) based on device
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth < 800;

    const versionScript = (isMobile || isSmallScreen) ? 'mobile-version.js' : 'desktop-version.js';
    
    // Dynamically load the script for the detected version
    const script = document.createElement('script');
    script.src = versionScript;
    script.onload = () => {
        // The loaded script will call init() and gameLoop()
        console.log(`${versionScript} loaded and started.`);
    };
    document.head.appendChild(script);
}

restartButton.addEventListener('click', () => {
    // For restarting, we just need to re-initialize the game state.
    // The generator and version script are already loaded.
    init();
});

