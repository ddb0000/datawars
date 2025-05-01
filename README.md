# datawars
datawars revolves around completing contracts, upgrading your arsenal, managing resources, and progressing through a cyberpunk world. 

## roadmap: 
more contracts > more items (buyable and acquirable) > more stats/effects to tools etc > defense system(firewall, kinda tower defense) >story/intro 0.1 > home (customization, mby better pc etc) > onwards 



## index.html and script.js

*   **HTML Structure:** Defines the basic layout using elements like `<div>`, `<button>`, `<p>`, and headings.
*   **CSS Styling:** Contains embedded CSS within the `<style>` tags to style the game's appearance (colors, fonts, layout).
*   **Screen Management:** Uses `<div>` elements with the class "screen" to represent different game screens (home, contracts, upgrade, etc.). JavaScript controls which screen is visible by toggling the "active" class.
*   **Buttons and Event Handlers:** Includes `<button>` elements that trigger JavaScript functions when clicked, enabling user interaction.
*   **HUD (Heads-Up Display):** Displays real-time game information like money, cred, heat, date, and time.
*   **Game Notifications:** A dedicated area (`#game-notifications`) to display in-game messages and feedback to the player.

The `script.js` file contains the JavaScript logic that drives the game:

*   **Game State:** Defines variables to store the game's state, including player stats (money, cred, skills, inventory), missions, and running tasks.
*   **Functions:** Includes functions to:
    *   Update the HUD with current game information (`updateHUD`).
    *   Advance game time and date (`advanceTime`, `advanceDate`).
    *   Render different game screens (`showScreen`).
    *   Generate and manage missions (`generateMission`, `generateMissionList`, `renderContracts`, `selectMission`).
    *   Handle tasks and tool usage (`startTaskFromArsenal`, `updateTasks`, `finishArsenalTask`, `applyToolEffectToMission`).
    *   Manage the game loop (`startGameLoop`).
    *   Implement the shop system (`renderShop`, `buyTool`, `buyCard`, `upgradeSkill`).
    *   Manage the player's inventory (`renderInventory`, `sellItem`).
    *   Display player stats (`renderStats`).
    *   Display in-game messages (`displayGameMessage`).
*   **Game Logic:** Implements the core game mechanics, such as:
    *   Mission selection and task execution.
    *   Applying tool effects to missions.
    *   Calculating mission success and failure.
    *   Awarding rewards and applying penalties.
    *   Managing the game's economy and player progression.
*   **Event Handling:** Responds to user interactions (button clicks) to trigger game actions.
*   **Data Structures:** Uses arrays and objects to store game data, such as tools, action cards, companies, mission types, and targets.

