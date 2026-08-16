// Renders pixel-art data (see utils/pixelArt.js) as a single element using
// a layered box-shadow — crisp square pixels at any size, with no images
// or icon fonts. Sizing is controlled entirely by the --pixel-size custom
// property (set in App.css, incl. per-breakpoint), so the illustration
// scales responsively without any recalculation here. Purely decorative —
// the dashboard card it lives in already carries the accessible name.
import { buildPixelShadow, pixelGridSize } from "../utils/pixelArt";

function PixelIcon({ pixels, palette, className = "" }) {
  const { cols, rows } = pixelGridSize(pixels);
  const boxShadow = buildPixelShadow(pixels, palette);

  return (
    <span
      className={`pixel-icon ${className}`.trim()}
      aria-hidden="true"
      style={{
        width: `calc(var(--pixel-size, 4px) * ${cols})`,
        height: `calc(var(--pixel-size, 4px) * ${rows})`,
      }}
    >
      <span
        className="pixel-icon-pixel"
        style={{
          width: "var(--pixel-size, 4px)",
          height: "var(--pixel-size, 4px)",
          boxShadow,
        }}
      />
    </span>
  );
}

export default PixelIcon;