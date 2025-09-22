// This script provides the controls and rendering for the mobile version.
isMobileVersion = true; // Set the global flag

// --- Mobile-Specific Constants ---
CELL_SIZE = 20; // Smaller cells for a wider view
const CANVAS_WIDTH = Math.min(window.innerWidth * 0.9, 600);
const CANVAS_HEIGHT = Math.min(window.innerHeight * 0.6, 600);

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// --- D-Pad Controls ---
// MODIFIED: Fixed the typo for the 'down' button
const keyMap = { 'd-pad-up': 'ArrowUp', 'd-pad-down': 'ArrowDown', 'd-pad-left': 'ArrowLeft', 'd-pad-right': 'ArrowRight' };

function handleTouch(event) {
    event.preventDefault();
    const key = keyMap[event.target.id];
    if (key) {
        keysPressed[key] = (event.type === 'touchstart');
    }
}
dPad.addEventListener('touchstart', handleTouch, { passive: false });
dPad.addEventListener('touchend', handleTouch, { passive: false });


// --- Drawing Functions (Mobile: Viewport Camera) ---
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
    // MODIFIED: Uses the dynamic trailColor variable
    ctx.strokeStyle = trailColor; 
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

// MODIFIED: This function is now empty as it's no longer needed.
// The solver path is drawn via drawTrail.
function drawSolverPaths() {}


// --- Main Draw Function ---
window.draw = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

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

    let cameraX = currentPixelPos.x - canvas.width / 2;
    let cameraY = currentPixelPos.y - canvas.height / 2;
    const maxCameraX = (MAZE_WIDTH * CELL_SIZE) - canvas.width;
    const maxCameraY = (MAZE_HEIGHT * CELL_SIZE) - canvas.height;
    cameraX = Math.max(0, Math.min(cameraX, maxCameraX));
    cameraY = Math.max(0, Math.min(cameraY, maxCameraY));
    ctx.translate(-cameraX, -cameraY);

    drawEndpoints();
    drawSolverPaths(); // This is now empty, but we keep the call for consistency
    drawTrail();
    drawMaze();
    drawPlayer(currentPixelPos);

    ctx.restore();
}

