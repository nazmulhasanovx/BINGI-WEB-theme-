# Owner onboarding v8 (21 Nov 2026): live HMS order, easy Rooms part. Full walk, desktop + phone, EN + BN.
from playwright.sync_api import sync_playwright
import re, json, sys, os
B="http://localhost:3100"; F=[]
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read() if os.path.exists("/tmp/axe/node_modules/axe-core/axe.min.js") else None
os.makedirs("/tmp/ob8", exist_ok=True)
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
def walk(b, W, en=True, kind="resort"):
  pg=b.new_page(viewport={"width":W,"height":900 if W>500 else 844}); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:d.accept())
  T=lambda bn,eng: eng if en else bn
  NXT=re.compile(T("পরের ধাপ","^Next"))
  bad=[]; shots=[0]
  def snap(n):
    shots[0]+=1; pg.screenshot(path=f"/tmp/ob8/{W}-{'en' if en else 'bn'}-{shots[0]:02d}-{n}.png", full_page=True)
  def axe():
    if W<1000 or not en or not AXE: return
    pg.add_script_tag(content=AXE)
    r=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes[0].target))")
    if r: bad.append((h1(), r))
  def h1(): return pg.locator("h1").first.inner_text() if pg.locator("h1").count() else "?"
  def nx(name=None):
    axe(); snap(re.sub(r"\W+","-",h1())[:24])
    pg.get_by_role("button",name=NXT).last.click(timeout=8000); pg.wait_for_timeout(450)
  def alert(): a=pg.locator("main:visible [role=alert]"); return a.first.inner_text() if a.count() else ""
  def draft(): return json.loads(pg.evaluate("localStorage.getItem('bingi-onb-v1')"))["drafts"][0]
  def ov(): return pg.evaluate("document.documentElement.scrollWidth>innerWidth+1")
  tag=f"[{W} {'EN' if en else 'BN'} {kind}] "
  pg.goto(B+"/onboarding"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1200)
  if en: pg.get_by_role("button",name="EN",exact=True).click()
  t(tag+"auth: phone first", pg.locator("#ph").count()==1)
  snap("auth")
  pg.locator("#ph").fill("12345"); pg.get_by_role("button",name=re.compile("Send code|কোড পাঠান")).click(); t(tag+"bad phone blocked", pg.locator("#otp").count()==0)
  pg.locator("#ph").fill("01712345678"); pg.get_by_role("button",name=re.compile("Send code|কোড পাঠান")).click(); pg.wait_for_timeout(300)
  pg.locator("#otp").fill("123456"); pg.get_by_role("button",name=re.compile("Verify|যাচাই")).click(); pg.wait_for_timeout(600)
  pg.get_by_role("button",name=re.compile("Add a new property|নতুন")).first.click(); pg.wait_for_timeout(1000)
  # 1.1 type (once)
  pg.get_by_role("radio",name=re.compile({"resort":"Resort|রিসোর্ট","hotel":"^Hotel|^হোটেল"}[kind])).first.click(); nx()
  pg.locator("#pname").fill("Hill View "+kind.title()); nx()
  pg.locator("#ad-road").fill("Kolatoli Road"); pg.locator("#ad-city").fill("Cox's Bazar"); nx()
  # 1.4 extras: important first, all behind a button
  tiles=pg.locator("main:visible [aria-pressed]").count()
  t(tag+"extras: short list first (<=16)", 8<=tiles<=16)
  t(tag+"extras: suggestion pre-ticked", "Free Wi-Fi" in draft()["extras"])
  pg.get_by_role("button",name=re.compile("All amenities|সব সুবিধা")).click(); pg.wait_for_timeout(200)
  t(tag+"extras: all list + search", pg.locator("#am-q").count()==1)
  nx()
  # 1.5 contact
  t(tag+"contact: mobile prefilled + verified", pg.locator("#c-phone").input_value().endswith("345678") and pg.get_by_text(re.compile("Verified|যাচাই হয়েছে")).count()>=1)
  nx()
  # 2.x plan & papers
  t(tag+"documents: NID front/back required", pg.get_by_text(re.compile("NID — front|NID — সামনের")).count()==1)
  nx()
  t(tag+"plan: per room price", re.search(r"/(room/month|রুম/মাস)", pg.locator("main:visible").first.inner_text()) is not None)
  t(tag+"plan: no room packages", "200 rooms" not in pg.locator("main:visible").first.inner_text())
  nx(); nx()  # plan, setup help
  t(tag+"start: 'set up first' is default", pg.get_by_role("radio",name=re.compile("Set up first|আগে সেটআপ")).get_attribute("aria-checked")=="true")
  nx(); nx()  # start, summary
  # 3.1 where: only fitting kinds, presets, zone rename
  body=pg.locator("main:visible").first.inner_text()
  t(tag+"rooms: property type not asked again", "What kind of property" not in body and "কী ধরনের property" not in body)
  t(tag+"where: only fitting kinds shown", (kind=="resort") == ("Apartment" not in body and "অ্যাপার্টমেন্ট" not in body) if kind=="resort" else ("Cottage" not in body and "কটেজ" not in body))
  if kind=="resort":
    pg.locator("main:visible input[placeholder^='Zone 1'], main:visible input[placeholder^='জোন ১']").first.fill("Garden")
  nx()
  # 3.2 add rooms: live "Add New Room" pattern
  def add_type(kind_label, cat, n=5):
    more=pg.get_by_role("button",name=re.compile("Add another type|আরেকটা ধরন"))
    if more.count(): more.first.click(); pg.wait_for_timeout(250)
    tiles=pg.locator("main:visible").get_by_role("button",name=re.compile(r"^(Add (rooms|cottages|villas|flats)|(রুম|কটেজ|ভিলা|ফ্ল্যাট).* যোগ করুন)"))
    if tiles.count()>1: tiles.filter(has_text=re.compile(kind_label)).first.click()
    elif tiles.count()==1: tiles.first.click()
    pg.wait_for_timeout(250)
    pg.locator("main:visible button[aria-pressed]").filter(has_text=re.compile(cat)).first.click()
    t(tag+f"form: price prefilled ({cat})", pg.locator("#acc-price-in").input_value()!="")
    pg.get_by_role("button",name=re.compile("Select numbers|নম্বর বাছাই করুন")).first.click(); pg.wait_for_timeout(250)
    pg.get_by_role("button",name=re.compile("view numbers|নম্বর দেখুন")).first.click(); pg.wait_for_timeout(250)
    pg.get_by_role("button",name=re.compile(r"\+(5|৫)")).click(); pg.get_by_role("button",name=re.compile("^(Done|ঠিক আছে)$")).click(); pg.wait_for_timeout(200)
    snap("places-"+cat[:6]); pg.get_by_role("button",name=re.compile("Save numbers|নম্বর সেভ")).click(); pg.wait_for_timeout(200)
    snap("form-"+cat[:6]); pg.get_by_role("button",name=re.compile(r"^(Add (room|cottage|villa|flat).*|.+ যোগ করুন)$")).last.click(); pg.wait_for_timeout(350)
  add_type("rooms|রুম", "Deluxe|ডিলাক্স")
  t(tag+"rooms: 5 rooms after one type", re.search(r"(Total rooms|মোট রুম)\s*(5|৫)\b", pg.locator("main:visible").first.inner_text()) is not None)
  if kind=="resort":
    add_type("cottages|কটেজ", "Garden Cottage|গার্ডেন কটেজ")
    t(tag+"cottage numbers C1… in zone", re.search(r"\bC1\b", pg.locator("main:visible").first.inner_text()) is not None)
  nx()
  body=pg.locator("main:visible").first.inner_text()
  t(tag+"review: lists codes", re.search(r"\b10[1-5]\b", body) is not None)
  if kind=="resort": t(tag+"review: zone shows owner's name", "Garden" in body)
  nx()
  t(tag+"booking rules", bool(re.search("Booking rules|বুকিংয়ের নিয়ম", h1())))
  rb=pg.locator("main:visible").first.inner_text()
  t(tag+"part banner on first page of part", re.search("Part 4 of 6|ধাপ ৪ / ৬", rb, re.I) is not None)
  t(tag+"rules: children + pets", re.search("Children|বাচ্চা", rb) is not None and re.search("Pets|পোষা প্রাণী", rb) is not None)
  nx(); nx(); nx()  # rules, tools, team
  nx(); nx()  # payments, website
  body=pg.locator("main:visible").first.inner_text()
  t(tag+"finish: required done", re.search("Everything needed to submit is done|জমা দেওয়ার মতো সব তৈরি", body) is not None)
  axe(); snap("finish"); t(tag+"axe clean on every step", not bad); bad and print(bad[:3])
  pg.get_by_role("button",name=re.compile("Submit|জমা দিন")).last.click(); pg.wait_for_timeout(600)
  t(tag+"submitted (prototype)", re.search("Setup submitted|সেটআপ জমা", pg.locator("body").inner_text()) is not None)
  done=pg.locator("body").inner_text()
  t(tag+"done: website checklist + locked publish", re.search("Finish your website|ওয়েবসাইট সাজান", done) is not None and re.search("locked for now|এখনো বন্ধ", done) is not None)
  snap("done")
  t(tag+"no page errors", not errs); errs and print(errs[:2])
  pg.close()
with sync_playwright() as p:
  b=p.chromium.launch()
  walk(b,1440,True,"resort"); walk(b,390,True,"hotel"); walk(b,1440,False,"resort")
  if '--all' in sys.argv: walk(b,768,True,"hotel"); walk(b,390,False,"resort")
  b.close()
print("FAILED:",F) if F else print("ALL PASS")
