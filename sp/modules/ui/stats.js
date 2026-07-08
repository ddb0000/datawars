// Stats screen for Datawars.
// Responsible for rendering the player's statistics to the stats display.

import { state } from '../core/state.js';

/**
 * Render the player's stats into the #stats-display element. Includes
 * money, cred, heat, energy, hunger, skills, arsenal, deck and home.
 */
export function renderStats() {
  const statsDiv = document.getElementById('stats-display');
  if (!statsDiv) return;
  const { player } = state;
  statsDiv.innerHTML = `
    <h3>player stats:</h3>
    <p>money: $${player.money}</p>
    <p>cred: ${player.cred}</p>
    <p>heat: ${player.heat.toFixed(1)}</p>
    <p>energy: ${player.energy}</p>
    <p>hunger: ${player.hunger}</p>
    <h3>skills:</h3>
    <ul>
      <li>stealth: ${player.skills.stealth}</li>
      <li>speed: ${player.skills.speed}</li>
      <li>power: ${player.skills.power}</li>
    </ul>
    <h3>arsenal:</h3>
    <ul>
      ${player.arsenal.map((item) => `<li>${item}</li>`).join('')}
    </ul>
    <h3>deck:</h3>
    <ul>
      ${player.deck.map((card) => `<li>${card}</li>`).join('')}
    </ul>
    <h3>home:</h3>
    <p>PC level: ${player.home.pcLevel}</p>
    <p>House level: ${player.home.houseLevel}</p>
    <p>Pet: ${player.home.pet ? 'yes' : 'no'}</p>
  `;
}