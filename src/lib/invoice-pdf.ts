"use client";

// Generates the GST Tax Invoice PDF fully client-side (works offline).
// Heavy renderer is dynamically imported so it never blocks first load.
import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type { InvoiceInput } from "@/components/InvoiceDoc";

function safe(s: string) {
  return s.trim().replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "bill";
}

export async function downloadInvoicePdf(input: InvoiceInput): Promise<void> {
  const [{ pdf }, { default: InvoiceDoc }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/InvoiceDoc"),
  ]);
  const doc = createElement(InvoiceDoc, input) as unknown as ReactElement<DocumentProps>;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice_${safe(input.billNo)}_${safe(input.ev.client)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
