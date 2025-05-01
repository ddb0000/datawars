const tools = [
    { name: 'Basic Scanner', boost: { stealth: 0.1 } },
    { name: 'Phishing Kit', boost: { stealth: 0.2 } },
    { name: 'Zero-Day Exploit', boost: { power: 0.3 } },
    { name: 'VPN Chain', boost: { stealth: 0.3 } },
    { name: 'Botnet Access', boost: { power: 0.4 } },
    // add more tools with different boosts (stealth, power, etc.)
];

const actionCards = [
    { name: 'Scan Network', effect: { stealth: 0.1 }, description: 'Quickly scan for vulnerabilities, slightly increasing stealth this turn.' },
    { name: 'Phishing Attack', effect: { stealth: 0.2 }, description: 'Attempt a social engineering attack, moderately increasing stealth this turn.' },
    { name: 'Brute Force', effect: { power: 0.2 }, description: 'Attempt to crack the target system, moderately increasing power this turn.' },
    { name: 'Exploit Weakness', effect: { power: 0.3 }, description: 'Utilize a known exploit, significantly increasing power this turn.' },
    { name: 'Cloak Signal', effect: { stealth: 0.1, speed: 0.1 }, description: 'Obfuscate your connection, slightly increasing both stealth and speed.' },
    // add more cards with different effects (attack, defense, utility, etc.)
];

// Company names, mission types, and targets for mission generation
const companies = ['BiotechCorp', 'NeuralNet Inc.', 'QuantumSoft', 'Cyberdyne', 'OmniData', 'GhostWorks', 'ZeroPoint Labs'];
const missionTypes = ['Hack', 'Steal', 'Erase', 'Plant fake evidence on', 'Exfiltrate', 'Blackmail', 'Corrupt data of'];
const targets = ['prototype', 'research files', 'CEO emails', 'financial records', 'customer database', 'AI model', 'drone schematics'];

let player = {
    money: 100,
    cred: 0,
    skills: { stealth: 1, speed: 1, power: 1 },
    heat: 0,
    arsenal: ['Basic Scanner'],
    deck: ['Scan Network', 'Scan Network', 'Brute Force'],
    inventory: [],
    gameDate: { day: 2, month: 5, year: 2032 }
};

let missions = [];
let currentMission = null;
let gameTime = 9;
let gameInterval; 
let runningTasks = [];

function updateHUD() {
    document.getElementById('player-money-display').innerText = `money: $${player.money}`;
    document.getElementById('player-cred-display').innerText = `cred: ${player.cred}`;
    document.getElementById('player-heat-display').innerText = `heat: ${player.heat}`;
    document.getElementById('current-time').innerText = `time: ${gameTime}:00`;
    document.getElementById('current-date').innerText = `date: ${player.gameDate.day}/${player.gameDate.month}/${player.gameDate.year}`;
    const commandInput = document.getElementById('command-input');
    const consoleOutput = document.getElementById('console-output');

    // Also update money display in the shop screen if it's visible
    if (document.getElementById('upgrade').classList.contains('active')) {
         document.getElementById('player-money').innerText = `money: $${player.money}`;
    }
}
function logToConsole(message) {
    const logEntry = document.createElement('div');
    logEntry.textContent = message; // Use textContent to prevent HTML injection
    consoleOutput.appendChild(logEntry);
    // Scroll to the bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}
function advanceTime() {
    gameTime += 3;
    if (gameTime >= 22) {
        gameTime = 9;
        showScreen('sleep');
    }
}

function advanceDate() {
    player.gameDate.day++;
    // Basic month/year rollover (very simplified)
    if (player.gameDate.day > 30) {
        player.gameDate.day = 1;
        player.gameDate.month++;
        if (player.gameDate.month > 12) {
            player.gameDate.month = 1;
            player.gameDate.year++;
        }
    }
}

function renderRunningTasks() {
    const taskList = document.getElementById('running-task-list');
    taskList.innerHTML = '';
    runningTasks.forEach(task => {
        const listItem = document.createElement('li');
        listItem.innerText = `${task.name} (Time left: ${task.timeLeft})`;
        taskList.appendChild(listItem);
    });
}

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screen).classList.add('active');

    updateHUD();
    renderRunningTasks();

    if (screen === 'contracts') {
        generateMissionList();
        renderContracts();
    } else if (screen === 'upgrade') {
        renderShop();
    } else if (screen === 'inventory') {
        renderInventory();
    } else if (screen === 'stats') {
        renderStats();
    }
}

