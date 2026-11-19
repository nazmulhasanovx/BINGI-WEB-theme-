"use client";
// HRM → Department views: one template per department (owner, front desk, housekeeping, kitchen, maintenance, security,
// finance, manager) that sets what that team sees in the HMS panel — sidebar modules, the page it opens on, home cards and
// quick actions. Permissions (view / edit) still come from the role in Settings → Users & roles; this page shows them.
import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Eye, Info, LayoutGrid, Lock, RotateCcw, TriangleAlert } from "lucide-react";
import { useHrm } from "@/lib/hrm/store";
import { useSettings, type Perm, type Role } from "@/lib/settings/store";
import { ACTION, ACTIONS, levelOf, MODULE, MODULES, WIDGET, WIDGETS, keeps, setViewAs, useDeptViews, type DeptView, type ViewId } from "@/lib/hrm/views";
import { useProperty } from "../property";
import { StaffFrame, useToast } from "./Frame";
import { Btn, Card, Chip } from "./ui";

const MAX_W = 6, MAX_A = 4;
const LEVEL: Record<Perm, [string, "green" | "blue" | "gray"]> = { edit: ["Can change", "green"], view: ["View only", "blue"], none: ["No access", "gray"] };

const GROUPS = [...new Set(MODULES.map((m) => m.group))];

