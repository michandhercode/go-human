import { useEffect, useRef, useState } from "react";
import "./App.css";
import { getLevelProgress, calculateOutcomeXp } from "./utils/xp";
import { CHATBOX_THEMES, AVATARS, ALL_REWARDS } from "./utils/rewards";
import { now } from "./utils/time";
import PixelWorld from "./components/PixelWorld";
import Companion from "./components/Companion";
import XpHud from "./components/XpHud";
import RewardsPanel from "./components/RewardsPanel";
import AiResponse from "./components/AiResponse";
import ActionSession from "./components/ActionSession";
import Moments from "./components/Moments";
import MomentHistory from "./components/MomentHistory";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import LevelUpOverlay from "./components/LevelUpOverlay";
import RewardUnlockToast from "./components/RewardUnlockToast";
import WelcomePage from "./components/WelcomePage";
import InfoPanel from "./components/InfoPanel";
import TopControls from "./components/TopControls";
import Journal from "./components/Journal";
import LifeStats from "./components/LifeStats";
import LifeStatsPanel from "./components/LifeStatsPanel";
import DashboardCard from "./components/DashboardCard";
import PixelIcon from "./components/PixelIcon";
import { BOOK_PIXELS, BOOK_PALETTE } from "./utils/pixelArt";
import {
  DEFAULT_JOURNAL_CUSTOMIZATION,
  loadJournalState,
  saveJournalState,
  addEntryToAlbum,
  getEntryIcon,
  makeJournalId,
} from "./utils/journal";
import {
  getLifeStats,
  getMostCommonAdventure,
  getLifeObservation,
  getCategoryBreakdown,
} from "./utils/lifeStats";
import {
  initAudio,
  isSoundEnabled,
  setSoundEnabled,
  isBgmEnabled,
  setBgmEnabled,
  setBgmDayNight,
  startBgm,
  playSound,
  getSfxVolume,
  setSfxVolume,
  getBgmVolume,
  setBgmVolume,
} from "./utils/sounds";

// Dedicated onboarding flag — the ONLY thing that decides whether the
// first-time welcome/hook page shows. Never inferred from XP, moments, or
// any other existing user data, so it can't accidentally re-trigger for
// returning users.
const ONBOARDING_STORAGE_KEY = "go-human-onboarded";

function readUnlockedIdsForXp(xpValue) {
  const progress = getLevelProgress(xpValue);
  return ALL_REWARDS.filter((reward) => progress.level >= reward.unlockLevel).map((reward) => reward.id);
}

