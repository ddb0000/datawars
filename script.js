const tools = [
    { name: 'Basic Scanner', boost: { stealth: 0.1 } },
    { name: 'Phishing Kit', boost: { stealth: 0.2 } },
    { name: 'Zero-Day Exploit', boost: { power: 0.3 } },
    { name: 'VPN Chain', boost: { stealth: 0.3 } },
    { name: 'Botnet Access', boost: { power: 0.4 } },
];

const actionCards = [
    { name: 'Scan Network', effect: { stealth: 0.1 }, description: 'Quickly scan for vulnerabilities, slightly increasing stealth this turn.' },
    { name: 'Phishing Attack', effect: { stealth: 0.2 }, description: 'Attempt a social engineering attack, moderately increasing stealth this turn.' },
    { name: 'Brute Force', effect: { power: 0.2 }, description: 'Attempt to crack the target system, moderately increasing power this turn.' },
    { name: 'Exploit Weakness', effect: { power: 0.3 }, description: 'Utilize a known exploit, significantly increasing power this turn.' },
    { name: 'Cloak Signal', effect: { stealth: 0.1, speed: 0.1 }, description: 'Obfuscate your connection, slightly increasing both stealth and speed.' },
    // Podemos adicionar mais cartas com efeitos diferentes (ataque, defesa, utilidade, etc.)
];

// --- MOVE THESE DECLARATIONS TO THE TOP ---
const companies = ['BiotechCorp', 'NeuralNet Inc.', 'QuantumSoft', 'Cyberdyne', 'OmniData', 'GhostWorks', 'ZeroPoint Labs'];
const missionTypes = ['Hack', 'Steal', 'Erase', 'Plant fake evidence on', 'Exfiltrate', 'Blackmail', 'Corrupt data of'];
const targets = ['prototype', 'research files', 'CEO emails', 'financial records', 'customer database', 'AI model', 'drone schematics'];
// --- END OF MOVED DECLARATIONS ---

let player = {
    money: 100,
    cred: 0,
    skills: { stealth: 1, speed: 1, power: 1 },
    heat: 0,
    arsenal: ['Basic Scanner'],
    deck: ['Scan Network', 'Scan Network', 'Brute Force'],
    inventory: [],
    gameDate: { day: 2, month: 5, year: 2032 } // Starting date
};

let missions = [];
let currentMission = null;
let gameTime = 9; // Hora inicial do jogo
let gameInterval;
let runningTasks = [];

function updateHUD() {
    document.getElementById('player-money-display').innerText = `Money: $${player.money}`;
    document.getElementById('player-cred-display').innerText = `Cred: ${player.cred}`;
    document.getElementById('player-heat-display').innerText = `Heat: ${player.heat}`;
    document.getElementById('current-time').innerText = `Time: ${gameTime}:00`;
    document.getElementById('current-date').innerText = `Date: ${player.gameDate.day}/${player.gameDate.month}/${player.gameDate.year}`; // Removed <span class="math-inline"> tags
}

function advanceTime() {
    gameTime += 3;
    if (gameTime >= 22) {
        gameTime = 9;
        showScreen('sleep'); // Show the sleep screen instead of alert
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
    currentMission = { ...missions[idx], originalIndex: idx, taskCount: 0 }; // Initialize taskCount
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
        }, 3000); // Adjust interval as needed
    }
}