function renderContracts() {
    const list = document.getElementById('contract-list');
    list.innerHTML = '';
    missions.forEach((m, idx) => {
        const btn = document.createElement('button');
        btn.innerText = `> ${m.name} [difficulty ${m.difficulty}]`;
        btn.onclick = () => selectMission(idx);
        list.appendChild(btn);
        list.appendChild(document.createElement('br'));
    });
}

function renderLoadout() {
    const loadout = document.getElementById('loadout-list');
    loadout.innerHTML = '';
    player.arsenal.forEach(toolName => {
        const btn = document.createElement('button');
        btn.innerText = `> ${toolName}`;
        btn.onclick = () => startTaskFromArsenal(currentMission, toolName);
        loadout.appendChild(btn);
        loadout.appendChild(document.createElement('br'));
    });
}

function selectMission(idx) {
    currentMission = { ...missions[idx], originalIndex: idx, taskCount: 0 };
    document.getElementById('prep-mission-name').innerText = currentMission.name;
    renderLoadout();
    showScreen('prep');
}

function startGameLoop() {
    if (!gameInterval) {
        gameInterval = setInterval(() => {
            updateTasks();
            updateHUD();
            renderRunningTasks();
        }, 3000);
    }
}

function startTaskFromArsenal(mission, toolName) {
    if (!mission) return;

    const tool = tools.find(t => t.name === toolName);
    if (!tool) return;

    const taskDuration = 2;

    console.log("Starting task for mission original index:", mission.originalIndex, "tool:", toolName);

    runningTasks.push({
        name: `Using ${toolName} on ${mission.name}`,
        missionId: mission.originalIndex,
        toolName: toolName,
        duration: taskDuration,
        timeLeft: taskDuration
    });

    // Increment the task count for the current mission
    if (currentMission && currentMission.originalIndex === mission.originalIndex) {
        currentMission.taskCount++;
        console.log("Current Mission Task Count:", currentMission.taskCount);
    }

    showScreen('home');
    advanceTime(); // Advance time when a task starts

    // Call startGameLoop when a task starts and the loop isn't running
    if (!gameInterval) {
        startGameLoop();
    }
}

function passTurn() {
    console.log("--- Pass Turn ---");
    runningTasks.forEach(task => {
        task.timeLeft--;
        console.log(`Task: ${task.name}, Time Left: ${task.timeLeft}`);
    });
    updateTasks();
    advanceTime();
    updateHUD();
    renderRunningTasks();
}

function updateTasks() {
    console.log("--- updateTasks called ---");
    console.log("Current runningTasks:", runningTasks);

    // Iterate backwards to safely remove elements
    for (let i = runningTasks.length - 1; i >= 0; i--) {
        const task = runningTasks[i];
        console.log(`Checking task at index ${i}: ${task.name}, timeLeft: ${task.timeLeft}`);
        if (task.timeLeft <= 0) {
            console.log(`Task at index ${i} is finished.`);
            finishArsenalTask(task);
            console.log("Before splice, runningTasks length:", runningTasks.length);
            runningTasks.splice(i, 1);
            console.log("After splice, runningTasks length:", runningTasks.length);
            console.log("runningTasks after splice:", runningTasks);
        }
    }
    console.log("--- updateTasks finished ---");
}

