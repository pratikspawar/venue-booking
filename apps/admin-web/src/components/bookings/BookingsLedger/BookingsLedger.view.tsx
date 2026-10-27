import React from 'react';
import { Search, Calendar, History, UserX } from 'lucide-react';
import { BookingsLedgerController } from './BookingsLedger.controller';
import { ActivityAuditLog } from '../ActivityAuditLog';
import './BookingsLedger.css';

export interface BookingsLedgerViewProps {
  controller: BookingsLedgerController;
}

const getStatusBadge = (b: any) => {
  switch (b.status) {
    case 'CONFIRMED':
      return <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>● CONFIRMED</span>;
    case 'IN_PROGRESS':
      return <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>● IN PROGRESS</span>;
    case 'COMPLETED':
      return <span style={{ color: 'var(--text-muted)' }}>COMPLETED</span>;
    case 'HELD':
      return <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>● HELD (PAYMENT)</span>;
    case 'NO_SHOW':
      return <span style={{ color: '#f59e0b', fontWeight: 600 }}>● NO-SHOW</span>;
    case 'EXPIRED':
      return <span style={{ color: 'var(--text-dim)' }}>EXPIRED</span>;
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

export const BookingsLedgerView: React.FC<BookingsLedgerViewProps> = ({ controller }) => {
  const {
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredBookings,
    openRefundModal,
    markBookingNoShow,
  } = controller;

  return (
    <div className="glass-panel bookings-ledger-container">
      {/* View Switch: Ledger vs Audit Trail */}
      <div className="bookings-ledger-mode-tabs">
        <button
          type="button"
          onClick={() => setViewMode('LEDGER')}
          className="bookings-ledger-tab-btn"
          style={{
            border: viewMode === 'LEDGER' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            background: viewMode === 'LEDGER' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: viewMode === 'LEDGER' ? '#818cf8' : 'var(--text-muted)',
          }}
        >
          <Calendar size={16} />
          <span>Bookings & Payments Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('AUDIT_LOGS')}
          className="bookings-ledger-tab-btn"
          style={{
            border: viewMode === 'AUDIT_LOGS' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            background: viewMode === 'AUDIT_LOGS' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: viewMode === 'AUDIT_LOGS' ? '#818cf8' : 'var(--text-muted)',
          }}
        >
          <History size={16} />
          <span>Customer & Staff History Log</span>
        </button>
      </div>

      {viewMode === 'AUDIT_LOGS' ? (
        <ActivityAuditLog />
      ) : (
        <>
          <div className="bookings-ledger-header-row">
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
                  className="bookings-ledger-search-box"
                />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bookings-ledger-filters-row">
            {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'HELD', 'NO_SHOW', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="bookings-ledger-filter-pill"
                style={{
                  border: statusFilter === status ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: statusFilter === status ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: statusFilter === status ? '#818cf8' : 'var(--text-muted)',
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <table className="bookings-ledger-table">
            <thead>
              <tr>
                <th className="bookings-ledger-th">Booking ID</th>
                <th className="bookings-ledger-th">Customer</th>
                <th className="bookings-ledger-th">Resource</th>
                <th className="bookings-ledger-th">Time Window</th>
                <th className="bookings-ledger-th">Amount</th>
                <th className="bookings-ledger-th">Payment Mode</th>
                <th className="bookings-ledger-th">Status</th>
                <th className="bookings-ledger-th" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id} className="bookings-ledger-td">
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {(b.status === 'CONFIRMED' || b.status === 'HELD') && (
                        <button
                          type="button"
                          onClick={() => markBookingNoShow(b.id)}
                          title="Release slot reservation because customer did not arrive"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#fbbf24',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <UserX size={13} />
                          No-Show
                        </button>
                      )}
                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'NO_SHOW' ? (
                        <button
                          type="button"
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
                      ) : b.status === 'NO_SHOW' ? (
                        <span style={{ color: '#fbbf24', fontSize: '0.76rem', fontWeight: 600 }}>Slots Freed</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};
