function LifeStatsPanel({ stats, mostCommonAdventure, observation, categoryBreakdown, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-frame modal life-stats-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="pixel-btn pixel-btn--muted life-stats-back-btn" onClick={onClose}>
          ← DASHBOARD
        </button>

        <p className="modal-title">✦ YOUR LIFE LATELY ✦</p>

        <div className="life-stats-modal-body">
          <ul className="life-stats-list">
            <li>
              <span className="life-stats-icon">🌱</span>
              <span className="life-stats-label">Things you tried</span>
              <span className="life-stats-value">{stats.thingsTried}</span>
            </li>
            <li>
              <span className="life-stats-icon">🤝</span>
              <span className="life-stats-label">People you connected with</span>
              <span className="life-stats-value">{stats.peopleConnected}</span>
            </li>
            <li>
              <span className="life-stats-icon">🏃</span>
              <span className="life-stats-label">Things you did outside</span>
              <span className="life-stats-value">{stats.thingsOutside}</span>
            </li>
            <li>
              <span className="life-stats-icon">📖</span>
              <span className="life-stats-label">Memories captured</span>
              <span className="life-stats-value">{stats.memoriesCaptured}</span>
            </li>
          </ul>

          {mostCommonAdventure ? (
            <div className="life-stats-adventure">
              <p className="life-stats-adventure-label">MOST COMMON ADVENTURE</p>
              <p className="life-stats-adventure-value">
                {mostCommonAdventure.emoji} {mostCommonAdventure.label}
              </p>
              {observation && <p className="life-stats-observation">"{observation}"</p>}
            </div>
          ) : (
            <div className="life-stats-empty">
              <p className="life-stats-empty-title">YOUR ADVENTURES ARE JUST BEGINNING</p>
              <p className="life-stats-empty-body">
                Complete a few small quests and GO HUMAN will start noticing your patterns.
              </p>
            </div>
          )}

          {categoryBreakdown.length > 0 && (
            <div className="life-stats-breakdown">
              <p className="life-stats-adventure-label">BY CATEGORY</p>
              <ul className="life-stats-breakdown-list">
                {categoryBreakdown.map((row) => (
                  <li key={row.category}>
                    <span>
                      {row.emoji} {row.label}
                    </span>
                    <span>{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button type="button" className="pixel-btn pixel-btn--primary pixel-btn--wide" onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
}

export default LifeStatsPanel;