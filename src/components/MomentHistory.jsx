import MomentCard from "./MomentCard";

// Full history — every existing Moment, reusing the exact same `moments`
// state/array App.jsx already has (no duplicate storage). `index` passed to
// onRequestDelete is the index within the FULL moments array (this
// component never receives a sliced/preview list), matching how App.jsx's
// delete-by-index logic already works.
function MomentHistory({ moments, onBack, onRequestDelete }) {
  return (
    <section className="moment-history">
      <button type="button" className="pixel-btn moment-history-back-btn" onClick={onBack}>
        ← BACK TO GO HUMAN
      </button>

      <header className="moment-history-header">
        <p className="eyebrow moment-history-header-eyebrow">🏆 ALL MOMENTS</p>
        <p className="moment-history-tagline">Every real-world thing you've actually done.</p>
        <span className="moments-count">{moments.length} COMPLETED</span>
      </header>

      {moments.length === 0 ? (
        <div className="pixel-frame empty-state">
          ✨ Complete a real-world action and it'll show up here — a little
          collection of the things you actually did.
        </div>
      ) : (
        <div className="moments-list">
          {moments.map((moment, index) => (
            <MomentCard
              key={moment.completedAt ?? index}
              moment={moment}
              onDelete={() => onRequestDelete(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default MomentHistory;