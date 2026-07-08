// Mission and task logic for Datawars.
// This module is responsible for procedurally generating missions,
// managing the in‑game clock, processing tasks and applying mission
// modifiers. It also handles energy and hunger depletion and player
// exhaustion/pass‑out mechanics.

import { state } from '../core/state.js';
import { tools, companies, missionTypes, targets, missionMods, factions } from '../core/data.js';
import { displayGameMessage } from '../ui/notifications.js';
import { saveGame } from '../core/save.js';

// Constants controlling resource depletion.
const ENERGY_DRAIN_TASK = 5;      // Energy drained when starting a task
const ENERGY_DRAIN_TURN = 2;      // Energy drained each time the player passes a turn
const HUNGER_DRAIN_TIME = 4;      // Hunger drained each time the clock advances by 3 hours
const LOW_ENERGY_THRESHOLD = 20;  // Warn the player at this energy level
const LOW_HUNGER_THRESHOLD = 20;  // Warn the player at this hunger level
const PASS_OUT_RECOVERY = 50;     // Energy/hunger restored when passing out

/**
 * Generate a random mission using the configured pools. Difficulty scales
 * based on the player's credibility and a random factor. Rewards scale
 * with difficulty and the player's skills.
 *
 * @returns {object} A newly created mission.
 */
export function generateMission() {
  const company = companies[Math.floor(Math.random() * companies.length)];
  const missionType = missionTypes[Math.floor(Math.random() * missionTypes.length)];
  const target = targets[Math.floor(Math.random() * targets.length)];
  // Difficulty scales with player cred and random base (1–3)
  const baseDiff = Math.floor(Math.random() * 3) + 1;
  const credBonus = Math.floor(state.player.cred / 5);
  const difficulty = baseDiff + credBonus;
  // Rewards scale with difficulty and power skill
  const rewardMoney = 100 + difficulty * 150 + Math.floor(state.player.skills.power * 100);
  const rewardCred = Math.max(1, difficulty);
  const heatIncrease = Math.max(0, Math.floor(difficulty / 2));
  // Random bonus item
  const possibleBonuses = ['Basic Data Packet', 'Encrypted Key', 'Advanced Toolkit'];
  const possibleBonus = possibleBonuses[Math.floor(Math.random() * possibleBonuses.length)];
  // Pick a faction for flavour
  const faction = factions[Math.floor(Math.random() * factions.length)];
  return {
    name: `${missionType} ${target} from ${company} for ${faction.name}`,
    difficulty: difficulty,
    baseDifficulty: difficulty,
    reward: { money: rewardMoney, cred: rewardCred },
    heat: heatIncrease,
    bonus: possibleBonus,
    faction: faction.name
  };
}

/**
 * Populate the mission list with a number of new missions. Missions are
 * only regenerated if the list is empty unless forced. This prevents
 * overwriting the player's existing contracts when re‑opening the
 * contracts screen.
 *
 * @param {number} amount - Number of missions to generate.
 * @param {boolean} [force=false] - Whether to repopulate even if missions exist.
 */
export function generateMissionList(amount = 5, force = false) {
  if (!force && state.missions && state.missions.length > 0) return;
  state.missions.length = 0;
  for (let i = 0; i < amount; i++) {
    state.missions.push(generateMission());
  }
}

/**
 * Render the list of contracts into the #contract-list element. This
 * function does not attach click handlers; callers should attach
 * handlers after rendering.
 */
export function renderContracts() {
  const list = document.getElementById('contract-list');
  if (!list) return;
  list.innerHTML = '';
  state.missions.forEach((m) => {
    const btn = document.createElement('button');
    btn.innerText = `> ${m.name} [difficulty ${m.difficulty.toFixed(2)}]`;
    list.appendChild(btn);
    list.appendChild(document.createElement('br'));
  });
}

/**
 * Render the player's arsenal into the #loadout-list element. Does not
 * attach click handlers.
 */
