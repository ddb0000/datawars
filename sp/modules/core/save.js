// Local storage persistence for Datawars.
// This module handles saving and loading the game state to and from
// the browser's localStorage. Data is serialised as JSON. We save the
// player object, missions array, running tasks and current time.

import { state, INITIAL_PLAYER_STATE, resetState } from './state.js';

/**
 * Write the current game state to localStorage. If saving fails
 * (for example due to quota limits or private browsing), an error
 * is logged but the game continues.
 */
export function saveGame() {
  try {
    const data = {
      player: state.player,
      missions: state.missions,
      runningTasks: state.runningTasks,
      gameTime: state.gameTime
    };
    localStorage.setItem('datawarsSave', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

/**
 * Load previously saved game state from localStorage. If no save is
 * found or loading fails, the current state remains unchanged.
 */
export function loadGame() {
  try {
    const saved = localStorage.getItem('datawarsSave');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.player) state.player = data.player;
      if (Array.isArray(data.missions)) state.missions = data.missions;
      if (Array.isArray(data.runningTasks)) state.runningTasks = data.runningTasks;
      state.gameTime = data.gameTime !== undefined ? data.gameTime : 9;
    }
  } catch (e) {
    console.error('Failed to load game:', e);
    // Reset to a clean state if loading fails
    resetState();
  }
}

/**
 * Delete any saved game data. Use this when the player resets.
 */
export function clearSave() {
  try {
    localStorage.removeItem('datawarsSave');
  } catch (e) {
    console.error('Failed to clear saved game data:', e);
  }
}