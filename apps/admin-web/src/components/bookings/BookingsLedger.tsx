import { useState } from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { Search } from 'lucide-react';

export const BookingsLedger = () => {
  const { bookings, openRefundModal } = useVenueStore();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (
      searchTerm &&
      !b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !b.customerPhone.includes(searchTerm) &&
      !b.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (b: any) => {
    switch (b.status) {
      case 'IN_PROGRESS':
        return <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>● IN PROGRESS</span>;
      case 'COMPLETED':
        return <span style={{ color: 'var(--text-muted)' }}>COMPLETED</span>;
      case 'HELD':
        return <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>● HELD (PAYMENT)</span>;
      case 'CANCELLED':
        return (
          <div>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>● CANCELLED</span>
            {b.refundPaise ? (
              <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>
                Refund: ₹{b.refundPaise / 100}
              </div>
            ) : null}
          </div>
        );
      default:
        return <span>{b.status}</span>;
    }
  };

  const getPaymentBadge = (mode: string) => {
    switch (mode) {
      case 'RAZORPAY_ONLINE':
        return <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>RAZORPAY ONLINE</span>;
      case 'COUNTER_UPI':
        return <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>COUNTER UPI QR</span>;
      case 'COUNTER_CASH':
        return <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>COUNTER CASH</span>;
      default:
        return <span>{mode}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Today's Bookings Ledger</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Unified records of mobile app bookings, walk-ins, and counter payments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              type="text"
              placeholder="Search phone, name, or #BK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px 8px 36px',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['ALL', 'IN_PROGRESS', 'COMPLETED', 'HELD', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: statusFilter === status ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: statusFilter === status ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: statusFilter === status ? '#818cf8' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-dim)',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
            }}
          >
            <th style={{ padding: '12px 16px' }}>Booking ID</th>
            <th style={{ padding: '12px 16px' }}>Customer</th>
            <th style={{ padding: '12px 16px' }}>Resource</th>
            <th style={{ padding: '12px 16px' }}>Time Window</th>
            <th style={{ padding: '12px 16px' }}>Amount</th>
            <th style={{ padding: '12px 16px' }}>Payment Mode</th>
            <th style={{ padding: '12px 16px' }}>Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((b) => (
            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>#{b.id}</td>
              <td style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 600 }}>{b.customerName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{b.customerPhone}</div>
              </td>
              <td style={{ padding: '14px 16px' }}>{b.resourceName}</td>
              <td style={{ padding: '14px 16px' }}>{b.timeWindow}</td>
              <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                {b.amountPaise > 0 ? `₹${(b.amountPaise / 100).toLocaleString('en-IN')}` : 'Live Meter'}
              </td>
              <td style={{ padding: '14px 16px' }}>{getPaymentBadge(b.paymentMode)}</td>
              <td style={{ padding: '14px 16px' }}>{getStatusBadge(b)}</td>
              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' ? (
                  <button
                    onClick={() => openRefundModal(b)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Cancel & Refund
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
