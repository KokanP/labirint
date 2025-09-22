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
const selectionMenuContainer = document.getElementById('selection-menu-container');
const gameContainer = document.getElementById('game-container');
const solveButton = document.getElementById('solve-button');
const dPad = document.getElementById('d-pad');
const mainTitle = document.getElementById('main-title');


// --- Global Game State Variables ---
let MAZE_WIDTH = 40, MAZE_HEIGHT = 40;
let CELL_SIZE;
const MOVE_SPEED = 0.1;
let grid, playerPos, endPos;
let playerPath, visitedCells;
let move_count, backtrack_count, startTime, finalTime, final_score;
let isMoving, animStartTime, startPixelPos, targetPixelPos;
let gameWon, gameLoopId;
let isMobileVersion = false;
let trailColor;

// --- SOLVER STATE ---
let isSolving = false;
let exploredPath = [];
let solutionPath = [];

const keysPressed = {};

// Retro color palette
const COLORS = { 
    WALL: '#fff4e4', 
    PLAYER: '#29adff', 
    START: '#00e436', 
    END: '#ff004d', 
    TRAIL: '#ff77a8', 
    SOLVER_EXPLORE: 'rgba(41, 173, 255, 0.3)',
    SOLVER_PATH: '#ffec27'
};

class Cell { constructor(x, y) { this.x = x; this.y = y; this.walls = { top: true, right: true, bottom: true, left: true }; } }

// --- ONE-TIME INITIALIZATION ---
function initGame() {
    restartButton.addEventListener('click', () => {
        winMessage.style.display = 'none';
        // MODIFIED: Show menu elements
        selectionMenuContainer.style.display = 'flex';
        mainTitle.style.display = 'block';
        gameContainer.style.display = 'none';
        document.body.classList.remove('game-active'); // Remove class
        if (isMobileVersion) dPad.style.display = 'none';
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
    });
    solveButton.addEventListener('click', startSolverAnimation);
}

// --- GAME RESET & START ---
function restartGame(mazeGenerator) {
    // MODIFIED: Hide menu elements
    selectionMenuContainer.style.display = 'none';
    mainTitle.style.display = 'none';
    gameContainer.style.display = 'flex';
    document.body.classList.add('game-active'); // Add class
    
    winMessage.style.display = 'none';
    if (isMobileVersion) dPad.style.display = 'block';
    
    playerPos = { x: 0, y: 0 };
    endPos = { x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 };
    playerPath = [playerPos];
    visitedCells = new Set([`${playerPos.x},${playerPos.y}`]);
    move_count = 0;
    backtrack_count = 0;
    startTime = performance.now();
    isMoving = false;
    gameWon = false;
    trailColor = COLORS.TRAIL;

    isSolving = false;
    exploredPath = [];
    solutionPath = [];
    solveButton.disabled = false;

    if (typeof mazeGenerator === 'function') {
        grid = mazeGenerator(MAZE_WIDTH, MAZE_HEIGHT);
    } else {
        console.error("A valid maze generator function was not provided!");
        return;
    }

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

// --- Centralized Win Function ---
function triggerWinState(solvedBySolver = false) {
    if (gameWon) return;
    gameWon = true;
    solveButton.disabled = true;
    finalTime = (performance.now() - startTime) / 1000;

    const winTitle = document.querySelector('#win-message h2');

    if (solvedBySolver) {
        winTitle.textContent = "Solved!";
        const moves = playerPath.length - 1;
        finalScore.textContent = `Optimal path: ${moves} moves.`;
    } else {
        winTitle.textContent = "You Win!";
        let score = 10000 - Math.floor(finalTime * 10) - (move_count * 5) - (backtrack_count * 50);
        final_score = Math.max(0, score);
        finalScore.textContent = `Score: ${final_score}`;
    }
    winMessage.style.display = 'flex';
}

// --- BFS SOLVER LOGIC ---
function solveMazeBFS(startNode) {
    const start = startNode;
    const end = grid[endPos.y][endPos.x];
    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);
    const predecessor = new Map();
    const explorationOrder = [];

    while(queue.length > 0) {
        const current = queue.shift();
        explorationOrder.push(current);

        if (current === end) {
            let path = [];
            let at = end;
            while(at) {
                path.unshift(at);
                at = predecessor.get(at);
            }
            return { path, explorationOrder };
        }

        const { x, y, walls } = current;
        const neighbors = [];
        if (!walls.top && y > 0) neighbors.push(grid[y - 1][x]);
        if (!walls.bottom && y < MAZE_HEIGHT - 1) neighbors.push(grid[y + 1][x]);
        if (!walls.left && x > 0) neighbors.push(grid[y][x - 1]);
        if (!walls.right && x < MAZE_WIDTH - 1) neighbors.push(grid[y][x + 1]);

        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                predecessor.set(neighbor, current);
                queue.push(neighbor);
            }
        }
    }
    return { path: [], explorationOrder };
}

