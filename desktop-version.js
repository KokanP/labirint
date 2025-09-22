// This script provides the controls and rendering for the desktop version.

// --- Desktop-Specific Constants ---
const SCREEN_SIZE = Math.min(window.innerHeight * 0.7, window.innerWidth * 0.7, 800);
CELL_SIZE = Math.floor(SCREEN_SIZE / MAZE_WIDTH); // Set the global CELL_SIZE
const CANVAS_WIDTH = CELL_SIZE * MAZE_WIDTH;
const CANVAS_HEIGHT = CELL_SIZE * MAZE_HEIGHT;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// --- Drawing Functions (Desktop: Full Map View) ---
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
    ctx.strokeStyle = COLORS.TRAIL;
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

// --- Main Draw Function (Global for gameLoop) ---
window.draw = function() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawEndpoints();
    drawTrail();
    drawMaze();

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

    drawPlayer(currentPixelPos);
}

// --- Event Listeners ---
window.addEventListener('keydown', e => {
    if (keysPressed.hasOwnProperty(e.key)) {
        keysPressed[e.key] = true;
    }
});

window.addEventListener('keyup', e => {
    if (keysPressed.hasOwnProperty(e.key)) {
        keysPressed[e.key] = false;
    }
});

// --- Start Game ---
init();
gameLoop();
