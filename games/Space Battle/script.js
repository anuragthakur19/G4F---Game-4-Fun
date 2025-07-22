document.addEventListener('DOMContentLoaded', () => {
    // --- Canvas Setup ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const GAME_WIDTH = canvas.width;
    const GAME_HEIGHT = canvas.height;

    // --- DOM Elements for UI ---
    const scoreDisplay = document.getElementById('score');
    const livesDisplay = document.getElementById('lives');
    const gameMessageOverlay = document.getElementById('game-message-overlay');
    const gameMessageText = document.getElementById('game-message-text');
    const startGameBtn = document.getElementById('start-game-btn');
    const restartButton = document.getElementById('restart-button');
    const backButton = document.getElementById('back-button');

    // --- Game Configuration & State Variables ---
    const PLAYER_SPEED = 7;
    const LASER_SPEED = 10;
    const ALIEN_SPEED_BASE = 1;
    const ALIEN_LASER_SPEED = 7;
    const LASER_COOLDOWN = 300; // ms
    const ALIEN_FIRE_CHANCE_PER_FRAME = 0.003;
    const OBSTACLE_SPAWN_START_SCORE = 500;
    const OBSTACLE_SPEED_BASE = 2; // Base speed for obstacles
    const OBSTACLE_SPAWN_INTERVAL_MS = 2500; // ms

    // Difficulty Scaling Constants (NEW)
    const BASE_ALIEN_SPAWN_INTERVAL = 1500; // Starting interval
    const DIFFICULTY_SCORE_THRESHOLD = 150; // Score points to increase difficulty
    const INTERVAL_DECREMENT = 100; // How much to decrease spawn interval per tier
    const MIN_SPAWN_INTERVAL = 400; // Fastest spawn interval

    let score = 0;
    let lives = 3;

    const player = { x: 0, y: 0, width: 40, height: 40, image: new Image() };
    const alienDefault = { width: 40, height: 25, image: new Image(), laserWidth: 5, laserHeight: 15 };
    const obstacleDefault = { width: 50, height: 50, image: new Image(), speed: OBSTACLE_SPEED_BASE };

    let lasers = []; // Player lasers
    let aliens = [];
    let alienLasers = [];
    let obstacles = [];

    let gameRunning = false;
    let gameReadyToStart = false;
    let lastShotTime = 0;

    let animationFrameId;
    let alienSpawnTimer;
    let obstacleSpawnTimer;
    let countdownTimer;

    let keysPressed = {};
    let currentAlienSpawnInterval = BASE_ALIEN_SPAWN_INTERVAL; // New: Track active spawn interval

    // --- Image Loading ---
    let imagesLoadedCount = 0;
    const totalImagesToLoad = 3;

    function onAllImagesLoaded() {
        console.log("All game images loaded!");
        player.x = GAME_WIDTH / 2 - player.width / 2;
        player.y = GAME_HEIGHT - player.height - 20;

        gameMessageText.textContent = "Press START to begin!";
        gameMessageOverlay.classList.remove('hidden');
        startGameBtn.classList.remove('hidden');
        startGameBtn.textContent = 'Start Game';
        gameMessageText.classList.remove('countdown');
    }

    function loadImage(imageObj, src) {
        imageObj.onload = () => {
            imagesLoadedCount++;
            console.log(`Loaded: ${src} (${imagesLoadedCount}/${totalImagesToLoad})`);
            if (imagesLoadedCount === totalImagesToLoad) {
                onAllImagesLoaded();
            }
        };
        imageObj.onerror = () => {
            console.error(`Failed to load image: ${src}. Drawing fallback shapes.`);
            imagesLoadedCount++;
            if (imagesLoadedCount === totalImagesToLoad) {
                onAllImagesLoaded();
            }
        };
        imageObj.src = src;
    }

    // --- Drawing Functions ---
    function drawPlayer() {
        if (player.image.complete && player.image.naturalWidth > 0) {
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = 'green';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }

    function drawLaser(laser) { // For player's laser (Green)
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--player-laser-color'); // Get color from CSS variable
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    }

    function drawAlienLaser(laser) { // For alien's laser (Red)
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--alien-laser-color'); // Get color from CSS variable
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    }

    function drawAlien(alien) {
        if (alienDefault.image.complete && alienDefault.image.naturalWidth > 0) {
            ctx.drawImage(alienDefault.image, alien.x, alien.y, alien.width, alien.height);
        } else {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(alien.x + alien.width / 2, alien.y + alien.height / 2, alien.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawObstacle(obstacle) {
        if (obstacleDefault.image.complete && obstacleDefault.image.naturalWidth > 0) {
            ctx.drawImage(obstacleDefault.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            ctx.fillStyle = 'grey'; // Fallback
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // --- Game Initialization / Reset ---
    function initGame() {
        console.log("--> initGame called. Resetting game state.");
        score = 0;
        lives = 3;
        
        player.x = GAME_WIDTH / 2 - player.width / 2;
        player.y = GAME_HEIGHT - player.height - 20;

        scoreDisplay.textContent = score;
        livesDisplay.textContent = lives;

        lasers = [];
        aliens = [];
        alienLasers = [];
        obstacles = [];
        document.querySelectorAll('.explosion').forEach(exp => exp.remove());
        
        clearInterval(alienSpawnTimer);
        clearInterval(obstacleSpawnTimer);
        clearTimeout(countdownTimer);
        cancelAnimationFrame(animationFrameId);

        gameRunning = false;
        gameReadyToStart = false;
        
        gameMessageOverlay.classList.remove('hidden'); 
        startGameBtn.classList.add('hidden');
        gameMessageText.classList.add('countdown');
        
        // Reset spawn interval to base on new game
        currentAlienSpawnInterval = BASE_ALIEN_SPAWN_INTERVAL; 

        startCountdown();
    }

    // --- Countdown Logic ---
    function startCountdown() {
        let count = 3;
        gameMessageText.textContent = count;
        console.log("Starting countdown:", count);

        countdownTimer = setInterval(() => {
            count--;
            if (count > 0) {
                gameMessageText.textContent = count;
                console.log("Countdown:", count);
            } else if (count === 0) {
                gameMessageText.textContent = "GO!";
                console.log("Countdown: GO!");
            } else {
                clearInterval(countdownTimer);
                
                gameMessageOverlay.classList.add('hidden');
                console.log("--- gameMessageOverlay should now be hidden! ---"); 
                
                gameMessageText.classList.remove('countdown');
                gameRunning = true;
                gameReadyToStart = true;
                animationFrameId = requestAnimationFrame(gameLoop);
                
                // Start dynamic spawn timers with current interval
                alienSpawnTimer = setInterval(spawnAlien, currentAlienSpawnInterval);
                obstacleSpawnTimer = setInterval(spawnObstacle, OBSTACLE_SPAWN_INTERVAL_MS);
                
                console.log("Countdown finished. Game started. gameRunning:", gameRunning, "gameReadyToStart:", gameReadyToStart);
            }
        }, 1000);
    }

    // --- Main Game Loop ---
    function gameLoop() {
        if (!gameRunning) return;

        clearCanvas();

        handlePlayerMovement();
        updateLasers();
        updateAliens();
        updateAlienLasers();
        updateObstacles();
        checkCollisions();

        drawPlayer();
        lasers.forEach(drawLaser);
        aliens.forEach(drawAlien);
        alienLasers.forEach(drawAlienLaser);
        obstacles.forEach(drawObstacle);

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Player Control ---
    function handlePlayerMovement() {
        if (keysPressed['ArrowLeft'] || keysPressed['a']) {
            player.x -= PLAYER_SPEED;
        }
        if (keysPressed['ArrowRight'] || keysPressed['d']) {
            player.x += PLAYER_SPEED;
        }

        if (player.x < 0) player.x = 0;
        if (player.x > GAME_WIDTH - player.width) player.x = GAME_WIDTH - player.width;
    }

    function shootLaser() {
        const now = Date.now();
        if (now - lastShotTime < LASER_COOLDOWN || !gameRunning || !gameReadyToStart) {
            return;
        }
        lastShotTime = now;

        const laserSpawnX = player.x + player.width / 2 - 2.5;
        const laserSpawnY = player.y;

        lasers.push({
            x: laserSpawnX,
            y: laserSpawnY,
            width: 5,
            height: 20,
            color: 'var(--player-laser-color)' // Set color here
        });
    }

    function updateLasers() {
        for (let i = lasers.length - 1; i >= 0; i--) {
            const laser = lasers[i];
            laser.y -= LASER_SPEED;

            if (laser.y < -laser.height) {
                lasers.splice(i, 1);
            }
        }
    }

    // --- Alien Management ---
    function spawnAlien() {
        if (!gameRunning || !gameReadyToStart) return;

        const alien = {
            x: Math.random() * (GAME_WIDTH - alienDefault.width),
            y: -alienDefault.height,
            width: alienDefault.width,
            height: alienDefault.height,
            color: 'var(--alien-color)',
            speed: ALIEN_SPEED_BASE + (score / 200) * 0.5,
            lastFireTime: Date.now()
        };
        aliens.push(alien);
    }

    function updateAliens() {
        // Dynamic difficulty: adjust spawn rate (NEW LOGIC)
        const difficultyLevel = Math.floor(score / DIFFICULTY_SCORE_THRESHOLD);
        const newSpawnInterval = Math.max(MIN_SPAWN_INTERVAL, BASE_ALIEN_SPAWN_INTERVAL - difficultyLevel * INTERVAL_DECREMENT);
        
        if (newSpawnInterval !== currentAlienSpawnInterval) {
            currentAlienSpawnInterval = newSpawnInterval;
            clearInterval(alienSpawnTimer);
            alienSpawnTimer = setInterval(spawnAlien, currentAlienSpawnInterval);
            console.log("New Alien Spawn Interval:", currentAlienSpawnInterval); // Debug log
        }

        for (let i = aliens.length - 1; i >= 0; i--) {
            const alien = aliens[i];
            alien.y += alien.speed;

            // Alien shooting logic
            if (gameRunning && gameReadyToStart && Math.random() < ALIEN_FIRE_CHANCE_PER_FRAME) {
                if (alien.y > 0 && alien.y < GAME_HEIGHT - player.height * 2) {
                    shootAlienLaser(alien);
                }
            }

            if (alien.y > GAME_HEIGHT) {
                aliens.splice(i, 1);
                // No penalty if alien slips through
            }
        }
    }

    function shootAlienLaser(alien) {
        alienLasers.push({
            x: alien.x + alien.width / 2 - alienDefault.laserWidth / 2,
            y: alien.y + alien.height,
            width: alienDefault.laserWidth,
            height: alienDefault.laserHeight,
            color: 'var(--alien-laser-color)' // Set color here
        });
    }

    function updateAlienLasers() {
        for (let i = alienLasers.length - 1; i >= 0; i--) {
            const laser = alienLasers[i];
            laser.y += ALIEN_LASER_SPEED;

            if (laser.y > GAME_HEIGHT) {
                alienLasers.splice(i, 1);
            }
        }
    }

    // --- Obstacle Management ---
    function spawnObstacle() {
        if (!gameRunning || !gameReadyToStart || score < OBSTACLE_SPAWN_START_SCORE) return;

        obstacles.push({
            x: Math.random() * (GAME_WIDTH - obstacleDefault.width),
            y: -obstacleDefault.height,
            width: obstacleDefault.width,
            height: obstacleDefault.height,
            color: 'var(--obstacle-color)',
            speed: OBSTACLE_SPEED_BASE // Obstacle speed
        });
    }

    function updateObstacles() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.y += obstacle.speed;

            if (obstacle.y > GAME_HEIGHT) {
                obstacles.splice(i, 1);
            }
        }
    }

    // --- Collision Detection ---
    function checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    function checkCollisions() {
        // Player Laser-Alien collisions
        for (let l = lasers.length - 1; l >= 0; l--) {
            const laser = lasers[l];
            for (let a = aliens.length - 1; a >= 0; a--) {
                const alien = aliens[a];

                if (checkCollision(laser, alien)) {
                    createExplosionDOM(alien.x + alien.width / 2, alien.y + alien.height / 2);
                    aliens.splice(a, 1);
                    lasers.splice(l, 1);
                    score += 10;
                    scoreDisplay.textContent = score;
                    break;
                }
            }
        }

        // Alien Laser-Player collisions
        for (let al = alienLasers.length - 1; al >= 0; al--) {
            const alienLaser = alienLasers[al];
            if (checkCollision(alienLaser, player)) {
                createExplosionDOM(player.x + player.width / 2, player.y + player.height / 2);
                alienLasers.splice(al, 1);
                loseLife();
            }
        }

        // Obstacle-Player collisions
        for (let o = obstacles.length - 1; o >= 0; o--) {
            const obstacle = obstacles[o];
            if (checkCollision(obstacle, player)) {
                createExplosionDOM(player.x + player.width / 2, player.y + player.height / 2);
                obstacles.splice(o, 1);
                loseLife();
            }
        }

        // Player Laser-Obstacle collisions
        for (let l = lasers.length - 1; l >= 0; l--) {
            const laser = lasers[l];
            for (let o = obstacles.length - 1; o >= 0; o--) {
                const obstacle = obstacles[o];
                if (checkCollision(laser, obstacle)) {
                    createExplosionDOM(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                    obstacles.splice(o, 1);
                    lasers.splice(l, 1);
                    score += 5;
                    scoreDisplay.textContent = score;
                    break;
                }
            }
        }

        // Alien-Player collisions (aliens hit player ship)
        for (let a = aliens.length - 1; a >= 0; a--) {
            const alien = aliens[a];
            if (checkCollision(player, alien)) {
                createExplosionDOM(player.x + player.width / 2, player.y + player.height / 2);
                aliens.splice(a, 1);
                loseLife();
            }
        }
    }

    // --- Explosion Management (DOM based for CSS animation) ---
    function createExplosionDOM(x, y) {
        const explosion = document.createElement('div');
        explosion.classList.add('explosion');
        explosion.style.left = `${x - 25}px`;
        explosion.style.top = `${y - 25}px`;
        canvas.parentNode.appendChild(explosion);

        explosion.addEventListener('animationend', () => {
            explosion.remove();
        });
    }

    // --- Game State Management ---
    function loseLife() {
        lives--;
        livesDisplay.textContent = lives;
        if (lives <= 0) {
            gameOver();
        }
    }

    function gameOver() {
        console.log("Game Over triggered.");
        gameRunning = false;
        gameReadyToStart = false;
        
        cancelAnimationFrame(animationFrameId);
        clearInterval(alienSpawnTimer);
        clearInterval(obstacleSpawnTimer);

        lasers = [];
        aliens = [];
        alienLasers = [];
        obstacles = [];
        document.querySelectorAll('.explosion').forEach(exp => exp.remove());

        gameMessageText.textContent = `Game Over! Your Score: ${score}`;
        startGameBtn.classList.remove('hidden');
        startGameBtn.textContent = 'Play Again';
        gameMessageOverlay.classList.remove('hidden');
        gameMessageText.classList.remove('countdown');
    }

    // --- Event Listeners ---
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        if (e.key === 'ArrowUp' && gameRunning && gameReadyToStart) {
            e.preventDefault();
            shootLaser();
        }
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    startGameBtn.addEventListener('click', () => {
        console.log("Start Game / Play Again button clicked.");
        initGame();
    });

    restartButton.addEventListener('click', () => {
        console.log("Restart button clicked.");
        initGame();
    });

    backButton.addEventListener('click', () => {
        console.log("Back button clicked.");
        if (gameRunning) {
            gameOver();
        }
        window.location.href = '../../index.html';
    });

    // --- Initial Load Logic ---
    loadImage(player.image, 'player_ship.png');
    loadImage(alienDefault.image, 'alien_ship.png');
    loadImage(obstacleDefault.image, 'obstacle.png');
});