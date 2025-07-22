const gameContainer = document.getElementById('game');
const scoreDisplay = document.getElementById('score');
const backBtn = document.getElementById('backBtn');

let board, score;

const size = 4;

function init() {
  board = Array(size).fill().map(() => Array(size).fill(0));
  score = 0;
  addRandomTile();
  addRandomTile();
  render();
}

function addRandomTile() {
  const emptyCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) emptyCells.push({ r, c });
    }
  }
  if (emptyCells.length === 0) return;

  const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  gameContainer.innerHTML = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const tile = document.createElement('div');
      tile.classList.add('tile');
      const val = board[r][c];
      tile.textContent = val !== 0 ? val : '';
      tile.dataset.val = val;
      gameContainer.appendChild(tile);
    }
  }
  scoreDisplay.textContent = `Score: ${score}`;
}

function handleInput(direction) {
  let changed = false;

  const clone = board.map(row => row.slice());

  for (let i = 0; i < size; i++) {
    let row = direction === 'left' || direction === 'right'
      ? board[i].slice()
      : board.map(r => r[i]);

    if (direction === 'right' || direction === 'down') row.reverse();

    const compressed = row.filter(n => n !== 0);
    for (let j = 0; j < compressed.length - 1; j++) {
      if (compressed[j] === compressed[j + 1]) {
        compressed[j] *= 2;
        score += compressed[j];
        compressed[j + 1] = 0;
      }
    }
    const merged = compressed.filter(n => n !== 0);
    while (merged.length < size) merged.push(0);

    if (direction === 'right' || direction === 'down') merged.reverse();

    if (direction === 'left' || direction === 'right') {
      board[i] = merged;
    } else {
      for (let j = 0; j < size; j++) {
        board[j][i] = merged[j];
      }
    }
  }

  if (JSON.stringify(board) !== JSON.stringify(clone)) {
    addRandomTile();
    render();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') handleInput('left');
  if (e.key === 'ArrowRight') handleInput('right');
  if (e.key === 'ArrowUp') handleInput('up');
  if (e.key === 'ArrowDown') handleInput('down');
});

backBtn.addEventListener('click', () => {
  window.location.href = "../../index.html"; // adjust as needed
});

init();