function finishArsenalTask(task) {
    const missionIndex = task.missionId;
    const mission = missions[missionIndex]; 
    const tool = tools.find(t => t.name === task.toolName);

    console.log("--- finishArsenalTask called for:", task.name, "---");
    console.log("Mission Index:", missionIndex);
    console.log("Mission:", mission);
    console.log("Tool:", tool);

    if (mission && tool) {
        applyToolEffectToMission(mission, tool.boost);
        displayGameMessage(`Task '${task.name}' finished.`);

        // Decrement the task count for the current mission
        if (currentMission && currentMission.originalIndex === missionIndex) {
            currentMission.taskCount--;
            console.log("Current Mission Task Count Decremented:", currentMission.taskCount);
            if (currentMission.taskCount <= 0) {
                console.log("Task count reached 0, calling finishMission");
                finishMission(missionIndex); 
            } else {
                console.log("Remaining tasks:", currentMission.taskCount);
            }
        }
    } else {
        console.error("Error: Mission or tool not found in finishArsenalTask");
    }
}

function applyToolEffectToMission(mission, boost) {
    if (boost && mission) {
        console.log("Applying boost:", boost, "to mission:", mission.name, "with initial difficulty:", mission.difficulty);
        if (boost.power) {
            mission.difficulty -= boost.power;
            if (mission.difficulty < 0) mission.difficulty = 0;
            console.log("Power boost applied. New difficulty:", mission.difficulty);
        }
        if (boost.stealth) {
            mission.difficulty -= boost.stealth; // TEMPORARY: Stealth reduces difficulty
            if (mission.difficulty < 0) mission.difficulty = 0;
            console.log("Stealth boost applied. New difficulty:", mission.difficulty);
        }
        console.log("Difficulty after applying boost:", mission.difficulty);
    }
}


function finishMission(originalMissionIndex) {
    const missionIndexInArray = missions.findIndex((m, index) => index === originalMissionIndex);
    const mission = missions[missionIndexInArray];

    if (missionIndexInArray === -1 || !mission) {
        console.error("Error: Mission not found with original index:", originalMissionIndex);
        return;
    }

    console.log("Finishing mission:", mission.name);
    console.log("Final difficulty RIGHT BEFORE CHECK:", mission.difficulty);
    console.log("Mission Reward:", mission.reward);
    console.log("Player inventory BEFORE potential reward:", player.inventory);

    let message = '';
    if (mission.difficulty <= 0) {
        console.log("Mission successful!");
        console.log("Reward money:", mission.reward.money);
        console.log("Reward cred:", mission.reward.cred);
        console.log("Player money BEFORE reward:", player.money);
        console.log("Player cred BEFORE reward:", player.cred);
        player.money += mission.reward.money;
        player.cred += mission.reward.cred;
        console.log("Player money AFTER reward:", player.money);
        console.log("Player cred AFTER reward:", player.cred);
        message = `SUCCESS! +$${mission.reward.money} / +${mission.reward.cred} cred`;
        if (mission.bonus) {
            console.log("Bonus item:", mission.bonus);
            console.log("Player inventory BEFORE bonus:", player.inventory);
            player.inventory.push(mission.bonus);
            console.log("Player inventory AFTER bonus:", player.inventory);
            message += ` / +${mission.bonus}`;
        }
    } else {
        player.heat += mission.heat;
        message = `FAILED! $0 / +${mission.heat} HEAT (Remaining Difficulty: ${mission.difficulty})`;
        if (player.heat >= 5) {
            message += ' / TOO HOT! GAME OVER.';
            setTimeout(() => location.reload(), 3000);
        }
    }

    displayGameMessage(message);
    missions.splice(missionIndexInArray, 1);
    currentMission = null;
    saveGame();
    showScreen('home');
    updateHUD();
}

function generateMission() {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const missionType = missionTypes[Math.floor(Math.random() * missionTypes.length)];
    const target = targets[Math.floor(Math.random() * targets.length)];
    const difficulty = 0;
    const rewardMoney = 100;
    const rewardCred = 1;
    const heatIncrease = 0;
    const possibleBonus = 'Test Data';

    return {
        name: `${missionType} ${target} from ${company}`,
        difficulty: difficulty,
        reward: { money: rewardMoney, cred: rewardCred },
        heat: heatIncrease,
        bonus: possibleBonus
    };
}
function generateMissionList(amount = 5) {
    missions.length = 0;
    for (let i = 0; i < amount; i++) {
        missions.push(generateMission());
    }
}

