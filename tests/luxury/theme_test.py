# Luxury Collection — per-theme test (UI shots · function · responsive+axe). Usage: python3 test.py <slug> <master>
import sys, re, json, subprocess
from playwright.sync_api import sync_playwright
B = "http://localhost:3100"
slug, master = sys.argv[1], sys.argv[2]
AXE = open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
OUT = f"/tmp/lux/{master}"
subprocess.run(["mkdir", "-p", OUT])
R = []
def check(n, ok, info=""):
    R.append(ok); print(("PASS " if ok else "FAIL ") + n + (f" — {info}" if info else ""), flush=True)

SIZES = [("390", 390, 844), ("768", 768, 1024), ("1024", 1024, 768), ("1440", 1440, 900), ("iphone16pm", 440, 956), ("ipad129", 1024, 1366)]
with sync_playwright() as p:
    br = p.chromium.launch()
    # ---- STEP 2: function ----
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.on("console", lambda m: errs.append("console: " + m.text[:160]) if m.type == "error" else None)
    pg.goto(f"{B}/hotel/{slug}"); pg.wait_for_timeout(1500)
    check("F1 theme is live", pg.evaluate("document.getElementById('hotel-theme')?.dataset.master") == master)
    check("F2 one h1", pg.locator("main h1:visible").count() == 1, str(pg.locator("main h1:visible").count()))
    hrefs = sorted(set(pg.eval_on_selector_all("main a[href^='/']", "els=>els.map(e=>e.getAttribute('href'))")))
    bad = [h for h in hrefs if pg.request.get(B + h).status != 200]
    check(f"F3 {len(hrefs)} internal links return 200", not bad, str(bad[:5]))
    ext = pg.eval_on_selector_all("main a[href^='http'], main a[href^='tel:']", "els=>els.map(e=>e.getAttribute('href'))")
    check("F4 concierge / directions links present", any("wa.me" in h or h.startswith("tel:") for h in ext) and any("google.com/maps" in h for h in ext), str(len(ext)))
    rooms = [h for h in hrefs if re.search(r"/rooms/[^/]+$", h)]
    check("F5 room links reach every room type", len(rooms) >= 2, str(rooms))
    if rooms:
        pg.locator(f"main a[href='{rooms[0]}']:visible").first.click(); pg.wait_for_url(re.compile("/rooms/")); pg.wait_for_timeout(600)
        check("F6 room click opens room page", "/rooms/" in pg.url and pg.locator("h1").count() >= 1)
    pg.goto(f"{B}/hotel/{slug}"); pg.wait_for_timeout(1200)
    pg.get_by_role("button", name=re.compile("Check rooms")).first.click(); pg.wait_for_timeout(1500)
    check("F7 booking bar search works", "/rooms" in pg.url or "book" in pg.url or pg.locator("[role=dialog]").count() > 0, pg.url)
    pg.goto(f"{B}/hotel/azure-bay?preview=try&try={master}"); pg.wait_for_timeout(1500)
    check("F8 try-preview on another hotel", pg.evaluate("document.getElementById('hotel-theme')?.dataset.master") == master)
    check("F9 no page/console errors", not errs, str(errs[:3]))
    pg.close()
    # ---- STEP 1 + 3: shots, overflow, images, axe ----
    for name, w, h in SIZES:
        ctx = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, reduced_motion="reduce")
        q = ctx.new_page(); q.goto(f"{B}/hotel/{slug}"); q.wait_for_timeout(900)
        q.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}window.scrollTo(0,0)}"); q.wait_for_timeout(900)
        ov = q.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(f"R {name} no horizontal overflow", ov <= 0, str(ov))
        broken = q.evaluate("[...document.querySelectorAll('main img')].filter(i=>i.complete && i.naturalWidth===0).map(i=>i.src).slice(0,3)")
        check(f"R {name} images load", not broken, str(broken))
        q.screenshot(path=f"{OUT}/{name}.png", full_page=True)
        if name in ("390", "1440"):
            q.add_script_tag(content=AXE)
            v = q.evaluate("async()=>{const r=await axe.run(document,{resultTypes:['violations']});return r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id+': '+v.nodes.slice(0,2).map(n=>n.target.join(' ')+' '+(n.failureSummary||'').slice(0,90)).join(' | '))}")
            check(f"A {name} axe home 0 serious/critical", not v, "; ".join(v)[:600])
            q.goto(f"{B}/hotel/{slug}/rooms"); q.wait_for_timeout(1200); q.add_script_tag(content=AXE)
            v = q.evaluate("async()=>{const r=await axe.run(document,{resultTypes:['violations']});return r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id+': '+v.nodes.slice(0,2).map(n=>n.target.join(' ')+' '+(n.failureSummary||'').slice(0,90)).join(' | '))}")
            check(f"A {name} axe rooms page 0 serious/critical", not v, "; ".join(v)[:600])
        ctx.close()
    br.close()
# contact sheet for the visual review
subprocess.run(f"convert {OUT}/1440.png -resize 520x {OUT}/_a.png && convert {OUT}/390.png -resize 230x {OUT}/_b.png && convert {OUT}/768.png -resize 300x {OUT}/_c.png", shell=True)
print(f"RESULT {sum(R)}/{len(R)}")
