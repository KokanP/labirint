// --- Prim's Algorithm Maze Generator ---

window.generatePrim = function(width, height) {
    let maze = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => {
            const cell = new Cell(x, y);
            cell.walls = { top: true, right: true, bottom: true, left: true };
            return cell;
        })
    );

    function getNeighbors(cell) {
        const { x, y } = cell;
        const neighbors = [];
        if (y > 0) neighbors.push(maze[y - 1][x]);
        if (y < height - 1) neighbors.push(maze[y + 1][x]);
        if (x > 0) neighbors.push(maze[y][x - 1]);
        if (x < width - 1) neighbors.push(maze[y][x + 1]);
        return neighbors;
    }

    function removeWall(a, b) {
        if (a.x - b.x === 1) { a.walls.left = false; b.walls.right = false; } 
        else if (a.x - b.x === -1) { a.walls.right = false; b.walls.left = false; }
        if (a.y - b.y === 1) { a.walls.top = false; b.walls.bottom = false; } 
        else if (a.y - b.y === -1) { a.walls.bottom = false; b.walls.top = false; }
    }
    
    const inMaze = new Set();
    const frontier = [];

    // 1. Start with a random cell
    let startCell = maze[Math.floor(Math.random() * height)][Math.floor(Math.random() * width)];
    inMaze.add(`${startCell.x},${startCell.y}`);
    
    // Add its neighbors to the frontier
    getNeighbors(startCell).forEach(neighbor => {
        frontier.push({ from: startCell, to: neighbor });
    });

    // 2. Grow the maze
    while (frontier.length > 0) {
        // Pick a random edge from the frontier
        const randomIndex = Math.floor(Math.random() * frontier.length);
        const { from, to } = frontier.splice(randomIndex, 1)[0];

        // If the cell on the other side is not in the maze yet
        if (!inMaze.has(`${to.x},${to.y}`)) {
            // Carve a path and add the new cell to the maze
            removeWall(from, to);
            inMaze.add(`${to.x},${to.y}`);

            // Add the new cell's neighbors to the frontier
            getNeighbors(to).forEach(neighbor => {
                if (!inMaze.has(`${neighbor.x},${neighbor.y}`)) {
                    frontier.push({ from: to, to: neighbor });
                }
            });
        }
    }

    return maze;
};