function renderShop() {
    const shop = document.getElementById('shop-list');
    shop.innerHTML = '<h3>tools:</h3>';
    tools.forEach(tool => {
        if (!player.arsenal.includes(tool.name)) {
            const btn = document.createElement('button');
            const price = getToolPrice(tool);
            btn.innerText = `buy ${tool.name} [$${price}]`;
            btn.onclick = () => buyTool(tool, price);
            shop.appendChild(btn);
            shop.appendChild(document.createElement('br'));
        }
    });

    shop.innerHTML += '<h3>action cards:</h3>';
    actionCards.forEach(card => {
        const price = getCardPrice(card);
        const btn = document.createElement('button');
        btn.innerText = `buy ${card.name} [$${price}] - ${card.description}`;
        btn.onclick = () => buyCard(card, price);
        shop.appendChild(btn);
        shop.appendChild(document.createElement('br'));
    });

    shop.innerHTML += '<h3>skill upgrades:</h3>';
    ['stealth', 'speed', 'power'].forEach(skill => {
        const btn = document.createElement('button');
        const price = getSkillPrice(player.skills[skill]);
        btn.innerText = `upgrade ${skill} [$${price}]`;
        btn.onclick = () => upgradeSkill(skill, price);
        shop.appendChild(btn);
        shop.appendChild(document.createElement('br'));
    });

    document.getElementById('player-money').innerText = `money: $${player.money}`;
}

function getSkillPrice(level) {
    return (level + 1) * 500;
}

function upgradeSkill(skill, price) {
    if (player.money >= price) {
        player.money -= price;
        player.skills[skill] += 1;
        saveGame();
        renderShop();
        alert(`>> upgraded ${skill} to level ${player.skills[skill]}`);
    } else {
        alert('>> not enough money');
    }
}

function getToolPrice(tool) {
    const base = 500;
    const totalBoost = Object.values(tool.boost).reduce((sum, val) => sum + val, 0);
    const bonus = totalBoost * 1000;
    return base + bonus;
}

function buyTool(tool, price) {
    if (player.money >= price) {
        player.money -= price;
        player.arsenal.push(tool.name);
        saveGame();
        renderShop();
        updateHUD();
        alert(`>> purchased ${tool.name}`);
    } else {
        alert('>> not enough money');
    }
}

function getCardPrice(card) {
    const basePrice = 200;
    const effectBonus = (card.effect.stealth || 0) * 500 + (card.effect.power || 0) * 500 + (card.effect.speed || 0) * 300;
    return basePrice + effectBonus;
}


function buyCard(card, price) {
    if (player.money >= price) {
        player.money -= price;
        player.deck.push(card.name);
        saveGame();
        renderShop();
        updateHUD();
        alert(`>> purchased ${card.name}`);
    } else {
        alert('>> not enough money');
    }
}

function renderInventory() {
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '<h3>inventory:</h3>';
    if (player.inventory.length === 0) {
        inventoryList.innerHTML += '<p>empty</p>';
    } else {
        const ul = document.createElement('ul');
        player.inventory.forEach(item => {
            const li = document.createElement('li');
            li.innerText = item;
            const sellButton = document.createElement('button');
            sellButton.innerText = `sell [${getItemSellPrice(item)}]`;
            sellButton.onclick = () => sellItem(item);
            li.appendChild(document.createTextNode(' ')); 
            li.appendChild(sellButton);
            ul.appendChild(li);
        });
        inventoryList.appendChild(ul);
    }
}

function getItemSellPrice(item) {
    // Basic sell price logic
    if (item === 'Basic Data Packet') return 50;
    if (item === 'Encrypted Key') return 200;
    if (item === 'Advanced Toolkit') return 500;
    return 100; // Default sell price
}

