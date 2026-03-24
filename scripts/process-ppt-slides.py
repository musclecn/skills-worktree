from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SLIDES_DIR = ROOT / "public" / "ppt-slides"


def build_highlight(size: tuple[int, int], opacity: int) -> Image.Image:
    width, height = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0))

    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    glow_draw = Image.new("L", size, 0)

    ellipse_box = (
        int(width * -0.12),
        int(height * -0.25),
        int(width * 0.72),
        int(height * 0.48),
    )

    mask_draw = Image.new("L", size, 0)

    ImageDraw.Draw(mask_draw).ellipse(ellipse_box, fill=opacity)
    mask = mask_draw.filter(ImageFilter.GaussianBlur(radius=max(28, width // 34)))
    glow.paste((255, 255, 255, 255), mask=mask)
    layer = Image.alpha_composite(layer, glow)

    edge_mask = Image.new("L", size, 0)
    edge_draw = ImageDraw.Draw(edge_mask)
    edge_draw.rounded_rectangle(
        (10, 10, width - 10, height - 10),
        radius=max(28, width // 30),
        outline=110,
        width=max(4, width // 240),
    )
    edge_mask = edge_mask.filter(ImageFilter.GaussianBlur(radius=max(8, width // 160)))
    edge = Image.new("RGBA", size, (255, 255, 255, 80))
    edge.putalpha(edge_mask)
    return Image.alpha_composite(layer, edge)


def process_slide(path: Path) -> None:
    source = Image.open(path).convert("RGB")

    # Rebuild the screenshot into a cleaner, sharper presentation image.
    base = ImageOps.autocontrast(source, cutoff=0.4)
    base = ImageEnhance.Color(base).enhance(1.08)
    base = ImageEnhance.Contrast(base).enhance(1.06)
    base = ImageEnhance.Brightness(base).enhance(1.01)
    base = base.convert("RGBA")

    softened = base.filter(ImageFilter.GaussianBlur(radius=7))
    frosted = Image.blend(base, softened, 0.12)

    noise = Image.effect_noise(frosted.size, 8).convert("L")
    noise = ImageEnhance.Contrast(noise).enhance(0.72)
    noise = ImageOps.colorize(noise, black="#dfe9f6", white="#ffffff").convert("RGBA")
    noise.putalpha(18)

    highlight = build_highlight(frosted.size, opacity=135)
    glazed = Image.alpha_composite(frosted, noise)
    glazed = Image.alpha_composite(glazed, highlight)

    glaze_soft = glazed.filter(ImageFilter.GaussianBlur(radius=1.2))
    detailed = ImageChops.overlay(glazed, glaze_soft)
    final = Image.blend(glazed, detailed, 0.18)
    final = final.filter(ImageFilter.UnsharpMask(radius=2.2, percent=180, threshold=2))

    final.save(path, format="PNG", optimize=True)
    print(f"Processed {path.relative_to(ROOT)}")


def main() -> None:
    if not SLIDES_DIR.exists():
        raise SystemExit(f"Slides directory not found: {SLIDES_DIR}")

    slides = sorted(SLIDES_DIR.rglob("*.png"))
    if not slides:
        raise SystemExit("No slide PNG files found under public/ppt-slides")

    for slide in slides:
        process_slide(slide)


if __name__ == "__main__":
    main()
