document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameContainer = document.querySelector('.game-container'); // For managing active state class
    const playerScoreDisplay = document.getElementById('player-score');
    const computerScoreDisplay = document.getElementById('computer-score');
    const drawCounterDisplay = document.getElementById('draw-counter'); // New: Draw Counter Display
    const resultMessage = document.getElementById('result-message');
    const playerHandDisplay = document.getElementById('player-hand');
    const computerHandDisplay = document.getElementById('computer-hand');
    const choiceButtons = document.querySelectorAll('.choice-button'); // Rock, Paper, Scissors buttons
    const startGameBtn = document.getElementById('start-game-btn'); // Start Game button on overlay
    const restartGameBtn = document.getElementById('restart-game-btn'); // Restart button in top corner
    const backButton = document.getElementById('back-button');
    const gameStartOverlay = document.getElementById('game-start-overlay'); // The overlay div

    // --- Game State Variables ---
    let playerScore = 0;
    let computerScore = 0;
    let drawsCounter = 0; // New: Tracks number of draws
    let playerLastMove = null; // Stores player's move from previous round for AI
    let playerMoveHistory = []; // Stores recent player moves for pattern recognition (e.g., last 2 moves)
    const HISTORY_LENGTH = 2; // AI looks at last 2 moves for pattern

    let gameActive = false; // Flag to indicate if a game is currently in progress

    // --- Game Choices & Rules ---
    const choices = ['rock', 'paper', 'scissors'];
    const rules = {
        rock: { beats: 'scissors', emoji: '✊' },
        paper: { beats: 'rock', emoji: '✋' },
        scissors: { beats: 'paper', emoji: '✌️' }
    };

    /**
     * Generates the computer's choice based on an enhanced intermediate AI strategy.
     * Strategy: Tries to counter a repeated player move, then last move, otherwise random.
     * @returns {string} The computer's chosen move.
     */
    function getComputerChoice() {
        const randomChance = Math.random();
        const AI_STRATEGY_CHANCE = 0.7; // 70% chance AI uses a strategy

        if (randomChance < AI_STRATEGY_CHANCE) {
            // Strategy 1: Pattern Recognition (if player repeated last move)
            if (playerMoveHistory.length === HISTORY_LENGTH && playerMoveHistory[0] === playerMoveHistory[1]) {
                const repeatingMove = playerMoveHistory[0];
                for (const [key, value] of Object.entries(rules)) {
                    if (value.beats === repeatingMove) {
                        console.log(`AI Strategy: Countering repeated player move (${repeatingMove}) with ${key}`);
                        return key; // Return the move that beats the repeating move
                    }
                }
            }

            // Strategy 2: Counter Last Move (if no clear pattern or not enough history)
            if (playerLastMove) {
                for (const [key, value] of Object.entries(rules)) {
                    if (value.beats === playerLastMove) {
                        console.log(`AI Strategy: Countering player's last move (${playerLastMove}) with ${key}`);
                        return key; // Return the move that beats the player's last move
                    }
                }
            }
        }
        
        // Fallback: Random choice if no strategy applies or randomChance is too high
        const randomIndex = Math.floor(Math.random() * choices.length);
        console.log("AI Strategy: Random choice.");
        return choices[randomIndex];
    }

    /**
     * Determines the winner of a round.
     * @param {string} playerChoice - The player's chosen move.
     * @param {string} computerChoice - The computer's chosen move.
     * @returns {string} 'win', 'lose', or 'draw'.
     */
    function determineWinner(playerChoice, computerChoice) {
        if (playerChoice === computerChoice) {
            drawsCounter++; // Increment draw counter
            return 'draw';
        } else if (rules[playerChoice].beats === computerChoice) {
            playerScore++;
            return 'win';
        } else {
            computerScore++;
            return 'lose';
        }
    }

    /**
     * Updates the UI after each round, including hand animations and scores.
     * @param {string} playerChoice - The player's chosen move.
     * @param {string} computerChoice - The computer's chosen move.
     * @param {string} outcome - The round's outcome ('win', 'lose', or 'draw').
     */
    function updateUI(playerChoice, computerChoice, outcome) {
        // Apply choice classes to hands for emoji and pop animation
        playerHandDisplay.className = 'hand played ' + playerChoice;
        computerHandDisplay.className = 'hand played ' + computerChoice;

        // Update result message and color based on outcome
        resultMessage.classList.remove('win', 'lose', 'draw');
        if (outcome === 'win') {
            resultMessage.textContent = "You Win!";
            resultMessage.classList.add('win');
            resultMessage.style.color = 'var(--win-color)';
        } else if (outcome === 'lose') {
            resultMessage.textContent = "You Lose!";
            resultMessage.classList.add('lose');
            resultMessage.style.color = 'var(--lose-color)';
        } else { // outcome === 'draw'
            resultMessage.textContent = "It's a Draw!";
            resultMessage.classList.add('draw');
            resultMessage.style.color = 'var(--draw-color)';
        }

        // Update scores displayed on the scoreboard
        playerScoreDisplay.textContent = playerScore;
        computerScoreDisplay.textContent = computerScore;
        drawCounterDisplay.textContent = drawsCounter; // Update draw counter display

        // Reset hands for the next round after a short delay to allow animation to play
        setTimeout(() => {
            playerHandDisplay.className = 'hand'; // Reset to initial state (starts shaking again)
            computerHandDisplay.className = 'hand';
            resultMessage.textContent = "Choose your move!"; // Reset message
            resultMessage.style.color = 'var(--text-light)'; // Reset message color
            // Re-enable buttons after animation and reset
            choiceButtons.forEach(button => button.disabled = false);
        }, 1500); // 1.5 seconds delay before resetting
    }

    /**
     * Plays a single round of Rock, Paper, Scissors.
     * @param {string} playerChoice - The player's chosen move.
     */
    function playRound(playerChoice) {
        if (!gameActive) return; // Only allow playing if game is active

        // Disable buttons temporarily to prevent rapid clicks during animation
        choiceButtons.forEach(button => button.disabled = true);

        // Update player's move history
        playerMoveHistory.push(playerChoice);
        if (playerMoveHistory.length > HISTORY_LENGTH) {
            playerMoveHistory.shift(); // Remove oldest move if history is too long
        }

        const computerChoice = getComputerChoice(); // Computer makes its move
        const outcome = determineWinner(playerChoice, computerChoice); // Determine winner

        updateUI(playerChoice, computerChoice, outcome); // Update the visual UI
        playerLastMove = playerChoice; // Store current player move for next round's AI logic
    }

    /**
     * Initializes or restarts the game to its starting state.
     */
    function startGame() {
        gameActive = true; // Set game to active
        playerScore = 0; // Reset scores
        computerScore = 0;
        drawsCounter = 0; // Reset draws
        playerLastMove = null; // Clear AI memory
        playerMoveHistory = []; // Clear AI history

        // Update score displays immediately
        playerScoreDisplay.textContent = playerScore;
        computerScoreDisplay.textContent = computerScore;
        drawCounterDisplay.textContent = drawsCounter;

        // Reset hands and message
        playerHandDisplay.className = 'hand'; // Apply initial shaking
        computerHandDisplay.className = 'hand';
        resultMessage.textContent = "Choose your move!";
        resultMessage.style.color = 'var(--text-light)';

        // Hide the start game overlay and enable game elements
        gameStartOverlay.classList.add('hidden');
        gameContainer.classList.add('game-active'); // Add class to body for blur/dim removal (if desired)

        // Ensure choice buttons are enabled
        choiceButtons.forEach(button => button.disabled = false);
    }

    /**
     * Resets the game to initial state for restarting.
     */
    function resetGame() {
        // This effectively just calls startGame to reset everything.
        startGame();
    }

    // --- Event Listeners ---
    // Attach click listeners to all choice buttons
    choiceButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const playerChoice = event.currentTarget.dataset.choice;
            if (playerChoice && gameActive) { // Only play if game is active
                playRound(playerChoice);
            }
        });
    });

    // Start Game button on the overlay
    startGameBtn.addEventListener('click', startGame);

    // Restart Game button in the top corner
    restartGameBtn.addEventListener('click', resetGame);

    // Back button functionality
    backButton.addEventListener('click', () => {
        // In a real application, you'd navigate to home.html or similar
        window.location.href = '../../index.html'; // Example: Go back to a 'home' page
    });

    // --- Initial Setup on Page Load ---
    // Hide game elements and show the start overlay by default.
    gameActive = false; // Ensure game is not active initially
    gameStartOverlay.classList.remove('hidden'); // Ensure overlay is visible initially
    gameContainer.classList.remove('game-active'); // Ensure game content is dimmed/blurred initially
    choiceButtons.forEach(button => button.disabled = true); // Disable choice buttons until game starts

    // Initialize scores and display
    playerScoreDisplay.textContent = playerScore;
    computerScoreDisplay.textContent = computerScore;
    drawCounterDisplay.textContent = drawsCounter;
    playerHandDisplay.className = 'hand'; // Still want hands to shake on initial load
    computerHandDisplay.className = 'hand';
});