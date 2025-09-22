// This script provides the controls and rendering for the mobile version.

// --- Mobile-Specific Constants ---
// Make the virtual cell size larger for a zoomed-in feel
CELL_SIZE = 20; // Halved from 40 to show 2x more of the maze
const CANVAS_WIDTH = Math.min(window.innerWidth * 0.9, 600);
const CANVAS_HEIGHT = Math.min(window.innerHeight * 0.6, 600);

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// --- D-Pad Controls ---
const dPad = document.getElementById('d-pad');
dPad.style.display = 'block'; // Make the D-pad visible

const upButton = document.getElementById('d-pad-up');
const downButton = document.getElementById('d-pad-down');
const leftButton = document.getElementById('d-pad-left');
const rightButton = document.getElementById('d-pad-right');

const keyMap = {
    'd-pad-up': 'ArrowUp',
    'd-pad-down': 'ArrowDown',
    'd-pad-left': 'ArrowLeft',
    'd-pad-right': 'ArrowRight',
};

function handleTouch(event) {
    event.preventDefault();
    const key = keyMap[event.target.id];
    if (key) {
        const isTouching = event.type === 'touchstart';
        keysPressed[key] = isTouching;
    }
}

dPad.addEventListener('touchstart', handleTouch, { passive: false });
dPad.addEventListener('touchend', handleTouch, { passive: false });


// --- Drawing Functions (Mobile: Viewport Camera) ---
// These functions are identical to desktop, but will be drawn on a translated canvas
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
    ctx.save(); // Save the default state

    // --- Camera Logic ---
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

    // Center camera on player
    let cameraX = currentPixelPos.x - CANVAS_WIDTH / 2;
    let cameraY = currentPixelPos.y - CANVAS_HEIGHT / 2;

    // Clamp camera to maze boundaries
    const maxCameraX = (MAZE_WIDTH * CELL_SIZE) - CANVAS_WIDTH;
    const maxCameraY = (MAKE_HEIGHT * CELL_SIZE) - CANVAS_HEIGHT;
    cameraX = Math.max(0, Math.min(cameraX, maxCameraX));
    cameraY = Math.max(0, Math.min(cameraY, maxCameraY));

    // Move the entire world opposite to the camera
    ctx.translate(-cameraX, -cameraY);

    // --- Draw all game elements ---
    drawEndpoints();
    drawTrail();
    drawMaze();
    drawPlayer(currentPixelPos);

    ctx.restore(); // Restore to default state
}

// --- Start Game ---
init();
gameLoop();

