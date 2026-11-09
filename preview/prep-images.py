# Downscale demo photos for the single-file preview (artifact limit 16 MB). The real app uses the 4K originals.
from PIL import Image
import glob, os
root = os.path.dirname(os.path.abspath(__file__))
app = os.path.join(root, "..", "bingi-web-theme-") if os.path.isdir(os.path.join(root, "..", "bingi-web-theme-")) else os.path.join(root, "..")
for hotel in ["azure-bay", "sea-pearl", "tea-valley"]:
    out = os.path.join(root, ".images", hotel)
    os.makedirs(out, exist_ok=True)
    for f in glob.glob(os.path.join(app, "public", "demo", hotel, "*.jpg")):
        im = Image.open(f).convert("RGB")
        w, h = im.size
        s = min(1, 1280 / max(w, h))
        im.resize((round(w * s), round(h * s)), Image.LANCZOS).save(os.path.join(out, os.path.basename(f)), quality=64, optimize=True, progressive=True)
