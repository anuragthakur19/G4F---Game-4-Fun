let rows, cols, mineCount, board, mineLocations;
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
let gameOver = false;

function setDifficulty(level) {
  if (level === 'easy') [rows, cols, mineCount] = [9, 9, 10];
  if (level === 'medium') [rows, cols, mineCount] = [16, 16, 40];
  if (level === 'hard') [rows, cols, mineCount] = [13, 13, 30];  // <- updated
  boardEl.style.setProperty('--cols', cols);
  startGame();
}


function startGame() {
  gameOver = false;
  board = [];
  mineLocations = [];
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  boardEl.style.gridTemplateRows = `repeat(${rows}, 30px)`;
  statusEl.textContent = '';

  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => revealCell(r, c));
      cell.addEventListener('contextmenu', e => {
        e.preventDefault();
        toggleFlag(r, c);
      });
      boardEl.appendChild(cell);
      board[r][c] = { revealed: false, mine: false, flagged: false, element: cell };
    }
  }

  placeMines();
  calculateNumbers();
}

function placeMines() {
  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      mineLocations.push([r, c]);
      placed++;
    }
  }
}

function calculateNumbers() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let [dr, dc] of directions) {
        const nr = r + dr, nc = c + dc;
        if (isValid(nr, nc) && board[nr][nc].mine) count++;
      }
      board[r][c].number = count;
    }
  }
}

const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
];

function revealCell(r, c) {
  if (!isValid(r, c) || board[r][c].revealed || board[r][c].flagged || gameOver) return;
  const cell = board[r][c];
  cell.revealed = true;
  cell.element.classList.add('revealed');
  if (cell.mine) {
    cell.element.classList.add('mine');
    endGame(false);
    return;
  }

  if (cell.number > 0) {
    cell.element.textContent = cell.number;
  } else {
    for (let [dr, dc] of directions) revealCell(r + dr, c + dc);
  }

  checkWin();
}

function toggleFlag(r, c) {
  if (gameOver || board[r][c].revealed) return;
  const cell = board[r][c];
  cell.flagged = !cell.flagged;
  cell.element.classList.toggle('flagged');
  cell.element.textContent = cell.flagged ? '🚩' : '';
}

function endGame(won) {
  gameOver = true;
  mineLocations.forEach(([r, c]) => {
    const cell = board[r][c];
    if (!cell.revealed) {
      cell.element.classList.add('mine');
      cell.element.textContent = '💣';
    }
  });
  statusEl.textContent = won ? '🎉 You win!' : '💥 Game over!';
}

function checkWin() {
  let revealedCount = 0;
  board.flat().forEach(cell => {
    if (cell.revealed) revealedCount++;
  });
  if (revealedCount === rows * cols - mineCount) endGame(true);
}

function isValid(r, c) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

// Start with easy mode
setDifficulty('easy');