export function renderLoadout() {
  const loadout = document.getElementById('loadout-list');
  if (!loadout) return;
  loadout.innerHTML = '';
  state.player.arsenal.forEach((toolName) => {
    const btn = document.createElement('button');
    btn.innerText = `> ${toolName}`;
    loadout.appendChild(btn);
    loadout.appendChild(document.createElement('br'));
  });
}

/**
 * Select a mission from the mission list by index. Returns a copy of
 * the mission with additional tracking fields for tasks.
 *
 * @param {number} idx - The mission index.
 * @returns {object|null} A copy of the selected mission or null.
 */
export function selectMission(idx) {
  if (idx < 0 || idx >= state.missions.length) return null;
  const mission = state.missions[idx];
  state.currentMission = { ...mission, originalIndex: idx, taskCount: 0 };
  return state.currentMission;
}

/**
 * Start the game loop if not already running. The loop processes
 * running tasks every few seconds.
 */
export function startGameLoop() {
  if (!state.gameInterval) {
    state.gameInterval = setInterval(() => {
      updateTasks();
    }, 3000);
  }
}

/**
 * Start a task using a tool from the player's arsenal. The task will
 * decrement mission difficulty based on the tool's boost. Energy is
 * drained when starting a task and hunger is unaffected (hunger
 * drains over time in advanceTime()). If the player lacks energy
 * the task is not started.
 *
 * @param {object} mission - The selected mission.
 * @param {string} toolName - The tool to use.
 */
export function startTaskFromArsenal(mission, toolName) {
  if (!mission) return;
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) return;
  // Check energy before starting a task
  if (state.player.energy < ENERGY_DRAIN_TASK) {
    displayGameMessage('Too exhausted to start a task. Eat or rest to restore energy.');
    return;
  }
  // Drain energy for task initiation
  state.player.energy = Math.max(0, state.player.energy - ENERGY_DRAIN_TASK);
  // Push new task with a default duration reduced by any mission mod
  const defaultDuration = 2;
  const reduction = mission.timeReduction || 0;
  const taskDuration = Math.max(1, defaultDuration - reduction);
  state.runningTasks.push({
    name: `Using ${toolName} on ${mission.name}`,
    missionId: mission.originalIndex,
    toolName: toolName,
    duration: taskDuration,
    timeLeft: taskDuration
  });
  if (state.currentMission && state.currentMission.originalIndex === mission.originalIndex) {
    state.currentMission.taskCount++;
  }
  advanceTime();
  if (!state.gameInterval) startGameLoop();
}

/**
 * Advance the in‑game clock by three hours. Wrap around at 24 and
 * advance the date as necessary. Deplete hunger on each advance and
 * perform exhaustion checks. This does not automatically put the
 * player to sleep at a specific time; instead, energy and hunger
 * determine when rest is required.
 */
export function advanceTime() {
  state.gameTime += 3;
  while (state.gameTime >= 24) {
    state.gameTime -= 24;
    advanceDate();
  }
  // Drain hunger on time advance
  state.player.hunger = Math.max(0, state.player.hunger - HUNGER_DRAIN_TIME);
  // Perform exhaustion checks after draining hunger
  checkEnergyAndHunger();
  // Persist time advance
  saveGame();
}

/**
 * Increment the in‑game date by one day. Months have 30 days and
 * years have 12 months for simplicity.
 */
export function advanceDate() {
  state.player.gameDate.day++;
  if (state.player.gameDate.day > 30) {
    state.player.gameDate.day = 1;
    state.player.gameDate.month++;
    if (state.player.gameDate.month > 12) {
      state.player.gameDate.month = 1;
      state.player.gameDate.year++;
    }
  }
}

/**
 * Process the passage of a single turn. Decrements task timers,
 * resolves completed tasks, advances time and drains energy. After
 * processing, the game state is saved.
 */
export function passTurn() {
  // Decrement time remaining on all running tasks
  state.runningTasks.forEach((task) => {
    task.timeLeft--;
  });
  updateTasks();
  // Drain general energy when passing a turn
  state.player.energy = Math.max(0, state.player.energy - ENERGY_DRAIN_TURN);
  advanceTime();
  saveGame();
}

