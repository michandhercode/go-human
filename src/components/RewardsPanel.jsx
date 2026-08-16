import { ALL_REWARDS } from "../utils/rewards";

function RewardsPanel({ unlockedRewardIds, activeTheme, activeAvatar, onSelectTheme, onSelectAvatar }) {
  return (
    <section className="rewards">
      <p className="eyebrow">🎁 REWARDS</p>
      <p className="rewards-caption">Unlocked automatically as you level up from doing real things.</p>

      <div className="rewards-grid">
        {ALL_REWARDS.map((reward) => {
          const isUnlocked = unlockedRewardIds.includes(reward.id);
          const isEquippable = reward.type === "chatbox" || reward.type === "avatar";
          const isActive =
            (reward.type === "chatbox" && activeTheme?.id === reward.id) ||
            (reward.type === "avatar" && activeAvatar?.id === reward.id);

          function handleClick() {
            if (!isUnlocked) return;
            if (reward.type === "chatbox") onSelectTheme(reward.id);
            if (reward.type === "avatar") onSelectAvatar(reward.id);
          }

          return (
            <button
              key={reward.id}
              type="button"
              className={`item-slot${isUnlocked ? " item-slot--unlocked" : " item-slot--locked"}${
                isActive ? " item-slot--active" : ""
              }`}
              disabled={!isUnlocked || !isEquippable}
              onClick={handleClick}
            >
              {isActive && <span className="item-slot-equipped">✓</span>}
              <span className="item-slot-emoji">{isUnlocked ? reward.emoji : "🔒"}</span>
              <span className="item-slot-name">{reward.name}</span>
              <span className="item-slot-status">
                {isUnlocked
                  ? isEquippable
                    ? isActive
                      ? "EQUIPPED"
                      : "TAP TO EQUIP"
                    : "UNLOCKED ✓"
                  : `LV. ${reward.unlockLevel}`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default RewardsPanel;
