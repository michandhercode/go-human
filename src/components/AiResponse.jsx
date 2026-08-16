import { useEffect, useState } from "react";
import Companion from "./Companion";

function AiResponse({
  nextMove,
  activeTheme,
  activeAvatar,
  onStartAction,
  companionMood,
  onAnotherMove,
  isGeneratingAnotherMove,
  anotherMoveError,
}) {
  // Tracks which quest cards currently have their WHY THIS? explanation
  // open, keyed by option index. Reset whenever a new nextMove comes in
  // (including the brief null pass while a fresh one is loading) so a
  // reveal never carries over onto an unrelated quest card.
  const [openWhyIndexes, setOpenWhyIndexes] = useState({});

  useEffect(() => {
    setOpenWhyIndexes({});
  }, [nextMove]);

  if (!nextMove) return null;

  const bubbleStyle = activeTheme
    ? {
        "--bubble-bg": activeTheme.colors.bg,
        "--bubble-border": activeTheme.colors.border,
        "--bubble-accent": activeTheme.colors.accent,
      }
    : undefined;

  function toggleWhy(index) {
    setOpenWhyIndexes((current) => ({
      ...current,
      [index]: !current[index],
    }));
  }

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
          {nextMove.options?.map((option, index) => {
            const hasWhy = Boolean(option?.why);
            const isWhyOpen = hasWhy && Boolean(openWhyIndexes[index]);

            return (
              <article className="pixel-frame quest-card" key={index}>
                <p className="quest-label">QUEST {String(index + 1).padStart(2, "0")}</p>
                <h3>{option.title}</h3>
                <p className="quest-description">{option.description}</p>
                <span className="quest-duration">{option.duration} MIN</span>

                {hasWhy && (
                  <button
                    type="button"
                    className="quest-why-btn"
                    onClick={() => toggleWhy(index)}
                    aria-expanded={isWhyOpen}
                  >
                    {isWhyOpen ? "HIDE WHY" : "WHY THIS?"}
                  </button>
                )}

                {isWhyOpen && <p className="quest-why-text">{option.why}</p>}

                <button type="button" className="pixel-btn pixel-btn--primary" onClick={() => onStartAction(option)}>
                  GO DO IT ✨
                </button>
              </article>
            );
          })}
        </div>

        <div className="another-move-section">
          <button
            type="button"
            className="pixel-btn pixel-btn--muted pixel-btn--wide"
            onClick={onAnotherMove}
            disabled={isGeneratingAnotherMove}
          >
            {isGeneratingAnotherMove ? "THINKING OF ANOTHER ONE..." : "↻ GIVE ME ANOTHER MOVE"}
          </button>

          {anotherMoveError && <p className="error-message another-move-error">{anotherMoveError}</p>}
        </div>
      </div>
    </section>
  );
}

export default AiResponse;