/**
 * Iterate through running tasks and resolve any that have expired.
 * When no tasks remain, stop the game loop. Task completion
 * automatically applies tool effects and may finish the mission.
 */
export function updateTasks() {
  const tasksWereRunning = state.runningTasks.length > 0;
  for (let i = state.runningTasks.length - 1; i >= 0; i--) {
    const task = state.runningTasks[i];
    if (task.timeLeft <= 0) {
      finishArsenalTask(task);
      state.runningTasks.splice(i, 1);
    }
  }
  if (tasksWereRunning && state.runningTasks.length === 0 && state.gameInterval) {
    clearInterval(state.gameInterval);
    state.gameInterval = null;
  }
}

/**
 * Resolve a single running task. Applies the tool's boost to the
 * target mission and checks whether the mission should finish.
 *
 * @param {object} task - The task to resolve.
 */
export function finishArsenalTask(task) {
  const missionIndex = task.missionId;
  const mission = state.missions[missionIndex];
  const tool = tools.find((t) => t.name === task.toolName);
  if (mission && tool) {
    applyToolEffectToMission(mission, tool.boost);
    displayGameMessage(`Task '${task.name}' finished.`);
    if (state.currentMission && state.currentMission.originalIndex === missionIndex) {
      state.currentMission.taskCount--;
      if (state.currentMission.taskCount <= 0) {
        finishMission(missionIndex);
      }
    }
  }
}

/**
 * Apply the boost from a tool to a mission. Reduces mission
 * difficulty accordingly and displays progress. Difficulty is never
 * allowed to drop below zero.
 *
 * @param {object} mission - The mission being worked on.
 * @param {object} boost - An object with optional power/stealth keys.
 */
export function applyToolEffectToMission(mission, boost) {
  if (!boost || !mission) return;
  if (boost.power) {
    mission.difficulty -= boost.power;
  }
  if (boost.stealth) {
    mission.difficulty -= boost.stealth;
  }
  if (mission.difficulty < 0) mission.difficulty = 0;
  const progressPct = mission.baseDifficulty > 0 ? Math.round((mission.baseDifficulty - mission.difficulty) / mission.baseDifficulty * 100) : 0;
  displayGameMessage(`Mission progress: ${progressPct}%`);
}

/**
 * Apply a mission modifier to a mission. Mod effects are scaled by
 * the player's PC level. Once applied, the mod is removed from the
 * player's deck.
 *
 * @param {object} mission - The mission to modify.
 * @param {object} mod - The modifier definition.
 */
export function applyModToMission(mission, mod) {
  if (!mission || !mod) return;
  const pcBonus = 1 + (state.player.home.pcLevel - 1) * 0.1;
  if (mod.effect.difficultyReduction) {
    const reduction = mod.effect.difficultyReduction * pcBonus;
    mission.difficulty -= reduction;
    if (mission.difficulty < 0) mission.difficulty = 0;
  }
  if (mod.effect.rewardMultiplier) {
    const multiplier = mod.effect.rewardMultiplier * pcBonus;
    mission.reward.money = Math.floor(mission.reward.money * multiplier);
    mission.reward.cred = Math.floor(mission.reward.cred * multiplier);
  }
  if (mod.effect.timeReduction) {
    mission.timeReduction = Math.floor(mod.effect.timeReduction * pcBonus);
  }
  mission.modApplied = mod.name;
  const idx = state.player.deck.findIndex((card) => card === mod.name);
  if (idx > -1) {
    state.player.deck.splice(idx, 1);
  }
  displayGameMessage(`Applied mission mod: ${mod.name}.`);
  saveGame();
}

/**
 * Calculate the probability of a mission succeeding. Preparation and
 * player skills influence the chance. A minimum and maximum bound is
 * enforced to avoid guaranteed failures or successes when not at 0.
 *
 * @param {object} mission - The mission being evaluated.
 * @returns {number} Probability of success (0–1).
 */
