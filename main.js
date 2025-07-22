const games = [
    { name: "Lava Escape", path: "games/Lava Escape/Simple-Game.html", image: "games/Lava Escape/thumbnail.png" },
    { name: "Bow Arrow", path: "games/BowArrow/arrow-game.html", image: "games/BowArrow/thumbnail.jpg" },
    { name: "Coloron", path: "games/coloron-game/dist/index.html", image: "games/coloron-game/thumbnail.png" },
    { name: "Platform Engine", path: "games/platform-game-engine/dist/index.html", image: "games/platform-game-engine/thumbnail.png" },
    { name: "Snakes", path: "games/Snakes/index.html", image: "games/Snakes/thumbnail.jpg" },
    { name: "Stick Hero", path: "games/StickHero/stick-hero/113/stick-hero.html", image: "games/StickHero/thumbnail.png" },
    { name: "Tic Tac Toe", path: "games/TicTacToe/index.html", image: "games/TicTacToe/favicon.ico" },
    { name: "Tower Blocks", path: "games/tower-blocks/dist/index.html", image: "games/tower-blocks/thumbnail.png" },
    { name: "Sudoku", path: "games/sudoku/index.html", image: "games/sudoku/thumbnail.png" },
    { name: "MineSweeper", path: "games/MineSweeper/index.html", image: "games/MineSweeper/thumbnail.png" },
    { name: "2048", path: "games/2048/index.html", image: "games/2048/thumbnail.png" },
    { name: "Hangman", path: "games/Hangman/index.html", image: "games/Hangman/thumbnail.png" },
    { name: "Memory Tiles", path: "games/memory tiles/index.html", image: "games/memory tiles/thumbnail.png" },
    { name: "Maze Runner", path: "games/maze runner/index.html", image: "games/maze runner/thumbnail.png" },
    { name: "Rock Paper Scissor", path: "games/Rock Paper Scissor/index.html", image: "games/Rock Paper Scissor/thumbnail.png" },
    { name: "Galactic Battleship", path: "games/Space Battle/index.html", image: "games/Space Battle/thumbnail.png" }
];


const gameGrid = document.getElementById("gameGrid");
const favoritesGrid = document.getElementById("favoritesGrid");
const showFavoritesBtn = document.getElementById("showFavoritesBtn");
const favoritesSection = document.getElementById("favoritesSection");
const searchInput = document.getElementById("searchInput");

function loadFavorites() {
    return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(favs) {
    localStorage.setItem("favorites", JSON.stringify(favs));
}

function createGameTile(game, isMoreGamesTile = false) {
    const tile = document.createElement("div");
    tile.className = "game-tile";

    if (isMoreGamesTile) {
        tile.classList.add("more-games-tile");
        tile.innerHTML = `
            <span class="message-icon">🎮</span>
            <p>More exciting games are coming soon!</p>
            <p>Stay tuned for updates.</p>
        `;
        // No click event for this tile
        return tile;
    }

    const isFavorite = loadFavorites().includes(game.name);

    // Using game.name.replace(/\s/g, '-') for IDs to handle spaces in names
    const tileId = `fav-${game.name.replace(/\s/g, '-')}`;

    tile.innerHTML = `
        <div class="game-click-area"> <img src="${game.image}" alt="${game.name}" />
            <h3>${game.name}</h3>
        </div>
        <input type="checkbox" id="${tileId}" ${isFavorite ? "checked" : ""}/>
        <label for="${tileId}" class="container">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="feather feather-heart">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
                        l-1.06-1.06a5.5 5.5 0 0 0-7.78
                        7.78l1.06 1.06L12 21.23l7.78-7.78
                        1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <div class="action">
                <span class="option-1">Add to Favorites</span>
                <span class="option-2">Added to Favorites</span>
            </div>
        </label>
    `;

    // Only the 'game-click-area' should launch the game
    const gameClickArea = tile.querySelector(".game-click-area");
    gameClickArea.onclick = () => {
        location.href = `${game.path}`;
    };

    const checkbox = tile.querySelector("input[type='checkbox']"); // Select specifically checkbox
    checkbox.onclick = (e) => {
        e.stopPropagation(); // Prevent the tile's click event from firing
        const favorites = loadFavorites();
        const index = favorites.indexOf(game.name);
        if (checkbox.checked) {
            if (index === -1) favorites.push(game.name);
        } else {
            if (index !== -1) favorites.splice(index, 1);
        }
        saveFavorites(favorites);
        // Re-render favorites section to reflect changes immediately
        renderFavorites();
        // If currently in favorites section and a game is unfavorited, re-render main games to update its favorite status
        if (!favoritesSection.classList.contains("hidden")) {
            renderGames(searchInput.value); // Re-render main grid if favorites are shown
        }
    };

    return tile;
}

function renderGames(filter = "") {
    gameGrid.innerHTML = "";
    const filteredGames = games.filter(game => game.name.toLowerCase().includes(filter.toLowerCase()));

    filteredGames.forEach(game => {
        gameGrid.appendChild(createGameTile(game));
    });

    // Add the "More games" tile only to the main game grid and if no filter is applied
    if (filter === "") {
        gameGrid.appendChild(createGameTile(null, true)); // Pass null for game object and true for isMoreGamesTile
    }
}

function renderFavorites() {
    favoritesGrid.innerHTML = "";
    const favs = loadFavorites();
    const favGames = games.filter(game => favs.includes(game.name));
    favGames.forEach(game => {
        favoritesGrid.appendChild(createGameTile(game));
    });

    // If no favorites, display a message
    if (favGames.length === 0) {
        const noFavsMessage = document.createElement("p");
        noFavsMessage.textContent = "You haven't added any games to favorites yet. Click the ❤️ icon on a game to add it!";
        noFavsMessage.style.textAlign = "center";
        noFavsMessage.style.marginTop = "20px";
        noFavsMessage.style.fontSize = "1.2rem";
        noFavsMessage.style.color = "#ccc";
        favoritesGrid.appendChild(noFavsMessage);
    }
}

searchInput.addEventListener("input", () => {
    // When searching, always show the main game grid and hide favorites
    favoritesSection.classList.add("hidden");
    gameGrid.classList.remove("hidden");
    showFavoritesBtn.textContent = "❤️ Favorites"; // Reset button text
    renderGames(searchInput.value);
});

showFavoritesBtn.addEventListener("click", () => {
    // Toggle visibility of both sections
    favoritesSection.classList.toggle("hidden");
    gameGrid.classList.toggle("hidden");

    // Update button text based on which section is visible
    if (favoritesSection.classList.contains("hidden")) {
        showFavoritesBtn.textContent = "❤️ Favorites"; // Favorites are hidden, so show "Favorites" button
        renderGames(searchInput.value); // Re-render games when switching back to all games
    } else {
        showFavoritesBtn.textContent = "🎮 All Games"; // Favorites are visible, so show "All Games" button
        renderFavorites(); // Re-render favorites when switching to favorites view
    }
});

// Initial render calls
renderGames();
renderFavorites();
