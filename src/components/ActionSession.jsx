import { ACTION_XP } from "../utils/xp";
import Companion from "./Companion";

function ActionSession({ activeAction, activeAvatar, sparkleUnlocked, onToggle, onGiveUp, onFinish }) {
  if (!activeAction) return null;

  const sessionMinutes = String(Math.floor(activeAction.secondsLeft / 60)).padStart(2, "0");
  const sessionSeconds = String(activeAction.secondsLeft % 60).padStart(2, "0");

  if (!activeAction.isDone) {
    return (
      <section className="pixel-frame action-session">
        <p className="quest-label">🎯 {activeAction.title.toUpperCase()}</p>
        <p className="action-description">{activeAction.description}</p>
        <p className="session-timer">
          {sessionMinutes}:{sessionSeconds}
        </p>

        <div className="session-buttons">
          <button type="button" className="pixel-btn" onClick={onToggle}>
            {activeAction.isRunning ? "PAUSE" : "RESUME"}
          </button>

          <button type="button" className="pixel-btn pixel-btn--danger" onClick={onGiveUp}>
            GIVE UP
          </button>
        </div>

        <p className="session-hint">
          Go do the thing. You can leave the app — we'll notify you when time's up.
        </p>
      </section>
    );
  }

  return (
    <section className={`pixel-frame action-session action-session--done${sparkleUnlocked ? " has-sparkle" : ""}`}>
      <div className="companion-stage companion-stage--celebrate">
        <Companion avatar={activeAvatar} mood="celebrate" size="sm" />
      </div>
      <p className="celebrate">🎉 YOU DID THE THING</p>
      <p className="done-title">{activeAction.title}</p>
      <p className="xp-preview">+{ACTION_XP} XP</p>

      <button type="button" className="pixel-btn pixel-btn--primary" onClick={onFinish}>
        NICE, I'M DONE ✨
      </button>
    </section>
  );
}

export default ActionSession;
