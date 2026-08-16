/**
 * Shared top-controls bar. Used on BOTH the first-time welcome page and the
 * main app so Day/Night, Sound, and the ⓘ info button behave identically in
 * both places. `showRewards` is the only thing that differs between them —
 * the welcome page stays concise and skips the Reward Closet entry point.
 */
function TopControls({
  dayNight,
  onToggleDayNight,
  showRewards = true,
  onOpenRewards,
  sfxOn,
  bgmOn,
  sfxVolume,
  bgmVolume,
  onToggleSfx,
  onToggleBgm,
  onSfxVolumeChange,
  onBgmVolumeChange,
  isSoundPopoverOpen,
  onToggleSoundPopover,
  soundPopoverRef,
  onOpenInfo,
}) {
  return (
    <div className="top-controls">
      <button
        type="button"
        className="icon-toggle-btn"
        onClick={onToggleDayNight}
        aria-label={dayNight === "day" ? "Switch to Night mode" : "Switch to Day mode"}
      >
        {dayNight === "day" ? "☀️ DAY" : "🌙 NIGHT"}
      </button>

      {showRewards && (
        <button
          type="button"
          className="icon-toggle-btn rewards-trigger"
          onClick={onOpenRewards}
          aria-label="Open Reward Closet"
        >
          🎁 REWARDS
        </button>
      )}

      <div className="sound-popover-wrapper" ref={soundPopoverRef}>
        <button
          type="button"
          className={`icon-toggle-btn sound-toggle-btn${
            sfxOn || bgmOn ? "" : " sound-toggle-btn--off"
          }`}
          onClick={onToggleSoundPopover}
          aria-label="Sound settings"
          aria-expanded={isSoundPopoverOpen}
        >
          {sfxOn || bgmOn ? "🔊" : "🔇"} SOUND
        </button>

        {isSoundPopoverOpen && (
          <div className="sound-popover pixel-frame">
            <div className="sound-row">
              <span className="sound-row-label">🎵 BGM</span>
              <input
                type="range"
                className="sound-slider"
                min="0"
                max="100"
                step="1"
                value={Math.round(bgmVolume * 100)}
                onChange={onBgmVolumeChange}
                disabled={!bgmOn}
                style={{ "--sound-fill": `${Math.round(bgmVolume * 100)}%` }}
                aria-label="Music volume"
              />
              <span className="sound-volume-value">{Math.round(bgmVolume * 100)}%</span>
              <button
                type="button"
                className={`sound-mute-btn${bgmOn ? "" : " sound-mute-btn--off"}`}
                onClick={onToggleBgm}
                aria-label={bgmOn ? "Mute music" : "Unmute music"}
                aria-pressed={bgmOn}
              >
                {bgmOn ? "🔊" : "🔇"}
              </button>
            </div>

            <div className="sound-row">
              <span className="sound-row-label">✨ SFX</span>
              <input
                type="range"
                className="sound-slider"
                min="0"
                max="100"
                step="1"
                value={Math.round(sfxVolume * 100)}
                onChange={onSfxVolumeChange}
                disabled={!sfxOn}
                style={{ "--sound-fill": `${Math.round(sfxVolume * 100)}%` }}
                aria-label="Sound effects volume"
              />
              <span className="sound-volume-value">{Math.round(sfxVolume * 100)}%</span>
              <button
                type="button"
                className={`sound-mute-btn${sfxOn ? "" : " sound-mute-btn--off"}`}
                onClick={onToggleSfx}
                aria-label={sfxOn ? "Mute sound effects" : "Unmute sound effects"}
                aria-pressed={sfxOn}
              >
                {sfxOn ? "🔊" : "🔇"}
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="icon-toggle-btn info-toggle-btn"
        onClick={onOpenInfo}
        aria-label="What is GO HUMAN?"
      >
        ⓘ ABOUT
      </button>
    </div>
  );
}

export default TopControls;