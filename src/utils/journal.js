import { now } from "./time";

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

// --- Album system (Phase 1: data model only) ---

// Bumped when the on-disk shape changes. v1 = flat array of entries.
// v2 = { version: 2, albums: [...], entries: [...] } with each entry
// carrying an albumId.
export const JOURNAL_STATE_VERSION = 2;

export const DEFAULT_ALBUM_NAME = "My Journey";

// A "memory"/page limit, not a photo limit — photo+note, photo-only, and
// text-only entries all count as exactly one entry each toward this cap.
export const MAX_ENTRIES_PER_ALBUM = 10;

export function makeAlbumId() {
  return `album-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Renders a small integer as an uppercase roman numeral. Only ever called
// with small, human-scale album counts, but written generally so it never
// silently breaks if someone accumulates a lot of albums.
function toRoman(num) {
  const numerals = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let n = num;
  let result = "";
  for (const [value, symbol] of numerals) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

// Strips a trailing " II" / " III" / etc. roman-numeral suffix so we can
// re-derive the "family" name an overflow album should continue.
function baseAlbumName(name) {
  const stripped = String(name ?? "").replace(/\s+[IVXLCDM]+$/i, "").trim();
  return stripped || DEFAULT_ALBUM_NAME;
}

// Given the album names that already exist, returns the next predictable,
// non-duplicate name in the same family as seedName — e.g. "My Journey" ->
// "My Journey II" -> "My Journey III".
export function nextAlbumName(existingNames, seedName = DEFAULT_ALBUM_NAME) {
  const base = baseAlbumName(seedName);
  const taken = new Set(existingNames);
  let n = 2;
  let candidate = `${base} ${toRoman(n)}`;
  while (taken.has(candidate)) {
    n += 1;
    candidate = `${base} ${toRoman(n)}`;
  }
  return candidate;
}

export function createAlbum({
  id,
  name = DEFAULT_ALBUM_NAME,
  subtitle = "",
  createdAt,
  customization,
} = {}) {
  return {
    id: id || makeAlbumId(),
    name,
    subtitle,
    createdAt: createdAt ?? now(),
    customization: { ...DEFAULT_JOURNAL_CUSTOMIZATION, ...(customization || {}) },
  };
}

export function createFreshJournalState() {
  return {
    version: JOURNAL_STATE_VERSION,
    albums: [createAlbum({ name: DEFAULT_ALBUM_NAME })],
    entries: [],
  };
}

export function countAlbumEntries(state, albumId) {
  return state.entries.filter((entry) => entry.albumId === albumId).length;
}

export function isAlbumFull(state, albumId) {
  return countAlbumEntries(state, albumId) >= MAX_ENTRIES_PER_ALBUM;
}

// Finds an album with room, preferring preferredAlbumId if it still has
// space. Falls through the remaining albums in order. Returns null if every
// existing album is full (the caller should create a new one).
export function findNextAvailableAlbum(state, preferredAlbumId) {
  const preferred = state.albums.find((album) => album.id === preferredAlbumId);
  if (preferred && !isAlbumFull(state, preferred.id)) return preferred;

  const available = state.albums.find((album) => !isAlbumFull(state, album.id));
  return available || null;
}

// Migrates the legacy flat-array Journal ([{ id, type, title, ... }, ...])
// into the v2 { version, albums, entries } shape. Every existing entry is
// preserved exactly as-is (including base64 photo data) other than gaining
// an albumId that points at a single new default album, so nothing is
// duplicated or lost.
export function migrateV1ToV2(flatEntries, legacyCustomization) {
  const defaultAlbum = createAlbum({
    id: "default",
    name: DEFAULT_ALBUM_NAME,
    createdAt: flatEntries[flatEntries.length - 1]?.date ?? now(),
    customization: legacyCustomization,
  });

  const entries = flatEntries.map((entry) => ({
    ...entry,
    albumId: "default",
  }));

  return {
    version: JOURNAL_STATE_VERSION,
    albums: [defaultAlbum],
    entries,
  };
}

// Accepts whatever shape happens to be in localStorage (nothing, a v1 flat
// array, a v2 state, or something malformed) and returns a well-formed v2
// state. legacyCustomization, when provided, is folded into the migrated
// default album's customization — it is never deleted by this function.
export function normalizeJournalState(raw, legacyCustomization) {
  if (!raw) return createFreshJournalState();

  if (Array.isArray(raw)) {
    if (raw.length === 0) return createFreshJournalState();
    return migrateV1ToV2(raw, legacyCustomization);
  }

  if (typeof raw === "object" && Array.isArray(raw.albums) && Array.isArray(raw.entries)) {
    // Already v2 (or forward-compatible). Guard against a malformed/empty
    // albums list so there is always somewhere for new entries to land.
    if (raw.albums.length === 0) {
      const fallback = createAlbum({ id: "default", name: DEFAULT_ALBUM_NAME });
      return {
        version: JOURNAL_STATE_VERSION,
        albums: [fallback],
        entries: raw.entries.map((entry) => ({ ...entry, albumId: entry.albumId || fallback.id })),
      };
    }
    return { version: JOURNAL_STATE_VERSION, albums: raw.albums, entries: raw.entries };
  }

  // Unrecognized shape — don't guess, don't wipe anything the caller might
  // still have a reference to; just hand back a fresh state.
  return createFreshJournalState();
}

export function loadJournalState() {
  let rawJournal;
  try {
    const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
    rawJournal = saved ? JSON.parse(saved) : null;
  } catch {
    rawJournal = null;
  }

  let legacyCustomization;
  try {
    const savedCustomization = localStorage.getItem(JOURNAL_CUSTOMIZATION_STORAGE_KEY);
    legacyCustomization = savedCustomization ? JSON.parse(savedCustomization) : null;
  } catch {
    legacyCustomization = null;
  }

  const state = normalizeJournalState(rawJournal, legacyCustomization);

  // Persist the migration/normalization result immediately so subsequent
  // loads read v2 directly. We intentionally do NOT delete the legacy
  // go-human-journal-customization key here — Phase 1 only reads it.
  saveJournalState(state);

  return state;
}

export function saveJournalState(state) {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(state));
}

// Adds an entry to state, honoring the per-album capacity: it saves into
// preferredAlbumId when there's room, falls back to another non-full album,
// and otherwise creates a new album (predictably named after the preferred
// album's family) to hold it. Pure function — returns a new state plus the
// id of the album the entry actually landed in, so the caller always knows
// where it went.
export function addEntryToAlbum(state, entry, preferredAlbumId) {
  const target = findNextAvailableAlbum(state, preferredAlbumId);

  if (target) {
    const savedEntry = { ...entry, albumId: target.id };
    return {
      state: { ...state, entries: [savedEntry, ...state.entries] },
      albumId: target.id,
    };
  }

  // Every existing album is full — spin up the next one in the sequence.
  const seedAlbum =
    state.albums.find((album) => album.id === preferredAlbumId) ||
    state.albums[state.albums.length - 1];
  const existingNames = state.albums.map((album) => album.name);
  const newAlbum = createAlbum({
    name: nextAlbumName(existingNames, seedAlbum?.name),
    customization: seedAlbum?.customization,
  });
  const savedEntry = { ...entry, albumId: newAlbum.id };

  return {
    state: {
      ...state,
      albums: [...state.albums, newAlbum],
      entries: [savedEntry, ...state.entries],
    },
    albumId: newAlbum.id,
  };
}

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
