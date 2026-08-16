import MomentCard from "./MomentCard";

const PREVIEW_COUNT = 3;

// Dashboard preview only — shows the most recent moments (moments[0] is
// newest, since App.jsx prepends new ones) and hands off to the full Moment
// History view for anything more, including delete. Nothing here is
// clickable/selectable; that was the old, unintentional-delete behavior.
function Moments({ moments, onOpenMomentHistory }) {
  const previewMoments = moments.slice(0, PREVIEW_COUNT);

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
            {previewMoments.map((moment, index) => (
              <MomentCard key={moment.completedAt ?? index} moment={moment} />
            ))}
          </div>

          <button
            type="button"
            className="pixel-btn pixel-btn--muted pixel-btn--wide moments-view-all-cta"
            onClick={onOpenMomentHistory}
          >
            VIEW ALL MOMENTS →
          </button>
        </>
      )}
    </section>
  );
}

export default Moments;