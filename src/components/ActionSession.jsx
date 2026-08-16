import { useState } from "react";
import { calculateOutcomeXp } from "../utils/xp";
import { readImageAsDataUrl } from "../utils/journal";
import Companion from "./Companion";

/**
 * Small inline "want to remember this?" prompt shown after a quest is
 * reported done/in-progress. Entirely optional — skipping it (by just
 * tapping the existing close button) leaves XP/reward logic untouched.
 */
function SaveToJournalPrompt({ onSave }) {
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState("");

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsProcessingPhoto(true);
    setError("");
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setPhoto(dataUrl);
    } catch (err) {
      setError(err.message || "Could not use that photo.");
    } finally {
      setIsProcessingPhoto(false);
    }
  }

  return (
    <div className="journal-quest-prompt">
      <p className="journal-quest-prompt-question">Want to remember this?</p>

      <div className="journal-quest-prompt-toggles">
        <button
          type="button"
          className={`pixel-btn journal-chip${showPhotoInput ? " journal-chip--active" : ""}`}
          onClick={() => setShowPhotoInput((current) => !current)}
        >
          📸 ADD PHOTO
        </button>
        <button
          type="button"
          className={`pixel-btn journal-chip${showNoteInput ? " journal-chip--active" : ""}`}
          onClick={() => setShowNoteInput((current) => !current)}
        >
          ✏️ ADD NOTE
        </button>
      </div>

      {showNoteInput && (
        <textarea
          className="pixel-input journal-editor-textarea"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="I actually went for a run today."
          rows={2}
        />
      )}

      {showPhotoInput &&
        (photo ? (
          <div className="journal-editor-photo-preview journal-editor-photo-preview--inline">
            <img src={photo} alt="" />
            <button type="button" className="pixel-btn pixel-btn--danger" onClick={() => setPhoto(null)}>
              REMOVE
            </button>
          </div>
        ) : (
          <label className="pixel-btn journal-photo-upload-btn">
            {isProcessingPhoto ? "PROCESSING..." : "CHOOSE A PHOTO"}
            <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={isProcessingPhoto} hidden />
          </label>
        ))}

      {error && <p className="error-message">{error}</p>}

      <button
        type="button"
        className="pixel-btn pixel-btn--primary journal-quest-prompt-save"
        onClick={() => onSave({ note, photo })}
        disabled={isProcessingPhoto}
      >
        📖 SAVE TO JOURNAL
      </button>
    </div>
  );
}

