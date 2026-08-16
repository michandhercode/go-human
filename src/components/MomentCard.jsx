import { ACTION_XP } from "../utils/xp";
import { formatDateTime } from "../utils/time";

// Single source of truth for how a Moment renders. Used read-only on the
// dashboard preview (no onDelete) and with a delete affordance inside the
// full Moment History view (onDelete supplied). The card itself has no
// onClick — selecting/deleting is never triggered by tapping the card.
function MomentCard({ moment, onDelete }) {
  const formattedDate = formatDateTime(moment.completedAt);

  return (
    <article className="pixel-frame moment-card">
      <div className="moment-content">
        <div className="moment-top-row">
          {moment.category && (
            <span className="moment-badge moment-badge--category">{moment.category}</span>
          )}
          {moment.duration && <span className="moment-badge">{moment.duration} MIN</span>}
          <span className="moment-badge moment-badge--xp">
            +{moment.xpEarned ?? ACTION_XP} XP
          </span>
          {moment.outcome && (
            <span
              className={`moment-badge moment-badge--outcome moment-badge--outcome-${
                moment.outcome === "Progress" ? "progress" : "completed"
              }`}
            >
              {moment.outcome === "Progress" ? "🌱 PROGRESS" : "✨ COMPLETED"}
            </span>
          )}
        </div>

        <p className="moment-title">{moment.title ?? moment.action}</p>

        {moment.description && <p className="moment-description">{moment.description}</p>}

        {formattedDate && <p className="moment-date">{formattedDate}</p>}
      </div>

      {onDelete && (
        <button
          type="button"
          className="moment-delete-btn"
          onClick={onDelete}
          aria-label="Delete this moment"
        >
          🗑
        </button>
      )}
    </article>
  );
}

export default MomentCard;