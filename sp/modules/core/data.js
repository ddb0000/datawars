// Static definitions for Datawars.
// This module centralises all configurable lists used by the game.
// Tools, food items, mission modifiers, corporations and story arcs are
// declared here so that they can be easily extended without touching
// game logic.

// A list of available hacking tools and their associated stat boosts.
// Boost values reduce mission difficulty when a task completes. Each
// boost is keyed by the skill it affects.
export const tools = [
  { name: 'Basic Scanner', boost: { stealth: 0.1 } },
  { name: 'Phishing Kit', boost: { stealth: 0.2 } },
  { name: 'Zero‑Day Exploit', boost: { power: 0.3 } },
  { name: 'VPN Chain', boost: { stealth: 0.3 } },
  { name: 'Botnet Access', boost: { power: 0.4 } }
  // Add new tools here. Each must have a unique name and a boost object.
];

// Food items that restore energy and hunger when consumed. The `price`
// property defines the cost in the shop. Energy and hunger values
// determine how much of each stat is restored, up to their max of 100.
export const foods = [
  { name: 'Soylent Packet', energy: 15, hunger: 10, price: 100 },
  { name: 'Energy Drink', energy: 10, hunger: 0, price: 50 },
  { name: 'Synth Meal', energy: 25, hunger: 20, price: 200 },
  { name: 'Protein Bar', energy: 20, hunger: 15, price: 150 }
];

// Mission modifiers (formerly called action cards). Mods alter mission
// parameters when applied during the prep phase. They are consumed
// after use. Each mod defines an effect object with optional
// properties: `timeReduction` (reduces task durations),
// `rewardMultiplier` (multiplies money/cred rewards) and
// `difficultyReduction` (lowers mission difficulty immediately).
export const missionMods = [
  {
    name: 'Time Compression',
    effect: { timeReduction: 1 },
    description: 'Reduce mission task durations by one turn.'
  },
  {
    name: 'Profit Hack',
    effect: { rewardMultiplier: 1.5 },
    description: 'Increase mission rewards by 50%.'
  },
  {
    name: 'Overclock Rig',
    effect: { difficultyReduction: 1 },
    description: 'Lower mission difficulty by one.'
  }
  // Add new mission mods here.
];

// Pools used for procedurally generating mission descriptions.
export const companies = ['BiotechCorp', 'NeuralNet Inc.', 'QuantumSoft', 'Cyberdyne', 'OmniData', 'GhostWorks', 'ZeroPoint Labs'];
export const missionTypes = ['Hack', 'Steal', 'Erase', 'Plant fake evidence on', 'Exfiltrate', 'Blackmail', 'Corrupt data of'];
export const targets = ['prototype', 'research files', 'CEO emails', 'financial records', 'customer database', 'AI model', 'drone schematics'];

// A list of factions for narrative flavour. Each has a name and description.
export const factions = [
  { name: 'Cyber Alliance', description: 'A loose group of hacktivists seeking to expose corporate secrets.' },
  { name: 'Syndicate X', description: 'A shadowy organisation with unclear motives and deep pockets.' },
  { name: 'Data Brokers Union', description: 'Information merchants trading data for favours and profit.' }
];

// Potential story arcs for future expansion.
export const storyArcs = [
  {
    title: 'Rise of the AIs',
    description: 'A new generation of AI models are poised to upend the market; your actions will tip the balance.'
  },
  {
    title: 'The Shadow Net',
    description: 'Rumours of a hidden darknet with unimaginable secrets begin to surface; will you dive deep?'
  }
];