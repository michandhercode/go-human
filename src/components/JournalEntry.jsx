import { formatDateTime } from "../utils/time";

function JournalEntry({ entry, frameId, onOpen }) {
  const formattedDate = formatDateTime(entry.date);

  return (
    <article
      className={`journal-card journal-card--${frameId}${entry.type === "quest" ? " journal-card--quest" : ""}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      {entry.sticker && (
        <span className="journal-card-sticker" aria-hidden="true">
          {entry.sticker}
        </span>
      )}

      <p className="journal-card-kicker">{entry.type === "quest" ? "✨ TODAY'S WIN" : "📌 A MOMENT"}</p>

      {entry.photo && (
        <div className={`journal-photo journal-photo--${frameId}`}>
          <img src={entry.photo} alt="" />
        </div>
      )}

      {entry.note && <p className="journal-card-note">"{entry.note}"</p>}

      <div className="journal-card-footer">
        <span className="journal-card-badge">
          {entry.icon ?? "✨"} {(entry.category ?? entry.title ?? "MOMENT").toUpperCase()}
        </span>
        {typeof entry.xpEarned === "number" && (
          <span className="journal-card-badge journal-card-badge--xp">+{entry.xpEarned} XP</span>
        )}
      </div>

      {formattedDate && <p className="journal-card-date">{formattedDate}</p>}
    </article>
  );
}

export default JournalEntry;
