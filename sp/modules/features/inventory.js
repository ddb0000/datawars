// Inventory management for Datawars.
// Contains helpers for selling items, consuming food and rendering the
// inventory to the DOM. Food restores both energy and hunger.

import { state } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { foods } from '../core/data.js';
import { displayGameMessage } from '../ui/notifications.js';

/**
 * Determine the sell price for an item. Specific items have fixed
 * values; all unknown items default to 100.
 *
 * @param {string} item - Item name.
 * @returns {number} Sell value.
 */
export function getItemSellPrice(item) {
  if (item === 'Basic Data Packet') return 50;
  if (item === 'Encrypted Key') return 200;
  if (item === 'Advanced Toolkit') return 500;
  return 100;
}

/**
 * Check if an item is a food item by name.
 *
 * @param {string} item - Item name.
 * @returns {boolean} True if the item is defined in foods.
 */
function isFood(item) {
  return foods.some((f) => f.name === item);
}

/**
 * Consume a food item, restoring energy and hunger. Consumption will
 * increase both stats by the food's defined values, capped at 100.
 * Non‑food items cannot be consumed.
 *
 * @param {string} item - Item name to consume.
 * @returns {boolean} True if consumed.
 */
export function consumeItem(item) {
  const idx = state.player.inventory.findIndex((i) => i === item);
  if (idx > -1 && isFood(item)) {
    const food = foods.find((f) => f.name === item);
    state.player.energy = Math.min(100, state.player.energy + (food.energy || 0));
    state.player.hunger = Math.min(100, state.player.hunger + (food.hunger || 0));
    state.player.inventory.splice(idx, 1);
    saveGame();
    return true;
  }
  return false;
}

/**
 * Sell an item from the inventory. Money is added to the player's
 * balance and the item is removed.
 *
 * @param {string} item - Item to sell.
 * @returns {boolean} True if sold.
 */
export function sellItem(item) {
  const price = getItemSellPrice(item);
  const idx = state.player.inventory.findIndex((i) => i === item);
  if (idx > -1) {
    state.player.money += price;
    state.player.inventory.splice(idx, 1);
    saveGame();
    return true;
  }
  return false;
}

/**
 * Render the player's inventory into the #inventory-list element. Food
 * items show a consume button; other items show a sell button.
 */
export function renderInventory() {
  const container = document.getElementById('inventory-list');
  if (!container) return;
  container.innerHTML = '<h3>inventory:</h3>';
  if (state.player.inventory.length === 0) {
    container.innerHTML += '<p>empty</p>';
    return;
  }
  const ul = document.createElement('ul');
  state.player.inventory.forEach((item) => {
    const li = document.createElement('li');
    li.innerText = item;
    let btn;
    if (isFood(item)) {
      const food = foods.find((f) => f.name === item);
      btn = document.createElement('button');
      btn.innerText = `consume (+${food.energy} energy / +${food.hunger} hunger)`;
      btn.setAttribute('data-action', 'consumeItem');
      btn.setAttribute('data-item-name', item);
    } else {
      btn = document.createElement('button');
      btn.innerText = `sell [$${getItemSellPrice(item)}]`;
      btn.setAttribute('data-action', 'sellItem');
      btn.setAttribute('data-item-name', item);
    }
    li.appendChild(document.createTextNode(' '));
    li.appendChild(btn);
    ul.appendChild(li);
  });
  container.appendChild(ul);
}