export function DeptViewsPage() {
  const h = useProperty();
  const router = useRouter();
  const toast = useToast();
  const { st } = useHrm();
  const { st: s } = useSettings(h);
  const { views, save, reset } = useDeptViews();
  const [mode, setMode] = useState<"one" | "all">("one");
  const [sel, setSel] = useState<ViewId>("front");
  const v = views.find((x) => x.id === sel)!;
  const people = (x: DeptView) => (x.id === "owner" ? 1 : st.employees.filter((e) => e.status === "active" && e.dept === x.dept).length);
  const role = s.roles.find((r) => r.id === v.role);
  const shown = keeps(v);
  const set = (p: Partial<DeptView>, msg = "Saved") => { save({ ...v, ...p }); toast(`${v.name} view · ${msg}`); };
  const toggleMod = (id: string) => {
    if (id === "dashboard" || v.id === "owner") return;
    const on = v.modules.includes(id);
    if (on && id === v.home) return toast("This is the page they open on — pick another first");
    const modules = on ? v.modules.filter((m) => m !== id) : MODULES.map((m) => m.id).filter((m) => m === id || v.modules.includes(m));
    const left = new Set([...modules, "dashboard"]);
    set({ modules, widgets: v.widgets.filter((w) => left.has(WIDGET.get(w)!.module)), actions: v.actions.filter((a) => left.has(ACTION.get(a)!.module)) }, on ? `${MODULE.get(id)!.label} hidden` : `${MODULE.get(id)!.label} shown`);
  };
  const blocked = [...shown].filter((m) => levelOf(v, m, s.roles) === "none");
  const viewAs = () => { setViewAs(v.id); router.push(MODULE.get(v.home)!.href); };

  return (
    <StaffFrame tab="views" hideSearch>
      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#cfdcf7] bg-[#eef3fd] px-4 py-3 text-[13.5px] text-[#1e3a8a]">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>Each department gets its own HMS view: the sidebar, the page it opens on, home cards and quick actions. <b className="font-semibold">What they may change still comes from their role</b> (<Link href="/hms/settings/users" className="font-semibold underline underline-offset-2">Settings → Users &amp; roles</Link>). Prototype: saved in this browser; the backend must check the role too. <span lang="bn">· কোন বিভাগ HMS-এ কী দেখবে</span></p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Show" className="inline-flex gap-0.5 rounded-[12px] border border-hms-line bg-white p-1">
          {([["one", "By department"], ["all", "Compare all"]] as const).map(([k, l]) => <button key={k} role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={clsx("h-9 rounded-[10px] px-3.5 text-[14px] font-semibold", mode === k ? "bg-[#ffecec] text-[#c8232e]" : "text-hms-muted hover:text-hms-ink")}>{l}</button>)}
        </div>
        <p className="text-[13px] text-hms-muted">{views.length} views · {st.employees.filter((e) => e.status === "active").length} active staff</p>
      </div>

      {mode === "one" && (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* list */}
          <div role="listbox" aria-label="Department views" className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {views.map((x) => (
              <button key={x.id} role="option" aria-selected={x.id === sel} onClick={() => setSel(x.id)}
                className={clsx("min-w-[180px] shrink-0 rounded-2xl border bg-white px-4 py-3 text-left transition-colors lg:min-w-0", x.id === sel ? "border-[#f3c4c0] bg-[#fff6f6]" : "border-hms-line hover:border-[#c9ced6]")}>
                <span className="flex items-center justify-between gap-2"><b className={clsx("text-[14.5px]", x.id === sel && "text-[#c8232e]")}>{x.name}</b><span className="text-[12px] text-hms-muted">{people(x)} {x.id === "owner" ? "owner" : "staff"}</span></span>
                <span className="mt-0.5 block text-[12.5px] text-hms-muted"><span lang="bn">{x.bn}</span> · {keeps(x).size} modules · opens {MODULE.get(x.home)!.label}</span>
              </button>
            ))}
          </div>

          <div key={v.id} className="hms-page-in min-w-0 space-y-4">
            {/* head */}
            <section className="rounded-2xl border border-hms-line bg-white p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="mr-auto min-w-0">
                  <h2 className="text-[20px] font-bold tracking-[-0.01em]">{v.name} view <span lang="bn" className="text-[15px] font-medium text-hms-muted">· {v.bn}</span></h2>
                  <p className="mt-0.5 text-[13.5px] text-hms-muted">{v.id === "owner" ? "You, the account owner" : `Everyone in ${v.dept} (${people(v)} active)`} · Role: {role ? <b className="font-semibold text-hms-ink">{role.name}</b> : <b className="font-semibold text-[#9c5f0e]">none yet</b>}</p>
                </div>
                <Btn onClick={() => { reset(v.id); toast(`${v.name} view reset`); }} aria-label={`Reset ${v.name} view`}><RotateCcw className="size-4" />Reset</Btn>
                <Btn kind="primary" onClick={viewAs}><Eye className="size-4" />See HMS as {v.name}</Btn>
              </div>
              {!role && <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#fdf8ec] px-3.5 py-2.5 text-[13.5px] text-[#6b4309]"><TriangleAlert className="size-4 shrink-0" />No role is set for {v.dept}, so they can&apos;t open the HMS yet. Add one in <Link href="/hms/settings/users" className="font-semibold underline underline-offset-2">Users &amp; roles</Link>.</p>}
              {role && blocked.length > 0 && <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#fdf8ec] px-3.5 py-2.5 text-[13.5px] text-[#6b4309]"><TriangleAlert className="size-4 shrink-0" />The {role.name} role has no access to {blocked.map((m) => MODULE.get(m)!.label).join(", ")} — these stay hidden until the role allows them.</p>}
            </section>

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 space-y-4">
                <Card title="Sidebar" right={<span className="text-[13px] text-hms-muted">{shown.size} of {MODULES.length} shown</span>}>
                  <div className="space-y-4">
                    {GROUPS.map((g) => (
                      <div key={g}>
                        <p className="mb-1.5 text-[12.5px] font-semibold text-hms-muted">{g}</p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {MODULES.filter((m) => m.group === g).map((m) => {
                            const on = shown.has(m.id); const lv = levelOf(v, m.id, s.roles); const fixed = m.id === "dashboard" || v.id === "owner";
                            return (
                              <button key={m.id} type="button" role="checkbox" aria-checked={on} aria-label={`Show ${m.label}`} onClick={() => toggleMod(m.id)} disabled={fixed}
                                className={clsx("flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-default", on ? "border-[#f3c4c0] bg-[#fff6f6]" : "border-hms-line bg-white hover:border-[#c9ced6]")}>
                                <span className={clsx("grid size-5 shrink-0 place-items-center rounded-md border", on ? "border-[#c8232e] bg-[#c8232e] text-white" : "border-[#858c97] bg-white")}>{on && (fixed ? <Lock className="size-3" /> : <Check className="size-3.5" />)}</span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium">{m.label}</span>{v.home === m.id && <span className="block text-[12px] font-semibold text-[#c8232e]">Opens here</span>}</span>
                                {on && <Chip tone={LEVEL[lv][1]} className="!px-1.5 !py-0.5 !text-[11.5px]">{LEVEL[lv][0]}</Chip>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Opens on">
                  <label htmlFor="dv-home" className="sr-only">Page they open on</label>
                  <select id="dv-home" value={v.home} onChange={(e) => set({ home: e.target.value }, `opens on ${MODULE.get(e.target.value)!.label}`)} className="h-11 w-full max-w-sm rounded-xl border border-[#858c97] bg-white px-3 text-[14.5px]">
                    {MODULES.filter((m) => shown.has(m.id)).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <p className="mt-1.5 text-[12.5px] text-hms-muted">The first page after they sign in.</p>
                </Card>

                <Card title="Home cards" right={<span className="text-[13px] text-hms-muted">{v.widgets.length} of {MAX_W}</span>}>
                  <div className="flex flex-wrap gap-1.5">
                    {WIDGETS.filter((w) => shown.has(w.module)).map((w) => { const on = v.widgets.includes(w.id); return <button key={w.id} type="button" aria-pressed={on} disabled={!on && v.widgets.length >= MAX_W} onClick={() => set({ widgets: on ? v.widgets.filter((x) => x !== w.id) : [...v.widgets, w.id] })} className={clsx("inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold transition-colors disabled:opacity-40", on ? "bg-hms-ink text-white" : "bg-[#eef0f3] text-[#3a414c] hover:bg-[#e3e6eb]")}>{on && <Check className="size-3.5" />}{w.label}</button>; })}
                  </div>
                </Card>

                <Card title="Quick actions" right={<span className="text-[13px] text-hms-muted">{v.actions.length} of {MAX_A}</span>}>
                  <div className="flex flex-wrap gap-1.5">
                    {ACTIONS.filter((a) => shown.has(a.module)).map((a) => { const on = v.actions.includes(a.id); const ro = levelOf(v, a.module, s.roles) !== "edit"; return <button key={a.id} type="button" aria-pressed={on} disabled={(!on && v.actions.length >= MAX_A) || (ro && !on)} title={ro ? "Their role can't change this module" : undefined} onClick={() => set({ actions: on ? v.actions.filter((x) => x !== a.id) : [...v.actions, a.id] })} className={clsx("inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold transition-colors disabled:opacity-40", on ? "bg-hms-ink text-white" : "bg-[#eef0f3] text-[#3a414c] hover:bg-[#e3e6eb]")}>{on && <Check className="size-3.5" />}{a.label}</button>; })}
                    {ACTIONS.every((a) => !shown.has(a.module)) && <p className="text-[13.5px] text-hms-muted">No actions for these modules.</p>}
                  </div>
                  <p className="mt-2 text-[12.5px] text-hms-muted">Only actions their role can do are offered.</p>
                </Card>
              </div>

              <Preview v={v} roles={s.roles} hotel={h.name} />
            </div>
          </div>
        </div>
      )}

      {mode === "all" && (
        <section aria-label="Compare all views" className="mt-4 overflow-hidden rounded-2xl border border-hms-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[13.5px]">
              <thead><tr className="border-b border-hms-line bg-[#fafafb] text-left text-[12.5px] text-hms-muted">
                <th className="sticky left-0 bg-[#fafafb] px-4 py-3 font-semibold">Module</th>
                {views.map((x) => <th key={x.id} className="px-2 py-3 text-center font-semibold"><button onClick={() => { setSel(x.id); setMode("one"); }} className="hover:text-hms-ink hover:underline">{x.name}</button></th>)}
              </tr></thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m.id} className="border-b border-hms-line last:border-b-0">
                    <td className="sticky left-0 bg-white px-4 py-2 font-medium">{m.label}</td>
                    {views.map((x) => {
                      const on = keeps(x).has(m.id); const lv = levelOf(x, m.id, s.roles);
                      return <td key={x.id} className="px-2 py-2 text-center">{!on ? <span className="text-hms-muted" aria-label="Hidden">—</span> : lv === "none" ? <span className="whitespace-nowrap text-[12px] font-semibold text-[#9c5f0e]">Role blocks</span> : <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[12px] font-semibold", lv === "edit" ? "bg-[#e7f6ec] text-[#1c7d45]" : "bg-[#e6efff] text-[#2457c5]")}>{lv === "edit" ? "Change" : "View"}{x.home === m.id && " · Home"}</span>}</td>;
                    })}
                  </tr>
                ))}
                <tr className="border-t-2 border-hms-line bg-[#fafafb]"><td className="sticky left-0 bg-[#fafafb] px-4 py-2.5 font-semibold">Home cards</td>{views.map((x) => <td key={x.id} className="px-2 py-2.5 text-center text-[12.5px] text-hms-muted">{x.widgets.length}</td>)}</tr>
                <tr className="bg-[#fafafb]"><td className="sticky left-0 bg-[#fafafb] px-4 py-2.5 font-semibold">Quick actions</td>{views.map((x) => <td key={x.id} className="px-2 py-2.5 text-center text-[12.5px] text-hms-muted">{x.actions.map((a) => ACTION.get(a)!.label).join(", ") || "—"}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="border-t border-hms-line px-4 py-3 text-[12.5px] text-hms-muted">Change / View = what their role allows. — = not in their sidebar. Click a name to edit that view.</p>
        </section>
      )}
    </StaffFrame>
  );
}

/** Small picture of the HMS as this department sees it. */
function Preview({ v, roles, hotel }: { v: DeptView; roles: Role[]; hotel: string }) {
  const shown = keeps(v);
  const mods = MODULES.filter((m) => shown.has(m.id) && levelOf(v, m.id, roles) !== "none");
  return (
    <section aria-label={`Preview of ${v.name} view`} className="xl:sticky xl:top-4">
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-hms-muted"><LayoutGrid className="size-4" />Preview</p>
      <div className="overflow-hidden rounded-2xl border border-hms-line bg-[#f4f6f8]">
        <div className="flex">
          <div className="w-[132px] shrink-0 border-r border-hms-line bg-white p-2">
            <p className="truncate px-1.5 pb-2 text-[11.5px] font-bold">{hotel}</p>
            {mods.map((m) => <p key={m.id} className={clsx("truncate rounded-md px-1.5 py-1 text-[11.5px]", m.id === v.home ? "bg-[#c8232e] font-semibold text-white" : "text-[#3a414c]")}>{m.label}</p>)}
          </div>
          <div className="min-w-0 flex-1 p-3">
            <p className="text-[13px] font-bold">{MODULE.get(v.home)!.label}</p>
            <p className="text-[11px] text-hms-muted">{v.name} view</p>
            {v.actions.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{v.actions.map((a, i) => <span key={a} className={clsx("rounded-md px-1.5 py-1 text-[10.5px] font-semibold", i === 0 ? "bg-[#c8232e] text-white" : "border border-hms-line bg-white")}>{ACTION.get(a)!.label}</span>)}</div>}
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {v.widgets.map((w) => <div key={w} className="rounded-lg border border-hms-line bg-white p-2"><p className="truncate text-[10.5px] text-hms-muted">{WIDGET.get(w)!.label}</p><p className="mt-0.5 h-2.5 w-8 rounded bg-[#e3e7ec]" aria-hidden /></div>)}
              {!v.widgets.length && <p className="col-span-2 text-[11px] text-hms-muted">No home cards</p>}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-hms-muted">Numbers fill in from the live modules. Bars are placeholders.</p>
    </section>
  );
}
