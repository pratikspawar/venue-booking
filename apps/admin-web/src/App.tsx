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
import { EarningsDashboard } from './components/earnings/EarningsDashboard';
import { AddSportModal } from './components/sports/AddSportModal';
import { AddResourceModal } from './components/resources/AddResourceModal';
import { RefundPolicyModal } from './components/bookings/RefundPolicyModal';
import { AddCanteenItemModal } from './components/desk/AddCanteenItemModal';
import { ShiftSummaryModal } from './components/desk/ShiftSummaryModal';
import { PaymentGatewaySettingsModal } from './components/PaymentGatewaySettingsModal';
import { SlotTimelineMatrix } from './components/timeline/SlotTimelineMatrix';
import { ExtendSessionModal } from './components/desk/ExtendSessionModal';
import { SwapResourceModal } from './components/desk/SwapResourceModal';
import { QrScannerModal } from './components/desk/QrScannerModal';
import { StaffManagement } from './components/staff/StaffManagement';
import { MembershipManagement } from './components/memberships/MembershipManagement';
import { PromotionManagement } from './components/promotions/PromotionManagement';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';

export default function App() {
  const { activeTab, tickTimer, isGatewaySettingsModalOpen, closeGatewaySettingsModal } = useVenueStore();

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

        {/* Tab 2: BookMyShow-style 24-Hour Slot Schedule Matrix */}
        {activeTab === 'timeline' && <SlotTimelineMatrix />}

        {/* Tab 3: Venues, Consoles & Table Catalog */}
        {activeTab === 'resources' && <ResourceCatalog />}

        {/* Tab 4: Unified Bookings & Payments Ledger & Audit Logs */}
        {activeTab === 'bookings' && <BookingsLedger />}

        {/* Tab 5: Earnings & Financial Intelligence */}
        {activeTab === 'earnings' && <EarningsDashboard />}

        {/* Tab 6: Operations & Peak Utilization Analytics */}
        {activeTab === 'reports' && <ReportsDashboard />}

        {/* Tab 7: Staff & Operator Team Management */}
        {activeTab === 'staff' && <StaffManagement />}

        {/* Tab 8: Membership Tiers & VIP Passes */}
        {activeTab === 'memberships' && <MembershipManagement />}

        {/* Tab 9: Promotional Coupons & Prepaid Hours Packages */}
        {activeTab === 'promotions' && <PromotionManagement />}

        {/* Tab 10: Platform Super-Admin Governance Dashboard */}
        {activeTab === 'superadmin' && <SuperAdminDashboard />}


        {/* Dynamic Modals managed by Zustand state */}
        <WalkinModal />
        <SettlementModal />
        <AddSportModal />
        <AddResourceModal />
        <RefundPolicyModal />
        <AddCanteenItemModal />
        <ShiftSummaryModal />
        <ExtendSessionModal />
        <SwapResourceModal />
        <QrScannerModal />
        <PaymentGatewaySettingsModal
          isOpen={isGatewaySettingsModalOpen}
          onClose={closeGatewaySettingsModal}
        />
      </main>
    </div>
  );
}
