"""Generates the PWA icons (PNG) from the same geometry as public/favicon.svg.

Usage: python scripts/generate_icons.py   (requires Pillow)
"""

from pathlib import Path

from PIL import Image, ImageDraw

BACKGROUND = (59, 91, 219)  # --accent, light theme
FOREGROUND = (255, 255, 255)
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "icons"

# A small network of "neurons" on a 100×100 canvas: nodes and the links between them.
NODES: list[tuple[float, float]] = [(30, 34), (70, 30), (50, 56), (28, 72), (72, 70)]
LINKS: list[tuple[int, int]] = [(0, 1), (0, 2), (1, 2), (2, 3), (2, 4), (3, 4)]


def draw_icon(size: int, safe_zone: float) -> Image.Image:
    """Draws the icon; `safe_zone` shrinks the drawing (maskable icons keep content in the central 80 %)."""
    scale = 4  # supersampling for smooth edges
    canvas = size * scale
    image = Image.new("RGB", (canvas, canvas), BACKGROUND)
    draw = ImageDraw.Draw(image)
    unit = canvas / 100 * safe_zone
    offset = canvas * (1 - safe_zone) / 2

    def point(index: int) -> tuple[float, float]:
        x, y = NODES[index]
        return offset + x * unit, offset + y * unit

    for a, b in LINKS:
        draw.line([point(a), point(b)], fill=FOREGROUND, width=round(5 * unit))
    for i in range(len(NODES)):
        x, y = point(i)
        r = (9 if i == 2 else 7) * unit
        draw.ellipse([x - r, y - r, x + r, y + r], fill=FOREGROUND)
    return image.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    outputs: dict[str, Image.Image] = {
        "icon-192.png": draw_icon(192, 0.9),
        "icon-512.png": draw_icon(512, 0.9),
        "icon-maskable-512.png": draw_icon(512, 0.7),
        "apple-touch-icon.png": draw_icon(180, 0.85),
    }
    for name, image in outputs.items():
        image.save(OUT_DIR / name, optimize=True)
        print(f"wrote {OUT_DIR / name}")


if __name__ == "__main__":
    main()
