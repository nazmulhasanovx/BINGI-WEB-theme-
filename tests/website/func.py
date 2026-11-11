import asyncio, json, sys, re
from playwright.async_api import async_playwright
B="http://localhost:3100"; RES=[]
ONLY=sys.argv[1:]
async def fresh(pg, prop="sea-pearl", page="overview"):
    await pg.goto(B+"/hms/website/overview"); await pg.evaluate(f"localStorage.clear(); localStorage.setItem('hms-property','{prop}')")
    await pg.goto(B+f"/hms/website/{page}", wait_until="load"); await pg.wait_for_timeout(1200)
async def go(pg, page): await pg.goto(B+f"/hms/website/{page}", wait_until="load"); await pg.wait_for_timeout(1200)
async def publish(pg):
    await go(pg,"publish"); await pg.get_by_role("button", name="Publish now").click(); await pg.wait_for_timeout(600)
async def live(ctx, path, lang=None):
    p=await ctx.new_page()
    await p.goto(B+path, wait_until="networkidle"); await p.wait_for_timeout(900)
    return p
async def T(name, fn, pg, ctx):
    if ONLY and name not in ONLY: return
    try:
        r=await fn(pg, ctx); ok = r is True or (isinstance(r,tuple) and r[0])
        RES.append((name, ok, "" if ok else str(r)[:300]))
    except Exception as e: RES.append((name, False, type(e).__name__+": "+" / ".join(str(e).split("\n")[:3])[:300]))
    print(("PASS " if RES[-1][1] else "FAIL ")+name, "" if RES[-1][1] else RES[-1][2])
    for p in ctx.pages[1:]: await p.close()

async def nav_all(pg, ctx):
    await fresh(pg); n=0
    for x in ["Theme & Style","Homepage","Pages & Menu","Photos","Rooms","Services & Dining","Offers","Reviews","Contact & Policies","Booking Engine","Inquiries","Google & Sharing","Domain","Languages","Online On/Off","Publish","Overview"]:
        await pg.get_by_role("complementary", name="Website Management").get_by_role("link", name=x, exact=True).click(); await pg.wait_for_timeout(250); n+=1
    return n==17
async def draft_not_live(pg, ctx):
    await fresh(pg, page="homepage")
    inp=pg.locator("input").filter(has=pg.locator("xpath=.")).first
    await pg.get_by_label("Headline").first.fill("Draft headline test")
    await pg.wait_for_timeout(1500)
    l=await live(ctx,"/hotel/sea-pearl"); h=await l.inner_text("h1")
    return "Draft headline test" not in h, h
async def publish_live(pg, ctx):
    await fresh(pg, page="homepage"); await pg.get_by_label("Headline").first.fill("Published headline test"); await pg.wait_for_timeout(800)
    await publish(pg); l=await live(ctx,"/hotel/sea-pearl"); h=await l.inner_text("h1")
    return "Published headline test" in h, h
async def preview_draft(pg, ctx):
    await fresh(pg, page="homepage"); await pg.get_by_label("Headline").first.fill("Preview only text"); await pg.wait_for_timeout(1500)
    fr=pg.frame_locator("iframe").first; t=await fr.locator("h1").first.inner_text(timeout=8000)
    return "Preview only text" in t, t
async def theme_switch(pg, ctx):
    await fresh(pg, page="design"); await pg.get_by_role("button", name=re.compile("^VILLA")).first.click(); await pg.wait_for_timeout(500)
    await publish(pg); l=await live(ctx,"/hotel/sea-pearl"); has=await l.locator("text=Choose your villa").count()
    return has>0, has
async def plan_lock(pg, ctx):
    await fresh(pg, "tea-valley", "design"); before=await pg.evaluate("JSON.parse(localStorage.getItem('bingi-site-v1-tea-valley')||'null')?.draft?.master")
    card=pg.get_by_text("CITY", exact=True).first; await card.click(force=True); await pg.wait_for_timeout(500)
    after=await pg.evaluate("JSON.parse(localStorage.getItem('bingi-site-v1-tea-valley')||'null')?.draft?.master")
    return after in (None,"nest"), (before,after)
async def colour(pg, ctx):
    await fresh(pg, page="design"); await pg.get_by_role("button", name="Forest").click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl"); b=await l.evaluate("getComputedStyle(document.getElementById('hotel-theme')).getPropertyValue('--brand')")
    return b.strip().lower() in ("#2f7d4e",), b
async def hide_section(pg, ctx):
    await fresh(pg, page="homepage"); before=None
    l=await live(ctx,"/hotel/sea-pearl"); before=await l.locator("[data-section=offers]").count(); await l.close()
    btns=pg.get_by_role("button", name="Hide section"); n=await btns.count()
    # find offers row
    row=pg.locator("div", has=pg.get_by_text("Offers", exact=True)).filter(has=pg.get_by_role("button", name="Hide section")).last
    await row.get_by_role("button", name="Hide section").click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl"); after=await l.locator("[data-section=offers]").count()
    return before>0 and after==0, (before,after)
