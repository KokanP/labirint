// --- Wilson's Algorithm Maze Generator ---

window.generateWilson = function(width, height) {
    // Start with a grid where all walls are up.
    let maze = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => {
            const cell = new Cell(x, y);
            // Unlike other algorithms, we initialize with all walls present.
            cell.walls = { top: true, right: true, bottom: true, left: true };
            return cell;
        })
    );

    // --- Helper function to get neighbors ---
    function getNeighbors(cell) {
        const { x, y } = cell;
        const neighbors = [];
        if (y > 0) neighbors.push(maze[y - 1][x]);
        if (y < height - 1) neighbors.push(maze[y + 1][x]);
        if (x > 0) neighbors.push(maze[y][x - 1]);
        if (x < width - 1) neighbors.push(maze[y][x + 1]);
        return neighbors;
    }

    // --- Helper function to remove walls between two cells ---
    function removeWall(a, b) {
        const dx = a.x - b.x;
        if (dx === 1) { // a is right of b
            a.walls.left = false;
            b.walls.right = false;
        } else if (dx === -1) { // a is left of b
            a.walls.right = false;
            b.walls.left = false;
        }
        const dy = a.y - b.y;
        if (dy === 1) { // a is below b
            a.walls.top = false;
            b.walls.bottom = false;
        } else if (dy === -1) { // a is above b
            a.walls.bottom = false;
            b.walls.top = false;
        }
    }

    // 1. Choose a random cell and add it to the maze. This is the seed.
    const mazeCells = new Set();
    const startCell = maze[Math.floor(Math.random() * height)][Math.floor(Math.random() * width)];
    mazeCells.add(`${startCell.x},${startCell.y}`);
    
    // Create a list of all cells not yet in the maze.
    const notInMaze = [];
    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            if (!mazeCells.has(`${x},${y}`)) {
                notInMaze.push(maze[y][x]);
            }
        }
    }
    
    // Shuffle the list of unvisited cells to ensure randomness.
    for (let i = notInMaze.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [notInMaze[i], notInMaze[j]] = [notInMaze[j], notInMaze[i]];
    }

    // 2. Main loop: Perform random walks until all cells are in the maze.
    while(notInMaze.length > 0) {
        // Pick a random starting cell for the walk from the unvisited list.
        let current = notInMaze[0]; 
        const walkPath = [current];
        const walkMap = new Map();
        walkMap.set(`${current.x},${current.y}`, current);

        while (!mazeCells.has(`${current.x},${current.y}`)) {
            const neighbors = getNeighbors(current);
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            const nextKey = `${next.x},${next.y}`;

            // If the walk crosses itself, erase the loop from the path.
            if (walkMap.has(nextKey)) {
                const loopStartIndex = walkPath.findIndex(cell => cell.x === next.x && cell.y === next.y);
                const cellsToRemove = walkPath.slice(loopStartIndex + 1);
                for (const cell of cellsToRemove) {
                    walkMap.delete(`${cell.x},${cell.y}`);
                }
                walkPath.splice(loopStartIndex + 1);
            }
            
            walkPath.push(next);
            walkMap.set(nextKey, next);
            current = next;
        }

        // 3. Add the completed path to the maze.
        for (let i = 0; i < walkPath.length - 1; i++) {
            removeWall(walkPath[i], walkPath[i + 1]);
            const cellKey = `${walkPath[i].x},${walkPath[i].y}`;
            mazeCells.add(cellKey);
        }

        // Remove the newly added cells from the `notInMaze` array.
        // This is more efficient than filtering every time.
        const pathKeys = new Set(walkPath.map(c => `${c.x},${c.y}`));
        let i = notInMaze.length;
        while(i--) {
            const cell = notInMaze[i];
            if(pathKeys.has(`${cell.x},${cell.y}`)) {
                notInMaze.splice(i, 1);
            }
        }
    }

    return maze;
};