function startTaskFromArsenal(mission, toolName) {
    if (!mission) return;

    const tool = tools.find(t => t.name === toolName);
    if (!tool) return;

    const taskDuration = 2;

    console.log("Starting task for mission original index:", mission.originalIndex, "tool:", toolName); // Log original index

    runningTasks.push({
        name: `Using ${toolName} on ${mission.name}`,
        missionId: mission.originalIndex, // Use the original index
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

    if (!gameInterval) {
        startGameLoop(); // Call startGameLoop when a task starts and the loop isn't running
    }
}

function passTurn() {
    console.log("--- Pass Turn ---"); // Added log for clarity
    runningTasks.forEach(task => {
        task.timeLeft--;
        console.log(`Task: ${task.name}, Time Left: ${task.timeLeft}`); // Log task time
    });
    updateTasks(); // Now update and potentially finish tasks
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
    const mission = missions[missionIndex]; // Directly access from missions array
    const tool = tools.find(t => t.name === task.toolName);

    console.log("--- finishArsenalTask called for:", task.name, "---"); // Added log
    console.log("Mission Index:", missionIndex); // Added log
    console.log("Mission:", mission); // Added log
    console.log("Tool:", tool); // Added log

    if (mission && tool) {
        applyToolEffectToMission(mission, tool.boost);
        displayGameMessage(`Task '${task.name}' finished.`); // Use in-game message

        // Decrement the task count for the current mission
        if (currentMission && currentMission.originalIndex === missionIndex) {
            currentMission.taskCount--;
            console.log("Current Mission Task Count Decremented:", currentMission.taskCount);
            if (currentMission.taskCount <= 0) {
                console.log("Task count reached 0, calling finishMission");
                finishMission(missionIndex); // Call finishMission with the index
            } else {
                console.log("Remaining tasks:", currentMission.taskCount);
            }
        }
    } else {
        console.error("Error: Mission or tool not found in finishArsenalTask"); // Added log
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
    // Find the mission in the missions array based on its original index
    const missionIndexInArray = missions.findIndex((m, index) => index === originalMissionIndex);
    const mission = missions[missionIndexInArray];

    if (missionIndexInArray === -1 || !mission) {
        console.error("Error: Mission not found with original index:", originalMissionIndex);
        return;
    }

    console.log("Finishing mission:", mission.name);
    console.log("Final difficulty RIGHT BEFORE CHECK:", mission.difficulty);
    console.log("Mission Reward:", mission.reward); // Log the reward object
    console.log("Player inventory BEFORE potential reward:", player.inventory); // Log inventory

    let message = '';
    if (mission.difficulty <= 0) {
        console.log("Mission successful!");
        console.log("Reward money:", mission.reward.money);
        console.log("Reward cred:", mission.reward.cred);
        console.log("Player money BEFORE reward:", player.money); // Log before
        console.log("Player cred BEFORE reward:", player.cred);   // Log before
        player.money += mission.reward.money;
        player.cred += mission.reward.cred;
        console.log("Player money AFTER reward:", player.money);  // Log after
        console.log("Player cred AFTER reward:", player.cred);    // Log after
        message = `SUCCESS! +$${mission.reward.money} / +${mission.reward.cred} cred`; // Removed <span class="math-inline"> tags
        if (mission.bonus) {
            console.log("Bonus item:", mission.bonus); // Log the bonus
            console.log("Player inventory BEFORE bonus:", player.inventory); // Log before
            player.inventory.push(mission.bonus);
            console.log("Player inventory AFTER bonus:", player.inventory);  // Log after
            message += ` / +${mission.bonus}`;
        }
    } else {
        player.heat += mission.heat;
        message = `FAILED! $0 / +${mission.heat} HEAT (Remaining Difficulty: ${mission.difficulty})`; // Removed <span class="math-inline"> tags
        if (player.heat >= 5) {
            message += ' / TOO HOT! GAME OVER.';
            setTimeout(() => location.reload(), 3000);
        }
    }

    displayGameMessage(message);
    missions.splice(missionIndexInArray, 1); // Now using the found index
    currentMission = null;
    showScreen('home');
    updateHUD();
}

function generateMission() {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const missionType = missionTypes[Math.floor(Math.random() * missionTypes.length)];
    const target = targets[Math.floor(Math.random() * targets.length)];
    const difficulty = 0; // Setting difficulty to 0 for immediate success
    const rewardMoney = 100; // Small guaranteed reward
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
            btn.innerText = `buy ${tool.name} [$${price}]`; // Removed <span class="math-inline"> tags
            btn.onclick = () => buyTool(tool, price);
            shop.appendChild(btn);
            shop.appendChild(document.createElement('br'));
        }
    });

    shop.innerHTML += '<h3>action cards:</h3>';
    actionCards.forEach(card => {
        const price = getCardPrice(card);
        const btn = document.createElement('button');
        btn.innerText = `buy ${card.name} [$${price}] - ${card.description}`; // Removed <span class="math-inline"> tags
        btn.onclick = () => buyCard(card, price);
        shop.appendChild(btn);
        shop.appendChild(document.createElement('br'));
    });

    shop.innerHTML += '<h3>skill upgrades:</h3>';
    ['stealth', 'speed', 'power'].forEach(skill => {
        const btn = document.createElement('button');
        const price = getSkillPrice(player.skills[skill]);
        btn.innerText = `upgrade ${skill} [$${price}]`; // Removed <span class="math-inline"> tags
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
        renderShop();
        alert(`>> upgraded ${skill} to level ${player.skills[skill]}`);
    } else {
        alert('>> not enough money');
    }
}

function getToolPrice(tool) {
    const base = 500;
    const bonus = (tool.boost.stealth || tool.boost.power || 0) * 1000;
    return base + bonus;
}

function buyTool(tool, price) {
    if (player.money >= price) {
        player.money -= price;
        player.arsenal.push(tool.name);
        renderShop();
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
        renderShop();
        alert(`>> purchased ${card.name}`);
    } else {
        alert('>> not enough money');
    }
}

function renderInventory() {
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '<h3>Inventory:</h3>';
    if (player.inventory.length === 0) {
        inventoryList.innerHTML += '<p>Empty</p>';
    } else {
        const ul = document.createElement('ul');
        player.inventory.forEach(item => {
            const li = document.createElement('li');
            li.innerText = item; // For now, just the item name
            const sellButton = document.createElement('button');
            sellButton.innerText = `Sell [${getItemSellPrice(item)}]`;
            sellButton.onclick = () => sellItem(item);
            li.appendChild(document.createTextNode(' ')); // Add space
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
    player.inventory = player.inventory.filter(i => i !== item);
    alert(`>> Sold '${item}' for $${price}.`);
    renderInventory();
    updateHUD();
}

function renderStats() {
    const statsDiv = document.getElementById('stats-display');
    statsDiv.innerHTML = `
        <h3>Player Stats:</h3>
        <p>Money: $${player.money}</p>
        <p>Cred: ${player.cred}</p>
        <p>Heat: ${player.heat}</p>
        <h3>Skills:</h3>
        <ul>
            <li>Stealth: ${player.skills.stealth}</li>
            <li>Speed: ${player.skills.speed}</li>
            <li>Power: ${player.skills.power}</li>
        </ul>
        <h3>Arsenal:</h3>
        <ul>
            ${player.arsenal.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <h3>Deck:</h3>
        <ul>
            ${player.deck.map(card => `<li>${card}</li>`).join('')}
        </ul>
    `;
}

function displayGameMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.innerText = `>> ${message}`; // Simple text format
    messageDiv.classList.add('game-notification'); // New class for styling
    const notificationArea = document.getElementById('game-notifications');
    notificationArea.appendChild(messageDiv);

    // Basic fade-out
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 1000);
    }, 3000);
}

if (!gameInterval) {
    // startGameLoop(); // COMMENT OUT THE INITIAL START
}