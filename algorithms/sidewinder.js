// --- Sidewinder Algorithm Maze Generator ---

window.generateSidewinder = function(width, height) {
    let maze = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => {
            const cell = new Cell(x, y);
            // Initialize with all walls up
            cell.walls = { top: true, right: true, bottom: true, left: true };
            return cell;
        })
    );

    // Process row by row
    for (let y = 0; y < height; y++) {
        let runStart = 0;
        for (let x = 0; x < width; x++) {
            // The top row is a special case: it must be a single passage
            if (y > 0) {
                 // Decide whether to close the run or carve east
                const closeRun = (x === width - 1) || (Math.random() < 0.5);

                if (closeRun) {
                    // Close the run: carve a path north from a random cell in the run
                    const passageX = runStart + Math.floor(Math.random() * (x - runStart + 1));
                    const cell = maze[y][passageX];
                    const northCell = maze[y-1][passageX];
                    cell.walls.top = false;
                    northCell.walls.bottom = false;
                    runStart = x + 1;
                } else {
                    // Continue the run: carve east
                    const cell = maze[y][x];
                    const eastCell = maze[y][x+1];
                    cell.walls.right = false;
                    eastCell.walls.left = false;
                }
            } else {
                // For the first row (y=0), just carve east to create a single passage
                if (x < width - 1) {
                    const cell = maze[y][x];
                    const eastCell = maze[y][x+1];
                    cell.walls.right = false;
                    eastCell.walls.left = false;
                }
            }
        }
    }
    return maze;
};
