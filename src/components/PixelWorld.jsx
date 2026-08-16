/**
 * The living background behind GO HUMAN.
 *
 * Two visual layers combine here, on purpose:
 *  - dayNight ("day" | "night") — the base environment/lighting. Always on,
 *    never a reward.
 *  - themeId — the equipped chatbox/world reward (nature, night owl, retro,
 *    golden hour). Adds its own world identity on top of the lighting.
 */
function PixelWorld({ themeId, dayNight = "day", sunriseGlow = false }) {
  const isNight = dayNight === "night";

  return (
    <div
      className={`pixel-world pixel-world--env-${dayNight}${themeId ? ` pixel-world--${themeId}` : ""}${
        sunriseGlow ? " pixel-world--sunrise-glow" : ""
      }`}
      aria-hidden="true"
    >
      <div className="pixel-world-stars">
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={index} className={`star star-${index % 5}`} />
        ))}
      </div>

      {!isNight && (
        <div className="pixel-world-sun">
          <span className="sun-glow" />
        </div>
      )}

      {isNight && (
        <div className="pixel-world-moon">
          <span className="moon-crater moon-crater-1" />
          <span className="moon-crater moon-crater-2" />
        </div>
      )}

      {/* Sunrise Mode companion cosmetic — a noticeable warm lighting effect
          that never overrides an equipped World Theme underneath it. */}
      {sunriseGlow && !isNight && (
        <div className="pixel-world-sun-rays" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} className="sun-ray" style={{ "--ray-index": index }} />
          ))}
        </div>
      )}
      {sunriseGlow && <div className="pixel-world-horizon-glow" aria-hidden="true" />}

      <div className="pixel-world-clouds">
        <span className="cloud cloud-1" />
        <span className="cloud cloud-2" />
      </div>

      {themeId === "nature" && (
        <div className="pixel-world-leaves">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className={`leaf leaf-${index % 3}`} />
          ))}
        </div>
      )}

      {themeId === "retro" && (
        <div className="pixel-world-retro-grid" />
      )}

      {themeId === "golden" && (
        <div className="pixel-world-golden-particles">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} className={`golden-mote golden-mote-${index % 4}`} />
          ))}
        </div>
      )}

      <div className="pixel-world-ground">
        <div className="ground-strip" />
        <div className="ground-tufts">
          {Array.from({ length: 10 }).map((_, index) => (
            <span key={index} className="tuft" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PixelWorld;
