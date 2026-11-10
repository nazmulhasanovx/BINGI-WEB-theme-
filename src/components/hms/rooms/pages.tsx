"use client";
// Rooms / Accommodations — Units list, Categories, Setup summary.
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Building2, MapPin, Plus, Search } from "lucide-react";
import { useProperty } from "../property";
import { leaves, nodePath, publishIssues, unitRate, useRooms, type Category, type RoomsState, type Unit } from "@/lib/rooms/store";
import { CORE, TEMPLATES, preset as presetOf, propertyTypeOf, youtubeId, type CoreType } from "@/lib/rooms/catalog";
import { Btn, Chip, Drawer, Empty, Field, Input, Select } from "../staff/ui";
import { AmenityPicker, PRESET_ICON, RoomsFrame, Section, money, useToast } from "./parts";

const fmtStamp = (s?: string) => (s ? `${s.slice(8, 10)} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}${s.length > 10 ? `, ${s.slice(11, 16)}` : ""}` : "—");

// ---------------- Units ----------------
export function UnitsPage() {
  const h = useProperty();
  const { st, update } = useRooms(h);
  const toast = useToast();
  const [q, setQ] = useState("");
  const [core, setCore] = useState<CoreType | "all">("all");
  const [status, setStatus] = useState<"all" | Unit["status"]>("all");
  const [open, setOpen] = useState<string | null>(null);
  const cat = (id: string) => st.categories.find((c) => c.id === id);
  const list = st.units.filter((u) =>
    (core === "all" || u.core === core) && (status === "all" || u.status === status) &&
    (!q || `${u.code} ${cat(u.category)?.name ?? ""} ${presetOf(u.preset).label}`.toLowerCase().includes(q.toLowerCase())));
  const groups = useMemo(() => {
    const g = new Map<string, Unit[]>();
    for (const u of list) g.set(u.node, [...(g.get(u.node) ?? []), u]);
    return [...g.entries()].sort((a, b) => nodePath(st.config, a[0]).localeCompare(nodePath(st.config, b[0]), undefined, { numeric: true }));
  }, [list, st.config]);
  const drafts = st.units.filter((u) => u.status === "draft");
  const beds = st.units.reduce((n, u) => n + (u.beds?.length ?? 0), 0);
  const cores = st.config.enabled.filter((t) => st.units.some((u) => u.core === t));
  const publishAll = () => {
    const ok = drafts.filter((u) => !publishIssues(st, u).length);
    const blocked = drafts.length - ok.length;
    update((s) => { for (const u of s.units) if (ok.some((o) => o.id === u.id)) u.status = "published"; }, `${ok.length} draft units published`);
    toast(blocked ? `${ok.length} published · ${blocked} need fixing first` : `${ok.length} units published`);
  };
  const u = open ? st.units.find((x) => x.id === open) : undefined;

  return (
    <RoomsFrame tab="units">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Units" value={st.units.length} />
        <Stat label="Published" value={st.units.length - drafts.length} />
        <Stat label="Drafts (not bookable)" value={drafts.length} tone={drafts.length ? "amber" : undefined} />
        {beds > 0 ? <Stat label="Dorm beds" value={beds} /> : <Stat label="Categories" value={st.categories.length} />}
      </div>

      {st.drafts.length > 0 && (
        <section className="mt-4 rounded-2xl border border-[#f1dfb8] bg-[#fffaf0] p-4">
          <h2 className="text-[15.5px] font-semibold">Unfinished additions</h2>
          <ul className="mt-2 divide-y divide-[#f1e6cc]">
            {st.drafts.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 py-2.5 text-[14.5px]">
                <span className="min-w-0 flex-1"><b>{presetOf(d.preset).label}</b>{d.category && ` · ${cat(d.category)?.name ?? ""}`} · {d.picks.length} numbers picked (not reserved) · saved {fmtStamp(d.savedAt)}</span>
                <Link href={`/hms/rooms/new?draft=${d.id}`} className="font-medium text-[#c72f26]">Continue</Link>
                <button onClick={() => update((s) => { s.drafts = s.drafts.filter((x) => x.id !== d.id); }, "Setup draft discarded")} className="text-[#5b6170] hover:text-[#1d1f24]">Discard</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <label className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-[#dfe2e8] bg-white px-3.5 sm:max-w-[340px]">
          <Search className="size-[18px] text-[#6b7180]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number or category" aria-label="Search units" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#7b8190]" />
        </label>
        <select aria-label="Type" value={core} onChange={(e) => setCore(e.target.value as CoreType | "all")} className="h-11 rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14.5px]">
          <option value="all">All types</option>{cores.map((t) => <option key={t} value={t}>{CORE[t].plural}</option>)}
        </select>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-11 rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14.5px]">
          <option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option>
        </select>
        {drafts.length > 0 && <Btn className="sm:ml-auto" onClick={publishAll}>Publish all drafts ({drafts.length})</Btn>}
      </div>

      <div className="mt-4 space-y-4">
        {!st.units.length && <div className="rounded-2xl border border-[#eceef2] bg-white"><Empty icon={<Building2 className="size-6" />} title="No units yet" text="Add your first rooms, cottages or beds." action={<Link href="/hms/rooms/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#d8372e] px-4 text-[14.5px] font-medium text-white"><Plus className="size-4" /> Add accommodation</Link>} /></div>}
        {st.units.length > 0 && !list.length && <p className="rounded-2xl border border-[#eceef2] bg-white p-6 text-center text-[15px] text-[#5b6170]">No unit matches these filters.</p>}
        {groups.map(([nid, us]) => (
          <section key={nid} className="rounded-2xl border border-[#eceef2] bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-[15.5px] font-semibold">{st.config.nodes.find((n) => n.id === nid)?.kind === "floor" ? <Building2 className="size-[18px] text-[#5b6170]" /> : <MapPin className="size-[18px] text-[#5b6170]" />}{nodePath(st.config, nid)}<span className="font-normal text-[#5b6170]">· {us.length}</span></h2>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
              {us.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })).map((x) => {
                const Icon = PRESET_ICON[x.preset];
                return (
                  <li key={x.id}>
                    <button onClick={() => setOpen(x.id)} className="w-full rounded-xl border border-[#e6e8ee] p-3 text-left transition-colors hover:border-[#cfd3db] hover:bg-[#fafafb]">
                      <span className="flex items-center justify-between gap-2"><span className="font-mono text-[17px] font-semibold">{x.code}</span><Icon className="size-4 text-[#6b7180]" aria-label={presetOf(x.preset).label} /></span>
                      <span className="mt-0.5 block truncate text-[13.5px] text-[#4b5160]">{cat(x.category)?.name}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Chip tone={x.status === "published" ? "green" : "amber"} className="!px-2 !py-0.5 !text-[12.5px]">{x.status === "published" ? "Published" : "Draft"}</Chip>
                        {x.beds && <span className="text-[12.5px] text-[#5b6170]">{x.beds.length} beds</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      {u && <UnitDrawer st={st} u={u} onClose={() => setOpen(null)} />}
    </RoomsFrame>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "amber" }) {
  return (
    <div className="rounded-2xl border border-[#eceef2] bg-white px-4 py-3">
      <p className="text-[13.5px] text-[#5b6170]">{label}</p>
      <p className={clsx("mt-0.5 text-[24px] font-bold", tone === "amber" && "text-[#9c5f0e]")}>{value}</p>
    </div>
  );
}

function UnitDrawer({ st, u, onClose }: { st: RoomsState; u: Unit; onClose: () => void }) {
  const h = useProperty();
  const { update } = useRooms(h);
  const toast = useToast();
  const cat = st.categories.find((c) => c.id === u.category);
  const [rate, setRate] = useState(u.rate === undefined ? "" : String(u.rate));
  const [video, setVideo] = useState(u.video);
  const [url, setUrl] = useState(u.videoUrl ?? "");
  const [note, setNote] = useState(u.note ?? "");
  const issues = publishIssues(st, u);
  const dirty = rate !== (u.rate === undefined ? "" : String(u.rate)) || video !== u.video || url !== (u.videoUrl ?? "") || note !== (u.note ?? "");
  const badRate = rate !== "" && !(Number(rate) > 0);
  const badUrl = video === "replace" && !youtubeId(url);
  const save = () => {
    update((s) => { const x = s.units.find((y) => y.id === u.id)!; x.rate = rate === "" ? undefined : Number(rate); x.video = video; x.videoUrl = video === "replace" ? url : undefined; x.note = note.trim() || undefined; }, `${u.code} details updated`);
    toast(`${u.code} saved`);
  };
  return (
    <Drawer title={`${presetOf(u.preset).label} ${u.code}`} onClose={onClose} footer={<>
      {u.status === "draft" && <Btn kind="danger" onClick={() => { update((s) => { s.units = s.units.filter((x) => x.id !== u.id); }, `Draft ${u.code} deleted`); toast(`${u.code} deleted`); onClose(); }}>Delete draft</Btn>}
      <span className="mr-auto" />
      {dirty && <Btn disabled={badRate || badUrl} onClick={save}>Save changes</Btn>}
      {u.status === "draft"
        ? <Btn kind="primary" disabled={issues.length > 0 || dirty} onClick={() => { update((s) => { s.units.find((x) => x.id === u.id)!.status = "published"; }, `${u.code} published`); toast(`${u.code} published`); }}>Publish</Btn>
        : <Btn onClick={() => { update((s) => { s.units.find((x) => x.id === u.id)!.status = "draft"; }, `${u.code} moved to draft`); toast(`${u.code} is now a draft (not bookable)`); }}>Move to draft</Btn>}
    </>}>
      <div className="space-y-5">
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[14.5px]">
          <dt className="text-[#5b6170]">Status</dt><dd><Chip tone={u.status === "published" ? "green" : "amber"}>{u.status === "published" ? "Published — can be sold" : "Draft — not bookable"}</Chip></dd>
          <dt className="text-[#5b6170]">Unit code</dt><dd className="font-mono font-semibold">{u.code}</dd>
          <dt className="text-[#5b6170]">Door number</dt><dd className="font-mono">{u.local}</dd>
          <dt className="text-[#5b6170]">Location</dt><dd>{nodePath(st.config, u.node)}</dd>
          <dt className="text-[#5b6170]">Category</dt><dd>{cat?.name ?? "—"}</dd>
          <dt className="text-[#5b6170]">Sold as</dt><dd>{CORE[u.core].label} · {CORE[u.core].inventory.toLowerCase()}</dd>
          <dt className="text-[#5b6170]">Price</dt><dd className="font-semibold">৳{money(unitRate(u, cat))} / {u.core === "DORMITORY" ? "bed / night" : "night"}{u.rate !== undefined && <span className="ml-1.5 text-[12.5px] font-normal text-[#5b6170]">(own price)</span>}</dd>
        </dl>
        {u.status === "draft" && issues.length > 0 && (
          <div role="alert" className="rounded-xl border border-[#f3c4c0] bg-[#fdf0ef] px-3.5 py-2.5 text-[14px] text-[#a3261f]"><p className="font-semibold">Can&apos;t publish yet</p>{issues.map((i) => <p key={i}>{i}</p>)}</div>
        )}
        {u.beds && (
          <div>
            <p className="mb-2 text-[14px] font-semibold">Beds ({u.beds.length}) — each is booked on its own</p>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {u.beds.map((b) => <li key={b.code} className="rounded-lg border border-[#e6e8ee] px-2 py-1.5 text-center"><span className="block font-mono text-[13px] font-semibold">{b.code.split("-").pop()}</span><span className="block text-[11.5px] text-[#5b6170]">{b.label}</span></li>)}
            </ul>
          </div>
        )}
        <div className="space-y-3 border-t border-[#eceef2] pt-4">
          <p className="text-[14px] font-semibold">Only for this unit</p>
          <Field label="Own price (leave empty to use category)" hint={badRate ? "Must be more than 0" : undefined}><Input type="number" min={0} value={rate} placeholder={String(cat?.baseRate ?? "")} onChange={(e) => setRate(e.target.value)} /></Field>
          <Field label="Video"><Select value={video} onChange={(e) => setVideo(e.target.value as Unit["video"])}><option value="inherit">Same as category</option><option value="replace">This unit&apos;s own video</option><option value="hide">No video</option></Select></Field>
          {video === "replace" && <Field label="YouTube link" hint={url && badUrl ? "Only YouTube links" : undefined}><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/…" /></Field>}
          <Field label="Note for staff (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Connecting door to 103" /></Field>
        </div>
        <p className="text-[13px] text-[#5b6170]">Room readiness and maintenance are in Housekeeping; reservations in Bookings. Moving a booked unit to draft is checked against bookings by the HMS backend.</p>
      </div>
    </Drawer>
  );
}

// ---------------- Categories ----------------
export function CategoriesPage() {
  const h = useProperty();
  const { st } = useRooms(h);
  const [edit, setEdit] = useState<string | null>(null);
  const c = edit ? st.categories.find((x) => x.id === edit) : undefined;
  return (
    <RoomsFrame tab="categories">
      {!st.categories.length && <div className="rounded-2xl border border-[#eceef2] bg-white"><Empty icon={<Building2 className="size-6" />} title="No categories yet" text="Categories are created while adding units." /></div>}
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {st.categories.map((x) => {
          const us = st.units.filter((u) => u.category === x.id);
          const Icon = PRESET_ICON[x.preset];
          return (
            <li key={x.id} className="flex flex-col rounded-2xl border border-[#eceef2] bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2f3f6]"><Icon className="size-5 text-[#4b5160]" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold">{x.name}</p>
                  <p className="text-[13.5px] text-[#5b6170]">{presetOf(x.preset).label}{presetOf(x.preset).group !== "standard" && ` · works as ${CORE[x.core].label}`}</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-[13.5px]">
                <div><dt className="text-[#5b6170]">Base price</dt><dd className="font-semibold">৳{money(x.baseRate)}</dd></div>
                <div><dt className="text-[#5b6170]">Units</dt><dd className="font-semibold">{us.length}{us.some((u) => u.status === "draft") && <span className="font-normal text-[#9c5f0e]"> ({us.filter((u) => u.status === "draft").length} draft)</span>}</dd></div>
                <div><dt className="text-[#5b6170]">Guests</dt><dd className="font-semibold">{x.maxAdults}{x.maxChildren ? `+${x.maxChildren}` : ""}</dd></div>
              </dl>
              <p className="mt-2 line-clamp-2 text-[13px] text-[#5b6170]">{x.core === "DORMITORY" ? `${x.bedsPerRoom} beds per room · ` : ""}{x.amenities.join(" · ")}</p>
              <div className="mt-auto flex gap-2 pt-3">
                <Btn className="h-9 flex-1" onClick={() => setEdit(x.id)}>Edit</Btn>
                <Link href={`/hms/rooms/new?category=${x.id}`} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dfe2e8] bg-white text-[14px] font-medium hover:bg-[#f6f7f9]"><Plus className="size-4" /> Add units</Link>
              </div>
            </li>
          );
        })}
      </ul>
      {c && <CategoryDrawer st={st} c={c} onClose={() => setEdit(null)} />}
    </RoomsFrame>
  );
}

function CategoryDrawer({ st, c, onClose }: { st: RoomsState; c: Category; onClose: () => void }) {
  const h = useProperty();
  const { update } = useRooms(h);
  const toast = useToast();
  const [d, setD] = useState<Category>(c);
  const n = st.units.filter((u) => u.category === c.id).length;
  const own = st.units.filter((u) => u.category === c.id && u.rate !== undefined).length;
  const errs = [
    !d.name.trim() && "Name is required",
    st.categories.some((x) => x.id !== c.id && x.name.trim().toLowerCase() === d.name.trim().toLowerCase()) && "Another category has this name",
    !(d.baseRate > 0) && "Base price is required",
    !(d.maxAdults >= 1) && "Max adults must be at least 1",
    d.video && !youtubeId(d.video) && "Video must be a YouTube link",
  ].filter(Boolean) as string[];
  return (
    <Drawer wide title={`Edit ${c.name}`} onClose={onClose} footer={<>
      <Btn onClick={onClose}>Cancel</Btn>
      <Btn kind="primary" disabled={errs.length > 0} onClick={() => { update((s) => { const i = s.categories.findIndex((x) => x.id === c.id); s.categories[i] = { ...d, name: d.name.trim() }; }, `Category ${d.name.trim()} updated (${n} units)`); toast("Category saved"); onClose(); }}>Save</Btn>
    </>}>
      <div className="space-y-4">
        <p className="rounded-xl bg-[#f6f7f9] px-3.5 py-2.5 text-[14px] text-[#4b5160]">{n} units use this category. Changes apply to all of them{own ? `; ${own} with their own price keep it` : ""}. Bookings already made keep their price.</p>
        {errs.length > 0 && <div role="alert" className="text-[14px] text-[#c33029]">{errs.map((e) => <p key={e}>{e}</p>)}</div>}
        <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Base price (৳ / ${d.core === "DORMITORY" ? "bed / night" : "night"})`}><Input type="number" min={0} value={d.baseRate || ""} onChange={(e) => setD({ ...d, baseRate: Number(e.target.value) })} /></Field>
          <Field label="Beds"><Input value={d.bed} onChange={(e) => setD({ ...d, bed: e.target.value })} /></Field>
          <Field label="Max adults"><Input type="number" min={1} value={d.maxAdults} onChange={(e) => setD({ ...d, maxAdults: Number(e.target.value) })} /></Field>
          <Field label="Max children"><Input type="number" min={0} value={d.maxChildren} onChange={(e) => setD({ ...d, maxChildren: Number(e.target.value) })} /></Field>
        </div>
        {d.core === "DORMITORY" && <p className="text-[13.5px] text-[#5b6170]">Beds per room ({d.bedsPerRoom}) can&apos;t be changed here — rooms with bookings would lose beds. Add a new category instead.</p>}
        <Field label="YouTube video (optional)"><Input value={d.video ?? ""} onChange={(e) => setD({ ...d, video: e.target.value || undefined })} placeholder="https://youtu.be/…" /></Field>
        <Field label="Amenities" group><AmenityPicker value={d.amenities} onChange={(a) => setD({ ...d, amenities: a })} /></Field>
      </div>
    </Drawer>
  );
}

// ---------------- Setup summary ----------------
export function ConfigurationPage() {
  const h = useProperty();
  const { st } = useRooms(h);
  const c = st.config;
  const count = (id: string) => st.units.filter((u) => u.node === id || c.nodes.some((n) => n.parent === id && n.id === u.node)).length;
  return (
    <RoomsFrame tab="setup">
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Setup" desc={`Version ${c.version} · saved ${fmtStamp(c.savedAt)}`} right={<Link href="/hms/rooms/setup" className="inline-flex h-10 items-center rounded-xl border border-[#dfe2e8] bg-white px-4 text-[14.5px] font-medium hover:bg-[#f6f7f9]">Edit setup</Link>}>
          <dl className="grid grid-cols-[130px_1fr] gap-y-2 text-[14.5px]">
            <dt className="text-[#5b6170]">Property type</dt><dd className="font-medium">{propertyTypeOf(h.propertyType).label}</dd>
            <dt className="text-[#5b6170]">Types on</dt><dd className="font-medium">{c.enabled.map((t) => CORE[t].plural).join(", ")}</dd>
          </dl>
        </Section>
        <Section title="Numbering">
          <ul className="space-y-1.5 text-[14.5px]">
            {c.enabled.map((t) => <li key={t}><span className="font-medium">{CORE[t].plural}:</span> {TEMPLATES.find((x) => x.v === c.numbering[t].template)?.label} · {leaves(c, t).length} {leaves(c, t).length === 1 ? "location" : "locations"}</li>)}
          </ul>
        </Section>
        <Section title="Locations">
          <ul className="space-y-3 text-[14.5px]">
            {c.nodes.filter((n) => !n.parent).map((p) => (
              <li key={p.id}>
                <p className="font-medium">{p.name}{p.code && <span className="ml-1.5 rounded bg-[#f2f3f6] px-1.5 font-mono text-[12.5px]">{p.code}</span>} <span className="font-normal text-[#5b6170]">· {count(p.id)} units</span></p>
                <p className="mt-1 flex flex-wrap gap-1.5">{c.nodes.filter((n) => n.parent === p.id).map((n) => <span key={n.id} className="rounded-md bg-[#f2f3f6] px-2 py-0.5 text-[13px]">{n.name} · {st.units.filter((u) => u.node === n.id).length}</span>)}</p>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Recent changes">
          <ul className="space-y-2 text-[14px]">
            {st.activity.slice(0, 8).map((a, i) => <li key={i}><span className="text-[#5b6170]">{fmtStamp(a.at)}</span> · {a.text}</li>)}
          </ul>
        </Section>
      </div>
    </RoomsFrame>
  );
}
