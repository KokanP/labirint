// This script provides the controls and rendering for the desktop version.
isMobileVersion = false;

// --- Desktop-Specific Constants ---
const maxCanvasWidth = Math.min(window.innerWidth * 0.9, 800);
const maxCanvasHeight = Math.min(window.innerHeight * 0.8, 800);
CELL_SIZE = Math.floor(Math.min(maxCanvasWidth / MAZE_WIDTH, maxCanvasHeight / MAZE_HEIGHT));
canvas.width = MAZE_WIDTH * CELL_SIZE;
canvas.height = MAZE_HEIGHT * CELL_SIZE;

// --- Keyboard Controls ---
function setupDesktopControls() {
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            keysPressed[e.key] = true;
        }
    });
    window.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            keysPressed[e.key] = false;
        }
    });
}

// --- Drawing Functions (Desktop: Full View) ---
function drawMaze() {
    ctx.strokeStyle = COLORS.WALL;
    ctx.lineWidth = Math.max(1, CELL_SIZE / 10);
    ctx.beginPath();
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            const cell = grid[y][x];
            const px = x * CELL_SIZE;
            const py = y * CELL_SIZE;
            if (cell.walls.top) { ctx.moveTo(px, py); ctx.lineTo(px + CELL_SIZE, py); }
            if (cell.walls.right) { ctx.moveTo(px + CELL_SIZE, py); ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE); }
            if (cell.walls.bottom) { ctx.moveTo(px + CELL_SIZE, py + CELL_SIZE); ctx.lineTo(px, py + CELL_SIZE); }
            if (cell.walls.left) { ctx.moveTo(px, py + CELL_SIZE); ctx.lineTo(px, py); }
        }
    }
    ctx.stroke();
}

function drawTrail() {
    if (playerPath.length < 2) return;
    ctx.strokeStyle = trailColor; // MODIFIED: Use dynamic trail color
    ctx.lineWidth = Math.max(1, CELL_SIZE / 5);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const first = playerPath[0];
    ctx.moveTo(first.x * CELL_SIZE + CELL_SIZE / 2, first.y * CELL_SIZE + CELL_SIZE / 2);
    for (let i = 1; i < playerPath.length; i++) {
        const pos = playerPath[i];
        ctx.lineTo(pos.x * CELL_SIZE + CELL_SIZE / 2, pos.y * CELL_SIZE + CELL_SIZE / 2);
    }
    ctx.stroke();
}

function drawEndpoints() {
    ctx.fillStyle = COLORS.START;
    ctx.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
    ctx.fillStyle = COLORS.END;
    ctx.fillRect(endPos.x * CELL_SIZE, endPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function drawPlayer(pixelPos) {
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.arc(pixelPos.x, pixelPos.y, CELL_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawSolverPaths() {
    // MODIFIED: This now ONLY draws the exploration path.
    // The yellow path is drawn by drawTrail during autopilot.
    ctx.fillStyle = COLORS.SOLVER_EXPLORE;
    exploredPath.forEach(cell => {
        ctx.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });
}

// --- Main Draw Function ---
window.draw = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let currentPixelPos = {
        x: playerPos.x * CELL_SIZE + CELL_SIZE / 2,
        y: playerPos.y * CELL_SIZE + CELL_SIZE / 2
    };

    if (isMoving) {
        const elapsed = (performance.now() - animStartTime) / 1000;
        const progress = Math.min(elapsed / MOVE_SPEED, 1.0);
        currentPixelPos.x = startPixelPos.x + (targetPixelPos.x - startPixelPos.x) * progress;
        currentPixelPos.y = startPixelPos.y + (targetPixelPos.y - startPixelPos.y) * progress;
        if (progress >= 1.0) isMoving = false;
    }

    // Drawing order is important for layers
    drawEndpoints();
    if(isSolving) drawSolverPaths(); // Draw gray exploration squares first
    drawTrail(); // Draw red/yellow path on top
    drawMaze();
    drawPlayer(currentPixelPos);
}

// --- Setup ---
setupDesktopControls();

