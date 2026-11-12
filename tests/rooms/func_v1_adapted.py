import json, re, sys
from playwright.sync_api import sync_playwright, expect
B = "http://localhost:3100"
results = []
def check(name, ok, info=""):
    results.append((name, bool(ok), info)); print(("PASS " if ok else "FAIL ") + name + (f" — {info}" if info else ""), flush=True)

def state(pg, slug="azure-bay"):
    raw = pg.evaluate(f"localStorage.getItem('bingi-rooms-v1-{slug}')")
    return json.loads(raw) if raw else None

def cont(pg): pg.get_by_role("button", name="Continue", exact=True).click(); pg.wait_for_timeout(150)
def approve(pg, name):
    pg.goto(B + "/hms/rooms"); pg.wait_for_timeout(300)
    card = pg.locator("main li").filter(has=pg.locator("h2", has_text=name)).first
    card.get_by_role("button", name="Approve (BinGi demo)").click(); pg.wait_for_timeout(200)

def alert_text(pg):
    a = pg.locator("main [role=alert]")
    return a.first.inner_text() if a.count() else ""

with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("dialog", lambda d: d.accept())
    pg.goto(B + "/hms/rooms/numbers"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(500)
    check("seed: 24 units on Azure Bay", re.search(r"24 rooms in use", pg.locator("main").inner_text()))

    # T1 add Room to existing category from the number library
    pg.goto(B + "/hms/rooms/new"); pg.wait_for_timeout(400)
    cont(pg); check("T1 type required", "Choose what you are adding" in alert_text(pg))
    pg.get_by_role("button", name=re.compile(r"^Room Standard")).click(); cont(pg)
    cont(pg); check("T1 category required", "Choose a category" in alert_text(pg))
    pg.get_by_role("radio", name=re.compile("Deluxe Garden View")).click(); cont(pg)
    btn101 = pg.get_by_role("button", name="101", exact=True)
    check("T1 existing 101 is locked", btn101.is_disabled())
    pg.get_by_role("button", name="109", exact=True).click(); pg.get_by_role("button", name="110", exact=True).click()
    check("T1 selected count", "Selected (2)" in pg.inner_text("body"))
    cont(pg)
    pg.get_by_label("Price for 110").fill("0"); cont(pg)
    check("T1 zero override blocked", "price must be more than 0" in alert_text(pg))
    pg.get_by_label("Price for 110").fill("13000"); cont(pg)
    check("T1 review lists codes", "109" in pg.inner_text("main") and "৳12,000 – ৳13,000" in pg.inner_text("main"))
    pg.get_by_role("button", name="Publish 2 units").click(); pg.wait_for_url("**/hms/rooms"); pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(400)
    s = state(pg); u110 = [u for u in s["units"] if u["code"] == "110"]
    check("T1 created + published", len(s["units"]) == 26 and u110 and u110[0]["status"] == "published" and u110[0]["rate"] == 13000)

    # T2 another staff member creates 111 first -> nothing created, exact conflict
    pg.goto(B + "/hms/rooms/new?category=cat-r1"); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="111", exact=True).click(); pg.get_by_role("button", name="112", exact=True).click()
    cont(pg); cont(pg)
    pg.evaluate("""() => { const k='bingi-rooms-v1-azure-bay'; const s=JSON.parse(localStorage.getItem(k)); const u=s.units.find(x=>x.code==='109'); s.units.push({...u,id:'u-other',code:'111',local:'111'}); localStorage.setItem(k, JSON.stringify(s)); }""")
    pg.get_by_role("button", name="Publish 2 units").click(); pg.wait_for_timeout(300)
    t = alert_text(pg)
    s = state(pg)
    check("T2 conflict shown, nothing created", "Nothing was created" in t and "111 already exists" in t and not any(u["code"] == "112" for u in s["units"]), t[:120])

    # T3 Cottage: off -> turn on -> new category -> zone -> create as draft -> publish from drawer
    pg.goto(B + "/hms/rooms/new"); pg.wait_for_timeout(400)
    pg.get_by_role("button", name=re.compile(r"^Cottage Standalone")).click(); cont(pg)
    check("T3 disabled core blocked", "not turned on" in alert_text(pg))
    pg.get_by_role("button", name="Turn on Cottage").click(); cont(pg)
    pg.get_by_role("radio", name=re.compile("Create new category")).click()
    pg.get_by_label("Category name").fill("Deluxe Garden View"); cont(pg)
    check("T7 duplicate category name blocked", "already exists" in alert_text(pg))
    pg.get_by_label("Category name").fill("Garden Cottage")
    pg.get_by_label("Base price per night (৳)").fill("7000")
    pg.get_by_label("YouTube video (optional)").fill("https://vimeo.com/123"); cont(pg)
    check("T7 non-YouTube video blocked", "YouTube" in alert_text(pg))
    pg.get_by_label("YouTube video (optional)").fill("https://youtu.be/dQw4w9WgXcQ")
    pg.get_by_role("button", name="Private pool", exact=True).click()
    cont(pg)
    body = pg.inner_text("main")
    check("T3 cottage numbers C01 in zone", "Beach Zone" in body and pg.get_by_role("button", name="C01", exact=True).count() == 1)
    pg.get_by_role("button", name="C01", exact=True).click(); pg.get_by_role("button", name="C02", exact=True).click()
    cont(pg); cont(pg)
    pg.get_by_role("button", name="Create as draft").click(); pg.wait_for_url("**/hms/rooms"); pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(400)
    s = state(pg); cs = [u for u in s["units"] if u["code"] in ("C01", "C02")]
    cat = [c for c in s["categories"] if c["name"] == "Garden Cottage"]
    check("T3 drafts created, category saved with video + amenity", len(cs) == 2 and all(u["status"] == "draft" for u in cs) and cat and cat[0]["video"] and "Private pool" in cat[0]["amenities"])
    check("T3 drafts counter", re.search(r"2 draft \(not bookable\)", pg.inner_text("main")))
    check("T3 new category is pending approval", cat and cat[0]["approval"] == "pending")
    pg.get_by_role("button", name=re.compile(r"^C01")).click(); pg.wait_for_timeout(200)
    check("T3 publish blocked before approval", pg.get_by_role("dialog").get_by_role("button", name="Publish", exact=True).is_disabled())
    pg.keyboard.press("Escape")
    approve(pg, "Garden Cottage")
    pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(300)
    pg.get_by_role("button", name=re.compile(r"^C01")).click(); pg.wait_for_timeout(200)
    pg.get_by_role("dialog").get_by_role("button", name="Publish", exact=True).click(); pg.wait_for_timeout(200)
    check("T3 publish from drawer", [u for u in state(pg)["units"] if u["code"] == "C01"][0]["status"] == "published")
    pg.keyboard.press("Escape")

    # T4 specialty preset: Treehouse -> OTHER engine, prefix TH, Next N
    pg.goto(B + "/hms/rooms/new?type=treehouse"); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Back").click(); pg.wait_for_timeout(150)
    check("T4 treehouse works as Other", "Works as" in pg.inner_text("main"))
    pg.get_by_role("button", name="Turn on Other").click(); cont(pg)
    pg.get_by_role("radio", name=re.compile("Create new category")).click()
    pg.get_by_label("Category name").fill("Canopy Treehouse"); pg.get_by_label("Base price per night (৳)").fill("9000"); cont(pg)
    pg.get_by_role("tab", name="Next N").click(); pg.get_by_label("How many").fill("3")
    pg.get_by_role("button", name=re.compile("Add next 3")).click()
    check("T4 TH01–TH03 generated", all(x in pg.inner_text("main") for x in ["TH01", "TH02", "TH03"]))
    cont(pg); cont(pg)
    check("T4 publish disabled for pending category", pg.get_by_role("button", name="Publish 3 units").is_disabled() and "waits for BinGi approval" in pg.inner_text("main"))
    pg.get_by_role("button", name="Create as draft").click(); pg.wait_for_url("**/hms/rooms"); pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(400)
    th = [u for u in state(pg)["units"] if u["code"].startswith("TH")]
    check("T4 treehouse units are OTHER/treehouse", len(th) == 3 and all(u["core"] == "OTHER" and u["preset"] == "treehouse" and u["status"] == "draft" for u in th))

    # T5 Holiday Home switched to Apartment engine (floor based)
    pg.goto(B + "/hms/rooms/new"); pg.wait_for_timeout(400)
    pg.get_by_role("button", name=re.compile(r"^Holiday Home")).click()
    pg.get_by_label("Works as").select_option("APARTMENT")
    pg.get_by_role("button", name="Turn on Apartment").click(); cont(pg)
    pg.get_by_role("radio", name=re.compile("Create new category")).click()
    pg.get_by_label("Category name").fill("Holiday Flat"); pg.get_by_label("Base price per night (৳)").fill("11000"); cont(pg)
    pg.get_by_role("tab", name="Range").click(); pg.get_by_label("Location").select_option(label="Main Building › Floor 4")
    pg.get_by_label("From no.").fill("5"); pg.get_by_label("To no.").fill("6")
    pg.get_by_role("button", name=re.compile(r"^Add H405")).click()
    check("T5 holiday-home codes on floor 4", "H405" in pg.inner_text("main") and "H406" in pg.inner_text("main"), pg.locator("[aria-label='Selected units']").inner_text()[:60])
    cont(pg); cont(pg); pg.get_by_role("button", name="Create as draft").click(); pg.wait_for_url("**/hms/rooms"); pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(400)
    hh = [u for u in state(pg)["units"] if u["preset"] == "holiday-home"]
    check("T5 holiday home stored as APARTMENT", len(hh) == 2 and hh[0]["core"] == "APARTMENT")

    # T13 range reports skipped numbers instead of silently dropping
    pg.goto(B + "/hms/rooms/new?category=cat-r1"); pg.wait_for_timeout(400)
    pg.get_by_role("tab", name="Range").click(); pg.get_by_label("From no.").fill("107"[-1]); pg.get_by_label("To no.").fill("12")
    pg.get_by_role("button", name=re.compile(r"^Add 107")).click()
    st_txt = pg.get_by_role("status").first.inner_text()
    check("T13 existing numbers reported as not added", "Not added" in st_txt and "107" in st_txt, st_txt[:100])

    # T9 save setup draft (numbers not reserved), resume, discard
    pg.get_by_role("button", name="Save setup draft").click(); pg.wait_for_url("**/hms/rooms"); pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(400)
    s = state(pg)
    check("T9 setup draft saved, no units created", len(s["drafts"]) == 1 and "Unfinished additions" in pg.inner_text("main"))
    pg.get_by_role("link", name="Continue").click(); pg.wait_for_timeout(500)
    check("T9 resumes at units step with picks", "Selected (" in pg.inner_text("main") and "Selected (0)" not in pg.inner_text("main"))
    pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Discard").click(); pg.wait_for_timeout(200)
    check("T9 discard", len(state(pg)["drafts"]) == 0)

    # T6 Capsule / Pod: whole-unit pods (no dorm beds), manual numbers, batch cap
    pg.goto(B + "/hms/rooms/new"); pg.wait_for_timeout(400)
    check("T6 no Dormitory type offered", pg.get_by_role("button", name=re.compile(r"^Dormitory")).count() == 0)
    pg.get_by_role("button", name=re.compile(r"^Capsule")).click(); cont(pg)
    pg.get_by_role("radio", name=re.compile("Create new category")).click()
    check("T6 no beds-per-room field", pg.get_by_label("Beds per room").count() == 0)
    pg.get_by_label("Category name").fill("Pod Row"); pg.get_by_label("Base price per night (৳)").fill("900"); cont(pg)
    pg.get_by_role("tab", name="Type numbers").click()
    pg.get_by_label("Numbers").fill("CP301, cp302, bad!!"); pg.get_by_role("button", name="Add numbers").click()
    check("T6 manual: invalid reported, 2 added", "bad!! (invalid)" in pg.inner_text("main") and "Selected (2)" in pg.inner_text("main"))
    pg.get_by_role("tab", name="Next N").click(); pg.get_by_label("How many").fill("100")
    pg.get_by_role("button", name=re.compile("Add next")).click(); pg.wait_for_timeout(200)
    body = pg.inner_text("main")
    check("T19 batch capped at 100", "Selected (100)" in body and "max 100" in body, re.findall(r"Selected \(\d+\)", body)[:1])
    pg.get_by_role("button", name="Clear").first.click() if pg.get_by_role("button", name="Clear").count() else None
    pg.goto(B + "/hms/rooms/new?category=" + [c["id"] for c in state(pg)["categories"] if c["name"] == "Pod Row"][0] if any(c["name"] == "Pod Row" for c in state(pg)["categories"]) else B + "/hms/rooms/numbers")
    d = [c for c in state(pg)["categories"] if c["name"] == "Pod Row"]
    check("T6 pod category not saved until finish", not d)

    # T14 unit drawer: own price invalid, delete draft, move to draft
    pg.get_by_role("button", name=re.compile(r"^C02")).click(); pg.wait_for_timeout(200)
    dlg = pg.get_by_role("dialog")
    dlg.get_by_label("Own price (leave empty to use category)").fill("-5")
    check("T14 invalid own price disables save", dlg.get_by_role("button", name="Save changes").is_disabled())
    dlg.get_by_label("Own price (leave empty to use category)").fill("")
    dlg.get_by_role("button", name="Archive draft").click(); pg.wait_for_timeout(200)
    c2 = [u for u in state(pg)["units"] if u["code"] == "C02"]
    check("T14 draft archived, code kept", c2 and c2[0]["status"] == "archived")
    check("T14 archived hidden + counted", pg.get_by_role("button", name=re.compile(r"^C02")).count() == 0 and re.search(r"1 archived", pg.inner_text("main")))
    pg.get_by_role("button", name=re.compile(r"^101")).first.click(); pg.wait_for_timeout(200)
    check("T14 published unit can't be deleted", pg.get_by_role("dialog").get_by_role("button", name="Archive draft").count() == 0)
    pg.get_by_role("dialog").get_by_role("button", name="Move to draft").click(); pg.wait_for_timeout(200)
    check("T14 move to draft", [u for u in state(pg)["units"] if u["code"] == "101"][0]["status"] == "draft")
    pg.keyboard.press("Escape")
    approve(pg, "Canopy Treehouse"); approve(pg, "Holiday Flat")
    pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(300)
    pg.get_by_role("button", name=re.compile("Publish all drafts")).click(); pg.wait_for_timeout(200)
    check("T14 publish all drafts", all(u["status"] in ("published", "archived") for u in state(pg)["units"]))
    # T20 category archive only when all its units are archived
    pg.goto(B + "/hms/rooms"); pg.wait_for_timeout(300)
    check("T20 no archive while units active", "Garden Cottage" in pg.inner_text("main"))
    pg.evaluate("""() => { const k='bingi-rooms-v1-azure-bay'; const s=JSON.parse(localStorage.getItem(k)); const c=s.categories.find(x=>x.name==='Garden Cottage'); s.units.filter(u=>u.category===c.id).forEach(u=>u.status='archived'); localStorage.setItem(k, JSON.stringify(s)); }""")
    pg.reload(); pg.wait_for_timeout(400)
    pg.get_by_label("More for Garden Cottage").click(); pg.get_by_role("button", name="Archive type").click(); pg.wait_for_timeout(200)
    gc = [c for c in state(pg)["categories"] if c["name"] == "Garden Cottage"]
    check("T20 category archived + hidden", gc and gc[0].get("archived") and pg.locator("main h2").get_by_text("Garden Cottage", exact=True).count() == 0)

    # T15 category edit: duplicate name blocked, rename works
    pg.goto(B + "/hms/rooms"); pg.wait_for_timeout(300)
    pg.get_by_role("button", name=re.compile("^Edit ")).first.click(); dlg = pg.get_by_role("dialog")
    dlg.get_by_label("Room type name").fill("Premier Ocean View"); dlg.get_by_role("button", name="Save room type").click()
    check("T15 duplicate rename blocked", "Another room type has this name" in dlg.inner_text())
    dlg.get_by_label("Room type name").fill("Deluxe Garden Room"); dlg.get_by_role("button", name="Save room type").click(); pg.wait_for_timeout(200)
    check("T15 rename saved", any(c["name"] == "Deluxe Garden Room" for c in state(pg)["categories"]))

    # T12 + T11 edit setup: floor with units can't be removed; building code -> TA-101 preview
    pg.goto(B + "/hms/rooms/setup"); pg.wait_for_timeout(400)
    cont(pg)
    check("T12 used floor can't be removed", pg.get_by_role("button", name="Remove Floor 1").first.is_disabled())
    pg.get_by_role("button", name="Add building").click()
    rows = pg.get_by_label("Building name"); rows.last.fill("Tower A")
    pg.get_by_label("Code (optional)").nth(1).fill("TA")
    pg.get_by_label("Kind").nth(1).select_option("TOWER") if pg.get_by_label("Kind").count() > 1 else None
    pg.get_by_role("button", name="Add floors").last.click()
    cont(pg)
    check("T11 numbering preview shown", "Preview:" in pg.inner_text("main"))
    cont(pg); pg.get_by_role("button", name="Save setup").click(); pg.wait_for_url("**/configuration"); pg.wait_for_timeout(300)
    s = state(pg)
    check("T11 setup version bumped + Tower A saved", s["config"]["version"] >= 2 and any(n["name"] == "Tower A" and n["code"] == "TA" and n["kind"] == "TOWER" for n in s["config"]["nodes"]))
    # T21 stale version: someone else saved meanwhile
    pg.goto(B + "/hms/rooms/setup"); pg.wait_for_timeout(400)
    pg.evaluate("""() => { const k='bingi-rooms-v1-azure-bay'; const s=JSON.parse(localStorage.getItem(k)); s.config.version += 1; localStorage.setItem(k, JSON.stringify(s)); window.dispatchEvent(new StorageEvent('storage',{key:k})); }""")
    cont(pg); cont(pg); cont(pg); pg.get_by_role("button", name="Save setup").click(); pg.wait_for_timeout(300)
    check("T21 stale setup refused", "/setup" in pg.url and pg.get_by_role("button", name="Reload latest").count() == 1)
    pg.get_by_role("button", name="Reload latest").click(); pg.wait_for_timeout(200)
    check("T21 reload clears banner", pg.get_by_role("button", name="Reload latest").count() == 0)
    pg.goto(B + "/hms/rooms/new?category=cat-r1"); pg.wait_for_timeout(400)
    pg.get_by_role("button", name=re.compile(r"^Tower A › Floor 1")).click()
    check("T11 Tower A floor numbers are TA-101", pg.get_by_role("button", name="TA-101", exact=True).count() == 1)

    # T10 start from scratch (other property): intro -> 4-step setup -> wizard
    pg.evaluate("localStorage.setItem('hms-property','tea-valley')"); pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(400)
    pg.get_by_label("More actions").click(); pg.get_by_role("button", name="Start setup from scratch (demo)").click(); pg.wait_for_timeout(300)
    check("T10 intro shown", "Set up your accommodation once" in pg.inner_text("main"))
    pg.get_by_role("link", name="Start setup").click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name=re.compile(r"^Cottage")).click(); cont(pg); cont(pg)
    t = alert_text(pg)
    check("T10 locations required", "building with a floor" in t and "zone" in t, t[:100])
    pg.get_by_role("button", name="Add building").click(); pg.get_by_role("button", name="Add floors").click()
    pg.get_by_role("button", name="Add zone").click(); cont(pg)
    check("T10 preview 101, 102, 103", "101, 102, 103" in pg.inner_text("main"))
    cont(pg); pg.get_by_role("button", name="Save setup").click(); pg.wait_for_url("**/hms/rooms/new"); pg.wait_for_timeout(400)
    pg.get_by_role("button", name=re.compile(r"^Room Standard")).click(); cont(pg)
    pg.get_by_role("radio", name=re.compile("Create new category")).click()
    pg.get_by_label("Category name").fill("Garden Double"); pg.get_by_label("Base price per night (৳)").fill("4500"); cont(pg)
    pg.get_by_role("tab", name="Next N").click(); pg.get_by_label("Location").select_option(label="Main Building › Floor 2"); pg.get_by_label("How many").fill("4")
    pg.get_by_role("button", name=re.compile("Add next 4")).click(); cont(pg); cont(pg)
    pg.get_by_role("button", name="Create as draft").click(); pg.wait_for_url("**/hms/rooms"); pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(400)
    s = state(pg, "tea-valley")
    check("T10 fresh property: 201–204 drafts created", sorted(u["code"] for u in s["units"]) == ["201", "202", "203", "204"] and all(u["status"] == "draft" for u in s["units"]))
    check("T16 other property untouched", len(state(pg)["units"]) > 30 if state(pg) else False)

    # T18 titles
    for slug, want in [("sea-pearl", "Room / Accommodation"), ("mistwood", "Room / Accommodation"), ("wave-bunk", "Room / Accommodation")]:
        pg.evaluate(f"localStorage.setItem('hms-property','{slug}')"); pg.goto(B + "/hms/rooms/numbers"); pg.wait_for_timeout(300)
        check(f"T18 title {slug} = {want}", pg.locator("h1").first.inner_text() == want)
    t = pg.inner_text("main")
    check("T16 wave-bunk: dorm listed as not in this release", "Not in this release" in t and "Dorm beds" not in t)
    check("T16 wave-bunk pods shown as whole units", pg.get_by_role("button", name=re.compile(r"^CP01")).count() >= 1 and "Female Pod Dorm" in t)

    # T17 phone: add a room end to end
    m = br.new_context(viewport={"width": 390, "height": 844}).new_page()
    m.on("pageerror", lambda e: errs.append(str(e)))
    m.goto(B + "/hms/rooms/new?category=cat-c1"); m.wait_for_timeout(500)
    m.evaluate("localStorage.setItem('hms-property','sea-pearl')"); m.goto(B + "/hms/rooms/new?category=cat-c1"); m.wait_for_timeout(500)
    m.get_by_role("button", name="109", exact=True).click(); m.get_by_role("button", name="Continue", exact=True).click(); m.get_by_role("button", name="Continue", exact=True).click()
    m.get_by_role("button", name="Publish 1 unit").click(); m.wait_for_url("**/hms/rooms"); m.goto(B + "/hms/rooms/numbers"); m.wait_for_timeout(400)
    check("T17 phone add works", any(u["code"] == "109" for u in json.loads(m.evaluate("localStorage.getItem('bingi-rooms-v1-sea-pearl')"))["units"]))

    check("no runtime errors", not errs, "; ".join(errs[:3]))
    br.close()
print(f"\n{sum(r[1] for r in results)} / {len(results)}")
