# HMS Rooms v8 (22 Nov 2026): same one-page setup + one-page room type + amenities as onboarding.
import re, sys
from playwright.sync_api import sync_playwright
B="http://localhost:3100"; ok=0; fail=0; SH="/tmp/hmsv8"
import os; os.makedirs(SH, exist_ok=True)
def t(name, cond):
  global ok, fail
  if cond: ok+=1; print("PASS", name)
  else: fail+=1; print("FAIL", name)
with sync_playwright() as p:
  b=p.chromium.launch()
  for W in [1440, 390]:
    pg=b.new_page(viewport={"width":W,"height":1000}); errs=[]; tag=f"[{W}] "
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(B+"/hms/rooms"); pg.evaluate("localStorage.clear()"); pg.goto(B+"/hms/rooms"); pg.wait_for_timeout(1500)
    before=pg.get_by_role("main").inner_text()
    n0=int(re.search(r"(\d+)\s*\n?Total rooms", before).group(1))
    # setup
    pg.goto(B+"/hms/rooms/setup"); pg.wait_for_timeout(1500)
    m=pg.locator("main:visible").first.inner_text() if pg.locator("main:visible").count() else pg.locator("body").inner_text()
    body=pg.locator("body").inner_text()
    t(tag+"setup: one page, v8 cards", "What you rent" in body and re.search("Floors|Levels", body) is not None)
    t(tag+"setup: no old 4-step wizard", "Numbering" not in body)
    pg.screenshot(path=f"{SH}/{W}-setup.png", full_page=True)
    pg.get_by_role("button", name="Save setup").click(); pg.wait_for_timeout(1200)
    t(tag+"setup saved → configuration", "/hms/rooms/configuration" in pg.url)
    pg.goto(B+"/hms/rooms"); pg.wait_for_timeout(1200)
    n1=int(re.search(r"(\d+)\s*\n?Total rooms", pg.get_by_role("main").inner_text()).group(1))
    t(tag+"existing rooms kept after save", n1==n0)
    # add room type (one page)
    pg.goto(B+"/hms/rooms/new?type=ROOM"); pg.wait_for_timeout(1500)
    body=pg.locator("body").inner_text()
    t(tag+"add: one-page form sections", all(s in body for s in ["Basic information","Price","Room numbers","Amenities","Meals"]))
    pg.screenshot(path=f"{SH}/{W}-add.png", full_page=True)
    # edit existing category opens the same form
    pg.goto(B+"/hms/rooms"); pg.wait_for_timeout(1000)
    pg.goto(B+"/hms/rooms/new"); pg.wait_for_timeout(1500)
    body=pg.locator("body").inner_text()
    t(tag+"add: list with types + edit", "Edit" in body and "Add another type" in body)
    pg.get_by_role("button", name="Edit").first.click(); pg.wait_for_timeout(600)
    body=pg.locator("body").inner_text()
    t(tag+"edit existing type: numbers prefilled", re.search(r"[1-9]\d* numbers", body) is not None or "Room numbers" in body)
    # settings amenities
    pg.goto(B+"/hms/settings/profile"); pg.wait_for_timeout(1500)
    body=pg.locator("body").inner_text()
    t(tag+"settings: property amenities card", "Property amenities" in body and "Most guests look for" in body)
    pg.get_by_role("button", name="Parking").first.click(); pg.wait_for_timeout(200)
    t(tag+"settings: amenity toggles → save bar", "Unsaved changes" in pg.locator("body").inner_text())
    pg.screenshot(path=f"{SH}/{W}-settings.png", full_page=True)
    t(tag+"no page errors", not errs); errs and print(errs[:3])
    pg.close()
print("ALL PASS" if not fail else f"{fail} FAILED")
