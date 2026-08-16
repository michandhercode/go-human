// Dedicated Journal storage — completely separate from XP, rewards,
// onboarding, day/night, sound, and Moments storage. Never read or write
// any of those keys from here.
export const JOURNAL_STORAGE_KEY = "go-human-journal";
export const JOURNAL_CUSTOMIZATION_STORAGE_KEY = "go-human-journal-customization";

export const DEFAULT_JOURNAL_CUSTOMIZATION = {
  cover: "default",
  theme: "default",
  frame: "pixel",
  stickerPack: "basic",
};

// --- Presets. All customization is pick-one-from-a-list — no free-form
// editor. unlockLevel 0 means "always available". ---

export const JOURNAL_COVERS = [
  { id: "default", unlockLevel: 0, emoji: "📖", name: "Default Cover" },
  { id: "nature", unlockLevel: 3, emoji: "🌱", name: "Nature Cover" },
  { id: "retro", unlockLevel: 6, emoji: "🎮", name: "Retro Cover" },
  { id: "golden", unlockLevel: 10, emoji: "🌅", name: "Golden Hour Cover" },
];

export const JOURNAL_PAGE_THEMES = [
  { id: "default", unlockLevel: 0, emoji: "📔", name: "Default Pages" },
  { id: "nature", unlockLevel: 3, emoji: "🌿", name: "Nature Pages" },
  { id: "sunset", unlockLevel: 5, emoji: "🌇", name: "Sunset Pages" },
  { id: "night", unlockLevel: 4, emoji: "🌙", name: "Night Pages" },
  { id: "retro", unlockLevel: 6, emoji: "🕹️", name: "Retro Pages" },
];

export const JOURNAL_FRAMES = [
  { id: "pixel", unlockLevel: 0, emoji: "🖼️", name: "Pixel Frame" },
  { id: "tape", unlockLevel: 2, emoji: "📎", name: "Tape Frame" },
  { id: "polaroid", unlockLevel: 5, emoji: "📷", name: "Polaroid Frame" },
  { id: "sticker", unlockLevel: 7, emoji: "✨", name: "Sticker Frame" },
];

export const JOURNAL_STICKER_PACKS = [
  { id: "basic", unlockLevel: 0, name: "Basic Stickers", stickers: ["⭐", "💛", "☁️", "🍀"] },
  { id: "nature", unlockLevel: 3, name: "Nature Pack", stickers: ["🌿", "🍃", "🌸", "🌼"] },
  { id: "sparkle", unlockLevel: 7, name: "Sparkle Pack", stickers: ["✨", "💫", "🌟", "💖"] },
  { id: "golden", unlockLevel: 10, name: "Golden Hour Pack", stickers: ["🌅", "🧡", "🔆", "🪶"] },
];

// A short, human-readable summary of what unlocks at which level, shown in
// JournalCustomize so the Journal visibly plugs into the existing level/XP
// system without touching it.
export const JOURNAL_UNLOCK_MILESTONES = [
  { level: 2, label: "Tape Frame", emoji: "📎" },
  { level: 3, label: "Nature Journal Theme", emoji: "🌱" },
  { level: 4, label: "Night Pages", emoji: "🌙" },
  { level: 5, label: "Polaroid Photo Frame", emoji: "📷" },
  { level: 6, label: "Retro Cover & Pages", emoji: "🎮" },
  { level: 7, label: "Sparkle Sticker Pack", emoji: "✨" },
  { level: 10, label: "Golden Hour Journal", emoji: "🌅" },
];

export function getUnlockedPresets(list, level) {
  return list.filter((preset) => level >= preset.unlockLevel);
}

// Loose keyword match against a quest's free-text category/title so quest
// moments get a sensible icon even though categories aren't a fixed enum.
const CATEGORY_ICON_RULES = [
  { icon: "🏃", keywords: ["run", "walk", "jog", "exercise", "workout", "move", "stretch"] },
  { icon: "🤝", keywords: ["connect", "friend", "call", "talk", "family", "social"] },
  { icon: "🌿", keywords: ["recharge", "rest", "breathe", "relax", "nature", "outside"] },
  { icon: "🎯", keywords: ["focus", "work", "study", "task", "project"] },
  { icon: "🧹", keywords: ["clean", "tidy", "chore", "organize"] },
  { icon: "🎨", keywords: ["create", "art", "write", "draw", "music"] },
  { icon: "😴", keywords: ["sleep", "nap", "bed"] },
  { icon: "🍽️", keywords: ["eat", "cook", "meal", "food"] },
];

export function getEntryIcon(category, title) {
  const haystack = `${category ?? ""} ${title ?? ""}`.toLowerCase();
  const match = CATEGORY_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => haystack.includes(keyword))
  );
  return match ? match.icon : "✨";
}

export function makeJournalId() {
  return `journal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Resize + compress an uploaded image client-side before it ever touches
// localStorage. Keeps the Journal fully local-first (no backend, no cloud
// image service) while avoiding blowing the localStorage quota on full-size
// phone photos.
const MAX_PHOTO_DIMENSION = 900;
const PHOTO_JPEG_QUALITY = 0.82;

export function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
