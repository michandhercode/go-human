import Companion from "./Companion";

function AiResponse({ nextMove, activeTheme, activeAvatar, onStartAction, companionMood }) {
  if (!nextMove) return null;

  const bubbleStyle = activeTheme
    ? {
        "--bubble-bg": activeTheme.colors.bg,
        "--bubble-border": activeTheme.colors.border,
        "--bubble-accent": activeTheme.colors.accent,
      }
    : undefined;

  return (
    <section className="ai-response">
      <div className="companion-stage">
        <Companion avatar={activeAvatar} mood={companionMood} size="md" />
      </div>

      <div className={`pixel-frame ai-bubble${activeTheme ? ` ${activeTheme.className}` : ""}`} style={bubbleStyle}>
        <p className="eyebrow ai-bubble-eyebrow">GO HUMAN · {nextMove.category}</p>
        <p className="ai-message">{nextMove.message}</p>
      </div>

      <div className="options-section">
        <p className="options-heading">WHAT DO YOU WANNA DO?</p>

        <div className="options-grid">
          {nextMove.options?.map((option, index) => (
            <article className="pixel-frame quest-card" key={index}>
              <p className="quest-label">QUEST {String(index + 1).padStart(2, "0")}</p>
              <h3>{option.title}</h3>
              <p className="quest-description">{option.description}</p>
              <span className="quest-duration">{option.duration} MIN</span>

              <button type="button" className="pixel-btn pixel-btn--primary" onClick={() => onStartAction(option)}>
                GO DO IT ✨
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AiResponse;
