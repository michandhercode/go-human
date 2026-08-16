// Life Stats — Phase 1.
//
// Entirely derived from existing data: Moments (quest history) and the
// Journal's entries list. No new tracking system, no new storage key, no
// AI calls. Everything here is a pure function of data that already exists
// in App state, so it's cheap to recompute on every render.

// Quests store `category` as one of these free-text labels (see
// api/next-move.mjs). Kept here as a fixed, deterministic ordering so that
// ties in "most common adventure" resolve the same way every time.
const CATEGORY_ORDER = ["FOCUS", "CONNECT", "RECHARGE", "NEXT MOVE"];

const CATEGORY_DISPLAY = {
  FOCUS: { emoji: "🎯", label: "Focus" },
  CONNECT: { emoji: "🤝", label: "Connect" },
  RECHARGE: { emoji: "🌿", label: "Recharge" },
  "NEXT MOVE": { emoji: "✨", label: "Next Move" },
};

function normalizeCategory(category) {
  return String(category ?? "").trim().toUpperCase();
}

function displayForCategory(category) {
  return (
    CATEGORY_DISPLAY[category] || {
      emoji: "✨",
      label: category
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    }
  );
}

// Loose keyword match against a moment's category/title/description, in the
// same spirit as the existing quest-icon matching in utils/journal.js — no
// second tracking taxonomy, just reading the same free-text fields the app
// already stores.
const OUTDOOR_KEYWORDS = [
  "outside",
  "outdoor",
  "walk",
  "jog",
  "run",
  "hike",
  "park",
  "nature",
  "fresh air",
  "sun",
  "garden",
  "bike",
];

function isOutdoorMoment(moment) {
  const haystack = `${moment.category ?? ""} ${moment.title ?? ""} ${moment.description ?? ""}`
    .toLowerCase();
  return OUTDOOR_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function isConnectMoment(moment) {
  return normalizeCategory(moment.category) === "CONNECT";
}

// The four headline numbers on the dashboard card. `journalState` is the
// same v2 { version, albums, entries } shape produced by utils/journal.js —
// entries is already flat across every album, so entries.length is exactly
// "memories captured", not "albums created".
export function getLifeStats(moments, journalState) {
  const safeMoments = Array.isArray(moments) ? moments : [];
  const memoriesCaptured = Array.isArray(journalState?.entries)
    ? journalState.entries.length
    : 0;

  return {
    thingsTried: safeMoments.length,
    peopleConnected: safeMoments.filter(isConnectMoment).length,
    thingsOutside: safeMoments.filter(isOutdoorMoment).length,
    memoriesCaptured,
  };
}

// Returns { category, label, emoji, count } for the most-frequent quest
// category, or null when there's no category data yet. Ties are broken
// deterministically using CATEGORY_ORDER (falling back to alphabetical for
// any unrecognized category strings) rather than by insertion order.
export function getMostCommonAdventure(moments) {
  const safeMoments = Array.isArray(moments) ? moments : [];
  const counts = new Map();

  safeMoments.forEach((moment) => {
    const category = normalizeCategory(moment.category);
    if (!category) return;
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  if (counts.size === 0) return null;

  const orderedKeys = [
    ...CATEGORY_ORDER.filter((key) => counts.has(key)),
    ...[...counts.keys()].filter((key) => !CATEGORY_ORDER.includes(key)).sort(),
  ];

  let bestCategory = orderedKeys[0];
  let bestCount = counts.get(bestCategory);

  orderedKeys.forEach((key) => {
    const count = counts.get(key);
    if (count > bestCount) {
      bestCount = count;
      bestCategory = key;
    }
  });

  const display = displayForCategory(bestCategory);
  return { category: bestCategory, count: bestCount, ...display };
}

// Full category breakdown, ordered the same deterministic way as above.
// Used by the dedicated Life Stats panel; not needed on the compact card.
export function getCategoryBreakdown(moments) {
  const safeMoments = Array.isArray(moments) ? moments : [];
  const counts = new Map();

  safeMoments.forEach((moment) => {
    const category = normalizeCategory(moment.category);
    if (!category) return;
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const orderedKeys = [
    ...CATEGORY_ORDER.filter((key) => counts.has(key)),
    ...[...counts.keys()].filter((key) => !CATEGORY_ORDER.includes(key)).sort(),
  ];

  return orderedKeys.map((category) => ({
    category,
    count: counts.get(category),
    ...displayForCategory(category),
  }));
}

// Below this many recorded moments, patterns aren't meaningful yet — reflect
// that honestly instead of overreading two data points.
const MIN_MOMENTS_FOR_PATTERN = 3;

// One small, deterministic, non-statistical line of reflection. No AI call —
// generated from the same data as the rest of Life Stats.
export function getLifeObservation(stats, mostCommonAdventure, moments) {
  if (!stats || stats.thingsTried === 0) return null;

  if (stats.thingsTried < MIN_MOMENTS_FOR_PATTERN) {
    return "You've been showing up for yourself in small ways.";
  }

  const safeMoments = Array.isArray(moments) ? moments : [];
  const distinctCategories = new Set(
    safeMoments.map((moment) => normalizeCategory(moment.category)).filter(Boolean)
  ).size;

  const isSpreadOut =
    distinctCategories >= 3 &&
    mostCommonAdventure &&
    mostCommonAdventure.count / stats.thingsTried < 0.5;

  if (isSpreadOut) {
    return "You've been trying a lot of different things lately.";
  }

  if (stats.thingsOutside > 0 && (!mostCommonAdventure || stats.thingsOutside >= mostCommonAdventure.count)) {
    return "You've been getting outside more lately.";
  }

  if (mostCommonAdventure?.category === "RECHARGE") {
    return "Looks like you've been making more time for yourself.";
  }

  if (mostCommonAdventure?.category === "CONNECT") {
    return "You've been making room for connection lately.";
  }

  if (mostCommonAdventure?.category === "FOCUS") {
    return "You've been putting in real focus lately.";
  }

  return "You've been showing up for yourself in small ways.";
}