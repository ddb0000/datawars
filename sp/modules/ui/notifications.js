// Notification utilities for Datawars.
// Provides a simple way to display temporary messages to the player in the
// HUD. Messages fade out after a few seconds and are removed from the DOM.

/**
 * Display a message in the HUD notification area. The message will
 * automatically fade out and remove itself after a short delay. If
 * the notifications container is not found (for example during
 * initial load), the function silently fails.
 *
 * @param {string} message - The message to display.
 */
export function displayGameMessage(message) {
  const notificationArea = document.getElementById('game-notifications');
  if (!notificationArea) return;
  const messageDiv = document.createElement('div');
  messageDiv.innerText = `>> ${message}`;
  messageDiv.classList.add('game-notification');
  notificationArea.appendChild(messageDiv);
  // After 3 seconds fade out, then remove after another second
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => messageDiv.remove(), 1000);
  }, 3000);
}