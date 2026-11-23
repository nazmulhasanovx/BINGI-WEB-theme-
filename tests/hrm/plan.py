# HR by plan (23 Nov 2026): Business = Team (easy staff list), Ultra = full HR. Same data on both; no Easy/Full switch.
import re, sys
from playwright.sync_api import sync_playwright
B="http://localhost:3100"; R=[]
def t(n, ok, d=""): R.append(ok); print(("PASS " if ok else "FAIL ")+n, "" if ok else d)
with sync_playwright() as p:
  b=p.chromium.launch()
  for W in (1440, 390):
    pg=b.new_page(viewport={"width":W,"height":900 if W>500 else 844}); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    tag=f"[{W}] "
    pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('bingi-news-seen','all')")
    def go(prop, path, view=None):
      pg.evaluate(f"localStorage.setItem('hms-property','{prop}')")
      pg.evaluate(f"sessionStorage.setItem('bingi-view-as','{view}')" if view else "sessionStorage.removeItem('bingi-view-as')")
      pg.goto(B+path); pg.wait_for_timeout(1800)
    M=lambda: pg.locator("main").first
    go("sea-pearl","/hms/staff")
    t(tag+"business: Team page", M().get_by_role("heading",name="Team",exact=True).count()==1)
    t(tag+"business: no Easy/Full switch", M().get_by_role("radiogroup").count()==0 and "Full HR" not in M().inner_text())
    t(tag+"business: no HR tabs", M().get_by_role("navigation",name="Team & HR").count()==0)
    t(tag+"business owner: Ultra card", M().get_by_role("link",name="See Ultra").count()==1)
    n0=M().locator("ul li").count()
    M().get_by_role("button",name=re.compile("Add team member")).first.click(); pg.wait_for_timeout(300)
    pg.get_by_label("Name").fill("Rahim Test"); pg.get_by_label("Mobile number").fill("01711000999"); pg.get_by_label("Role",exact=True).fill("Receptionist")
    pg.get_by_role("button",name=re.compile("Add to team")).click(); pg.wait_for_timeout(500)
    t(tag+"business: add member works", M().locator("ul li").filter(has_text="Rahim Test").count()==1 and M().locator("ul li").count()==n0+1, (n0, M().locator("ul li").count()))
    t(tag+"business: toast shown", pg.get_by_text(re.compile("^Rahim Test added")).count()>=1)
    go("sea-pearl","/hms/staff/people")
    t(tag+"business: People link → Team", M().get_by_role("heading",name="Team",exact=True).count()==1)
    for path in ["/hms/staff/attendance","/hms/staff/payroll","/hms/staff/leave","/hms/staff/people/EMP001"]:
      go("sea-pearl",path); t(tag+f"business {path} → Ultra plan page", "Full HR is part of Ultra" in M().inner_text())
    go("sea-pearl","/hms/staff/views")
    t(tag+"business: Department views still open (Settings tool)", M().get_by_role("heading",name="Department views").count()==1 and M().get_by_role("link",name=re.compile("Team")).count()>=1)
    go("sea-pearl","/hms/staff",view="management")
    t(tag+"business manager: Ultra card", M().get_by_role("link",name="See Ultra").count()==1)
    go("sea-pearl","/hms/staff",view="hr")
    t(tag+"business HR role: Team, no upgrade card", M().get_by_role("heading",name="Team",exact=True).count()==1 and M().get_by_role("link",name="See Ultra").count()==0)
    go("azure-bay","/hms/staff")
    t(tag+"ultra: full HR tabs", M().get_by_role("navigation",name="Team & HR").count()==1 and M().get_by_role("link",name="Payroll").count()>=1)
    t(tag+"ultra: no Easy/Full switch", M().get_by_role("radiogroup",name="Team & HR view").count()==0)
    go("tea-valley","/hms/staff")
    t(tag+"starter: no Team (plan page)", "is part of Business" in M().inner_text())
    t(tag+"no page errors", not errs, "; ".join(errs[:2]))
    pg.close()
  b.close()
print(f"{sum(R)}/{len(R)} passed"); sys.exit(0 if all(R) else 1)
