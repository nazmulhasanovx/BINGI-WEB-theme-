import json, re
from playwright.sync_api import sync_playwright
B = "http://localhost:3100"
R = []
def check(n, ok, info=""):
    R.append(ok); print(("PASS " if ok else "FAIL ") + n + (f" — {info}" if info else ""), flush=True)
def master(pg):
    return pg.evaluate("document.getElementById('hotel-theme')?.dataset.master")
def lic(pg):
    return json.loads(pg.evaluate("localStorage.getItem('bingi-theme-licences-v1')") or "[]")
def site(pg, slug="azure-bay"):
    return json.loads(pg.evaluate(f"localStorage.getItem('bingi-site-v1-{slug}')") or "null")
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
with sync_playwright() as p:
    br = p.chromium.launch(args=GL)
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.on("dialog", lambda d: d.accept())
    pg.goto(B + "/hms/website/overview"); pg.evaluate("localStorage.clear()")

    # F1 demo properties show their paid theme
    for slug, t in [("haor-bilash", "drift"), ("canopy-nest", "canopy"), ("skypod", "pod"), ("altura", "orbit"), ("nila-island", "isle"), ("shonali-rajbari", "zamindar"), ("maison-gulshan", "maison"), ("obsidian-gulshan", "noir"), ("haven-lalakhal", "haven"), ("meghchura", "summit"), ("bonolota-estate", "estate")]:
        pg.goto(f"{B}/hotel/{slug}"); pg.wait_for_timeout(700)
        check(f"F1 {slug} shows {t}", master(pg) == t, master(pg))

    # F2 unbought paid theme never shows on a live site; preview with my hotel does (with ribbon)
    pg.goto(f"{B}/hotel/azure-bay?preview=try&try=pod"); pg.wait_for_timeout(900)
    check("F2 preview=try shows POD + ribbon", master(pg) == "pod" and "not on your live site" in pg.inner_text("body"))
    pg.goto(f"{B}/hotel/azure-bay?try=pod"); pg.wait_for_timeout(700)
    check("F2 ?try without preview flag ignored", master(pg) == "grand", master(pg))

    # F3 failed payment changes nothing
    pg.goto(f"{B}/hms/website/design?tab=store"); pg.wait_for_timeout(1200)
    pg.get_by_role("button", name="Details").first.click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name=re.compile("Buy & apply")).click()
    pg.get_by_label("Demo: simulate a failed payment").check()
    pg.get_by_role("button", name="Confirm purchase").click(); pg.wait_for_timeout(300)
    s = site(pg)
    check("F3 failed payment: error shown, no licence, draft unchanged", "Nothing was charged" in pg.inner_text("body") and not lic(pg) and (s is None or s["draft"]["master"] == "grand"))

    # F4 successful purchase -> licence + draft, live unchanged until publish
    pg.get_by_label("Demo: simulate a failed payment").uncheck()
    pg.get_by_role("button", name="Confirm purchase").click(); pg.wait_for_timeout(300)
    s = site(pg); L = lic(pg)
    check("F4 bought: licence active + draft ISLE", len(L) == 1 and L[0]["theme"] == "isle" and L[0]["status"] == "active" and s["draft"]["master"] == "isle")
    pg.goto(f"{B}/hotel/azure-bay"); pg.wait_for_timeout(700)
    check("F4 live site unchanged before publish", master(pg) == "grand", master(pg))
    pg.goto(f"{B}/hms/website/publish"); pg.wait_for_timeout(800)
    pg.get_by_role("button", name="Publish now").click(); pg.wait_for_timeout(300)
    pg.goto(f"{B}/hotel/azure-bay"); pg.wait_for_timeout(700)
    check("F4 after publish live site = ISLE", master(pg) == "isle", master(pg))

    # F5 publish guard: unbought paid theme in draft
    pg.evaluate("""()=>{const k='bingi-site-v1-azure-bay';const s=JSON.parse(localStorage.getItem(k));s.draft.master='canopy';localStorage.setItem(k,JSON.stringify(s));}""")
    pg.goto(f"{B}/hms/website/publish"); pg.wait_for_timeout(800)
    check("F5 publish blocked for unbought CANOPY", pg.get_by_role("button", name="Publish now").is_disabled() and "haven't bought" in pg.inner_text("main"))
    pg.evaluate("""()=>{const k='bingi-site-v1-azure-bay';const s=JSON.parse(localStorage.getItem(k));s.draft.master='isle';localStorage.setItem(k,JSON.stringify(s));}""")

    # F6 motion setting
    pg.goto(f"{B}/hms/website/design"); pg.wait_for_timeout(1000)
    check("F6 Motion card visible for paid theme", pg.get_by_role("radiogroup", name="Motion").count() == 1)
    pg.get_by_role("radio", name=re.compile("^Calm")).click(); pg.wait_for_timeout(200)
    pg.goto(f"{B}/hms/website/publish"); pg.wait_for_timeout(600); pg.get_by_role("button", name="Publish now").click(); pg.wait_for_timeout(300)
    pg.goto(f"{B}/hotel/azure-bay?fx=full"); pg.wait_for_timeout(2500)
    check("F6 Calm: no canvas on live site", pg.locator("canvas").count() == 0, str(pg.locator("canvas").count()))
    pg.goto(f"{B}/hms/website/design"); pg.wait_for_timeout(800)
    check("F6 luxury theme offers Calm only", pg.get_by_role("radiogroup", name="Motion").locator("[role=radio]:not([disabled])").count() == 1)

    # F7 reduced motion → calm
    ctx = br.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    rp = ctx.new_page(); rp.goto(f"{B}/hotel/haor-bilash"); rp.wait_for_timeout(2500)
    check("F7 prefers-reduced-motion: no canvas", rp.locator("canvas").count() == 0)
    rp.goto(f"{B}/hotel/canopy-nest"); rp.wait_for_timeout(1500)
    check("F7 reduced motion: page content still complete", "Up in the canopy" in rp.inner_text("body"))
    ctx.close()

    # F8 cancel renewal -> last week notice -> keep it -> end -> fallback
    pg.goto(f"{B}/hms/website/design?tab=mine"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Cancel renewal").click(); pg.wait_for_timeout(200)
    check("F8 cancelled but still live", lic(pg)[0]["status"] == "cancelled" and "Cancelled · works until" in pg.inner_text("main"))
    pg.locator("summary", has_text="Demo").click(); pg.get_by_role("button", name="Jump to last 5 days").click(); pg.wait_for_timeout(300)
    pg.goto(f"{B}/hms/website/overview"); pg.wait_for_timeout(900)
    check("F8 amber notice: ends in 5 days", "ISLE ends in 5 days" in pg.inner_text("main"), pg.inner_text("main")[:120])
    pg.goto(f"{B}/hms/website/design?tab=mine"); pg.wait_for_timeout(900)
    pg.get_by_role("button", name="Keep it").click(); pg.wait_for_timeout(200)
    check("F8 keep it -> active", lic(pg)[0]["status"] == "active")
    pg.locator("summary", has_text="Demo").click(); pg.get_by_role("button", name="End licence now").click(); pg.wait_for_timeout(300)
    pg.goto(f"{B}/hotel/azure-bay"); pg.wait_for_timeout(800)
    check("F8 ended -> live site falls back to GRAND", master(pg) == "grand", master(pg))
    pg.goto(f"{B}/hotel/azure-bay/rooms"); pg.wait_for_timeout(600)
    check("F8 booking pages still work after fallback", "Deluxe Garden View" in pg.inner_text("body"))
    pg.goto(f"{B}/hms/website/overview"); pg.wait_for_timeout(900)
    check("F8 red notice on overview", "licence has ended" in pg.inner_text("main"))
    pg.goto(f"{B}/hms/website/publish"); pg.wait_for_timeout(800)
    check("F8 republishing ISLE blocked after end", pg.get_by_role("button", name="Publish now").count() == 0 or pg.get_by_role("button", name="Publish now").is_disabled() or "Everything is live" in pg.inner_text("main"))

    # F9 buy again restores
    pg.goto(f"{B}/hms/website/design?tab=store"); pg.wait_for_timeout(1000)
    pg.get_by_role("button", name="Details").first.click(); pg.get_by_role("button", name=re.compile("Buy & apply")).click(); pg.get_by_role("button", name="Confirm purchase").click(); pg.wait_for_timeout(300)
    pg.goto(f"{B}/hotel/azure-bay"); pg.wait_for_timeout(800)
    check("F9 bought again -> ISLE live again (published doc kept)", master(pg) == "isle", master(pg))

    # F10 coming-soon + ATLAS not buyable; filter
    pg.goto(f"{B}/hms/website/design?tab=store"); pg.wait_for_timeout(1000)
    check("F10 store lists 15 themes", pg.locator("main article").count() == 15, str(pg.locator("main article").count()))
    pg.get_by_role("button", name="See plan").last.click(); pg.wait_for_timeout(300)
    check("F10 coming soon has no buy", pg.get_by_role("dialog").get_by_role("button", name=re.compile("Buy")).count() == 0)
    pg.keyboard.press("Escape")
    pg.get_by_role("button", name="Luxury Collection · 5★–7★").click(); pg.wait_for_timeout(200)
    check("F10 Luxury filter: 10 themes", pg.locator("main article").count() == 10, str(pg.locator("main article").count()))

    # F11 property isolation: another property has no licence
    pg.evaluate("localStorage.setItem('hms-property','sea-pearl')"); pg.goto(f"{B}/hms/website/design?tab=mine"); pg.wait_for_timeout(900)
    check("F11 other property: no paid themes", "No paid themes yet" in pg.inner_text("main"))

    # F12 POD wall + ORBIT floors + CANOPY ruler + DRIFT day plan from data
    pg.goto(f"{B}/hotel/skypod?fx=full"); pg.wait_for_timeout(1200)
    check("F12 POD wall: 60 pods", "60 pods" in pg.inner_text("body"))
    pg.get_by_role("button", name=re.compile("^Female Pod · 12")).click(); pg.wait_for_timeout(200)
    check("F12 POD panel switches to Female Pod", pg.get_by_role("link", name=re.compile("Book a pod")).get_attribute("href").endswith("/rooms/female-pod"))
    pg.goto(f"{B}/hotel/altura"); pg.wait_for_timeout(1200)
    body = pg.inner_text("main").lower()
    check("F13 ORBIT altitude rail: highest floor first", body.find("floor 43") != -1 and body.find("floor 43") < body.find("floors 30–34"))
    pg.goto(f"{B}/hotel/canopy-nest"); pg.wait_for_timeout(1000)
    check("F14 CANOPY height scale: 12 m first", pg.inner_text("main").find("12 m") < pg.inner_text("main").find("7 m"))
    pg.goto(f"{B}/hotel/haor-bilash"); pg.wait_for_timeout(1000)
    check("F15 DRIFT voyage: 6 stops", pg.locator("section", has_text="A day on the water").locator("ol > li").count() == 6, str(pg.locator("section", has_text="A day on the water").locator("ol > li").count()))
    pg.evaluate("localStorage.setItem('hms-property','haor-bilash')"); pg.goto(f"{B}/hms/website/homepage"); pg.wait_for_timeout(1000)
    check("F16 Homepage editor shows DRIFT sections", "Voyage line" in pg.inner_text("main") and "Rooms & suites" in pg.inner_text("main"))

    check("no runtime errors", not errs, "; ".join(errs[:3]))
    br.close()
print(f"\n{sum(R)} / {len(R)}")
