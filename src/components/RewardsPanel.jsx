import { ALL_REWARDS } from "../utils/rewards";

const SECTION_LABELS = {
  chatbox: "🌍 WORLD THEMES",
  avatar: "🎀 COMPANION COSMETICS",
  effect: "✨ EFFECTS",
};

function RewardSlot({ reward, isUnlocked, isActive, isEquippable, onEquip }) {
  return (
    <li
      className={`item-slot${isUnlocked ? " item-slot--unlocked" : " item-slot--locked"}${
        isActive ? " item-slot--active" : ""
      }`}
    >
      {isActive && <span className="item-slot-equipped">✓</span>}
      <span className="item-slot-emoji">{isUnlocked ? reward.emoji : "🔒"}</span>
      <span className="item-slot-name">{reward.name}</span>

      {isUnlocked ? (
        isEquippable ? (
          <button
            type="button"
            className={`item-slot-equip-btn${isActive ? " item-slot-equip-btn--active" : ""}`}
            onClick={onEquip}
          >
            {isActive ? "EQUIPPED" : "EQUIP"}
          </button>
        ) : (
          <span className="item-slot-status">UNLOCKED ✓</span>
        )
      ) : (
        <span className="item-slot-status">LV. {reward.unlockLevel}</span>
      )}
    </li>
  );
}

function RewardsPanel({
  isOpen,
  onClose,
  unlockedRewardIds,
  activeTheme,
  activeAvatar,
  onSelectTheme,
  onSelectAvatar,
}) {
  if (!isOpen) return null;

  const grouped = {
    chatbox: ALL_REWARDS.filter((reward) => reward.type === "chatbox"),
    avatar: ALL_REWARDS.filter((reward) => reward.type === "avatar"),
    effect: ALL_REWARDS.filter((reward) => reward.type === "effect"),
  };

  function isRewardActive(reward) {
    return (
      (reward.type === "chatbox" && activeTheme?.id === reward.id) ||
      (reward.type === "avatar" && activeAvatar?.id === reward.id)
    );
  }

  function equip(reward) {
    if (reward.type === "chatbox") onSelectTheme(reward.id);
    if (reward.type === "avatar") onSelectAvatar(reward.id);
  }

  return (
    <div className="rewards-drawer-backdrop" onClick={onClose}>
      <div
        className="pixel-frame rewards-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Reward Closet"
      >
        <div className="rewards-drawer-header">
          <p className="eyebrow rewards-drawer-title">🎁 REWARD CLOSET</p>
          <button type="button" className="pixel-btn pixel-btn--muted rewards-drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="rewards-equipped-row">
          <div className="rewards-equipped-chip">
            <span className="rewards-equipped-label">WORLD</span>
            <span className="rewards-equipped-value">
              {activeTheme ? `${activeTheme.emoji} ${activeTheme.name}` : "☀️ Daylight (default)"}
            </span>
          </div>
          <div className="rewards-equipped-chip">
            <span className="rewards-equipped-label">COMPANION</span>
            <span className="rewards-equipped-value">
              {activeAvatar ? `${activeAvatar.emoji} ${activeAvatar.name}` : "Default"}
            </span>
          </div>
        </div>

        <p className="rewards-caption">Unlocked automatically as you level up from doing real things.</p>

        {["chatbox", "avatar", "effect"].map((type) => (
          <div className="rewards-section" key={type}>
            <p className="rewards-section-label">{SECTION_LABELS[type]}</p>
            <ul className="rewards-grid">
              {grouped[type].map((reward) => (
                <RewardSlot
                  key={reward.id}
                  reward={reward}
                  isUnlocked={unlockedRewardIds.includes(reward.id)}
                  isActive={isRewardActive(reward)}
                  isEquippable={reward.type === "chatbox" || reward.type === "avatar"}
                  onEquip={() => equip(reward)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RewardsPanel;
