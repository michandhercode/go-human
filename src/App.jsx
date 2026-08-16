import { useEffect, useState } from "react";
import "./App.css";
import { getLevelProgress, ACTION_XP } from "./utils/xp";
import { CHATBOX_THEMES, AVATARS, ALL_REWARDS } from "./utils/rewards";
import { now, formatDateTime } from "./utils/time";

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

  const sessionMinutes = activeAction
    ? String(Math.floor(activeAction.secondsLeft / 60)).padStart(2, "0")
    : "00";
  const sessionSeconds = activeAction
    ? String(activeAction.secondsLeft % 60).padStart(2, "0")
    : "00";

  const bubbleStyle = activeTheme
    ? {
        "--bubble-bg": activeTheme.colors.bg,
        "--bubble-border": activeTheme.colors.border,
        "--bubble-accent": activeTheme.colors.accent,
      }
    : undefined;

  return (
    <main className="app">
      <section className="progress-card">
        <div className="progress-top">
          <div>
            <p className="eyebrow">YOUR GROWTH</p>
            <strong>Level {levelProgress.level}</strong>
          </div>
          <span>{xp} XP</span>
        </div>

        <div className="xp-bar-track">
          <div
            className="xp-bar-fill"
            style={{ width: `${levelProgress.progressPercent}%` }}
          />
        </div>

        <p className="xp-bar-caption">
          {levelProgress.isMaxLevel
            ? "Max level for now — more coming soon 🎉"
            : `${levelProgress.xpToNextLevel} XP to Level ${levelProgress.level + 1}`}
        </p>
      </section>

      <section className="rewards">
        <p className="eyebrow">🎁 REWARDS</p>
        <p className="rewards-caption">
          Unlocked automatically as you level up from doing real things.
        </p>

        <div className="rewards-grid">
          {ALL_REWARDS.map((reward) => {
            const isUnlocked = unlockedRewardIds.includes(reward.id);
            const isEquippable = reward.type === "chatbox" || reward.type === "avatar";
            const isActive =
              (reward.type === "chatbox" && activeTheme?.id === reward.id) ||
              (reward.type === "avatar" && activeAvatar?.id === reward.id);

            function handleClick() {
              if (!isUnlocked) return;
              if (reward.type === "chatbox") selectTheme(reward.id);
              if (reward.type === "avatar") selectAvatar(reward.id);
            }

            return (
              <button
                key={reward.id}
                type="button"
                className={`reward-card${isUnlocked ? " reward-card--unlocked" : " reward-card--locked"}${
                  isActive ? " reward-card--active" : ""
                }`}
                disabled={!isUnlocked || !isEquippable}
                onClick={handleClick}
              >
                <span className="reward-emoji">{isUnlocked ? reward.emoji : "🔒"}</span>
                <span className="reward-name">{reward.name}</span>
                <span className="reward-status">
                  {isUnlocked
                    ? isEquippable
                      ? isActive
                        ? "Equipped"
                        : "Tap to equip"
                      : "Unlocked ✓"
                    : `Level ${reward.unlockLevel}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {!activeAction && (
        <>
          <section className="hero">
            <p className="eyebrow">GO HUMAN</p>
            <p className="tagline">
              An AI that helps you live outside the screen.
            </p>
            <h1>What’s going on?</h1>
            <p className="subtitle">
              Tell GO HUMAN what’s happening. It will help you choose your next
              small move.
            </p>

            <textarea
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setNextMove(null);
                setError("");
              }}
              placeholder="Tell me what’s up..."
            />

            <button type="button" onClick={createNextMove} disabled={isThinking}>
              {isThinking ? "GO HUMAN is thinking..." : "Find my next move"}
            </button>

            {error && <p className="error-message">{error}</p>}
          </section>

          <section className="quick-actions">
            <button
              type="button"
              onClick={() => choosePrompt("I need help focusing on my work.")}
            >
              🎯 Focus
            </button>

            <button
              type="button"
              onClick={() =>
                choosePrompt("I feel alone and want to connect with someone.")
              }
            >
              🤝 Connect
            </button>

            <button
              type="button"
              onClick={() => choosePrompt("I feel tired and need to recharge.")}
            >
              🌿 Recharge
            </button>
          </section>

          {nextMove && (
            <section className="ai-response">
              <div className="ai-bubble" style={bubbleStyle}>
                <p className="eyebrow">
                  {activeAvatar ? activeAvatar.emoji : "💬"} GO HUMAN · {nextMove.category}
                </p>
                <p className="ai-message">{nextMove.message}</p>
              </div>

              <div className="options-section">
                <p className="options-heading">WHAT DO YOU WANNA DO?</p>

                <div className="options-grid">
                  {nextMove.options?.map((option, index) => (
                    <article className="option-card" key={index}>
                      <h3>{option.title}</h3>
                      <p>{option.description}</p>
                      <span className="option-duration">{option.duration} MIN</span>

                      <button type="button" onClick={() => startAction(option)}>
                        Start
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {activeAction && !activeAction.isDone && (
        <section className="action-session">
          <p className="eyebrow">🎯 {activeAction.title.toUpperCase()}</p>
          <p className="action-description">{activeAction.description}</p>
          <p className="session-timer">
            {sessionMinutes}:{sessionSeconds}
          </p>

          <div className="session-buttons">
            <button type="button" onClick={toggleActionTimer}>
              {activeAction.isRunning ? "Pause" : "Resume"}
            </button>

            <button type="button" className="giveup-button" onClick={giveUpAction}>
              Give up
            </button>
          </div>

          <p className="session-hint">
            Go do the thing. You can leave the app — we’ll notify you when
            time’s up.
          </p>
        </section>
      )}

      {activeAction && activeAction.isDone && (
        <section
          className={`action-session action-session--done${
            sparkleUnlocked ? " has-sparkle" : ""
          }`}
        >
          <p className="celebrate">🎉 YOU DID THE THING</p>
          <p className="done-title">{activeAction.title}</p>
          <p className="xp-preview">+{ACTION_XP} XP</p>

          <button type="button" onClick={finishAction}>
            Nice, I’m done ✨
          </button>
        </section>
      )}

      <section className="moments">
        <div className="moments-heading">
          <p className="eyebrow">YOUR MOMENTS</p>
          <span>{moments.length} completed</span>
        </div>

        {moments.length === 0 ? (
          <div className="empty-state">
            ✨ Complete a real-world action and it’ll show up here — a little
            collection of the things you actually did.
          </div>
        ) : (
          <>
            <div className="moments-list">
              {moments.map((moment, index) => {
                const isSelected = selectedMomentIndexes.includes(index);
                const formattedDate = formatDateTime(moment.completedAt);

                return (
                  <article
                    className={`moment-card${isSelected ? " moment-card--selected" : ""}`}
                    key={index}
                    onClick={() => toggleMomentSelected(index)}
                  >
                    <span className="moment-checkbox">{isSelected ? "☑" : "☐"}</span>

                    <div className="moment-content">
                      <div className="moment-top-row">
                        {moment.category && (
                          <span className="moment-badge moment-badge--category">
                            {moment.category}
                          </span>
                        )}
                        {moment.duration && (
                          <span className="moment-badge">{moment.duration} MIN</span>
                        )}
                        <span className="moment-badge moment-badge--xp">
                          +{moment.xpEarned ?? ACTION_XP} XP
                        </span>
                      </div>

                      <p className="moment-title">{moment.title ?? moment.action}</p>

                      {moment.description && (
                        <p className="moment-description">{moment.description}</p>
                      )}

                      {formattedDate && <p className="moment-date">{formattedDate}</p>}
                    </div>
                  </article>
                );
              })}
            </div>

            {selectedMomentIndexes.length > 0 && (
              <div className="moments-delete-bar">
                <span>{selectedMomentIndexes.length} selected</span>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  🗑 Delete {selectedMomentIndexes.length}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {isConfirmingDelete && (
        <div className="modal-backdrop" onClick={() => setIsConfirmingDelete(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <p className="modal-title">Delete these moments?</p>
            <p className="modal-body">This can’t be undone.</p>

            <div className="modal-buttons">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-delete"
                onClick={deleteSelectedMoments}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
