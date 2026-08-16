import { useEffect, useRef, useState } from "react";
import { DEFAULT_COMPANION } from "../utils/rewards";
import { playPetSound } from "../utils/sounds";

const PET_ANIMATION_MS = 650;

/**
 * The GO HUMAN companion. A single pixel-art creature that stays
 * consistent — cosmetics only add accessories/recolor it, they never
 * swap it out for a different character.
 *
 * mood: "idle" | "thinking" | "celebrate" | "levelup"
 *
 * Clicking/tapping the companion triggers a short, purely cosmetic "pet"
 * reaction (bounce + blush + a little sparkle) layered on top of whatever
 * mood is currently active. It never changes position, size, or the
 * underlying reward/mood system.
 */
function Companion({ avatar, mood = "idle", size = "md" }) {
  const skin = avatar ?? DEFAULT_COMPANION;
  const [isPetted, setIsPetted] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  function pet() {
    playPetSound();
    setIsPetted(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setIsPetted(false), PET_ANIMATION_MS);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pet();
    }
  }

  return (
    <div
      className={`companion companion--${size} companion--${mood}${isPetted ? " companion--petted" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Pet your GO HUMAN companion"
      onClick={pet}
      onKeyDown={handleKeyDown}
    >
      <div className="companion-shadow" />

      {skin.accessory === "sun" && <span className="companion-warm-halo" aria-hidden="true" />}

      <div
        className="companion-body"
        style={{
          "--companion-body": skin.body,
          "--companion-cheek": skin.cheeks,
        }}
      >
        <span className="companion-foot companion-foot--left" aria-hidden="true" />
        <span className="companion-foot companion-foot--right" aria-hidden="true" />
        {skin.accessory === "sun" && (
          <div className="companion-accessory companion-accessory--sun" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        )}

        {skin.accessory === "wings" && (
          <div className="companion-accessory companion-accessory--wings" aria-hidden="true">
            <span className="wing wing--left" />
            <span className="wing wing--right" />
          </div>
        )}

        {skin.accessory === "ears" && (
          <div className="companion-accessory companion-accessory--ears" aria-hidden="true">
            <span className="ear ear--left" />
            <span className="ear ear--right" />
          </div>
        )}

        {skin.accessory === "star" && (
          <div className="companion-accessory companion-accessory--star" aria-hidden="true">
            <span className="trail-star">★</span>
            <span className="trail-dot" />
            <span className="trail-dot" />
          </div>
        )}

        <div className="companion-face">
          <span className="companion-eye companion-eye--left" />
          <span className="companion-eye companion-eye--right" />
          <span className="companion-cheek companion-cheek--left" />
          <span className="companion-cheek companion-cheek--right" />
          <span className="companion-mouth" />
        </div>
      </div>

      {isPetted && (
        <span className="companion-pet-sparkle" aria-hidden="true">
          💗
        </span>
      )}
    </div>
  );
}

export default Companion;
