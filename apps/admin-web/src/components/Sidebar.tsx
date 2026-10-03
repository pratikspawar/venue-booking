import { Gamepad2, Calendar, Timer, TrendingUp, ShieldCheck } from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';

export const Sidebar = () => {
  const { activeTab, setActiveTab, resources, tenant } = useVenueStore();
  const activeSessionsCount = resources.filter((r) => r.status === 'IN_PROGRESS').length;

  return (
    <aside
      style={{
        width: '260px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div>
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Gamepad2 size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Venue<span style={{ color: 'var(--accent-primary)' }}>Ops</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Multi-Tenant Desk
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('desk')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'desk' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'desk' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'desk' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Timer size={18} />
            <span>Live Desk & Timers</span>
            {activeSessionsCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                }}
              >
                {activeSessionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'resources' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'resources' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'resources' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Gamepad2 size={18} />
            <span>Venues & Resources</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'bookings' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'bookings' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'bookings' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Calendar size={18} />
            <span>Bookings Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'reports' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'reports' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'reports' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
          >
            <TrendingUp size={18} />
            <span>Revenue Reports</span>
          </button>
        </nav>
      </div>

      {/* Tenant & Operator Badge */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>
          <ShieldCheck size={14} />
          <span>Microservices Cloud Active</span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {tenant.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {tenant.staffName}
        </div>
      </div>
    </aside>
  );
};
