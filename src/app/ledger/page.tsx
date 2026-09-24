import LedgerList from "@/components/LedgerList";
import { PageHeader } from "@/components/pos-ui";
export default function LedgerPage() {
  return (<div><PageHeader title="Ledger" sub="Money in / out grouped by day, wallet balances." /><LedgerList /></div>);
}
