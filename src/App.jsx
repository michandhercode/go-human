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
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import LevelUpOverlay from "./components/LevelUpOverlay";
import RewardUnlockToast from "./components/RewardUnlockToast";
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

  const [selectedMomentIndexes, setSelectedMomentIndexes] = useState([]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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

  function toggleMomentSelected(index) {
    playSound("click");
    setSelectedMomentIndexes((current) =>
      current.includes(index)
        ? current.filter((selectedIndex) => selectedIndex !== index)
        : [...current, index]
    );
  }

  function deleteSelectedMoments() {
    playSound("click");
    setMoments((currentMoments) =>
      currentMoments.filter((_, index) => !selectedMomentIndexes.includes(index))
    );
    setSelectedMomentIndexes([]);
    setIsConfirmingDelete(false);
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

  return (
    <main
      className={`app app--env-${dayNight}${activeTheme ? ` ${activeTheme.className}` : ""}${
        sunriseGlow ? " app--sunrise-glow" : ""
      }`}
    >
      <PixelWorld themeId={activeTheme?.id} dayNight={dayNight} sunriseGlow={sunriseGlow} />

      <div className="app-content">
        <div className="top-controls">
          <button
            type="button"
            className="icon-toggle-btn"
            onClick={toggleDayNight}
            aria-label={dayNight === "day" ? "Switch to Night mode" : "Switch to Day mode"}
          >
            {dayNight === "day" ? "☀️ DAY" : "🌙 NIGHT"}
          </button>

          <button
            type="button"
            className="icon-toggle-btn rewards-trigger"
            onClick={openRewardsDrawer}
            aria-label="Open Reward Closet"
          >
            🎁 REWARDS
          </button>

          <div className="sound-popover-wrapper" ref={soundPopoverRef}>
            <button
              type="button"
              className={`icon-toggle-btn sound-toggle-btn${
                sfxOn || bgmOn ? "" : " sound-toggle-btn--off"
              }`}
              onClick={() => setIsSoundPopoverOpen((current) => !current)}
              aria-label="Sound settings"
              aria-expanded={isSoundPopoverOpen}
            >
              {sfxOn || bgmOn ? "🔊" : "🔇"} SOUND
            </button>

            {isSoundPopoverOpen && (
              <div className="sound-popover pixel-frame">
                <div className="sound-row">
                  <span className="sound-row-label">🎵 BGM</span>
                  <input
                    type="range"
                    className="sound-slider"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(bgmVolume * 100)}
                    onChange={handleBgmVolumeChange}
                    disabled={!bgmOn}
                    style={{ "--sound-fill": `${Math.round(bgmVolume * 100)}%` }}
                    aria-label="Music volume"
                  />
                  <span className="sound-volume-value">{Math.round(bgmVolume * 100)}%</span>
                  <button
                    type="button"
                    className={`sound-mute-btn${bgmOn ? "" : " sound-mute-btn--off"}`}
                    onClick={toggleBgm}
                    aria-label={bgmOn ? "Mute music" : "Unmute music"}
                    aria-pressed={bgmOn}
                  >
                    {bgmOn ? "🔊" : "🔇"}
                  </button>
                </div>

                <div className="sound-row">
                  <span className="sound-row-label">✨ SFX</span>
                  <input
                    type="range"
                    className="sound-slider"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(sfxVolume * 100)}
                    onChange={handleSfxVolumeChange}
                    disabled={!sfxOn}
                    style={{ "--sound-fill": `${Math.round(sfxVolume * 100)}%` }}
                    aria-label="Sound effects volume"
                  />
                  <span className="sound-volume-value">{Math.round(sfxVolume * 100)}%</span>
                  <button
                    type="button"
                    className={`sound-mute-btn${sfxOn ? "" : " sound-mute-btn--off"}`}
                    onClick={toggleSfx}
                    aria-label={sfxOn ? "Mute sound effects" : "Unmute sound effects"}
                    aria-pressed={sfxOn}
                  >
                    {sfxOn ? "🔊" : "🔇"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <XpHud xp={xp} levelProgress={levelProgress} justGainedXp={justGainedXp} />

        <RewardsPanel
          isOpen={isRewardsOpen}
          onClose={() => setIsRewardsOpen(false)}
          unlockedRewardIds={unlockedRewardIds}
          activeTheme={activeTheme}
          activeAvatar={activeAvatar}
          onSelectTheme={selectTheme}
          onSelectAvatar={selectAvatar}
        />

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
        />

        <Moments
          moments={moments}
          selectedMomentIndexes={selectedMomentIndexes}
          onToggleMoment={toggleMomentSelected}
          onRequestDelete={() => {
            playSound("click");
            setIsConfirmingDelete(true);
          }}
        />
      </div>

      {isConfirmingDelete && (
        <ConfirmDeleteModal
          count={selectedMomentIndexes.length}
          onCancel={() => {
            playSound("click");
            setIsConfirmingDelete(false);
          }}
          onConfirm={deleteSelectedMoments}
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
