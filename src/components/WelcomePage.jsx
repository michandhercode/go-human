import Companion from "./Companion";

/**
 * The FIRST-TIME hook screen only. Shown once, before the onboarding flag is
 * set — see App.jsx. It intentionally does NOT try to explain everything;
 * that's what the ⓘ info panel is for. This screen just needs to make a new
 * user curious enough to tap LET'S GO.
 */
function WelcomePage({ activeAvatar, companionMood, onStart }) {
  return (
    <section className="welcome">
      <div className="companion-stage companion-stage--hero welcome-avatar">
        <Companion avatar={activeAvatar} mood={companionMood} size="xl" />
      </div>

      <p className="eyebrow welcome-logo">GO HUMAN</p>

      <p className="welcome-hook">
        You don't need to do everything.
        <br />
        Just figure out what to do next.
      </p>

      <button
        type="button"
        className="pixel-btn pixel-btn--primary pixel-btn--wide welcome-cta"
        onClick={onStart}
      >
        LET'S GO →
      </button>

      <p className="welcome-subline">No pressure. No perfect plan. Just one next move.</p>
    </section>
  );
}

export default WelcomePage;
