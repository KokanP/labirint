// --- Depth-First Search (DFS) Maze Generator ---
// This function creates a maze and assigns it to a global variable.

window.generateDFS = function(width, height) {
    // The Cell class is expected to be available globally from game-core.js
    let maze = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => new Cell(x, y))
    );

    const stack = [];
    let current = maze[0][0];
    current.visited = true;
    let visitedCount = 1;

    while (visitedCount < width * height) {
        const { x, y } = current;
        const neighbors = [];
        // Find unvisited neighbors
        if (y > 0 && !maze[y - 1][x].visited) neighbors.push(maze[y - 1][x]);
        if (x < width - 1 && !maze[y][x + 1].visited) neighbors.push(maze[y][x + 1]);
        if (y < height - 1 && !maze[y + 1][x].visited) neighbors.push(maze[y + 1][x]);
        if (x > 0 && !maze[y][x - 1].visited) neighbors.push(maze[y][x - 1]);

        if (neighbors.length > 0) {
            // Choose a random neighbor
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            stack.push(current);

            // Carve a path between the current and next cell
            if (next.x === x && next.y === y - 1) { // Up
                current.walls.top = false;
                next.walls.bottom = false;
            } else if (next.x === x + 1 && next.y === y) { // Right
                current.walls.right = false;
                next.walls.left = false;
            } else if (next.x === x && next.y === y + 1) { // Down
                current.walls.bottom = false;
                next.walls.top = false;
            } else if (next.x === x - 1 && next.y === y) { // Left
                current.walls.left = false;
                next.walls.right = false;
            }
            
            current = next;
            current.visited = true;
            visitedCount++;
        } else if (stack.length > 0) {
            // If there are no neighbors, backtrack
            current = stack.pop();
        }
    }
    return maze;
};