function ActionSession({
  activeAction,
  activeAvatar,
  sparkleUnlocked,
  onToggle,
  onGiveUp,
  onExtend,
  onOutcome,
  onMakeSmaller,
  onTryAgain,
  onClose,
  onSaveToJournal,
}) {
  if (!activeAction) return null;

  // SaveToJournalPrompt keeps its own draft note/photo/toggle state. Keying
  // it on the values that identify "a genuinely new commitment" (fresh
  // quest, "try again", or "make it smaller") makes React remount it —
  // and therefore reset that draft state — automatically, with no extra
  // state or effect needed here.
  const journalPromptKey = `${activeAction.title}-${activeAction.optionSeconds}`;

  const sessionMinutes = String(Math.floor(activeAction.secondsLeft / 60)).padStart(2, "0");
  const sessionSeconds = String(activeAction.secondsLeft % 60).padStart(2, "0");
  const committedMinutes = Math.max(1, Math.round(activeAction.totalSeconds / 60));
  const xpForCommitment = activeAction.optionSeconds / 60;

  // --- Phase 1: the commitment window is still running (or paused). ---
  if (!activeAction.isDone) {
    return (
      <section className="pixel-frame action-session">
        <p className="quest-label">🎯 GO TIME</p>
        <p className="action-title">{activeAction.title}</p>
        <p className="action-description">{activeAction.description}</p>
        <p className="session-hint session-hint--commitment">
          Give it {committedMinutes} {committedMinutes === 1 ? "minute" : "minutes"}. You don't have to
          finish everything.
        </p>

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

  // --- Phase 2: timer hit zero, but nothing has been confirmed yet. ---
  if (activeAction.isDone && !activeAction.outcome) {
    return (
      <section className="pixel-frame action-session action-session--outcome">
        <p className="quest-label">⏰ TIME'S UP</p>
        <p className="action-title">{activeAction.title}</p>
        <p className="outcome-question">How did it go?</p>

        <div className="outcome-buttons">
          <button
            type="button"
            className="pixel-btn pixel-btn--primary"
            onClick={() => onOutcome("done")}
          >
            I DID IT ✨
          </button>

          <button
            type="button"
            className="pixel-btn pixel-btn--success"
            onClick={() => onOutcome("progress")}
          >
            I MADE SOME PROGRESS 🌱
          </button>

          <button
            type="button"
            className="pixel-btn pixel-btn--muted"
            onClick={() => onOutcome("notReally")}
          >
            NOT REALLY
          </button>
        </div>

        <button type="button" className="pixel-btn pixel-btn--extend" onClick={onExtend}>
          KEEP GOING +5 MIN
        </button>
      </section>
    );
  }

  // --- Phase 3a: "Not really" — supportive, no shame, offer a next step. ---
  if (activeAction.outcome === "notReally") {
    return (
      <section className="pixel-frame action-session action-session--not-really">
        <div className="companion-stage companion-stage--celebrate">
          <Companion avatar={activeAvatar} mood="idle" size="sm" />
        </div>

        <p className="not-really-message">No worries. Maybe that step was too big.</p>

        {activeAction.isGeneratingSmaller ? (
          <p className="session-hint">GO HUMAN is thinking of something smaller...</p>
        ) : (
          <div className="not-really-buttons">
            <button type="button" className="pixel-btn pixel-btn--primary" onClick={onMakeSmaller}>
              MAKE IT SMALLER
            </button>
            <button type="button" className="pixel-btn" onClick={onTryAgain}>
              TRY AGAIN
            </button>
            <button type="button" className="pixel-btn pixel-btn--muted" onClick={onClose}>
              I'M DONE FOR NOW
            </button>
          </div>
        )}

        {activeAction.smallerError && <p className="error-message">{activeAction.smallerError}</p>}
      </section>
    );
  }

  // --- Phase 3b: "I DID IT" — full completion, full XP. ---
  if (activeAction.outcome === "done") {
    return (
      <section className={`pixel-frame action-session action-session--done${sparkleUnlocked ? " has-sparkle" : ""}`}>
        <div className="companion-stage companion-stage--celebrate">
          <Companion avatar={activeAvatar} mood="celebrate" size="sm" />
        </div>
        <p className="celebrate">Nice. You actually showed up. ✨</p>
        <p className="done-title">{activeAction.title}</p>
        <p className="xp-preview">+{calculateOutcomeXp(xpForCommitment, "done")} XP</p>

        {activeAction.journalSaved ? (
          <p className="journal-saved-note">📖 Saved to your Journal</p>
        ) : (
          <SaveToJournalPrompt key={journalPromptKey} onSave={onSaveToJournal} />
        )}

        <button type="button" className="pixel-btn pixel-btn--primary" onClick={onClose}>
          NICE, I'M DONE ✨
        </button>
      </section>
    );
  }

  // --- Phase 3c: "I MADE SOME PROGRESS" — partial, honest credit. ---
  if (activeAction.outcome === "progress") {
    return (
      <section className={`pixel-frame action-session action-session--done action-session--progress${sparkleUnlocked ? " has-sparkle" : ""}`}>
        <div className="companion-stage companion-stage--celebrate">
          <Companion avatar={activeAvatar} mood="celebrate" size="sm" />
        </div>
        <p className="celebrate">That still counts. Progress is progress. 🌱</p>
        <p className="done-title">{activeAction.title}</p>
        <p className="xp-preview">+{calculateOutcomeXp(xpForCommitment, "progress")} XP</p>

        {activeAction.journalSaved ? (
          <p className="journal-saved-note">📖 Saved to your Journal</p>
        ) : (
          <SaveToJournalPrompt key={journalPromptKey} onSave={onSaveToJournal} />
        )}

        <button type="button" className="pixel-btn pixel-btn--primary" onClick={onClose}>
          OKAY, I'M DONE ✨
        </button>
      </section>
    );
  }

  return null;
}

export default ActionSession;
