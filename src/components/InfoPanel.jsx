function InfoPanel({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-frame modal info-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="modal-title">WHAT IS GO HUMAN?</p>

        <div className="info-modal-body">
          <p>
            GO HUMAN is a tiny companion for when your brain has too many tabs
            open. Tell it what's going on, and it hands you back one small,
            doable next move instead of a whole plan.
          </p>

          <h3>🧭 Next move</h3>
          <p>
            Type whatever's on your mind. GO HUMAN turns it into one small
            action you can actually start right now, with a short timer to
            keep it low-pressure.
          </p>

          <h3>🔎 Make It Smaller</h3>
          <p>
            If even that feels like too much, tap "Make It Smaller" and GO
            HUMAN will shrink it down into something easier to start.
          </p>

          <h3>⭐ XP &amp; levels</h3>
          <p>
            Finishing or making progress on a move earns XP. Collect enough
            and you level up — no streaks to break, no pressure to keep up.
          </p>

          <h3>🎁 Rewards</h3>
          <p>
            Leveling up unlocks cosmetics for your companion and new world
            themes. Open the Reward Closet any time to equip what you've
            earned.
          </p>

          <h3>☀️ Day / Night</h3>
          <p>
            Switch the world's lighting to match how you're feeling, or just
            what time it is where you are.
          </p>

          <h3>🔊 Sound</h3>
          <p>
            Music and sound effects are independent — mute either one, or
            adjust their volume, from the SOUND control.
          </p>
        </div>

        <button type="button" className="pixel-btn pixel-btn--primary pixel-btn--wide" onClick={onClose}>
          GOT IT
        </button>
      </div>
    </div>
  );
}

export default InfoPanel;
