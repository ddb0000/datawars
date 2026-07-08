// Command interpreter for Datawars.
// Parses user input from the console and triggers actions in the
// underlying modules. Commands allow navigation between screens,
// consuming items, selecting missions and resetting the game.

import { state, resetState } from '../core/state.js';
import * as missions from '../features/missions.js';
import * as inventory from '../features/inventory.js';
import * as shop from '../features/shop.js';
import { clearSave } from '../core/save.js';
import { logToConsole, showScreen, updateHUD, renderRunningTasks } from '../ui/gameplay.js';

/**
 * Interpret a command entered in the console. Unrecognised commands
 * produce an error message. Commands are case‑insensitive.
 *
 * @param {string} input - Raw user input.
 */
export function processCommand(input) {
  logToConsole(`> ${input}`);
  const parts = input.trim().split(' ');
  if (parts.length === 0) return;
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  switch (command) {
    case 'help':
      logToConsole("Available commands: help, home (h), contracts (c), stats (s), inventory (i/inv), shop/upgrade (u), mission <index>, sell <item>, eat/use <item>, sudo reset-player, clear");
      break;
    case 'home':
    case 'h':
      showScreen('home');
      logToConsole('Navigated to home screen.');
      break;
    case 'contracts':
    case 'c':
      showScreen('contracts');
      logToConsole('Showing available contracts.');
      break;
    case 'stats':
    case 's':
      showScreen('stats');
      logToConsole('Displaying player stats.');
      break;
    case 'inventory':
    case 'i':
    case 'inv':
      showScreen('inventory');
      logToConsole('Opening inventory.');
      break;
    case 'shop':
    case 'upgrade':
    case 'u':
      showScreen('upgrade');
      logToConsole('Opening upgrade shop.');
      break;
    case 'mission':
      if (args.length > 0) {
        const missionIndex = parseInt(args[0], 10);
        const contractsScreen = document.getElementById('contracts');
        if (contractsScreen && contractsScreen.classList.contains('active') && !isNaN(missionIndex) && missionIndex >= 0 && missionIndex < state.missions.length) {
          const selected = missions.selectMission(missionIndex);
          if (selected) {
            const prepName = document.getElementById('prep-mission-name');
            if (prepName) prepName.innerText = selected.name;
            missions.renderLoadout();
            const loadoutButtons = document.getElementById('loadout-list').querySelectorAll('button');
            loadoutButtons.forEach((btn) => {
              const toolName = btn.innerText.replace(/^>\s*/, '');
              btn.addEventListener('click', () => {
                missions.startTaskFromArsenal(selected, toolName);
                showScreen('home');
              });
            });
            showScreen('prep');
            logToConsole(`Selected mission ${missionIndex}: ${selected.name}`);
          }
        } else {
          logToConsole('Error: Cannot select mission now, or invalid index. Go to "contracts" first.');
        }
      } else {
        logToConsole('Usage: mission <index>');
      }
      break;
    case 'sell':
      if (args.length > 0) {
        const itemName = args.join(' ');
        const idx = state.player.inventory.findIndex((i) => i.toLowerCase() === itemName.toLowerCase());
        if (idx > -1) {
          const actualItem = state.player.inventory[idx];
          const sold = inventory.sellItem(actualItem);
          if (sold) {
            logToConsole(`Sold '${actualItem}' for $${inventory.getItemSellPrice(actualItem)}.`);
            updateHUD();
            inventory.renderInventory();
          } else {
            logToConsole(`Error: Could not sell '${actualItem}'.`);
          }
        } else {
          logToConsole(`Error: Item '${itemName}' not found in inventory.`);
        }
      } else {
        logToConsole('Usage: sell <item name>');
      }
      break;
    case 'eat':
    case 'use':
      if (args.length > 0) {
        const itemName = args.join(' ');
        const success = inventory.consumeItem(itemName);
        if (success) {
          logToConsole(`Consumed '${itemName}'. Energy and hunger restored.`);
          updateHUD();
          inventory.renderInventory();
        } else {
          logToConsole(`Cannot consume '${itemName}'. Either not found or not edible.`);
        }
      } else {
        logToConsole('Usage: eat <item name>');
      }
      break;
    case 'sudo':
      if (args.length > 0 && args[0] === 'reset-player') {
        resetState();
        clearSave();
        missions.generateMissionList();
        updateHUD();
        renderRunningTasks();
        const upgradeScreen = document.getElementById('upgrade');
        if (upgradeScreen && upgradeScreen.classList.contains('active')) {
          shop.renderShop();
        }
        const inventoryScreen = document.getElementById('inventory');
        if (inventoryScreen && inventoryScreen.classList.contains('active')) {
          inventory.renderInventory();
        }
        showScreen('home');
        logToConsole('System reset complete. Welcome back, mercenary.');
      } else {
        logToConsole('Usage: sudo reset-player');
      }
      break;
    case 'clear':
      {
        const consoleOutput = document.getElementById('console-output');
        if (consoleOutput) consoleOutput.innerHTML = '';
      }
      break;
    default:
      logToConsole(`Unknown command: ${command}`);
      break;
  }
}