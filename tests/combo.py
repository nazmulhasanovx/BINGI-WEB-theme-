# Cross-module combination check: plan × module, the money path end to end, the same count everywhere,
# and property isolation. Run against the dev server on :3100.
from playwright.sync_api import sync_playwright
import re, json
B="http://localhost:3100"; F=[]
def t(m,c,extra=""): print(("PASS " if c else "FAIL ")+m+(f"  [{extra}]" if extra and not c else "")); c or F.append(m)
num=lambda s: int(re.sub(r"[^\d]","",s.split(".")[0]) or 0)*(-1 if "−" in s else 1)
fnum=lambda s: float(re.sub(r"[^\d.]","",s) or 0)
PLANS={"canopy-nest":"starter","coral-cove":"business","sea-pearl":"business","azure-bay":"ultra"}
RANK={"starter":0,"business":1,"ultra":2}
MODS=[("/hms/housekeeping","housekeeping","business","Housekeeping"),("/hms/meals","meals","business","Restaurant & Bar"),("/hms/other-services","other-services","business","Other services"),("/hms/operations","operations","business","Expenses"),("/hms/inventory","inventory","ultra","Inventory")]
REPORT_NEED={"Restaurant & Bar":"business","Other services":"business","Expenses":"business","Inventory":"ultra","Staff cost":"ultra"}
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear()")
  def go(prop, path, w=1300):
    pg.evaluate(f"localStorage.setItem('hms-property','{prop}')"); pg.goto(B+path); pg.wait_for_timeout(w)
  def kpi(label): return num(pg.locator(f"p:text-is('{label}') + p").first.inner_text())
  def bell():
    pg.get_by_role("button",name=re.compile("Notifications")).click(); pg.wait_for_timeout(350)
    x=pg.get_by_role("dialog",name="Notifications").inner_text(); pg.keyboard.press("Escape"); pg.wait_for_timeout(150); return x
  def pri():
    more=pg.locator("section[aria-labelledby=pri] ul button", has_text=re.compile("^Show \\d+ more"))
    if more.count(): more.click(); pg.wait_for_timeout(200)
    return pg.locator("section[aria-labelledby=pri] ul").inner_text()
  def find(txt, pat):
    m=re.search(pat, txt); return int(m.group(1)) if m else 0

  print("== A. Plan × module (sidebar lock, page gate, reports, payment sources, dashboard)")
  for prop,plan in PLANS.items():
    for path,nid,need,name in MODS:
      allowed=RANK[plan]>=RANK[need]
      go(prop,path,1100)
      lock=pg.locator(f"nav a[href='{path}'] svg[aria-label='Not in your plan']").count()>0
      gate="is part of" in pg.inner_text("main")
      t(f"{prop}({plan}) {name}: lock={lock} gate={gate} expected {'open' if allowed else 'locked'}", lock==(not allowed) and gate==(not allowed))
    go(prop,"/hms/reports")
    labels=pg.locator("nav[aria-label=Reports] button").all_inner_texts()
    bad=[r for r,n in REPORT_NEED.items() if (r in labels)!=(RANK[plan]>=RANK[n])]
    t(f"{prop}({plan}) reports list follows plan", not bad, bad)
    go(prop,"/hms/payments")
    srcs=pg.get_by_label("Source").locator("option").all_inner_texts()
    t(f"{prop}({plan}) payment sources follow plan", ("Restaurant & Bar" in srcs)==(plan!="starter") and ("Other services" in srcs)==(plan!="starter"), srcs)
    go(prop,"/hms")
    pr=pri()
    t(f"{prop}({plan}) dashboard has no gated lines", plan!="starter" or ("QR order" not in pr and "expense" not in pr.lower()))

  print("== B. Same count everywhere (sidebar badge · bell · dashboard · module)")
  for prop in PLANS:
    go(prop,"/hms",1600)
    b_txt=bell(); d_txt=pri()
    chat_badge=pg.locator("nav a[href='/hms/chat'] span[aria-label$='unread']"); cb=int(chat_badge.first.inner_text()) if chat_badge.count() else 0
    t(f"{prop} chat unread: badge={cb} bell={find(b_txt,r'(\d+) unread')} dash={find(d_txt,r'(\d+) unread')}", cb==find(b_txt,r"(\d+) unread")==find(d_txt,r"(\d+) unread"))
    mb=pg.locator("nav a[href='/hms/meals'] span[aria-label$='waiting']"); m=int(mb.first.inner_text()) if mb.count() else 0
    t(f"{prop} QR waiting: badge={m} bell={find(b_txt,r'(\d+) orders? waiting')} dash={find(d_txt,r'(\d+) QR orders? waiting')}", m==find(b_txt,r"(\d+) orders? waiting")==find(d_txt,r"(\d+) QR orders? waiting"))
    col_d=find(d_txt,r"(\d+) guests? to collect"); col_b=find(b_txt,r"(\d+) guests? to collect")
    ex_d=find(d_txt,r"(\d+) expenses? waiting"); ex_b=find(b_txt,r"(\d+) expenses? waiting")
    rf_d=find(d_txt,r"(\d+) refunds? to give"); rf_b=find(b_txt,r"(\d+) refunds? to give")
    fl_d=find(d_txt,r"(\d+) messages? not delivered"); fl_b=find(b_txt,r"(\d+) messages? not delivered")
    t(f"{prop} to collect bell={col_b} dash={col_d}", col_b==col_d)
    t(f"{prop} expenses waiting bell={ex_b} dash={ex_d}", ex_b==ex_d)
    t(f"{prop} refunds bell={rf_b} dash={rf_d}", rf_b==rf_d)
    t(f"{prop} failed messages bell={fl_b} dash={fl_d}", fl_b==fl_d)
    go(prop,"/hms/payments?tab=refunds"); n_rf=pg.locator("main ul li").count() if "No refunds waiting" not in pg.inner_text("main") else 0
    t(f"{prop} refunds tab ({n_rf}) = dashboard ({rf_d})", n_rf==rf_d)
    if PLANS[prop]!="starter":
      go(prop,"/hms/operations"); ov=kpi("Waiting approval"); t(f"{prop} Expenses waiting ({ov}) = dashboard ({ex_d})", ov==ex_d)
    go(prop,"/hms/communication?tab=history"); pg.get_by_label("Status").select_option("failed"); pg.wait_for_timeout(250)
    nf=0 if "No messages match" in pg.inner_text("main") else pg.locator("main ul li").count()
    t(f"{prop} failed messages in history ({nf}) = dashboard ({fl_d})", nf==fl_d)

  print("== C. Money path on azure-bay (cash payment → Payments, Cashbox, Reports, Dashboard)")
  P="azure-bay"
  go(P,"/hms/payments"); pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(250); col0=kpi("Collected"); due0=kpi("Balance due")
  go(P,"/hms/reports?r=daily"); pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(300); rc0=kpi("Collections"); rex0=kpi("Expenses paid"); rnet0=kpi("Net cash")
  go(P,"/hms/cashbox"); cb0=pg.inner_text("main")
  go(P,"/hms/payments?tab=collect"); lk=pg.get_by_role("link",name="Take payment").first; code=re.search(r"b=([^&]+)",lk.get_attribute("href")).group(1); lk.click(); pg.wait_for_timeout(1500)
  pg.locator("#pay-amt").fill("1234"); pg.get_by_role("button",name=re.compile("^Record payment")).click(); pg.wait_for_timeout(900)
  go(P,"/hms/payments"); pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(250)
  t("Payments: collected +1,234", kpi("Collected")-col0==1234, (col0,kpi("Collected"))); t("Payments: balance due −1,234", due0-kpi("Balance due")==1234)
  go(P,"/hms/reports?r=daily"); pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(300)
  t("Reports: collections +1,234", kpi("Collections")-rc0==1234, (rc0,kpi("Collections")))
  go(P,"/hms/cashbox/movements"); t("Cashbox: the 1,234 cash is in movements", "1,234" in pg.inner_text("main"))
  go(P,"/hms/reports?r=register"); 

  print("== D. Expense paid in cash → Cashbox, Expenses, Reports (net cash, costs)")
  go(P,"/hms/operations"); sp0=kpi("Spent")
  pg.get_by_role("button",name="New expense").click(); pg.get_by_label("What for").fill("Combo test plumber"); pg.get_by_label("Amount (৳)").fill("800")
  pg.get_by_label("Date").fill("2026-11-10"); pg.get_by_role("button",name="Save expense").click(); pg.wait_for_timeout(400)
  pg.get_by_role("dialog").get_by_role("button",name=re.compile("^Pay ")).click(); pg.wait_for_timeout(300); pg.get_by_role("button",name=re.compile("^Record payment")).click(); pg.wait_for_timeout(500)
  err=pg.get_by_role("dialog").locator("[role=alert]"); t("expense paid from cashbox (no error)", err.count()==0, err.first.inner_text() if err.count() else "")
  pg.keyboard.press("Escape")
  go(P,"/hms/operations"); t("Expenses: spent +800", kpi("Spent")-sp0==800, (sp0,kpi("Spent")))
  go(P,"/hms/reports?r=daily"); pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(300)
  ex1=kpi("Expenses paid"); net1=kpi("Net cash"); c1=kpi("Collections"); rf1=kpi("Refunds")
  t("Reports: expenses paid +800", ex1-rex0==800, (rex0,ex1)); t("Reports: net cash = collections − refunds − expenses", net1==c1-rf1-ex1)
  go(P,"/hms/cashbox/movements"); t("Cashbox: 'Expense paid' 800", "Expense paid" in pg.inner_text("main") and "800" in pg.inner_text("main"))
  go(P,"/hms/reports?r=profit"); pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(300)
  t("Reports profit: costs include the expense", "Repairs" in pg.inner_text("main") or "Utilities" in pg.inner_text("main") or "Supplies" in pg.inner_text("main"))

  print("== E. Communication → Finance")
  go(P,"/hms/finance"); fm0=fnum(pg.locator("p:text-is('SMS & email') + p").inner_text()); av0=fnum(pg.locator("p:text-is('Available balance') + p").inner_text())
  go(P,"/hms/communication?tab=history"); pg.get_by_role("button",name="New message").click(); pg.locator("#cm-t").fill("Dear {guest}, your room is ready."); pg.get_by_role("button",name=re.compile("^Send")).click(); pg.wait_for_timeout(400)
  go(P,"/hms/finance"); fm1=fnum(pg.locator("p:text-is('SMS & email') + p").inner_text()); av1=fnum(pg.locator("p:text-is('Available balance') + p").inner_text())
  t("Finance: SMS cost +0.50", abs(fm1-fm0-0.5)<0.01, (fm0,fm1)); t("Finance: available −0.50", abs(av0-av1-0.5)<0.01 or av0==0, (av0,av1))

  print("== F. Chat read → badge, bell, dashboard drop together")
  go(P,"/hms",1500); u0=int(pg.locator("nav a[href='/hms/chat'] span[aria-label$='unread']").first.inner_text())
  go(P,"/hms/chat"); pg.get_by_role("button",name=re.compile("^Unread")).click(); pg.wait_for_timeout(200); pg.locator("aside ul li button").first.click(); pg.wait_for_timeout(700)
  go(P,"/hms",1500); bb=pg.locator("nav a[href='/hms/chat'] span[aria-label$='unread']"); u1=int(bb.first.inner_text()) if bb.count() else 0
  t(f"chat unread dropped ({u0}→{u1}) and bell/dashboard agree", u1<u0 and find(bell(),r"(\d+) unread")==u1==find(pri(),r"(\d+) unread"))

  print("== H. Website booking with bKash advance → HMS Bookings, Payments, Finance")
  go(P,"/hms/finance"); on0=fnum(pg.locator("p:text-is('Paid online') + p").inner_text()); fee0=fnum(pg.locator("p:text-is('BinGi booking fees') + p").inner_text())
  pg.goto(B+"/hotel/azure-bay/rooms?in=2026-11-24&out=2026-11-26&adults=2"); pg.wait_for_timeout(2000)
  h=pg.evaluate("[...new Set([...document.querySelectorAll('main a[href*=\"/rooms/\"]')].map(a=>a.getAttribute('href')))]")[0]
  pg.goto(B+h); pg.wait_for_timeout(1800); pg.get_by_role("button",name="Reserve").locator("visible=true").first.click(); pg.wait_for_timeout(1500)
  pg.get_by_role("button",name="Continue").click(); pg.wait_for_timeout(1500)
  pg.get_by_placeholder("As on your ID").fill("Combo Webguest"); pg.locator("#otp-phone").fill("1712000999"); pg.get_by_role("button",name="Send code").click(); pg.wait_for_timeout(400)
  pg.locator("#otp-code").fill("123456"); pg.get_by_role("button",name="Verify").click(); pg.wait_for_timeout(400)
  pg.get_by_text(re.compile("^Pay 30% now")).click(); pg.wait_for_timeout(300)
  adv=num(re.search(r"Pay 30% now with bKash\s*৳([\d,]+) now", pg.locator("main").inner_text()).group(1))
  pg.get_by_placeholder("e.g. 9JH4K2L8PQ").fill("COMBO7TRX9"); pg.get_by_role("checkbox").last.check()
  pg.get_by_role("button",name=re.compile("^Book (· pay|now · pay)")).first.click(); pg.wait_for_timeout(2500)
  t("website booking confirmed page", "/confirmation" in pg.url or "confirmed" in pg.inner_text("body").lower(), pg.url)
  go(P,"/hms",1800); t("dashboard shows the website request", re.search(r"\d+ website requests? to accept", pri()) is not None)
  t("bell shows the website request", "website request" in bell())
  go(P,"/hms/bookings",1800)
  li=pg.locator("section[aria-label='Website requests'] li", has_text="Combo Webguest")
  t("request waits in Bookings › Today", li.count()==1)
  li.get_by_role("checkbox").check(); li.get_by_role("button",name="Accept").click(); pg.wait_for_timeout(1500)
  go(P,"/hms/bookings/list",1800); srch=pg.get_by_placeholder('Search guest name, phone, booking ID or room…')
  if srch.count(): srch.fill("Combo Webguest"); pg.wait_for_timeout(400)
  t("accepted booking is in HMS Bookings", "Combo Webguest" in pg.inner_text("main"), pg.inner_text("main")[:200])
  go(P,"/hms/payments"); pg.get_by_placeholder("Booking, guest, reference").fill("Combo Webguest"); pg.wait_for_timeout(300)
  rowt=pg.locator("main table tbody").inner_text() if pg.locator("main table tbody tr").count() else ""
  t("Payments shows the website advance with gateway reference", "Website" in rowt or "COMBO7TRX9" in rowt, rowt[:120])
  go(P,"/hms/finance"); on1=fnum(pg.locator("p:text-is('Paid online') + p").inner_text()); fee1=fnum(pg.locator("p:text-is('BinGi booking fees') + p").inner_text())
  t(f"Finance: paid online +{adv}", abs(on1-on0-adv)<1, (on0,on1)); t("Finance: website booking fee added", fee1>fee0, (fee0,fee1))

  print("== I. HMS settings → public website (one home)")
  go("sea-pearl","/hms/settings/policies",1500)
  pg.get_by_label("Free cancellation days").fill("3"); pg.get_by_role("button",name=re.compile("^Save")).last.click(); pg.wait_for_timeout(500)
  pg.goto(B+"/hotel/sea-pearl/policies"); pg.wait_for_timeout(1800)
  t("website policy follows HMS (3 days)", "Free cancellation up to 3 days" in pg.inner_text("main"))
  pg.goto(B+"/hotel/sea-pearl/checkout?room=x"); 
  go("sea-pearl","/hms/settings/payments",1500)
  pg.get_by_label("bKash account").fill("01811-222333") if pg.get_by_label("bKash account").count() else None
  pg.get_by_role("switch",name="bKash on website").click(); pg.wait_for_timeout(200)
  pg.get_by_role("button",name=re.compile("^Save")).last.click(); pg.wait_for_timeout(500)
  pg.goto(B+"/hotel/sea-pearl/policies"); pg.wait_for_timeout(1800)
  t("website payments follow HMS (bKash off on website)", "bKash" not in pg.locator("main").inner_text().split("Payments & tax")[-1][:200], pg.locator("main").inner_text().split("Payments & tax")[-1][:200])

  print("== G. Property isolation")
  go("sea-pearl","/hms/payments"); t("sea-pearl has no azure payment", code not in pg.inner_text("main"))
  go("sea-pearl","/hms/operations?tab=list"); t("sea-pearl has no azure expense", "Combo test plumber" not in pg.inner_text("main"))
  go("sea-pearl","/hms/communication?tab=history"); t("sea-pearl has no azure message", "your room is ready" not in pg.inner_text("main"))
  b.close(); print(errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
