document.addEventListener('DOMContentLoaded', () => {
    const mazeContainer = document.getElementById('maze-container');
    const playerElement = document.createElement('div');
    playerElement.id = 'player';
    const targetElement = document.createElement('div');
    targetElement.id = 'target';
    const messageElement = document.getElementById('message');
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const hintBtn = document.getElementById('hint-btn');
    const backBtn = document.getElementById('back-button');

    let currentMaze = [];
    let playerPosition = { row: 0, col: 0 };
    let targetPosition = { row: 0, col: 0 };
    let numRows, numCols, cellSize;
    let gameActive = false;
    let hintPath = [];

    // --- Configuration for Difficulties ---
    const difficulties = {
        easy: { rows: 15, cols: 15, cellSize: 25 },
        medium: { rows: 25, cols: 25, cellSize: 20 },
        hard: { rows: 35, cols: 35, cellSize: 15 }
    };
    let currentDifficulty = difficulties.easy; // Default difficulty

    // --- Maze Generation (Recursive Backtracking) ---
    function generateMaze(rows, cols) {
        // Initialize maze with all walls
        let maze = Array(rows).fill(0).map(() => Array(cols).fill(1)); // 1 = wall, 0 = path

        function isValid(r, c) {
            return r >= 0 && r < rows && c >= 0 && c < cols;
        }

        // Randomly shuffle an array
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function carvePath(r, c) {
            maze[r][c] = 0; // Carve current cell

            const directions = [
                { dr: -2, dc: 0, wallR: -1, wallC: 0 }, // Up
                { dr: 2, dc: 0, wallR: 1, wallC: 0 },   // Down
                { dr: 0, dc: -2, wallR: 0, wallC: -1 }, // Left
                { dr: 0, dc: 2, wallR: 0, wallC: 1 }    // Right
            ];

            shuffle(directions); // Randomize directions

            for (const dir of directions) {
                const newR = r + dir.dr;
                const newC = c + dir.dc;
                const wallR = r + dir.wallR;
                const wallC = c + dir.wallC;

                if (isValid(newR, newC) && maze[newR][newC] === 1) {
                    maze[wallR][wallC] = 0; // Carve wall between cells
                    carvePath(newR, newC); // Recurse
                }
            }
        }

        // Start carving from a random odd coordinate (to ensure valid 2-step moves)
        // Adjust starting point to be within valid path cells for player and target
        let startRow = 1;
        let startCol = 1;
        if (rows % 2 === 0) startRow = 0; // If rows are even, adjust to ensure path access
        if (cols % 2 === 0) startCol = 0; // If cols are even, adjust to ensure path access
        
        // Ensure starting point is a path (0)
        maze[startRow][startCol] = 0;
        
        carvePath(startRow, startCol);

        // Ensure start and end points are always paths and at the edges
        // Start: Top-left
        maze[1][1] = 0;
        playerPosition = { row: 1, col: 1 };

        // End: Bottom-right
        maze[rows - 2][cols - 2] = 0;
        targetPosition = { row: rows - 2, col: cols - 2 };

        return maze;
    }

    // --- Render Maze ---
    function renderMaze() {
        mazeContainer.innerHTML = '';
        mazeContainer.style.gridTemplateColumns = `repeat(${numCols}, ${cellSize}px)`;
        mazeContainer.style.gridTemplateRows = `repeat(${numRows}, ${cellSize}px)`;
        mazeContainer.style.width = `${numCols * cellSize}px`;
        mazeContainer.style.height = `${numRows * cellSize}px`;

        // Set CSS variables for player/target sizing
        mazeContainer.style.setProperty('--cell-size', `${cellSize}px`);
        mazeContainer.style.setProperty('--player-size', `${cellSize * 0.75}px`);
        mazeContainer.style.setProperty('--target-size', `${cellSize * 0.9}px`);


        currentMaze.forEach((row, rowIndex) => {
            row.forEach((cellType, colIndex) => {
                const cell = document.createElement('div');
                cell.classList.add('maze-cell');
                if (cellType === 1) {
                    cell.classList.add('wall');
                } else {
                    cell.classList.add('path');
                }
                cell.dataset.row = rowIndex;
                cell.dataset.col = colIndex;
                mazeContainer.appendChild(cell);
            });
        });

        mazeContainer.appendChild(playerElement);
        mazeContainer.appendChild(targetElement);
        updatePlayerAndTargetPosition();
    }

    // --- Update Player and Target Visual Position ---
    function updatePlayerAndTargetPosition() {
        const playerOffsetX = (cellSize - playerElement.offsetWidth) / 2;
        const playerOffsetY = (cellSize - playerElement.offsetHeight) / 2;
        playerElement.style.left = `${playerPosition.col * cellSize + playerOffsetX}px`;
        playerElement.style.top = `${playerPosition.row * cellSize + playerOffsetY}px`;

        const targetOffsetX = (cellSize - targetElement.offsetWidth) / 2;
        const targetOffsetY = (cellSize - targetElement.offsetHeight) / 2;
        targetElement.style.left = `${targetPosition.col * cellSize + targetOffsetX}px`;
        targetElement.style.top = `${targetPosition.row * cellSize + targetOffsetY}px`;
    }

    // --- Start New Game ---
    function startGame() {
        gameActive = true;
        messageElement.textContent = '';
        numRows = currentDifficulty.rows;
        numCols = currentDifficulty.cols;
        cellSize = currentDifficulty.cellSize;

        currentMaze = generateMaze(numRows, numCols);
        renderMaze();
        hideHintPath(); // Hide hint path from previous game
    }

    // --- Player Movement ---
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;

        let newRow = playerPosition.row;
        let newCol = playerPosition.col;

        switch (e.key) {
            case 'ArrowUp':
                newRow--;
                break;
            case 'ArrowDown':
                newRow++;
                break;
            case 'ArrowLeft':
                newCol--;
                break;
            case 'ArrowRight':
                newCol++;
                break;
            default:
                return;
        }

        // Collision detection and boundary check
        if (newRow >= 0 && newRow < numRows &&
            newCol >= 0 && newCol < numCols &&
            currentMaze[newRow][newCol] !== 1) { // If not a wall
            
            // Clear previous hint path if visible before moving
            if (hintPath.length > 0) {
                hideHintPath();
            }

            playerPosition.row = newRow;
            playerPosition.col = newCol;
            updatePlayerAndTargetPosition();

            // Check for win condition
            if (playerPosition.row === targetPosition.row && playerPosition.col === targetPosition.col) {
                messageElement.textContent = "You Won! 🎉";
                gameActive = false; // Stop game
            }
        }
    });

    // --- Pathfinding for Hint (BFS) ---
    function findShortestPath(start, end) {
        let queue = [{ r: start.row, c: start.col, path: [{ r: start.row, c: start.col }] }];
        let visited = Array(numRows).fill(0).map(() => Array(numCols).fill(false));
        visited[start.row][start.col] = true;

        const directions = [
            { dr: -1, dc: 0 }, // Up
            { dr: 1, dc: 0 },  // Down
            { dr: 0, dc: -1 }, // Left
            { dr: 0, dc: 1 }   // Right
        ];

        while (queue.length > 0) {
            let { r, c, path } = queue.shift();

            if (r === end.row && c === end.col) {
                return path; // Path found!
            }

            for (const dir of directions) {
                const newR = r + dir.dr;
                const newC = c + dir.dc;

                if (newR >= 0 && newR < numRows &&
                    newC >= 0 && newC < numCols &&
                    currentMaze[newR][newC] !== 1 && // Not a wall
                    !visited[newR][newC]) {
                    visited[newR][newC] = true;
                    queue.push({ r: newR, c: newC, path: [...path, { r: newR, c: newC }] });
                }
            }
        }
        return []; // No path found (shouldn't happen with proper maze generation)
    }

    function showHint() {
        if (!gameActive) {
            messageElement.textContent = "Start a game first!";
            return;
        }
        if (hintPath.length > 0) {
            hideHintPath(); // Toggle off if already shown
            return;
        }

        hintPath = findShortestPath(playerPosition, targetPosition);
        if (hintPath.length > 0) {
            // Skip the first element as it's the player's current position
            for (let i = 1; i < hintPath.length; i++) {
                const cell = document.querySelector(`.maze-cell[data-row="${hintPath[i].r}"][data-col="${hintPath[i].c}"]`);
                if (cell) {
                    cell.classList.add('hint-path');
                }
            }
        } else {
            messageElement.textContent = "Could not find a path (error in maze or logic)!";
        }
    }

    function hideHintPath() {
        hintPath.forEach(cellPos => {
            const cell = document.querySelector(`.maze-cell[data-row="${cellPos.r}"][data-col="${cellPos.c}"]`);
            if (cell) {
                cell.classList.remove('hint-path');
            }
        });
        hintPath = [];
    }

    // --- Event Listeners for UI ---
    easyBtn.addEventListener('click', () => {
        currentDifficulty = difficulties.easy;
        messageElement.textContent = "Easy difficulty selected. Click Start New Game!";
    });
    mediumBtn.addEventListener('click', () => {
        currentDifficulty = difficulties.medium;
        messageElement.textContent = "Medium difficulty selected. Click Start New Game!";
    });
    hardBtn.addEventListener('click', () => {
        currentDifficulty = difficulties.hard;
        messageElement.textContent = "Hard difficulty selected. Click Start New Game!";
    });
    startGameBtn.addEventListener('click', startGame);
    hintBtn.addEventListener('click', showHint);

    backBtn.addEventListener('click', () => {
        // In a real application, you'd navigate to home.html or similar
        window.location.href = '../../index.html';
    });

    // Initial setup
    startGame(); // Start with an easy maze by default on load
    messageElement.textContent = "Navigate the maze using arrow keys!";
});