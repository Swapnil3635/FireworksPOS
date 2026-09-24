"use client";

import { PageHeader } from "@/components/pos-ui";
import { BackupPanel, UsersPanel } from "@/components/BackupPanel";
import { usePosStore } from "@/lib/store";
import { SHEET_TABS } from "@/lib/sheets-schema";

export default function SettingsPage() {
  const settings = usePosStore((s) => s.settings);
  const saveSettings = usePosStore((s) => s.saveSettings);

  const field = "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60";

  return (
    <div>
      <PageHeader title="Settings" sub="Business, GST, backup, users, Sheets." />
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold">🧾 Business & GST invoice</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input value={settings.businessName} onChange={(e) => saveSettings({ businessName: e.target.value })} placeholder="Business name" className={field} />
          <input value={settings.gstin} onChange={(e) => saveSettings({ gstin: e.target.value })} placeholder="GSTIN" className={field} />
          <input value={settings.address} onChange={(e) => saveSettings({ address: e.target.value })} placeholder="Address" className={field} />
          <input value={settings.phone} onChange={(e) => saveSettings({ phone: e.target.value })} placeholder="Phone" className={field} />
          <input value={settings.upiId} onChange={(e) => saveSettings({ upiId: e.target.value })} placeholder="UPI ID for collection" className={field} />
          <input value={settings.billPrefix} onChange={(e) => saveSettings({ billPrefix: e.target.value })} placeholder="Bill prefix (SFX-)" className={field} />
          <label className="text-xs text-zinc-400">GST % (fireworks HSN 3604 default 18)
            <input type="number" value={settings.gstRate} onChange={(e) => saveSettings({ gstRate: Number(e.target.value) })} className={`${field} mt-1`} /></label>
          <label className="text-xs text-zinc-400">GST mode
            <select value={settings.gstMode} onChange={(e) => saveSettings({ gstMode: e.target.value as typeof settings.gstMode })} className={`${field} mt-1`}>
              <option value="CGST_SGST">CGST + SGST (in-state)</option>
              <option value="IGST">IGST (inter-state)</option>
            </select></label>
        </div>
      </div>

      <div className="mt-3"><BackupPanel /></div>
      <UsersPanel />

      <div className="glass-card mt-3 rounded-2xl p-5 text-sm text-zinc-400">
        <h3 className="font-bold text-zinc-100">📊 Sheets tabs</h3>
        <p className="mt-1">{SHEET_TABS.join(" · ")}</p>
      </div>
    </div>
  );
}
