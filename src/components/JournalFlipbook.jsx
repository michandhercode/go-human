import { useEffect, useState } from "react";
import { formatDateTime } from "../utils/time";

/**
 * Renders one journal entry as a single physical-looking page. Reused for
 * both the settled base page and the front/back faces of the page that's
 * mid-flip, so all three always render identical markup for a given entry.
 */
function FlipbookPageContent({ entry, frameId }) {
  if (!entry) return null;
  const formattedDate = formatDateTime(entry.date);

  return (
    <div className="flipbook-page-content">
      <p className="flipbook-page-date">{formattedDate ?? "UNDATED"}</p>

      {entry.photo && (
        <div className={`journal-photo journal-photo--${frameId} flipbook-page-photo`}>
          <img src={entry.photo} alt="" />
        </div>
      )}

      {entry.note ? (
        <p className="flipbook-page-note">"{entry.note}"</p>
      ) : (
        <p className="flipbook-page-note flipbook-page-note--empty">No note for this one.</p>
      )}

      <div className="flipbook-page-footer">
        <span className="journal-card-badge">
          {entry.icon ?? "✨"} {(entry.category ?? entry.title ?? "MOMENT").toUpperCase()}
        </span>
        {typeof entry.xpEarned === "number" && (
          <span className="journal-card-badge journal-card-badge--xp">+{entry.xpEarned} XP</span>
        )}
      </div>

      {entry.sticker && (
        <span className="flipbook-page-sticker" aria-hidden="true">
          {entry.sticker}
        </span>
      )}
    </div>
  );
}

/**
 * A small retro/pixel diary the user can flip through, one existing Journal
 * entry per page. Purely a new presentation layer over the existing
 * `entries` array/data model — no new fields, no new storage, no changes to
 * how entries are created, edited, or deleted.
 */
function JournalFlipbook({ entries, frameId, onClose }) {
  const [index, setIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState(null); // null | "next" | "prev"
  const [flipActive, setFlipActive] = useState(false);

  const total = entries.length;
  const targetIndex = flipDirection === "next" ? index + 1 : flipDirection === "prev" ? index - 1 : index;
  const isAnimating = flipDirection !== null;

  // Two rAFs so the browser paints the un-rotated frame first, then
  // transitions to the rotated frame on the next frame — otherwise React
  // can apply both the initial and final transform in the same paint and
  // the page would just snap instead of turning.
  useEffect(() => {
    if (!flipDirection) return undefined;
    // flipActive is already false here (reset in handleFlipTransitionEnd /
    // initial state), so this effect only needs to schedule turning it on
    // one frame later, which is what triggers the CSS transition.
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFlipActive(true));
    });
    return () => cancelAnimationFrame(raf1);
  }, [flipDirection]);

  function goNext() {
    if (isAnimating || index >= total - 1) return;
    setFlipDirection("next");
  }

  function goPrev() {
    if (isAnimating || index <= 0) return;
    setFlipDirection("prev");
  }

  function handleFlipTransitionEnd(event) {
    if (event.target !== event.currentTarget) return;
    if (!flipDirection) return;
    setIndex(targetIndex);
    setFlipDirection(null);
    setFlipActive(false);
  }

  const settledEntry = entries[targetIndex] ?? entries[index];
  const currentEntry = entries[index];

  return (
    <div className="rewards-drawer-backdrop" onClick={onClose}>
      <div
        className="pixel-frame rewards-drawer journal-flipbook-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Journal flipbook"
      >
        <div className="rewards-drawer-header">
          <p className="eyebrow rewards-drawer-title">📖 FLIPBOOK</p>
          <button type="button" className="pixel-btn pixel-btn--muted rewards-drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {total === 0 ? (
          <div className="flipbook-empty">
            <p className="flipbook-empty-text">
              No moments to flip through yet.
              <br />
              Add one, then come back and page through it here.
            </p>
          </div>
        ) : (
          <>
            <div className="flipbook-stage">
              <div className="flipbook-page flipbook-page--base">
                <FlipbookPageContent entry={settledEntry} frameId={frameId} />
              </div>

              {isAnimating && (
                <div
                  className={`flipbook-page flipbook-page--flip flipbook-page--flip-${flipDirection}${
                    flipActive ? " flipbook-page--flip-active" : ""
                  }`}
                  onTransitionEnd={handleFlipTransitionEnd}
                >
                  <div className="flipbook-page-face flipbook-page-face--front">
                    <FlipbookPageContent entry={currentEntry} frameId={frameId} />
                  </div>
                  <div className="flipbook-page-face flipbook-page-face--back">
                    <FlipbookPageContent entry={entries[targetIndex]} frameId={frameId} />
                  </div>
                </div>
              )}
            </div>

            <div className="flipbook-controls">
              <button
                type="button"
                className="pixel-btn flipbook-nav-btn"
                onClick={goPrev}
                disabled={isAnimating || index <= 0}
              >
                ← PREVIOUS
              </button>
              <p className="flipbook-position">
                {index + 1} / {total}
              </p>
              <button
                type="button"
                className="pixel-btn flipbook-nav-btn"
                onClick={goNext}
                disabled={isAnimating || index >= total - 1}
              >
                NEXT →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default JournalFlipbook;