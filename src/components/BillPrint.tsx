import type { SfxEvent, Payment, Adjustment } from "@/lib/types";
import type { BillFin, Settings } from "@/lib/store";
import { inr } from "@/lib/money";

function lineItems(ev: SfxEvent) {
  return ev.selected.map((r) => ({ ...r, amt: r.qty * r.rate }));
}

export function printBill(
  ev: SfxEvent, f: BillFin, billNo: string,
  s: Settings, pays: Payment[], adjs: Adjustment[],
  kind: "a4" | "thermal"
) {
  const rows = lineItems(ev).map((r) =>
    `<tr><td>${r.equip}</td><td style="text-align:right">${r.qty}</td><td style="text-align:right">₹${r.rate.toLocaleString("en-IN")}</td><td style="text-align:right">₹${r.amt.toLocaleString("en-IN")}</td></tr>`
  ).join("");
  const adjRows = adjs.map((a) =>
    `<tr><td>${a.type} — ${a.reason}</td><td></td><td></td><td style="text-align:right">₹${a.amount.toLocaleString("en-IN")}</td></tr>`
  ).join("");
  const width = kind === "thermal" ? "280px" : "720px";
  const fontSize = kind === "thermal" ? "11px" : "13px";
  const gstTotal = f.gst.cgst + f.gst.sgst + f.gst.igst;
  const gstSplit = s.gstMode === "CGST_SGST"
    ? " (CGST \u20B9" + f.gst.cgst.toLocaleString("en-IN") + " + SGST \u20B9" + f.gst.sgst.toLocaleString("en-IN") + ")"
    : " (IGST \u20B9" + f.gst.igst.toLocaleString("en-IN") + ")";
  const payLine = pays.map((p) => p.date + " " + p.mode + " \u20B9" + p.amount).join(" \u00B7 ") || "\u2014";
  const upiLine = s.upiId ? "<p>Pay via UPI: <b>" + s.upiId + "</b></p>" : "";
  const contactLine = [s.address, s.phone, s.gstin ? "GSTIN " + s.gstin : ""].filter(Boolean).join(" \u00B7 ");
  const html = [
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + billNo + "</title>",
    "<style>body{font-family:Arial,sans-serif;color:#111;margin:0;padding:16px}",
    "table{width:100%;border-collapse:collapse;font-size:" + fontSize + "}",
    "th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}th{background:#f4f4f4}",
    ".wrap{max-width:" + width + ";margin:0 auto}.tot{text-align:right;font-weight:bold}",
    ".mut{color:#555;font-size:11px}@media print{button{display:none}}</style></head>",
    '<body><div class="wrap">',
    '<button onclick="window.print()" style="margin-bottom:12px;padding:8px 16px">Print</button>',
    "<h2 style=\"margin:0\">" + (s.businessName || "Shreyas SFX") + "</h2>",
    '<p class="mut">' + contactLine + "</p>",
    "<h3 style=\"margin:8px 0\">Tax Invoice \u00B7 " + billNo + "</h3>",
    "<p>Client: <b>" + ev.client + "</b><br>Venue: " + ev.venue + "<br>Dates: " + ev.dates.join(", ") + " \u00B7 " + ev.eventType + "</p>",
    '<table><thead><tr><th>Item (HSN 3604)</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>',
    "<tbody>" + rows + adjRows + "</tbody></table>",
    '<p class="tot">Taxable: \u20B9' + f.taxable.toLocaleString("en-IN") + "<br>",
    "GST " + f.gst.gstRate + "%: \u20B9" + gstTotal.toLocaleString("en-IN") + gstSplit + "<br>",
    "Payable: \u20B9" + f.gst.roundedTotal.toLocaleString("en-IN") + "<br>",
    "Paid: \u20B9" + f.paid.toLocaleString("en-IN") + " \u00B7 Balance: \u20B9" + f.pending.toLocaleString("en-IN") + "</p>",
    '<p class="mut">Payments: ' + payLine + "</p>",
    upiLine,
    '<p class="mut">E&amp;OE \u00B7 Goods once sold for display use are non-returnable. Follow PESO safety norms.</p>',
    "</div></body></html>",
  ].join("\n");
  const w = window.open("", "_blank", "width=820,height=900");
  if (w) { w.document.write(html); w.document.close(); }
}

export function BillPreviewNote() {
  return (
    <p className="text-xs text-zinc-500">
      Bills print as A4 GST invoice or 80mm thermal slip via {inr(0).slice(0, 1)} INR formatting.
    </p>
  );
}
