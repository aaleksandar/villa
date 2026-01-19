const FRIENDLY_ADJECTIVES = [
  "Happy",
  "Merry",
  "Sunny",
  "Jolly",
  "Cozy",
  "Gentle",
  "Kind",
  "Calm",
  "Soft",
  "Warm",
  "Fuzzy",
  "Fluffy",
  "Bouncy",
  "Sparkly",
  "Snappy",
  "Friendly",
  "Lucky",
  "Bright",
  "Cheerful",
  "Sweet",
];

const FRIENDLY_CREATURES = [
  "Panda",
  "Bunny",
  "Otter",
  "Koala",
  "Penguin",
  "Seal",
  "Hedgehog",
  "Hamster",
  "Squirrel",
  "Sloth",
  "Sparrow",
  "Finch",
  "Duckling",
  "Robin",
  "Wren",
  "Cloud",
  "Star",
  "Moon",
  "Blossom",
  "Dewdrop",
];

export function generateRandomName(address: string): string {
  const seed = address.toLowerCase().slice(-8);

  const adjIndex = parseInt(seed.slice(0, 4), 16) % FRIENDLY_ADJECTIVES.length;
  const creatureIndex =
    parseInt(seed.slice(4, 8), 16) % FRIENDLY_CREATURES.length;

  return `${FRIENDLY_ADJECTIVES[adjIndex]}${FRIENDLY_CREATURES[creatureIndex]}`;
}

export function generateFriendlyNickname(address: string): string {
  return generateRandomName(address);
}

export function generateUniqueNickname(address: string): string {
  const baseName = generateRandomName(address);
  const suffix = parseInt(address.slice(-2), 16) % 100;

  if (suffix > 50) {
    return baseName;
  }
  return `${baseName}${suffix}`;
}
