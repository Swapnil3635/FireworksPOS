import BillingBoard from "@/components/BillingBoard";
import { PageHeader } from "@/components/pos-ui";
export default function BillingPage() {
  return (<div><PageHeader title="Billing · INR + GST" sub="Tabs, payments, adjustments, GST invoice + 80mm slip." /><BillingBoard /></div>);
}
