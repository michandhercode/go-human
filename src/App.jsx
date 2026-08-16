import { useEffect, useRef, useState } from "react";
import "./App.css";
import { getLevelProgress, ACTION_XP } from "./utils/xp";
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
    if (!activeAction?.isDone) return;

    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    try {
      new Notification("GO HUMAN", {
        body: "Nice. You did the thing. ✨",
      });
    } catch {
      // Notifications are best-effort; ignore failures.
    }
  }, [activeAction?.isDone]);

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

    const rewardsToQueue = newlyUnlocked
      .map((id) => ALL_REWARDS.find((reward) => reward.id === id))
      .filter(Boolean);

    setRewardUnlockQueue((current) => [...current, ...rewardsToQueue]);
    setSeenRewardIds((current) => [...current, ...newlyUnlocked]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedRewardIds.join(",")]);

  function choosePrompt(prompt) {
    setMessage(prompt);
    setNextMove(null);
    setError("");
  }

  async function createNextMove() {
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
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const totalSeconds = Math.max(1, Math.round(option.duration * 60));

    setActiveAction({
      category: nextMove.category,
      title: option.title,
      description: option.description,
      totalSeconds,
      secondsLeft: totalSeconds,
      isRunning: true,
      isDone: false,
    });
  }

  function toggleActionTimer() {
    setActiveAction((current) =>
      current ? { ...current, isRunning: !current.isRunning } : current
    );
  }

  function giveUpAction() {
    setActiveAction(null);
  }

  function finishAction() {
    if (!activeAction) return;

    const moment = {
      category: activeAction.category,
      title: activeAction.title,
      description: activeAction.description,
      duration: Math.round(activeAction.totalSeconds / 60),
      xpEarned: ACTION_XP,
      completedAt: now(),
    };

    setMoments((currentMoments) => [moment, ...currentMoments]);
    setXp((currentXp) => currentXp + ACTION_XP);
    setActiveAction(null);
    setNextMove(null);
    setMessage("");

    setCompanionMood("celebrate");
    setJustGainedXp(true);
    setTimeout(() => setCompanionMood("idle"), 1400);
    setTimeout(() => setJustGainedXp(false), 900);
  }

  function selectTheme(themeId) {
    setSelectedThemeId((current) => (current === themeId ? null : themeId));
  }

  function selectAvatar(avatarId) {
    setSelectedAvatarId((current) => (current === avatarId ? null : avatarId));
  }

  function toggleMomentSelected(index) {
    setSelectedMomentIndexes((current) =>
      current.includes(index)
        ? current.filter((selectedIndex) => selectedIndex !== index)
        : [...current, index]
    );
  }

  function deleteSelectedMoments() {
    setMoments((currentMoments) =>
      currentMoments.filter((_, index) => !selectedMomentIndexes.includes(index))
    );
    setSelectedMomentIndexes([]);
    setIsConfirmingDelete(false);
  }

  function equipQueuedReward(reward) {
    if (reward.type === "chatbox") selectTheme(reward.id);
    if (reward.type === "avatar") selectAvatar(reward.id);
    setRewardUnlockQueue((current) => current.slice(1));
  }

  function dismissQueuedReward() {
    setRewardUnlockQueue((current) => current.slice(1));
  }

  const currentUnlockToast = rewardUnlockQueue[0] ?? null;

  return (
    <main className={`app${activeTheme ? ` ${activeTheme.className}` : ""}`}>
      <PixelWorld themeId={activeTheme?.id} />

      <div className="app-content">
        <XpHud xp={xp} levelProgress={levelProgress} justGainedXp={justGainedXp} />

        <RewardsPanel
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
          onFinish={finishAction}
        />

        <Moments
          moments={moments}
          selectedMomentIndexes={selectedMomentIndexes}
          onToggleMoment={toggleMomentSelected}
          onRequestDelete={() => setIsConfirmingDelete(true)}
        />
      </div>

      {isConfirmingDelete && (
        <ConfirmDeleteModal
          count={selectedMomentIndexes.length}
          onCancel={() => setIsConfirmingDelete(false)}
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
