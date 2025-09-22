// --- Kruskal's Algorithm Maze Generator ---

window.generateKruskal = function(width, height) {
    // The Cell class is expected to be available globally from game-core.js
    let maze = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => new Cell(x, y))
    );

    const walls = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (y > 0) walls.push({ x1: x, y1: y, x2: x, y2: y - 1 }); // Top wall
            if (x > 0) walls.push({ x1: x, y1: y, x2: x - 1, y2: y }); // Left wall
        }
    }

    // --- Disjoint Set Union (DSU) or Union-Find Data Structure ---
    const sets = new Map();
    // Initially, each cell is its own parent (its own set)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            sets.set(`${x},${y}`, `${x},${y}`);
        }
    }

    function find(cellKey) {
        if (sets.get(cellKey) === cellKey) {
            return cellKey;
        }
        // Path compression for efficiency
        const root = find(sets.get(cellKey));
        sets.set(cellKey, root);
        return root;
    }

    function union(keyA, keyB) {
        const rootA = find(keyA);
        const rootB = find(keyB);
        if (rootA !== rootB) {
            sets.set(rootB, rootA);
            return true; // Union was successful
        }
        return false; // Already in the same set
    }
    // --- End of DSU ---

    // Shuffle the walls array randomly
    for (let i = walls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [walls[i], walls[j]] = [walls[j], walls[i]];
    }

    // Process each wall
    for (const wall of walls) {
        const { x1, y1, x2, y2 } = wall;
        const key1 = `${x1},${y1}`;
        const key2 = `${x2},${y2}`;

        // If the cells are not already connected, connect them and remove the wall
        if (union(key1, key2)) {
            const cell1 = maze[y1][x1];
            const cell2 = maze[y2][x2];
            // Horizontal wall
            if (x1 === x2) {
                if (y1 > y2) { // Wall is top of cell1, bottom of cell2
                    cell1.walls.top = false;
                    cell2.walls.bottom = false;
                } else { // Wall is bottom of cell1, top of cell2
                    cell1.walls.bottom = false;
                    cell2.walls.top = false;
                }
            }
            // Vertical wall
            else {
                if (x1 > x2) { // Wall is left of cell1, right of cell2
                    cell1.walls.left = false;
                    cell2.walls.right = false;
                } else { // Wall is right of cell1, left of cell2
                    cell1.walls.right = false;
                    cell2.walls.left = false;
                }
            }
        }
    }

    return maze;
};
