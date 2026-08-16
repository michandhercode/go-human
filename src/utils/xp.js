export const LEVEL_XP_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  450, // Level 4
  700, // Level 5
  1000, // Level 6
  1400, // Level 7
  1850, // Level 8
  2350, // Level 9
  3000, // Level 10
];

export const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length;

export const ACTION_XP = 10;

export function getLevelProgress(xp) {
  let level = 1;

  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const isMaxLevel = level >= MAX_LEVEL;
  const currentLevelXp = LEVEL_XP_THRESHOLDS[level - 1];
  const nextLevelXp = isMaxLevel ? null : LEVEL_XP_THRESHOLDS[level];
  const xpIntoLevel = xp - currentLevelXp;
  const xpForThisLevel = isMaxLevel ? null : nextLevelXp - currentLevelXp;
  const xpToNextLevel = isMaxLevel ? 0 : Math.max(0, nextLevelXp - xp);
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpIntoLevel / xpForThisLevel) * 100));

  return { level, isMaxLevel, xpToNextLevel, progressPercent };
}
