const AVATAR_EMOJIS = [
  "😊",
  "😄",
  "🥰",
  "😎",
  "🤗",
  "😇",
  "🤠",
  "🥳",
  "🐱",
  "🐶",
  "🐼",
  "🦊",
  "🐨",
  "🐯",
  "🦁",
  "🐸",
  "🐰",
  "🐻",
  "🦄",
  "🐧",
  "🦋",
  "🐝",
  "🦉",
  "🐙",
  "🌻",
  "🌸",
  "🌈",
  "⭐",
  "🌙",
  "☀️",
  "🍀",
  "🌺",
  "🍎",
  "🍊",
  "🍋",
  "🍓",
  "🥑",
  "🍕",
  "🧁",
  "🍩",
  "🎨",
  "🎵",
  "🎮",
  "🏀",
  "⚽",
  "🎸",
  "🎪",
  "🚀",
] as const;

const PASTEL_COLORS = [
  "#FFE5E5",
  "#E5F0FF",
  "#E5FFE5",
  "#FFF5E5",
  "#F5E5FF",
  "#FFFFE5",
  "#E5FFFF",
  "#FFE5F5",
  "#F0F0F0",
  "#FFF0E5",
] as const;

function hashAddress(address: string): number {
  const normalized = address.toLowerCase();
  let hash = 0;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash);
}

export function getEmojiForAddress(address: string): string {
  if (!address || typeof address !== "string") {
    return "😊";
  }

  const hash = hashAddress(address);
  const index = hash % AVATAR_EMOJIS.length;

  return AVATAR_EMOJIS[index];
}

function getBackgroundColorForAddress(address: string): string {
  const hash = hashAddress(address);
  const colorIndex =
    Math.floor(hash / AVATAR_EMOJIS.length) % PASTEL_COLORS.length;
  return PASTEL_COLORS[colorIndex];
}

export function getEmojiAvatarUrl(address: string, size: number = 128): string {
  const emoji = getEmojiForAddress(address);
  const bgColor = getBackgroundColorForAddress(address);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="central" 
        text-anchor="middle" 
        font-size="${size * 0.55}"
        font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
      >${emoji}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function isEmojiAvatar(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("data:image/svg+xml") && url.includes("text-anchor");
}

export interface EmojiAvatarConfig {
  type: "emoji";
  emoji: string;
  backgroundColor: string;
}

export function createEmojiAvatarConfig(address: string): EmojiAvatarConfig {
  return {
    type: "emoji",
    emoji: getEmojiForAddress(address),
    backgroundColor: getBackgroundColorForAddress(address),
  };
}
