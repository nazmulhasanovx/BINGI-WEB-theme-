# Live property drawing (22–23 Nov 2026): website preview gone; Remotion drawing beside "Where are they?" (onboarding)
# and in HMS → Rooms → Setup / Edit setup. Floors, ground, basements, zones/blocks and names follow every change.
import re, sys, importlib.util
from playwright.sync_api import sync_playwright
spec=importlib.util.spec_from_file_location("r3","tests/onboarding/notes_r3.py")
B="http://localhost:3100"; R=[]
def t(n, ok, d=""): R.append(ok); print(("PASS " if ok else "FAIL ")+n, "" if ok else d)
def start(pg, kind):
  NX=re.compile("^Next|^Continue with")
  nx=lambda: (pg.get_by_role("button",name=NX).last.click(), pg.wait_for_timeout(450))
  pg.goto(B+"/onboarding"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1200)
  pg.get_by_role("button",name="EN",exact=True).click()
  pg.locator("#ph").fill("01712345678"); pg.get_by_role("button",name=re.compile("Send code")).click(); pg.wait_for_timeout(300)
  pg.locator("#otp").fill("123456"); pg.get_by_role("button",name=re.compile("Verify")).click(); pg.wait_for_timeout(600)
  pg.get_by_role("button",name=re.compile("Let's start")).click(); pg.wait_for_timeout(1000)
  pg.get_by_role("radio",name=re.compile(kind)).first.click(); nx()
  pg.locator("#pname").fill("Test Place"); nx()
  pg.locator("#ad-road").fill("Road 2"); pg.locator("#ad-city").fill("Sylhet"); nx(); nx()
  return nx
def drawing(pg): return pg.locator("[data-testid=property-drawing]:visible").first
def label(pg): return drawing(pg).get_by_role("img").get_attribute("aria-label") or ""
def svgtext(pg): pg.wait_for_timeout(1600); return drawing(pg).locator("svg").first.evaluate("e=>e.textContent")
with sync_playwright() as p:
  b=p.chromium.launch()
  for W in (1440, 390):
    pg=b.new_page(viewport={"width":W,"height":900 if W>500 else 844}); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("dialog",lambda d:d.accept())
    tag=f"[{W}] "
    nx=start(pg, "^Hotel")
    t(tag+"no website preview on 1.x", drawing(pg).count()==0 and pg.get_by_text("What guests see").count()==0)
    nx(); nx(); nx(); nx(); nx(); nx()
    t(tag+"on 'Where are they?'", pg.get_by_role("heading",name="Where are they?").count()==1)
    t(tag+"one drawing visible", pg.locator("[data-testid=property-drawing]:visible").count()==1)
    L0=label(pg); t(tag+"drawing names the building", "Main building" in L0 or "building" in L0.lower(), L0)
    pg.wait_for_timeout(2500); drawing(pg).screenshot(path=f"/tmp/draw_only_{W}.png")
    if W>500: t(tag+"drawing beside the form (side column)", drawing(pg).bounding_box()["x"] > 700, str(drawing(pg).bounding_box()))
    else: t(tag+"drawing on top on phone", drawing(pg).bounding_box()["y"] < pg.locator("#where-kinds").bounding_box()["y"])
    m=re.search(r"(\d+) floor", L0); f0=int(m.group(1)) if m else 0
    pg.locator("#where-building").get_by_role("button",name="Floors +").first.click(); pg.wait_for_timeout(300)
    L1=label(pg); t(tag+"floor + shows in drawing", f"{f0+1} floor" in L1, L1)
    pg.locator("#where-building").get_by_role("group",name="Floors").first.scroll_into_view_if_needed()
    st=svgtext(pg); t(tag+"floor label chip drawn", re.search(rf"F{f0+1}", st) is not None, st[:160])
    pg.get_by_label("Building 1 name").fill("Sea Tower"); pg.wait_for_timeout(300)
    t(tag+"building name drawn", "Sea Tower" in svgtext(pg))
    pg.get_by_role("switch",name="Rooms in basement").click(); pg.wait_for_timeout(300)
    t(tag+"basement drawn", "1 basement" in label(pg) and "B1" in svgtext(pg), label(pg))
    t(tag+"old in-card floor preview removed", pg.locator("#where-building").get_by_role("img",name="Preview").count()==0)
    # cottages in zones → plots with names
    if pg.get_by_role("button",name="+ More kinds").count(): pg.get_by_role("button",name="+ More kinds").click(); pg.wait_for_timeout(150)
    pg.locator("#where-kinds").get_by_role("button",name=re.compile("^Cottage")).first.click(); pg.wait_for_timeout(400)
    Lz=label(pg); t(tag+"zones in drawing", re.search(r"\d+ zones? \(", Lz) is not None and "cottage" in Lz.lower(), Lz)
    pg.locator("#where-zones").get_by_role("button",name="Zones +").click(); pg.wait_for_timeout(300)
    n=int(re.search(r"(\d+) zone", label(pg)).group(1)); t(tag+"zone + adds a plot", f"Zone {n}" in svgtext(pg), svgtext(pg)[:200])
    pg.get_by_role("radio",name="Blocks").click(); pg.wait_for_timeout(300)
    t(tag+"blocks wording", "Block 1" in svgtext(pg) and "block" in label(pg).lower(), label(pg))
    pg.get_by_label("Block 1 name").fill("Lake Side"); pg.wait_for_timeout(300)
    t(tag+"own block name drawn", "Lake Side" in svgtext(pg))
    pg.screenshot(path=f"/tmp/draw_onb_{W}.png", full_page=False)
    t(tag+"no page errors", not errs, "; ".join(errs[:2]))
    pg.close()
  # HMS
  for W in (1440, 390):
    pg=b.new_page(viewport={"width":W,"height":900 if W>500 else 844}); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    tag=f"[HMS {W}] "
    pg.goto(B+"/hms/rooms/configuration"); pg.wait_for_timeout(3500)
    op=pg.evaluate("""()=>{const s=[...document.querySelectorAll('[data-testid=property-drawing] svg')].filter(x=>x.getBoundingClientRect().width>0)[0]; const gs=[...s.querySelectorAll('g[style]')]; return gs.length? Math.min(...gs.map(g=>parseFloat(getComputedStyle(g).opacity))):-1}""")
    t(tag+"drawing finishes and stays drawn (no restart)", op>0.97, str(op))
    t(tag+"setup tab shows the drawing", pg.locator("[data-testid=property-drawing]:visible").count()==1)
    t(tag+"setup tab has onboarding parts", pg.get_by_text("What you rent").count()>=1 and pg.get_by_role("link",name="Edit setup").count()>=1)
    pg.screenshot(path=f"/tmp/draw_hmsconf_{W}.png", full_page=True)
    pg.goto(B+"/hms/rooms/setup"); pg.wait_for_timeout(3500)
    t(tag+"edit setup: one drawing", pg.locator("[data-testid=property-drawing]:visible").count()==1)
    t(tag+"edit setup: same form", pg.locator("#where-kinds").count()==1)
    if pg.locator("#where-building").count():
      a=label(pg); pg.locator("#where-building").get_by_role("button",name="Floors +").first.click(); pg.wait_for_timeout(300)
      t(tag+"edit setup: drawing follows", label(pg)!=a, a)
    pg.screenshot(path=f"/tmp/draw_hmssetup_{W}.png", full_page=False)
    t(tag+"no page errors", not errs, "; ".join(errs[:2]))
    pg.close()
  b.close()
print(f"{sum(R)}/{len(R)} passed"); sys.exit(0 if all(R) else 1)
