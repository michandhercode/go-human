import {
  JOURNAL_COVERS,
  JOURNAL_PAGE_THEMES,
  JOURNAL_FRAMES,
  JOURNAL_STICKER_PACKS,
} from "../utils/journal";

function CustomizeSlot({ preset, isUnlocked, isActive, onEquip }) {
  return (
    <li
      className={`item-slot${isUnlocked ? " item-slot--unlocked" : " item-slot--locked"}${
        isActive ? " item-slot--active" : ""
      }`}
    >
      {isActive && <span className="item-slot-equipped">✓</span>}
      <span className="item-slot-emoji">{isUnlocked ? preset.emoji : "🔒"}</span>
      <span className="item-slot-name">{preset.name}</span>

      {isUnlocked ? (
        <button
          type="button"
          className={`item-slot-equip-btn${isActive ? " item-slot-equip-btn--active" : ""}`}
          onClick={onEquip}
        >
          {isActive ? "EQUIPPED" : "EQUIP"}
        </button>
      ) : (
        <span className="item-slot-status">LV. {preset.unlockLevel}</span>
      )}
    </li>
  );
}

function JournalCustomize({ isOpen, onClose, customization, level, onSelect }) {
  if (!isOpen) return null;

  const sections = [
    { field: "cover", label: "📖 JOURNAL COVER", presets: JOURNAL_COVERS },
    { field: "theme", label: "🎨 PAGE THEME", presets: JOURNAL_PAGE_THEMES },
    { field: "frame", label: "🖼️ PHOTO FRAME", presets: JOURNAL_FRAMES },
    {
      field: "stickerPack",
      label: "✨ STICKER PACK",
      presets: JOURNAL_STICKER_PACKS.map((pack) => ({ ...pack, emoji: pack.stickers[0] })),
    },
  ];

  return (
    <div className="rewards-drawer-backdrop" onClick={onClose}>
      <div
        className="pixel-frame rewards-drawer journal-customize-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Customize Journal"
      >
        <div className="rewards-drawer-header">
          <p className="eyebrow rewards-drawer-title">🎨 CUSTOMIZE JOURNAL</p>
          <button type="button" className="pixel-btn pixel-btn--muted rewards-drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="rewards-caption">New covers, pages, frames &amp; stickers unlock as you level up.</p>

        {sections.map((section) => (
          <div className="rewards-section" key={section.field}>
            <p className="rewards-section-label">{section.label}</p>
            <ul className="rewards-grid">
              {section.presets.map((preset) => (
                <CustomizeSlot
                  key={preset.id}
                  preset={preset}
                  isUnlocked={level >= preset.unlockLevel}
                  isActive={customization[section.field] === preset.id}
                  onEquip={() => onSelect(section.field, preset.id)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default JournalCustomize;
