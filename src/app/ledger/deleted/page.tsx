import LedgerList from "@/components/LedgerList";
import { PageHeader } from "@/components/pos-ui";
export default function DeletedLedgerPage() {
  return (<div><PageHeader title="Deleted Transactions" sub="Restore from recycle bin." /><LedgerList showDeleted /></div>);
}
