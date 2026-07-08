// Shop logic for Datawars.
// This module provides helper functions for calculating prices and
// purchasing items. It is decoupled from the UI so that the same
// logic can be reused in the command interpreter.

import { state } from '../core/state.js';
import { tools, missionMods, foods } from '../core/data.js';
import { saveGame } from '../core/save.js';

/**
 * Get the price of upgrading a skill to the next level. Skills scale
 * linearly with the current level.
 *
 * @param {number} level - Current level of the skill.
 * @returns {number} Price for the next upgrade.
 */
export function getSkillPrice(level) {
  return (level + 1) * 500;
}

/**
 * Upgrade a player skill if funds allow. Deducts the cost and
 * increments the skill.
 *
 * @param {string} skill - One of 'stealth', 'speed' or 'power'.
 * @returns {boolean} True on success, false on insufficient funds.
 */
export function upgradeSkill(skill) {
  const price = getSkillPrice(state.player.skills[skill]);
  if (state.player.money >= price) {
    state.player.money -= price;
    state.player.skills[skill] += 1;
    saveGame();
    return true;
  }
  return false;
}

/**
 * Determine the cost of purchasing a tool. Price increases slightly
 * with the number of tools owned to simulate scarcity.
 *
 * @param {object} tool - Tool definition.
 * @returns {number} Purchase price.
 */
export function getToolPrice(tool) {
  const base = 500;
  const totalBoost = Object.values(tool.boost).reduce((sum, val) => sum + val, 0);
  const bonus = totalBoost * 1000;
  const ownedCount = state.player.arsenal.length;
  const scalingFactor = 1 + ownedCount * 0.1;
  return Math.floor((base + bonus) * scalingFactor);
}

/**
 * Purchase a tool and add it to the player's arsenal.
 *
 * @param {object} tool - Tool definition.
 * @returns {boolean} True if purchased.
 */
export function purchaseTool(tool) {
  const price = getToolPrice(tool);
  if (state.player.money >= price) {
    state.player.money -= price;
    state.player.arsenal.push(tool.name);
    saveGame();
    return true;
  }
  return false;
}

/**
 * Determine the cost of a food item. Simply returns its defined price.
 *
 * @param {object} food - Food definition.
 * @returns {number} Price.
 */
export function getFoodPrice(food) {
  return food.price;
}

/**
 * Purchase a food item, placing it into the player's inventory.
 *
 * @param {object} food - Food definition.
 * @returns {boolean} True if purchased.
 */
export function purchaseFood(food) {
  const price = getFoodPrice(food);
  if (state.player.money >= price) {
    state.player.money -= price;
    state.player.inventory.push(food.name);
    saveGame();
    return true;
  }
  return false;
}

/**
 * Determine the price of a mission modifier. Effects are weighted
 * differently: reward multipliers are costly, time reductions moderate
 * and difficulty reductions relatively cheap. Prices scale with how
 * many mods the player already owns.
 *
 * @param {object} mod - Modifier definition.
 * @returns {number} Price.
 */
export function getModPrice(mod) {
  const basePrice = 300;
  const rewardMultiplier = mod.effect.rewardMultiplier || 0;
  const timeReduction = mod.effect.timeReduction || 0;
  const difficultyReduction = mod.effect.difficultyReduction || 0;
  const effectBonus = rewardMultiplier * 500 + timeReduction * 200 + difficultyReduction * 150;
  const scaling = 1 + state.player.deck.length * 0.05;
  return Math.floor((basePrice + effectBonus) * scaling);
}

/**
 * Purchase a mission modifier and add it to the player's deck.
 *
 * @param {object} mod - Modifier definition.
 * @returns {boolean} True if purchased.
 */
export function purchaseMod(mod) {
  const price = getModPrice(mod);
  if (state.player.money >= price) {
    state.player.money -= price;
    state.player.deck.push(mod.name);
    saveGame();
    return true;
  }
  return false;
}

/**
 * Render the shop to the DOM. Generates HTML for tools, food,
 * mission modifiers, skill upgrades and housing upgrades. Event
 * handlers should be attached separately by the gameplay module.
 */
export function renderShop() {
  const shopEl = document.getElementById('shop-list');
  if (!shopEl) return;
  let contentHtml = '';
  // Tools section
  contentHtml += '<h3>tools:</h3>';
  tools.forEach((tool) => {
    if (!state.player.arsenal.includes(tool.name)) {
      const price = getToolPrice(tool);
      contentHtml += `<button data-action="buyTool" data-tool-name="${encodeURIComponent(tool.name)}" data-price="${price}">buy ${tool.name} [$${price}]</button><br>`;
    }
  });
  // Food section
  contentHtml += '<h3>food:</h3>';
  foods.forEach((food) => {
    const price = getFoodPrice(food);
    contentHtml += `<button data-action="buyFood" data-food-name="${encodeURIComponent(food.name)}" data-price="${price}">buy ${food.name} [$${price}] - restores ${food.energy} energy / ${food.hunger} hunger</button><br>`;
  });
  // Mission modifier section
  contentHtml += '<h3>mission mods:</h3>';
  missionMods.forEach((mod) => {
    const price = getModPrice(mod);
    contentHtml += `<button data-action="buyMod" data-mod-name="${encodeURIComponent(mod.name)}" data-price="${price}">buy ${mod.name} [$${price}] - ${mod.description}</button><br>`;
  });
  // Skill upgrades
  contentHtml += '<h3>skill upgrades:</h3>';
  ['stealth', 'speed', 'power'].forEach((skill) => {
    const price = getSkillPrice(state.player.skills[skill]);
    contentHtml += `<button data-action="upgradeSkill" data-skill-name="${skill}" data-price="${price}">upgrade ${skill} [$${price}]</button><br>`;
  });
  // Housing upgrades
  contentHtml += '<h3>housing:</h3>';
  const housingItems = [
    { name: 'PC Upgrade', key: 'pcLevel', basePrice: 1000, description: 'Improve your rig, increasing mission mod effectiveness.' },
    { name: 'Room Upgrade', key: 'houseLevel', basePrice: 2000, description: 'Upgrade your living space, increasing sleep recovery.' },
    { name: 'Pet', key: 'pet', basePrice: 500, description: 'Adopt a small AI companion. Cosmetic only.' }
  ];
  housingItems.forEach((item) => {
    if (item.key === 'pet') {
      if (!state.player.home.pet) {
        contentHtml += `<button data-action="buyHousing" data-housing-key="${item.key}" data-price="${item.basePrice}">buy ${item.name} [$${item.basePrice}] - ${item.description}</button><br>`;
      }
    } else {
      const currentLevel = state.player.home[item.key];
      const price = item.basePrice * currentLevel;
      contentHtml += `<button data-action="buyHousing" data-housing-key="${item.key}" data-price="${price}">upgrade ${item.name} (level ${currentLevel}) [$${price}] - ${item.description}</button><br>`;
    }
  });
  shopEl.innerHTML = contentHtml;
}