function sellItem(item) {
    const price = getItemSellPrice(item);
    player.money += price;
    const itemIndex = player.inventory.findIndex(i => i === item);
    if (itemIndex > -1) {
        player.inventory.splice(itemIndex, 1);
    }
    saveGame();
    alert(`>> Sold '${item}' for $${price}.`);
    renderInventory();
    updateHUD();
}

function renderStats() {
    const statsDiv = document.getElementById('stats-display');
    statsDiv.innerHTML = `
        <h3>player stats:</h3>
        <p>money: $${player.money}</p>
        <p>cred: ${player.cred}</p>
        <p>heat: ${player.heat}</p>
        <h3>skills:</h3>
        <ul>
            <li>stealth: ${player.skills.stealth}</li>
            <li>speed: ${player.skills.speed}</li>
            <li>power: ${player.skills.power}</li>
        </ul>
        <h3>arsenal:</h3>
        <ul>
            ${player.arsenal.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <h3>deck:</h3>
        <ul>
            ${player.deck.map(card => `<li>${card}</li>`).join('')}
        </ul>
    `;
}

function displayGameMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.innerText = `>> ${message}`;
    messageDiv.classList.add('game-notification');
    const notificationArea = document.getElementById('game-notifications');
    notificationArea.appendChild(messageDiv);

    // Basic fade-out
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 1000);
    }, 3000);
}

// --- Save/Load Functions ---
function saveGame() {
    const gameData = {
        player: player,
        missions: missions,
        runningTasks: runningTasks,
        gameTime: gameTime,
        // Do NOT save gameInterval directly, it's a timer ID
        // Do NOT save currentMission directly, link it via missionId if needed,
        // but runningTasks already links to missionId, so it might be redundant.
        // Let's simplify and rely on runningTasks to imply current mission state.
        // If currentMission was just for display/prep, it doesn't need saving.
    };
    try {
        localStorage.setItem('datawarsSave', JSON.stringify(gameData));
        console.log('Game saved!');
    } catch (e) {
        console.error('Failed to save game:', e);
        displayGameMessage('Error: Failed to save game.');
    }
}


function loadGame() {
    try {
        const savedData = localStorage.getItem('datawarsSave');
        if (savedData) {
            const gameData = JSON.parse(savedData);

            // Load player data
            player = gameData.player;

            // Load missions
            missions = gameData.missions || []; // Handle case where missions wasn't saved

            // Load running tasks
            runningTasks = gameData.runningTasks || []; // Handle case where runningTasks wasn't saved

            // Load game time
            gameTime = gameData.gameTime !== undefined ? gameData.gameTime : 9; // Use default if not saved

            console.log('Game loaded!');
            // Re-start game loop if there are running tasks
            if (runningTasks.length > 0) {
                startGameLoop();
            }

            // Ensure HUD and initial screen are updated after loading
            updateHUD();
            renderRunningTasks();
            // The initial showScreen('home') call below will handle showing the main screen
        } else {
            console.log('No saved game found.');
            // Initialize a new game if no save exists
            generateMissionList(); // Generate missions for the first time
            updateHUD(); // Update HUD with initial player stats
        }
    } catch (e) {
        console.error('Failed to load game:', e);
        displayGameMessage('Error: Failed to load game. Starting new game.');
        // If loading fails, start a new game
        player = { // Reset player to initial state
            money: 100, cred: 0, skills: { stealth: 1, speed: 1, power: 1 }, heat: 0,
            arsenal: ['Basic Scanner'], deck: ['Scan Network', 'Scan Network', 'Brute Force'],
            inventory: [], gameDate: { day: 2, month: 5, year: 2032 }
        };
        missions = [];
        runningTasks = [];
        gameTime = 9;
        currentMission = null;
        if (gameInterval) {
             clearInterval(gameInterval);
             gameInterval = null;
        }
        generateMissionList();
        updateHUD();
        renderRunningTasks();
    }
}



// --- Initial Game Setup ---
// Load the game first
loadGame();

// Show the initial screen (this also calls updateHUD and renderRunningTasks)
showScreen('home');

// run the game loop  *immediately* on load even with no tasks
// uncomment the line below. Otherwise, it only starts when a task is initiated.
// startGameLoop();