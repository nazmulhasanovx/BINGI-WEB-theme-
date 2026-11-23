# Room-type panel (23 Nov 2026): one category at a time in a big panel over the list (88% desktop, full screen phone),
# list blurred behind, section nav, draft kept on close, Save & next, phone back closes.
import re, sys
from playwright.sync_api import sync_playwright
src=open("tests/onboarding/drawing.py").read().split("with sync_playwright() as p:")[0]
exec(src)
P=lambda pg: pg.locator("[data-acc-panel]")
def open_add(pg):
  tiles=pg.locator("main:visible").get_by_role("button",name=re.compile(r"^Add (rooms|cottages|villas|flats)"))
  if tiles.count(): tiles.first.click()
  else: pg.locator("main:visible").get_by_role("button",name=re.compile(r"^Rooms$")).first.click()
  pg.wait_for_timeout(450)
def fill(pg, cat, price):
  P(pg).locator("button[aria-pressed]").filter(has_text=re.compile(cat)).first.click()
  pg.locator("#acc-price-in").fill(price)
def numbers(pg, plus="5"):
  pg.get_by_role("button",name=re.compile("Select numbers")).first.click(); pg.wait_for_timeout(250)
  ch=pg.get_by_role("button",name=re.compile("choose numbers"))
  if ch.count(): ch.first.click(); pg.wait_for_timeout(250)
  pg.get_by_role("button",name=re.compile(rf"\+{plus}")).first.click(); pg.get_by_role("button",name=re.compile("^Done$")).click(); pg.wait_for_timeout(200)
  sv=pg.get_by_role("button",name=re.compile("Save numbers"))
  if sv.count(): sv.click(); pg.wait_for_timeout(200)
def save(pg): P(pg).get_by_role("button",name=re.compile(r"^Save ·")).click(); pg.wait_for_timeout(500)
with sync_playwright() as p:
  b=p.chromium.launch()
  for W in (1440, 390):
    H0=900 if W>500 else 844
    pg=b.new_page(viewport={"width":W,"height":H0}); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("dialog",lambda d:d.accept())
    tag=f"[{W}] "
    nx=start(pg,"^Hotel")
    for i in range(9):
      if pg.get_by_role("heading",name="Add your rooms").count(): break
      nx()
    t(tag+"on Add your rooms", pg.get_by_role("heading",name="Add your rooms").count()==1)
    open_add(pg)
    t(tag+"panel opens as a dialog", P(pg).get_by_role("dialog").count()==1)
    bx=P(pg).get_by_role("dialog").bounding_box()
    if W>500: t(tag+"panel takes 80%+ of the screen", bx["width"]>=0.75*W and bx["height"]>=0.85*H0, str(bx))
    else:
      t(tag+"panel is full screen on phone", bx["width"]>=W-1 and bx["height"]>=H0-1, str(bx))
      t(tag+"one close control on phone (header back)", P(pg).get_by_role("button",name="Close").locator("visible=true").count()==0)
    t(tag+"list stays behind (not replaced)", pg.get_by_role("heading",name="Add your rooms").count()==1)
    t(tag+"page behind does not scroll", pg.evaluate("document.body.style.overflow")=="hidden")
    t(tag+"backdrop blur", "blur" in (P(pg).locator("div[aria-hidden]").first.get_attribute("class") or ""))
    fill(pg,"Deluxe","4500")
    nav=P(pg).get_by_role("navigation",name="Sections").locator("visible=true").first
    nav.get_by_role("button",name=re.compile("Amenities")).click(); pg.wait_for_timeout(900)
    t(tag+"jump keeps the panel header in view", P(pg).locator("#acc-h").bounding_box()["y"]>=0 and P(pg).get_by_role("dialog").evaluate("e=>e.scrollTop")==0)
    t(tag+"section nav jumps + marks where you are", nav.get_by_role("button",name=re.compile("Amenities")).get_attribute("aria-current")=="true")
    # close without saving → draft kept
    if W>500: pg.keyboard.press("Escape")
    else: P(pg).get_by_role("button",name="Back to room types").click()
    pg.wait_for_timeout(400)
    t(tag+"closed", P(pg).count()==0 and pg.evaluate("document.body.style.overflow")!="hidden")
    t(tag+"unfinished draft listed", pg.get_by_text("Unfinished:").count()==1)
    pg.get_by_role("button",name="Continue").first.click(); pg.wait_for_timeout(400)
    t(tag+"draft restored", pg.locator("#acc-price-in").input_value()=="4500" and P(pg).get_by_text("Your unsaved changes from last time are back.").count()==1)
    numbers(pg); save(pg)
    t(tag+"saved: panel closed, row Ready", P(pg).count()==0 and pg.locator("main:visible").get_by_text("Ready",exact=True).count()==1)
    t(tag+"saved: no photos hint", pg.locator("main:visible").get_by_text("No photos yet").count()==1)
    t(tag+"saved: draft cleared", pg.get_by_text("Unfinished:").count()==0)
    # second type
    pg.locator("main:visible").get_by_role("button",name=re.compile(r"^Rooms$")).first.click(); pg.wait_for_timeout(400)
    fill(pg,"Suite","9000"); P(pg).locator("#acc-title").fill("Sea Suite"); numbers(pg); save(pg)
    t(tag+"two types listed", pg.locator("main:visible").get_by_text("Ready",exact=True).count()==2)
    pg.locator("main:visible").get_by_role("button",name="Edit").first.click(); pg.wait_for_timeout(400)
    nxt=P(pg).get_by_role("button",name=re.compile("Save & next"))
    t(tag+"Save & next offered", nxt.count()==1)
    nxt.click(); pg.wait_for_timeout(500)
    t(tag+"Save & next opens the next type", P(pg).get_by_role("heading",name=re.compile("Edit Sea Suite")).count()==1)
    pg.locator("#acc-price-in").fill("9500"); pg.wait_for_timeout(200)
    if W<500:
      pg.go_back(); pg.wait_for_timeout(600)
      t(tag+"phone back button closes the panel, stays on step", P(pg).count()==0 and pg.get_by_role("heading",name="Add your rooms").count()==1)
    else:
      P(pg).get_by_role("button",name="Close").first.click(); pg.wait_for_timeout(400)
    t(tag+"edited type shows Unsaved changes", pg.locator("main:visible").get_by_text("Unsaved changes").count()==1)
    t(tag+"no page errors", not errs, "; ".join(errs[:2]))
    pg.close()
  # HMS: same panel
  pg=b.new_page(viewport={"width":1440,"height":900}); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
  pg.goto(B+"/hms/rooms/new?type=room"); pg.wait_for_timeout(2500)
  t("[HMS] add room type opens the panel", P(pg).get_by_role("dialog").count()==1)
  pg.screenshot(path="/tmp/panel_hms_1440.png")
  P(pg).get_by_role("button",name="Close").first.click(); pg.wait_for_timeout(1500)
  t("[HMS] close goes back to Rooms", re.search(r"/hms/rooms/?$", pg.url) is not None, pg.url)
  t("[HMS] no page errors", not errs, "; ".join(errs[:2]))
  b.close()
print(f"{sum(R)}/{len(R)} passed"); sys.exit(0 if all(R) else 1)
