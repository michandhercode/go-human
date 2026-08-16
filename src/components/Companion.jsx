import { DEFAULT_COMPANION } from "../utils/rewards";

/**
 * The GO HUMAN companion. A single pixel-art creature that stays
 * consistent — cosmetics only add accessories/recolor it, they never
 * swap it out for a different character.
 *
 * mood: "idle" | "thinking" | "celebrate" | "levelup"
 */
function Companion({ avatar, mood = "idle", size = "md" }) {
  const skin = avatar ?? DEFAULT_COMPANION;

  return (
    <div className={`companion companion--${size} companion--${mood}`}>
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
    </div>
  );
}

export default Companion;
