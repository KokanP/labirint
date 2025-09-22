// --- Binary Tree Algorithm Maze Generator ---

window.generateBinaryTree = function(width, height) {
    let maze = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => new Cell(x, y))
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = maze[y][x];
            const neighbors = [];
            
            // Bias is towards North and West
            if (y > 0) {
                neighbors.push(maze[y - 1][x]); // North
            }
            if (x > 0) {
                neighbors.push(maze[y][x - 1]); // West
            }

            if (neighbors.length > 0) {
                const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Carve a path
                if (neighbor.y < y) { // North
                    cell.walls.top = false;
                    neighbor.walls.bottom = false;
                } else { // West
                    cell.walls.left = false;
                    neighbor.walls.right = false;
                }
            }
        }
    }

    return maze;
};
