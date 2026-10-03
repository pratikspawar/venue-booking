import { Plus } from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';

export const Header = () => {
  const { activeTab, resources, calculateCurrentBill, openWalkinModal } = useVenueStore();

  const totalShiftRevenue = resources.reduce((acc, r) => acc + calculateCurrentBill(r), 18450);

  const getTitleAndSubtitle = () => {
    switch (activeTab) {
      case 'desk':
        return {
          title: 'Live Desk Operations',
          sub: 'Real-time table/console session timers, walk-ins, and bill settlement.',
        };
      case 'resources':
        return {
          title: 'Resource Catalog',
          sub: 'Lounges, PlayStation 5 consoles, pool tables, turf courts, and pricing rules.',
        };
      case 'bookings':
        return {
          title: 'Bookings Ledger',
          sub: 'Synchronized transaction records for mobile app holds, confirmations, and walk-ins.',
        };
      case 'reports':
        return {
          title: 'Revenue & Operations Reports',
          sub: 'Audited financial breakdown, utilization rates, and sport category trends.',
        };
      default:
        return {
          title: 'Desk Operations',
          sub: 'Multi-tenant venue management dashboard.',
        };
    }
  };

  const { title, sub } = getTitleAndSubtitle();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{title}</h1>
          <span className="badge-live">Live Sync</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', marginBottom: 0 }}>
          {sub}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Shift Cash Balance Box */}
        <div className="glass-panel" style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Shift Collection
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              ₹{totalShiftRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Cash: ₹5,800<br />
            UPI: ₹12,650
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => openWalkinModal()}>
          <Plus size={18} />
          <span>New Walk-in</span>
        </button>
      </div>
    </header>
  );
};