// --- Solver Autopilot ---
function startAutopilot(path) {
    let currentStep = 0;
    
    const autopilotInterval = setInterval(() => {
        if (currentStep >= path.length - 1) {
            clearInterval(autopilotInterval);
            triggerWinState(true);
            return;
        }
        if(!isSolving) {
             clearInterval(autopilotInterval);
             return;
        }

        const startNode = path[currentStep];
        const endNode = path[currentStep + 1];

        isMoving = true;
        animStartTime = performance.now();
        startPixelPos = { x: startNode.x * CELL_SIZE + CELL_SIZE / 2, y: startNode.y * CELL_SIZE + CELL_SIZE / 2 };
        targetPixelPos = { x: endNode.x * CELL_SIZE + CELL_SIZE / 2, y: endNode.y * CELL_SIZE + CELL_SIZE / 2 };
        
        playerPos = endNode;
        playerPath.push(playerPos);
        
        currentStep++;
    }, (MOVE_SPEED * 1000) + 50);
}

function startSolverAnimation() {
    if (isSolving || gameWon) return;
    isSolving = true;
    solveButton.disabled = true;
    trailColor = COLORS.SOLVER_PATH;

    const startNode = grid[playerPos.y][playerPos.x];
    const { path, explorationOrder } = solveMazeBFS(startNode);
    
    if (!isMobileVersion) {
        let i = 0;
        const exploreInterval = setInterval(() => {
            if (i < explorationOrder.length) {
                exploredPath.push(explorationOrder[i]);
                i++;
            } else {
                clearInterval(exploreInterval);
                solutionPath = path;
                startAutopilot(path);
            }
        }, 5);
    } else {
        solutionPath = path;
        startAutopilot(path);
    }
}

// --- CORE GAME UPDATE LOGIC ---
function update() {
    if (gameWon || isMoving || isSolving) return;

    let targetDirection = null;
    if (keysPressed.ArrowUp) targetDirection = { x: 0, y: -1, wall: 'top' };
    else if (keysPressed.ArrowDown) targetDirection = { x: 0, y: 1, wall: 'bottom' };
    else if (keysPressed.ArrowLeft) targetDirection = { x: -1, y: 0, wall: 'left' };
    else if (keysPressed.ArrowRight) targetDirection = { x: 1, y: 0, wall: 'right' };

    if (targetDirection) {
        const currentCell = grid[playerPos.y][playerPos.x];
        if (!currentCell.walls[targetDirection.wall]) {
            const nextPos = { x: playerPos.x + targetDirection.x, y: playerPos.y + targetDirection.y };
            
            isMoving = true;
            animStartTime = performance.now();
            startPixelPos = { x: playerPos.x * CELL_SIZE + CELL_SIZE / 2, y: playerPos.y * CELL_SIZE + CELL_SIZE / 2 };
            targetPixelPos = { x: nextPos.x * CELL_SIZE + CELL_SIZE / 2, y: nextPos.y * CELL_SIZE + CELL_SIZE / 2 };

            playerPos = nextPos;
            move_count++;
            const posKey = `${playerPos.x},${playerPos.y}`;
            if (visitedCells.has(posKey)) backtrack_count++;
            visitedCells.add(posKey);
            playerPath.push(playerPos);
        }
    }

    if (playerPos.x === endPos.x && playerPos.y === endPos.y) {
        triggerWinState(false);
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
        window.draw();
    }
    updateUI();
    gameLoopId = requestAnimationFrame(gameLoop);
}

