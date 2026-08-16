function PixelWorld({ themeId }) {
  return (
    <div className={`pixel-world${themeId ? ` pixel-world--${themeId}` : ""}`} aria-hidden="true">
      <div className="pixel-world-stars">
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={index} className={`star star-${index % 5}`} />
        ))}
      </div>
      <div className="pixel-world-clouds">
        <span className="cloud cloud-1" />
        <span className="cloud cloud-2" />
      </div>
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
