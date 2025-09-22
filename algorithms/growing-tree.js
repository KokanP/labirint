// --- Growing Tree Algorithm Maze Generator ---

window.generateGrowingTree = function(width, height) {
    let maze = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => {
            const cell = new Cell(x, y);
            cell.walls = { top: true, right: true, bottom: true, left: true };
            return cell;
        })
    );

    const visited = new Set();
    const activeCells = [];

    function getUnvisitedNeighbors(cell) {
        const { x, y } = cell;
        const neighbors = [];
        if (y > 0 && !visited.has(`${x},${y-1}`)) neighbors.push(maze[y - 1][x]);
        if (y < height - 1 && !visited.has(`${x},${y+1}`)) neighbors.push(maze[y + 1][x]);
        if (x > 0 && !visited.has(`${x-1},${y}`)) neighbors.push(maze[y][x - 1]);
        if (x < width - 1 && !visited.has(`${x+1},${y}`)) neighbors.push(maze[y][x + 1]);
        return neighbors;
    }

    function removeWall(a, b) {
        if (a.x - b.x === 1) { a.walls.left = false; b.walls.right = false; } 
        else if (a.x - b.x === -1) { a.walls.right = false; b.walls.left = false; }
        if (a.y - b.y === 1) { a.walls.top = false; b.walls.bottom = false; } 
        else if (a.y - b.y === -1) { a.walls.bottom = false; b.walls.top = false; }
    }

    // 1. Start with a random cell
    let startCell = maze[Math.floor(Math.random() * height)][Math.floor(Math.random() * width)];
    visited.add(`${startCell.x},${startCell.y}`);
    activeCells.push(startCell);

    // 2. Grow the tree
    while (activeCells.length > 0) {
        // --- Strategy: Pick a random cell from the active list ---
        // (Picking the newest would be DFS, picking the oldest would be BFS-like)
        const cellIndex = Math.floor(Math.random() * activeCells.length);
        const cell = activeCells[cellIndex];

        const neighbors = getUnvisitedNeighbors(cell);

        if (neighbors.length > 0) {
            // Pick a random neighbor
            const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            removeWall(cell, neighbor);
            visited.add(`${neighbor.x},${neighbor.y}`);
            activeCells.push(neighbor);
        } else {
            // No unvisited neighbors, so this path is done. Remove from active list.
            activeCells.splice(cellIndex, 1);
        }
    }

    return maze;
};
