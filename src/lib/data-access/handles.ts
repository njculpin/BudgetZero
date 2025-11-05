/**
 * Generate a unique handle from title
 */
export function generateHandle(): string {
  const verbs = [
    "forge",
    "summon",
    "build",
    "craft",
    "conquer",
    "explore",
    "spawn",
    "charge",
    "launch",
    "battle",
    "cast",
    "grind",
    "upgrade",
    "loot",
    "sprint",
    "respawn",
    "defend",
    "unlock",
    "discover",
    "slay",
    "train",
    "boost",
    "revive",
    "hunt",
    "dash",
    "dodge",
    "strike",
    "aim",
    "channel",
    "climb",
  ];

  const nouns = [
    "dragon",
    "portal",
    "realm",
    "hero",
    "mage",
    "rogue",
    "arena",
    "quest",
    "artifact",
    "citadel",
    "dungeon",
    "phoenix",
    "warrior",
    "blade",
    "monster",
    "spell",
    "crystal",
    "guild",
    "map",
    "lootbox",
    "boss",
    "minion",
    "tower",
    "beacon",
    "spirit",
    "scroll",
    "rune",
    "shadow",
    "kingdom",
    "knight",
  ];

  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  // Capitalize the noun for nicer formatting (optional)
  const projectName = `${verb}-${noun}`;

  return projectName;
}


