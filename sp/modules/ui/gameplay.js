// Gameplay UI logic for Datawars.
// This module wires up the DOM to the underlying game state and
// business logic. It updates the HUD, switches screens, handles
// shop, inventory and contract interactions, and responds to turns.

import { state } from '../core/state.js';
import * as missions from '../features/missions.js';
import * as shop from '../features/shop.js';
import * as inventory from '../features/inventory.js';
import * as stats from './stats.js';
import { tools, foods, missionMods } from '../core/data.js';
import { saveGame } from '../core/save.js';

/**
 * Update the heads‑up display (HUD) with the player's current state,
 * including money, cred, heat, energy, hunger, time and date.
 */
export function updateHUD() {
  const moneyEl = document.getElementById('player-money-display');
  const credEl = document.getElementById('player-cred-display');
  const heatEl = document.getElementById('player-heat-display');
  const energyEl = document.getElementById('player-energy-display');
  const hungerEl = document.getElementById('player-hunger-display');
  const timeEl = document.getElementById('current-time');
  const dateEl = document.getElementById('current-date');
  if (moneyEl) moneyEl.innerText = `money: $${state.player.money}`;
  if (credEl) credEl.innerText = `cred: ${state.player.cred}`;
  if (heatEl) heatEl.innerText = `heat: ${state.player.heat.toFixed(1)}`;
  if (energyEl) energyEl.innerText = `energy: ${state.player.energy}`;
  if (hungerEl) hungerEl.innerText = `hunger: ${state.player.hunger}`;
  if (timeEl) timeEl.innerText = `time: ${state.gameTime}:00`;
  if (dateEl) dateEl.innerText = `date: ${state.player.gameDate.day}/${state.player.gameDate.month}/${state.player.gameDate.year}`;
  const shopMoneyEl = document.getElementById('player-money');
  const upgradeScreen = document.getElementById('upgrade');
  if (shopMoneyEl && upgradeScreen && upgradeScreen.classList.contains('active')) {
    shopMoneyEl.innerText = `money: $${state.player.money}`;
  }
}

/**
 * Render running tasks into the #running-task-list element.
 */
export function renderRunningTasks() {
  const taskList = document.getElementById('running-task-list');
  if (!taskList) return;
  taskList.innerHTML = '';
  state.runningTasks.forEach((task) => {
    const li = document.createElement('li');
    li.innerText = `${task.name} (Time left: ${task.timeLeft})`;
    taskList.appendChild(li);
  });
}

/**
 * Log a message to the console output at the bottom of the home screen.
 *
 * @param {string} message - Text to append.
 */
export function logToConsole(message) {
  const consoleOutput = document.getElementById('console-output');
  if (!consoleOutput) return;
  const logEntry = document.createElement('div');
  logEntry.textContent = message;
  consoleOutput.appendChild(logEntry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

/**
 * Attach click handlers to contract buttons. Selecting a contract
 * populates the prep screen and allows the player to choose loadout
 * tools and mission mods.
 */
function attachContractEvents() {
  const contractList = document.getElementById('contract-list');
  if (!contractList) return;
  const buttons = contractList.querySelectorAll('button');
  buttons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const selected = missions.selectMission(idx);
      if (!selected) return;
      const prepName = document.getElementById('prep-mission-name');
      if (prepName) prepName.innerText = selected.name;
      missions.renderLoadout();
      attachLoadoutEvents(selected);
      renderMods();
      attachModEvents(selected);
      showScreen('prep');
    });
  });
}

/**
 * Attach click handlers to loadout buttons for selecting a tool to use.
 *
 * @param {object} mission - The mission being prepared.
 */
function attachLoadoutEvents(mission) {
  const loadoutList = document.getElementById('loadout-list');
  if (!loadoutList) return;
  const buttons = loadoutList.querySelectorAll('button');
  buttons.forEach((btn) => {
    const toolName = btn.innerText.replace(/^>\s*/, '');
    btn.addEventListener('click', () => {
      missions.startTaskFromArsenal(mission, toolName);
      showScreen('home');
    });
  });
}

/**
 * Render the player's available mission mods into #mod-list.
 */
function renderMods() {
  const modDiv = document.getElementById('mod-list');
  if (!modDiv) return;
  modDiv.innerHTML = '';
  state.player.deck.forEach((modName) => {
    const btn = document.createElement('button');
    btn.innerText = `> ${modName}`;
    modDiv.appendChild(btn);
    modDiv.appendChild(document.createElement('br'));
  });
}

/**
 * Attach click handlers to mission mod buttons. Applying a mod
 * immediately alters the selected mission and removes the mod from
 * the player's deck.
 *
 * @param {object} mission - The mission being modified.
 */
