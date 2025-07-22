const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 20;
const rows = canvas.height / tileSize;
const cols = canvas.width / tileSize;

let playerSnake, food, bigFood, points, foodEaten, gameLoopId;
let gameOver = false;
let isPaused = false;
let bigFoodTimer = 0;
let bigFoodDuration = 50; // ~15s
let bigFoodActive = false;

function resetGame() {
    playerSnake = {
        body: [{ x: 10, y: 10 }],
        dir: { x: 1, y: 0 },
        color: "#4ade80",
        lastDir: { x: 1, y: 0 }
    };
    points = 0;
    foodEaten = 0;
    food = spawnFood();
    bigFood = null;
    bigFoodActive = false;
    gameOver = false;
    isPaused = false;
    clearTimeout(gameLoopId);
    document.getElementById("gameOverPopup").classList.add("hidden");
    document.getElementById("bigFoodTimerBarWrapper").style.display = "none";
    document.getElementById("bigFoodTimerBar").style.width = "100%";
    document.getElementById("pauseBtn").textContent = "⏸ Pause";
    gameLoop();
}

function spawnFood() {
    return {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
    };
}

function drawSnake(snake) {
    snake.body.forEach((part, i) => {
        ctx.fillStyle = snake.color;
        ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
        if (i === 0) {
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.arc(part.x * tileSize + 5, part.y * tileSize + 5, 3, 0, Math.PI * 2);
            ctx.arc(part.x * tileSize + 15, part.y * tileSize + 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function moveSnake() {
    const head = { ...playerSnake.body[0] };
    head.x += playerSnake.dir.x;
    head.y += playerSnake.dir.y;

    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) return endGame();

    for (let i = 1; i < playerSnake.body.length; i++) {
        if (head.x === playerSnake.body[i].x && head.y === playerSnake.body[i].y) return endGame();
    }

    playerSnake.body.unshift(head);

    if (bigFoodActive && head.x === bigFood.x && head.y === bigFood.y) {
        points += 3;
        for (let i = 0; i < 3; i++) {
            playerSnake.body.push({ ...playerSnake.body[playerSnake.body.length - 1] });
        }
        bigFoodActive = false;
        document.getElementById("bigFoodTimerBarWrapper").style.display = "none";
    } else if (head.x === food.x && head.y === food.y) {
        points += 1;
        foodEaten++;
        food = spawnFood();
        if (foodEaten % 5 === 0) {
            bigFood = spawnFood();
            bigFoodActive = true;
            bigFoodTimer = bigFoodDuration;
            document.getElementById("bigFoodTimerBarWrapper").style.display = "block";
        }
    } else {
        playerSnake.body.pop();
    }

    if (bigFoodActive) {
        bigFoodTimer--;
        const percent = (bigFoodTimer / bigFoodDuration) * 50; 
        document.getElementById("bigFoodTimerBar").style.width = `${percent}%`;
        if (bigFoodTimer <= 0) {
            bigFoodActive = false;
            document.getElementById("bigFoodTimerBarWrapper").style.display = "none";
        }
    }

    playerSnake.lastDir = { ...playerSnake.dir };
}

function drawFood() {
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2, tileSize / 2, 0, Math.PI * 2);
    ctx.fill();

    if (bigFoodActive) {
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(bigFood.x * tileSize + tileSize / 2, bigFood.y * tileSize + tileSize / 2, tileSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

function update() {
    if (gameOver || isPaused) return;
    moveSnake();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    drawSnake(playerSnake);
    document.getElementById("scoreDisplay").textContent = `Score: ${points}`;
}

function gameLoop() {
    update();
    draw();
    gameLoopId = setTimeout(gameLoop, 150);
}

function endGame() {
    gameOver = true;
    document.getElementById("finalScore").innerText = `You scored ${points} points.`;
    document.getElementById("gameOverPopup").classList.remove("hidden");
    document.getElementById("bigFoodTimerBarWrapper").style.display = "none";
    document.getElementById("pauseBtn").textContent = "⏸ Pause";
}

function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    document.getElementById("pauseBtn").textContent = isPaused ? "▶ Resume" : "⏸ Pause";
}

// Event Listeners
document.getElementById("restartBtn").addEventListener("click", resetGame);
document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "../../index.html"; // Adjust path if needed
});
document.getElementById("popupRestartBtn").addEventListener("click", resetGame); // New: Restart from popup

window.addEventListener("keydown", (e) => {
    const last = playerSnake.lastDir;
    // Prevent immediate reverse direction, but allow changing direction (e.g., up then left)
    if (e.key === "ArrowUp" && last.y !== 1) playerSnake.dir = { x: 0, y: -1 };
    else if (e.key === "ArrowDown" && last.y !== -1) playerSnake.dir = { x: 0, y: 1 };
    else if (e.key === "ArrowLeft" && last.x !== 1) playerSnake.dir = { x: -1, y: 0 };
    else if (e.key === "ArrowRight" && last.x !== -1) playerSnake.dir = { x: 1, y: 0 };
    
    if (e.key.toLowerCase() === "p") togglePause();
});

resetGame();