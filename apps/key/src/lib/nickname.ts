const ADJECTIVES = [
  "cosmic",
  "mystic",
  "stellar",
  "neon",
  "golden",
  "swift",
  "bold",
  "zen",
  "wild",
  "chill",
  "lucid",
  "vivid",
  "radiant",
  "serene",
  "epic",
  "cyber",
  "lunar",
  "solar",
  "astral",
  "primal",
  "nimble",
  "sage",
  "keen",
  "deft",
  "bright",
  "quiet",
  "brave",
  "noble",
  "clear",
  "true",
] as const;

const NOUNS = [
  "fox",
  "owl",
  "wolf",
  "phoenix",
  "raven",
  "wave",
  "storm",
  "flame",
  "frost",
  "aurora",
  "pixel",
  "cipher",
  "spark",
  "echo",
  "drift",
  "hawk",
  "bear",
  "lynx",
  "crane",
  "tiger",
  "river",
  "peak",
  "grove",
  "stone",
  "wind",
  "comet",
  "nova",
  "pulse",
  "beam",
  "arc",
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateNickname(seed?: string): string {
  if (seed) {
    const hash = hashString(seed);
    const adjIndex = hash % ADJECTIVES.length;
    const nounIndex = (hash >> 8) % NOUNS.length;
    return `${capitalize(ADJECTIVES[adjIndex])}${capitalize(NOUNS[nounIndex])}`;
  }

  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${capitalize(adjective)}${capitalize(noun)}`;
}
