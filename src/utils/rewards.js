export const DEFAULT_COMPANION = {
  id: "default",
  body: "#f8fafc",
  cheeks: "#fda4af",
  accessory: null,
};

export const CHATBOX_THEMES = [
  {
    id: "nature",
    unlockLevel: 2,
    emoji: "🌿",
    name: "Nature Chatbox",
    className: "theme-nature",
    tagline: "Your world just grew into a lush little nature world. 🌿",
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
    className: "theme-night",
    tagline: "GO HUMAN now has a cozy Night Owl world, moon and all. 🌙",
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
    className: "theme-retro",
    tagline: "Welcome to the Retro arcade world. 🎮",
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
    className: "theme-golden",
    tagline: "The big one. GO HUMAN now glows in Golden Hour light. 🌟",
    colors: {
      bg: "rgba(250, 204, 21, 0.16)",
      border: "#facc15",
      accent: "#fde047",
    },
  },
];

export const AVATARS = [
  {
    id: "sunrise",
    unlockLevel: 3,
    emoji: "🌅",
    name: "Sunrise Mode",
    tagline: "Your companion caught a sunrise glow, and so did the sky. 🌅",
    body: "#fef3c7",
    cheeks: "#fb7185",
    accessory: "sun",
    // Sunrise is a companion cosmetic, but it still warms up the world a
    // touch when equipped — a small ambient tint, not a full theme swap.
    worldTint: "sunrise",
  },
  {
    id: "butterfly",
    unlockLevel: 5,
    emoji: "🦋",
    name: "Butterfly",
    tagline: "Your companion grew a pair of cute butterfly wings. 🦋",
    body: "#ede9fe",
    cheeks: "#f9a8d4",
    accessory: "wings",
  },
  {
    id: "cat",
    unlockLevel: 7,
    emoji: "🐈",
    name: "Companion",
    tagline: "Your companion is rocking cat ears now. 🐱",
    body: "#fed7aa",
    cheeks: "#fb7185",
    accessory: "ears",
  },
  {
    id: "star",
    unlockLevel: 9,
    emoji: "🌠",
    name: "Shooting Star",
    tagline: "A shooting-star sparkle trail now follows your companion. 🌠",
    body: "#fef9c3",
    cheeks: "#facc15",
    accessory: "star",
  },
];

export const EFFECTS = [
  {
    id: "sparkle-effect",
    unlockLevel: 8,
    emoji: "✨",
    name: "Sparkle Trail",
    tagline: "A sparkle trail now appears whenever you finish something. ✨",
  },
];

export const ALL_REWARDS = [
  ...CHATBOX_THEMES.map((reward) => ({ ...reward, type: "chatbox" })),
  ...AVATARS.map((reward) => ({ ...reward, type: "avatar" })),
  ...EFFECTS.map((reward) => ({ ...reward, type: "effect" })),
].sort((a, b) => a.unlockLevel - b.unlockLevel);
