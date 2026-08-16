import { useState } from "react";
import { readImageAsDataUrl } from "../utils/journal";

const MOOD_CHIPS = ["😊 Happy", "💪 Proud", "😌 Calm", "🌱 Growing", "🎉 Excited", "🧡 Grateful"];

function toDateInputValue(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

/**
 * Shared create/edit form for both Journal entry types.
 *
 * Quest entries: title/category/xp/date come from the quest itself and stay
 * read-only here — only the note, photo, and sticker are editable.
 * Real-life Moments: note, photo, date, and mood/category are all editable.
 */
function JournalEditor({ entry, stickerOptions, onSave, onDelete, onClose }) {
  const isEditing = Boolean(entry);
  const isQuestEntry = entry?.type === "quest";

  const [note, setNote] = useState(entry?.note ?? "");
  const [category, setCategory] = useState(isQuestEntry ? "" : entry?.category ?? "");
  const [date, setDate] = useState(toDateInputValue(entry?.date));
  const [sticker, setSticker] = useState(entry?.sticker ?? null);
  const [photo, setPhoto] = useState(entry?.photo ?? null);
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

  function handleSubmit(event) {
    event.preventDefault();
    if (!isQuestEntry && !note.trim() && !photo) {
      setError("Add a quick note or a photo so future-you remembers this one. 💛");
      return;
    }

    onSave({
      note: note.trim(),
      photo,
      sticker,
      ...(isQuestEntry ? {} : { category: category.trim(), date: new Date(date).getTime() || Date.now() }),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-frame modal journal-editor"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={isEditing ? "Edit journal entry" : "Add a moment"}
      >
        <p className="modal-title">{isEditing ? "EDIT ENTRY" : "+ ADD MOMENT"}</p>

        <form className="journal-editor-form" onSubmit={handleSubmit}>
          {isQuestEntry && (
            <div className="journal-editor-quest-info">
              <span className="journal-card-badge">
                {entry.icon ?? "✨"} {(entry.category ?? entry.title ?? "").toUpperCase()}
              </span>
              {typeof entry.xpEarned === "number" && (
                <span className="journal-card-badge journal-card-badge--xp">+{entry.xpEarned} XP</span>
              )}
            </div>
          )}

          <label className="journal-field-label" htmlFor="journal-note">
            {isQuestEntry ? "NOTE" : "WHAT HAPPENED?"}
          </label>
          <textarea
            id="journal-note"
            className="pixel-input journal-editor-textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={isQuestEntry ? "Say a bit about it..." : "Got coffee with my best friend."}
            rows={3}
          />

          {!isQuestEntry && (
            <>
              <label className="journal-field-label" htmlFor="journal-category">
                MOOD / CATEGORY (OPTIONAL)
              </label>
              <input
                id="journal-category"
                className="pixel-input"
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="e.g. Grateful"
              />
              <div className="journal-mood-chips">
                {MOOD_CHIPS.map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    className={`journal-chip${category === chip ? " journal-chip--active" : ""}`}
                    onClick={() => setCategory((current) => (current === chip ? "" : chip))}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <label className="journal-field-label" htmlFor="journal-date">
                DATE
              </label>
              <input
                id="journal-date"
                className="pixel-input"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </>
          )}

          <label className="journal-field-label">PHOTO (OPTIONAL)</label>
          {photo ? (
            <div className="journal-editor-photo-preview">
              <img src={photo} alt="" />
              <button type="button" className="pixel-btn pixel-btn--danger" onClick={() => setPhoto(null)}>
                REMOVE PHOTO
              </button>
            </div>
          ) : (
            <label className="pixel-btn journal-photo-upload-btn">
              {isProcessingPhoto ? "PROCESSING..." : "📸 ADD PHOTO"}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isProcessingPhoto}
                hidden
              />
            </label>
          )}

          {stickerOptions.length > 0 && (
            <>
              <label className="journal-field-label">STICKER (OPTIONAL)</label>
              <div className="journal-sticker-picker">
                {stickerOptions.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    className={`journal-sticker-option${sticker === emoji ? " journal-sticker-option--active" : ""}`}
                    onClick={() => setSticker((current) => (current === emoji ? null : emoji))}
                    aria-label={`Sticker ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <p className="error-message">{error}</p>}

          <div className="journal-editor-buttons">
            <button type="submit" className="pixel-btn pixel-btn--primary" disabled={isProcessingPhoto}>
              {isEditing ? "SAVE CHANGES" : "SAVE TO JOURNAL"}
            </button>
            <button type="button" className="pixel-btn pixel-btn--muted" onClick={onClose}>
              CANCEL
            </button>
          </div>

          {isEditing && (
            <button type="button" className="pixel-btn pixel-btn--danger journal-editor-delete" onClick={onDelete}>
              🗑 DELETE ENTRY
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default JournalEditor;
