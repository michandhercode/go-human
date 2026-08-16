// Early levels are intentionally cheap so a new user feels progression fast.
// Later levels require more consistency. Reward-unlock levels (see rewards.js)
// are defined by level NUMBER, not raw XP, so they stay compatible with any
// threshold curve as long as the array length (10) doesn't change.
export const LEVEL_XP_THRESHOLDS = [
  0, // Level 1
  30, // Level 2
  70, // Level 3
  125, // Level 4
  200, // Level 5
  300, // Level 6
  425, // Level 7
  575, // Level 8
  750, // Level 9
  950, // Level 10
];

export const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length;

// Legacy flat XP value. Kept only as a display fallback for moments saved
// before XP became duration-based (see calculateOutcomeXp below), so old
// localStorage data still renders a sensible number.
export const ACTION_XP = 10;

// --- Duration-based XP ---
//
// XP is proportional to the size of the commitment the user actually signed
// up for (the quest's committed duration), not just which button they
// pressed. This keeps things fair: a smaller quest (e.g. from "Make it
// smaller") is still worth completing, just not worth as much as a bigger
// one — and real progress on a big quest can outweigh fully finishing a
// tiny one. The formula is intentionally simple: roughly 1 XP per committed
// minute, with a floor so even a 1-minute win still feels like something,
// and a ceiling so nobody can inflate XP by picking absurdly long durations.
export const XP_PER_MINUTE = 1;
export const MIN_COMPLETION_XP = 3;
export const MAX_COMPLETION_XP = 25;

// "I made some progress" is worth a fraction of what full completion of
// that same commitment would have been worth — still real credit, just
// honestly smaller than actually finishing it.
export const PROGRESS_XP_RATIO = 0.5;
export const MIN_PROGRESS_XP = 2;

/**
 * XP for a reported outcome, based on the quest's committed duration in
 * minutes — NOT the total time on the clock (so timer extensions, which are
 * about attention, not effort, can't be farmed for extra XP).
 *
 * @param {number} committedMinutes - the quest's original/current commitment length
 * @param {"done" | "progress" | "notReally"} outcome
 */
export function calculateOutcomeXp(committedMinutes, outcome) {
  if (outcome !== "done" && outcome !== "progress") return 0;

  const safeMinutes = Math.max(1, Math.round(committedMinutes));
  const fullXp = Math.min(
    MAX_COMPLETION_XP,
    Math.max(MIN_COMPLETION_XP, Math.round(safeMinutes * XP_PER_MINUTE))
  );

  if (outcome === "done") return fullXp;

  return Math.max(MIN_PROGRESS_XP, Math.round(fullXp * PROGRESS_XP_RATIO));
}

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
