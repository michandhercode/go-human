 export const CHATBOX_THEMES = [
  {
    id: "nature",
    unlockLevel: 2,
    emoji: "🌿",
    name: "Nature Chatbox",
    colors: {
      bg: "rgba(74, 222, 128, 0.14)",
      border: "#4ade80",
      accent: "#86efac",
    },
  },
  {
    id: "night",
    unlockLevel: 4,
    emoji: "🌙",
    name: "Night Owl",
    colors: {
      bg: "rgba(56, 189, 248, 0.14)",
      border: "#38bdf8",
      accent: "#7dd3fc",
    },
  },
  {
    id: "retro",
    unlockLevel: 6,
    emoji: "🎮",
    name: "Retro Theme",
    colors: {
      bg: "rgba(244, 114, 182, 0.16)",
      border: "#f472b6",
      accent: "#f9a8d4",
    },
  },
  {
    id: "golden",
    unlockLevel: 10,
    emoji: "🌟",
    name: "Golden Hour",
    colors: {
      bg: "rgba(250, 204, 21, 0.16)",
      border: "#facc15",
      accent: "#fde047",
    },
  },
];

export const AVATARS = [
  { id: "sunrise", unlockLevel: 3, emoji: "🌅", name: "Sunrise Mode" },
  { id: "butterfly", unlockLevel: 5, emoji: "🦋", name: "Butterfly" },
  { id: "cat", unlockLevel: 7, emoji: "🐈", name: "Companion" },
  { id: "star", unlockLevel: 9, emoji: "🌠", name: "Shooting Star" },
];

export const EFFECTS = [
  {
    id: "sparkle-effect",
    unlockLevel: 8,
    emoji: "✨",
    name: "Sparkle Trail",
  },
];

export const ALL_REWARDS = [
  ...CHATBOX_THEMES.map((reward) => ({ ...reward, type: "chatbox" })),
  ...AVATARS.map((reward) => ({ ...reward, type: "avatar" })),
  ...EFFECTS.map((reward) => ({ ...reward, type: "effect" })),
].sort((a, b) => a.unlockLevel - b.unlockLevel);
