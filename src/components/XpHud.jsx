function XpHud({ xp, levelProgress, justGainedXp }) {
  return (
    <section className="pixel-frame hud-card">
      <div className="hud-top">
        <div>
          <p className="eyebrow">YOUR GROWTH</p>
          <strong className="hud-level">LV. {String(levelProgress.level).padStart(2, "0")}</strong>
        </div>
        <span className={`hud-xp-chip${justGainedXp ? " hud-xp-chip--pulse" : ""}`}>{xp} XP</span>
      </div>

      <div className="hud-bar-track" role="progressbar" aria-valuenow={levelProgress.progressPercent} aria-valuemin={0} aria-valuemax={100}>
        <div className="hud-bar-segments" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className="hud-bar-fill" style={{ width: `${levelProgress.progressPercent}%` }} />
      </div>

      <p className="hud-caption">
        {levelProgress.isMaxLevel
          ? "MAX LEVEL — MORE QUESTS COMING SOON 🎉"
          : `${levelProgress.xpToNextLevel} XP TO LEVEL ${levelProgress.level + 1}`}
      </p>
    </section>
  );
}

export default XpHud;
