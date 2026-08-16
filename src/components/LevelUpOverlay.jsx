import Companion from "./Companion";

function LevelUpOverlay({ visible, level, avatar }) {
  if (!visible) return null;

  return (
    <div className="levelup-overlay" role="status" aria-live="polite">
      <div className="levelup-card pixel-frame">
        <div className="levelup-sparkles" aria-hidden="true">
          <span>✦</span>
          <span>✧</span>
          <span>✦</span>
          <span>✧</span>
        </div>
        <Companion avatar={avatar} mood="levelup" size="sm" />
        <p className="levelup-title">LEVEL UP!</p>
        <p className="levelup-level">You reached Level {level}</p>
      </div>
    </div>
  );
}

export default LevelUpOverlay;
