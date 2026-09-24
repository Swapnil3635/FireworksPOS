// Tax Invoice PDF — Indian GST standard (offline-capable, @react-pdf/renderer).
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SfxEvent, Payment, Adjustment } from "@/lib/types";
import type { BillFin, Settings } from "@/lib/store";
import { amountInWords } from "@/lib/amount-words";

const ink = "#1c1917";
const muted = "#78716c";
const ember = "#9a3412";
const gold = "#b45309";
const line = "#e7e5e4";
const shade = "#faf5ec";

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", fontSize: 9, color: ink, lineHeight: 1.45 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bizName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ember },
  bizSub: { fontSize: 8.5, color: muted, marginTop: 2, maxWidth: 300 },
  invBox: { borderWidth: 1.5, borderColor: ember, borderRadius: 6, padding: 8, minWidth: 170 },
  invTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: ember, letterSpacing: 1 },
  meta: { fontSize: 8.5, marginTop: 2 },
  rule: { height: 2, backgroundColor: ember, marginVertical: 10, borderRadius: 2 },
  hairline: { height: 1, backgroundColor: line, marginVertical: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  col: { flex: 1 },
  label: { fontSize: 7.5, color: muted, letterSpacing: 0.6 },
  value: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  plain: { fontSize: 9 },
  tableHead: { flexDirection: "row", backgroundColor: ember, color: "#fff", borderRadius: 4, padding: 6, marginTop: 6 },
  tableRow: { flexDirection: "row", padding: 6, borderBottomWidth: 1, borderBottomColor: line },
  cNo: { width: 28 },
  cItem: { flex: 1 },
  cQty: { width: 44, textAlign: "right" },
  cRate: { width: 70, textAlign: "right" },
  cAmt: { width: 80, textAlign: "right" },
  head: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  totals: { marginTop: 8, flexDirection: "row", justifyContent: "flex-end" },
  totalsBox: { width: 230 },
  tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: { flexDirection: "row", justifyContent: "space-between", backgroundColor: shade, borderWidth: 1, borderColor: gold, borderRadius: 4, padding: 6, marginTop: 4 },
  grandText: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: ember },
  words: { backgroundColor: shade, borderRadius: 4, padding: 6, marginTop: 8, fontSize: 8.5 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: ember, marginTop: 10, marginBottom: 4, letterSpacing: 0.5 },
  payRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, fontSize: 8.5 },
  due: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#b91c1c" },
  footer: { marginTop: 14, borderTopWidth: 1, borderTopColor: line, paddingTop: 6 },
  signRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 26 },
  signBox: { textAlign: "right", fontSize: 8.5 },
  terms: { fontSize: 7.5, color: muted, marginTop: 2 },
  pageNo: { position: "absolute", bottom: 20, left: 36, right: 36, textAlign: "center", fontSize: 7, color: muted },
});

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const dt = (d: string) => {
  const dObj = new Date(d.length <= 10 ? d + "T00:00:00" : d);
  return isNaN(dObj.getTime()) ? d : dObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export type InvoiceInput = {
  ev: SfxEvent;
  billNo: string;
  settings: Settings;
  payments: Payment[];
  adjustments: Adjustment[];
  fin: BillFin;
};

export default function InvoiceDoc({ ev, billNo, settings, payments, adjustments, fin }: InvoiceInput) {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const gstLabel = settings.gstMode === "CGST_SGST" ? `CGST + SGST @ ${fin.gst.gstRate}%` : `IGST @ ${fin.gst.gstRate}%`;
  const bizLine = [settings.address, settings.phone ? `Ph: ${settings.phone}` : ""].filter(Boolean).join("  |  ");

  return (
    <Document title={`Tax Invoice ${billNo}`}>
      <Page size="A4" style={s.page}>
        <View style={s.top}>
          <View>
            <Text style={s.bizName}>{settings.businessName || "Shreyas SFX"}</Text>
            {bizLine ? <Text style={s.bizSub}>{bizLine}</Text> : null}
            {settings.gstin ? <Text style={s.bizSub}>GSTIN: {settings.gstin}</Text> : null}
            <Text style={s.bizSub}>Fireworks & special-effects services · HSN 3604</Text>
          </View>
          <View style={s.invBox}>
            <Text style={s.invTitle}>TAX INVOICE</Text>
            <Text style={s.meta}>No: {billNo}</Text>
            <Text style={s.meta}>Date: {today}</Text>
            <Text style={s.meta}>{gstLabel}</Text>
          </View>
        </View>

        <View style={s.rule} />

        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.label}>BILLED TO</Text>
            <Text style={s.value}>{ev.client}</Text>
            <Text style={s.plain}>Venue: {ev.venue}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.label}>EVENT</Text>
            <Text style={s.value}>{ev.eventType}</Text>
            <Text style={s.plain}>{ev.dates.map(dt).join(", ")}</Text>
            {ev.subEvents.length > 0 ? (
              <Text style={s.plain}>{ev.subEvents.map((x) => x.name).join(" · ")}</Text>
            ) : null}
          </View>
        </View>

        <View style={s.tableHead}>
          <Text style={[s.cNo, s.head]}>#</Text>
          <Text style={[s.cItem, s.head]}>Description (HSN 3604)</Text>
          <Text style={[s.cQty, s.head]}>Qty</Text>
          <Text style={[s.cRate, s.head]}>Rate</Text>
          <Text style={[s.cAmt, s.head]}>Amount</Text>
        </View>
        {ev.selected.map((r, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.cNo}>{i + 1}</Text>
            <Text style={s.cItem}>{r.equip}</Text>
            <Text style={s.cQty}>{r.qty}</Text>
            <Text style={s.cRate}>{fmt(r.rate)}</Text>
            <Text style={s.cAmt}>{fmt(r.qty * r.rate)}</Text>
          </View>
        ))}
        {adjustments.map((a, i) => (
          <View key={`a${i}`} style={s.tableRow}>
            <Text style={s.cNo}>*</Text>
            <Text style={s.cItem}>{a.type} — {a.reason}</Text>
            <Text style={s.cQty}>—</Text>
            <Text style={s.cRate}>—</Text>
            <Text style={s.cAmt}>{a.amount < 0 ? `(−) ` : ""}{fmt(Math.abs(a.amount))}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalsBox}>
            <View style={s.tRow}><Text>Taxable Value</Text><Text>{fmt(fin.taxable)}</Text></View>
            {settings.gstMode === "CGST_SGST" ? (
              <>
                <View style={s.tRow}><Text>CGST @ {fin.gst.gstRate / 2}%</Text><Text>{fmt(fin.gst.cgst)}</Text></View>
                <View style={s.tRow}><Text>SGST @ {fin.gst.gstRate / 2}%</Text><Text>{fmt(fin.gst.sgst)}</Text></View>
              </>
            ) : (
              <View style={s.tRow}><Text>IGST @ {fin.gst.gstRate}%</Text><Text>{fmt(fin.gst.igst)}</Text></View>
            )}
            {fin.gst.roundOff !== 0 ? (
              <View style={s.tRow}><Text>Round Off</Text><Text>{fmt(fin.gst.roundOff)}</Text></View>
            ) : null}
            <View style={s.grand}>
              <Text style={s.grandText}>Grand Total</Text>
              <Text style={s.grandText}>{fmt(fin.gst.roundedTotal)}</Text>
            </View>
          </View>
        </View>

        <Text style={s.words}>{amountInWords(fin.gst.roundedTotal)}</Text>

        <Text style={s.sectionTitle}>HSN TAX SUMMARY</Text>
        <View style={s.tableHead}>
          <Text style={[s.cItem, s.head]}>HSN</Text>
          <Text style={[s.cAmt, s.head]}>Taxable</Text>
          <Text style={[s.cAmt, s.head]}>Rate</Text>
          <Text style={[s.cAmt, s.head]}>Tax Amt</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.cItem}>3604 — Fireworks & pyro articles</Text>
          <Text style={s.cAmt}>{fmt(fin.taxable)}</Text>
          <Text style={s.cAmt}>{fin.gst.gstRate}%</Text>
          <Text style={s.cAmt}>{fmt(fin.gst.cgst + fin.gst.sgst + fin.gst.igst)}</Text>
        </View>

        <Text style={s.sectionTitle}>PAYMENTS</Text>
        {payments.length === 0 ? <Text style={s.plain}>No payments recorded yet.</Text> : null}
        {payments.map((p) => (
          <View key={p.id} style={s.payRow}>
            <Text>{dt(p.date)} · {p.mode} → {p.receivedAccount}</Text>
            <Text>{fmt(p.amount)}</Text>
          </View>
        ))}
        <View style={[s.payRow, { marginTop: 4 }]}>
          <Text style={s.value}>Balance Due</Text>
          <Text style={s.due}>{fmt(fin.pending)}</Text>
        </View>
        {settings.upiId ? <Text style={[s.plain, { marginTop: 4 }]}>Pay via UPI: {settings.upiId}</Text> : null}

        <View style={s.footer}>
          <Text style={s.label}>TERMS</Text>
          <Text style={s.terms}>1. Goods once sold for display use are non-returnable. 2. Follow PESO safety norms; licensed operators only. 3. Balance payable before show day. 4. E. & O.E.</Text>
          <View style={s.signRow}>
            <View>
              <Text style={s.label}>CUSTOMER SIGNATURE</Text>
              <Text style={s.terms}>______________________</Text>
            </View>
            <View style={s.signBox}>
              <Text>For {settings.businessName || "Shreyas SFX"}</Text>
              <Text style={[s.terms, { marginTop: 22 }]}>Authorised Signatory</Text>
            </View>
          </View>
          <Text style={[s.terms, { marginTop: 10, textAlign: "center" }]}>
            Computer-generated invoice · {settings.businessName || "Shreyas SFX"}{settings.gstin ? ` · GSTIN ${settings.gstin}` : ""}
          </Text>
        </View>

        <Text style={s.pageNo} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
