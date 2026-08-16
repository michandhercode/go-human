import { ACTION_XP } from "../utils/xp";
import { formatDateTime } from "../utils/time";

function Moments({ moments, selectedMomentIndexes, onToggleMoment, onRequestDelete }) {
  return (
    <section className="moments">
      <div className="moments-heading">
        <p className="eyebrow">🏆 YOUR MOMENTS</p>
        <span className="moments-count">{moments.length} COMPLETED</span>
      </div>

      {moments.length === 0 ? (
        <div className="pixel-frame empty-state">
          ✨ Complete a real-world action and it'll show up here — a little
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
                  className={`pixel-frame moment-card${isSelected ? " moment-card--selected" : ""}`}
                  key={index}
                  onClick={() => onToggleMoment(index)}
                >
                  <span className="moment-checkbox">{isSelected ? "☑" : "☐"}</span>

                  <div className="moment-content">
                    <div className="moment-top-row">
                      {moment.category && (
                        <span className="moment-badge moment-badge--category">{moment.category}</span>
                      )}
                      {moment.duration && <span className="moment-badge">{moment.duration} MIN</span>}
                      <span className="moment-badge moment-badge--xp">
                        +{moment.xpEarned ?? ACTION_XP} XP
                      </span>
                    </div>

                    <p className="moment-title">{moment.title ?? moment.action}</p>

                    {moment.description && <p className="moment-description">{moment.description}</p>}

                    {formattedDate && <p className="moment-date">{formattedDate}</p>}
                  </div>
                </article>
              );
            })}
          </div>

          {selectedMomentIndexes.length > 0 && (
            <div className="pixel-frame moments-delete-bar">
              <span>{selectedMomentIndexes.length} SELECTED</span>
              <button type="button" className="pixel-btn pixel-btn--danger" onClick={onRequestDelete}>
                🗑 DELETE {selectedMomentIndexes.length}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Moments;
