function LifeStats({ stats, mostCommonAdventure, observation, onOpenLifeStats }) {
  return (
    <section className="life-stats">
      <p className="eyebrow life-stats-eyebrow">✦ YOUR LIFE LATELY ✦</p>

      <div className="pixel-frame life-stats-card">
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

        <div className="life-stats-divider" />

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

        <button
          type="button"
          className="pixel-btn pixel-btn--muted pixel-btn--wide life-stats-cta"
          onClick={onOpenLifeStats}
        >
          VIEW LIFE STATS →
        </button>
      </div>
    </section>
  );
}

export default LifeStats;