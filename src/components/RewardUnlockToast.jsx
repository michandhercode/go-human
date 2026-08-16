function RewardUnlockToast({ reward, onEquip, onDismiss }) {
  if (!reward) return null;

  const isEquippable = reward.type === "chatbox" || reward.type === "avatar";

  return (
    <div className="unlock-toast-backdrop">
      <div className="pixel-frame unlock-toast">
        <p className="unlock-toast-heading">★ NEW UNLOCK ★</p>
        <p className="unlock-toast-emoji" aria-hidden="true">
          {reward.emoji}
        </p>
        <p className="unlock-toast-name">{reward.name.toUpperCase()}</p>
        <p className="unlock-toast-desc">Your GO HUMAN world now has {reward.tagline}.</p>

        <div className="unlock-toast-buttons">
          {isEquippable && (
            <button type="button" className="pixel-btn pixel-btn--primary" onClick={onEquip}>
              EQUIP
            </button>
          )}
          <button type="button" className="pixel-btn" onClick={onDismiss}>
            {isEquippable ? "LATER" : "NICE"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RewardUnlockToast;
