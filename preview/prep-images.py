# Downscale demo photos for the single-file preview (artifact limit 16 MB). The real app uses the 4K originals.
from PIL import Image
import glob, os
src = os.path.join(os.path.dirname(__file__), "..", "public", "demo", "azure-bay")
out = os.path.join(os.path.dirname(__file__), ".images")
os.makedirs(out, exist_ok=True)
for f in glob.glob(os.path.join(src, "*.jpg")):
    im = Image.open(f).convert("RGB")
    w, h = im.size
    s = min(1, 1600 / max(w, h))
    im.resize((round(w * s), round(h * s)), Image.LANCZOS).save(os.path.join(out, os.path.basename(f)), quality=74, optimize=True, progressive=True)
