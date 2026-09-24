export type PosRoute = {
  href: string;
  label: string;
  icon: string;
  legacyId: string;
  blurb: string;
};

// Mirrors the 15 screens in Masterrrrrrrrr.html sidebar + pages.
export const POS_NAV: PosRoute[] = [
  { href: "/", label: "Home", icon: "🏠", legacyId: "homePage", blurb: "Event planner + dashboard" },
  { href: "/events", label: "View Events", icon: "📋", legacyId: "eventsPage", blurb: "Upcoming / Completed / All" },
  { href: "/calendar", label: "Booking Calendar", icon: "📅", legacyId: "bookingCalendarPage", blurb: "Month grid + day agenda" },
  { href: "/reservations", label: "Reservations", icon: "📊", legacyId: "reservationDashboardPage", blurb: "Inventory allocation conflicts" },
  { href: "/inventory", label: "Inventory Master", icon: "📦", legacyId: "inventoryMasterPage", blurb: "Stock + consumables" },
  { href: "/rates", label: "Rate Chart", icon: "💰", legacyId: "rateChartPage", blurb: "Per-item rates" },
  { href: "/billing", label: "Billing", icon: "🧾", legacyId: "billingPage", blurb: "INR + GST invoices" },
  { href: "/ledger", label: "Ledger", icon: "📒", legacyId: "ledgerPage", blurb: "Money in / out" },
  { href: "/vendors", label: "Vendor Master", icon: "🏢", legacyId: "vendorMasterPage", blurb: "Vendors + purchase items" },
  { href: "/expenses", label: "Add Expenses", icon: "➕", legacyId: "addExpensesPage", blurb: "Event / Business / Owner" },
  { href: "/expenses/history", label: "Expenses History", icon: "📜", legacyId: "expensesHistoryPage", blurb: "Cash-flow history" },
  { href: "/reports", label: "Reports", icon: "📈", legacyId: "reportsDashboardPage", blurb: "9-card drilldowns" },
  { href: "/settings", label: "Settings", icon: "⚙️", legacyId: "settingsPage", blurb: "Users, Drive, backup" },
  { href: "/wallet", label: "Wallet", icon: "👛", legacyId: "accountSummaryPage", blurb: "Cash / Axis / SBI / Janata" },
];

export const VIEWER_SAFE_ROUTES = ["/events", "/calendar", "/reservations"];
