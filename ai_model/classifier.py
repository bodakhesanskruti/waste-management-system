from PIL import Image


def classify_image(image_path):
    """
    Prototype waste image classifier.
    Uses simple image characteristics for demonstration.
    """

    image = Image.open(image_path).convert("RGB")

    pixels = list(image.getdata())
    total = len(pixels)

    avg_r = sum(p[0] for p in pixels) / total
    avg_g = sum(p[1] for p in pixels) / total
    avg_b = sum(p[2] for p in pixels) / total

    # Green-dominant image
    if avg_g > avg_r * 1.15 and avg_g > avg_b * 1.10:
        return "Organic/Wet Waste"

    # Red/orange-dominant image
    elif avg_r > avg_g * 1.25 and avg_r > avg_b * 1.20:
        return "Plastic"

    # Neutral/gray image
    elif (
        abs(avg_r - avg_g) < 20
        and abs(avg_g - avg_b) < 20
    ):
        return "Dry/Recyclable Waste"

    # Default category
    else:
        return "Dry/Recyclable Waste"