// INR + GST helpers. Single place so every bill/ledger line formats identically.

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export type GstMode = "CGST_SGST" | "IGST";

export type GstBreakup = {
  taxable: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  roundedTotal: number;
  roundOff: number;
};

// Fireworks HSN 3604 default 18%. Rate is configurable per settings/bill.
export function gstBreakup(
  taxable: number,
  gstRate = 18,
  mode: GstMode = "CGST_SGST",
  roundOff = true
): GstBreakup {
  const gstAmt = (taxable * gstRate) / 100;
  const cgst = mode === "CGST_SGST" ? gstAmt / 2 : 0;
  const sgst = mode === "CGST_SGST" ? gstAmt / 2 : 0;
  const igst = mode === "IGST" ? gstAmt : 0;
  const total = taxable + gstAmt;
  const roundedTotal = roundOff ? Math.round(total) : Math.round(total * 100) / 100;
  return {
    taxable: Math.round(taxable * 100) / 100,
    gstRate,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    total: Math.round(total * 100) / 100,
    roundedTotal,
    roundOff: Math.round((roundedTotal - total) * 100) / 100,
  };
}

export function billKey(client: string, venue: string, dates: string[]) {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_");
  return `bill_${norm(client)}_${norm(venue)}_${dates.join("_")}`;
}