function calculateSuccessChance(mission) {
  if (!mission || typeof mission.baseDifficulty !== 'number' || mission.baseDifficulty === 0) {
    return 0.0;
  }
  const progress = Math.max(0, Math.min(1, (mission.baseDifficulty - mission.difficulty) / mission.baseDifficulty));
  const skillFactor = (state.player.skills.power + state.player.skills.stealth) * 0.05;
  let chance = 0.2 + progress * 0.6 + skillFactor;
  return Math.max(0.05, Math.min(0.95, chance));
}

/**
 * Finish the mission at the given index and reward or penalise the player.
 * Calculates success chance if difficulty remains. Rewards include
 * money, cred and a possible bonus item; failures increase heat and
 * remove money. The mission is removed from the list afterwards.
 *
 * @param {number} originalMissionIndex - Index of mission in missions array.
 * @returns {boolean} True if mission succeeded.
 */
export function finishMission(originalMissionIndex) {
  const missionIndexInArray = state.missions.findIndex((_m, index) => index === originalMissionIndex);
  const mission = state.missions[missionIndexInArray];
  if (missionIndexInArray === -1 || !mission) {
    return false;
  }
  let success;
  if (mission.difficulty <= 0) {
    success = true;
  } else {
    const chance = calculateSuccessChance(mission);
    success = Math.random() < chance;
  }
  let message;
  if (success) {
    state.player.money += mission.reward.money;
    state.player.cred += mission.reward.cred;
    message = `SUCCESS! +$${mission.reward.money} / +${mission.reward.cred} cred`;
    if (mission.bonus) {
      state.player.inventory.push(mission.bonus);
      message += ` / +${mission.bonus}`;
    }
  } else {
    state.player.heat += mission.heat;
    const penalty = Math.min(state.player.money, Math.floor(mission.reward.money * 0.5));
    state.player.money -= penalty;
    message = `FAILED! -$${penalty} / +${mission.heat} HEAT (Remaining Difficulty: ${mission.difficulty.toFixed(2)})`;
    if (mission.difficulty / (mission.baseDifficulty || 1) > 0.5) {
      state.player.heat += 1;
      message += ' / Sloppy execution increased your heat!';
    }
    if (state.player.heat >= 10) {
      message += ' / TOO HOT! GAME OVER.';
    }
  }
  displayGameMessage(message);
  state.missions.splice(missionIndexInArray, 1);
  state.currentMission = null;
  saveGame();
  // Write result into loot screen if it exists
  const lootEl = document.getElementById('loot-result');
  if (lootEl) lootEl.innerText = message;
  if (typeof window.showScreen === 'function') {
    window.showScreen('loot');
  }
  return success;
}

/**
 * Check the player's energy and hunger levels. If either falls below
 * its low threshold, display a warning. If either reaches zero, the
 * player passes out: energy and hunger are partially restored, the
 * time resets to morning and a new day begins. This function is
 * invoked automatically by advanceTime() but can also be called
 * manually if needed.
 */
function checkEnergyAndHunger() {
  // Warnings
  if (state.player.energy > 0 && state.player.energy <= LOW_ENERGY_THRESHOLD) {
    displayGameMessage('You are exhausted! Consider resting or eating.');
  }
  if (state.player.hunger > 0 && state.player.hunger <= LOW_HUNGER_THRESHOLD) {
    displayGameMessage('You are starving! Eat something soon.');
  }
  // Pass out conditions
  if (state.player.energy <= 0 || state.player.hunger <= 0) {
    // Restore partial energy and hunger
    state.player.energy = PASS_OUT_RECOVERY;
    state.player.hunger = PASS_OUT_RECOVERY;
    // Reset clock to morning and advance the date
    state.gameTime = 9;
    advanceDate();
    displayGameMessage('You passed out from exhaustion or starvation. You wake up feeling rough.');
    saveGame();
  }
}