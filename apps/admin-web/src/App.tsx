import { useEffect } from 'react';
import { useVenueStore } from './store/useVenueStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LiveDesk } from './components/desk/LiveDesk';
import { WalkinModal } from './components/desk/WalkinModal';
import { SettlementModal } from './components/desk/SettlementModal';
import { ResourceCatalog } from './components/resources/ResourceCatalog';
import { BookingsLedger } from './components/bookings/BookingsLedger';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { AddSportModal } from './components/sports/AddSportModal';
import { AddResourceModal } from './components/resources/AddResourceModal';
import { RefundPolicyModal } from './components/bookings/RefundPolicyModal';
import { AddCanteenItemModal } from './components/desk/AddCanteenItemModal';
import { ShiftSummaryModal } from './components/desk/ShiftSummaryModal';

export default function App() {
  const { activeTab, tickTimer } = useVenueStore();

  // 1-second interval driving live play session timers across the application
  useEffect(() => {
    const timer = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTimer]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* 1. Modular Sidebar with navigation & tenant context */}
      <Sidebar />

      {/* 2. Main Work Area */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {/* Top Header with live stats and walk-in dispatch */}
        <Header />

        {/* Tab 1: Live Desk Operations & Real-time Session Timers */}
        {activeTab === 'desk' && <LiveDesk />}

        {/* Tab 2: Venues, Consoles & Table Catalog */}
        {activeTab === 'resources' && <ResourceCatalog />}

        {/* Tab 3: Unified Bookings & Payments Ledger */}
        {activeTab === 'bookings' && <BookingsLedger />}

        {/* Tab 4: Revenue & Utilization Analytics */}
        {activeTab === 'reports' && <ReportsDashboard />}

        {/* Dynamic Modals managed by Zustand state */}
        <WalkinModal />
        <SettlementModal />
        <AddSportModal />
        <AddResourceModal />
        <RefundPolicyModal />
        <AddCanteenItemModal />
        <ShiftSummaryModal />
      </main>
    </div>
  );
}
