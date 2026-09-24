"use client";

import { useState } from "react";
import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";
import { inr } from "@/lib/money";
import { Tab } from "@/components/magic/button";

export default function VendorsPage() {
  const vendors = usePosStore((s) => s.vendors);
  const vendorItems = usePosStore((s) => s.vendorItems);
  const saveVendor = usePosStore((s) => s.saveVendor);
  const deleteVendor = usePosStore((s) => s.deleteVendor);
  const saveVendorItem = usePosStore((s) => s.saveVendorItem);
  const deleteVendorItem = usePosStore((s) => s.deleteVendorItem);

  const [tab, setTab] = useState<"vendors" | "items">("vendors");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState("pcs");

  const addVendor = async () => {
    if (!name.trim()) return;
    await saveVendor({ name, mobile });
    setName(""); setMobile("");
  };
  const addItem = async () => {
    if (!name.trim()) return;
    await saveVendorItem({ name, defaultRate: Number(rate) || undefined, unit });
    setName(""); setRate("");
  };

  const input = "rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60";

  return (
    <div>
      <PageHeader title="Vendor Master" sub="Vendors + purchase item rates." />
      <div className="flex gap-2">
        <Tab active={tab === "vendors"} onClick={() => { setTab("vendors"); setName(""); setMobile(""); setRate(""); }}>🏢 Vendors</Tab>
        <Tab active={tab === "items"} onClick={() => { setTab("items"); setName(""); setMobile(""); setRate(""); }}>🧾 Purchase Items</Tab>
      </div>

      {tab === "vendors" ? (
        <div className="mt-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vendor name" className={input} />
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile" className={input} />
            <button onClick={addVendor} className="ember-btn rounded-xl px-5 text-sm font-bold">+ Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {vendors.map((v) => (
              <div key={v.id} className="glass-card flex items-center justify-between rounded-2xl p-4">
                <div><p className="font-semibold">{v.name}</p><p className="text-xs text-zinc-500">{v.mobile ?? "—"}</p></div>
                <button onClick={() => confirm(`Delete ${v.name}?`) && deleteVendor(v.id)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300">Del</button>
              </div>
            ))}
            {vendors.length === 0 && <p className="text-sm text-zinc-500">No vendors yet.</p>}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_130px_110px_auto]">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name (e.g. Pyro Cartridge)" className={input} />
            <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" placeholder="Default ₹" className={input} />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className={input} />
            <button onClick={addItem} className="ember-btn rounded-xl px-5 text-sm font-bold">+ Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {vendorItems.map((v) => (
              <div key={v.id} className="glass-card flex items-center justify-between rounded-2xl p-4">
                <div><p className="font-semibold">{v.name}</p>
                  <p className="text-xs text-zinc-500">{v.defaultRate ? inr(v.defaultRate) : "—"} {v.unit ? `· ${v.unit}` : ""}</p></div>
                <button onClick={() => confirm(`Delete ${v.name}?`) && deleteVendorItem(v.id)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300">Del</button>
              </div>
            ))}
            {vendorItems.length === 0 && <p className="text-sm text-zinc-500">No purchase items yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
