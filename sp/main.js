// Entry point for Datawars.
// Loads saved game data, initialises missions, updates the HUD and
// attaches command and UI handlers when the DOM is ready.

import { loadGame } from './modules/core/save.js';
import { state } from './modules/core/state.js';
import { generateMissionList } from './modules/features/missions.js';
import { updateHUD, renderRunningTasks, showScreen, logToConsole, passTurn } from './modules/ui/gameplay.js';
import { processCommand } from './modules/cli/commands.js';

// Initialise when the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Restore saved state if available
  loadGame();
  // Generate missions if none exist
  if (!Array.isArray(state.missions) || state.missions.length === 0) {
    generateMissionList();
  }
  // Initial UI update
  updateHUD();
  renderRunningTasks();
  // Show home screen by default
  showScreen('home');
  // Console greeting
  logToConsole("Console initialized. Type 'help' for commands.");
  // Wire up command input
  const commandInput = document.getElementById('command-input');
  if (commandInput) {
    commandInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const text = commandInput.value;
        if (text.trim() !== '') {
          processCommand(text);
        }
        commandInput.value = '';
        event.preventDefault();
      }
    });
  }
  // Expose showScreen and passTurn globally for inline onclick attributes
  window.showScreen = showScreen;
  window.passTurn = passTurn;
});