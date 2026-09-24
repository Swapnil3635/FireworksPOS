import InventoryManager from "@/components/InventoryManager";
import { PageHeader } from "@/components/pos-ui";
export default function InventoryPage() {
  return (<div><PageHeader title="Inventory Master" sub="Stock + consumables + rates linked." /><InventoryManager /></div>);
}
