from playwright.sync_api import sync_playwright
import re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
money=lambda s: float(re.sub(r"[^\d.]","",s.replace("−","")) or 0)*(-1 if "−" in s else 1)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  pg.goto(B+"/hms/finance"); pg.wait_for_timeout(1800); pg.screenshot(path="/tmp/fin/ov.png", full_page=True)
  main=pg.inner_text("main")
  for k in ["Available balance","Paid online","BinGi booking fees","Gateway fees","SMS & email","Online refunds","Paid out to you","How it works","Latest activity"]: t("overview "+k, k in main)
  t("plan fees ultra 4/0.5", "marketplace 4%" in main and "website 0.5%" in main)
  v=lambda l: money(pg.locator(f"p:text-is('{l}') + p").first.inner_text())
  av=v("Available balance"); col=v("Paid online"); fee=v("BinGi booking fees"); gw=v("Gateway fees"); ms=v("SMS & email"); rf=v("Online refunds"); po=v("Paid out to you")
  print(av,col,fee,gw,ms,rf,po)
  t("balance arithmetic", abs(max(0,col-fee-gw-ms-rf-po)-av)<0.02)
  t("subscription invoices link to Settings billing", pg.get_by_role("link",name=re.compile("Subscription invoices")).get_attribute("href")=="/hms/settings/billing")
  # ledger filter
  pg.get_by_role("tab",name="Ledger").click(); pg.wait_for_timeout(400)
  pg.get_by_label("Type").select_option("fee"); pg.wait_for_timeout(300)
  items=pg.locator("main ul li b.block").all_inner_texts(); t("ledger filter fees", len(items)>0 and all(x.startswith("BinGi booking fee") for x in items))
  # statement
  pg.get_by_role("tab",name="Statement").click(); pg.wait_for_timeout(300); t("statement net", "Net for the month" in pg.inner_text("main"))
  # payouts: no account → CTA
  pg.get_by_role("tab",name="Payouts").click(); pg.wait_for_timeout(400)
  t("no account → settings link", "No payout account yet" in pg.inner_text("main") and pg.get_by_role("button",name="Request payout").is_disabled())
  # add account in settings
  pg.goto(B+"/hms/settings/payments"); pg.wait_for_timeout(1500)
  pg.get_by_placeholder("Merchant / personal number").first.fill("01711-000111")
  pg.get_by_role("button",name=re.compile("^Save")).last.click(); pg.wait_for_timeout(600)
  pg.goto(B+"/hms/finance?tab=settlements"); pg.wait_for_timeout(1500)
  t("account listed", "bKash · 01711-000111" in pg.locator("#po-acc").inner_text())
  pg.get_by_label("From").fill("2026-12-01"); pg.get_by_role("button",name="Request payout").last.click()
  t("date check", "Check the dates" in pg.inner_text("main") or "future" in pg.inner_text("main"))
  pg.get_by_label("From").fill("2026-10-01"); pg.get_by_role("button",name="Request payout").last.click(); pg.wait_for_timeout(500)
  t("requested", "Payout of" in pg.inner_text("main") and "requested" in pg.inner_text("main").lower())
  t("available now 0 → button disabled", pg.get_by_role("button",name="Request payout").last.is_disabled())
  pg.goto(B+"/hms/finance"); pg.wait_for_timeout(1300); t("reserved shown", "waiting payout" in pg.inner_text("main"))
  pg.goto(B+"/hms/finance?tab=settlements"); pg.wait_for_timeout(1300)
  pg.get_by_role("button",name="Cancel",exact=True).click(); pg.get_by_role("button",name="Cancel request").click(); pg.wait_for_timeout(400)
  t("cancelled → balance back", not pg.get_by_role("button",name="Request payout").last.is_disabled() and "cancelled" in pg.inner_text("main").lower())
  # messaging cost link: buy credits later in Communication changes SMS & email
  pg.evaluate("localStorage.setItem('hms-property','canopy-nest')"); pg.goto(B+"/hms/finance"); pg.wait_for_timeout(1300)
  t("starter fees 12/1.5", "marketplace 12%" in pg.inner_text("main") and "website 1.5%" in pg.inner_text("main"))
  pg.set_viewport_size({"width":390,"height":844}); pg.goto(B+"/hms/finance"); pg.wait_for_timeout(1200); pg.screenshot(path="/tmp/fin/m.png", full_page=True)
  b.close(); print(errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