function App() {
  const [message, setMessage] = useState("");
  const [nextMove, setNextMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState(null);

  // --- "GIVE ME ANOTHER MOVE" — additive to nextMove, no separate storage.
  // isGeneratingAnotherMove/anotherMoveError are reset any time nextMove
  // itself is reset (same places setNextMove(null) already happens below).
  const [isGeneratingAnotherMove, setIsGeneratingAnotherMove] = useState(false);
  const [anotherMoveError, setAnotherMoveError] = useState("");

  // --- first-time welcome/hook page ---
  const [hasOnboarded, setHasOnboarded] = useState(
    () => localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true"
  );
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const [moments, setMoments] = useState(() => {
    const savedMoments = localStorage.getItem("go-human-moments");
    return savedMoments ? JSON.parse(savedMoments) : [];
  });

  const [xp, setXp] = useState(() => {
    const savedXp = localStorage.getItem("go-human-xp");
    return savedXp ? Number(savedXp) : 0;
  });

  const [selectedThemeId, setSelectedThemeId] = useState(
    () => localStorage.getItem("go-human-theme") || null
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(
    () => localStorage.getItem("go-human-avatar") || null
  );

  // --- Moment History (full view) + delete. Both operate on the same
  // `moments` array/state above — no duplicate storage. pendingDeleteMomentIndex
  // is the index (within the FULL moments array) awaiting confirmation, or
  // null when no delete is in progress.
  const [isMomentHistoryOpen, setIsMomentHistoryOpen] = useState(false);
  const [pendingDeleteMomentIndex, setPendingDeleteMomentIndex] = useState(null);

  // --- Virtual Life Journal — entirely additive, own storage key, never
  // touches XP/rewards/onboarding/moments state above.
  //
  // journalState is the new v2, multi-album shape: { version, albums,
  // entries }. loadJournalState() transparently migrates any old flat-array
  // Journal (and any old go-human-journal-customization key) into it on
  // first read. Until Phase 2 ships an album-picker UI, the Journal UI
  // still works with a flat entry list and a single customization object,
  // so we derive those from journalState below rather than changing the
  // existing Journal/JournalEntry/JournalEditor/JournalCustomize components.
  const [journalState, setJournalState] = useState(() => loadJournalState());
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  // --- Life Stats — purely derived from moments + journalState above, no
  // storage of its own. isLifeStatsOpen just toggles the dedicated panel.
  const [isLifeStatsOpen, setIsLifeStatsOpen] = useState(false);

  // --- day/night environment (NOT a reward — the base world's lighting).
  // Day is always the default on a fresh install; only a previously saved
  // manual preference can change that.
  const [dayNight, setDayNight] = useState(
    () => localStorage.getItem("go-human-daynight") || "day"
  );
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  // --- sound settings (SFX and BGM are independent) ---
  const [sfxOn, setSfxOn] = useState(() => isSoundEnabled());
  const [bgmOn, setBgmOn] = useState(() => isBgmEnabled());
  const [sfxVolume, setSfxVolumeState] = useState(() => getSfxVolume());
  const [bgmVolume, setBgmVolumeState] = useState(() => getBgmVolume());
  const [isSoundPopoverOpen, setIsSoundPopoverOpen] = useState(false);
  const dayNightRef = useRef(dayNight);
  const soundPopoverRef = useRef(null);

  // --- pixel-world presentation state (purely visual, derived from the systems above) ---
  const [companionMood, setCompanionMood] = useState("idle");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [justGainedXp, setJustGainedXp] = useState(false);
  const [rewardUnlockQueue, setRewardUnlockQueue] = useState([]);
  const [seenRewardIds, setSeenRewardIds] = useState(() => {
    const saved = localStorage.getItem("go-human-seen-rewards");
    if (saved) return JSON.parse(saved);
    // First run: treat whatever is already unlocked as "seen" so we don't
    // spam unlock toasts for progress the user already had.
    const initialXp = Number(localStorage.getItem("go-human-xp")) || 0;
    return readUnlockedIdsForXp(initialXp);
  });

  const prevLevelRef = useRef(getLevelProgress(xp).level);

  useEffect(() => {
    localStorage.setItem("go-human-moments", JSON.stringify(moments));
  }, [moments]);

  useEffect(() => {
    saveJournalState(journalState);
  }, [journalState]);

  useEffect(() => {
    localStorage.setItem("go-human-xp", xp);
  }, [xp]);

  useEffect(() => {
    if (selectedThemeId) {
      localStorage.setItem("go-human-theme", selectedThemeId);
    } else {
      localStorage.removeItem("go-human-theme");
    }
  }, [selectedThemeId]);

  useEffect(() => {
    if (selectedAvatarId) {
      localStorage.setItem("go-human-avatar", selectedAvatarId);
    } else {
      localStorage.removeItem("go-human-avatar");
    }
  }, [selectedAvatarId]);

  useEffect(() => {
    localStorage.setItem("go-human-seen-rewards", JSON.stringify(seenRewardIds));
  }, [seenRewardIds]);

  useEffect(() => {
    localStorage.setItem("go-human-daynight", dayNight);
  }, [dayNight]);

  // Keep a ref in sync so the one-time "first user gesture" listener below
  // always reads the current day/night state, not whatever it was on mount.
  useEffect(() => {
    dayNightRef.current = dayNight;
  }, [dayNight]);

  // Browsers block audio until a real user gesture happens. We can't just
  // autoplay the BGM on mount, so we listen once for the first interaction
  // anywhere in the app, unlock the AudioContext, and start the BGM only if
  // it's supposed to be on.
  useEffect(() => {
    let didStart = false;

    function handleFirstGesture() {
      if (didStart) return;
      didStart = true;
      initAudio();
      if (isBgmEnabled()) {
        startBgm(dayNightRef.current);
      }
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    }

    window.addEventListener("pointerdown", handleFirstGesture);
    window.addEventListener("keydown", handleFirstGesture);
    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, []);

  // Smoothly crossfade the BGM whenever Day/Night changes (no-op if BGM
  // isn't currently playing — it just remembers the variant for later).
  useEffect(() => {
    setBgmDayNight(dayNight);
  }, [dayNight]);

  // Close the SOUND popover on an outside click/tap or on Escape.
  useEffect(() => {
    if (!isSoundPopoverOpen) return;

    function handlePointerDown(event) {
      if (soundPopoverRef.current && !soundPopoverRef.current.contains(event.target)) {
        setIsSoundPopoverOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsSoundPopoverOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSoundPopoverOpen]);

  useEffect(() => {
    if (!activeAction || !activeAction.isRunning) return;

    const tick = setTimeout(() => {
      setActiveAction((current) => {
        if (!current) return current;

        if (current.secondsLeft <= 1) {
          return { ...current, secondsLeft: 0, isRunning: false, isDone: true };
        }

        return { ...current, secondsLeft: current.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearTimeout(tick);
  }, [activeAction]);

  useEffect(() => {
    if (!activeAction?.isDone || activeAction.outcome) return;

    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    try {
      new Notification("GO HUMAN", {
        body: "Time's up. How did it go?",
      });
    } catch {
      // Notifications are best-effort; ignore failures.
    }
  }, [activeAction?.isDone, activeAction?.outcome]);

  const levelProgress = getLevelProgress(xp);
  const unlockedRewardIds = ALL_REWARDS.filter(
    (reward) => levelProgress.level >= reward.unlockLevel
  ).map((reward) => reward.id);

  const activeTheme =
    selectedThemeId && unlockedRewardIds.includes(selectedThemeId)
      ? CHATBOX_THEMES.find((theme) => theme.id === selectedThemeId)
      : null;

  const activeAvatar =
    selectedAvatarId && unlockedRewardIds.includes(selectedAvatarId)
      ? AVATARS.find((avatar) => avatar.id === selectedAvatarId)
      : null;

  const sparkleUnlocked = unlockedRewardIds.includes("sparkle-effect");

  // Detect level-ups (skips the very first render) and trigger a short,
  // non-blocking celebration without touching the underlying XP system.
  useEffect(() => {
    if (levelProgress.level > prevLevelRef.current) {
      prevLevelRef.current = levelProgress.level;
      playSound("levelup");
      setShowLevelUp(true);
      setCompanionMood("levelup");
      const hideTimer = setTimeout(() => setShowLevelUp(false), 2200);
      const moodTimer = setTimeout(() => setCompanionMood("idle"), 2200);
      return () => {
        clearTimeout(hideTimer);
        clearTimeout(moodTimer);
      };
    }
    prevLevelRef.current = levelProgress.level;
  }, [levelProgress.level]);

  // Queue up "new reward unlocked" toasts, one at a time, for anything that
  // just crossed its unlock level for the first time.
  useEffect(() => {
    const newlyUnlocked = unlockedRewardIds.filter((id) => !seenRewardIds.includes(id));
    if (newlyUnlocked.length === 0) return;

    playSound("reward");

    const rewardsToQueue = newlyUnlocked
      .map((id) => ALL_REWARDS.find((reward) => reward.id === id))
      .filter(Boolean);

    setRewardUnlockQueue((current) => [...current, ...rewardsToQueue]);
    setSeenRewardIds((current) => [...current, ...newlyUnlocked]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedRewardIds.join(",")]);

  function choosePrompt(prompt) {
    playSound("click");
    setMessage(prompt);
    setNextMove(null);
    setError("");
    setAnotherMoveError("");
  }

  async function createNextMove() {
    playSound("click");
    if (!message.trim()) {
      setError("Tell GO HUMAN what is on your mind first. 💛");
      return;
    }

    setIsThinking(true);
    setError("");
    setNextMove(null);
    setAnotherMoveError("");
    setCompanionMood("thinking");

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:3001/api/next-move"
        : "/api/next-move";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setNextMove(data);
    } catch (err) {
      setError(err.message || "Could not reach GO HUMAN. Please try again.");
    } finally {
      setIsThinking(false);
      setCompanionMood("idle");
    }
  }

  // "GIVE ME ANOTHER MOVE" — reuses the existing Groq-backed API
  // architecture to ask GO HUMAN for exactly one more contextual quest,
  // grounded in the original message + the options already shown, then
  // appends it to the existing options. Never replaces existing options.
  async function requestAnotherMove() {
    if (!nextMove) return;

    playSound("click");
    setIsGeneratingAnotherMove(true);
    setAnotherMoveError("");

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:3001/api/another-move"
        : "/api/another-move";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          existingOptions: nextMove.options || [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not think of another move right now.");
      }

      setNextMove((current) =>
        current ? { ...current, options: [...(current.options || []), data] } : current
      );
    } catch (err) {
      setAnotherMoveError(err.message || "Could not think of another move right now.");
    } finally {
      setIsGeneratingAnotherMove(false);
    }
  }

  function startAction(option) {
    playSound("click");
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const totalSeconds = Math.max(1, Math.round(option.duration * 60));

    setActiveAction({
      category: nextMove.category,
      title: option.title,
      description: option.description,
      // optionSeconds is the original committed window — "try again" always
      // resets back to this, even if the session was later extended.
      optionSeconds: totalSeconds,
      totalSeconds,
      secondsLeft: totalSeconds,
      isRunning: true,
      isDone: false,
      // No outcome has been reported yet. The timer finishing does NOT set
      // this — only an explicit "I DID IT" / "I MADE SOME PROGRESS" /
      // "NOT REALLY" tap does.
      outcome: null,
      isGeneratingSmaller: false,
      smallerError: "",
    });
  }

  function toggleActionTimer() {
    playSound("click");
    setActiveAction((current) =>
      current ? { ...current, isRunning: !current.isRunning } : current
    );
  }

  function giveUpAction() {
    playSound("click");
    setActiveAction(null);
  }

  // The timer finishing is only a commitment window ending — it never awards
  // XP or saves a moment on its own. XP and the saved moment only happen
  // here, after the user explicitly reports what actually happened.
  function reportOutcome(outcome) {
    if (!activeAction) return;

    if (outcome === "notReally") {
      // 0 XP, nothing saved. We just move into the supportive "what next"
      // sub-choices (make it smaller / try again / done for now).
      playSound("click");
      setActiveAction((current) => (current ? { ...current, outcome: "notReally" } : current));
      return;
    }

    playSound("success");

    const committedMinutes = activeAction.optionSeconds / 60;
    const xpAwarded = calculateOutcomeXp(committedMinutes, outcome);

    const moment = {
      category: activeAction.category,
      title: activeAction.title,
      description: activeAction.description,
      duration: Math.round(activeAction.totalSeconds / 60),
      xpEarned: xpAwarded,
      outcome: outcome === "done" ? "Completed" : "Progress",
      completedAt: now(),
    };

    setMoments((currentMoments) => [moment, ...currentMoments]);
    setXp((currentXp) => currentXp + xpAwarded);
    setActiveAction((current) => (current ? { ...current, outcome } : current));

    setCompanionMood("celebrate");
    setJustGainedXp(true);
    setTimeout(() => setCompanionMood("idle"), 1400);
    setTimeout(() => setJustGainedXp(false), 900);
  }

  // "Keep going +5 min" — extends the commitment window. This never awards
  // XP by itself; the final outcome still decides that.
  function extendActionTimer() {
    playSound("click");
    setActiveAction((current) =>
      current
        ? {
            ...current,
            totalSeconds: current.totalSeconds + 5 * 60,
            secondsLeft: 5 * 60,
            isRunning: true,
            isDone: false,
          }
        : current
    );
  }

  // "Try again" — resets back to the original committed duration and starts
  // a fresh window on the same action. 0 XP.
  function tryActionAgain() {
    playSound("click");
    setActiveAction((current) =>
      current
        ? {
            ...current,
            totalSeconds: current.optionSeconds,
            secondsLeft: current.optionSeconds,
            isRunning: true,
            isDone: false,
            outcome: null,
          }
        : current
    );
  }

  // "Make it smaller" — reuses the existing Groq-backed API architecture to
  // ask GO HUMAN for a smaller version of the same action, then starts a new
  // commitment window for it. 0 XP; nothing is saved until an outcome is
  // reported for the new, smaller action.
  async function makeActionSmaller() {
    if (!activeAction) return;

    playSound("click");
    setActiveAction((current) =>
      current ? { ...current, isGeneratingSmaller: true, smallerError: "" } : current
    );

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:3001/api/smaller-action"
        : "/api/smaller-action";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: activeAction.title,
          description: activeAction.description,
          category: activeAction.category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not shrink that right now.");
      }

      const totalSeconds = Math.max(1, Math.round(data.duration * 60));

      setActiveAction((current) => {
        if (!current) return current;
        return {
          ...current,
          title: data.title,
          description: data.description,
          optionSeconds: totalSeconds,
          totalSeconds,
          secondsLeft: totalSeconds,
          isRunning: true,
          isDone: false,
          outcome: null,
          isGeneratingSmaller: false,
          smallerError: "",
        };
      });
    } catch (err) {
      setActiveAction((current) =>
        current
          ? {
              ...current,
              isGeneratingSmaller: false,
              smallerError: err.message || "Could not shrink that right now.",
            }
          : current
      );
    }
  }

  // Closes out the action session entirely (after a reported outcome, or
  // "I'm done for now"). Never touches XP.
  function closeActionSession() {
    playSound("click");
    setActiveAction(null);
    setNextMove(null);
    setMessage("");
    setAnotherMoveError("");
  }

  // Fires once, the very first time a user taps LET'S GO. Sets a dedicated
  // flag so reopening the app later goes straight to the main experience —
  // it never touches XP, moments, rewards, or any other saved state.
  function handleWelcomeStart() {
    playSound("success");
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setHasOnboarded(true);
  }

  function openInfoPanel() {
    playSound("click");
    setIsInfoOpen(true);
  }

  function closeInfoPanel() {
    playSound("click");
    setIsInfoOpen(false);
  }

  function toggleDayNight() {
    playSound("toggle");
    setDayNight((current) => (current === "day" ? "night" : "day"));
  }

  function openRewardsDrawer() {
    playSound("drawer");
    setIsRewardsOpen(true);
  }

  function selectTheme(themeId) {
    playSound("click");
    setSelectedThemeId((current) => (current === themeId ? null : themeId));
  }

  function selectAvatar(avatarId) {
    playSound("click");
    setSelectedAvatarId((current) => (current === avatarId ? null : avatarId));
  }

  function openJournal() {
    playSound("drawer");
    setIsJournalOpen(true);
  }

  function closeJournal() {
    playSound("click");
    setIsJournalOpen(false);
  }

  function openLifeStats() {
    playSound("click");
    setIsLifeStatsOpen(true);
  }

  function closeLifeStats() {
    playSound("click");
    setIsLifeStatsOpen(false);
  }

  // Routes a new entry through the album-aware data layer: it lands in the
  // primary album if there's room, otherwise the capacity/overflow logic in
  // addEntryToAlbum() finds (or creates) the next album for it. Until
  // Phase 2 adds an album picker, "primary" is simply the first album.
  function addJournalEntry(entry) {
    setJournalState((current) => {
      const preferredAlbumId = current.albums[0]?.id;
      return addEntryToAlbum(current, entry, preferredAlbumId).state;
    });
  }

  function updateJournalEntry(id, updates) {
    setJournalState((current) => ({
      ...current,
      entries: current.entries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
    }));
  }

  function deleteJournalEntry(id) {
    setJournalState((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== id),
    }));
  }

  // Phase 1 still exposes a single customization object to the existing
  // JournalCustomize UI, so this updates the primary (first) album's
  // customization. Per-album customization already exists in the data
  // model for Phase 2 to build on.
  function setJournalCustomizationField(field, value) {
    playSound("click");
    setJournalState((current) => {
      const primaryAlbumId = current.albums[0]?.id;
      return {
        ...current,
        albums: current.albums.map((album) =>
          album.id === primaryAlbumId
            ? { ...album, customization: { ...album.customization, [field]: value } }
            : album
        ),
      };
    });
  }

  // Optional "want to remember this?" save, offered right after a quest is
  // reported done/in-progress (see ActionSession). Never required — closing
  // the session without saving leaves XP/reward logic completely untouched.
  function saveActiveActionToJournal({ note, photo }) {
    if (!activeAction || activeAction.journalSaved) return;

    playSound("click");

    const xpEarned = calculateOutcomeXp(activeAction.optionSeconds / 60, activeAction.outcome);

    addJournalEntry({
      id: makeJournalId(),
      type: "quest",
      title: activeAction.title,
      category: activeAction.category,
      icon: getEntryIcon(activeAction.category, activeAction.title),
      note: note?.trim() || "",
      photo: photo || null,
      sticker: null,
      xpEarned,
      date: now(),
    });

    setActiveAction((current) => (current ? { ...current, journalSaved: true } : current));
  }

  function openMomentHistory() {
    playSound("drawer");
    setIsMomentHistoryOpen(true);
  }

  function closeMomentHistory() {
    playSound("click");
    setIsMomentHistoryOpen(false);
  }

  // Opening a delete confirmation is the only thing tapping/clicking near a
  // moment can do now — never an implicit select.
  function requestDeleteMoment(index) {
    playSound("click");
    setPendingDeleteMomentIndex(index);
  }

  function cancelDeleteMoment() {
    playSound("click");
    setPendingDeleteMomentIndex(null);
  }

  function confirmDeleteMoment() {
    playSound("click");
    setMoments((currentMoments) =>
      currentMoments.filter((_, index) => index !== pendingDeleteMomentIndex)
    );
    setPendingDeleteMomentIndex(null);
  }

  function equipQueuedReward(reward) {
    // selectTheme/selectAvatar below already play their own click sound.
    if (reward.type === "chatbox") selectTheme(reward.id);
    if (reward.type === "avatar") selectAvatar(reward.id);
    setRewardUnlockQueue((current) => current.slice(1));
  }

  function dismissQueuedReward() {
    playSound("click");
    setRewardUnlockQueue((current) => current.slice(1));
  }

  function toggleSfx() {
    const next = !sfxOn;
    setSfxOn(next);
    setSoundEnabled(next);
    if (next) playSound("click");
  }

  function toggleBgm() {
    const next = !bgmOn;
    setBgmOn(next);
    // setBgmEnabled() persists the preference AND starts/stops the loop —
    // it calls initAudio() internally, and this is a real click handler so
    // the browser's autoplay policy allows audio to actually start here.
    setBgmEnabled(next, dayNight);
  }

  function handleSfxVolumeChange(event) {
    const next = Number(event.target.value) / 100;
    setSfxVolumeState(next);
    setSfxVolume(next);
  }

  function handleBgmVolumeChange(event) {
    const next = Number(event.target.value) / 100;
    setBgmVolumeState(next);
    setBgmVolume(next);
  }

  const currentUnlockToast = rewardUnlockQueue[0] ?? null;
  const sunriseGlow = activeAvatar?.worldTint === "sunrise";

  // Flattened view over journalState for the existing (pre-Phase-2) Journal
  // UI, which doesn't know about albums yet.
  const journalEntries = journalState.entries;
  const journalCustomization = journalState.albums[0]?.customization ?? DEFAULT_JOURNAL_CUSTOMIZATION;

  // Life Stats — derived fresh from moments + journalState on every render.
  // No storage, no API calls; see utils/lifeStats.js.
  const lifeStats = getLifeStats(moments, journalState);
  const mostCommonAdventure = getMostCommonAdventure(moments);
  const lifeObservation = getLifeObservation(lifeStats, mostCommonAdventure, moments);
  const lifeStatsCategoryBreakdown = getCategoryBreakdown(moments);

  return (
    <main
      className={`app app--env-${dayNight}${activeTheme ? ` ${activeTheme.className}` : ""}${
        sunriseGlow ? " app--sunrise-glow" : ""
      }`}
    >
      <PixelWorld themeId={activeTheme?.id} dayNight={dayNight} sunriseGlow={sunriseGlow} />

      <div className="app-content">
        <TopControls
          dayNight={dayNight}
          onToggleDayNight={toggleDayNight}
          showRewards={hasOnboarded}
          onOpenRewards={openRewardsDrawer}
          sfxOn={sfxOn}
          bgmOn={bgmOn}
          sfxVolume={sfxVolume}
          bgmVolume={bgmVolume}
          onToggleSfx={toggleSfx}
          onToggleBgm={toggleBgm}
          onSfxVolumeChange={handleSfxVolumeChange}
          onBgmVolumeChange={handleBgmVolumeChange}
          isSoundPopoverOpen={isSoundPopoverOpen}
          onToggleSoundPopover={() => setIsSoundPopoverOpen((current) => !current)}
          soundPopoverRef={soundPopoverRef}
          onOpenInfo={openInfoPanel}
        />

        {!hasOnboarded && (
          <WelcomePage
            activeAvatar={activeAvatar}
            companionMood={companionMood}
            onStart={handleWelcomeStart}
          />
        )}

        {hasOnboarded && isJournalOpen && (
          <Journal
            entries={journalEntries}
            customization={journalCustomization}
            level={levelProgress.level}
            activeAvatar={activeAvatar}
            companionMood={companionMood}
            onBack={closeJournal}
            onAddEntry={addJournalEntry}
            onUpdateEntry={updateJournalEntry}
            onDeleteEntry={deleteJournalEntry}
            onSetCustomization={setJournalCustomizationField}
          />
        )}

        {hasOnboarded && !isJournalOpen && isMomentHistoryOpen && (
          <MomentHistory
            moments={moments}
            onBack={closeMomentHistory}
            onRequestDelete={requestDeleteMoment}
          />
        )}

        {hasOnboarded && !isJournalOpen && !isMomentHistoryOpen && (
          <>
          <XpHud xp={xp} levelProgress={levelProgress} justGainedXp={justGainedXp} />

          {!activeAction && (
            <>
              <section className="hero">
                <div className="companion-stage companion-stage--hero">
                  <Companion avatar={activeAvatar} mood={companionMood} size="lg" />
                </div>

                <p className="eyebrow">GO HUMAN</p>
                <p className="tagline">An AI that helps you live outside the screen.</p>
                <h1>What's going on?</h1>
                <p className="subtitle">
                  Tell GO HUMAN what's happening. It will help you choose your next small move.
                </p>

                <textarea
                  className="pixel-input"
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setNextMove(null);
                    setError("");
                    setAnotherMoveError("");
                  }}
                  placeholder="Tell me what's up..."
                />

                <button
                  type="button"
                  className="pixel-btn pixel-btn--primary pixel-btn--wide"
                  onClick={createNextMove}
                  disabled={isThinking}
                >
                  {isThinking ? "GO HUMAN IS THINKING..." : "FIND MY NEXT MOVE"}
                </button>

                {error && <p className="error-message">{error}</p>}
              </section>

              <section className="quick-actions">
                <button
                  type="button"
                  className="pixel-btn quick-action"
                  onClick={() => choosePrompt("I need help focusing on my work.")}
                >
                  🎯 Focus
                </button>

                <button
                  type="button"
                  className="pixel-btn quick-action"
                  onClick={() => choosePrompt("I feel alone and want to connect with someone.")}
                >
                  🤝 Connect
                </button>

                <button
                  type="button"
                  className="pixel-btn quick-action"
                  onClick={() => choosePrompt("I feel tired and need to recharge.")}
                >
                  🌿 Recharge
                </button>
              </section>

              <AiResponse
                nextMove={nextMove}
                activeTheme={activeTheme}
                activeAvatar={activeAvatar}
                companionMood={companionMood}
                onStartAction={startAction}
                onAnotherMove={requestAnotherMove}
                isGeneratingAnotherMove={isGeneratingAnotherMove}
                anotherMoveError={anotherMoveError}
              />
            </>
          )}

            <ActionSession
              activeAction={activeAction}
              activeAvatar={activeAvatar}
              sparkleUnlocked={sparkleUnlocked}
              onToggle={toggleActionTimer}
              onGiveUp={giveUpAction}
              onExtend={extendActionTimer}
              onOutcome={reportOutcome}
              onMakeSmaller={makeActionSmaller}
              onTryAgain={tryActionAgain}
              onClose={closeActionSession}
              onSaveToJournal={saveActiveActionToJournal}
            />

          <div className="dashboard-cards">
            <DashboardCard
              icon={<PixelIcon pixels={BOOK_PIXELS} palette={BOOK_PALETTE} />}
              title="YOUR JOURNAL"
              subtitle="Keep the moments that matter."
              actionLabel="OPEN JOURNAL →"
              ariaLabel="Open Your Journal"
              onClick={openJournal}
              accent="journal"
            />

            <LifeStats onOpenLifeStats={openLifeStats} />
          </div>

          <Moments moments={moments} onOpenMomentHistory={openMomentHistory} />
          </>
        )}
      </div>

      {isInfoOpen && <InfoPanel onClose={closeInfoPanel} />}

      {/* Rendered at the app level (not inside the Dashboard-only block) so
          REWARDS opens correctly from Journal, Moment History, or any other
          view — not just the Dashboard. */}
      <RewardsPanel
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
        unlockedRewardIds={unlockedRewardIds}
        activeTheme={activeTheme}
        activeAvatar={activeAvatar}
        onSelectTheme={selectTheme}
        onSelectAvatar={selectAvatar}
      />

      {isLifeStatsOpen && (
        <LifeStatsPanel
          stats={lifeStats}
          mostCommonAdventure={mostCommonAdventure}
          observation={lifeObservation}
          categoryBreakdown={lifeStatsCategoryBreakdown}
          onClose={closeLifeStats}
        />
      )}

      {pendingDeleteMomentIndex !== null && (
        <ConfirmDeleteModal
          count={1}
          onCancel={cancelDeleteMoment}
          onConfirm={confirmDeleteMoment}
        />
      )}

      <LevelUpOverlay visible={showLevelUp} level={levelProgress.level} avatar={activeAvatar} />

      <RewardUnlockToast
        reward={currentUnlockToast}
        onEquip={() => currentUnlockToast && equipQueuedReward(currentUnlockToast)}
        onDismiss={dismissQueuedReward}
      />
    </main>
  );
}

export default App;