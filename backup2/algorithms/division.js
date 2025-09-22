// --- Recursive Division Maze Generator ---

window.generateDivision = function(width, height) {
    // Start with a grid where all cells are connected (no inner walls)
    let maze = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => new Cell(x, y))
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            maze[y][x].walls = { top: false, right: false, bottom: false, left: false };
        }
    }
    
    // Add outer boundary walls
    for (let x = 0; x < width; x++) {
        maze[0][x].walls.top = true;
        maze[height - 1][x].walls.bottom = true;
    }
    for (let y = 0; y < height; y++) {
        maze[y][0].walls.left = true;
        maze[y][width - 1].walls.right = true;
    }

    // --- Helper function for random numbers ---
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // --- The recursive division function ---
    function divide(x, y, w, h) {
        if (w < 2 || h < 2) {
            return; // Stop dividing if the chamber is too small
        }

        // Determine orientation of the wall: horizontal or vertical
        const horizontal = w < h;

        if (horizontal) {
            // --- Create a horizontal wall ---
            let wallY = y + getRandom(0, h - 2);
            let passageX = x + getRandom(0, w - 1);

            for (let i = x; i < x + w; i++) {
                if (i !== passageX) {
                    maze[wallY][i].walls.bottom = true;
                    maze[wallY + 1][i].walls.top = true;
                }
            }
            // Recurse on the two new sub-chambers
            divide(x, y, w, wallY - y + 1);
            divide(x, wallY + 1, w, y + h - (wallY + 1));

        } else {
            // --- Create a vertical wall ---
            let wallX = x + getRandom(0, w - 2);
            let passageY = y + getRandom(0, h - 1);

            for (let i = y; i < y + h; i++) {
                if (i !== passageY) {
                    maze[i][wallX].walls.right = true;
                    maze[i][wallX + 1].walls.left = true;
                }
            }
            // Recurse on the two new sub-chambers
            divide(x, y, wallX - x + 1, h);
            divide(wallX + 1, y, x + w - (wallX + 1), h);
        }
    }

    divide(0, 0, width, height);
    return maze;
};