async def reorder(pg, ctx):
    await fresh(pg, page="homepage")
    l=await live(ctx,"/hotel/sea-pearl"); o1=await l.evaluate("[...document.querySelectorAll('[data-section]')].map(e=>e.dataset.section).join(',')"); await l.close()
    await pg.get_by_role("button", name="Move down").nth(1).click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl"); o2=await l.evaluate("[...document.querySelectorAll('[data-section]')].map(e=>e.dataset.section).join(',')")
    return o1!=o2, (o1,o2)
async def menu_off(pg, ctx):
    await fresh(pg, page="pages"); await pg.get_by_role("switch", name=re.compile("Offers.*menu|menu.*Offers", re.I)).first.click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl"); n=await l.locator("header nav a", has_text="Offers").count()
    return n==0, n
async def rooms_hide(pg, ctx):
    await fresh(pg, page="rooms"); sw=pg.get_by_role("switch", name=re.compile("visible$")).first; nm=(await sw.get_attribute("aria-label")).replace(" visible","")
    await sw.click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl/rooms"); n=await l.get_by_text(nm, exact=True).count()
    return n==0, (nm,n)
async def service_hide(pg, ctx):
    await fresh(pg, "azure-bay", "services"); sw=pg.get_by_role("switch", name=re.compile("on website$")).first; nm=(await sw.get_attribute("aria-label")).replace(" on website","")
    await sw.click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/azure-bay/experiences"); n=await l.get_by_text(nm).count()
    return n==0, (nm,n)
async def offer_hide(pg, ctx):
    await fresh(pg, "azure-bay", "offers"); sw=pg.get_by_role("switch", name=re.compile("visible$")).first; nm=(await sw.get_attribute("aria-label")).replace(" visible","")
    await sw.click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/azure-bay/offers"); n=await l.get_by_text(nm).count()
    return n==0, (nm,n)
async def review_hide(pg, ctx):
    await fresh(pg, "azure-bay", "reviews"); sw=pg.get_by_role("switch", name=re.compile("^Show review by")).first; nm=(await sw.get_attribute("aria-label")).replace("Show review by ","")
    await sw.click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/azure-bay"); n=await l.get_by_text(nm).count()
    return n==0, (nm,n)
async def phone_edit(pg, ctx):
    await fresh(pg, page="info"); await pg.get_by_label("Phone").fill("+880 1999-123456"); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl"); n=await l.locator("footer").get_by_text("1999-123456").count()
    return n>0, n
async def policy_edit(pg, ctx):
    await fresh(pg, page="info"); await pg.get_by_label("Cancellation").fill("Test cancellation policy 72 hours."); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl/policies"); n=await l.get_by_text("Test cancellation policy 72 hours.").count()
    return n>0, n
async def seo_title(pg, ctx):
    await fresh(pg, page="seo"); await pg.get_by_label("Page title").fill("{{page}} | SEA PEARL TEST"); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl"); t=await l.title()
    return "SEA PEARL TEST" in t, t
async def seo_counter(pg, ctx):
    await fresh(pg, page="seo"); await pg.get_by_label("Description").fill("x"*160); await pg.wait_for_timeout(200)
    t=await pg.inner_text("main"); return "160/155" in t or "155/155" in t, re.findall(r"\d+/155", t)
async def domain_valid(pg, ctx):
    await fresh(pg, page="domain"); inp=pg.get_by_placeholder("www.yourhotel.com"); await inp.fill("not a domain")
    a=await pg.get_by_role("button", name="Save domain").is_disabled(); await inp.fill("www.seapearl.com.bd"); b=await pg.get_by_role("button", name="Save domain").is_enabled()
    return a and b, (a,b)
async def domain_save(pg, ctx):
    await fresh(pg, page="domain"); await pg.get_by_placeholder("www.yourhotel.com").fill("www.seapearl.com.bd"); await pg.get_by_role("button", name="Save domain").click(); await pg.wait_for_timeout(300)
    t=await pg.inner_text("main"); return "seapearl.com.bd" in t and ("DNS" in t or "Pending" in t or "pending" in t or "record" in t.lower()), t[:300]
async def bangla(pg, ctx):
    await fresh(pg, page="languages"); fields=pg.get_by_placeholder("বাংলায় লিখুন"); await fields.first.fill("বাংলা শিরোনাম পরীক্ষা"); await pg.wait_for_timeout(300); await publish(pg)
    l=await ctx.new_page(); await l.goto(B+"/hotel/sea-pearl"); await l.evaluate("localStorage.setItem('bingi-lang','bn')"); await l.reload(wait_until="networkidle"); await l.wait_for_timeout(900)
    btn=l.locator("button", has_text="বা").first
    if await btn.count(): await btn.click(); await l.wait_for_timeout(600)
    h=await l.inner_text("h1"); return "বাংলা শিরোনাম পরীক্ষা" in h, h