function attachModEvents(mission) {
  const modList = document.getElementById('mod-list');
  if (!modList) return;
  const buttons = modList.querySelectorAll('button');
  buttons.forEach((btn) => {
    const modName = btn.innerText.replace(/^>\s*/, '');
    btn.addEventListener('click', () => {
      const mod = missionMods.find((m) => m.name === modName);
      if (mod) {
        missions.applyModToMission(mission, mod);
        renderMods();
        attachModEvents(mission);
        updateHUD();
      }
    });
  });
}

/**
 * Attach event handlers to the shop using event delegation. Handles
 * purchasing tools, food, mods, skills and housing upgrades.
 */
function attachShopEvents() {
  const shopListElement = document.getElementById('shop-list');
  if (!shopListElement) return;
  const newShopList = shopListElement.cloneNode(true);
  shopListElement.parentNode.replaceChild(newShopList, shopListElement);
  newShopList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName !== 'BUTTON' || !target.dataset.action) return;
    const action = target.dataset.action;
    if (action === 'buyTool' && target.dataset.toolName) {
      const toolName = decodeURIComponent(target.dataset.toolName);
      const tool = tools.find((t) => t.name === toolName);
      if (tool) {
        const success = shop.purchaseTool(tool);
        if (!success) {
          alert('>> not enough money');
        }
        shop.renderShop();
        updateHUD();
      }
    } else if (action === 'buyFood' && target.dataset.foodName) {
      const foodName = decodeURIComponent(target.dataset.foodName);
      const food = foods.find((f) => f.name === foodName);
      if (food) {
        const success = shop.purchaseFood(food);
        if (!success) {
          alert('>> not enough money');
        }
        shop.renderShop();
        updateHUD();
      }
    } else if (action === 'buyMod' && target.dataset.modName) {
      const modName = decodeURIComponent(target.dataset.modName);
      const mod = missionMods.find((m) => m.name === modName);
      if (mod) {
        const success = shop.purchaseMod(mod);
        if (!success) {
          alert('>> not enough money');
        }
        shop.renderShop();
        updateHUD();
      }
    } else if (action === 'buyHousing' && target.dataset.housingKey) {
      const key = target.dataset.housingKey;
      const price = parseFloat(target.dataset.price);
      if (state.player.money >= price) {
        state.player.money -= price;
        if (key === 'pcLevel') {
          state.player.home.pcLevel += 1;
        } else if (key === 'houseLevel') {
          state.player.home.houseLevel += 1;
        } else if (key === 'pet') {
          state.player.home.pet = true;
        }
        saveGame();
        alert('>> purchase successful');
      } else {
        alert('>> not enough money');
      }
      shop.renderShop();
      updateHUD();
    } else if (action === 'upgradeSkill' && target.dataset.skillName) {
      const skill = target.dataset.skillName;
      const success = shop.upgradeSkill(skill);
      if (!success) {
        alert('>> not enough money');
      }
      shop.renderShop();
      updateHUD();
    }
  });
}

/**
 * Attach event handlers to the inventory list. Handles selling and
 * consuming items.
 */
function attachInventoryEvents() {
  const inventoryList = document.getElementById('inventory-list');
  if (!inventoryList) return;
  const newInv = inventoryList.cloneNode(true);
  inventoryList.parentNode.replaceChild(newInv, inventoryList);
  newInv.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName === 'BUTTON' && target.dataset.action === 'sellItem' && target.dataset.itemName) {
      const itemName = target.dataset.itemName;
      const success = inventory.sellItem(itemName);
      if (success) {
        logToConsole(`Sold '${itemName}' for $${inventory.getItemSellPrice(itemName)}.`);
        updateHUD();
        inventory.renderInventory();
        attachInventoryEvents();
      }
    } else if (target.tagName === 'BUTTON' && target.dataset.action === 'consumeItem' && target.dataset.itemName) {
      const itemName = target.dataset.itemName;
      const consumed = inventory.consumeItem(itemName);
      if (consumed) {
        logToConsole(`Consumed '${itemName}'. Energy and hunger restored.`);
        updateHUD();
        inventory.renderInventory();
        attachInventoryEvents();
      }
    }
  });
}

/**
 * Show a specific screen by id and update the UI accordingly.
 * Always updates the HUD and running task list. For certain screens
 * additional rendering is performed.
 *
 * @param {string} screen - Identifier of the screen to show.
 */
export function showScreen(screen) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(screen);
  if (target) target.classList.add('active');
  updateHUD();
  renderRunningTasks();
  if (screen === 'contracts') {
    missions.generateMissionList();
    missions.renderContracts();
    attachContractEvents();
  } else if (screen === 'upgrade') {
    shop.renderShop();
    updateHUD();
    attachShopEvents();
  } else if (screen === 'inventory') {
    inventory.renderInventory();
    attachInventoryEvents();
  } else if (screen === 'stats') {
    stats.renderStats();
  }
}

/**
 * Pass the current turn by delegating to the missions module, then
 * updating the HUD and running tasks. This is exposed on window
 * so that inline onclick attributes can call it.
 */
export function passTurn() {
  missions.passTurn();
  updateHUD();
  renderRunningTasks();
}