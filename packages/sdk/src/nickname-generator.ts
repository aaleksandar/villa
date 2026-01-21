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

const RESERVED_NICKNAMES = new Set([
  "admin",
  "villa",
  "system",
  "api",
  "www",
  "root",
  "mod",
  "moderator",
  "support",
  "help",
  "official",
  "staff",
  "team",
  "bot",
  "null",
]);

export const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-z][a-z0-9-]*[a-z0-9]$/,
  cooldownMs: 30 * 24 * 60 * 60 * 1000,
  maxChanges: 1,
} as const;

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function generateNickname(seed?: string): string {
  if (seed) {
    const hash = hashString(seed);
    const adjIndex = hash % ADJECTIVES.length;
    const nounIndex = (hash >> 8) % NOUNS.length;
    return `${ADJECTIVES[adjIndex]}-${NOUNS[nounIndex]}`;
  }

  const adjective = getRandomElement(ADJECTIVES);
  const noun = getRandomElement(NOUNS);
  return `${adjective}-${noun}`;
}

export function generateUniqueNickname(
  seed?: string,
  existingCheck?: (nickname: string) => boolean,
): string {
  let nickname = generateNickname(seed);
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    if (!existingCheck || !existingCheck(nickname)) {
      return nickname;
    }

    const suffix = Math.floor(Math.random() * 999) + 1;
    nickname = `${generateNickname()}-${suffix}`;
    attempts++;
  }

  const timestamp = Date.now().toString(36).slice(-4);
  return `${generateNickname()}-${timestamp}`;
}

export type NicknameValidationError =
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_FORMAT"
  | "RESERVED";

export interface NicknameValidationResult {
  valid: boolean;
  error?: NicknameValidationError;
  normalized?: string;
}

export function validateNickname(nickname: string): NicknameValidationResult {
  const normalized = nickname.toLowerCase().trim();

  if (normalized.length < NICKNAME_RULES.minLength) {
    return { valid: false, error: "TOO_SHORT" };
  }

  if (normalized.length > NICKNAME_RULES.maxLength) {
    return { valid: false, error: "TOO_LONG" };
  }

  if (!NICKNAME_RULES.pattern.test(normalized)) {
    return { valid: false, error: "INVALID_FORMAT" };
  }

  if (RESERVED_NICKNAMES.has(normalized)) {
    return { valid: false, error: "RESERVED" };
  }

  return { valid: true, normalized };
}

export function normalizeNickname(nickname: string): string {
  return nickname.toLowerCase().trim();
}

export function isReservedNickname(nickname: string): boolean {
  return RESERVED_NICKNAMES.has(normalizeNickname(nickname));
}

export function getAvailableAdjectives(): readonly string[] {
  return ADJECTIVES;
}

export function getAvailableNouns(): readonly string[] {
  return NOUNS;
}