async def online_off(pg, ctx):
    await fresh(pg, page="online"); await pg.get_by_role("switch", name=re.compile("Website booking", re.I)).first.click(); await pg.wait_for_timeout(300)
    # switches apply at once (no publish step) — "Pause new bookings or orders anytime"
    l=await live(ctx,"/hotel/sea-pearl"); lt=await l.inner_text("body")
    return ("paus" in lt.lower() or "not taking" in lt.lower() or "closed" in lt.lower()), ("live shows paused?", [x for x in lt.split("\n") if "paus" in x.lower()][:2])
async def inquiries(pg, ctx):
    await fresh(pg, page="inquiries"); await pg.get_by_role("button", name="Mark replied").first.click(); await pg.wait_for_timeout(300)
    t=await pg.inner_text("main"); return "New (0)" in t or "Replied (1)" in t, re.findall(r"(New|Replied|Closed) \(\d+\)", t)
async def discard(pg, ctx):
    await fresh(pg, page="design"); await pg.get_by_role("button", name="Forest").click(); await pg.wait_for_timeout(300)
    await go(pg,"publish"); b=pg.get_by_role("button", name=re.compile("Discard"))
    if not await b.count(): return False, "no Discard button on publish page"
    await b.first.click(); await pg.wait_for_timeout(300); t=await pg.inner_text("body"); return "Everything is live" in t, [x for x in t.split("\n") if "live" in x.lower() or "change" in x.lower()][:5]
async def restore(pg, ctx):
    await fresh(pg, page="homepage"); await pg.get_by_label("Headline").first.fill("Version two"); await pg.wait_for_timeout(500); await publish(pg)
    await pg.get_by_role("button", name="Restore").last.click(); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/sea-pearl"); h=await l.inner_text("h1"); return "Version two" not in h, h
async def per_property(pg, ctx):
    await fresh(pg, page="homepage"); await pg.get_by_label("Headline").first.fill("Only Sea Pearl"); await pg.wait_for_timeout(500)
    await pg.evaluate("localStorage.setItem('hms-property','azure-bay')"); await go(pg,"homepage")
    v=await pg.get_by_label("Headline").first.input_value(); return "Only Sea Pearl" not in v, v
async def persist(pg, ctx):
    await fresh(pg, page="homepage"); await pg.get_by_label("Headline").first.fill("Reload persists"); await pg.wait_for_timeout(800); await pg.reload(wait_until="load"); await pg.wait_for_timeout(600)
    v=await pg.get_by_label("Headline").first.input_value(); return v=="Reload persists", v
async def photo_upload(pg, ctx):
    await fresh(pg, page="photos"); n0=await pg.locator("main img").count()
    from PIL import Image; Image.new("RGB",(1200,800),(30,120,90)).save("/tmp/wmqa/up.jpg")
    await pg.locator("input[type=file]").first.set_input_files("/tmp/wmqa/up.jpg"); await pg.wait_for_timeout(1200)
    n1=await pg.locator("main img").count(); return n1>n0, (n0,n1)
async def unpublished_badge(pg, ctx):
    await fresh(pg, page="design"); await pg.get_by_role("button", name="Forest").click(); await pg.wait_for_timeout(300)
    t=await pg.inner_text("body"); return bool(re.search(r"1 change|unpublished|Publish \(1\)", t, re.I)), [x for x in t.split("\n") if "change" in x.lower()][:3]
async def section_title(pg, ctx):
    await fresh(pg, "mistwood", "homepage"); await pg.get_by_text("Cottages", exact=True).first.click(); await pg.wait_for_timeout(300)
    await pg.get_by_label("Section title").fill("Our five cottages"); await pg.wait_for_timeout(300); await publish(pg)
    l=await live(ctx,"/hotel/mistwood"); n=await l.get_by_text("Our five cottages").count(); return n>0, n

TESTS=[nav_all,draft_not_live,publish_live,preview_draft,theme_switch,plan_lock,colour,hide_section,reorder,menu_off,rooms_hide,service_hide,offer_hide,review_hide,phone_edit,policy_edit,seo_title,seo_counter,domain_valid,domain_save,bangla,online_off,inquiries,discard,restore,per_property,persist,photo_upload,unpublished_badge,section_title]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); ctx=await b.new_context(viewport={'width':1440,'height':900})
    pg=await ctx.new_page(); pg.set_default_timeout(12000); errs=[]; pg.on("dialog", lambda d: asyncio.ensure_future(d.accept())); pg.on("pageerror", lambda e: errs.append(str(e)))
    for t in TESTS: await T(t.__name__, t, pg, ctx)
    print("\n",sum(r[1] for r in RES),"/",len(RES),"page errors:",errs[:3])
    await b.close()
asyncio.run(main())
