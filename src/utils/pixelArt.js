// Tiny CSS "pixel art" system used by the dashboard destination cards
// (Journal, Life Stats). Each icon is described as a flat list of
// { x, y, c } pixels, built from simple rectangle helpers so the shapes
// stay easy to read and tweak. buildPixelShadow() turns that list into a
// single multi-layer `box-shadow`, which lets PixelIcon render the whole
// illustration as ONE element — no images, no icon fonts/libraries — while
// staying crisp at any size via the --pixel-size custom property.

function rect(x0, y0, x1, y1, c) {
  const pixels = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      pixels.push({ x, y, c });
    }
  }
  return pixels;
}

function dot(x, y, c) {
  return [{ x, y, c }];
}

// Later layers win when two pixels share a position, so shapes can be
// drawn like paint: silhouette first, details layered on top.
function flatten(layers) {
  const byPosition = new Map();
  layers.flat().forEach((pixel) => {
    byPosition.set(`${pixel.x},${pixel.y}`, pixel);
  });
  return Array.from(byPosition.values());
}

export function buildPixelShadow(pixels, palette) {
  return pixels
    .map(({ x, y, c }) => {
      const color = palette[c];
      if (!color) return null;
      return `calc(var(--pixel-size, 4px) * ${x}) calc(var(--pixel-size, 4px) * ${y}) 0 0 ${color}`;
    })
    .filter(Boolean)
    .join(", ");
}

export function pixelGridSize(pixels) {
  const maxX = Math.max(...pixels.map((pixel) => pixel.x));
  const maxY = Math.max(...pixels.map((pixel) => pixel.y));
  return { cols: maxX + 1, rows: maxY + 1 };
}

// --- Journal: a closed pixel-art book with a ribbon bookmark ------------
export const BOOK_PIXELS = flatten([
  rect(1, 2, 10, 13, "B"), // outline silhouette
  rect(2, 3, 9, 12, "C"), // cover fill
  rect(4, 3, 4, 12, "S"), // spine crease
  rect(9, 3, 9, 12, "P"), // page edge peeking out
  rect(5, 0, 6, 1, "R"), // ribbon bookmark
]);

export const BOOK_PALETTE = {
  B: "var(--panel-border)",
  C: "#a1543a",
  S: "#7a3a26",
  P: "#f4e6c1",
  R: "var(--gold)",
};

// --- Life Stats: a small pixel-art bar chart with a sparkle -------------
export const STATS_PIXELS = flatten([
  rect(1, 2, 1, 11, "A"), // vertical axis
  rect(1, 12, 10, 12, "A"), // baseline
  rect(3, 9, 4, 11, "G"), // bar 1 (short)
  rect(6, 6, 7, 11, "K"), // bar 2 (medium)
  rect(9, 3, 10, 11, "H"), // bar 3 (tall)
  dot(11, 1, "T"), // sparkle
  dot(12, 2, "T"),
]);

export const STATS_PALETTE = {
  A: "var(--panel-border)",
  G: "var(--success)",
  K: "#4fb8dd",
  H: "#2f7ec7",
  T: "var(--gold)",
};